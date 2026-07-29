'use client';

import React, { useEffect, useRef } from 'react';
import Editor, { DiffEditor, OnMount, OnValidate } from '@monaco-editor/react';
import { EditorValidation, EditorProblem } from '@/shared/types/ide';
import { useTheme } from '@/shared/context/ThemeContext';

interface ErrorMarker {
    line: number;
    col: number;
    endCol?: number;
}

interface CodeEditorProps {
    language: string;
    code: string;
    originalCode: string;
    isDiffMode: boolean;
    errorMarker?: ErrorMarker;

    onChange: (value: string | undefined) => void;
    onValidate: (stats: EditorValidation) => void;
    editorRef: any;
}

export default function CodeEditor({
                                       language,
                                       code,
                                       originalCode,
                                       isDiffMode,
                                       errorMarker,
                                       onChange,
                                       onValidate,
                                       editorRef
                                   }: CodeEditorProps) {
    const monacoRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);
    const { theme } = useTheme();

    useEffect(() => {
        if (!monacoRef.current) return;
        monacoRef.current.editor.setTheme(theme === 'light' ? 'vs-warm' : 'cyber-dark');
    }, [theme]);

    const registerSnippets = (monaco: any, lang: string) => {
        if (lang === 'python') {
            monaco.languages.registerCompletionItemProvider('python', {
                provideCompletionItems: (model: any, position: any) => {
                    const suggestions = [
                        {
                            label: 'fori',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: 'for i in range(${1:n}):\n    ${2:pass}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Цикл for i in range'
                        },
                        {
                            label: 'def',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: 'def ${1:func_name}(${2:args}):\n    ${3:pass}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Объявление функции'
                        },
                        {
                            label: 'print',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: 'print(f"${1:text}: {${2:value}}")',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Print с f-строкой'
                        }
                    ];
                    return { suggestions: suggestions };
                }
            });
        }

        if (lang === 'cpp') {
            monaco.languages.registerCompletionItemProvider('cpp', {
                provideCompletionItems: () => {
                    return {
                        suggestions: [
                            {
                                label: 'cout',
                                kind: monaco.languages.CompletionItemKind.Snippet,
                                insertText: 'std::cout << ${1:value} << std::endl;',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Вывод в консоль'
                            },
                            {
                                label: 'vector',
                                kind: monaco.languages.CompletionItemKind.Snippet,
                                insertText: 'std::vector<${1:int}> ${2:v};',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Создание вектора'
                            },
                            {
                                label: 'fori',
                                kind: monaco.languages.CompletionItemKind.Snippet,
                                insertText: 'for (int i = 0; i < ${1:n}; ++i) {\n    ${2:// code}\n}',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Цикл for'
                            }
                        ]
                    };
                }
            });
        }

        if (lang === 'javascript' || lang === 'typescript') {
            monaco.languages.registerCompletionItemProvider(lang, {
                provideCompletionItems: () => {
                    return {
                        suggestions: [
                            {
                                label: 'clg',
                                kind: monaco.languages.CompletionItemKind.Snippet,
                                insertText: 'console.log(${1:value});',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Console log'
                            },
                            {
                                label: 'func',
                                kind: monaco.languages.CompletionItemKind.Snippet,
                                insertText: 'function ${1:name}(${2:args}) {\n    ${3:// code}\n}',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Функция'
                            },
                            {
                                label: 'fori',
                                kind: monaco.languages.CompletionItemKind.Snippet,
                                insertText: 'for (let i = 0; i < ${1:n}; i++) {\n    ${2:// code}\n}',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Цикл for'
                            }
                        ]
                    };
                }
            });
        }
    };

    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
        const model = editor.getModel();
        if (model) monaco.editor.setModelMarkers(model, 'execution-error', []);

        if (!errorMarker || errorMarker.line <= 0) return;

        const { line, col, endCol } = errorMarker;

        if (!model || line > model.getLineCount()) return;

        const safeCol = Math.max(1, col);

        decorationsRef.current = editor.deltaDecorations([], [{
            range: new monaco.Range(line, 1, line, 1),
            options: {
                isWholeLine: true,
                className: 'editor-error-line',
                glyphMarginClassName: 'editor-error-glyph',
                overviewRuler: { color: '#f85149', position: 1 },
            }
        }]);

        if (model) {
            const lineContent = model.getLineContent(line) || '';
            const resolvedEndCol = Math.max(safeCol + 1, endCol ?? (lineContent.length + 1));
            monaco.editor.setModelMarkers(model, 'execution-error', [{
                severity: monaco.MarkerSeverity.Error,
                message: 'Runtime Error',
                startLineNumber: line,
                startColumn: safeCol,
                endLineNumber: line,
                endColumn: resolvedEndCol,
            }]);
        }
    }, [errorMarker]);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        monaco.editor.defineTheme('cyber-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#0b121b',
                'editor.lineHighlightBackground': '#1a2e42',
            }
        });
        monaco.editor.defineTheme('vs-warm', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#f5f0e8',
                'editor.lineHighlightBackground': '#ede8df',
                'editorLineNumber.foreground': '#b0a898',
                'editorGutter.background': '#f5f0e8',
            }
        });
        monaco.editor.setTheme(theme === 'light' ? 'vs-warm' : 'cyber-dark');

        if (language === 'coffeescript') {
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
            });
        } else {

            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false,
                noSyntaxValidation: false,
            });
        }

        registerSnippets(monaco, language);
    };

    const handleValidate: OnValidate = (markers) => {

        if (language === 'coffeescript') {
            onValidate({ errors: 0, warnings: 0, problems: [] });
            return;
        }

        const problems: EditorProblem[] = markers.map((m, i) => ({
            id: `err-${i}`,
            message: m.message,
            line: m.startLineNumber,
            column: m.startColumn,
            severity: m.severity === 8 ? 'Error' : 'Warning'
        }));

        onValidate({
            errors: problems.filter(p => p.severity === 'Error').length,
            warnings: problems.filter(p => p.severity === 'Warning').length,
            problems: problems
        });
    };

    const getExtension = (lang: string) => {
        switch (lang) {
            case 'cpp':          return 'cpp';
            case 'python':       return 'py';
            case 'typescript':   return 'ts';
            case 'coffeescript': return 'coffee';
            case 'csharp':       return 'cs';
            case 'php':          return 'php';
            case 'java':         return 'java';
            default:             return 'js';
        }
    };

    const getMonacoLanguage = (lang: string) => {
        if (lang === 'coffeescript') return 'javascript';
        return lang;
    };

    const commonOptions = {
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'Fira Code', monospace",
        automaticLayout: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        snippetSuggestions: 'inline' as const,
        wordBasedSuggestions: 'allDocuments' as const
    };

    if (isDiffMode) {
        return (
            <DiffEditor
                height="100%"
                language={language}
                theme={theme === 'light' ? 'vs-warm' : 'vs-dark'}
                original={originalCode}
                modified={code}
                onMount={(editor, monaco) => {
                    monacoRef.current = monaco;
                    monaco.editor.setTheme(theme === 'light' ? 'vs-warm' : 'cyber-dark');
                }}
                options={{
                    ...commonOptions,
                    readOnly: true,
                    renderSideBySide: true
                }}
            />
        );
    }

    return (
        <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            path={`solution.${getExtension(language)}`}
            value={code}
            theme={theme === 'light' ? 'vs-warm' : 'vs-dark'}
            onChange={onChange}
            onMount={handleEditorDidMount}
            onValidate={handleValidate}
            options={commonOptions}
        />
    );
}
