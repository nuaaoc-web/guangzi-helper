# 广子填报助手 - 技术方案

## 项目概述
Electron 桌面应用，帮助用户从商务合作截图或文字中自动提取广告合作信息，并填入腾讯文档的"广子统计表"。

## 技术栈
- **框架**: Electron + React 18 + Vite
- **UI**: Tailwind CSS
- **OCR**: Tesseract.js（本地运行，无需网络）
- **智能解析**: 调用 Kimi API / OpenAI API（结构化提取）
- **填报方式**: ① 一键复制 TSV 行粘贴到腾讯文档；② 生成 CSV 批量导入
- **构建**: Electron Forge

## 模块分解

### Stage 1 - 项目骨架
- 初始化 Electron + Vite + React 项目
- 配置 Tailwind CSS
- 配置主进程与渲染进程通信

### Stage 2 - 前端界面（渲染进程）
- 截图拖拽/粘贴上传区域
- 文字输入区域（多行文本框）
- 识别结果展示（可编辑表单，映射表格字段）
- 一键复制 TSV / 导出 CSV 按钮
- 历史记录列表

### Stage 3 - OCR 引擎
- Tesseract.js 初始化中文训练数据
- 图片预处理：灰度化、二值化提高识别率
- 截图文字识别

### Stage 4 - 智能解析模块
- 调用 LLM API（Kimi API）
- Prompt Engineering：从商务对话中提取结构化字段
- 字段映射：日期→日期、产品名→提报产品名称、价格→提报价格等
- 本地缓存 API Key（electron-store）

### Stage 5 - 数据输出与填报
- 生成 TSV 行（直接粘贴到腾讯文档表格）
- 生成 CSV 批量导出

## 数据模型
```typescript
interface AdRecord {
  seq: number;          // 序号（自动计算）
  date: string;         // 日期
  account: string;      // 提报号（小红书大号/小号/抖音大号）
  productName: string;  // 提报产品名称
  category: string;     // 产品品类
  brandIndustry: string; // 品牌行业
  reportType: string;   // 提报类型（报备视频/非报备视频）
  price: number;       // 提报价格
  rebate: number;      // 提报返点（百分比）
  channel: string;     // 渠道（邀约/中介询问/品牌询问）
  status: string;      // 当前状态（未选中/已选中/已执行/不可执行/等待中）
  remark: string;      // 备注
}
```

## 目录结构
```
guangzi-helper/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── electron/
│   ├── main.ts          # 主进程
│   └── preload.ts       # 预加载脚本
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── ImageUploader.tsx
│   │   ├── TextInput.tsx
│   │   ├── ResultForm.tsx
│   │   ├── HistoryList.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useOCR.ts
│   │   ├── useLLM.ts
│   │   └── useStorage.ts
│   ├── utils/
│   │   ├── parser.ts
│   │   ├── tsvExport.ts
│   │   └── imageProcessor.ts
│   └── types.ts
└── resources/
    └── chi_sim.traineddata  # Tesseract 中文训练数据
```
