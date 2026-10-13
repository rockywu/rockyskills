# rw-skills

面向 AI 编程助手的中文 Skill 仓库。把可重复使用的工作方法写成 `SKILL.md`，让助手按明确的步骤完成任务。

仓库地址：[rockywu/rw-skills](https://github.com/rockywu/rw-skills)。目前包含 1 个 Skill，安装方式已在 Codex 的目录结构中验证。

## Skill 列表

| Skill | 中文名称 | 用途 | 介绍 |
|---|---|---|---|
| `traceable-development` | 可追溯开发协作 | 开发计划、任务拆分、依赖与排期、进度、审查证据和 Git 追溯 | [使用说明](traceable-development/README.md) |

## 安装

推荐使用 [Vercel Labs skills](https://github.com/vercel-labs/skills) 安装。它是通过 npm 分发的第三方安装工具，本仓库的内容从 GitHub 下载；使用这条路径不需要本仓库发布到 npm。

已验证的工具版本为 `skills@1.7.2`，需要 Node.js `>=22.20.0`。

先查看可安装的 Skill：

```bash
npx --yes skills@1.7.2 add rockywu/rw-skills --list
```

在当前项目安装到 Codex：

```bash
npx --yes skills@1.7.2 add rockywu/rw-skills \
  --skill traceable-development --agent codex --copy --yes
```

项目安装位置为 `.agents/skills/traceable-development/`。请在目标项目的根目录执行。

全局安装到 Codex：

```bash
npx --yes skills@1.7.2 add rockywu/rw-skills \
  --skill traceable-development --agent codex --global --copy --yes
```

全局安装位置为 `~/.agents/skills/traceable-development/`。安装前检查是否已有同名 Skill；已有自定义内容时先备份。全局命令依据工具文档给出，本次验证使用了临时目录。

`--copy` 表示复制文件。仓库更新后，本地副本不会自动同步，需要再次安装。其他助手的支持范围见安装工具文档，本仓库目前只验证了 Codex 的安装目录与文件完整性。

也可以让 Codex 的内置 `skill-installer` 从本仓库安装，或手动将完整的 `traceable-development/` 目录复制到项目的 `.agents/skills/` 或用户的 `~/.agents/skills/`。必须保留 `references/`，不能只复制 `SKILL.md`。

## 使用

安装后，可以明确指定 Skill，并提供目标、范围和约束：

```text
$traceable-development
请读取项目现有开发文档，将本期需求拆成有稳定编号的任务。
写清依赖、负责人、验收标准和进度，列出现在可以开始的任务。
本次只做规划，不执行开发或发布。
```

安装不等于已经完成任务，也不等于授权助手推送、合并或发布。Skill 的具体工作规则见 [SKILL.md](traceable-development/SKILL.md)。

Codex 会自动发现新增的本地 Skill。如果列表中没有出现，可以重启 Codex。目录规则和调用方式见 [OpenAI 官方 Skill 文档](https://developers.openai.com/codex/skills/)。

## 仓库结构

```text
rw-skills/
├── package.json
├── LICENSE
├── README.md
├── docs/
│   └── npm-distribution.md
└── traceable-development/
    ├── README.md
    ├── SKILL.md
    └── references/templates.md
```

新增 Skill 时，为它建立独立目录，并提供含 `name` 和 `description` 的 `SKILL.md`。使用介绍放在该目录的 `README.md`，辅助模板放在 `references/`。同步更新本页的 Skill 列表。

## npm 分发

npm 内容包名称为 `@rockyskills/rw-skills`，归属 `rockyskills` 组织。首版版本为 `0.1.0`，包含中文介绍、Skill 和所需模板。

从 npm 的固定版本内容包安装到当前项目的 Codex：

```bash
npx --yes skills@1.7.2 add \
  https://registry.npmjs.org/@rockyskills/rw-skills/-/rw-skills-0.1.0.tgz \
  --skill traceable-development --agent codex --copy --yes
```

全局安装时，在上述命令增加 `--global`。也可以继续使用 GitHub 安装路径。

包页面：[npm @rockyskills/rw-skills](https://www.npmjs.com/package/@rockyskills/rw-skills)。`npm install` 只下载内容包；使用上面的命令才会把 Skill 放入 Codex 的发现目录。内容包没有可执行入口，不支持直接运行 `npx @rockyskills/rw-skills`。

两种方式的区别、包配置和发布步骤见 [npm 分发说明](docs/npm-distribution.md)。

## 许可证

本仓库及 npm 内容包采用 [MIT License](LICENSE)。使用、修改或分发时，请保留许可证中的版权声明和许可声明。
