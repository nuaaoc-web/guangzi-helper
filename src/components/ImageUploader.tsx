import React, { useRef, useCallback, useState } from 'react';
import { Upload, Image, X, ScanText, Loader2, Rocket } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (imageData: string | File) => void;
  onStartOCR: () => void;
  preview: string | null;
  onClearPreview: () => void;
  ocrLoading: boolean;
  ocrProgress: number;
  onBatchImages?: (images: (string | File)[]) => void;
  onBatchRecognizeAndCopy?: () => void;
  batchLoading?: boolean;
}

export default function ImageUploader({
  onImageSelect,
  onStartOCR,
  preview,
  onClearPreview,
  ocrLoading,
  ocrProgress,
  onBatchImages,
  onBatchRecognizeAndCopy,
  batchLoading
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const readFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addImages = useCallback(async (imageFiles: File[]) => {
    if (imageFiles.length === 0) return;

    const newBase64s = await Promise.all(imageFiles.map(readFileToBase64));

    setPendingImages(prev => {
      const updated = [...prev, ...newBase64s];
      if (prev.length === 0 && imageFiles.length === 1) {
        onImageSelect(newBase64s[0]);
      } else {
        onBatchImages?.(updated);
      }
      return updated;
    });
  }, [onImageSelect, onBatchImages]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    addImages(imageFiles);

    e.target.value = '';
  }, [addImages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addImages(files);
  }, [addImages]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    addImages(imageFiles);
  }, [addImages]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDeleteImage = useCallback((index: number) => {
    setPendingImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        onClearPreview();
      } else if (updated.length === 1) {
        // 只剩一张时，切回单张模式
        onImageSelect(updated[0]);
      } else {
        // 批量模式更新
        onBatchImages?.(updated);
      }
      return updated;
    });
  }, [onClearPreview, onImageSelect, onBatchImages]);

  const handleClearAll = useCallback(() => {
    setPendingImages([]);
    onClearPreview();
  }, [onClearPreview]);

  const isLoading = ocrLoading || batchLoading;

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <h3 className="section-title flex items-center gap-2">
        <Image className="w-5 h-5 text-primary-500" />
        截图识别
      </h3>

      {/* 上传区域 — 没有图片时显示 */}
      {pendingImages.length === 0 && !preview && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
          `}
        >
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            拖拽图片到此处，或点击上传
          </p>
          <p className="text-xs text-gray-500">
            也支持 Ctrl+V 粘贴截图（支持多张）
          </p>
        </div>
      )}

      {/* 批量缩略图列表 */}
      {pendingImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              共 {pendingImages.length} 张图片
            </p>
            <button
              onClick={handleClearAll}
              className="text-xs text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
            >
              全部清除
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {pendingImages.slice(0, 6).map((img, index) => (
              <div
                key={`${img.slice(0, 40)}_${index}`}
                className="relative rounded-lg overflow-hidden aspect-square border border-gray-200 group"
              >
                <img
                  src={img}
                  alt={`预览 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-1 right-1 p-1 bg-gray-900/60 hover:bg-gray-900/80 rounded-md text-white transition-colors opacity-0 group-hover:opacity-100"
                  title="删除"
                >
                  <X className="w-3 h-3" />
                </button>
                {index === 0 && pendingImages.length > 1 && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary-500 text-white text-[10px] rounded font-medium">
                    首图
                  </span>
                )}
              </div>
            ))}
            {pendingImages.length > 6 && (
              <div className="relative rounded-lg overflow-hidden aspect-square bg-gray-100 flex items-center justify-center border border-gray-200">
                <span className="text-sm font-medium text-gray-500">
                  +{pendingImages.length - 6}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 单张预览 — 兼容旧数据（没有 pendingImages 但有 preview） */}
      {pendingImages.length === 0 && preview && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="预览"
            className="w-full max-h-64 object-contain bg-gray-100"
          />
          <button
            onClick={onClearPreview}
            className="absolute top-2 right-2 p-1 bg-gray-900/50 hover:bg-gray-900/70 rounded-lg text-white transition-colors"
            title="清除"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 加载进度 */}
      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-primary-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{batchLoading ? '正在批量识别...' : `正在识别... ${ocrProgress}%`}</span>
          </div>
          {!batchLoading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={onStartOCR}
          disabled={pendingImages.length === 0 && !preview || isLoading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <ScanText className="w-4 h-4" />
          {isLoading ? '识别中...' : '开始识别'}
        </button>
        {pendingImages.length > 1 && (
          <button
            onClick={onBatchRecognizeAndCopy}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Rocket className="w-4 h-4" />
            {batchLoading ? '批量识别中...' : '🚀 批量识别并复制'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
