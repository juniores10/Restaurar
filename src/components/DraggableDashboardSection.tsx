import { useState, useRef } from 'react';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

interface DraggableDashboardSectionProps {
  sectionId: string;
  order: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  children: React.ReactNode;
}

export function DraggableDashboardSection({
  order: orderValue,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDrop,
  onDragEnd,
  isDragging,
  children,
}: DraggableDashboardSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const gripActive = useRef(false);

  return (
    <div
      className={`relative group/drag transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-[0.98]' : ''
      }`}
      style={{ order: orderValue }}
      draggable
      onDragStart={(e) => {
        if (!gripActive.current) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={() => {
        gripActive.current = false;
        setIsDragOver(false);
        onDragEnd();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!isDragging) setIsDragOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop();
      }}
    >
      <div
        className={`absolute -top-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 pointer-events-none ${
          isDragging
            ? 'opacity-0'
            : 'opacity-0 group-hover/drag:opacity-100 group-hover/drag:pointer-events-auto'
        }`}
      >
        <div className="flex items-center bg-white shadow-lg shadow-slate-900/10 rounded-full border border-slate-200/80 px-1.5 py-1 backdrop-blur-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Mover para cima"
          >
            <ChevronUp className="w-4 h-4 text-slate-600" />
          </button>
          <div
            className="px-1.5 cursor-grab active:cursor-grabbing select-none"
            title="Arrastar para reordenar"
            onMouseDown={() => {
              gripActive.current = true;
            }}
            onMouseUp={() => {
              gripActive.current = false;
            }}
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Mover para baixo"
          >
            <ChevronDown className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {isDragOver && !isDragging && (
        <div className="absolute -top-1.5 left-6 right-6 h-[3px] bg-blue-500 rounded-full z-10 shadow-lg shadow-blue-500/40">
          <div className="absolute -left-1.5 -top-[3px] w-3 h-3 bg-blue-500 rounded-full" />
          <div className="absolute -right-1.5 -top-[3px] w-3 h-3 bg-blue-500 rounded-full" />
        </div>
      )}

      {children}
    </div>
  );
}
