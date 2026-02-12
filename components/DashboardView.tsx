import React from 'react';
import { MandalaResult } from '../types';

interface DashboardViewProps {
  data: MandalaResult;
  topic: string;
}

// Helper to map a list of items (8 items) plus a center item into a 9-slot array (0-8)
const mapItemsTo9Grid = (centerItem: string, surroundingItems: string[]) => {
  const slots = new Array(9).fill('');
  // Center is index 4
  slots[4] = centerItem;
  
  // Surrounding items map to 0,1,2,3, 5,6,7,8
  surroundingItems.forEach((item, index) => {
    if (index < 4) slots[index] = item;
    else if (index < 8) slots[index + 1] = item;
  });
  return slots;
};

// A single 3x3 grid component (Conceptually one "Block" of the dashboard)
const MiniGrid = ({ 
  centerText, 
  items, 
  variant = 'sub',
  label
}: { 
  centerText: string, 
  items: string[], 
  variant?: 'main' | 'sub',
  label?: string
}) => {
  const gridData = mapItemsTo9Grid(centerText, items);

  return (
    <div className={`flex flex-col h-full rounded-lg overflow-hidden border shadow-sm ${
      variant === 'main' ? 'border-indigo-300 ring-4 ring-indigo-50/50' : 'border-slate-200'
    }`}>
      <div className={`grid grid-cols-3 gap-px bg-slate-200 h-full flex-grow`}>
        {gridData.map((text, i) => {
          const isCenter = i === 4;
          
          let bgClass = "bg-white";
          let textClass = "text-slate-600 font-normal";
          
          if (isCenter) {
            if (variant === 'main') {
               bgClass = "bg-indigo-600";
               textClass = "text-white font-bold";
            } else {
               bgClass = "bg-slate-100";
               textClass = "text-slate-800 font-bold";
            }
          } else {
             // Outer cells
             if (variant === 'main') {
                bgClass = "bg-indigo-50";
                textClass = "text-indigo-900 font-semibold";
             }
          }

          return (
            <div 
              key={i} 
              className={`
                ${bgClass} ${textClass}
                p-1 flex items-center justify-center text-center
                text-[10px] sm:text-xs leading-tight break-words overflow-hidden h-full
              `}
              title={text}
            >
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ data, topic }) => {
  
  // The layout of the Dashboard is a 3x3 grid of 3x3 grids.
  // Center block (Index 4): The Main Mandala (Topic + 8 Dimensions)
  // Surrounding blocks (0-8, except 4): The Sub Mandalas (Dimension + 8 Items)
  
  // We need to map the subGrids array (0-7) to the dashboard slots (0,1,2,3, 5,6,7,8)
  // AND the core concept + dimensions to slot 4.

  const dashboardSlots = new Array(9).fill(null);
  
  // Fill the center slot (Main Grid)
  dashboardSlots[4] = {
    type: 'main',
    center: topic,
    items: data.mainDimensions
  };

  // Fill surrounding slots (Sub Grids)
  // data.subGrids[0] corresponds to mainDimensions[0], which is at slot 0.
  // data.subGrids[1] corresponds to mainDimensions[1], which is at slot 1.
  data.subGrids.forEach((subGrid, idx) => {
    let slotIndex = -1;
    if (idx < 4) slotIndex = idx;
    else if (idx < 8) slotIndex = idx + 1;
    
    if (slotIndex !== -1) {
      dashboardSlots[slotIndex] = {
        type: 'sub',
        center: subGrid.title,
        items: subGrid.items
      };
    }
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6 animate-in fade-in zoom-in duration-500">
       <div className="mb-6 flex flex-col items-center">
          <h2 className="text-xl font-bold text-slate-800 mb-1">全景儀表板</h2>
          <p className="text-sm text-slate-500">9x9 完整視角 (曼陀羅大表)</p>
       </div>

       {/* The Big 3x3 Container */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 aspect-[1/3] md:aspect-square">
          {dashboardSlots.map((slot, i) => (
             <div key={i} className="h-full min-h-[180px] md:min-h-0">
                {slot && (
                  <MiniGrid 
                    centerText={slot.center}
                    items={slot.items}
                    variant={slot.type}
                  />
                )}
             </div>
          ))}
       </div>
    </div>
  );
};