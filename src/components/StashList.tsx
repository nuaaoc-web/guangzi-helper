import React from 'react';
import { AdRecord } from '../types';
import { ClipboardList, Pencil, X, Copy, ExternalLink, Inbox, Trash2 } from 'lucide-react';

interface StashListProps {
  stashList: AdRecord[];
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onCopyAll: () => void;
  onClear: () => void;
  onOpenDoc: () => void;
}

export default function StashList({
  stashList,
  onRemove,
  onEdit,
  onCopyAll,
  onClear,
  onOpenDoc
}: StashListProps) {
  return (
    <div className="space-y-3">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h3 className="section-title flex items-center gap-2 mb-0">
          <ClipboardList className="w-5 h-5 text-primary-500" />
          暂存列表
          <span className="text-sm font-normal text-gray-500">({stashList.length})</span>
        </h3>
        {stashList.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            title="清空暂存列表"
          >
            <Trash2 className="w-3 h-3" />
            清空
          </button>
        )}
      </div>

      {/* 空状态 */}
      {stashList.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm flex flex-col items-center gap-2">
          <Inbox className="w-8 h-8 text-gray-300" />
          <span>暂无暂存记录，识别结果确认后可添加到这里</span>
        </div>
      ) : (
        <>
          {/* 列表 */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {stashList.map((item, index) => (
              <div
                key={`stash_${index}`}
                className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 flex items-start justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="text-gray-700">{item.date}</span>
                    <span className="font-medium text-gray-900 truncate">
                      {item.productName || '未命名产品'}
                    </span>
                    <span className="text-gray-600 whitespace-nowrap">
                      {item.price !== null ? `¥${item.price}` : '-'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>{item.account}</span>
                    <span>·</span>
                    <span>{item.reportType}</span>
                    <span>·</span>
                    <span>返点{item.rebate !== null ? `${item.rebate}%` : '-'}</span>
                    <span>·</span>
                    <span>{item.channel}</span>
                    <span>·</span>
                    <span>{item.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEdit(index)}
                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    title="编辑"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemove(index)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="删除"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 底部操作区 */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-500 text-center">
              点击复制后，打开腾讯文档表格直接粘贴到最后一行
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCopyAll}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                📋 一键复制全部 TSV
              </button>
              <button
                onClick={onOpenDoc}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                🚀 打开腾讯文档
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
