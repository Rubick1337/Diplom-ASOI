'use client';
import './Footer.css';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-inner">

                <div className="footer-brand">

                    <div className="footer-info">
                        <div className="logo_footer_name">
                            <div className="footer-logo">
                                <Image
                                    src="/logo.png"
                                    alt="GooseCode Logo"
                                    width={48}
                                    height={48}
                                    className="footer-logo-img"
                                />
                            </div>
                            <div className="footer-name">GooseCode</div>
                        </div>
                        <p className="footer-tagline">
                            Практикуйся. Развивайся. Создавай.<br />
                            Учись программированию через вызовы.
                        </p>
                    </div>
                </div>

                <div className="footer-socials">
                    <h4 className="footer-social-title">Связаться со мной:</h4>

                    <div className="footer-social-links">

                        <a
                            href="https://github.com/yourgithub"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="GitHub"
                        >
                            <Image
                                src="/images/CreatorSection/Github.png"
                                alt="GitHub"
                                width={28}
                                height={28}
                                className="footer-social-icon"
                            />
                        </a>

                        <a
                            href="https://t.me/yourtelegram"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Telegram"
                        >
                            <Image
                                src="/images/CreatorSection/telegram.png"
                                alt="Telegram"
                                width={28}
                                height={28}
                                className="footer-social-icon"
                            />
                        </a>

                        <a
                            href="mailto:example@mail.com"
                            aria-label="Email"
                        >
                            <Image
                                src="/images/CreatorSection/gmail.png"
                                alt="Email"
                                width={28}
                                height={28}
                                className="footer-social-icon"
                            />
                        </a>

                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© 2025 GooseCode. Все права защищены.</p>
            </div>
        </footer>
    );
}
