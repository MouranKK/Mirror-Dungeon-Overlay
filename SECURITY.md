# Security policy / 安全说明

此仓库是公开源码测试版，未经过独立渗透测试，**没有**提供由维护者签名或已完成恶意软件扫描的 Windows EXE。下载者应审查源码，使用自己的机器在可控环境构建，并核对 `npm audit` 结果。

## 安全措施
- Electron renderer 使用 `sandbox: true`、`contextIsolation: true`、`nodeIntegration: false`，不开放 Node.js 给攻略网页。
- 主进程限制外部域名、阻止 renderer 的 HTTP(S) 请求、拒绝网页权限与新窗口，IPC 验证发送窗口与主 frame。
- 透明、置顶、鼠标穿透控制仅操作应用窗口，不读取游戏内存、屏幕、个人文件或账号。
- `Ctrl+Alt+F8` 与托盘右键菜单可恢复鼠标点击，`Ctrl+Alt+F9` 隐藏/显示。
- 本源码包不附带第三方游戏截图与资源下载器。

## 发布前仍需要
1. 在 Windows 上联网安装固定依赖，生成并 **提交 `package-lock.json`**。
2. `npm ci`、`npm audit --audit-level=high`、`npm run verify` 和 Windows 打包都通过，审查异常依赖脚本。
3. 执行 Windows Defender 或其他可信本机扫描，必要时加入代码签名、提交 SHA-256 校验值。
4. 在 GitHub 打开 Dependabot Alerts，审查任何高危漏洞。
5. 进行真实 Windows 与游戏无边框窗口测试。

漏洞报告请使用 GitHub 的 **Private vulnerability reporting**，或先向维护者私下报告；不要公开可利用细节。
