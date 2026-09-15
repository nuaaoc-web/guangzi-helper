/**
 * 设置存储兼容层
 * Electron 环境使用 electronAPI.store（electron-store 持久化）
 * 浏览器环境（GitHub Pages）降级使用 localStorage
 */

const PREFIX = 'gz:';

/**
 * 读取设置项
 * @param key 设置键名
 * @param defaultValue 默认值（读取失败或不存在时返回）
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    if (typeof window !== 'undefined' && window.electronAPI?.store?.get) {
      const value = await window.electronAPI.store.get(key);
      return (value !== undefined && value !== null ? value : defaultValue) as T;
    }
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 保存设置项
 * @param key 设置键名
 * @param value 要保存的值
 */
export async function setSetting(key: string, value: unknown): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.electronAPI?.store?.set) {
      await window.electronAPI.store.set(key, value);
      return;
    }
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`保存设置 ${key} 失败:`, err);
  }
}
