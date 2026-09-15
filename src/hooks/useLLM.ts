import { useState, useCallback } from 'react';
import { AdRecord } from '../types';
import { parseTextToRecord, isRecordValid, mergeWithDefaults } from '../utils/parser';
import { getSetting } from '../utils/settingsStorage';

interface UseLLMReturn {
  record: AdRecord | null;
  loading: boolean;
  error: string | null;
  parse: (rawText: string) => Promise<AdRecord>;
  reset: () => void;
}

function buildSystemPrompt(): string {
  const year = new Date().getFullYear();
  return `你是一个专业的广告商务合作信息提取助手。请从用户提供的文本（可能是小红书/抖音商务合作截图的OCR结果或用户粘贴的对话内容）中提取以下字段，并返回严格的 JSON 格式。

字段说明：
- date: 日期，格式如"${year}年06月15日"。如果文本中没有年份，使用${year}。
- account: 账号类型，必须是"小红书大号"、"小红书小号"或"抖音大号"之一。
- productName: 产品名称。
- category: 品类，如宠物食品、宠物用品、美妆、家居等。
- brandIndustry: 品牌行业，默认"宠物"如果未明确提及。
- reportType: 提报类型（合作类型），必须是"报备视频"、"非报备视频"、"图文"或"直播"之一。
- price: 价格（纯数字，不要单位）。如果文本中有多个价格（如"1500+直播500+图文1000"），请计算总和。支持"万"单位（如2.5万=25000）。
- rebate: 返点比例（纯数字，0-100之间），如"返点40%"则返回40。
- channel: 渠道，必须是"邀约"、"中介询问"或"品牌询问"之一。
- status: 状态，默认"未选中"。
- remark: 备注（其他合作细节、品牌名、特殊要求等）。

注意：
1. 只返回 JSON 对象，不要任何其他文字、markdown 代码块或解释。
2. 如果某个字段无法提取，使用空字符串或 null。
3. 价格提取时只返回数字，不要单位。
4. 返回格式示例：
{"date":"${year}年06月15日","account":"小红书大号","productName":"某品牌猫粮","category":"宠物食品","brandIndustry":"宠物","reportType":"报备视频","price":3500,"rebate":40,"channel":"邀约","status":"未选中","remark":""}`;
}

async function callLLM(
  rawText: string,
  apiKey: string,
  apiEndpoint: string,
  model: string
): Promise<AdRecord> {
  const prompt = buildSystemPrompt();

  const response = await fetch(`${apiEndpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: rawText },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content || '';

  if (!content) {
    throw new Error('API 返回内容为空');
  }

  let parsed: unknown;
  try {
    const cleanContent = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    parsed = JSON.parse(cleanContent);
  } catch (parseErr) {
    throw new Error('API 返回格式错误，无法解析 JSON');
  }

  const partial = parsed as Record<string, unknown>;

  const partialRecord: Partial<AdRecord> = {
    ...partial,
    price: partial.price !== null && partial.price !== undefined ? Number(partial.price) : null,
    rebate: partial.rebate !== null && partial.rebate !== undefined ? Number(partial.rebate) : null,
  };

  return mergeWithDefaults(partialRecord);
}

export function useLLM(): UseLLMReturn {
  const [record, setRecord] = useState<AdRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (rawText: string): Promise<AdRecord> => {
    setLoading(true);
    setError(null);
    setRecord(null);

    try {
      // 分别读取设置（与 Settings 面板保存的 key 一致）
      const apiKey = await getSetting<string>('apiKey', '');
      const apiEndpoint = await getSetting<string>('apiEndpoint', 'https://api.moonshot.cn/v1');
      const model = await getSetting<string>('model', 'moonshot-v1-8k');

      if (!apiKey) {
        throw new Error('API Key 未设置，请先在设置面板中配置');
      }

      let result: AdRecord;
      try {
        result = await callLLM(rawText, apiKey, apiEndpoint, model);
      } catch (firstErr) {
        // 失败时重试一次，等待 1 秒
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await callLLM(rawText, apiKey, apiEndpoint, model);
      }

      setRecord(result);
      setLoading(false);
      return result;
    } catch (err) {
      // 如果 LLM 完全失败，尝试使用本地规则解析作为 fallback
      try {
        const fallback = parseTextToRecord(rawText);
        if (isRecordValid(fallback)) {
          setRecord(fallback);
          setLoading(false);
          return fallback;
        }
      } catch (fallbackErr) {
        // 忽略 fallback 错误
      }

      const message = err instanceof Error ? err.message : 'LLM 解析失败';
      setError(message);
      setLoading(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setRecord(null);
    setLoading(false);
    setError(null);
  }, []);

  return { record, loading, error, parse, reset };
}

export default useLLM;
