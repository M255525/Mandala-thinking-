import React, { useState } from 'react';
import { MandalaResult, ChecklistItem } from '../types';
import { generateChecklist } from '../services/geminiService';
import { Loader2, Star, CheckSquare, ArrowLeft, RotateCcw, ListTodo, FileDown, FileSpreadsheet } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

interface ChecklistViewProps {
  data: MandalaResult;
  topic: string;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({ data, topic }) => {
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Helper to visualize grid layout for selection
  const mapIndexToSlot = (visualIndex: number) => {
    if (visualIndex < 4) return visualIndex;
    if (visualIndex > 4) return visualIndex - 1;
    return -1; // Center
  };

  const handleDimensionClick = async (dimension: string) => {
    if (!dimension) return;
    setSelectedDimension(dimension);
    setLoading(true);
    setChecklist([]);
    setCompletedItems(new Set());

    try {
      const result = await generateChecklist(topic, dimension);
      setChecklist(result);
    } catch (error) {
      console.error(error);
      alert("無法產生檢核表，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    const newSet = new Set(completedItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCompletedItems(newSet);
  };

  const exportToCSV = () => {
    if (!checklist.length || !selectedDimension) return;

    try {
      // 1. Define Headers
      const headers = ["任務名稱", "狀態", "重要性 (1-5)", "任務說明"];
      
      // 2. Build Rows
      const rows = checklist.map((item, index) => {
        const isCompleted = completedItems.has(index);
        // Escape quotes by doubling them (CSV standard)
        const taskSafe = `"${item.task.replace(/"/g, '""')}"`;
        const descSafe = `"${item.description.replace(/"/g, '""')}"`;
        const status = isCompleted ? "已完成" : "待執行";
        
        return [taskSafe, status, item.importance, descSafe].join(",");
      });

      // 3. Combine with BOM for UTF-8 compatibility in Excel
      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      
      // 4. Create Download Link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedDimension}_任務檢核表.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("CSV Export failed", error);
      alert("匯出 CSV 失敗，請稍後再試。");
    }
  };

  const exportToWord = async () => {
    if (!checklist.length || !selectedDimension) return;
    setIsExportingWord(true);

    try {
      const children = [];

      // 1. Title
      children.push(
        new Paragraph({
          text: `工作任務檢核表：${selectedDimension}`,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      // 2. Subtitle (Context)
      children.push(
        new Paragraph({
          text: `核心主題：${topic}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // 3. Stats
      const doneCount = completedItems.size;
      const totalCount = checklist.length;
      children.push(
        new Paragraph({
          text: `當前進度：${doneCount} / ${totalCount} 已完成`,
          spacing: { after: 400 },
          color: "666666"
        })
      );

      // 4. Tasks
      checklist.forEach((item, index) => {
        const isCompleted = completedItems.has(index);
        const checkboxState = isCompleted ? "[v] 已完成" : "[ ] 待執行";
        const starText = "★".repeat(item.importance) + "☆".repeat(5 - item.importance);

        // Task Header
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: checkboxState + "  ", bold: true, color: isCompleted ? "2E7D32" : "000000" }),
              new TextRun({ text: item.task, bold: true, size: 24 }), // 12pt
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        // Importance
        children.push(
          new Paragraph({
            children: [
                new TextRun({ text: "重要性：", color: "64748B" }),
                new TextRun({ text: starText, color: "F59E0B" })
            ],
            spacing: { after: 50 },
            indent: { left: 400 } // Indent content
          })
        );

        // Description
        children.push(
          new Paragraph({
            text: item.description,
            indent: { left: 400 },
            spacing: { after: 200 },
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
      a.download = `${selectedDimension}_任務檢核表.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export failed", error);
      alert("匯出 Word 檔案失敗，請稍後再試。");
    } finally {
      setIsExportingWord(false);
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        ))}
      </div>
    );
  };

  // View 1: Selector (3x3 Grid)
  if (!selectedDimension) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 text-center space-y-2">
           <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
             <ListTodo className="w-6 h-6 text-indigo-600"/>
             選擇產出檢核表的面向
           </h3>
           <p className="text-slate-500 text-sm">點選一個關鍵面向，AI 將為您生成具體的工作任務清單與重要性評級。</p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-200 rounded-2xl shadow-sm aspect-square w-full max-w-[400px]">
          {Array.from({ length: 9 }).map((_, i) => {
            const slotIndex = mapIndexToSlot(i);
            const isCenter = slotIndex === -1;
            const text = isCenter ? topic : data.mainDimensions[slotIndex];

            if (isCenter) {
              return (
                <div key={i} className="bg-slate-400 text-white font-bold flex items-center justify-center p-2 text-center rounded-xl text-sm shadow-inner">
                  {text}
                </div>
              );
            }

            return (
              <button
                key={i}
                onClick={() => handleDimensionClick(text)}
                className="bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md hover:-translate-y-1 text-slate-700 font-medium p-2 rounded-xl transition-all duration-200 text-sm break-words leading-tight flex items-center justify-center shadow-sm border border-slate-100"
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // View 2: Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-600 font-medium">正在為「{selectedDimension}」規劃任務檢核表...</p>
        <p className="text-slate-400 text-sm">正在評估任務重要性 (1-5星)</p>
      </div>
    );
  }

  // View 3: Checklist Display
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => setSelectedDimension(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors px-3 py-2 hover:bg-slate-100 rounded-lg text-sm self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          重選面向
        </button>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
           <button 
             onClick={exportToCSV}
             className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 transition-colors px-3 py-2 hover:bg-emerald-50 rounded-lg text-sm font-medium border border-transparent hover:border-emerald-200"
             title="下載為 CSV (Excel)"
           >
             <FileSpreadsheet className="w-4 h-4" />
             CSV
           </button>
           
           <button 
             onClick={exportToWord}
             disabled={isExportingWord}
             className="flex items-center gap-2 text-slate-600 hover:text-blue-700 transition-colors px-3 py-2 hover:bg-blue-50 rounded-lg text-sm font-medium disabled:opacity-50 border border-transparent hover:border-blue-200"
             title="下載為 Word 文件"
           >
             {isExportingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
             Word
           </button>

           <div className="w-px h-4 bg-slate-300 mx-1"></div>
           
           <button 
             onClick={() => handleDimensionClick(selectedDimension)}
             className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-2 hover:bg-indigo-50 rounded-lg text-sm font-medium"
           >
             <RotateCcw className="w-4 h-4" />
             重新生成
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-indigo-50 px-6 py-6 border-b border-indigo-100">
           <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
             <ListTodo className="w-4 h-4" />
             Checklist
           </div>
           <h2 className="text-2xl font-bold text-slate-800">{selectedDimension}</h2>
           <p className="text-slate-500 text-sm mt-1">含重要性評級 (五星量表)</p>
        </div>

        <div className="divide-y divide-slate-100">
          {checklist.map((item, index) => {
            const isDone = completedItems.has(index);
            return (
              <div 
                key={index} 
                className={`p-4 sm:p-6 transition-colors duration-200 flex gap-4 ${isDone ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
              >
                <button 
                  onClick={() => toggleItem(index)}
                  className={`flex-shrink-0 mt-1 w-6 h-6 rounded border transition-all flex items-center justify-center ${
                    isDone 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'bg-white border-slate-300 text-transparent hover:border-indigo-400'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                <div className="flex-grow space-y-2">
                   <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <h4 className={`font-bold text-lg leading-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {item.task}
                      </h4>
                      <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex-shrink-0" title={`重要性：${item.importance} 星`}>
                         <span className="text-xs text-slate-400 font-medium">重要性</span>
                         {renderStars(item.importance)}
                      </div>
                   </div>
                   <p className={`text-sm ${isDone ? 'text-slate-300' : 'text-slate-600'}`}>
                     {item.description}
                   </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {checklist.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            沒有找到相關任務。
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-xs text-slate-400">
         進度：{completedItems.size} / {checklist.length}
      </div>
    </div>
  );
};