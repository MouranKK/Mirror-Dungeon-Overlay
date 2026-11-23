# GitHub Releases：面向普通玩家的下载方式

目前仅准备好发布流程；**未生成公开可下载的 EXE、未通过 Windows 实机测试或代码签名**。

## 第一次配置（仓库维护者）

1. 在 GitHub 创建 Public 仓库；上传本项目目录中的所有文件（不要只上传 ZIP）。
2. 在本机安装 Node.js 24 或受支持的 LTS 版本，进入仓库目录，执行 `npm install --package-lock-only`，检查生成的 `package-lock.json` 并提交到 GitHub。未有锁文件时 Actions 构建会故意失败。
3. 在 GitHub → Actions 运行 `Public source checks`，确认 `npm ci`、静态检查和高危依赖审计全部通过。
4. 在 GitHub → Actions → **Build Windows Beta and prepare Release** → **Run workflow** 手动触发一次；成功后从 Artifacts 下载 `MirrorDungeonOverlay-Windows-candidate`，在 Windows 上进行 Defender 扫描与功能测试。
5. 审核通过后创建版本 tag：如 `v1.2.2`，推送到 GitHub。会自动编译并创建 **Draft + Pre-release**，附上 EXE 和 SHA-256 文件。由你确认之后手动 Publish。
6. GitHub 为对应 tag **自动生成** `Source code (zip)` 和 `Source code (tar.gz)`，不必另行上传源码 ZIP。
7. 开启 Issues/Discussions 接收卡包分支、饰品等级和 BOSS 机制纠错。

## 面向普通玩家

- Releases → 下载 `MirrorDungeonOverlay-1.2.2-x64.exe`（便携版，无需安装 Node.js）。
- 可使用 SHA-256 验证下载内容。
- 目前是未签名测试程序，Windows SmartScreen 可能弹出未知发布者提示；不要告诉用户关闭杀毒或绕过安全保护。若警告或 Defender 报风险，停止运行并上报。
- 项目不读游戏内存、不修改客户端；窗口控制使用 Electron API。

## 发布前置条件

- CI 绿灯、`npm audit --audit-level=high` 通过，实机测试置顶/透明/鼠标穿透/快捷键恢复与关闭；最终 EXE 交 Windows Defender 检测。
- 核对第三方素材版权、更新说明文档及非官方声明。
- 有条件时对 EXE 进行代码签名；**未签名 ≠ 已经安全**。
- 如果计划改成商用或将游戏原始图标打包，请先核实授权。

参阅 GitHub Docs：https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository
