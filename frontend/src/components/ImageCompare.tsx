import React, { useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';

interface ImageCompareProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function ImageCompare({
  beforeImage,
  afterImage,
  beforeLabel = '原图',
  afterLabel = '上色后',
  className,
}: ImageCompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const position = (x / rect.width) * 100;
      setSliderPosition(Math.min(100, Math.max(0, position)));
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  // 键盘控制
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative select-none overflow-hidden rounded-lg',
        'cursor-ew-resize',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={sliderPosition}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="滑动对比原图和上色后的效果"
    >
      {/* 上色后图片（底层） */}
      <div className="absolute inset-0">
        <img
          src={afterImage}
          alt="上色后"
          className="w-full h-full object-cover"
          draggable={false}
        />
        {afterLabel && (
          <span className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {afterLabel}
          </span>
        )}
      </div>

      {/* 原图（上层，裁剪显示） */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <div className="absolute inset-0">
          <img
            src={beforeImage}
            alt="原图"
            className="w-full h-full object-cover"
            style={{
              width: containerRef.current?.offsetWidth,
              maxWidth: 'none',
            }}
            draggable={false}
          />
        </div>
        {beforeLabel && (
          <span className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {beforeLabel}
          </span>
        )}
      </div>

      {/* 滑动条 */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* 滑动按钮 */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              transform="rotate(90 12 12)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
