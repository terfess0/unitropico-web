import React from 'react';
import { Hotspot, ActionType, ProjectConfig, Content } from '../../types';

interface PropertiesPanelProps {
    selectedHotspot: Hotspot | null;
    selectedContent: Content | null;
    projectConfig: ProjectConfig;
    onUpdateHotspot: (updatedHotspot: Hotspot) => void;
    onDeleteHotspot: (hotspotId: string) => void;
    onUpdateContentTitle: (contentId: string, newTitle: string) => void;
    onUpdateContentHtml: (contentId: string, newHtml: string) => void;
    onUpdateContentSrc: (contentId: string, newSrc: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedHotspot,
    selectedContent,
    projectConfig,
    onUpdateHotspot,
    onDeleteHotspot,
    onUpdateContentTitle,
    onUpdateContentHtml,
    onUpdateContentSrc
}) => {
    if (!selectedContent && !selectedHotspot) {
        return (
            <div className="p-6 text-center text-gray-500">
                <span className="material-icons text-4xl mb-2 text-gray-300">touch_app</span>
                <p>Selecciona un contenido para editar sus propiedades</p>
            </div>
        );
    }

    const handleChange = (field: keyof Hotspot, value: any) => {
        if (!selectedHotspot) return;
        onUpdateHotspot({ ...selectedHotspot, [field]: value });
    };

    // Get all available content options for target selection
    const contentOptions = (Object.values(projectConfig.contents) as Content[]).map(c => ({
        id: c.id,
        title: c.title
    }));

    // src is always the correct /media/ path; display it directly
    const srcLabel = selectedContent?.src ?? '';

    return (
        <div className="p-4 space-y-6">

            {/* ── Content Title Section ── */}
            {selectedContent && (
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 space-y-3">
                    <h3 className="font-bold text-sm">Contenido Seleccionado</h3>

                    {/* Editable title */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1 flex justify-between items-center">
                            <span>Título</span>
                            <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded select-all lowercase" title="Click para seleccionar el ID directamente">
                                {selectedContent.id}
                            </span>
                        </label>
                        <input
                            type="text"
                            value={selectedContent.title}
                            onChange={(e) => onUpdateContentTitle(selectedContent.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Título del contenido"
                        />
                    </div>

                    {/* HTML Content for type 'html' */}
                    {selectedContent.type === 'html' ? (
                        <div>
                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                                Código HTML
                            </label>
                            <textarea
                                value={selectedContent.html || ''}
                                onChange={(e) => onUpdateContentHtml(selectedContent.id, e.target.value)}
                                className="w-full px-3 py-2 h-48 font-mono text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                                placeholder="<div>Escribe tu HTML aquí...</div>"
                            />
                            <p className="mt-2 text-[10px] text-gray-500 italic">
                                Puedes usar JS para navegar:<br />
                                <code>window.parent.postMessage({"{ type: 'NAVIGATE', targetId: 'id' }"}, '*')</code>
                            </p>
                        </div>
                    ) : (
                        /* Editable src reference for image/video/pdf */
                        <div>
                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                                Archivo (src)
                            </label>
                            <input
                                type="text"
                                value={selectedContent.src || ''}
                                onChange={(e) => onUpdateContentSrc(selectedContent.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="/media/ruta/archivo.ext"
                            />
                            <p className="mt-1 text-[10px] text-gray-400 italic">
                                Asegúrate de incluir la carpeta correcta (ej: /media/justificacion/)
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Hotspot Section ── */}
            {selectedHotspot && selectedContent?.type !== 'html' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="font-bold">Propiedades del Hotspot</h3>
                        <button
                            onClick={() => onDeleteHotspot(selectedHotspot.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Eliminar hotspot"
                        >
                            <span className="material-icons text-sm">delete</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Hotspot Title */}
                        <div>
                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Título</label>
                            <input
                                type="text"
                                value={selectedHotspot.title || ''}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Nombre del hotspot"
                            />
                        </div>

                        {/* Action Type */}
                        <div>
                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Acción</label>
                            <select
                                value={selectedHotspot.action}
                                onChange={(e) => handleChange('action', e.target.value as ActionType)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="route">Navegar (Route)</option>
                                <option value="play">Reproducir (Play)</option>
                            </select>
                        </div>

                        {/* Target (only for route action) */}
                        {selectedHotspot.action === 'route' && (
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Destino</label>
                                <select
                                    value={selectedHotspot.target || ''}
                                    onChange={(e) => handleChange('target', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Seleccionar destino...</option>
                                    {contentOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.title || opt.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Coordinates */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">X (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={Math.round(selectedHotspot.x * 100) / 100}
                                    onChange={(e) => handleChange('x', parseFloat(e.target.value))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Y (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={Math.round(selectedHotspot.y * 100) / 100}
                                    onChange={(e) => handleChange('y', parseFloat(e.target.value))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Ancho (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={Math.round(selectedHotspot.width * 100) / 100}
                                    onChange={(e) => handleChange('width', parseFloat(e.target.value))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Alto (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={Math.round(selectedHotspot.height * 100) / 100}
                                    onChange={(e) => handleChange('height', parseFloat(e.target.value))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Z-Index</label>
                                <input
                                    type="number"
                                    step="1"
                                    value={selectedHotspot.zindex || 0}
                                    onChange={(e) => handleChange('zindex', parseInt(e.target.value))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800"
                                />
                            </div>
                        </div>
                        <div className="pt-2 text-xs text-gray-400">
                            Las coordenadas son valores normalizados (0-1).
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertiesPanel;
