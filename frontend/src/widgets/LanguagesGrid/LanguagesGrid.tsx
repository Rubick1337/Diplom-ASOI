'use client';
import Image from 'next/image';
import './LanguagesGrid.css';

const langs = [
    { name: 'JavaScript', src: '/images/languages/javascript.png' },
    { name: 'TypeScript', src: '/images/languages/typescript.png' },
    { name: 'Python',     src: '/images/languages/python.png' },
    { name: 'C++',        src: '/images/languages/c++.png' },
    { name: 'C#',         src: '/images/languages/csharp.png' },
    { name: 'Java',       src: '/images/languages/java.png' },
    { name: 'Go',         src: '/images/languages/go.png' },
    { name: 'Ruby',       src: '/images/languages/ruby.png' },
    { name: 'Rust',       src: '/images/languages/rust.png' },
    { name: 'PHP',        src: '/images/languages/php.png' },
    { name: 'Lua',        src: '/images/languages/lua.png' },
    { name: 'R',          src: '/images/languages/r.png' },
];

export default function LanguagesGrid() {
    return (
        <section id="community" className="languages-section">
            <div className="languages-head">
                <h2 className="languages-title">55+ языков программирования</h2>
                <p className="languages-sub">Начни на любимом — осваивай следующий.</p>
            </div>

            <div className="languages-grid">
                {langs.map(l => (
                    <div className="lang-card" key={l.name} title={l.name}>
                        <div className="lang-glow"></div>
                        <Image className="lang-img" src={l.src} alt={l.name} width={64} height={64}/>
                        <div className="lang-name">{l.name}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
