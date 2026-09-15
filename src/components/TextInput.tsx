import React, { useState, useCallback } from 'react';
import { MessageSquare, Sparkles, Loader2 } from 'lucide-react';

interface TextInputProps {
  onParse: (text: string) => void;
  loading: boolean;
}

export default function TextInput({ onParse, loading }: TextInputProps) {
  const [text, setText] = useState('');

  const handleParse = useCallback(() => {
    if (text.trim()) {
      onParse(text.trim());
    }
  }, [text, onParse]);

  return (
    <div className="space-y-4">
      <h3 className="section-title flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary-500" />
        文字输入
      </h3>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`示例：
1月15日 小红书大号
品名：猫罐头
品类：宠物食品
品牌：xx宠物
报备视频 3500
返点40%
渠道：邀约
备注：e猫利利妈合作`}
          className="input-field min-h-[200px] resize-y font-mono text-sm leading-relaxed"
          disabled={loading}
        />
        {text.length > 0 && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {text.length} 字
          </div>
        )}
      </div>

      <button
        onClick={handleParse}
        disabled={!text.trim() || loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            解析中...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            智能解析
          </>
        )}
      </button>
    </div>
  );
}
