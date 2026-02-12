import React, { useState, useRef } from 'react';
import { MandalaResult } from '../types';
import { ZoomIn, ArrowLeft, Share2, Loader2, Check, FileCode, Image as ImageIcon, Home } from 'lucide-react';
import { toBlob, toSvg } from 'html-to-image';

interface VisualViewProps {
  data: MandalaResult;
  topic: string;
}

// A 3x3 Grid Component
const Grid3x3 = ({
  centerText,
  surroundingTexts,
  onCellClick,
  className = "",
  highlightCenter = false,
  isMain = false
}: {
  centerText: string;
  surroundingTexts: string[];
  onCellClick?: (index: number) => void;
  className?: string;
  highlightCenter?: boolean;
  isMain?: boolean;
}) => {
  // Map index to visual grid position (0-8)
  // Visual Layout:
  // 0 1 2
  // 3 4 5
  // 6 7 8
  // Center is index 4.
  // The 'surroundingTexts' array usually has 8 items.
  // We need to map surroundingTexts[0...7] to slots 0,1,2,3,5,6,7,8.

  const mapIndexToSlot = (visualIndex: number) => {
    if (visualIndex < 4) return visualIndex;
    if (visualIndex > 4) return visualIndex - 1;
    return -1; // Center
  };

  return (
    <div className={`grid grid-cols-3 gap-1 p-1 bg-slate-200 rounded-lg shadow-sm aspect-square ${className}`}>
      {Array.from({ length: 9 }).map((_, i) => {
        const isCenter = i === 4;
        const text = isCenter ? centerText : (surroundingTexts?.[mapIndexToSlot(i)] || '');
        
        // Interaction styles
        const clickable = !isCenter && text && onCellClick;
        const baseStyles = "flex items-center justify-center p-1 text-center text-xs md:text-sm break-words overflow-hidden rounded transition-all duration-200 select-none leading-tight";
        const centerStyles = isMain 
          ? "bg-indigo-600 text-white font-bold text-sm md:text-base shadow-inner" 
          : "bg-slate-400 text-white font-semibold";
        const cellStyles = isCenter 
          ? centerStyles 
          : "bg-white text-slate-700 hover:bg-indigo-50 border border-slate-100";
        const cursorStyles = clickable ? "cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95 z-10" : "";

        return (
          <div
            key={i}
            onClick={() => clickable && onCellClick && onCellClick(mapIndexToSlot(i))}
            className={`${baseStyles} ${cellStyles} ${cursorStyles} h-full w-full`}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};

export const VisualView: React.FC<VisualViewProps> = ({ data, topic }) => {
  const [activeSubGridIndex, setActiveSubGridIndex] = useState<number | null>(null);
  const [isSharingPng, setIsSharingPng] = useState(false);
  const [isSharingSvg, setIsSharingSvg] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleMainGridClick = (index: number) => {
    setActiveSubGridIndex(index);
  };

  const handleBack = () => {
    setActiveSubGridIndex(null);
  };

  const handleSharePng = async () => {
    if (!gridRef.current || isSharingPng) return;
    
    setIsSharingPng(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const blob = await toBlob(gridRef.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
      });

      if (!blob) throw new Error("Failed to generate image blob");

      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      
      alert("圖片已複製到剪貼簿！(PNG)");

    } catch (err) {
      console.error("PNG Share failed:", err);
      alert("複製圖片失敗，請檢查瀏覽器權限或稍後再試。");
    } finally {
      setIsSharingPng(false);
    }
  };

  const handleShareSvg = async () => {
    if (!gridRef.current || isSharingSvg) return;
    
    setIsSharingSvg(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      // toSvg returns a data URL (data:image/svg+xml;charset=utf-8,...)
      const dataUrl = await toSvg(gridRef.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
      });

      // Extract raw SVG string from data URL
      // Format: data:image/svg+xml;charset=utf-8,<svg ...
      const prefix = 'data:image/svg+xml;charset=utf-8,';
      if (dataUrl.startsWith(prefix)) {
        const svgContent = decodeURIComponent(dataUrl.substring(prefix.length));
        await navigator.clipboard.writeText(svgContent);
        alert("SVG 原始碼已複製到剪貼簿！");
      } else {
        // Fallback for unexpected formats (e.g. base64)
        console.warn("Unexpected data URL format, copying raw URL");
        await navigator.clipboard.writeText(dataUrl);
        alert("SVG Data URL 已複製到剪貼簿。");
      }

    } catch (err) {
      console.error("SVG Share failed:", err);
      alert("複製 SVG 失敗。");
    } finally {
      setIsSharingSvg(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[600px]">
      
      {/* Navigation & Toolbar */}
      <div className="w-full mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 h-auto sm:h-10">
        <div className="flex-1 flex justify-start w-full sm:w-auto">
          {activeSubGridIndex !== null ? (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors shadow-sm text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              返回中心
            </button>
          ) : (
            <div className="text-slate-500 text-sm flex items-center gap-2">
              <ZoomIn className="w-4 h-4" />
              點擊周圍方格可深入查看細節
            </div>
          )}
        </div>

        {/* Share Buttons */}
        <div className="flex-none flex items-center gap-2">
          <button
            onClick={handleSharePng}
            disabled={isSharingPng || isSharingSvg}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            title="將目前圖表複製為 PNG 圖片"
          >
            {isSharingPng ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSharingPng ? '處理中...' : '複製圖片'}</span>
          </button>
          
          <div className="w-px h-4 bg-slate-300 mx-1"></div>

          <button
            onClick={handleShareSvg}
            disabled={isSharingPng || isSharingSvg}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            title="將目前圖表複製為 SVG 程式碼"
          >
            {isSharingSvg ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSharingSvg ? '處理中...' : '複製 SVG'}</span>
          </button>
        </div>
      </div>

      {/* Grid Container (Target for Capture) */}
      <div ref={gridRef} className="relative w-full aspect-square max-h-[600px] bg-slate-50 p-1 rounded-xl">
        {activeSubGridIndex === null ? (
          // MAIN OVERVIEW
          <Grid3x3 
            centerText={topic}
            surroundingTexts={data.mainDimensions}
            onCellClick={handleMainGridClick}
            isMain={true}
            className="w-full h-full animate-in fade-in zoom-in duration-300"
          />
        ) : (
          // FOCUSED SUB-GRID
          <Grid3x3 
            centerText={data.subGrids[activeSubGridIndex].title}
            surroundingTexts={data.subGrids[activeSubGridIndex].items}
            highlightCenter={true}
            className="w-full h-full animate-in slide-in-from-right-8 duration-300"
          />
        )}
      </div>

      {/* Enhanced Mini Map Navigation - Always Visible */}
      <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px w-8 bg-slate-200"></span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">全域導航</p>
          <span className="h-px w-8 bg-slate-200"></span>
        </div>
        
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({length: 9}).map((_, i) => {
              // Center (Home)
              if (i === 4) {
                const isHomeActive = activeSubGridIndex === null;
                return (
                  <button 
                    key={i} 
                    onClick={handleBack} 
                    className={`
                      w-10 h-10 flex items-center justify-center rounded-lg transition-all border
                      ${isHomeActive 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-100 scale-105 z-10' 
                        : 'bg-slate-100 text-slate-500 border-transparent hover:bg-indigo-50 hover:text-indigo-600'
                      }
                    `}
                    title={`返回中心：${topic}`}
                  >
                    <Home className="w-4 h-4" />
                  </button>
                );
              }
              
              // Surrounding Dimensions
              let dataIndex = -1;
              if (i < 4) dataIndex = i;
              if (i > 4) dataIndex = i - 1;

              const isActive = dataIndex === activeSubGridIndex;
              const dimensionTitle = data.mainDimensions[dataIndex] || "";
              
              return (
                <button 
                  key={i} 
                  onClick={() => dataIndex !== -1 && setActiveSubGridIndex(dataIndex)}
                  className={`
                    w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center text-[10px] font-bold border
                    ${isActive 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-100 scale-105 z-10' 
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:border-slate-300 hover:text-slate-600 hover:shadow-sm'
                    }
                  `}
                  title={dimensionTitle}
                >
                  {dataIndex + 1}
                </button>
              )
            })}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400 flex items-center gap-1 h-5">
          {activeSubGridIndex !== null ? (
            <>目前顯示：<span className="text-indigo-600 font-medium truncate max-w-[200px] block">{data.mainDimensions[activeSubGridIndex]}</span></>
          ) : (
            <>目前顯示：<span className="text-indigo-600 font-medium truncate max-w-[200px] block">中心主題（總覽）</span></>
          )}
        </p>
      </div>
    </div>
  );
};