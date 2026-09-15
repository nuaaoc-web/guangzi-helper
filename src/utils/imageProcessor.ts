/**
 * 图片预处理工具
 * 使用 Canvas API 对图片进行灰度化、对比度增强等处理，提高 OCR 识别率
 */

/**
 * 将图片加载为 Image 对象
 * @param imageSrc 图片源（base64 或 URL）
 * @returns Image 对象
 */
function loadImage(imageSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`图片加载失败: ${err}`));
    img.src = imageSrc;
  });
}

/**
 * 创建离屏 Canvas 并绘制图片
 * @param img Image 对象
 * @param maxWidth 最大宽度（超过则等比缩放）
 * @returns Canvas 和上下文
 */
function createCanvasFromImage(
  img: HTMLImageElement,
  maxWidth: number = 2048
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('无法创建 Canvas 2D 上下文');
  }

  // 计算缩放后的尺寸
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  // 绘制原图
  ctx.drawImage(img, 0, 0, width, height);

  return { canvas, ctx };
}

/**
 * 获取 Canvas 上的图像数据
 * @param canvas Canvas 元素
 * @param ctx 2D 上下文
 * @returns ImageData 对象
 */
function getImageData(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): ImageData {
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * 将图像数据放回 Canvas
 * @param canvas Canvas 元素
 * @param ctx 2D 上下文
 * @param imageData 处理后的图像数据
 */
function putImageData(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  imageData: ImageData
): void {
  ctx.putImageData(imageData, 0, 0);
}

/**
 * 图像处理滤镜：灰度化
 * 将彩色图像转换为灰度，减少颜色干扰
 * @param imageData 原始图像数据
 * @returns 处理后的图像数据
 */
export function applyGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 使用加权灰度公式（人眼对不同颜色敏感度不同）
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // data[i + 3] 保持不变（Alpha 通道）
  }

  return imageData;
}

/**
 * 图像处理滤镜：对比度增强
 * 增强文字与背景的对比度，提高 OCR 准确率
 * @param imageData 原始图像数据
 * @param factor 对比度因子（默认 1.5，1.0 为无变化）
 * @returns 处理后的图像数据
 */
export function applyContrast(imageData: ImageData, factor: number = 1.5): ImageData {
  const data = imageData.data;
  const intercept = 128 * (1 - factor);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * data[i] + intercept));     // R
    data[i + 1] = Math.min(255, Math.max(0, factor * data[i + 1] + intercept)); // G
    data[i + 2] = Math.min(255, Math.max(0, factor * data[i + 2] + intercept)); // B
  }

  return imageData;
}

/**
 * 图像处理滤镜：二值化（黑白）
 * 将灰度图像转换为纯黑白，适用于背景干净的文字截图
 * @param imageData 原始图像数据
 * @param threshold 阈值（0-255，默认 128）
 * @returns 处理后的图像数据
 */
export function applyBinarization(imageData: ImageData, threshold: number = 128): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // 假设已经是灰度图，取 R 通道即可
    const gray = data[i];
    const binary = gray > threshold ? 255 : 0;

    data[i] = binary;     // R
    data[i + 1] = binary; // G
    data[i + 2] = binary; // B
  }

  return imageData;
}

/**
 * 图像处理滤镜：锐化
 * 增强边缘清晰度，使文字更清晰
 * @param imageData 原始图像数据
 * @param width 图像宽度
 * @param height 图像高度
 * @returns 处理后的图像数据
 */
export function applySharpen(imageData: ImageData, width: number, height: number): ImageData {
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);
  const copy = new Uint8ClampedArray(data);

  // 3x3 拉普拉斯锐化核
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const pixelIdx = ((y + ky - 1) * width + (x + kx - 1)) * 4 + c;
            sum += copy[pixelIdx] * kernel[ky * 3 + kx];
          }
        }
        output[idx + c] = Math.min(255, Math.max(0, sum));
      }
      output[idx + 3] = data[idx + 3]; // Alpha 通道不变
    }
  }

  // 复制回原数组（边缘像素保持不变）
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);

    if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
      data[i] = output[i];
      data[i + 1] = output[i + 1];
      data[i + 2] = output[i + 2];
    }
  }

  return imageData;
}

/**
 * 图像处理滤镜：降噪（简单中值滤波）
 * 去除轻微噪点，适用于低质量截图
 * @param imageData 原始图像数据
 * @param width 图像宽度
 * @param height 图像高度
 * @returns 处理后的图像数据
 */
export function applyDenoise(imageData: ImageData, width: number, height: number): ImageData {
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const values: number[] = [];

        // 收集 3x3 邻域的像素值
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const pixelIdx = ((y + dy) * width + (x + dx)) * 4 + c;
            values.push(copy[pixelIdx]);
          }
        }

        // 排序取中值
        values.sort((a, b) => a - b);
        data[idx + c] = values[4]; // 中值
      }
    }
  }

  return imageData;
}

/**
 * 图像处理滤镜：亮度调整
 * @param imageData 原始图像数据
 * @param brightness 亮度调整值（-255 到 255，默认 10）
 * @returns 处理后的图像数据
 */
export function applyBrightness(imageData: ImageData, brightness: number = 10): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + brightness));     // R
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness)); // G
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness)); // B
  }

  return imageData;
}

/**
 * 综合预处理：灰度 + 对比度增强 + 锐化
 * 这是默认推荐的预处理流程，适用于大多数商务合作截图
 * @param imageSrc 图片源（base64 或 URL）
 * @param maxWidth 最大宽度（默认 2048）
 * @returns 处理后的图片 base64 字符串（PNG 格式）
 */
export async function preprocessImage(
  imageSrc: string,
  maxWidth: number = 2048
): Promise<string> {
  try {
    const img = await loadImage(imageSrc);
    const { canvas, ctx } = createCanvasFromImage(img, maxWidth);

    let imageData = getImageData(canvas, ctx);

    // 1. 灰度化
    imageData = applyGrayscale(imageData);

    // 2. 对比度增强（1.3 倍，适合大多数截图）
    imageData = applyContrast(imageData, 1.3);

    // 3. 轻微亮度提升
    imageData = applyBrightness(imageData, 5);

    // 4. 锐化（使文字边缘更清晰）
    imageData = applySharpen(imageData, canvas.width, canvas.height);

    // 将处理后的数据写回 Canvas
    putImageData(canvas, ctx, imageData);

    // 返回处理后的 base64（PNG 格式，质量最高）
    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('图片预处理失败:', error);
    // 如果处理失败，返回原图
    return imageSrc;
  }
}

/**
 * 强预处理：灰度 + 二值化
 * 适用于背景复杂、颜色杂乱的截图，或文字不够清晰的图片
 * @param imageSrc 图片源（base64 或 URL）
 * @param threshold 二值化阈值（默认 128）
 * @param maxWidth 最大宽度（默认 2048）
 * @returns 处理后的图片 base64 字符串
 */
export async function preprocessImageBinary(
  imageSrc: string,
  threshold: number = 128,
  maxWidth: number = 2048
): Promise<string> {
  try {
    const img = await loadImage(imageSrc);
    const { canvas, ctx } = createCanvasFromImage(img, maxWidth);

    let imageData = getImageData(canvas, ctx);

    // 1. 灰度化
    imageData = applyGrayscale(imageData);

    // 2. 对比度增强
    imageData = applyContrast(imageData, 1.5);

    // 3. 二值化
    imageData = applyBinarization(imageData, threshold);

    putImageData(canvas, ctx, imageData);

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('二值化预处理失败:', error);
    return imageSrc;
  }
}

/**
 * 轻预处理：仅调整对比度
 * 适用于已经比较清晰的截图，保留颜色信息
 * @param imageSrc 图片源（base64 或 URL）
 * @param maxWidth 最大宽度（默认 2048）
 * @returns 处理后的图片 base64 字符串
 */
export async function preprocessImageLight(
  imageSrc: string,
  maxWidth: number = 2048
): Promise<string> {
  try {
    const img = await loadImage(imageSrc);
    const { canvas, ctx } = createCanvasFromImage(img, maxWidth);

    let imageData = getImageData(canvas, ctx);

    // 仅增强对比度
    imageData = applyContrast(imageData, 1.2);
    imageData = applyBrightness(imageData, 5);

    putImageData(canvas, ctx, imageData);

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('轻预处理失败:', error);
    return imageSrc;
  }
}

/**
 * 获取图片尺寸信息
 * @param imageSrc 图片源（base64 或 URL）
 * @returns 图片宽度和高度
 */
export async function getImageDimensions(imageSrc: string): Promise<{ width: number; height: number }> {
  const img = await loadImage(imageSrc);
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  };
}

/**
 * 检查图片是否过大（超过指定尺寸建议压缩）
 * @param imageSrc 图片源（base64 或 URL）
 * @param maxSize 最大尺寸阈值（默认 2048）
 * @returns 是否需要压缩
 */
export async function shouldResizeImage(imageSrc: string, maxSize: number = 2048): Promise<boolean> {
  const { width, height } = await getImageDimensions(imageSrc);
  return width > maxSize || height > maxSize;
}

/**
 * 压缩图片到指定宽度
 * @param imageSrc 图片源（base64 或 URL）
 * @param targetWidth 目标宽度
 * @returns 压缩后的图片 base64 字符串
 */
export async function resizeImage(imageSrc: string, targetWidth: number): Promise<string> {
  try {
    const img = await loadImage(imageSrc);
    const { canvas, ctx } = createCanvasFromImage(img, targetWidth);
    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('图片压缩失败:', error);
    return imageSrc;
  }
}

/**
 * 将 File 对象转换为 base64 字符串
 * @param file 文件对象
 * @returns base64 字符串
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * 将 base64 数据转换为 File 对象
 * @param base64 base64 字符串
 * @param filename 文件名
 * @returns File 对象
 */
export function base64ToFile(base64: string, filename: string = 'image.png'): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * 检查图片是否可能是纯文字截图（通过简单启发式判断）
 * 如果文字区域占比较高，可以优先使用二值化预处理
 * @param imageSrc 图片源（base64 或 URL）
 * @returns 是否是文字截图（概率）
 */
export async function isTextScreenshot(imageSrc: string): Promise<boolean> {
  try {
    const img = await loadImage(imageSrc);
    const { canvas, ctx } = createCanvasFromImage(img, 512); // 使用小尺寸快速判断
    const imageData = getImageData(canvas, ctx);
    const data = imageData.data;

    let grayPixels = 0;
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 判断是否是接近灰色的像素（R/G/B 接近）
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min < 30) {
        grayPixels++;
      }
      totalPixels++;
    }

    // 如果灰色像素比例高（>60%），可能是文字截图
    return grayPixels / totalPixels > 0.6;
  } catch (error) {
    return false;
  }
}

/**
 * 自动选择最佳预处理策略
 * 根据图片特征自动选择灰度/对比度/二值化组合
 * @param imageSrc 图片源（base64 或 URL）
 * @returns 处理后的图片 base64 字符串
 */
export async function autoPreprocessImage(imageSrc: string): Promise<string> {
  const isText = await isTextScreenshot(imageSrc);

  if (isText) {
    // 文字截图：使用二值化增强
    return preprocessImageBinary(imageSrc, 135);
  }

  // 普通图片：使用标准预处理
  return preprocessImage(imageSrc);
}
