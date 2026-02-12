export interface SubGrid {
  title: string;
  items: string[];
}

export interface MandalaResult {
  coreConcept: string;
  // The 8 key dimensions surrounding the center
  mainDimensions: string[];
  // The 8 sub-grids corresponding to the main dimensions
  subGrids: SubGrid[];
  summary: string;
  actions: string[];
}

export interface ChecklistItem {
  task: string;
  description: string;
  importance: number; // 1-5 stars
  isCompleted?: boolean; // Client-side state
}

export enum ViewMode {
  VISUAL = 'VISUAL',
  REPORT = 'REPORT',
  DASHBOARD = 'DASHBOARD',
  CHECKLIST = 'CHECKLIST',
}