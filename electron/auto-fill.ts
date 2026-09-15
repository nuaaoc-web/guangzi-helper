import { BrowserWindow } from 'electron';
import path from 'path';
import { AdRecord } from '../src/types';

/**
 * 自动填报窗口管理模块
 * 负责创建、管理和关闭腾讯文档填报窗口
 */

let fillWindow: BrowserWindow | null = null;

/**
 * 创建填报窗口并加载腾讯文档
 */
export function createFillWindow(url: string, record: AdRecord): BrowserWindow {
  // 如果已有填报窗口，先关闭
  if (fillWindow && !fillWindow.isDestroyed()) {
    fillWindow.close();
    fillWindow = null;
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
      allowRunningInsecureContent: true,
    },
    show: true,
    backgroundColor: '#ffffff',
  });

  // 加载腾讯文档 URL
  fillWindow.loadURL(url);

  // 窗口关闭时清理引用
  fillWindow.on('closed', () => {
    fillWindow = null;
  });

  return fillWindow;
}

/**
 * 向填报窗口发送数据
 */
export function sendFillData(window: BrowserWindow, record: AdRecord): void {
  if (window.isDestroyed()) {
    throw new Error('填报窗口已关闭');
  }

  // 等待页面加载完成后再发送数据
  if (window.webContents.isLoading()) {
    window.webContents.once('did-finish-load', () => {
      window.webContents.send('auto-fill:data', record);
    });
  } else {
    window.webContents.send('auto-fill:data', record);
  }
}

/**
 * 关闭填报窗口
 */
export function closeFillWindow(window: BrowserWindow): void {
  if (!window.isDestroyed()) {
    window.close();
  }
  if (fillWindow === window) {
    fillWindow = null;
  }
}

/**
 * 获取当前填报窗口
 */
export function getFillWindow(): BrowserWindow | null {
  return fillWindow && !fillWindow.isDestroyed() ? fillWindow : null;
}
