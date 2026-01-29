'use client';

import BackgroundVideo from '@/shared/components/BackgroundVideo/BackgroundVideo';
import RegisterForm from '@/features/RegisterForm/RegisterForm';
import './RegisterPage.css';
import AuthHeader from "@/widgets/AuthHeader/AuthHeader";
import ReduxProvider from "@/app/ReduxProvider";

export default function RegisterPage() {
    return (
        <>
            <ReduxProvider>
            <AuthHeader/>
        <main className="register-main">
            <BackgroundVideo src="/video/background_wave.mp4" className="register-bg-video" />
            <div className="register-overlay" />
            <div className="register-content">
                <RegisterForm />
            </div>
        </main>
            </ReduxProvider>
        </>
    );
}
