import { AdRecord } from './types';

export interface ElectronAPI {
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  clipboard: {
    writeText: (text: string) => Promise<boolean>;
    readText: () => Promise<string>;
  };
  dialog: {
    openFile: () => Promise<string | null>;
    saveFile: (content: string, defaultName: string) => Promise<string | null>;
  };
  autoFill: {
    open: (record: AdRecord, url: string) => Promise<void>;
    onStatus: (callback: (message: string) => void) => (() => void);
    onError: (callback: (message: string) => void) => (() => void);
    onComplete: (callback: (result: string, errorMessage?: string) => void) => (() => void);
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
