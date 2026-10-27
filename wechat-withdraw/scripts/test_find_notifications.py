"""Synthetic, in-memory regression checks; no real chat data or file writes."""

import datetime as dt
import importlib.util
from pathlib import Path
import plistlib
import unittest
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location("finder", Path(__file__).with_name("find_notifications.py"))
finder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(finder)


class NotificationTests(unittest.TestCase):
    def setUp(self):
        self.zone = ZoneInfo("Asia/Shanghai")
        self.start = finder.parse_time("2026-10-26T17:08", self.zone)
        self.end = finder.parse_time("2026-10-26T17:08", self.zone, end=True)

    def obj(self, **overrides):
        date = (self.start - finder.APPLE_EPOCH).total_seconds() + 27.42
        obj = {"app": "com.tencent.xinWeChat", "date": date,
               "req": {"titl": "测试联系人甲", "body": "合成测试正文", "iden": "test_1",
                       "usda": plistlib.dumps({"inner": "nested"}, fmt=plistlib.FMT_BINARY)}}
        return {**obj, **overrides}

    def test_nested_plist_and_utf16_title(self):
        blob = plistlib.dumps(self.obj(), fmt=plistlib.FMT_BINARY)
        data = b"noise" + blob + b"tail"
        recovered = [(a, b, obj) for a, b, obj in finder.plists_in(data) if obj.get("app")]
        self.assertEqual(len(recovered), 1)
        left, right, obj = recovered[0]
        self.assertEqual(data[left:right], blob)
        record = finder.notification(obj, "测试联系人甲", self.start, self.end, self.zone)
        self.assertEqual(record["body"], "合成测试正文")
        self.assertIn("17:08:27.420000+08:00", record["time"])

    def test_truncated_and_corrupt_plists_are_ignored(self):
        blob = plistlib.dumps(self.obj(), fmt=plistlib.FMT_BINARY)
        self.assertFalse(any(obj.get("app") for _, _, obj in finder.plists_in(blob[:-15])))
        self.assertEqual(list(finder.plists_in(b"bplist00" + b"\0" * 500)), [])

    def test_exact_name_app_and_time_boundaries(self):
        for obj, name in [(self.obj(), "测试联系人"), (self.obj(app="other.app"), "测试联系人甲"),
                          (self.obj(date=float("nan")), "测试联系人甲"),
                          (self.obj(date=True), "测试联系人甲"),
                          (self.obj(date=10**1000), "测试联系人甲")]:
            self.assertIsNone(finder.notification(obj, name, self.start, self.end, self.zone))
        obj = self.obj(date=(self.end - finder.APPLE_EPOCH).total_seconds() + 1)
        self.assertIsNone(finder.notification(obj, "测试联系人甲", self.start, self.end, self.zone))

    def test_end_minute_and_second_include_fraction(self):
        self.assertEqual(self.end.astimezone(self.zone).strftime("%H:%M:%S.%f"), "17:08:59.999999")
        value = finder.parse_time("2026-10-26T17:08:44", self.zone, end=True)
        self.assertEqual(value.microsecond, 999999)

    def test_date_or_hour_only_inputs_are_rejected(self):
        for text in ["2026-10-26", "2026-10-26T17", "2026-10-26T17+08:00"]:
            with self.assertRaises(ValueError):
                finder.parse_time(text, self.zone, end=True)

    def test_dst_requires_unambiguous_offset(self):
        zone = ZoneInfo("America/Los_Angeles")
        for text in ["2026-11-01T01:30", "2026-03-08T02:30"]:
            with self.assertRaises(ValueError):
                finder.parse_time(text, zone)
        value = finder.parse_time("2026-11-01T01:30-07:00", zone)
        self.assertEqual(value, dt.datetime(2026, 11, 1, 8, 30, tzinfo=finder.UTC))


if __name__ == "__main__":
    unittest.main()
