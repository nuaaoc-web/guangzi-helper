# 广子填报助手

智能广告商务合作信息填报工具 —— 从截图或文字中自动提取广告合作信息，一键复制到腾讯文档表格。

## 功能特性

- 📸 **截图识别**：拖拽/粘贴商务合作截图，自动 OCR 提取文字
- 🤖 **智能解析**：调用 AI（Kimi API）从文字中提取结构化信息（日期、产品、价格、返点等）
- ✏️ **表单编辑**：识别结果可手动确认和修改
- 📋 **一键复制**：复制为 TSV 格式，直接粘贴到腾讯文档/Excel 表格
- 📚 **历史记录**：保存已识别的记录，随时复用
- 💾 **本地存储**：所有数据本地保存，不上传隐私信息

## 针对场景

专门为小红书/抖音博主设计，用于维护「广子统计表」：

| 字段 | 说明 |
|------|------|
| 日期 | 合作日期 |
| 提报号 | 小红书大号/小号/抖音大号 |
| 产品名称 | 合作品牌产品 |
| 品类 | 宠物、美妆、家居等 |
| 品牌行业 | 宠物、食品、数码等 |
| 提报类型 | 报备视频/非报备视频/图文/直播 |
| 价格 | 合作报价 |
| 返点 | 返点比例（%）|
| 渠道 | 邀约/中介询问/品牌询问 |
| 状态 | 未选中/已选中/已执行/不可执行/等待中 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

> 如果遇到 Electron 下载超时，先设置镜像源：
> ```bash
> export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
> npm install
> ```

### 2. 开发模式启动

```bash
npm run dev
```

### 3. 打包应用

```bash
npm run electron:build
```

打包后的应用位于 `release/` 目录：
- macOS: `release/广子填报助手-x.x.x.dmg`
- Windows: `release/广子填报助手 Setup x.x.x.exe`

## 使用流程

### 方式一：截图识别

1. 打开应用，切换到「截图识别」模式
2. 拖拽或粘贴（Ctrl+V）商务合作截图到上传区域
3. 点击「开始识别」→ OCR 提取文字
4. 自动调用 AI 解析出结构化字段
5. 检查并编辑识别结果
6. 点击「一键复制 TSV」
7. 切换到腾讯文档表格，在最后一行粘贴（Ctrl+V）

### 方式二：文字输入

1. 切换到「文字输入」模式
2. 粘贴商务合作对话/报价单文字
3. 点击「智能解析」
4. 检查并编辑结果
5. 一键复制到剪贴板

### 配置 AI 解析（首次使用）

1. 点击右上角 ⚙️ 设置按钮
2. 输入 Kimi API Key（从 [platform.moonshot.cn](https://platform.moonshot.cn) 获取）
3. 默认端点 `https://api.moonshot.cn/v1`，模型 `moonshot-v1-8k`
4. 点击保存

## 技术栈

- **Electron** — 桌面应用框架
- **React 18 + TypeScript + Vite** — 前端技术栈
- **Tailwind CSS** — 样式框架
- **Tesseract.js** — 本地 OCR 引擎（无需联网）
- **Kimi API** — AI 智能解析（需配置 API Key）

## 项目结构

```
guangzi-helper/
├── electron/              # Electron 主进程
│   ├── main.ts           # 主进程入口
│   └── preload.ts        # 安全预加载脚本
├── src/
│   ├── components/       # React 组件
│   ├── hooks/            # 自定义 Hooks
│   ├── utils/            # 工具函数
│   ├── types.ts          # 类型定义
│   └── App.tsx           # 主应用
├── package.json
├── vite.config.ts
└── electron-builder.yml   # 打包配置
```

## 注意事项

1. **Tesseract.js 首次使用**需要下载中文训练数据（约 10MB），请保持网络连接，下载后自动缓存
2. **API Key 安全**：API Key 保存在本地 electron-store 中，不会上传到任何服务器
3. **OCR 准确率**：复杂背景截图识别效果可能不佳，建议使用文字输入模式作为备选

## 许可证

MIT
