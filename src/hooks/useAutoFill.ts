import { useState, useCallback, useEffect } from 'react';
import { AdRecord } from '../types';
import { getSetting } from '../utils/settingsStorage';

/**
 * 自动填报 Hook
 * 管理自动填报的状态、IPC 通信和错误处理
 */

export interface UseAutoFillReturn {
  loading: boolean;
  status: string;
  error: string | null;
  openFillWindow: (record: AdRecord) => Promise<void>;
  reset: () => void;
}

export function useAutoFill(): UseAutoFillReturn {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 监听填报状态更新
  useEffect(() => {
    const removeStatus = window.electronAPI?.autoFill?.onStatus?.((message: string) => {
      setStatus(message);
    });

    const removeError = window.electronAPI?.autoFill?.onError?.((message: string) => {
      setError(message);
      setLoading(false);
    });

    const removeComplete = window.electronAPI?.autoFill?.onComplete?.(() => {
      setLoading(false);
      setStatus('填报完成');
    });

    return () => {
      removeStatus?.();
      removeError?.();
      removeComplete?.();
    };
  }, []);

  const openFillWindow = useCallback(async (record: AdRecord) => {
    setLoading(true);
    setError(null);
    setStatus('正在打开腾讯文档…');

    try {
      // 读取腾讯文档 URL（Settings 中单独保存的 key）
      const url = await getSetting<string>('tencentDocUrl', '');
      if (!url || !url.trim()) {
        throw new Error('请先在设置中配置腾讯文档 URL');
      }

      // 浏览器环境（GitHub Pages）：降级为新标签页打开
      if (typeof window !== 'undefined' && !window.electronAPI?.autoFill?.open) {
        window.open(url, '_blank');
        setStatus('已在新标签页打开腾讯文档，请手动粘贴 TSV');
        setLoading(false);
        return;
      }

      await window.electronAPI.autoFill.open(record, url);
      setStatus('已打开腾讯文档，正在填报…');
    } catch (err) {
      const message = err instanceof Error ? err.message : '自动填报失败';
      setError(message);
      setLoading(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setStatus('');
    setError(null);
  }, []);

  return {
    loading,
    status,
    error,
    openFillWindow,
    reset,
  };
}

export default useAutoFill;
