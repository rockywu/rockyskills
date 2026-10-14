# npm 发布说明

包名：`@rockyskills/rw-skills`。组织：`rockyskills`。许可证：MIT。

`0.1.x` 只包含 Skill 内容。从 `0.2.0` 起，包包含自己的 `rw-skills` 安装入口。安装器使用 Node.js 标准库，直接复制到 Agent 的标准 Skill 目录，不依赖第三方安装工具。

## 安装入口

```bash
npx --yes @rockyskills/rw-skills@0.2.0 list
npx --yes @rockyskills/rw-skills@0.2.0 install --agent codex,claude,cursor --global
```

完整支持清单、安装范围、冲突处理和调用示例见 [README](../README.md)。`npm install` 下载包，不自动写入 Skill 目录。安装必须通过明确的 `install` 命令执行。

## 发布前检查

1. 核对 `package.json` 的版本、MIT 许可证、`bin` 入口和 `engines`。
2. 执行 `npm test`。测试使用临时目录，不修改真实 Agent 目录。
3. 执行 `npm pack --dry-run`。核对包内包含 `bin/`、测试、`LICENSE`、README、全部 Skill 及辅助文件。`prepack` 会运行测试。
4. 执行 `npm pack`，在临时项目用生成的 `.tgz` 运行 CLI 并验证安装。
5. 提交并推送 GitHub，再公开发布。新增 Skill 时同步更新 README 完整清单及发布文件白名单。

## 发布与认证

```bash
npm whoami --registry=https://registry.npmjs.org/
npm publish --access public --registry=https://registry.npmjs.org/
```

需要账号拥有 `rockyskills` 组织的发布权限。按 npm 提示在浏览器完成本人认证和 2FA。已有版本不能覆盖，后续发布需增加版本号。

发布后确认：

```bash
npm view @rockyskills/rw-skills version bin license --registry=https://registry.npmjs.org/
```

随后按 README 命令从真实 registry 安装到临时项目，并核对 `SKILL.md`、模板和 MIT 许可证。Git 推送成功、npm 发布成功、文件安装通过和 Agent 实际任务效果是不同的验证结果，应分别记录。

## 参考

- [npm：发布公开 scope 包](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
- [npm：package.json 的 bin 入口](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#bin)

本包通过 npm 分发本地 Skill 文件，不会自动进入 Agent 的插件目录。
