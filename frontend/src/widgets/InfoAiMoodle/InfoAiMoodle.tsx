'use client';

import Image from 'next/image';
import './InfoAiMoodle.css';

export default function InfoAiMoodle() {
    return (
        <section id="highlights" className="hl-section">
            <div className="hl-container">
                <div className="hl-flex">
                    <article className="hl-item">
                        <div className="hl-badges" aria-hidden="true">
                            <div className="hex">
                                <Image
                                    src="/images/InfoAiMoodle/gpt.png"
                                    alt=""
                                    width={26}
                                    height={26}
                                    className="hex-img"
                                />
                            </div>
                        </div>

                        <h3 className="hl-title">AI-помощник для обучения</h3>
                        <p className="hl-desc">
                            GooseCode использует встроенный AI-ассистент, который подсказывает решения,
                            объясняет ошибки, помогает писать код.
                        </p>
                    </article>

                    <div className="hl-divider"></div>

                    <article className="hl-item">
                        <div className="hl-badges" aria-hidden="true">
                            <div className="hex hex-gold">
                                <Image
                                    src="/images/InfoAiMoodle/moodle.png"
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="hex-img"
                                />
                            </div>
                        </div>

                        <h3 className="hl-title hl-title-alt">Экспорт тестов в Moodle</h3>
                        <p className="hl-desc">
                            Теоретические тесты, созданные в GooseCode, можно в один клик
                            экспортировать в формат <b>Moodle XML</b>. Поддерживается вложение изображений,
                            авто-генерация вариантов ответов и категоризация вопросов.
                        </p>
                    </article>

                </div>
            </div>
        </section>
    );
}
