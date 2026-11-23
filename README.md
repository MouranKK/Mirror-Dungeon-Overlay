# Mirror Dungeon Overlay / 镜牢指挥条

> **公开源码测试版 v1.2.2 — 尚未通过公开发布 EXE 所需的完整安全审计。** 非官方、非商业的《Limbus Company》镜牢 15 层攻略悬浮工具，与 Project Moon 无关联。

[查看线上演示（包含原版图片，在线网站版权状态与本包不同）](https://github.com/MouranKK/Mirror-Dungeon-Overlay)

## 功能
- Windows 可调整置顶、透明度、鼠标穿透的小窗（`Ctrl+Alt+F8` 恢复点击、`Ctrl+Alt+F9` 隐藏/显示；可用托盘备选恢复）。
- 烧震黎明、楔子呼震 15 层路线；实际选中不同卡包后，地图／商店／物品提醒跟着改变。
- E.G.O 饰品关键词／等级查询、固定配方、11–15 层隐藏 BOSS 与全制约注意事项。
- 默认离线运行，不修改游戏、不读取 Steam/游戏内存或屏幕。
- **图片模式（v1.2.2）**：内置约 118 张原创示意卡（饰品及主题包），即使离线也有图；如需精确认识游戏原图，可以在对应饰品详情中点击 `📷` 导入自己的截图，或在 `⋯ → 🖼 图片管理` 批量导入。图片仅存于本机 IndexedDB，不会上传或打包进 GitHub。点击 Wiki 原图链接可在外部浏览器核对。**示意卡不是游戏官方图像**。

## GitHub Releases（普通玩家一键下载）

查看 [发布手册](GITHUB_RELEASE_INSTRUCTIONS.md) 和 [图片授权政策](IMAGE_POLICY.md)。仓库提交完整依赖锁文件后，可以通过 GitHub Actions 构建 Windows EXE，自动创建 **Draft Pre-release**；必须经过维护者验证后手动发布。GitHub 将自动附上源码 ZIP。

## 推荐环境
- Windows 10/11 x64、Node.js LTS、npm、联网仅用于首次安装依赖。
- 尽量在游戏「无边框窗口」模式使用，避免被独占全屏覆盖。

## 一键构建（Windows）
1. 下载 ZIP，**全部解压**到普通文件夹，不要直接在压缩包预览中运行。
2. 安装 [Node.js LTS](https://nodejs.org/en/download)。
3. 双击 `01-DoubleClick-To-Build.cmd`。
4. 脚本生成 `package-lock.json`，安装依赖并运行安全审计；审计发现高危／严重漏洞则**停止构建**。
5. 成功后在 `dist/` 找便携 EXE。该文件是**未签名的本机构建版**，不要宣称已获微软安全认证。

想在 GitHub 发布源码：在初次构建后，将 `package-lock.json` 加入 Git 仓库以锁定完整依赖树；此初始 ZIP **不含锁文件**，因为当前制作环境无法访问 npm Registry，未进行联网依赖审计或 Windows 实机打包。

## 验证
```bash
node scripts/verify-source.cjs
npm ci
npm audit --audit-level=high
npm run build:win
```
以上 `npm ci` 要求先有 `package-lock.json`。CI 会在锁文件未提交时拒绝通过，防止把缺少审计的版本当正式发行版。

## 反馈与数据来源
建议在 GitHub Issues 里填写：游戏版本／路线／楼层／选择的卡包／预期行为／实际行为／证据链接。请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

- 应用代码：MIT，见 `LICENSE`。
- 商标、游戏内容、Wiki 和玩家攻略素材不属于本项目的 MIT 授权范围。
- 它只提供参考建议，游戏版本更新与随机事件可能造成不一致。
- 完整安全声明：`SECURITY.md`。

## 如何导入游戏截图（仅保存在用户自己的电脑）

1. 运行程序，点击 `⋯ → 🖼 图片管理`，选择批量导入；文件名为 `饰品名称.png`、`English Gift Name.png`、或 `卡包中文名.png`，将自动尝试匹配。
2. 或在「卡包」页面点击 `📷 给当前卡包添加我的截图`，以及在「饰品详情」点击 `📷 为此饰品导入我的截图`，无需重命名。
3. 导入后卡片会显示本地图像，原有级别／说明／配方／路线不变。图片以浏览器 IndexedDB 存储在本机应用数据目录；清理应用数据或换电脑可能丢失。
4. 只应导入你有权在本机保存和使用的素材。仓库不附送官方图片，也不会从 Wiki 服务器自动批量下载。

开发者可在 `web/artwork/` 查看全部原创抽象示意卡；它们是识别用的中文信息卡，不模拟官方游戏原图。
