'use client';

import MainHero from '@/widgets/MainHero/MainHero';
import ChallengeSectionMain from '@/widgets/ChallengeSectionMain/ChallengeSectionMain';
import LanguagesGrid from '@/widgets/LanguagesGrid/LanguagesGrid';
import HowItWorks from '@/widgets/HowItWorks/HowItWorks';
import CreatorSection from '@/widgets/CreatorSection/CreatorSection';
import MainHeader from '@/widgets/MainHeader/MainHeader';
import InfoAiMoodle from "@/widgets/InfoAiMoodle/InfoAiMoodle";

export default function MainPage() {

    return (
        <>
            <MainHeader />
            <main className="app-main-page">
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
