'use client';

import './LoginPage.css';
import LoginForm from '@/features/LoginForm/LoginForm';
import BackgroundVideo from '@/shared/components/BackgroundVideo/BackgroundVideo';
import AuthHeader from '@/widgets/AuthHeader/AuthHeader';
import ReduxProvider from '@/app/ReduxProvider';

export default function LoginPage() {
    return (
        <ReduxProvider>
            <AuthHeader />
            <main className="login-main">
                <BackgroundVideo
                    src="/video/background_wave.mp4"
                    className="login-bg-video"
                />
                <div className="login-overlay"></div>
                <div className="login-content">
                    <LoginForm />
                </div>
            </main>
        </ReduxProvider>
    );
}
