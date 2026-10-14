# rw-skills

中文 AI Agent Skill 仓库。将开发协作方法写成可安装、可调用的 Skill，供 AI 编程助手使用。

[GitHub 仓库](https://github.com/rockywu/rw-skills) · [npm 包 @rockyskills/rw-skills](https://www.npmjs.com/package/@rockyskills/rw-skills)

## 文档目录

- [工程中的全部 Skill](#工程中的全部-skill)
- [安装文档](#安装文档)：环境要求、直接安装、多 Agent 支持、安装范围和检查方法。
- [使用文档](#使用文档)：调用方式、输入资料、使用示例和预期产出。
- [更新与卸载](#更新与卸载)
- [新增 Skill](#新增-skill)
- [发布说明](#发布说明)

## 工程中的全部 Skill

当前工程共 **1 个 Skill**。以下按工程中的 `SKILL.md` 列出完整清单。

| Skill 名称 | 中文名称 | 适用任务 | 预期产出 | 详细文档 |
|---|---|---|---|---|
| `traceable-development` | 可追溯开发协作 | 开发计划、任务拆分、依赖与排期、进度跟踪、审查和交接 | 沿用项目结构的主计划；按需补充任务卡、需求与任务关联、依赖、验收证据和 Git 记录 | [介绍与示例](https://github.com/rockywu/rw-skills/blob/main/traceable-development/README.md) · [完整规则](https://github.com/rockywu/rw-skills/blob/main/traceable-development/SKILL.md) · [文档模板](https://github.com/rockywu/rw-skills/blob/main/traceable-development/references/templates.md) |

Skill 名称用于安装参数和调用。中文名称用于阅读说明。它不提供后台调度或任务管理服务；实际执行仍由助手依据用户要求完成。

## 安装文档

### 1. 环境要求

- Node.js `>=20`，以及可用的 `npm`、`npx`。
- 使用下表中支持 Agent Skills 的本地 Agent 版本。
- 通过 npm 安装时，能访问 npm registry。

从 **`0.2.0` 起**，本包提供自己的安装命令，使用 Node.js 标准库，没有第三方安装依赖。旧版 `0.1.x` 只有 Skill 内容，不包含这个入口。以下 npm 命令需要先发布 `0.2.0`。

检查环境：

```bash
node --version
npm --version
```

### 2. 支持的 Agent 与安装目录

| Agent | `--agent` 参数 | 项目目录 | 全局目录 | 官方说明 |
|---|---|---|---|---|
| Codex | `codex` | `.agents/skills/` | `~/.agents/skills/` | [文档](https://developers.openai.com/codex/skills/) |
| Claude Code | `claude` | `.claude/skills/` | `~/.claude/skills/` | [文档](https://code.claude.com/docs/en/skills) |
| Cursor | `cursor` | `.cursor/skills/` | `~/.cursor/skills/` | [文档](https://cursor.com/docs/context/skills) |
| Gemini CLI | `gemini` | `.gemini/skills/` | `~/.gemini/skills/` | [文档](https://geminicli.com/docs/cli/skills/) |
| OpenCode | `opencode` | `.opencode/skills/` | `~/.config/opencode/skills/` | [文档](https://opencode.ai/docs/skills/) |
| GitHub Copilot | `copilot` | `.github/skills/` | `~/.copilot/skills/` | [文档](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) |

全局目录中的 `~` 表示当前用户的主目录。项目目录相对于执行命令时的当前目录，请在目标项目根目录运行。全局安装面向本地 Agent；云端使用需要按 Agent 的官方规则配置。

目录规则已按官方文档核对，六种 Agent 的项目与全局文件安装均使用临时目录验证。尚未逐一启动六种 Agent 验证任务执行效果。部分 Agent 也会扫描其他 Agent 的兼容目录，重复安装可能出现重复条目；按自己实际使用的 Agent 选择目标即可。

### 3. 安装全部 Skill

在目标项目根目录安装到 Codex：

```bash
npx --yes @rockyskills/rw-skills@0.2.0 install --agent codex
```

全局安装到 Claude Code：

```bash
npx --yes @rockyskills/rw-skills@0.2.0 install --agent claude --global
```

同时安装到 Codex、Claude Code 和 Cursor：

```bash
npx --yes @rockyskills/rw-skills@0.2.0 install --agent codex,claude,cursor --global
```

默认安装包中的全部 Skill。`--agent` 必填，支持逗号分隔或重复传入；`--global` 可选，不传则安装到当前项目。安装器复制完整 Skill 目录、辅助文件和 MIT 许可证，不创建符号链接，不修改 Agent 配置。

`npx --yes` 只自动确认下载这个 npm 包。同名 Skill 目录或链接已存在时，安装器仍会停止。请先备份并将旧目录移出 Agent 的 Skill 目录，再重新安装。

### 4. 只安装一个 Skill

```bash
npx --yes @rockyskills/rw-skills@0.2.0 install \
  --agent cursor --skill traceable-development
```

`--skill` 的名称来自本页完整清单，可以重复传入以选择多个 Skill。未知名称会报错，不会安装到其他位置。

查看本包可安装的 Skill：

```bash
npx --yes @rockyskills/rw-skills@0.2.0 list
```

查看命令帮助：

```bash
npx --yes @rockyskills/rw-skills@0.2.0 --help
```

`list` 列出当前包的 Skill，不扫描本机已经安装的其他 Skill。

### 5. 不通过 npm 安装

从 GitHub 克隆仓库后，也可以直接运行仓库中的安装入口。项目安装前，先切换到目标项目目录，再用实际克隆路径替换以下路径：

```bash
node /path/to/rw-skills/bin/rw-skills.mjs install --agent codex
```

全局安装同样增加 `--global`。这个入口只使用 Node.js 标准库，无需先运行 `npm install`。

也可以手动复制完整的 `traceable-development/` 到上表对应目录，并保留 `references/` 和仓库的 MIT `LICENSE`。

### 6. 检查安装结果

例如 Codex 全局安装后，应至少存在以下文件：

```text
~/.agents/skills/traceable-development/SKILL.md
~/.agents/skills/traceable-development/references/templates.md
~/.agents/skills/traceable-development/LICENSE
```

其他 Agent 检查上表对应目录。重新打开 Agent 会话并查看它提供的 Skill 清单；未出现时核对版本是否支持 Skills，以及所选安装范围。

## 使用文档

### 1. 调用 Skill

安装完成后，按所用 Agent 的调用方式发送任务：

| Agent | 调用方式 |
|---|---|
| Codex | 输入 `$traceable-development`，再描述任务 |
| Claude Code | 输入 `/traceable-development`，再描述任务 |
| Cursor | 在 Agent 聊天输入 `/`，搜索并选择 `traceable-development` |
| Gemini CLI、OpenCode、GitHub Copilot | 明确要求使用 `traceable-development` 处理开发计划；在 Agent 的 Skill 功能中核对是否已发现 |

以下示例采用 Codex 的 `$traceable-development`。其他 Agent 替换为其调用方式，任务要求可以保持一致。

安装 Skill 不等于调用它。调用 Skill 也不等于授权推送、合并或发布；需要执行这些操作时，应在任务中说明。

### 2. 提供必要资料

说明需求或文档位置、当前目标、已有项目约定，以及本次只做规划还是需要执行。已知负责人、期限、验收环境和开发范围时，一并提供；未知项可以让助手标记为待确认。

Skill 优先沿用项目现有文档、任务编号和工作流。小任务不强制创建整套文档。

### 3. 制定开发计划

复制下面的内容到 Codex，并将路径、需求和期限替换为项目实际信息：

```text
$traceable-development
请读取 docs/requirements.md、已有开发计划和项目约定。
为本期需求制定开发计划，沿用现有文档结构。
每项任务写清目标、稳定编号、负责人、前置依赖和验收标准。
列出当前可以开始的任务和仍需确认的事项。
本次只完成规划，不修改业务代码，不推送或发布。
```

预期结果：形成或更新一份主计划，需求有对应任务，任务依赖和验收可检查。任务较多时按需补充独立任务卡。

### 4. 更新进度与交接

```text
$traceable-development
请读取现有开发计划，核对当前文件、测试证据和 Git 记录。
更新任务状态，区分已经实现、已经验收、已经集成和已经部署。
记录阻塞原因、解除条件和下一步。
列出现在可以开始的任务，并保存接续工作所需的信息。
未执行或无法核对的检查请明确标记。
```

预期结果：计划与实际证据一致，阻塞有处理方向，接续任务可定位。已提交代码不能自动记为已验收或已部署。

### 5. 按计划执行

```text
$traceable-development
请按已确认的开发计划执行当前已就绪的任务。
先检查依赖是否已经验收并可在目标分支使用。
在已授权范围内完成实现和必要验证，并更新计划中的进度与证据。
遇到影响范围、业务取舍或权限的未知事项时先询问。
本次不推送或发布。
```

预期结果：实际实现和验证有记录，未完成项如实保留。并行执行需要项目授权及环境支持；给出分工建议不等于已经启动多个任务。

## 更新与卸载

安装保存的是本地副本，发布新版本不会自动同步。更新时先将原 Skill 文件夹移出 Agent 的 Skill 目录进行备份，再运行新版本的安装命令。安装器不会覆盖旧内容。

卸载时，备份自定义内容后，在上表对应目录中删除本仓库的 Skill 文件夹。例如 Codex 全局版本对应 `~/.agents/skills/traceable-development/`。不要删除同目录下其他来源的 Skill。

## 新增 Skill

每个 Skill 使用独立目录：

```text
skill-name/
├── README.md
├── SKILL.md
└── references/
```

`SKILL.md` 必须包含 `name` 和 `description`。介绍与调用示例放入该 Skill 的 `README.md`，模板放入 `references/`。新增或移除 Skill 时，同步维护本页完整清单，以及 `package.json` 的发布文件白名单。

## 发布说明

npm 包归属 `rockyskills` 组织。当前安装器准备为 `0.2.0`。更新已发布的 README 或安装器需要发布新的 npm 版本，GitHub 修改不会自动更新已有 npm 版本。

发布配置与流程见 [npm 分发说明](https://github.com/rockywu/rw-skills/blob/main/docs/npm-distribution.md)。已发布的同版本不能覆盖。

## 许可证

采用 [MIT License](https://github.com/rockywu/rw-skills/blob/main/LICENSE)。使用、修改或分发时，请保留版权声明和许可声明。

Codex 的 Skill 目录和调用方式见 [OpenAI 官方文档](https://developers.openai.com/codex/skills/)。
