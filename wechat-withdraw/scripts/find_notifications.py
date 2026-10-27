#!/usr/bin/env python3
"""Read complete WeChat notification plists from local SQLite/WAL bytes."""

import argparse
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import plistlib
import re
import sys
from zoneinfo import ZoneInfo


UTC = dt.timezone.utc
APPLE_EPOCH = dt.datetime(2001, 1, 1, tzinfo=UTC)
TRAILER = re.compile(rb"\x00{6}[\x01\x02\x04\x08][\x01\x02\x04\x08]")
MAX_PLIST = 65536


def parse_time(text, timezone, end=False):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}"
                        r"(?::\d{2}(?:[.,]\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})?", text):
        raise ValueError("时间必须包含 YYYY-MM-DD 和 HH:MM，可带秒、小数和 UTC 偏移")
    value = dt.datetime.fromisoformat(text.replace("Z", "+00:00"))
    if value.tzinfo is None:
        candidates = {}
        for fold in (0, 1):
            local = value.replace(tzinfo=timezone, fold=fold)
            utc = local.astimezone(UTC)
            if utc.astimezone(timezone).replace(tzinfo=None) == value:
                candidates[utc] = local
        if len(candidates) != 1:
            raise ValueError("当地时间不存在或存在夏令时歧义，请提供带 UTC 偏移的时间")
        value = next(iter(candidates.values()))
    value = value.astimezone(UTC)
    if end:
        clock = re.split(r"[T ]", text, maxsplit=1)[1]
        if re.match(r"^\d{2}:\d{2}(?:Z|[+-]|$)", clock):
            value += dt.timedelta(seconds=59, microseconds=999999)
        elif "." not in clock and "," not in clock:
            value += dt.timedelta(microseconds=999999)
    return value


def plists_in(blob):
    # Derive the owning header from each trailer: the nearest preceding header
    # may instead belong to a nested NSKeyedArchiver plist.
    for match in TRAILER.finditer(blob):
        trailer_pos = match.start()
        raw = blob[trailer_pos:trailer_pos + 32]
        if len(raw) != 32:
            continue
        count = int.from_bytes(raw[8:16], "big")
        top = int.from_bytes(raw[16:24], "big")
        offset = int.from_bytes(raw[24:32], "big")
        start = trailer_pos - offset - count * raw[6]
        end = trailer_pos + 32
        if not (0 < count <= MAX_PLIST and top < count and offset >= 8
                and start >= 0 and end - start <= MAX_PLIST):
            continue
        if blob[start:start + 8] != b"bplist00":
            continue
        try:
            value = plistlib.loads(blob[start:end])
        except (plistlib.InvalidFileException, ValueError, TypeError,
                OverflowError, IndexError, KeyError, RecursionError):
            continue
        if isinstance(value, dict):
            yield start, end, value


def notification(obj, nickname, start, end, timezone):
    app = obj.get("app")
    req = obj.get("req")
    if (not isinstance(app, str) or app.casefold() != "com.tencent.xinwechat"
            or not isinstance(req, dict) or req.get("titl") != nickname
            or not isinstance(req.get("body"), str)):
        return None
    date = obj.get("date")
    try:
        if isinstance(date, dt.datetime):
            timestamp = date.replace(tzinfo=UTC) if date.tzinfo is None else date.astimezone(UTC)
        elif type(date) in (int, float) and math.isfinite(date):
            timestamp = APPLE_EPOCH + dt.timedelta(seconds=date)
        else:
            return None
    except (OverflowError, ValueError):
        return None
    if not start <= timestamp <= end:
        return None
    identifier = req.get("iden")
    if not isinstance(identifier, str):
        identifier = None
    return {"time": timestamp.astimezone(timezone).isoformat(),
            "title": nickname, "body": req["body"], "identifier": identifier}


def scan_file(path, nickname, start, end, timezone):
    before = path.stat()
    digest = hashlib.sha256()
    records = []
    seen = set()
    with path.open("rb") as source:
        header = source.read(32)
        valid_db = header.startswith(b"SQLite format 3\x00")
        valid_wal = len(header) == 32 and header[:4] in (b"7\x7f\x06\x82", b"7\x7f\x06\x83")
        if not (valid_db or valid_wal or not header):
            raise ValueError(f"源文件不是支持的 SQLite/WAL 格式：{path}")
        source.seek(0)
        tail = b""
        position = 0
        while True:
            chunk = source.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
            block = tail + chunk
            base = position - len(tail)
            for left, right, obj in plists_in(block):
                span = (base + left, base + right)
                if span in seen:
                    continue
                record = notification(obj, nickname, start, end, timezone)
                if record is not None:
                    seen.add(span)
                    record["evidence"] = {"path": str(path), "start": span[0], "end": span[1]}
                    records.append(record)
            position += len(chunk)
            tail = block[-MAX_PLIST:]
    after = path.stat()
    return {"path": str(path), "sha256": digest.hexdigest(), "bytes_read": position,
            "changed_during_read": (before.st_size, before.st_mtime_ns, before.st_ino)
            != (after.st_size, after.st_mtime_ns, after.st_ino)}, records


def collect(source_dir, nickname, start, end, timezone):
    sources, messages, errors = [], {}, []
    for name in ("db", "db-wal"):
        path = source_dir / name
        try:
            metadata, records = scan_file(path, nickname, start, end, timezone)
        except FileNotFoundError:
            errors.append({"path": str(path), "error": "文件不存在"})
            continue
        except (OSError, ValueError) as exc:
            errors.append({"path": str(path), "error": str(exc)})
            continue
        sources.append(metadata)
        for record in records:
            evidence = record.pop("evidence")
            # Keep conflicting previews rather than silently choosing one body.
            key = (record["identifier"], record["time"], record["body"])
            if key not in messages:
                messages[key] = {**record, "evidence": []}
            messages[key]["evidence"].append(evidence)
    return {"method": "macos_wechat_notification_residue", "nickname": nickname,
            "timezone": str(timezone), "start": start.astimezone(timezone).isoformat(),
            "end": end.astimezone(timezone).isoformat(), "sources": sources, "errors": errors,
            "messages": sorted(messages.values(), key=lambda r: dt.datetime.fromisoformat(r["time"])),
            "withdrawal_link_verified": False,
            "limitations": ["通知正文不等于已确认的撤回消息，时间是通知时间。",
                            "仅恢复连续完整且不超过 64 KiB 的 plist，可能遗漏碎片或已覆盖数据。",
                            "WAL 页面可能来自历史或未提交事务；未校验事务提交状态。",
                            "活跃源文件不是原子一致性快照；未命中不代表没有消息。"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--nickname", required=True)
    parser.add_argument("--start", required=True)
    parser.add_argument("--end", required=True)
    parser.add_argument("--timezone", required=True, help="IANA 时区，如 Asia/Shanghai")
    parser.add_argument("--source-dir", type=Path, default=Path.home() / "Library/Group Containers/group.com.apple.usernoted/db2")
    args = parser.parse_args()
    try:
        if not args.nickname.strip():
            raise ValueError("昵称不能为空")
        timezone = ZoneInfo(args.timezone)
        start = parse_time(args.start, timezone)
        end = parse_time(args.end, timezone, end=True)
        if start > end:
            raise ValueError("起始时间不能晚于结束时间")
        result = collect(args.source_dir.expanduser().resolve(), args.nickname, start, end, timezone)
    except (ValueError, KeyError) as exc:
        parser.error(str(exc))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["sources"] else 2


if __name__ == "__main__":
    sys.exit(main())
