'use client';
import Image from 'next/image';
import './CreatorSection.css';

export default function CreatorSection() {
    return (
        <section id="creator" className="creator-section">
            <div className="creator-container">

                <h2 className="creator-title">О создателе</h2>

                <div className="creator-card">

                    <div className="creator-avatar">
                        <Image
                            src="/images/CreatorSection/Creator.jpg"
                            alt="Создатель"
                            width={140}
                            height={140}
                            className="creator-img"
                            priority
                        />
                    </div>

                    <div className="creator-name">Гусев Алексей Сергеевич</div>

                    <div className="creator-separator"></div>

                    <div className="creator-desc">
                        Студент 4 курса, группа <span>АСИОР-221</span>.
                    </div>
                    <div className="creator-socials">
                        <a
                            href="https://github.com/Rubick1337"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-icon"
                        >
                            <Image
                                src="/images/CreatorSection/Github.png"
                                alt="GitHub"
                                width={42}
                                height={42}
                                className="social-img"
                            />
                        </a>

                        <a
                            href="https://t.me/yourtelegram"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-icon"
                        >
                            <Image
                                src="/images/CreatorSection/telegram.png"
                                alt="Telegram"
                                width={42}
                                height={42}
                                className="social-img"
                            />
                        </a>
                        <a
                            href="https://t.me/yourtelegram"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-icon"
                        >
                            <Image
                                src="/images/CreatorSection/gmail.png"
                                alt="Telegram"
                                width={42}
                                height={42}
                                className="social-img"
                            />
                        </a>
                    </div>

                </div>
            </div>
        </section>
    );
}
