import React, { useRef, useState, useEffect } from 'react';
import { Content, Hotspot } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface PresentationContainerProps {
    content: Content | null;
    previewUrl?: string; // In-session blob URL for newly uploaded files
    selectedHotspotId: string | null;
    onSelectHotspot: (hotspotId: string | null) => void;
    onAddHotspot?: (rect: Omit<Hotspot, 'id' | 'action'>) => void;
    readOnly?: boolean;
    onHotspotClick?: (hotspot: Hotspot) => void;
    onNavigate?: (targetId: string) => void;
    onNavigateBack?: () => void;
    hasHistory?: boolean;
    onUpdateContentHtml?: (contentId: string, newHtml: string) => void;
}

const PresentationContainer: React.FC<PresentationContainerProps> = ({
    content,
    previewUrl,
    selectedHotspotId,
    onSelectHotspot,
    onAddHotspot,
    readOnly = false,
    onHotspotClick,
    onNavigate,
    onNavigateBack,
    hasHistory,
    onUpdateContentHtml
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [currentPos, setCurrentPos] = useState<{ x: number, y: number } | null>(null);
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

    // Handle messages from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NAVIGATE' && event.data?.targetId && onNavigate) {
                onNavigate(event.data.targetId);
            } else if (event.data?.type === 'NAVIGATE_BACK' && onNavigateBack) {
                onNavigateBack();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onNavigate, onNavigateBack]);

    // Reset drawing state when content changes
    useEffect(() => {
        setIsDrawing(false);
        setStartPos(null);
        setCurrentPos(null);
        // Reset view mode to preview when changing content
        setViewMode('preview');
    }, [content?.id]);

    if (!content) {
        return (
            <div className="flex items-center justify-center w-full h-full text-gray-400">
                <p>Selecciona un contenido para {readOnly ? 'ver' : 'editar'}</p>
            </div>
        );
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (readOnly || !containerRef.current || viewMode === 'code') return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setIsDrawing(true);
        setStartPos({ x, y });
        setCurrentPos({ x, y });
        onSelectHotspot(null); // Deselect when starting to draw
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (readOnly || !isDrawing || !containerRef.current || viewMode === 'code') return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        setCurrentPos({ x, y });
    };

    const handleMouseUp = () => {
        if (readOnly || !isDrawing || !startPos || !currentPos || viewMode === 'code') return;

        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(currentPos.x - startPos.x);
        const height = Math.abs(currentPos.y - startPos.y);

        // Only add if it has some size (avoid accidental clicks creating tiny hotspots)
        if (width > 0.02 && height > 0.02 && onAddHotspot) {
            onAddHotspot({
                x, y, width, height,
                title: 'Nuevo Hotspot'
            });
        }

        setIsDrawing(false);
        setStartPos(null);
        setCurrentPos(null);
    };

    return (
        <div className={`relative w-full h-full flex items-center justify-center ${readOnly ? 'bg-black' : 'p-8'}`}>

            {/* ── View Mode Switcher (only for HTML in editor) ── */}
            {!readOnly && content.type === 'html' && (
                <div className="absolute top-12 right-12 z-50 flex bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg rounded-full p-1 border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`p-2 rounded-full flex items-center justify-center transition-all ${viewMode === 'preview' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        title="Ver Previsualización"
                    >
                        <span className="material-icons text-sm">visibility</span>
                    </button>
                    <button
                        onClick={() => setViewMode('code')}
                        className={`p-2 rounded-full flex items-center justify-center transition-all ${viewMode === 'code' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        title="Ver Código HTML"
                    >
                        <span className="material-icons text-sm">code</span>
                    </button>
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${content.id}-${viewMode}`}
                    initial={{ opacity: 0.8, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.8, scale: 1.01 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    ref={containerRef}
                    className={`relative w-full shadow-2xl overflow-hidden select-none 
                        ${readOnly ? '' : viewMode === 'code' ? 'bg-gray-900' : 'cursor-crosshair group bg-black'}`}
                    style={{ aspectRatio: '16/9', maxHeight: '100%' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        if (isDrawing) {
                            setIsDrawing(false);
                            setStartPos(null);
                            setCurrentPos(null);
                        }
                    }}
                >
                    {/* Content Layer */}
                    {content.type === 'video' ? (
                        <video
                            src={previewUrl || content.src}
                            className="w-full h-full object-contain pointer-events-none"
                            controls
                            autoPlay={readOnly}
                        />
                    ) : content.type === 'html' ? (
                        viewMode === 'preview' ? (
                            <iframe
                                srcDoc={content.html}
                                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                                className="w-full h-full border-none"
                                title={content.title}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col p-4 bg-gray-900 overflow-hidden">
                                <div className="flex items-center gap-2 mb-2 text-primary font-mono text-xs font-bold uppercase tracking-widest opacity-70">
                                    <span className="material-icons text-xs">code</span>
                                    Editor de Código
                                </div>
                                <textarea
                                    value={content.html || ''}
                                    onChange={(e) => onUpdateContentHtml && onUpdateContentHtml(content.id, e.target.value)}
                                    className="w-full flex-grow p-4 font-mono text-sm bg-gray-800 text-green-400 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none overflow-y-auto"
                                    placeholder="<div>Escribe tu HTML aquí...</div>"
                                    spellCheck={false}
                                />
                            </div>
                        )
                    ) : content.type === 'pdf' ? (
                        <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden flex flex-col">
                            <div className="bg-white/80 backdrop-blur-md p-3 border-b border-gray-200 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="material-icons text-red-600">picture_as_pdf</span>
                                    <span className="text-sm font-bold text-gray-700 truncate">{content.title}</span>
                                </div>
                                <a
                                    href={encodeURI(content.src || 'error')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
                                >
                                    <span className="material-icons text-xs">open_in_new</span>
                                    Ampliar
                                </a>
                            </div>
                            <iframe
                                src={`${previewUrl || encodeURI(content.src || '')}#toolbar=1`}
                                className="w-full h-full border-none"
                                title={content.title}
                            />
                        </div>
                    ) : (
                        <img
                            src={previewUrl || content.src}
                            alt={content.title}
                            className="w-full h-full object-contain pointer-events-none user-select-none"
                            draggable={false}
                        />
                    )}

                    {/* Hotspots Layer - Only show in preview mode and not in code view */}
                    {viewMode === 'preview' && content.hotspots.map((hotspot) => (
                        <div
                            key={hotspot.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (readOnly && onHotspotClick) {
                                    onHotspotClick(hotspot);
                                } else {
                                    onSelectHotspot(hotspot.id);
                                }
                            }}
                            className={`absolute transition-all cursor-pointer
                    ${readOnly
                                    ? 'hover:bg-white/10 z-20' // Read-only style
                                    : `${selectedHotspotId === hotspot.id ? 'border-2 border-primary bg-primary/20 z-20 opacity-100' : 'border-2 border-transparent hover:border-white/50 hover:bg-white/10 z-10'}`
                                }`}
                            style={{
                                left: `${hotspot.x * 100}%`,
                                top: `${hotspot.y * 100}%`,
                                width: `${hotspot.width * 100}%`,
                                height: `${hotspot.height * 100}%`,
                            }}
                            title={readOnly ? hotspot.title : undefined}
                        >
                            {!readOnly && selectedHotspotId === hotspot.id && (
                                <div className="absolute -top-6 left-0 bg-primary text-white text-xs px-2 py-1 rounded">
                                    {hotspot.title || 'Hotspot'}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Drawing Preview Layer */}
                    {!readOnly && isDrawing && startPos && currentPos && viewMode === 'preview' && (
                        <div
                            className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400/20 z-30 pointer-events-none"
                            style={{
                                left: `${Math.min(startPos.x, currentPos.x) * 100}%`,
                                top: `${Math.min(startPos.y, currentPos.y) * 100}%`,
                                width: `${Math.abs(currentPos.x - startPos.x) * 100}%`,
                                height: `${Math.abs(currentPos.y - startPos.y) * 100}%`,
                            }}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
            {/* Back button – bottom left, only when there is history */}
            {hasHistory && (
                <button
                    onClick={onNavigateBack}
                    className="absolute bottom-4 left-4 bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded shadow-md transition-colors text-sm"
                    title="Volver al contenido anterior"
                >
                    <span className="material-icons align-middle" style={{ fontSize: '1.2rem' }}>arrow_back</span>
                </button>
            )}
        </div>
    );
};

export default PresentationContainer;
