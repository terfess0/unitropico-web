import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EditorLayout from '../components/editor/EditorLayout';
import ContentList from '../components/editor/ContentList';
import PresentationContainer from '../components/editor/PresentationContainer';
import PropertiesPanel from '../components/editor/PropertiesPanel';
import { ProjectConfig, Hotspot } from '../types';

const Editor: React.FC = () => {
    const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);
    const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
    const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
    const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
    // Navigation history stack (stores previously visited content IDs)
    const [history, setHistory] = useState<string[]>([]);
    // In-session blob URLs for preview only — not persisted to projectConfig
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

    // Load project config
    useEffect(() => {
        fetch(`http://${window.location.hostname}:3001/api/config`)
            .then(res => res.json())
            .then((data: ProjectConfig) => {
                setProjectConfig(data);
                // Dont auto-select
            })
            .catch(err => console.error('Error loading project config:', err));
    }, []);

    // When sequence changes, select its first content.
    // NOTE: projectConfig is intentionally NOT in the deps array.
    // Including it would reset selectedContentId on every edit (hotspot, title, etc.).
    // This effect must only fire when the user explicitly picks a different sequence.
    useEffect(() => {
        if (projectConfig && selectedSequenceId) {
            const sequence = projectConfig.sequences.find(s => s.id === selectedSequenceId);
            if (sequence && sequence.contents.length > 0) {
                setSelectedContentId(sequence.contents[0]);
            } else {
                setSelectedContentId(null);
            }
            setSelectedHotspotId(null);
        }
    }, [selectedSequenceId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectContent = (id: string) => {
        // Push current content onto history before navigating to a new one
        if (selectedContentId && selectedContentId !== id) {
            setHistory(prev => [...prev, selectedContentId]);
        }
        setSelectedContentId(id);
        setSelectedHotspotId(null);
    };

    // Navigate back to the previous content using the history stack
    const handleNavigateBack = () => {
        setHistory(prev => {
            if (prev.length === 0) return prev; // No history
            const newHistory = [...prev];
            const previousId = newHistory.pop();
            if (previousId) {
                setSelectedContentId(previousId);
            }
            return newHistory;
        });
    };

    const handleUpdateHotspot = (updatedHotspot: Hotspot) => {
        if (!projectConfig || !selectedContentId) return;

        setProjectConfig(prev => {
            if (!prev) return null;
            const content = prev.contents[selectedContentId];
            if (!content) return prev;

            const updatedHotspots = content.hotspots.map(h =>
                h.id === updatedHotspot.id ? updatedHotspot : h
            );

            return {
                ...prev,
                contents: {
                    ...prev.contents,
                    [selectedContentId]: {
                        ...content,
                        hotspots: updatedHotspots
                    }
                }
            };
        });
    };

    const handleAddHotspot = (rect: Omit<Hotspot, 'id' | 'action'>) => {
        if (!projectConfig || !selectedContentId) return;

        const newHotspot: Hotspot = {
            id: `h-${Date.now()}`,
            ...rect,
            action: 'route'
        };

        setProjectConfig(prev => {
            if (!prev) return null;
            const content = prev.contents[selectedContentId];
            if (!content) return prev;

            return {
                ...prev,
                contents: {
                    ...prev.contents,
                    [selectedContentId]: {
                        ...content,
                        hotspots: [...content.hotspots, newHotspot]
                    }
                }
            };
        });

        setSelectedHotspotId(newHotspot.id);
    };

    const handleDeleteHotspot = (hotspotId: string) => {
        if (!projectConfig || !selectedContentId) return;

        setProjectConfig(prev => {
            if (!prev) return null;
            const content = prev.contents[selectedContentId];
            if (!content) return prev;

            return {
                ...prev,
                contents: {
                    ...prev.contents,
                    [selectedContentId]: {
                        ...content,
                        hotspots: content.hotspots.filter(h => h.id !== hotspotId)
                    }
                }
            };
        });

        setSelectedHotspotId(null);
    };

    const handleUpdateContentTitle = (contentId: string, newTitle: string) => {
        setProjectConfig(prev => {
            if (!prev) return null;
            const content = prev.contents[contentId];
            if (!content) return prev;
            return {
                ...prev,
                contents: {
                    ...prev.contents,
                    [contentId]: { ...content, title: newTitle }
                }
            };
        });
    };

    const handleUpdateContentHtml = (contentId: string, newHtml: string) => {
        setProjectConfig(prev => {
            if (!prev) return null;
            const content = prev.contents[contentId];
            if (!content) return prev;
            return {
                ...prev,
                contents: {
                    ...prev.contents,
                    [contentId]: { ...content, html: newHtml }
                }
            };
        });
    };

    const handleUpdateContentSrc = (contentId: string, newSrc: string) => {
        setProjectConfig(prev => {
            if (!prev) return null;
            const content = prev.contents[contentId];
            if (!content) return prev;
            return {
                ...prev,
                contents: {
                    ...prev.contents,
                    [contentId]: { ...content, src: newSrc }
                }
            };
        });
    };

    const handleAddHtmlContent = () => {
        if (!projectConfig || !selectedSequenceId) return;

        const newId = `html-${Date.now()}`;
        const newContent = {
            id: newId,
            title: 'Nueva Diapositiva HTML',
            type: 'html' as const,
            html: `
<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif;">
    <h1 style="font-size: 3rem; margin-bottom: 1rem; color: #4ecca3;">Nueva Diapositiva</h1>
    <p style="font-size: 1.2rem; opacity: 0.8;">Edita este contenido en el panel derecho.</p>
    <div style="margin-top: 2rem; padding: 1rem; border: 1px dashed rgba(255,255,255,0.3); border-radius: 8px;">
        Contenido interactivo básico
    </div>
</div>`,
            allowScripts: true,
            hotspots: []
        };

        setProjectConfig(prev => {
            if (!prev) return null;
            const updatedContents = { ...prev.contents, [newId]: newContent };
            const updatedSequences = prev.sequences.map(seq => {
                if (seq.id === selectedSequenceId) {
                    return { ...seq, contents: [...seq.contents, newId] };
                }
                return seq;
            });
            return { ...prev, contents: updatedContents, sequences: updatedSequences };
        });

        setSelectedContentId(newId);
    };

    const handleUploadContent = async (file: File) => {
        if (!projectConfig || !selectedSequenceId) return;

        const objectUrl = URL.createObjectURL(file);
        const newContentId = `content-${Date.now()}`;
        const defaultTitle = file.name.replace(/\.[^/.]+$/, '');

        // Intelligent folder mapping
        let folder = '/media/';
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            folder = '/media/pdf/';
        } else if (selectedSequenceId === 'seq-01') {
            folder = '/media/denominacion/';
        } else if (selectedSequenceId === 'seq-02') {
            folder = '/media/justificacion/';
        } else if (selectedSequenceId === 'seq-05') {
            folder = '/media/investigacion/';
        }

        let finalSrc = `${folder}${file.name}`;

        // Attempt to find actual file location on server
        try {
            const response = await fetch(`http://${window.location.hostname}:3001/api/find-asset?filename=${encodeURIComponent(file.name)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.path) {
                    finalSrc = data.path;
                }
            }
        } catch (error) {
            console.warn('Could not reach config server for path discovery, using fallback:', error);
        }

        const newContent = {
            id: newContentId,
            title: defaultTitle,
            type: (isPdf ? 'pdf' : file.type.startsWith('video') ? 'video' : 'image') as any,
            src: finalSrc,
            hotspots: [] as any[]
        };

        setPreviewUrls(prev => ({ ...prev, [newContentId]: objectUrl }));

        setProjectConfig(prev => {
            if (!prev) return null;
            const updatedContents = { ...prev.contents, [newContentId]: newContent };
            const updatedSequences = prev.sequences.map(seq => {
                if (seq.id === selectedSequenceId) {
                    return { ...seq, contents: [...seq.contents, newContentId] };
                }
                return seq;
            });
            return { ...prev, contents: updatedContents, sequences: updatedSequences };
        });

        setSelectedContentId(newContentId);
    };

    const handleReorderContent = (fromIndex: number, toIndex: number) => {
        if (!projectConfig || !selectedSequenceId) return;

        setProjectConfig(prev => {
            if (!prev) return null;
            const seq = prev.sequences.find(s => s.id === selectedSequenceId);
            if (!seq) return prev;

            const newContentIds = [...seq.contents];
            const [movedId] = newContentIds.splice(fromIndex, 1);
            newContentIds.splice(toIndex, 0, movedId);

            const updatedSequences = prev.sequences.map(s =>
                s.id === seq.id ? { ...s, contents: newContentIds } : s
            );

            return {
                ...prev,
                sequences: updatedSequences
            };
        });
    };

    const handleDeleteContent = (contentId: string) => {
        if (!projectConfig) return;

        if (!window.confirm('¿Estás seguro de que deseas eliminar este contenido?')) return;

        setProjectConfig(prev => {
            if (!prev) return null;

            // 1. Remove from all sequences
            const updatedSequences = prev.sequences.map(seq => ({
                ...seq,
                contents: seq.contents.filter(id => id !== contentId)
            }));

            // 2. Remove from global contents map
            const { [contentId]: _, ...remainingContents } = prev.contents;

            return {
                ...prev,
                sequences: updatedSequences,
                contents: remainingContents
            };
        });

        // Clear selection if deleted item was selected
        if (selectedContentId === contentId) {
            setSelectedContentId(null);
            setSelectedHotspotId(null);
        }
    };

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSave = async () => {
        if (!projectConfig) return;

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const response = await fetch(`http://${window.location.hostname}:3001/api/save-config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectConfig),
            });

            const data = await response.json();

            if (data.success) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error saving config:', error);
            setSaveStatus('error');

            // Fallback to download if server is not running
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectConfig, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "project-config.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } finally {
            setIsSaving(false);
        }
    };

    if (!projectConfig) {
        return <div className="flex h-screen items-center justify-center">Cargando proyecto...</div>;
    }

    // Section Selector View
    if (!selectedSequenceId) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Link to="/" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-icons">arrow_back</span>
                        </Link>
                        <h1 className="text-3xl font-bold">Editor MVP - Seleccionar Sección</h1>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projectConfig.sequences.map(seq => (
                            <button
                                key={seq.id}
                                onClick={() => setSelectedSequenceId(seq.id)}
                                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left group border border-transparent hover:border-primary"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Secuencia {seq.id.replace('seq-', '')}</span>
                                    <span className="material-icons text-gray-300 group-hover:text-primary transition-colors">edit</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{seq.title}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {seq.contents.length} contenido(s)
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Editor View

    // Filter config passed to ContentList to ONLY show the selected sequence
    // We create a "view" of the config that only contains the selected sequence
    const activeSequence = projectConfig.sequences.find(s => s.id === selectedSequenceId);

    // We pass the full config to properties panel but ContentList needs to only show one sequence.
    // Actually ContentList iterates over projectConfig.sequences. 
    // We can just create a fictitious projectConfig for ContentList or modify ContentList to accept a single sequence.
    // Modifying ContentList props is cleaner but requires editing that file.
    // For MVP efficiency, let's just create a filtered config for the prop.
    const filteredConfig = {
        ...projectConfig,
        sequences: activeSequence ? [activeSequence] : []
    };

    const selectedContent = selectedContentId ? projectConfig.contents[selectedContentId] : null;
    const selectedHotspot = selectedContent?.hotspots.find(h => h.id === selectedHotspotId) || null;

    const header = (
        <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSelectedSequenceId(null)}
                    className="text-gray-500 hover:text-primary flex items-center gap-1"
                    title="Volver a selección de sección"
                >
                    <span className="material-icons">arrow_back</span>
                    <span className="text-sm font-semibold">Secciones</span>
                </button>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
                <h1 className="text-lg font-bold text-gray-800 dark:text-white truncate max-w-md">
                    {activeSequence?.title || 'Editor'}
                </h1>
            </div>
            <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded shadow transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' :
                    saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                        saveStatus === 'error' ? 'bg-orange-600 hover:bg-orange-700' :
                            'bg-primary hover:bg-primary-dark'
                    } text-white`}
                title={saveStatus === 'error' ? 'Servidor no detectado. Se descargará el archivo.' : 'Guarda los cambios directamente en el proyecto'}
            >
                <span className="material-icons">
                    {isSaving ? 'sync' : saveStatus === 'success' ? 'check_circle' : saveStatus === 'error' ? 'warning' : 'save'}
                </span>
                <span>
                    {isSaving ? 'Guardando...' : saveStatus === 'success' ? 'Guardado' : saveStatus === 'error' ? 'Descargado (Local Offline)' : 'Guardar Cambios'}
                </span>
            </button>
        </div>
    );

    return (
        <EditorLayout
            header={header}
            leftPanel={
                <ContentList
                    projectConfig={filteredConfig}
                    selectedContentId={selectedContentId}
                    onSelectContent={handleSelectContent}
                    onUploadContent={handleUploadContent}
                    onAddHtmlContent={handleAddHtmlContent}
                    onReorderContent={handleReorderContent}
                    onDeleteContent={handleDeleteContent}
                />
            }
            centerPanel={
                <PresentationContainer
                    content={selectedContent}
                    previewUrl={selectedContentId ? previewUrls[selectedContentId] : undefined}
                    selectedHotspotId={selectedHotspotId}
                    onSelectHotspot={setSelectedHotspotId}
                    onAddHotspot={handleAddHotspot}
                    onNavigate={handleSelectContent}
                    onNavigateBack={handleNavigateBack}
                    onUpdateContentHtml={handleUpdateContentHtml}
                />
            }
            rightPanel={
                <PropertiesPanel
                    selectedHotspot={selectedHotspot}
                    selectedContent={selectedContent}
                    projectConfig={projectConfig}
                    onUpdateHotspot={handleUpdateHotspot}
                    onDeleteHotspot={handleDeleteHotspot}
                    onUpdateContentTitle={handleUpdateContentTitle}
                    onUpdateContentHtml={handleUpdateContentHtml}
                    onUpdateContentSrc={handleUpdateContentSrc}
                />
            }
        />
    );
};

export default Editor;
