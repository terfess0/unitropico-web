import React, { useState, useEffect } from 'react';
import { ProjectConfig, Hotspot } from '../../types';
import ContentList from '../editor/ContentList';
import PresentationContainer, { prefetchHtmlToCache } from '../editor/PresentationContainer';
import { Link } from 'react-router-dom';

interface PresentationPlayerProps {
    sequenceId: string;
    backLink?: string;
}

const PresentationPlayer: React.FC<PresentationPlayerProps> = ({ sequenceId, backLink = '/quality-conditions' }) => {
    const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);
    const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    // Navigation history stack for back navigation
    const [history, setHistory] = useState<string[]>([]);

    // Load project config
    useEffect(() => {
        fetch(`/api/config?sequenceId=${sequenceId}`)
            .then(res => res.json())
            .then((data: ProjectConfig) => {
                setProjectConfig(data);

                // Auto-select first content of the requested sequence
                const sequence = data.sequences.find(s => s.id === sequenceId);
                if (sequence && sequence.contents.length > 0) {
                    setSelectedContentId(sequence.contents[0]);
                }
            })
            .catch(err => console.error('Error loading project config:', err));
    }, [sequenceId]);

    const activeSequence = projectConfig?.sequences.find(s => s.id === sequenceId);

    // Filter config for ContentList
    const filteredConfig = projectConfig ? {
        ...projectConfig,
        sequences: activeSequence ? [activeSequence] : []
    } : null;

    const selectedContent = (projectConfig && selectedContentId) ? projectConfig.contents[selectedContentId] : null;

    const handleSelectContent = (id: string) => {
        // Push current content onto history before navigating
        if (selectedContentId && selectedContentId !== id) {
            setHistory(prev => [...prev, selectedContentId]);
        }
        setSelectedContentId(id);
    };

    const handleHotspotClick = (hotspot: Hotspot) => {
        if (hotspot.action === 'route' && hotspot.target) {
            setSelectedContentId(hotspot.target);
        } else if (hotspot.action === 'play') {
            setIsPlaying(true);
            // In a better implementation we would trigger video play
        }
    };

    const handleNext = React.useCallback(() => {
        if (!activeSequence || !selectedContentId) return;
        const currentIndex = activeSequence.contents.indexOf(selectedContentId);
        if (currentIndex < activeSequence.contents.length - 1) {
            setSelectedContentId(activeSequence.contents[currentIndex + 1]);
        }
    }, [activeSequence, selectedContentId]);

    // Navigate back using history stack
    const handleNavigateBack = React.useCallback(() => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const newHistory = [...prev];
            const previousId = newHistory.pop();
            if (previousId) {
                setSelectedContentId(previousId);
            }
            return newHistory;
        });
    }, []);

    const handlePrev = React.useCallback(() => {
        if (!activeSequence || !selectedContentId) return;
        const currentIndex = activeSequence.contents.indexOf(selectedContentId);
        if (currentIndex > 0) {
            setSelectedContentId(activeSequence.contents[currentIndex - 1]);
        }
    }, [activeSequence, selectedContentId]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if no input/textarea is focused (avoid issues in editor or search)
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                handleNext();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                handlePrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev]);

    // AGGRESSIVE PREFETCHING: Background load ALL slides in the sequence
    useEffect(() => {
        if (!activeSequence || !projectConfig) return;

        // Loop through all contents in the current sequence
        activeSequence.contents.forEach(contentId => {
            const content = projectConfig.contents[contentId];
            if (content && content.type === 'html' && content.html && content.html.startsWith('/media/html/')) {
                // Fetch ALL in background to populate browser cache AND memory cache
                prefetchHtmlToCache(content.html, projectConfig.revision);
            }
        });
    }, [activeSequence, projectConfig]);

    if (!projectConfig || !activeSequence) {
        return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Cargando presentación...</div>;
    }

    return (
        <div className="flex h-screen w-full bg-gray-900 text-white overflow-hidden relative">
            {/* Expand Button (Floating) - Visible only when sidebar is hidden */}
            {!isSidebarVisible && (
                <button
                    onClick={() => setIsSidebarVisible(true)}
                    className="fixed top-32 left-4 z-50 w-12 h-12 flex items-center justify-center bg-[#347b72] rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group border border-[#e1d9bf]/20"
                    title="Mostrar menú de navegación"
                >
                    <span
                        className="text-2xl font-black select-none transition-transform group-hover:translate-x-0.5"
                        style={{ color: '#e1d9bf' }}
                    >
                        &gt;
                    </span>
                </button>
            )}

            {/* Left Panel - Navigation */}
            <aside
                className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-r border-gray-800 bg-gray-900 flex flex-col z-20 shrink-0 ${isSidebarVisible ? 'w-80 translate-x-0 opacity-100 shadow-2xl' : 'w-0 -translate-x-full opacity-0 pointer-events-none'
                    }`}
            >
                <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3 min-w-[20rem]">
                    <div className="flex items-center gap-3">
                        <Link to={backLink} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                            <span className="material-icons">arrow_back</span>
                        </Link>
                        <h2 className="font-bold text-lg uppercase tracking-tight leading-tight" style={{ color: '#B5A160' }} title={activeSequence.title}>
                            {activeSequence.title}
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsSidebarVisible(false)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-gray-400 hover:text-white"
                        title="Ocultar menú"
                    >
                        <span className="material-icons">chevron_left</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-w-[20rem]">
                    {filteredConfig && (
                        <ContentList
                            projectConfig={filteredConfig}
                            selectedContentId={selectedContentId}
                            onSelectContent={handleSelectContent}
                            readOnly={true}
                            onUploadContent={() => { }}
                            onReorderContent={() => { }}
                        />
                    )}
                </div>

                {/* Navigation Controls */}
                <div className="p-4 border-t border-gray-800 flex justify-between gap-4 min-w-[20rem]">
                    <button
                        onClick={handlePrev}
                        disabled={!selectedContentId || activeSequence.contents.indexOf(selectedContentId) === 0}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed py-3 rounded-lg transition-colors text-sm font-medium"
                    >
                        <span className="material-icons text-xl">navigate_before</span>
                        Anterior
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!selectedContentId || activeSequence.contents.indexOf(selectedContentId) === activeSequence.contents.length - 1}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-30 disabled:cursor-not-allowed py-3 rounded-lg transition-colors text-white text-sm font-medium shadow-lg hover:shadow-primary/20"
                    >
                        Siguiente
                        <span className="material-icons text-xl">navigate_next</span>
                    </button>
                </div>
            </aside>

            {/* Center Panel - Presentation */}
            <main className="flex-1 bg-black relative flex items-center justify-center overflow-hidden h-full">
                <PresentationContainer
                    content={selectedContent}
                    selectedHotspotId={null}
                    onSelectHotspot={() => { }}
                    onAddHotspot={() => { }} // Disabled in read-only
                    readOnly={true}
                    onHotspotClick={handleHotspotClick}
                    onNavigate={handleSelectContent}
                    onNavigateBack={handleNavigateBack}
                    hasHistory={history.length > 0}
                    projectRevision={projectConfig.revision}
                />
            </main>
        </div>
    );
};

export default PresentationPlayer;
