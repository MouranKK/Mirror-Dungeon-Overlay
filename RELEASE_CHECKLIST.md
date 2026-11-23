# GitHub 发布清单（源码版）

这是一份 **Source Preview / Public Beta**，不是安全认证的 Windows 二进制发布。

- [x] 公开版未包含 Project Moon 游戏图标、卡包截图、视频省流图、游戏内音频或抓取的游戏资源。
- [x] 应用默认本地离线；进程禁用网页的外部 HTTP(S) 请求、系统权限，限制对外浏览器链接。
- [x] Electron 渲染进程启用沙盒、上下文隔离，关闭 Node.js 集成。
- [x] 已加入原生鼠标穿透恢复快捷键与托盘控制。
- [x] `node scripts/verify-source.cjs` 静态检查通过（Windows 实机尚未完成）。
- [ ] 在 Windows 联网运行 `01-DoubleClick-To-Build.cmd`，核对依赖与打包功能。
- [ ] 将 Windows 生成的 `package-lock.json` **提交 GitHub**；没有这个文件，CI 应标红。
- [ ] `npm audit --audit-level=high` 全部通过；如出现漏洞，先解决再发布二进制。
- [ ] 在 Windows Defender 上扫描实际生成的 EXE。
- [ ] 在真实游戏和 Win11 环境测试置顶、透明、穿透及热键恢复。
- [ ] 获得第三方截图的许可之前，不要加入任何视频或游戏素材。
- [ ] 整理用户提供的视频原作者署名与准确来源链接。
- [ ] 对公开 EXE 进行代码签名（若有条件）；至少发布 SHA-256 和明确的未签名声明。

创建仓库：GitHub → New repository → Public → 上传这个 ZIP 解压后的全部文件（不要把 ZIP 当成唯一代码文件）。开启 Issues / Discussions / Dependabot alerts。初期只发布源码，不要打开自动生成 EXE 的 Release 工作流。

- [x] 添加可生成 Release 草稿的 Windows Actions 工作流，阻止自动公开未测试二进制。
- [ ] 手动检查 Actions Windows 构建输出并发布草稿。

- [ ] 核对原创插画正常显示，个人截图批量／逐件导入正常；确认没有游戏原图混入仓库。
