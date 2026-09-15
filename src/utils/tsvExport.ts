import { AdRecord } from '../types';

/**
 * TSV 字段顺序定义
 */
const TSV_FIELD_ORDER: { key: keyof AdRecord; label: string }[] = [
  { key: 'seq', label: '序号' },
  { key: 'date', label: '日期' },
  { key: 'account', label: '提报号' },
  { key: 'productName', label: '产品名称' },
  { key: 'category', label: '品类' },
  { key: 'brandIndustry', label: '品牌行业' },
  { key: 'reportType', label: '提报类型' },
  { key: 'price', label: '价格' },
  { key: 'rebate', label: '返点' },
  { key: 'channel', label: '渠道' },
  { key: 'status', label: '状态' },
  { key: 'remark', label: '备注' },
];

/**
 * 表头数组（用于 CSV 导出）
 */
const CSV_HEADERS = [
  '序号',
  '日期',
  '提报号',
  '产品名称',
  '品类',
  '品牌行业',
  '提报类型',
  '价格',
  '返点',
  '渠道',
  '状态',
  '备注',
];

/**
 * 将单个 AdRecord 转换为制表符分隔的行字符串
 * 可直接粘贴到腾讯文档表格或 Excel
 * @param record 广告记录
 * @returns 制表符分隔的行字符串
 */
export function recordToTSVLine(record: AdRecord): string {
  const fields = [
    record.date,
    record.account,
    record.productName,
    record.category,
    record.brandIndustry,
    record.reportType,
    record.price !== null ? String(record.price) : '',
    record.rebate !== null ? `${record.rebate}%` : '',
    record.channel,
    record.status,
    record.remark,
  ];

  // 处理字段中可能包含的制表符和换行，避免破坏 TSV 格式
  const sanitizedFields = fields.map((field) => {
    if (field === null || field === undefined) return '';
    return String(field)
      .replace(/\t/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
  });

  return sanitizedFields.join('\t');
}

/**
 * 将多个 AdRecord 转换为 TSV 格式的完整文本（包含表头）
 * @param records 广告记录数组
 * @returns 完整 TSV 文本，包含表头行
 */
export function recordsToTSV(records: AdRecord[]): string {
  if (!records || records.length === 0) return '';

  const headerLine = CSV_HEADERS.join('\t');
  const dataLines = records.map(recordToTSVLine);
  return [headerLine, ...dataLines].join('\n');
}

/**
 * 将单个 AdRecord 转换为 TSV 格式的字符串（包含表头，适合一次复制一条）
 * @param record 广告记录
 * @returns 包含表头的 TSV 文本
 */
export function recordToTSVWithHeader(record: AdRecord): string {
  const headerLine = CSV_HEADERS.join('\t');
  const dataLine = recordToTSVLine(record);
  return `${headerLine}\n${dataLine}`;
}

/**
 * 使用 electronAPI 将文本写入剪贴板
 * @param text 要复制的文本
 * @returns 是否成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (typeof window !== 'undefined' && window.electronAPI?.clipboard?.writeText) {
      return await window.electronAPI.clipboard.writeText(text);
    }

    // Fallback: 使用浏览器原生 API
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback: 使用 execCommand
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const result = document.execCommand('copy');
      document.body.removeChild(textarea);
      return result;
    } catch (err) {
      document.body.removeChild(textarea);
      console.error('execCommand copy failed:', err);
      return false;
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
}

/**
 * 将单个 AdRecord 复制到剪贴板（TSV 格式）
 * @param record 广告记录
 * @returns 是否成功
 */
export async function copyRecordToClipboard(record: AdRecord): Promise<boolean> {
  const tsv = recordToTSVWithHeader(record);
  return copyToClipboard(tsv);
}

/**
 * 将多个 AdRecord 复制到剪贴板（TSV 格式）
 * @param records 广告记录数组
 * @returns 是否成功
 */
export async function copyRecordsToClipboard(records: AdRecord[]): Promise<boolean> {
  const tsv = recordsToTSV(records);
  return copyToClipboard(tsv);
}

/**
 * 将多个 AdRecord 复制到剪贴板（TSV 格式，不含表头）
 * 适合批量粘贴到已有表格
 * @param records 广告记录数组
 * @returns 是否成功
 */
export async function recordsToClipboard(records: AdRecord[]): Promise<boolean> {
  if (!records || records.length === 0) return false;
  const dataLines = records.map(recordToTSVLine);
  return copyToClipboard(dataLines.join('\n'));
}

/**
 * 将 AdRecord 转换为 CSV 格式的单行内容
 * 处理引号和逗号，符合 RFC 4180 标准
 * @param record 广告记录
 * @returns CSV 格式的单行字符串
 */
function recordToCSVLine(record: AdRecord): string {
  const fields = [
    String(record.seq),
    record.date,
    String(record.seq), // 提报号与序号相同
    record.productName,
    record.category,
    record.brandIndustry,
    record.reportType,
    record.price !== null ? String(record.price) : '',
    record.rebate !== null ? `${record.rebate}%` : '',
    record.channel,
    record.status,
    record.remark,
  ];

  // RFC 4180 处理：如果字段包含逗号、引号或换行，用引号包裹，并将内部引号双写
  const escapedFields = fields.map((field) => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  });

  return escapedFields.join(',');
}

/**
 * 生成 CSV 内容（包含 BOM 头，Excel 可直接识别 UTF-8）
 * @param records 广告记录数组
 * @returns 完整的 CSV 文本内容
 */
export function exportToCSV(records: AdRecord[]): string {
  if (!records || records.length === 0) {
    // 返回只有表头的 CSV
    const bom = '\uFEFF'; // UTF-8 BOM
    return bom + CSV_HEADERS.join(',') + '\n';
  }

  const bom = '\uFEFF'; // UTF-8 BOM，确保 Excel 正确识别中文
  const headerLine = CSV_HEADERS.join(',');
  const dataLines = records.map(recordToCSVLine);
  return bom + [headerLine, ...dataLines].join('\n') + '\n';
}

/**
 * 触发浏览器下载 CSV 文件
 * @param content CSV 内容
 * @param filename 下载文件名
 */
export function downloadCSV(content: string, filename: string = '广告提报记录.csv'): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * 将 AdRecord 数组导出并下载为 CSV 文件
 * @param records 广告记录数组
 * @param filename 下载文件名
 */
export function exportRecordsToCSVFile(records: AdRecord[], filename?: string): void {
  const csvContent = exportToCSV(records);
  const defaultName = `广告提报记录_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(csvContent, filename || defaultName);
}

/**
 * 使用 electron 对话框保存 CSV 文件
 * @param records 广告记录数组
 */
export async function saveCSVWithDialog(records: AdRecord[]): Promise<string | null> {
  if (typeof window === 'undefined' || !window.electronAPI?.dialog?.saveFile) {
    // 降级为浏览器下载
    exportRecordsToCSVFile(records);
    return null;
  }

  const csvContent = exportToCSV(records);
  const defaultName = `广告提报记录_${new Date().toISOString().slice(0, 10)}.csv`;

  try {
    return await window.electronAPI.dialog.saveFile(csvContent, defaultName);
  } catch (error) {
    console.error('Save dialog failed:', error);
    // 降级为浏览器下载
    exportRecordsToCSVFile(records, defaultName);
    return null;
  }
}

/**
 * 格式化价格显示（如 3500 → "¥3,500"）
 * @param price 价格数值
 * @returns 格式化后的价格字符串
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined || isNaN(price)) return '-';
  return `¥${price.toLocaleString('zh-CN')}`;
}

/**
 * 格式化返点显示（如 40 → "40%"）
 * @param rebate 返点数值
 * @returns 格式化后的返点字符串
 */
export function formatRebate(rebate: number | null): string {
  if (rebate === null || rebate === undefined || isNaN(rebate)) return '-';
  return `${rebate}%`;
}

