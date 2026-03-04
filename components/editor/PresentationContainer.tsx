import React, { useRef, useState, useEffect } from 'react';
import { Content, Hotspot } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Global memory cache for HTML contents in read-only mode (Player)
// This guarantees instant, synchronous rendering of HTML slides without network jumps.
export const readOnlyHtmlCache: Record<string, string> = {};

export const prefetchHtmlToCache = async (htmlPath: string, revision?: number) => {
    const version = revision !== undefined ? `?v=${revision}` : '';
    const cacheKey = `${htmlPath}_${revision || 'latest'}`;

    if (readOnlyHtmlCache[cacheKey]) return; // Already cached

    try {
        const res = await fetch(`${htmlPath}${version}`);
        const text = await res.text();
        readOnlyHtmlCache[cacheKey] = text;
    } catch (e) {
        // Silent catch for prefetching
    }
};

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
    projectRevision?: number;
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
    projectRevision
}) => {
    const outerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [currentPos, setCurrentPos] = useState<{ x: number, y: number } | null>(null);
    const [scale, setScale] = useState(1);

    // State for lazy-loaded HTML
    const [htmlData, setHtmlData] = useState<string>('');
    const [isLoadingHtml, setIsLoadingHtml] = useState(false);

    // Fetch HTML content if it's just a path
    useEffect(() => {
        let isCurrent = true;
        const controller = new AbortController();

        if (content?.type === 'html') {
            if (content.html && content.html.startsWith('/media/html/')) {
                const version = projectRevision !== undefined ? `?v=${projectRevision}` : '';
                const cacheKey = `${content.html}_${projectRevision || 'latest'}`;

                // VERY FAST PATH FOR PLAYER: Instant synchronous load from memory
                if (readOnly && readOnlyHtmlCache[cacheKey]) {
                    setHtmlData(readOnlyHtmlCache[cacheKey]);
                    setIsLoadingHtml(false);
                    return; // Skip fetch and loading states entirely!
                }

                setIsLoadingHtml(true);

                fetch(`${content.html}${version}`, { signal: controller.signal })
                    .then(res => res.text())
                    .then(htmlString => {
                        if (isCurrent) {
                            if (readOnly) {
                                // Save to memory cache for subsequent instant loads
                                readOnlyHtmlCache[cacheKey] = htmlString;
                            }
                            setHtmlData(htmlString);
                            setIsLoadingHtml(false);
                        }
                    })
                    .catch(e => {
                        if (e.name === 'AbortError') return; // Silent ignore for intentional cancellations
                        console.error('Error fetching HTML:', e);
                        if (isCurrent) {
                            setHtmlData('<h2>Error loading content</h2>');
                            setIsLoadingHtml(false);
                        }
                    });
            } else {
                setHtmlData(content.html || '');
                setIsLoadingHtml(false);
            }
        } else {
            setHtmlData('');
            setIsLoadingHtml(false);
        }

        return () => {
            isCurrent = false;
            controller.abort();
        };
    }, [content, projectRevision, readOnly]);

    // Scaling logic for 16:9 canvas
    useEffect(() => {
        if (!outerRef.current) return;

        const handleResize = () => {
            if (outerRef.current) {
                const rect = outerRef.current.getBoundingClientRect();
                // Account for p-8 padding if not readOnly (32px each side = 64px)
                const padding = readOnly ? 0 : 64;
                const availableW = Math.max(0, rect.width - padding);
                const availableH = Math.max(0, rect.height - padding);

                const scaleX = availableW / 1920;
                const scaleY = availableH / 1080;
                const newScale = Math.min(scaleX, scaleY);
                setScale(newScale);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize, { passive: true });

        // Use ResizeObserver on the outer container to catch sidebar toggles
        const resizeObserver = new ResizeObserver(() => {
            // Use requestAnimationFrame to sync with browser render/transitions
            requestAnimationFrame(handleResize);
        });
        resizeObserver.observe(outerRef.current);

        // Initial small delay to ensure rendering is stable
        const timer = setTimeout(handleResize, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [readOnly]);

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
    }, [content?.id]);

    if (!content) {
        return (
            <div className="flex items-center justify-center w-full h-full text-gray-400">
                <p>Selecciona un contenido para {readOnly ? 'ver' : 'editar'}</p>
            </div>
        );
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (readOnly || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setIsDrawing(true);
        setStartPos({ x, y });
        setCurrentPos({ x, y });
        onSelectHotspot(null); // Deselect when starting to draw
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (readOnly || !isDrawing || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        setCurrentPos({ x, y });
    };

    const handleMouseUp = () => {
        if (readOnly || !isDrawing || !startPos || !currentPos) return;

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
        <div ref={outerRef} className={`absolute inset-0 flex items-center justify-center overflow-hidden ${readOnly ? 'bg-black' : 'p-8'}`}>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${content.id}-preview`}
                    initial={{ opacity: 0.8, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.8, scale: 1.01 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    ref={containerRef}
                    className={`relative shadow-2xl overflow-hidden select-none flex-shrink-0
                        ${readOnly ? '' : 'cursor-crosshair group bg-black'}`}
                    style={{
                        width: 1920 * scale,
                        height: 1080 * scale
                    }}
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
                    {/* Scaling Wrapper - Projects everything into a virtual 1920x1080 space */}
                    <div
                        className="absolute top-0 left-0 origin-top-left overflow-hidden"
                        style={{
                            width: 1920,
                            height: 1080,
                            transform: `scale(${scale})`,
                            pointerEvents: 'auto'
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
                            isLoadingHtml ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 border-none">
                                    <div className="w-16 h-16 border-4 border-t-primary border-r-primary border-b-gray-800 border-l-gray-800 rounded-full animate-spin mb-4"></div>
                                    <span className="text-white font-montserrat text-lg animate-pulse" style={{ color: '#B5A160' }}>Cargando presentación...</span>
                                </div>
                            ) : (
                                <iframe
                                    srcDoc={htmlData}
                                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                                    className="w-full h-full border-none"
                                    title={content.title}
                                />
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

                        {/* Hotspots Layer */}
                        {content.hotspots.map((hotspot) => (
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
                        {!readOnly && isDrawing && startPos && currentPos && (
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
                    </div>
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
