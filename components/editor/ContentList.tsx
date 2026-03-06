import React from 'react';
import { ProjectConfig, Sequence } from '../../types';

interface ContentListProps {
  projectConfig: ProjectConfig;
  selectedContentId: string | null;
  onSelectContent: (contentId: string) => void;
  onUploadContent?: (file: File) => void;
  onAddHtmlContent?: () => void;
  onReorderContent?: (fromIndex: number, toIndex: number) => void;
  onDeleteContent?: (contentId: string) => void;
  readOnly?: boolean;
}

const ContentList: React.FC<ContentListProps> = ({
  projectConfig,
  selectedContentId,
  onSelectContent,
  onUploadContent,
  onAddHtmlContent,
  onReorderContent,
  onDeleteContent,
  readOnly = false
}) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (readOnly && selectedContentId) {
      const el = document.getElementById(`content-item-${selectedContentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedContentId, readOnly]);

  // ... (keep helper functions unchanged) ...
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadContent) {
      onUploadContent(e.target.files[0]);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly) return;
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (readOnly || draggedIndex === null) return;
    if (draggedIndex !== dropIndex && onReorderContent) {
      onReorderContent(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <div className={`p-4 space-y-6 ${readOnly ? 'h-full overflow-y-auto' : ''}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-accent/80">
          {readOnly ? 'NAVEGACIÓN' : 'ESTRUCTURA DEL PROYECTO'}
        </h3>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              onClick={onAddHtmlContent}
              className="text-primary hover:text-primary-dark p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Nueva diapositiva HTML"
            >
              <span className="material-icons text-xl">code</span>
            </button>
            <label className="cursor-pointer text-primary hover:text-primary-dark p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Agregar imagen/video/pdf">
              <span className="material-icons text-xl">add_photo_alternate</span>
              <input
                type="file"
                accept="image/*,video/*,application/pdf,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}
      </div>

      {projectConfig.sequences.map((sequence: Sequence) => (
        <div key={sequence.id} className="space-y-2">
          {!readOnly && (
            <div className="flex items-center gap-2 font-semibold text-primary dark:text-accent">
              <span className="material-icons text-sm">folder</span>
              <span>{sequence.title}</span>
            </div>
          )}
          <div className="pl-4 space-y-1">
            {sequence.contents.map((contentId, index) => {
              const content = projectConfig.contents[contentId];
              if (!content) return null;

              const isSelected = selectedContentId === contentId;
              const isDragging = draggedIndex === index;

              return (
                <div
                  key={contentId}
                  draggable={!readOnly}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative group/item ${isDragging ? 'opacity-50' : ''} `}
                >
                  <div className="flex items-center gap-1 group/item">
                    {!readOnly && onDeleteContent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteContent(contentId);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all rounded hover:bg-red-50 shrink-0"
                        title="Borrar diapositiva"
                      >
                        <span className="material-icons text-lg">delete_outline</span>
                      </button>
                    )}
                    <button
                      id={`content-item-${contentId}`}
                      tabIndex={readOnly ? -1 : 0}
                      onClick={(e) => { e.currentTarget.blur(); onSelectContent(contentId); }}
                      className={`flex-1 text-left px-4 py-3 rounded-lg text-sm transition-all duration-300 flex items-center gap-3 min-w-0 shadow-sm
                          ${!readOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                          ${isSelected
                          ? (readOnly ? 'bg-accent text-white font-black scale-[1.02] shadow-accent/20 ring-2 ring-white/20' : 'bg-primary/20 text-primary border border-primary/30 font-bold')
                          : (readOnly ? 'text-white/90 hover:bg-primary-mid/20 hover:text-white border border-transparent' : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent')
                        } `}
                    >
                      {!readOnly && (
                        <span className="material-icons text-gray-400 group-hover:text-gray-600 cursor-grab shrink-0" style={{ fontSize: '14px' }}>drag_indicator</span>
                      )}
                      <span className={`material-icons text-xs shrink-0 ${isSelected ? 'text-white' : 'text-accent'}`}>
                        {content.type === 'video' ? 'movie' : content.type === 'html' ? 'code' : content.type === 'pdf' ? 'picture_as_pdf' : 'image'}
                      </span>
                      <span className="flex-1 overflow-visible break-words">{content.title || contentId}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContentList;

