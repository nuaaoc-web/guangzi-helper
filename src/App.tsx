import React, { useState, useCallback, useEffect } from 'react';
import {
  AdRecord,
  DEFAULT_RECORD,
  ACCOUNT_OPTIONS
} from './types';
import { useOCR } from './hooks/useOCR';
import { useLLM } from './hooks/useLLM';
import { useAutoFill } from './hooks/useAutoFill';
import { fileToBase64 } from './utils/imageProcessor';
import { recordToTSVLine, copyToClipboard, recordsToClipboard } from './utils/tsvExport';

import ImageUploader from './components/ImageUploader';
import TextInput from './components/TextInput';
import ResultForm from './components/ResultForm';
import StashList from './components/StashList';
import SettingsPanel from './components/Settings';

import {
  Settings,
  Image as ImageIcon,
  Type,
  Zap
} from 'lucide-react';

type InputMode = 'image' | 'text';

export default function App() {
  // 输入模式
  const [inputMode, setInputMode] = useState<InputMode>('image');

  // 图片预览
  const [preview, setPreview] = useState<string | null>(null);

  // 批量图片
  const [batchImages, setBatchImages] = useState<(string | File)[]>([]);
  const [batchResults, setBatchResults] = useState<AdRecord[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [record, setRecord] = useState<AdRecord>({ ...DEFAULT_RECORD });

  // 暂存列表
  const [stashList, setStashList] = useState<AdRecord[]>([]);

  // OCR 原始文本
  const [rawText, setRawText] = useState('');

  // 面板开关
  const [showSettings, setShowSettings] = useState(false);

  // 提示消息
  const [toast, setToast] = useState<string | null>(null);

  // Hooks
  const { text: ocrText, loading: ocrLoading, error: ocrError, progress: ocrProgress, recognize, reset: resetOCR } = useOCR();
  const { record: llmRecord, loading: llmLoading, error: llmError, parse: parseLLM, reset: resetLLM } = useLLM();
  const { openFillWindow, reset: resetAutoFill } = useAutoFill();

  // 显示提示
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 处理图片选择（预览，不立即识别）
  const handleImageSelect = useCallback(async (imageData: string | File) => {
    resetOCR();
    resetLLM();
    resetAutoFill();
    setRawText('');
    setRecord({ ...DEFAULT_RECORD });
    setBatchImages([]);
    setBatchResults([]);
    setBatchLoading(false);

    if (imageData instanceof File) {
      const base64 = await fileToBase64(imageData);
      setPreview(base64);
    } else {
      setPreview(imageData);
    }
  }, [resetOCR, resetLLM, resetAutoFill]);

  // 处理批量图片
  const handleBatchImages = useCallback((images: (string | File)[]) => {
    setBatchImages(images);
    setBatchResults([]);
    setPreview(null);
    setRawText('');
    setRecord({ ...DEFAULT_RECORD });
    resetOCR();
    resetLLM();
    resetAutoFill();
  }, [resetOCR, resetLLM, resetAutoFill]);

  // 批量识别并复制
  const handleBatchRecognizeAndCopy = useCallback(async () => {
    if (batchImages.length === 0) return;

    setBatchLoading(true);
    const results: AdRecord[] = [];

    for (let i = 0; i < batchImages.length; i++) {
      const image = batchImages[i];
      try {
        showToast(`正在识别第 ${i + 1}/${batchImages.length} 张...`);

        let imageSrc: string;
        if (image instanceof File) {
          imageSrc = await fileToBase64(image);
        } else {
          imageSrc = image;
        }

        const text = await recognize(imageSrc);
        const parsed = await parseLLM(text);
        results.push(parsed);
      } catch (err) {
        showToast(`第 ${i + 1} 张识别失败，跳过`);
      }
    }

    setBatchResults(results);
    setBatchLoading(false);

    if (results.length > 0) {
      const tsvLines = results.map(recordToTSVLine).join('\n');
      const success = await copyToClipboard(tsvLines);
      if (success) {
        showToast(`已批量识别 ${results.length} 张，TSV 已复制到剪贴板`);
      } else {
        showToast('批量识别完成，但复制失败');
      }
    } else {
      showToast('批量识别失败，没有成功识别任何图片');
    }
  }, [batchImages, recognize, parseLLM, showToast]);

  // 清除预览
  const handleClearPreview = useCallback(() => {
    setPreview(null);
    resetOCR();
    resetAutoFill();
    setRawText('');
    setRecord({ ...DEFAULT_RECORD });
    setBatchImages([]);
    setBatchResults([]);
    setBatchLoading(false);
  }, [resetOCR, resetAutoFill]);

  // 开始 OCR 识别
  const handleStartOCR = useCallback(async () => {
    if (!preview) return;
    try {
      const text = await recognize(preview);
      setRawText(text);
      // OCR 完成后自动调用 LLM 解析
      const parsed = await parseLLM(text);
      setRecord(parsed);
      showToast('识别完成，已自动解析');
    } catch (err) {
      showToast(ocrError || '识别失败，请重试');
    }
  }, [preview, recognize, parseLLM, ocrError, showToast]);

  // 识别并复制
  const handleRecognizeAndCopy = useCallback(async () => {
    if (!preview) return;
    try {
      const text = await recognize(preview);
      setRawText(text);
      const parsed = await parseLLM(text);
      setRecord(parsed);

      const tsv = recordToTSVLine(parsed);
      const success = await copyToClipboard(tsv);
      if (success) {
        showToast('已识别并复制到剪贴板');
      } else {
        showToast('识别完成，但复制失败');
      }
    } catch (err) {
      showToast(ocrError || '识别失败，请重试');
    }
  }, [preview, recognize, parseLLM, ocrError, showToast]);

  // 文字输入解析
  const handleTextParse = useCallback(async (text: string) => {
    resetOCR();
    resetAutoFill();
    setPreview(null);
    setBatchImages([]);
    setBatchResults([]);
    setBatchLoading(false);
    setRawText(text);
    try {
      const parsed = await parseLLM(text);
      setRecord(parsed);
      showToast('解析完成');
    } catch (err) {
      showToast('解析失败，请检查文本内容');
    }
  }, [parseLLM, resetOCR, resetAutoFill, showToast]);

  // 添加到暂存列表
  const handleAddToStash = useCallback(() => {
    setStashList(prev => [...prev, { ...record }]);
    setRecord({ ...DEFAULT_RECORD });
    setRawText('');
    showToast(`已添加到暂存列表（共 ${stashList.length + 1} 条）`);
  }, [record, stashList.length, showToast]);

  // 从暂存列表删除
  const handleRemoveFromStash = useCallback((index: number) => {
    setStashList(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 编辑暂存项（加载到表单，不从暂存列表删除）
  const handleEditStashItem = useCallback((index: number) => {
    const item = stashList[index];
    if (item) {
      setRecord({ ...item });
      showToast('已加载到编辑区，修改后可重新添加');
    }
  }, [stashList, showToast]);

  // 复制全部暂存记录
  const handleCopyAllStash = useCallback(async () => {
    if (stashList.length === 0) return;
    const success = await recordsToClipboard(stashList);
    if (success) {
      showToast(`已复制 ${stashList.length} 条记录到剪贴板`);
    } else {
      showToast('复制失败，请重试');
    }
  }, [stashList, showToast]);

  // 清空暂存列表
  const handleClearStash = useCallback(() => {
    if (window.confirm('确定要清空暂存列表吗？')) {
      setStashList([]);
      showToast('暂存列表已清空');
    }
  }, [showToast]);

  // 打开腾讯文档
  const handleOpenDoc = useCallback(async () => {
    try {
      await openFillWindow(record);
      showToast('已打开腾讯文档填报窗口');
    } catch (err) {
      const message = err instanceof Error ? err.message : '打开文档失败';
      showToast(message);
    }
  }, [record, openFillWindow, showToast]);

  // 切换输入模式
  const switchMode = useCallback((mode: InputMode) => {
    setInputMode(mode);
    resetAutoFill();
    if (mode === 'image') {
      setRawText('');
    } else {
      setPreview(null);
      resetOCR();
    }
    setRecord({ ...DEFAULT_RECORD });
    setBatchImages([]);
    setBatchResults([]);
    setBatchLoading(false);
  }, [resetOCR, resetAutoFill]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 - macOS 交通灯按钮避让（仅 Electron 窗口需要）：左侧留 80px 空间 */}
      <header className={`bg-white border-b border-gray-200 sticky top-0 z-40 ${typeof window !== 'undefined' && window.electronAPI ? 'pl-20' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">广子填报助手</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in-down">
          {toast}
        </div>
      )}

      {/* 主内容区 - 可滚动 */}
      <main className="flex-1 overflow-y-auto max-h-[calc(100vh-3.5rem)] max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">
          {/* 左侧输入区 */}
          <div className="flex-1 max-w-2xl">
            {/* 模式切换 */}
            <div className="bg-white rounded-xl border border-gray-200 p-1 mb-4 flex gap-1">
              <button
                onClick={() => switchMode('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === 'image'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                截图识别
              </button>
              <button
                onClick={() => switchMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === 'text'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Type className="w-4 h-4" />
                文字输入
              </button>
            </div>

            <div className="card">
              {inputMode === 'image' ? (
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  onBatchImages={handleBatchImages}
                  onStartOCR={handleStartOCR}
                  onBatchRecognizeAndCopy={handleBatchRecognizeAndCopy}
                  preview={preview}
                  onClearPreview={handleClearPreview}
                  ocrLoading={ocrLoading}
                  ocrProgress={ocrProgress}
                  batchLoading={batchLoading}
                />
              ) : (
                <TextInput
                  onParse={handleTextParse}
                  loading={llmLoading}
                />
              )}
            </div>
          </div>

          {/* 右侧结果区 */}
          <div className="flex-1 max-w-2xl flex flex-col gap-4">
            {/* 上半：当前编辑表单 */}
            <div className="card">
              <ResultForm
                record={record}
                onChange={setRecord}
                onAddToStash={handleAddToStash}
                stashCount={stashList.length}
                rawText={rawText}
                parsing={llmLoading}
              />
            </div>

            {/* 下半：暂存列表 */}
            <div className="card">
              <StashList
                stashList={stashList}
                onRemove={handleRemoveFromStash}
                onEdit={handleEditStashItem}
                onCopyAll={handleCopyAllStash}
                onClear={handleClearStash}
                onOpenDoc={handleOpenDoc}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 设置面板 */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
