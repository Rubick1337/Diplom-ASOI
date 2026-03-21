'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import './not-found.css';

const ERROR_LINES = [
    { delay: 0,    text: '$ goosecode run app.js',              type: 'cmd'  },
    { delay: 400,  text: 'Compiling...',                         type: 'info' },
    { delay: 900,  text: '',                                     type: 'gap'  },
    { delay: 1100, text: '✖ RuntimeError: Page not found',       type: 'err'  },
    { delay: 1400, text: '  at Router.navigate (router.js:404)', type: 'trace'},
    { delay: 1600, text: '  at GooseCode.request (app.js:1)',    type: 'trace'},
    { delay: 1900, text: '',                                     type: 'gap'  },
    { delay: 2100, text: '  exit code 404',                      type: 'exit' },
];

export default function NotFound() {
    const router = useRouter();
    const [visibleLines, setVisibleLines] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [typedLines, setTypedLines] = useState<{ text: string; type: string }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timers = ERROR_LINES.map((_, i) =>
            setTimeout(() => setVisibleLines(i + 1), ERROR_LINES[i].delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [typedLines, visibleLines]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        const cmd = inputValue.trim();
        setInputValue('');
        if (!cmd) return;
        if (cmd === 'return') {
            router.push('/');
            return;
        }
        setTypedLines(prev => [
            ...prev,
            { text: `$ ${cmd}`, type: 'cmd' },
            { text: `bash: ${cmd}: command not found`, type: 'err' },
        ]);
    };

    return (
        <div className="nf-page">
            <div className="nf-code" aria-label="404">
                <span className="nf-code__main" data-text="404">404</span>
            </div>

            <div className="nf-terminal">
                <div className="nf-terminal__bar">
                    <span className="nf-dot nf-dot--red" />
                    <span className="nf-dot nf-dot--yellow" />
                    <span className="nf-dot nf-dot--green" />
                    <span className="nf-terminal__title">goosecode — bash</span>
                </div>
                <div className="nf-terminal__body" ref={bodyRef}>
                    {ERROR_LINES.slice(0, visibleLines).map((line, i) => (
                        <div key={i} className={`nf-line nf-line--${line.type}`}>
                            {line.text}
                        </div>
                    ))}
                    {typedLines.map((line, i) => (
                        <div key={`t${i}`} className={`nf-line nf-line--${line.type}`}>
                            {line.text}
                        </div>
                    ))}
                    {visibleLines >= ERROR_LINES.length && (
                        <div className="nf-line nf-line--cmd nf-input-line" onClick={() => inputRef.current?.focus()}>
                            <span className="nf-prompt">$&nbsp;</span>
                            <input
                                ref={inputRef}
                                className="nf-terminal-input"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                spellCheck={false}
                                autoComplete="off"
                                autoCorrect="off"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="nf-goose-stage">
                <div className="nf-goose-walker">
                    {}
                    <img src="/images/goose-leader.gif" alt="" className="nf-goose-gif" />
                </div>
            </div>

            <h1 className="nf-title">Страница не найдена</h1>
            <p className="nf-sub">Введи <code style={{color:'#FF6B35'}}>return</code> чтобы вернуться на главную.</p>

            <div className="nf-actions">
                <button className="nf-btn nf-btn--primary" onClick={() => router.push('/')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    На главную
                </button>
                <button className="nf-btn nf-btn--ghost" onClick={() => router.push('/challenges')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    К задачам
                </button>
            </div>
        </div>
    );
}
