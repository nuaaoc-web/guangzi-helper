import { AdRecord, DEFAULT_RECORD } from '../types';

/**
 * 从 OCR 原始文本中提取价格信息
 * 支持格式：3500、7800、1500+直播500+图文1000、2.5万等
 * @param text OCR 识别出的原始文本
 * @returns 提取到的总价格，若无则返回 null
 */
export function extractPrice(text: string): number | null {
  if (!text) return null;

  // 先处理"万"单位
  const wanMatches = text.match(/(\d+(?:\.\d+)?)\s*万/g);
  if (wanMatches) {
    let totalWan = 0;
    for (const match of wanMatches) {
      const num = parseFloat(match.replace(/万\s*$/, '').trim());
      if (!isNaN(num)) totalWan += num;
    }
    if (totalWan > 0) return Math.round(totalWan * 10000);
  }

  // 匹配 "1500+直播500+图文1000" 这类复合价格
  const compoundPattern = /(\d+(?:\.\d+)?)\s*\+\s*([^\d]*?)(\d+(?:\.\d+)?)/g;
  const compoundMatches: number[] = [];
  let compoundMatch;
  const compoundText = text.replace(/,/g, '');
  while ((compoundMatch = compoundPattern.exec(compoundText)) !== null) {
    const prices = compoundMatch[0].match(/\d+(?:\.\d+)?/g);
    if (prices) {
      prices.forEach(p => {
        const num = parseFloat(p);
        if (!isNaN(num)) compoundMatches.push(num);
      });
    }
  }
  if (compoundMatches.length > 0) {
    return Math.round(compoundMatches.reduce((a, b) => a + b, 0));
  }

  // 匹配单个价格（排除日期中的数字）
  const pricePatterns = [
    /(?:价格|报价|费用|金额|合作费|推广费|预算)[\s:：]*(?:¥|￥|RMB|rmb)?\s*(\d[\d,]+(?:\.\d+)?)/,
    /(?:¥|￥)\s*(\d[\d,]+(?:\.\d+)?)/,
    /(?:共|合计|总计|总共|总价|总费用)[\s:：]*(?:¥|￥)?\s*(\d[\d,]+(?:\.\d+)?)/,
    /(\d[\d,]{2,}(?:\.\d+)?)\s*(?:元|块|￥|¥)/,
    /(?:\D)(\d{4,5})(?:\D|$)/, // 4-5 位数字可能是价格
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/,/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 100) return Math.round(num); // 过滤掉太小的数字
    }
  }

  return null;
}

/**
 * 从文本中提取返点比例
 * 支持格式：40%、40、40%返点、返点40等
 * @param text OCR 识别出的原始文本
 * @returns 提取到的返点比例（0-100），若无则返回 null
 */
export function extractRebate(text: string): number | null {
  if (!text) return null;

  const patterns = [
    /(?:返点|返佣|回扣|折扣|返)[\s:：]*(\d+(?:\.\d+)?)\s*%?/i,
    /(\d+(?:\.\d+)?)\s*%\s*(?:返点|返佣|回扣)/i,
    /(?:返点|返佣|回扣)[\s:：]*(\d+(?:\.\d+)?)/i,
    /(?:返\s*\d+|(\d+)\s*个点)/i,
    /(?:点位|点数)[\s:：]*(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1] || match[0].match(/\d+(?:\.\d+)?/)?.[0] || '0');
      if (!isNaN(num) && num >= 0 && num <= 100) {
        // 如果大于 1 且没有 % 符号，可能是百分比数值
        return num > 1 ? Math.round(num) : Math.round(num * 100);
      }
    }
  }

  return null;
}

/**
 * 从文本中提取日期
 * 支持格式：2024-01-15、2024.01.15、2024/01/15、1月15日、01-15等
 * @param text OCR 识别出的原始文本
 * @returns 格式化的日期字符串（YYYY年MM月DD日），若无则返回今天日期
 */
export function extractDate(text: string): string {
  if (!text) {
    return formatDateToday();
  }

  // 完整日期格式：2024-01-15、2024.01.15、2024/01/15
  const fullDateMatch = text.match(/(\d{4})[\-\./年](\d{1,2})[\-\./月](\d{1,2})日?/);
  if (fullDateMatch) {
    const year = fullDateMatch[1];
    const month = fullDateMatch[2].padStart(2, '0');
    const day = fullDateMatch[3].padStart(2, '0');
    return `${year}年${month}月${day}日`;
  }

  // 简写日期：01-15、1月15日、1.15
  const shortDateMatch = text.match(/(\d{1,2})[\-\./月](\d{1,2})日?/);
  if (shortDateMatch) {
    const year = new Date().getFullYear().toString();
    const month = shortDateMatch[1].padStart(2, '0');
    const day = shortDateMatch[2].padStart(2, '0');
    return `${year}年${month}月${day}日`;
  }

  return formatDateToday();
}

/**
 * 获取今天的格式化日期字符串
 */
function formatDateToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

/**
 * 从文本中识别账号类型
 * @param text OCR 识别出的原始文本
 * @returns 匹配到的账号类型，若无则返回默认"小红书大号"
 */
export function extractAccount(text: string): string {
  if (!text) return '小红书大号';

  const lowerText = text.toLowerCase();

  // 小红书小号
  if (/小红书\s*(?:小号|小号|副号|小号|小号)/.test(lowerText)) {
    return '小红书小号';
  }

  // 抖音大号
  if (/抖音\s*(?:大号|主号|大号)/.test(lowerText) || /^抖音/.test(lowerText)) {
    return '抖音大号';
  }

  // 小红书大号（默认）
  if (/小红书\s*(?:大号|主号|大号)/.test(lowerText) || /小红书/.test(lowerText)) {
    return '小红书大号';
  }

  return '小红书大号';
}

/**
 * 从文本中提取提报类型
 * @param text OCR 识别出的原始文本
 * @returns 匹配到的提报类型，若无则返回默认"报备视频"
 */
export function extractReportType(text: string): string {
  if (!text) return '报备视频';

  const typePatterns: { pattern: RegExp; value: string }[] = [
    { pattern: /非报备\s*视频|非报备视频|非报备/, value: '非报备视频' },
    { pattern: /报备\s*视频|报备视频|报备/, value: '报备视频' },
    { pattern: /图文\s*(?:笔记|发布|合作)/, value: '图文' },
    { pattern: /直播\s*(?:带货|合作|推广)/, value: '直播' },
    { pattern: /图文/, value: '图文' },
    { pattern: /直播/, value: '直播' },
  ];

  for (const { pattern, value } of typePatterns) {
    if (pattern.test(text)) return value;
  }

  return '报备视频';
}

/**
 * 从文本中提取渠道
 * @param text OCR 识别出的原始文本
 * @returns 匹配到的渠道，若无则返回默认"邀约"
 */
export function extractChannel(text: string): string {
  if (!text) return '邀约';

  const channelPatterns: { pattern: RegExp; value: string }[] = [
    { pattern: /中介\s*(?:询问|问|询价|推荐)/, value: '中介询问' },
    { pattern: /品牌\s*(?:询问|问|询价|方)/, value: '品牌询问' },
    { pattern: /中介/, value: '中介询问' },
    { pattern: /品牌/, value: '品牌询问' },
    { pattern: /邀约|邀请|合作邀约/, value: '邀约' },
  ];

  for (const { pattern, value } of channelPatterns) {
    if (pattern.test(text)) return value;
  }

  return '邀约';
}

/**
 * 从文本中提取状态
 * @param text OCR 识别出的原始文本
 * @returns 匹配到的状态，若无则返回默认"未选中"
 */
export function extractStatus(text: string): string {
  if (!text) return '未选中';

  const statusPatterns: { pattern: RegExp; value: string }[] = [
    { pattern: /已\s*执行|执行中|执行|已拍摄|已发布|已交付/, value: '已执行' },
    { pattern: /已\s*选中|已选|已确定|已接|已合作/, value: '已选中' },
    { pattern: /不可\s*执行|不可接|不接|拒绝|已拒绝|做不了|不行/, value: '不可执行' },
    { pattern: /等待|待定|观望|考虑|筛选中|待确认|等通知/, value: '等待中' },
    { pattern: /未\s*选中|未选|待选|未接|新提报/, value: '未选中' },
  ];

  for (const { pattern, value } of statusPatterns) {
    if (pattern.test(text)) return value;
  }

  return '未选中';
}

/**
 * 从文本中提取产品名称
 * 尝试识别品牌/产品相关关键词
 * @param text OCR 识别出的原始文本
 * @returns 提取到的产品名称，若无则返回空字符串
 */
export function extractProductName(text: string): string {
  if (!text) return '';

  // 匹配 "产品名称：xxx" 或 "品名：xxx" 等格式
  const explicitMatch = text.match(/(?:产品名称|品名|产品|商品|品牌名|品牌)[\s:：]*([^\n，。；]+)/);
  if (explicitMatch) {
    return explicitMatch[1].trim().slice(0, 50);
  }

  // 尝试匹配常见的品牌+产品组合
  const brandProductMatch = text.match(/([^\n，。；]{2,10}(?:猫粮|狗粮|猫砂|罐头|零食|玩具|用品|服饰|食品|护肤品|化妆品|家电|数码))/);
  if (brandProductMatch) {
    return brandProductMatch[1].trim().slice(0, 50);
  }

  return '';
}

/**
 * 从文本中提取品类
 * @param text OCR 识别出的原始文本
 * @returns 提取到的品类，若无则返回空字符串
 */
export function extractCategory(text: string): string {
  if (!text) return '';

  const categoryPatterns = [
    /(?:品类|类别|分类|类目)[\s:：]*([^\n，。；]+)/,
    /(宠物(?:食品|用品|玩具|服饰|护理|保健|零食|猫粮|狗粮))/,
    /(美妆|护肤|家居|数码|家电|食品|母婴|服饰|箱包|配饰|玩具)/,
  ];

  for (const pattern of categoryPatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim().slice(0, 30);
  }

  return '';
}

/**
 * 从文本中提取品牌行业
 * @param text OCR 识别出的原始文本
 * @returns 提取到的品牌行业，若无则返回默认"宠物"
 */
export function extractBrandIndustry(text: string): string {
  if (!text) return '宠物';

  const industryPatterns: { pattern: RegExp; value: string }[] = [
    { pattern: /(?:行业|领域|赛道)[\s:：]*([^\n，。；]{2,10})/, value: '' }, // 需要二次处理
    { pattern: /宠物/, value: '宠物' },
    { pattern: /母婴|孕婴/, value: '母婴' },
    { pattern: /美妆|彩妆/, value: '美妆' },
    { pattern: /护肤|护肤/, value: '护肤' },
    { pattern: /家居|家具/, value: '家居' },
    { pattern: /数码|3C|电子/, value: '数码' },
    { pattern: /家电/, value: '家电' },
    { pattern: /食品|零食|饮料/, value: '食品' },
    { pattern: /服饰|服装|穿搭/, value: '服饰' },
    { pattern: /箱包|包包|手袋/, value: '箱包' },
    { pattern: /配饰|饰品|首饰/, value: '配饰' },
    { pattern: /玩具|潮玩/, value: '玩具' },
    { pattern: /保健|健康|医药/, value: '保健' },
  ];

  for (const { pattern, value } of industryPatterns) {
    if (pattern.test(text)) {
      if (value) return value;
      // 对于正则提取型的，返回捕获组
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim().slice(0, 20);
    }
  }

  return '宠物';
}

/**
 * 从文本中提取备注信息
 * @param text OCR 识别出的原始文本
 * @returns 提取到的备注，若无则返回空字符串
 */
export function extractRemark(text: string): string {
  if (!text) return '';

  // 匹配 "备注：xxx" 或 "备注xxx" 格式
  const remarkMatch = text.match(/(?:备注|说明|补充|附注|备注信息)[\s:：]*([^\n]+)/);
  if (remarkMatch) {
    return remarkMatch[1].trim().slice(0, 200);
  }

  return '';
}

/**
 * 从文本中提取序号（提报号）
 * @param text OCR 识别出的原始文本
 * @returns 提取到的序号，若无则返回 0
 */
export function extractSeq(text: string): number {
  if (!text) return 0;

  const seqMatch = text.match(/(?:序号|提报号|编号|No|NO)[\s:：\.#]*(\d+)/);
  if (seqMatch) {
    const num = parseInt(seqMatch[1], 10);
    if (!isNaN(num)) return num;
  }

  return 0;
}

/**
 * 综合解析函数：从原始文本中尝试提取完整的 AdRecord
 * 作为 LLM 解析的 fallback 方案
 * @param rawText OCR 或用户输入的原始文本
 * @returns 解析后的 AdRecord 对象
 */
export function parseTextToRecord(rawText: string): AdRecord {
  if (!rawText || rawText.trim().length === 0) {
    return { ...DEFAULT_RECORD };
  }

  const text = rawText.trim();

  return {
    seq: extractSeq(text),
    date: extractDate(text),
    account: extractAccount(text),
    productName: extractProductName(text),
    category: extractCategory(text),
    brandIndustry: extractBrandIndustry(text),
    reportType: extractReportType(text),
    price: extractPrice(text),
    rebate: extractRebate(text),
    channel: extractChannel(text),
    status: extractStatus(text),
    remark: extractRemark(text),
  };
}

/**
 * 尝试从产品名称和文本中推断品类（如果品类为空）
 * @param productName 产品名称
 * @param text 原始文本
 * @returns 推断的品类
 */
export function inferCategory(productName: string, text: string): string {
  const combined = (productName + ' ' + text).toLowerCase();

  const categoryMap: { keywords: string[]; category: string }[] = [
    { keywords: ['猫粮', '狗粮', '猫砂', '罐头', '冻干', '零食', '磨牙', '猫条', '营养膏'], category: '宠物食品' },
    { keywords: ['玩具', '逗猫棒', '猫爬架', '猫抓板', '球', '飞盘'], category: '宠物玩具' },
    { keywords: ['沐浴露', '香波', '梳子', '指甲剪', '湿巾', '牙刷', '驱虫'], category: '宠物护理' },
    { keywords: ['窝', '垫', '床', '笼子', '饮水机', '喂食器', '背包', '牵引绳', '衣服'], category: '宠物用品' },
    { keywords: ['面膜', '精华', '水乳', '面霜', '眼霜', '口红', '粉底', '眼影'], category: '美妆护肤' },
    { keywords: ['手机', '耳机', '电脑', '平板', '相机', '智能手表', '充电宝'], category: '数码电子' },
    { keywords: ['沙发', '床垫', '四件套', '收纳', '锅', '厨具', '家电'], category: '家居生活' },
  ];

  for (const { keywords, category } of categoryMap) {
    for (const keyword of keywords) {
      if (combined.includes(keyword)) return category;
    }
  }

  return '';
}

/**
 * 清理 OCR 文本中的常见识别错误
 * @param text 原始 OCR 文本
 * @returns 清理后的文本
 */
export function cleanOCRText(text: string): string {
  if (!text) return '';

  return text
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '') // 零宽字符
    .replace(/\s+/g, ' ') // 多余空格
    .replace(/[‘'']/g, "'") // 统一引号
    .replace(/["""]/g, '"') // 统一双引号
    .replace(/[—–]/g, '-') // 统一连字符
    .replace(/[…]/g, '...') // 省略号
    .replace(/[\u3000]/g, ' ') // 全角空格转半角
    .trim();
}

/**
 * 验证提取出的 AdRecord 是否有效（至少有几个关键字段）
 * @param record 解析出的记录
 * @returns 是否有效
 */
export function isRecordValid(record: AdRecord): boolean {
  const hasPrice = record.price !== null && record.price > 0;
  const hasProduct = record.productName.trim().length > 0;
  const hasBrand = record.brandIndustry.trim().length > 0;

  return hasPrice || hasProduct || hasBrand;
}

/**
 * 将解析结果与默认值合并，填充缺失字段
 * @param partial 部分解析的结果
 * @returns 完整的 AdRecord
 */
export function mergeWithDefaults(partial: Partial<AdRecord>): AdRecord {
  const merged: AdRecord = {
    ...DEFAULT_RECORD,
    ...partial,
  };

  // 如果品类为空但产品名称不为空，尝试推断品类
  if (!merged.category && merged.productName) {
    merged.category = inferCategory(merged.productName, '');
  }

  return merged;
}
