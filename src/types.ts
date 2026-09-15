export interface AdRecord {
  seq: number;
  date: string;
  account: string;
  productName: string;
  category: string;
  brandIndustry: string;
  reportType: string;
  price: number | null;
  rebate: number | null;
  channel: string;
  status: string;
  remark: string;
}

export interface ParsedResult {
  rawText: string;
  record: AdRecord;
  confidence: number;
}

export interface AppSettings {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  defaultAccount: string;
  tencentDocUrl: string;
  debugMode: boolean;
  autoCloseWindow: boolean;
}

export const STATUS_OPTIONS = [
  '未选中',
  '已选中',
  '已执行',
  '不可执行',
  '等待中'
];

export const ACCOUNT_OPTIONS = [
  '小红书大号',
  '小红书小号',
  '抖音大号'
];

export const CHANNEL_OPTIONS = [
  '邀约',
  '中介询问',
  '品牌询问'
];

export const REPORT_TYPE_OPTIONS = [
  '报备视频',
  '非报备视频',
  '图文',
  '直播'
];

export const DEFAULT_RECORD: AdRecord = {
  seq: 0,
  date: new Date().toISOString().split('T')[0].replace(/-/g, '年').replace(/年(\d{2})年/, '年$1月') + '日',
  account: '小红书大号',
  productName: '',
  category: '',
  brandIndustry: '宠物',
  reportType: '报备视频',
  price: null,
  rebate: null,
  channel: '邀约',
  status: '等待中',
  remark: ''
};
