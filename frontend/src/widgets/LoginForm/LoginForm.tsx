'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import './LoginForm.css';

import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { login } from '@/shared/store/slice/authSlice';
import { useRouter } from 'next/navigation';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    const dispatch = useAppDispatch();
    const router = useRouter();

    const { isLoading, error, isAuth } = useAppSelector((state) => state.auth);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // у нас на бэке login = email/username, так что можно передать email
        try {
            await dispatch(
                login({ login: email, password: pwd })
            ).unwrap();

            // здесь можешь редиректить куда хочешь после успешного входа
            router.push('/'); // или '/profile', '/tasks', etc.
        } catch (err) {
            // ошибка уже попадёт в state.error через rejected
            console.error('Login failed:', err);
        }
    };

    const handleGoogleLogin = () => {
        // редирект напрямую на бэкенд OAuth
        window.location.href = `${API_BASE_URL}/auth/google`;
    };

    const handleGithubLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/github`;
    };

    return (
        <form className="login-form" onSubmit={onSubmit}>
            <h1 className="login-title">Вход в GooseCode</h1>

            {/* Можно показывать общий статус */}
            {isAuth && (
                <p className="login-status login-status_ok">
                    Вы уже авторизованы
                </p>
            )}

            {error && (
                <p className="login-status login-status_error">
                    {error}
                </p>
            )}

            {/* поля */}
            <div className="login-field">
                <label htmlFor="login-email">Email или логин</label>
                <input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="login-field">
                <label htmlFor="login-pass">Пароль</label>
                <div className="login-pass-wrap">
                    <input
                        id="login-pass"
                        type={showPwd ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        className="reveal-btn"
                        aria-pressed={showPwd}
                        onClick={() => setShowPwd((v) => !v)}
                        title={showPwd ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                        {showPwd ? 'Скрыть' : 'Показать'}
                    </button>
                </div>
            </div>

            <button className="login-btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Входим...' : 'Войти'}
            </button>

            {/* --- разделитель --- */}
            <div className="login-divider">
                <span>или</span>
            </div>

            <div className="social-login">
                <button
                    type="button"
                    className="social-btn google-btn"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <Image
                        src="/images/CreatorSection/google.png"
                        alt="Google"
                        width={22}
                        height={22}
                        className="social-icon-auth"
                    />
                    Войти через Google
                </button>

                <button
                    type="button"
                    className="social-btn github-btn"
                    onClick={handleGithubLogin}
                    disabled={isLoading}
                >
                    <Image
                        src="/images/CreatorSection/Github.png"
                        alt="GitHub"
                        width={22}
                        height={22}
                        className="social-icon-auth"
                    />
                    Войти через GitHub
                </button>
            </div>
        </form>
    );
}
