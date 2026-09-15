import { contextBridge, ipcRenderer } from 'electron';

/**
 * 预加载脚本：自动填报腾讯文档表格
 * 简化版：仅保留 IPC 监听与 API 暴露，不执行任何自动填写逻辑
 */

ipcRenderer.on('auto-fill:data', (_event, record: unknown) => {
  console.log('[自动填报预加载脚本] 收到 auto-fill:data', record);
});

contextBridge.exposeInMainWorld('autoFillAPI', {
  startFill: (record: unknown) => {
    ipcRenderer.send('auto-fill:start', record);
  },
  getStatus: () => {
    return ipcRenderer.invoke('auto-fill:get-status');
  },
});

console.log('[自动填报预加载脚本] 已加载，简化模式');
