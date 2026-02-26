import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-okaidia.css';

interface HtmlCodeEditorProps {
    id: string;
    html: string;
    isVisible: boolean;
    onUpdateHtml: (id: string, newHtml: string) => void;
}

const HtmlCodeEditor: React.FC<HtmlCodeEditorProps> = ({ id, html, isVisible, onUpdateHtml }) => {
    return (
        <div className={`absolute inset-0 w-full h-full flex flex-col p-4 bg-gray-900 overflow-hidden z-10 transition-opacity duration-200 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-2 mb-2 text-primary font-mono text-xs font-bold uppercase tracking-widest opacity-70">
                <span className="material-icons text-xs">code</span>
                Editor de Código HTML Fullscreen
            </div>
            <div className="w-full flex-grow overflow-y-auto bg-[#272822] border border-gray-700 rounded-lg">
                <Editor
                    value={html || ''}
                    onValueChange={(code) => onUpdateHtml(id, code)}
                    highlight={code => Prism.highlight(code || '', Prism.languages.markup, 'markup')}
                    padding={24}
                    style={{
                        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                        fontSize: 16,
                        minHeight: '100%',
                        color: '#f8f8f2'
                    }}
                    textareaClassName="focus:outline-none"
                />
            </div>
        </div>
    );
};

export default HtmlCodeEditor;
