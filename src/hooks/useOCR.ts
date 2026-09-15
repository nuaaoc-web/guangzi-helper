import { useState, useCallback, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { preprocessImage, fileToBase64 } from '../utils/imageProcessor';

interface UseOCRReturn {
  text: string;
  loading: boolean;
  error: string | null;
  progress: number;
  recognize: (imageData: string | File) => Promise<string>;
  reset: () => void;
}

type WorkerType = Awaited<ReturnType<typeof Tesseract.createWorker>>;

export function useOCR(): UseOCRReturn {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef<WorkerType | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const recognize = useCallback(async (imageData: string | File): Promise<string> => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setText('');

    try {
      let src: string;
      if (typeof imageData === 'string') {
        src = imageData;
      } else {
        src = await fileToBase64(imageData);
      }

      const processedImage = await preprocessImage(src);

      const worker = await Tesseract.createWorker(
        'chi_sim',
        undefined,
        {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === 'recognizing text' && mountedRef.current) {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      workerRef.current = worker;

      const result = await worker.recognize(processedImage);
      const recognizedText = result.data.text;

      if (mountedRef.current) {
        setText(recognizedText);
        setProgress(100);
      }

      await worker.terminate();
      workerRef.current = null;

      if (mountedRef.current) {
        setLoading(false);
      }

      return recognizedText;
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'OCR 识别失败';
        setError(message);
        setLoading(false);
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      throw err;
    }
  }, []);

  // 重置
  const reset = useCallback(() => {
    setText('');
    setLoading(false);
    setError(null);
    setProgress(0);
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return { text, loading, error, progress, recognize, reset };
}

export default useOCR;
