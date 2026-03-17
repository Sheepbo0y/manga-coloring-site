import clsx, { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return '刚刚';
  }
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  if (hours < 24) {
    return `${hours}小时前`;
  }
  if (days < 7) {
    return `${days}天前`;
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}

export function getFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param quality 压缩质量 (0.1-1.0)，默认 0.8
 * @param maxWidth 最大宽度，默认 1920
 * @param maxHeight 最大高度，默认 1920
 * @returns 压缩后的 Blob
 */
export async function compressImage(
  file: File,
  quality = 0.8,
  maxWidth = 1920,
  maxHeight = 1920
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 计算缩放后的尺寸
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取 canvas 上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          file.type || 'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('图片加载失败'));
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
  });
}

/**
 * 生成图片缩略图
 * @param file 原始图片文件
 * @param size 缩略图尺寸，默认 300
 * @returns 缩略图 Blob
 */
export async function generateThumbnail(file: File, size = 300): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 计算缩放后的尺寸（保持比例）
        if (width > height) {
          if (width > size) {
            height = Math.floor((height * size) / width);
            width = size;
          }
        } else {
          if (height > size) {
            width = Math.floor((width * size) / height);
            height = size;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取 canvas 上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('缩略图生成失败'));
            }
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => reject(new Error('图片加载失败'));
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
  });
}
