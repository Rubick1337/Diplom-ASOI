'use client';
import './ChallengeSectionMain.css';
import Image from 'next/image';
import KataTestsCard from '@/widgets/ChallengeSectionMainCards/TestsCard';
import TheoryTestsCard from '@/widgets/ChallengeSectionMainCards/TheoryTestsCard';
import {useRouter} from "next/navigation";

export default function ChallengeSectionMain() {
    const router = useRouter();
    return (
        <section id="challenges" className="challenge-section">
            <div className="challenge-container">
                <div className="challenge-content">
                    <div className="challenge-icon">
                        <div className="icon-wrapper">
                            <div className="icon-main" aria-hidden="true">
                                <Image
                                    src="/images/ChallengeSectionMain/ide.png"
                                    alt="IDE Icon"
                                    width={64}
                                    height={64}
                                    priority
                                />
                                <div className="icon-glow" />
                            </div>
                        </div>
                    </div>

                    <h1 className="challenge-title">
                        Sharpen your coding skills
                    </h1>

                    <p className="challenge-description">
                        На GooseCode есть собственный онлайн-компилятор, который запускает твой код в изолированных контейнерах, проверяет решение на тестах и показывает ошибки в реальном времени.
                    </p>

                    <div className="challenge-cta">
                        <button className="ide-button" onClick={() => router.push('/auth/login')}>Войти</button>
                        <button className="ide-button" onClick={() => router.push('/auth/login')}>Присоединиться</button>
                    </div>
                </div>

                <div className="challenge-art">
                    <Image
                        src="/images/ChallengeSectionMain/img.png"
                        alt="Coding preview"
                        width={480}
                        height={360}
                        className="challenge-art-img"
                        priority
                    />
                    <div className="challenge-art-glow" />
                </div>
            </div>
            <div className="challenge-subgrid">
                <KataTestsCard />
                <TheoryTestsCard />
            </div>
        </section>
    );
}
