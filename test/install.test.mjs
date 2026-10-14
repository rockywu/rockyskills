import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { main } from '../bin/rw-skills.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expected = {
  codex: ['.agents/skills', '.agents/skills'],
  claude: ['.claude/skills', '.claude/skills'],
  cursor: ['.cursor/skills', '.cursor/skills'],
  gemini: ['.gemini/skills', '.gemini/skills'],
  opencode: ['.opencode/skills', '.config/opencode/skills'],
  copilot: ['.github/skills', '.copilot/skills'],
};
function workspace(t) {
  const dir = mkdtempSync(join(tmpdir(), 'rw-skills-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const cwd = join(dir, 'project'); const home = join(dir, 'user');
  mkdirSync(cwd); mkdirSync(home);
  return { cwd, home };
}

for (const [agent, paths] of Object.entries(expected)) {
  for (const global of [false, true]) {
    test(`${agent}: ${global ? '用户' : '项目'}安装保持 Skill、引用文件和 MIT 许可`, t => {
      const { cwd, home } = workspace(t);
      main(['install', '--agent', agent, ...(global ? ['--global'] : [])], cwd, home);
      const dest = join(global ? home : cwd, paths[global ? 1 : 0], 'traceable-development');
      for (const rel of ['SKILL.md', 'references/templates.md', 'README.md']) {
	assert.deepEqual(readFileSync(join(dest, rel)), readFileSync(join(root, 'traceable-development', rel)));
      }
      assert.deepEqual(readFileSync(join(dest, 'LICENSE')), readFileSync(join(root, 'LICENSE')));
      assert.equal(existsSync(join(dest, '.DS_Store')), false);
      assert.equal(existsSync(join(global ? cwd : home, paths[global ? 0 : 1])), false);
    });
  }
}

test('已有 Skill 保持不变，冲突时其他 Agent 不发生部分安装', t => {
  const { cwd, home } = workspace(t);
  const existing = join(cwd, '.cursor/skills/traceable-development');
  mkdirSync(existing, { recursive: true });
  writeFileSync(join(existing, 'SKILL.md'), '用户的自定义内容');
  assert.throws(() => main(['install', '--agent', 'codex,cursor'], cwd, home), /已存在/);
  assert.equal(readFileSync(join(existing, 'SKILL.md'), 'utf8'), '用户的自定义内容');
  assert.equal(existsSync(join(cwd, '.agents')), false);
});

test('拒绝路径穿越、未知 Agent 和未知 Skill，且不写入', t => {
  const { cwd, home } = workspace(t);
  for (const args of [
    ['install'], ['install', '--agent', 'codex,other'],
    ['install', '--agent', 'codex', '--skill', '../outside'],
    ['install', '--agent', 'codex', '--unknown'],
    ['install', '--agent', 'codex', '--global', 'false'],
  ]) assert.throws(() => main(args, cwd, home));
  assert.equal(existsSync(join(cwd, '.agents')), false);
  assert.equal(existsSync(join(home, '.agents')), false);
});

test('父目录符号链接不会将安装写入其他目录', t => {
  const { cwd, home } = workspace(t);
  symlinkSync(home, join(cwd, '.claude'), 'dir');
  assert.throws(() => main(['install', '--agent', 'claude'], cwd, home), /不是普通目录/);
  assert.equal(existsSync(join(home, 'skills')), false);
});

test('已有悬空 Skill 链接也被保留', t => {
  const { cwd, home } = workspace(t);
  const base = join(cwd, '.agents/skills'); mkdirSync(base, { recursive: true });
  symlinkSync(join(home, 'missing'), join(base, 'traceable-development'), 'dir');
  assert.throws(() => main(['install', '--agent', 'codex'], cwd, home), /已存在/);
});

test('多 Agent、重复参数和选定 Skill 能同时安装', t => {
  const { cwd, home } = workspace(t);
  main(['install', '--agent', 'claude,cursor', '--agent', 'claude', '--skill', 'traceable-development'], cwd, home);
  for (const name of ['.claude', '.cursor']) assert.ok(existsSync(join(cwd, name, 'skills/traceable-development/SKILL.md')));
});

test('npm 可执行入口可查看帮助与清单，错误命令返回非零状态', t => {
  const { cwd } = workspace(t);
  for (const args of [[], ['--help'], ['list']]) {
    const result = spawnSync(process.execPath, [join(root, 'bin/rw-skills.mjs'), ...args], { cwd, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /traceable-development/);
  }
  const result = spawnSync(process.execPath, [join(root, 'bin/rw-skills.mjs'), 'install', '--agent', 'invalid'], { cwd, encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /未知 Agent/);
});

test('npm bin 符号链接入口实际执行安装', t => {
  const { cwd } = workspace(t);
  const bin = join(cwd, 'rw-skills');
  symlinkSync(join(root, 'bin/rw-skills.mjs'), bin, 'file');
  const result = spawnSync(process.execPath, [bin, 'install', '--agent', 'codex'], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /已安装/);
  assert.deepEqual(readFileSync(join(cwd, '.agents/skills/traceable-development/SKILL.md')), readFileSync(join(root, 'traceable-development/SKILL.md')));
});
