import React, { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';
import { getSetting, setSetting } from '../utils/settingsStorage';
import { Settings, Eye, EyeOff, Save, X, Rocket, Bug, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODEL_OPTIONS = [
  'moonshot-v1-8k',
  'moonshot-v1-32k',
  'moonshot-v1-128k',
  'moonshot-v1-auto'
];

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: '',
    apiEndpoint: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    defaultAccount: '小红书大号',
    tencentDocUrl: '',
    debugMode: false,
    autoCloseWindow: true
  });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 加载设置
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = useCallback(async () => {
    try {
      const apiKey = await getSetting<string>('apiKey', '');
      const apiEndpoint = await getSetting<string>('apiEndpoint', 'https://api.moonshot.cn/v1');
      const model = await getSetting<string>('model', 'moonshot-v1-8k');
      const defaultAccount = await getSetting<string>('defaultAccount', '小红书大号');
      const tencentDocUrl = await getSetting<string>('tencentDocUrl', '');
      const debugMode = await getSetting<boolean>('debugMode', false);
      const autoCloseWindow = await getSetting<boolean>('autoCloseWindow', true);
      setSettings({ apiKey, apiEndpoint, model, defaultAccount, tencentDocUrl, debugMode, autoCloseWindow });
    } catch {
      // 使用默认设置
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await setSetting('apiKey', settings.apiKey);
      await setSetting('apiEndpoint', settings.apiEndpoint);
      await setSetting('model', settings.model);
      await setSetting('defaultAccount', settings.defaultAccount);
      await setSetting('tencentDocUrl', settings.tencentDocUrl);
      await setSetting('debugMode', settings.debugMode);
      await setSetting('autoCloseWindow', settings.autoCloseWindow);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('保存设置失败:', err);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const updateField = useCallback(<K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-500" />
            设置
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LLM API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => updateField('apiKey', e.target.value)}
                className="input-field pr-10"
                placeholder="sk-..."
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* API Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Endpoint
            </label>
            <input
              type="text"
              value={settings.apiEndpoint}
              onChange={(e) => updateField('apiEndpoint', e.target.value)}
              className="input-field"
              placeholder="https://api.moonshot.cn/v1"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={settings.model}
              onChange={(e) => updateField('model', e.target.value)}
              className="input-field"
            >
              {MODEL_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Default Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              默认账号
            </label>
            <select
              value={settings.defaultAccount}
              onChange={(e) => updateField('defaultAccount', e.target.value)}
              className="input-field"
            >
              <option value="小红书大号">小红书大号</option>
              <option value="小红书小号">小红书小号</option>
              <option value="抖音大号">抖音大号</option>
            </select>
          </div>

          {/* 分隔线 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-gray-900">自动填报</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              配置腾讯文档链接后，可在识别结果中点击自动填报
            </p>

            {/* 腾讯文档 URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                腾讯文档 URL
              </label>
              <input
                type="text"
                value={settings.tencentDocUrl}
                onChange={(e) => updateField('tencentDocUrl', e.target.value)}
                className="input-field"
                placeholder="https://docs.qq.com/sheet/..."
              />
            </div>

            {/* 调试模式 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">调试模式</label>
              </div>
              <button
                onClick={() => updateField('debugMode', !settings.debugMode)}
                className={`p-1 rounded-lg transition-colors ${settings.debugMode ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600'}`}
                title={settings.debugMode ? '已开启调试模式' : '点击开启调试模式'}
              >
                {settings.debugMode ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>

            {/* 自动关闭窗口 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">填报后自动关闭窗口</span>
              </div>
              <button
                onClick={() => updateField('autoCloseWindow', !settings.autoCloseWindow)}
                className={`p-1 rounded-lg transition-colors ${settings.autoCloseWindow ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600'}`}
                title={settings.autoCloseWindow ? '填报完成后自动关闭窗口' : '填报完成后保持窗口打开'}
              >
                {settings.autoCloseWindow ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <Save className="w-4 h-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '保存设置'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
