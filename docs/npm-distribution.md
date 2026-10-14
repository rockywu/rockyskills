# npm 分发说明

## 包与安装方式

包名：`@rockyskills/rw-skills`。发布组织：`rockyskills`。首版：`0.1.0`。

一个纯内容包分发本仓库的全部 Skill。安装时复用 [Vercel Labs skills](https://github.com/vercel-labs/skills)，不维护自己的安装器。

| 方式 | 内容来源 | 安装命令 |
|---|---|---|
| GitHub 仓库 | 仓库当前内容 | `npx --yes skills@1.7.2 add rockywu/rw-skills` |
| npm 固定版本 | registry 的版本归档 | 使用下面的 `.tgz` 下载地址 |

安装到当前项目的 Codex：

```bash
npx --yes skills@1.7.2 add \
  https://registry.npmjs.org/@rockyskills/rw-skills/-/rw-skills-0.1.0.tgz \
  --skill traceable-development --agent codex --copy --yes
```

全局安装增加 `--global`。`skills@1.7.2` 要求 Node.js `>=22.20.0`。

`npm install` 只下载 npm 包，不会自动把 Skill 放进 Codex 的发现目录。内容包没有 `bin` 或 `postinstall`，不支持直接执行 `npx @rockyskills/rw-skills`，也不会在 npm 安装时修改用户的 Skill 目录。

## 包配置

以根目录的 [package.json](../package.json) 为准。文件白名单包含 MIT 许可证、仓库介绍、分发说明、Skill 介绍、`SKILL.md` 和模板，排除 `.DS_Store`、Git 文件和临时归档。

仓库及内容包采用 [MIT License](../LICENSE)，`package.json` 的 `license` 为 `MIT`，包内包含 `LICENSE`。新增 Skill 时同步扩展白名单。

纯内容包没有运行时依赖，不需要构建步骤。

## 发布顺序

1. 确认版本与包内容，运行 `npm pack --dry-run` 检查白名单。
2. 用 `npm pack` 生成归档；从归档执行安装，检查 Skill 和辅助文件完整性。
3. 提交仓库，再推送到 GitHub 的 `main` 分支。不要把与发布无关的本地改动加入提交。
4. 用 `npm whoami --registry=https://registry.npmjs.org/` 检查账号，用 `npm org ls rockyskills --json --registry=https://registry.npmjs.org/` 核对组织权限。
5. 在 npm 要求的本人认证可完成时，执行发布：

```bash
npm publish --access public --registry=https://registry.npmjs.org/
```

6. 查询 registry 中的真实版本和下载地址：

```bash
npm view @rockyskills/rw-skills version dist.tarball \
  --registry=https://registry.npmjs.org/
```

7. 从查询返回的下载地址在临时项目安装，并比较 `SKILL.md` 和模板与已提交版本的内容。

后续发布必须增加版本号。同一个已发布版本不能覆盖。Git 推送成功不等于 npm 已发布，npm 已发布也不等于实际任务效果已经验收。

## 已完成的准备验证（2026-10-13，Asia/Shanghai）

- GitHub 仓库 `rockywu/rw-skills` 为公开仓库。
- 现有 Skill 为 `traceable-development`，入口和模板文件齐全。
- Codex 内置安装脚本、GitHub 远程安装、本地目录安装和本地 HTTP 下载 `.tgz` 安装均已在临时目录验证成功。
- 已安装的 `SKILL.md` 和模板内容与仓库一致。
- 试验 npm 内容包的白名单检查通过，未包含 `.DS_Store` 或 Git 文件。
- 本机 Node.js 为 `24.19.0`，npm 为 `11.17.0`，满足安装工具要求。
- npm 命令行账号已验证为 `rockywu`，在 `rockyskills` 组织中具有 owner 权限。

以上记录证明安装文件完整性，不代表 Skill 的实际任务效果验收。真实 registry 的发布结果与发布后安装结果，以本次执行输出为准。

## 参考

- [npm：创建和发布公开 scope 包](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
- [Vercel Labs skills：安装方式与参数](https://github.com/vercel-labs/skills)
- [OpenAI：Skill 结构、发现目录和插件分发建议](https://developers.openai.com/codex/skills/)

OpenAI 官方建议将面向其他用户的可复用 Skill 打包为插件。npm 内容包提供文件分发，不会自动进入 ChatGPT 或 Codex 的插件目录。
