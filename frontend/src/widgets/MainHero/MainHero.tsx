'use client';

import { useEffect, useRef, useState } from 'react';
import '@/widgets/MainHero/MainHero.css';

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    flash: number;
};

type CodeLine = {
    text: string;
    x: number;
    y: number;
    progress: number;   // сколько уже «напечатано»
    delay: number;      // задержка перед стартом
};

export default function MainHero() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mouseRef = useRef<{ x: number; y: number } | null>(null);

    // ====== typing заголовка ======
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);

    const textArray = [
        'Проверь свои знания\nна задачах',
        'Пиши • Решай тесты',
        'Прокачай навыки разработки',
    ];
    const currentText = textArray[loopNum % textArray.length];

    useEffect(() => {
        let t: ReturnType<typeof setTimeout>;
        const natural = 190;
        const delay = isDeleting ? natural / 2 : natural;

        const tick = () => {
            if (!isDeleting && displayText.length < currentText.length) {
                setDisplayText(currentText.slice(0, displayText.length + 1));
            } else if (isDeleting && displayText.length > 0) {
                setDisplayText(currentText.slice(0, displayText.length - 1));
            } else if (!isDeleting && displayText.length === currentText.length) {
                t = setTimeout(() => setIsDeleting(true), 1000);
                return;
            } else if (isDeleting && displayText.length === 0) {
                setIsDeleting(false);
                setLoopNum(v => v + 1);
            }
            t = setTimeout(tick, delay);
        };

        t = setTimeout(tick, delay);
        return () => clearTimeout(t);
    }, [displayText, isDeleting, currentText]);

    // ====== canvas: частицы + вспышки + печатающийся код ======
    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        const ctx = canvasEl.getContext('2d', { alpha: true });
        if (!ctx) return;

        const DPR =
            typeof window !== 'undefined'
                ? Math.max(1, Math.min(2, window.devicePixelRatio || 1))
                : 1;

        let w = canvasEl.offsetWidth;
        let h = canvasEl.offsetHeight;

        let particles: Particle[] = [];
        let codeLines: CodeLine[] = [];

        const COUNT_BASE = 80;
        const LINK_DIST = 140;
        const MOUSE_INFL = 90;

        const MAX_CODE_LINES = 20;

        const CODE_LINES_SOURCE = [
            'for (let i = 0; i < tests.length; i++) {',
            '  const result = run(solution, tests[i]);',
            '  if (result === tests[i].expected) score++;',
            '}',
            'def solve():',
            '    print("OK")',
            'assert result == expected',
            'console.log("tests passed");',
            'while (hasNextTest()) { run(); }',
            'if (allGreen) return "GG";',
        ];

        function initParticles() {
            const densityFactor = Math.min(
                1.2,
                Math.max(0.6, (w * h) / (1280 * 720)),
            );
            const count = Math.floor(COUNT_BASE * densityFactor);

            particles = new Array(count).fill(0).map(() => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: 1.2 + Math.random() * 1.8,
                flash: 0,
            }));
        }

        function randomCodeLine(): CodeLine {
            const text =
                CODE_LINES_SOURCE[
                    Math.floor(Math.random() * CODE_LINES_SOURCE.length)
                    ];

            // 🔥 ТЕПЕРЬ — ПО ВСЕЙ СЕКЦИИ
            const regionLeft = w * 0.05;
            const regionRight = w * 0.95;
            const regionTop = h * 0.08;
            const regionBottom = h * 0.92;

            const x =
                regionLeft +
                Math.random() * (regionRight - regionLeft);

            const y =
                regionTop +
                Math.random() * (regionBottom - regionTop);

            return {
                text,
                x,
                y,
                progress: 0,
                // базовая задержка побольше, чтобы всё было неторопливо
                delay: 120 + Math.random() * 80,
            };
        }

        function initCodeLines() {
            codeLines = [];
            for (let i = 0; i < MAX_CODE_LINES; i++) {
                const line = randomCodeLine();
                // чтобы не все стартовали одновременно
                line.delay += i * 8;
                codeLines.push(line);
            }
        }

        const resizeCanvas = () => {
            w = canvasEl.offsetWidth;
            h = canvasEl.offsetHeight;

            canvasEl.width = Math.floor(w * DPR);
            canvasEl.height = Math.floor(h * DPR);

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(DPR, DPR);

            initParticles();
            initCodeLines();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        const onMouseLeave = () => {
            mouseRef.current = null;
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseleave', onMouseLeave);

        const makeBgGradient = () => {
            const g = ctx.createLinearGradient(0, 0, 0, h);
            g.addColorStop(0, 'rgba(255,255,255,0.02)');
            g.addColorStop(1, 'rgba(14,14,14,0.18)');
            return g;
        };
        let bgGradient = makeBgGradient();

        const onResizeGradient = () => {
            bgGradient = makeBgGradient();
        };
        window.addEventListener('resize', onResizeGradient);

        let raf = 0;

        const step = () => {
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, w, h);

            // ===== печатающийся код по всей секции =====
            ctx.save();
            ctx.textBaseline = 'top';

            for (let i = 0; i < codeLines.length; i++) {
                const line = codeLines[i];

                if (line.delay > 0) {
                    line.delay -= 1;
                    continue;
                }

                // 🐢 замедлили набор: было 0.25, стало 0.07
                if (line.progress < line.text.length + 4) {
                    line.progress += 0.07;
                } else {
                    if (Math.random() < 0.01) {
                        codeLines[i] = randomCodeLine();
                        continue;
                    }
                }

                const visibleCount = Math.max(
                    0,
                    Math.min(line.text.length, Math.floor(line.progress)),
                );
                const shown = line.text.slice(0, visibleCount);

                const isTyping = line.progress < line.text.length;
                const cursorVisible =
                    isTyping && (Math.floor(line.progress * 2) % 2 === 0);

                const textWithCursor = shown + (cursorVisible ? '|' : '');

                ctx.globalAlpha = 0.6;
                ctx.font = '11px "JetBrains Mono", "Fira Code", monospace';
                ctx.fillStyle = 'rgba(230,230,230,0.9)';
                ctx.fillText(textWithCursor, line.x, line.y);
            }

            ctx.restore();

            // редкие «вспышки» частиц
            if (particles.length && Math.random() < 0.02) {
                const p = particles[Math.floor(Math.random() * particles.length)];
                p.flash = 1;
            }

            // частицы
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < -50) p.x = w + 50;
                if (p.x > w + 50) p.x = -50;
                if (p.y < -50) p.y = h + 50;
                if (p.y > h + 50) p.y = -50;

                if (p.flash > 0) {
                    p.flash *= 0.92;
                    if (p.flash < 0.01) p.flash = 0;
                }

                const m = mouseRef.current;
                if (m) {
                    const rect = canvasEl.getBoundingClientRect();
                    const mx = m.x - rect.left;
                    const my = m.y - rect.top;

                    const dx = mx - p.x;
                    const dy = my - p.y;
                    const d = Math.hypot(dx, dy);

                    if (d < MOUSE_INFL && d > 0.001) {
                        const k = (MOUSE_INFL - d) / MOUSE_INFL;
                        p.vx += (dx / d) * 0.02 * k;
                        p.vy += (dy / d) * 0.02 * k;
                    }
                }
            }

            // линии между частицами
            ctx.lineWidth = 1;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = dx * dx + dy * dy;
                    if (dist < LINK_DIST * LINK_DIST) {
                        const alpha = 1 - Math.sqrt(dist) / LINK_DIST;
                        ctx.strokeStyle = `rgba(240,73,73,${0.14 * alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // точки + вспышки
            for (const p of particles) {
                const flashRadius = p.r * (1 + 2.8 * p.flash);

                ctx.beginPath();
                ctx.fillStyle = `rgba(240,73,73,${0.18 + 0.35 * p.flash})`;
                ctx.arc(p.x, p.y, flashRadius * 2.4, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.fillStyle = `rgba(255,255,255,${0.7 + 0.3 * p.flash})`;
                ctx.arc(p.x, p.y, flashRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            raf = requestAnimationFrame(step);
        };

        raf = requestAnimationFrame(step);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('resize', onResizeGradient);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseleave', onMouseLeave);
        };
    }, []);

    return (
        <section id="hero" className="hero-section">
            <div className="hero-content">
                <h1 className="hero-title typing-text">
                    {displayText}
                    <span className={`typing-cursor ${isDeleting ? 'inactive' : ''}`}>|</span>
                </h1>
                <p className="hero-description">
                    Практикуйся на задачах, решай теоретические тесты и запускай код во
                    встроенном компиляторе. AI-помощник подскажет, где ошибка и как
                    улучшить решение.
                </p>
                <div className="cta-button-wrapper">
                    <div className="cta-button-glow" />
                    <button className="cta-button">Начнём?</button>
                </div>
            </div>

            <canvas ref={canvasRef} className="hero-canvas" />
        </section>
    );
}