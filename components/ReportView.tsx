import React, { useState } from 'react';
import { MandalaResult } from '../types';
import { ClipboardCopy, CheckCircle2, FileDown, Loader2 } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

interface ReportViewProps {
  data: MandalaResult;
  topic: string;
}

// Helper to map center + 8 items to 9 grid slots (0-8)
const mapToGridSlots = (center: string, items: string[]) => {
  // Visual Order:
  // 0 1 2
  // 3 4 5
  // 6 7 8
  // Center is index 4.
  const slots = new Array(9).fill('');
  slots[4] = center;
  
  // Map items 0-7 to slots 0,1,2,3, 5,6,7,8
  items.forEach((item, index) => {
    if (index < 4) slots[index] = item;
    else if (index < 8) slots[index + 1] = item;
  });
  return slots;
};

interface Grid3x3TableProps {
  center: string;
  items: string[];
  isMain?: boolean;
  title?: React.ReactNode;
}

const Grid3x3Table: React.FC<Grid3x3TableProps> = ({ 
  center, 
  items, 
  isMain = false, 
  title 
}) => {
  const slots = mapToGridSlots(center, items);

  return (
    <div className="flex flex-col h-full">
      {title}
      <div className={`grid grid-cols-3 gap-1 p-1 rounded-lg border shadow-sm aspect-square ${isMain ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-100 border-slate-200'}`}>
        {slots.map((text, i) => {
          const isCenter = i === 4;
          const mainCenterStyle = "bg-indigo-600 text-white font-bold shadow-md scale-105 z-10 text-sm md:text-base";
          const subCenterStyle = "bg-slate-500 text-white font-semibold text-xs md:text-sm";
          const itemStyle = "bg-white text-slate-700 text-xs md:text-sm";
          
          return (
            <div 
              key={i} 
              className={`
                flex items-center justify-center p-1 text-center break-words rounded transition-all overflow-hidden
                ${isCenter ? (isMain ? mainCenterStyle : subCenterStyle) : itemStyle}
              `}
            >
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ReportView: React.FC<ReportViewProps> = ({ data, topic }) => {
  const [isExporting, setIsExporting] = useState(false);

  const copyToClipboard = () => {
    const text = `
主題核心：${data.coreConcept}

【表格 A：主題與 8 大延伸面向（3x3九宮格）】
${data.mainDimensions.map((dim, i) => `${i + 1}. ${dim}`).join('\n')}

【表格 B：每個面向的 8 個子想法】
${data.subGrids.map((grid, i) => `
面向 ${i + 1}：${grid.title}
${grid.items.map((item, j) => `- ${item}`).join('\n')}
`).join('\n')}

整體思考總結：
${data.summary}

可立即採取的 3 個行動建議：
${data.actions.map(a => `- ${a}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    alert('完整報告已複製到剪貼簿！');
  };

  const exportToWord = async () => {
    setIsExporting(true);
    try {
      // Structure the document children
      const children = [];

      // 1. Title
      children.push(
        new Paragraph({
          text: `曼陀羅思考報告：${data.coreConcept}`,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // 2. Main Dimensions
      children.push(
        new Paragraph({
          text: "一、8 大關鍵面向",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        })
      );

      data.mainDimensions.forEach((dim, i) => {
        children.push(
          new Paragraph({
            text: `${i + 1}. ${dim}`,
            bullet: { level: 0 },
          })
        );
      });

      // 3. Detailed Breakdown
      children.push(
        new Paragraph({
          text: "二、詳細展開子想法",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      data.subGrids.forEach((grid, i) => {
        children.push(
          new Paragraph({
            text: `面向 ${i + 1}：${grid.title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        grid.items.forEach((item) => {
          children.push(
            new Paragraph({
              text: item,
              bullet: { level: 0 },
            })
          );
        });
      });

      // 4. Summary
      children.push(
        new Paragraph({
          text: "三、整體思考總結",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
      children.push(
        new Paragraph({
          text: data.summary,
          spacing: { after: 200 },
        })
      );

      // 5. Actions
      children.push(
        new Paragraph({
          text: "四、行動建議",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        })
      );
      data.actions.forEach((action) => {
        children.push(
          new Paragraph({
            text: action,
            bullet: { level: 0 },
          })
        );
      });

      // Generate Document
      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      // Export
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic.replace(/\s+/g, '_')}_曼陀羅思考報告.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export failed", error);
      alert("匯出 Word 檔案失敗，請稍後再試。");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 rounded-xl border border-indigo-100 shadow-sm flex-grow">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">1. 核心概念</h3>
          <p className="text-xl font-medium text-slate-800">{data.coreConcept}</p>
        </div>

        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button 
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-3 rounded-xl transition-all shadow-sm"
          >
            <ClipboardCopy className="w-4 h-4" />
            <span className="hidden sm:inline">複製文字</span>
            <span className="sm:hidden">複製</span>
          </button>

          <button 
            onClick={exportToWord}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-xl transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            <span>匯出 Word</span>
          </button>
        </div>
      </div>

      {/* Table A Section */}
      <section>
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
          <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">步驟 2</span>
          <h3 className="font-bold text-slate-800 text-lg">表格 A：主題與 8 大延伸面向（3x3九宮格）</h3>
        </div>
        
        <div className="max-w-md mx-auto">
          <Grid3x3Table 
            center={topic} 
            items={data.mainDimensions} 
            isMain={true}
          />
        </div>
      </section>

      {/* Table B Section */}
      <section>
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
          <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">步驟 3</span>
          <h3 className="font-bold text-slate-800 text-lg">表格 B：每個面向的 8 個子想法（共 8 張表格）</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {data.subGrids.map((grid, idx) => (
            <Grid3x3Table
              key={idx}
              center={grid.title}
              items={grid.items}
              title={
                <div className="mb-2 flex items-center gap-2">
                   <span className="bg-slate-200 text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.5rem] text-center">
                     {idx + 1}
                   </span>
                   <span className="font-semibold text-slate-700 text-sm truncate" title={grid.title}>
                     {grid.title}
                   </span>
                </div>
              }
            />
          ))}
        </div>
      </section>

      {/* Summary & Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-6">
          <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
            整體思考總結
          </h3>
          <p className="text-emerald-900/80 leading-relaxed text-sm whitespace-pre-line">
            {data.summary}
          </p>
        </div>
        
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
           <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
            可立即採取的 3 個行動建議
           </h3>
           <ul className="space-y-3">
             {data.actions.map((action, i) => (
               <li key={i} className="flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                 <span className="text-blue-900/80 text-sm font-medium">{action}</span>
               </li>
             ))}
           </ul>
        </div>
      </section>
    </div>
  );
};