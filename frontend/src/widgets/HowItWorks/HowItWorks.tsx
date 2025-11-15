'use client';
import './HowItWorks.css';

export default function HowItWorks() {
    const steps = [
        {
            n: '01',
            t: 'Выбирай задачу',
            d: 'Подбирай задачи под свой уровень — от простых до продвинутых.',
        },
        {
            n: '02',
            t: 'Пиши код',
            d: 'Запускай тесты, проверяй решение, улучшай свой стиль программирования.',
        },
        {
            n: '03',
            t: 'Теоретические тесты',
            d: 'Проходи квизы и закрепляй знания по алгоритмам и основам языка.',
        },
    ];

    return (
        <section id="howitworks" className="hiw-section">
            <div className="hiw-container">
                <h2 className="hiw-title">Как это работает</h2>

                <div className="hiw-grid">
                    {steps.map((s) => (
                        <div className="hiw-card" key={s.n}>
                            <div className="hiw-head">
                                <div className="hiw-step-badge">{s.n}</div>
                            </div>
                            <div className="hiw-ttl">{s.t}</div>
                            <div className="hiw-desc">{s.d}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
