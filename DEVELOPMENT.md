# 开发与发布

当前依赖、平台边界与验证步骤见 [兼容性说明](COMPATIBILITY.md)。

需要 Node.js 22 或更高版本，以及 pnpm 11.9.0。依赖从公共 npm 注册表安装，SDK 使用 `@tau/plugins` 到 `@xiongtao.xt/tau-plugins@0.49.0` 的公开别名，不依赖 Tau 主仓库、本机目录或 SDK 快照包。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

构建生成 `dist/tau.embedding-openai-0.1.0.zip`。SDK、React 和 UI 由客户端提供，构建时保持 external。测试模拟 HTTP，不需要真实账号，也不会产生嵌入调用费用。

插件入口和表单在 `src/index.tsx`，OpenAI 嵌入协议适配在 `src/provider.ts`。配置按账号实例保存，`create` 只做配置校验、不发网络请求；`embed` 按 `maxBatchSize` 由宿主分批调用，向量按返回的 `index` 重排后交给宿主。

更新时同步修改 `package.json`、`manifest.json` 和 `CHANGELOG.md`，提交后推送同版本标签。`v0.1.0` 这样的标签会触发 GitHub Actions：冻结安装依赖、运行测试、类型检查、构建并发布 ZIP 到 GitHub Release。主分支推送与 Pull Request 也会执行构建验证。

`pnpm install:local` 仅用于首次安装开发包，目标目录存在时拒绝覆盖。日常发布不自动安装插件，不读取用户的模型服务凭据。
