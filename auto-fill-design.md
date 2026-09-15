# 自动填报功能设计文档

## 目标
识别后一键自动将数据填入腾讯文档表格，无需手动复制粘贴。

## 技术方案
Electron 内嵌浏览器 + 预加载脚本自动化

### 流程
1. 用户在 Settings 中配置腾讯文档 URL
2. 识别结果确认后，点击"自动填报"按钮
3. 主进程创建新 BrowserWindow 加载腾讯文档
4. 预加载脚本注入页面，接收数据后自动填写

### 填报策略（腾讯文档 Canvas 表格）
腾讯文档表格使用 Canvas 渲染，单元格编辑时创建 `<input>` 覆盖层：

1. **滚动到底部** → 找到最后一行的大致位置
2. **模拟点击** → 使用 `elementFromPoint` 或坐标点击激活单元格
3. **等待输入框出现** → 查找 `.sheet-cell-editor input` 或类似元素
4. **输入值** → 设置 value + 触发 input 事件
5. **按 Tab 切换** → 模拟键盘 Tab 切换到下一列
6. **重复直到填完所有字段**

### 容错机制
- 提供"调试模式"：显示每个填报步骤的日志
- 如果自动填报失败，回退到手动粘贴 TSV
- 填报前让用户确认目标行

## 实现模块

### Module 1: Electron 后端
- `electron/main.ts`：添加 `auto-fill:open` 和 `auto-fill:send-data` IPC
- `electron/auto-fill-preload.ts`：填报窗口的预加载脚本，暴露填报 API
- `electron/auto-fill.ts`：主进程中的填报窗口管理

### Module 2: 前端 UI
- `src/components/ResultForm.tsx`：添加"自动填报"按钮 + 进度显示
- `src/components/Settings.tsx`：添加腾讯文档 URL 配置 + 调试模式开关
- `src/hooks/useAutoFill.ts`：自动填报状态管理 Hook
- `src/App.tsx`：集成自动填报逻辑

## 数据流
```
用户点击"自动填报"
  ↓
useAutoFill.openFillWindow(record)
  ↓
IPC: auto-fill:open → main.ts
  ↓
创建 BrowserWindow，加载腾讯文档 URL
  ↓
页面加载完成 → 发送填报数据到预加载脚本
  ↓
auto-fill-preload.ts 执行填报逻辑
  ↓
逐列点击 → 输入 → Tab 切换
  ↓
填报完成 / 报错 → 通知主进程 → 通知前端
```
