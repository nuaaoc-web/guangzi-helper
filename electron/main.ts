import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import path from 'path';
import Store from 'electron-store';

// 初始化配置存储
const store = new Store();

let mainWindow: BrowserWindow | null = null;
let fillWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    titleBarStyle: 'hidden',
    show: false,
    backgroundColor: '#f9fafb'
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==================== 自动填报窗口（简化版：仅打开窗口） ====================

function sendStatus(message: string) {
  console.log('[自动填报]', message);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('auto-fill:status-update', message);
  }
}

function sendError(message: string) {
  console.error('[自动填报错误]', message);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('auto-fill:error-update', message);
  }
}

// 打开自动填报窗口（仅加载腾讯文档，不做自动填写）
ipcMain.handle('auto-fill:open', async (_event, payload: { url: string; record: unknown }) => {
  try {
    if (fillWindow && !fillWindow.isDestroyed()) {
      fillWindow.close();
    }

    fillWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      title: '自动填报 - 腾讯文档',
      webPreferences: {
        preload: path.join(__dirname, 'auto-fill-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false,
        allowRunningInsecureContent: true
      },
      show: true,
      backgroundColor: '#ffffff'
    });

    // 调试模式：自动打开开发者工具
    const debugMode = store.get('debugMode') as boolean | undefined;
    if (debugMode) {
      fillWindow.webContents.openDevTools();
    }

    // 加载腾讯文档页面
    await fillWindow.loadURL(payload.url);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建填报窗口失败';
    console.error('Auto-fill open error:', message);
    throw new Error(message);
  }
});

ipcMain.handle('auto-fill:close', async () => {
  if (fillWindow && !fillWindow.isDestroyed()) {
    fillWindow.close();
    fillWindow = null;
  }
  return { success: true };
});

// ==================== 配置存储 IPC 通信 ====================
ipcMain.handle('store:get', async (_event, key: string) => {
  try {
    return store.get(key);
  } catch (err) {
    console.error('Store get error:', err);
    return null;
  }
});

ipcMain.handle('store:set', async (_event, key: string, value: any) => {
  try {
    store.set(key, value);
    return true;
  } catch (err) {
    console.error('Store set error:', err);
    return false;
  }
});

ipcMain.handle('store:delete', async (_event, key: string) => {
  try {
    store.delete(key);
    return true;
  } catch (err) {
    console.error('Store delete error:', err);
    return false;
  }
});

// IPC 通信：剪贴板
ipcMain.handle('clipboard:writeText', async (_event, text: string) => {
  try {
    clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Clipboard write error:', err);
    return false;
  }
});

ipcMain.handle('clipboard:readText', async () => {
  try {
    return clipboard.readText();
  } catch (err) {
    console.error('Clipboard read error:', err);
    return '';
  }
});

// IPC 通信：文件对话框
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] }
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_event, content: string, defaultName: string) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'CSV 文件', extensions: ['csv'] },
      { name: 'TSV 文件', extensions: ['tsv'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  if (!result.canceled && result.filePath) {
    const fs = require('fs');
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return result.filePath;
  }
  return null;
});
