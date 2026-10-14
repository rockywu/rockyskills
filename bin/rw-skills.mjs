#!/usr/bin/env node
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const agents = {
  codex: { project: '.agents/skills', global: '.agents/skills' },
  claude: { project: '.claude/skills', global: '.claude/skills' },
  cursor: { project: '.cursor/skills', global: '.cursor/skills' },
  gemini: { project: '.gemini/skills', global: '.gemini/skills' },
  opencode: { project: '.opencode/skills', global: '.config/opencode/skills' },
  copilot: { project: '.github/skills', global: '.copilot/skills' },
};

export function skillDirectory(agent, global, cwd, home) {
  if (!Object.hasOwn(agents, agent)) throw new Error(`未知 Agent：${agent}。支持：${Object.keys(agents).join(', ')}`);
  return resolve(global ? home : cwd, agents[agent][global ? 'global' : 'project']);
}

function catalog() {
  return readdirSync(packageRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(packageRoot, entry.name, 'SKILL.md')))
    .map(entry => {
      const source = join(packageRoot, entry.name);
      const text = readFileSync(join(source, 'SKILL.md'), 'utf8');
      const name = text.match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1];
      if (!name || name !== entry.name || name.length > 64) throw new Error(`Skill 名称与目录不一致：${entry.name}`);
      return { name, source, description: text.match(/^description:\s*(.+)$/m)?.[1] ?? '' };
    }).sort((a, b) => a.name.localeCompare(b.name));
}

// 拒绝经由符号链接写入，避免修改链接指向的其他 Skill 或目录。
function checkDirectory(path, anchor) {
  let current = anchor;
  for (const part of relative(anchor, path).split(/[\\/]/)) {
    current = join(current, part);
    try {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`目标目录不是普通目录：${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

const help = `rw-skills：直接安装本包中的中文 Skill，无第三方安装依赖。

用法：
  npx @rockyskills/rw-skills list
  npx @rockyskills/rw-skills install --agent codex
  npx @rockyskills/rw-skills install --agent codex,claude,cursor --global
  npx @rockyskills/rw-skills install --agent claude --skill traceable-development

选项：
  --agent <名称>   必填；用逗号分隔多个 Agent，也可重复此选项
  --skill <名称>   可选；默认安装全部，可重复此选项
  --global        安装到用户目录；默认安装到当前项目
  --help          查看帮助

支持：${Object.keys(agents).join(', ')}
已有同名 Skill 时停止，不覆盖。更新前请将旧目录移到 Skill 目录以外备份。
list 列出本包可安装的 Skill。`;

export function main(args, cwd = process.cwd(), home = homedir()) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    agent: { type: 'string', multiple: true },
    skill: { type: 'string', multiple: true },
    global: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  } });
  if (values.help || args.length === 0) { console.log(help); return; }
  if (positionals.length !== 1 || !['install', 'list'].includes(positionals[0])) throw new Error('请使用 install 或 list；--help 查看帮助。');
  const skills = catalog();
  if (skills.length === 0) throw new Error('包中没有可安装的 Skill。');
  if (positionals[0] === 'list') {
    if (values.agent || values.skill || values.global) throw new Error('list 仅列出本包的 Skill，不接受安装选项。');
    for (const skill of skills) console.log(`${skill.name}\n  ${skill.description}`);
    return;
  }
  const selectedAgents = [...new Set((values.agent ?? []).flatMap(value => value.split(',')))];
  if (!selectedAgents.length) throw new Error('请通过 --agent 指定目标 Agent。');
  const requested = new Set(values.skill ?? []);
  for (const name of requested) {
    if (!skills.some(skill => skill.name === name)) throw new Error(`未知 Skill：${name}。使用 list 查看清单。`);
  }
  const selectedSkills = requested.size ? skills.filter(skill => requested.has(skill.name)) : skills;
  const targets = selectedAgents.flatMap(agent => {
    const base = skillDirectory(agent, values.global, cwd, home);
    checkDirectory(base, values.global ? home : cwd);
    return selectedSkills.map(skill => ({ agent, base, skill, destination: join(base, skill.name) }));
  });
  // 先检查全部目标，参数错误或已有目录时不产生部分安装。
  for (const target of targets) {
    try {
      lstatSync(target.destination);
      throw new Error(`已存在：${target.destination}。请先备份并移走旧目录，再安装。`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const installed = [];
  try {
    for (const target of targets) {
      mkdirSync(target.base, { recursive: true });
      const staging = mkdtempSync(join(target.base, '.rw-skills-'));
      try {
	cpSync(target.skill.source, staging, {
	  recursive: true,
	  filter: path => !['.DS_Store', '.git', 'node_modules'].includes(path.split(/[\\/]/).at(-1)),
	});
	if (!existsSync(join(staging, 'LICENSE'))) cpSync(join(packageRoot, 'LICENSE'), join(staging, 'LICENSE'));
	// 复制期间可能有另一进程创建目标，重新检查以保护已有内容。
	try {
	  lstatSync(target.destination);
	  throw new Error(`安装期间目标已被创建：${target.destination}`);
	} catch (error) {
	  if (error.code !== 'ENOENT') throw error;
	}
	renameSync(staging, target.destination);
	installed.push(target.destination);
      } finally {
	rmSync(staging, { recursive: true, force: true });
      }
      console.log(`已安装 ${target.skill.name} → ${target.agent}: ${target.destination}`);
    }
  } catch (error) {
    for (const path of installed) rmSync(path, { recursive: true, force: true });
    throw error;
  }
  console.log('请在 Agent 中查看 Skill 清单；未发现时重新打开会话。');
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(`安装失败：${error.message}`); process.exitCode = 1; }
}
