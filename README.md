# rw-skills

中文 AI Agent Skill 仓库。将开发协作方法写成可安装、可调用的 Skill，供 AI 编程助手使用。

[GitHub 仓库](https://github.com/rockywu/rw-skills) · [npm 内容包 @rockyskills/rw-skills](https://www.npmjs.com/package/@rockyskills/rw-skills)

## 文档目录

- [工程中的全部 Skill](#工程中的全部-skill)
- [安装文档](#安装文档)：环境要求、npm 安装、GitHub 安装、安装范围和检查方法。
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

- 使用 Codex。其他助手的支持范围见 [Vercel Labs skills](https://github.com/vercel-labs/skills)，本仓库目前验证的是 Codex 安装。
- Node.js `>=22.20.0`，以及可用的 `npm`、`npx`。
- 能访问 npm registry。使用 GitHub 安装方式时，也需要能访问 GitHub。

检查环境：

```bash
node --version
npm --version
```

安装使用第三方工具 `skills@1.7.2`。`@rockyskills/rw-skills` 是包含 Skill、介绍和模板的内容包，没有可执行入口。`npm install @rockyskills/rw-skills` 只下载包，不能代替下面的 Skill 安装步骤。

### 2. 从 npm 安装全部 Skill

先取得 npm 当前最新版本的下载地址：

```bash
rw_skills_tarball="$(npm view @rockyskills/rw-skills dist.tarball --registry=https://registry.npmjs.org/)"
```

然后将全部 Skill 全局安装到 Codex，所有项目均可使用：

```bash
npx --yes skills@1.7.2 add "$rw_skills_tarball" \
  --skill '*' --agent codex --global --copy --yes
```

全局目录为 `~/.agents/skills/`。`--skill '*'` 表示安装内容包中的全部 Skill，单引号用于防止 shell 展开星号。当前包只有 `traceable-development`，以后新增 Skill 时不需要逐个填写名称。

如果只需要当前项目使用，在该项目根目录执行下面的命令：

```bash
npx --yes skills@1.7.2 add "$rw_skills_tarball" \
  --skill '*' --agent codex --copy --yes
```

项目目录为 `.agents/skills/`。以上命令中的下载地址变量需在同一个终端中设置。安装前检查同名 Skill；有自定义内容时先备份，再决定是否替换。

### 3. 只安装一个 Skill

使用清单中的名称替换 `--skill '*'`。例如全局安装可追溯开发协作：

```bash
npx --yes skills@1.7.2 add "$rw_skills_tarball" \
  --skill traceable-development --agent codex --global --copy --yes
```

需要固定版本时，取得指定版本的地址即可。例如已经发布的 `0.1.0`：

```bash
rw_skills_tarball="$(npm view @rockyskills/rw-skills@0.1.0 dist.tarball --registry=https://registry.npmjs.org/)"
```

### 4. 从 GitHub 安装

先列出仓库中的全部 Skill：

```bash
npx --yes skills@1.7.2 add rockywu/rw-skills --list
```

全局安装全部 Skill：

```bash
npx --yes skills@1.7.2 add rockywu/rw-skills \
  --skill '*' --agent codex --global --copy --yes
```

仅安装到当前项目时去掉 `--global`。仅安装单个 Skill 时，将 `'*'` 替换为清单中的 Skill 名称。

### 5. 检查安装结果

全局安装后，应至少存在以下两个文件：

```text
~/.agents/skills/traceable-development/SKILL.md
~/.agents/skills/traceable-development/references/templates.md
```

项目安装时，检查当前项目的 `.agents/skills/traceable-development/`。

也可以使用安装工具查看已安装清单：

```bash
# 全局安装清单
npx --yes skills@1.7.2 list --global --agent codex

# 当前项目安装清单
npx --yes skills@1.7.2 list --agent codex
```

Codex 会自动发现新增 Skill。如果列表中没有出现，可以重启 Codex。手动安装时，也必须复制完整的 Skill 目录，保留 `references/`，不能只复制 `SKILL.md`。

## 使用文档

### 1. 调用 Skill

在 Codex 对话中输入 `$traceable-development`，然后说明目标、范围和约束。在支持 Skill 选择器的界面，也可以选择该 Skill 后发送任务。

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

`--copy` 会保存本地副本，npm 或 GitHub 内容更新后不会自动同步。更新时重新取得最新下载地址，并重新运行所选安装命令；自定义内容先备份。

卸载全局的可追溯开发协作 Skill：

```bash
npx --yes skills@1.7.2 remove traceable-development --agent codex --global
```

卸载项目版本时，在目标项目根目录执行，并去掉 `--global`。卸载前确认其中没有需要保留的自定义内容。

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

npm 包归属 `rockyskills` 组织。更新已发布的 README 需要发布新的 npm 版本，GitHub 的修改不会自动更新已有 npm 版本的 README。

发布配置与流程见 [npm 分发说明](https://github.com/rockywu/rw-skills/blob/main/docs/npm-distribution.md)。已发布的同版本不能覆盖。

## 许可证

采用 [MIT License](https://github.com/rockywu/rw-skills/blob/main/LICENSE)。使用、修改或分发时，请保留版权声明和许可声明。

Codex 的 Skill 目录和调用方式见 [OpenAI 官方文档](https://developers.openai.com/codex/skills/)。
