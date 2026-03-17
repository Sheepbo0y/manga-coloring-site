import React, { useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { compressImage } from '@/lib/utils';

interface ImageUploadProps {
  onFileSelect: (file: File | Blob) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  compress?: boolean;
  compressQuality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function ImageUpload({
  onFileSelect,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024,
  disabled = false,
  className,
  compress = true,
  compressQuality = 0.85,
  maxWidth = 2048,
  maxHeight = 2048,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return false;
    }

    return true;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError('');

      if (!validateFile(file)) {
        return;
      }

      try {
        let processedFile: File | Blob = file;

        // 如果需要压缩
        if (compress) {
          setCompressing(true);
          try {
            const compressedBlob = await compressImage(
              file,
              compressQuality,
              maxWidth,
              maxHeight
            );
            // 创建新的 File 对象，保持原始文件名
            processedFile = new File([compressedBlob], file.name, {
              type: 'image/jpeg',
            });
          } catch (compressError) {
            console.error('图片压缩失败:', compressError);
            // 压缩失败时使用原文件
            processedFile = file;
          } finally {
            setCompressing(false);
          }
        }

        // 创建预览
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(processedFile);

        onFileSelect(processedFile);
      } catch (error) {
        console.error('文件处理失败:', error);
        setError('文件处理失败，请重试');
      }
    },
    [onFileSelect, maxSize, compress, compressQuality, maxWidth, maxHeight]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile, disabled]
  );

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearPreview = () => {
    setPreview('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={clsx('w-full', className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center',
          'transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {compressing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-2 text-sm text-gray-600">正在压缩图片...</p>
            </div>
          </div>
        )}

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="预览"
              className="max-h-64 mx-auto rounded-lg object-contain"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <svg
              className={clsx(
                'mx-auto h-12 w-12',
                isDragging ? 'text-primary-500' : 'text-gray-400'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-sm text-gray-600">
              <span className="font-medium text-primary-600">点击上传</span>{' '}
              或将图片拖拽到此处
            </p>
            <p className="mt-2 text-xs text-gray-500">
              支持 JPG、PNG、WEBP 格式，最大 {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
