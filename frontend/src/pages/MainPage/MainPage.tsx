'use client';

import MainHero from '@/widgets/MainHero/MainHero';
import ChallengeSectionMain from '@/widgets/ChallengeSectionMain/ChallengeSectionMain';
import LanguagesGrid from '@/widgets/LanguagesGrid/LanguagesGrid';
import HowItWorks from '@/widgets/HowItWorks/HowItWorks';
import CreatorSection from '@/widgets/CreatorSection/CreatorSection';
import MainHeader from '@/widgets/MainHeader/MainHeader';
import Header from '@/widgets/Header/Header';
import InfoAiMoodle from "@/widgets/InfoAiMoodle/InfoAiMoodle";
import { useAppSelector } from '@/shared/store/hooks';

export default function MainPage() {
    const { user } = useAppSelector(s => s.auth);

    return (
        <>
            {user ? <Header /> : <MainHeader />}
            <main className={`app-main-page${user ? ' app-main-page--sidebar' : ''}`}>
                <MainHero />
                <LanguagesGrid />
                <InfoAiMoodle/>
                <HowItWorks />
                <ChallengeSectionMain />
                <CreatorSection />
            </main>
        </>
    );
}
