import React, { useState, useEffect, useCallback } from 'react';
import { AdRecord, ACCOUNT_OPTIONS, STATUS_OPTIONS, CHANNEL_OPTIONS, REPORT_TYPE_OPTIONS } from '../types';
import { Copy, Check, Plus, Inbox, Loader2 } from 'lucide-react';
import { recordToTSVLine, copyToClipboard } from '../utils/tsvExport';
import CustomSelect from './CustomSelect';

interface ResultFormProps {
  record: AdRecord;
  onChange: (record: AdRecord) => void;
  onAddToStash: () => void;
  rawText: string;
  parsing: boolean;
  stashCount?: number;
}

export default function ResultForm({
  record,
  onChange,
  onAddToStash,
  rawText,
  parsing,
  stashCount
}: ResultFormProps) {
  const [copied, setCopied] = useState(false);

  // 重置复制状态
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleFieldChange = useCallback((field: keyof AdRecord, value: string | number | null) => {
    onChange({ ...record, [field]: value });
  }, [record, onChange]);

  const handleCopyTSV = useCallback(async () => {
    const tsv = recordToTSVLine(record);
    const success = await copyToClipboard(tsv);
    if (success) setCopied(true);
  }, [record]);

  const inputClass = "input-field";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-4">
      <h3 className="section-title">识别结果</h3>

      {parsing && (
        <div className="flex items-center gap-2 text-sm text-primary-600 p-3 bg-primary-50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>正在智能解析中...</span>
        </div>
      )}

      {rawText && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">原始文本</p>
          <p className="text-sm text-gray-700 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
            {rawText}
          </p>
        </div>
      )}

      {stashCount !== undefined && stashCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-green-700 p-3 bg-green-50 rounded-lg border border-green-100">
          <Inbox className="w-4 h-4 shrink-0" />
          <span>暂存列表已有 {stashCount} 条记录，确认后可一键复制全部</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* 日期 */}
        <div className="col-span-2">
          <label className={labelClass}>日期</label>
          <input
            type="text"
            value={record.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            className={inputClass}
            placeholder="2024年01月15日"
          />
        </div>

        {/* 账号 */}
        <CustomSelect
          label="账号"
          value={record.account}
          options={ACCOUNT_OPTIONS}
          onChange={(v) => handleFieldChange('account', v)}
        />

        {/* 产品名称 */}
        <div>
          <label className={labelClass}>产品名称</label>
          <input
            type="text"
            value={record.productName}
            onChange={(e) => handleFieldChange('productName', e.target.value)}
            className={inputClass}
            placeholder="如：猫粮、猫罐头"
          />
        </div>

        {/* 品类 */}
        <div>
          <label className={labelClass}>品类</label>
          <input
            type="text"
            value={record.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            className={inputClass}
            placeholder="如：宠物、美妆"
          />
        </div>

        {/* 品牌行业 */}
        <div>
          <label className={labelClass}>品牌行业</label>
          <input
            type="text"
            value={record.brandIndustry}
            onChange={(e) => handleFieldChange('brandIndustry', e.target.value)}
            className={inputClass}
            placeholder="如：宠物、美妆护肤"
          />
        </div>

        {/* 提报类型 */}
        <CustomSelect
          label="提报类型"
          value={record.reportType}
          options={REPORT_TYPE_OPTIONS}
          onChange={(v) => handleFieldChange('reportType', v)}
        />

        {/* 价格 */}
        <div>
          <label className={labelClass}>价格</label>
          <input
            type="number"
            value={record.price !== null ? record.price : ''}
            onChange={(e) => handleFieldChange('price', e.target.value ? parseInt(e.target.value, 10) : null)}
            className={inputClass}
            placeholder="如：3500"
            min={0}
          />
        </div>

        {/* 返点 */}
        <div>
          <label className={labelClass}>返点 (%)</label>
          <input
            type="number"
            value={record.rebate !== null ? record.rebate : ''}
            onChange={(e) => handleFieldChange('rebate', e.target.value ? parseInt(e.target.value, 10) : null)}
            className={inputClass}
            placeholder="如：40"
            min={0}
            max={100}
          />
        </div>

        {/* 渠道 */}
        <CustomSelect
          label="渠道"
          value={record.channel}
          options={CHANNEL_OPTIONS}
          onChange={(v) => handleFieldChange('channel', v)}
        />

        {/* 状态 */}
        <CustomSelect
          label="状态"
          value={record.status}
          options={STATUS_OPTIONS}
          onChange={(v) => handleFieldChange('status', v)}
        />

        {/* 备注 */}
        <div className="col-span-2">
          <label className={labelClass}>备注</label>
          <textarea
            value={record.remark}
            onChange={(e) => handleFieldChange('remark', e.target.value)}
            className={inputClass + " min-h-[80px] resize-y"}
            placeholder="其他备注信息..."
          />
        </div>
      </div>

      {/* 底部操作按钮 - 两个等宽按钮 */}
      <div className="flex gap-3 pt-4 pb-2 mt-2">
        <button
          onClick={handleCopyTSV}
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-600">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              📋 复制当前 TSV
            </>
          )}
        </button>
        <button
          onClick={onAddToStash}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          ➕ 添加到暂存列表
        </button>
      </div>
    </div>
  );
}