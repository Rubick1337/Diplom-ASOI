'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Image from 'next/image';
import './LoginForm.css';

import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { login } from '@/shared/store/slice/authSlice';
import { useRouter } from 'next/navigation';

import Alert from '@/shared/components/Alert/Alert';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LoginForm() {
    const [loginValue, setLoginValue] = useState('');
    const [pwd, setPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const dispatch = useAppDispatch();
    const router = useRouter();

    const { isLoading } = useAppSelector((state) => state.auth);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!loginValue.trim()) {
            setAlert({
                type: 'error',
                message: 'Введите email или логин',
            });
            return;
        }

        if (!pwd.trim()) {
            setAlert({
                type: 'error',
                message: 'Введите пароль',
            });
            return;
        }

        if (pwd.length < 6) {
            setAlert({
                type: 'error',
                message: 'Пароль должен быть не короче 6 символов',
            });
            return;
        }

        try {
            await dispatch(
                login({ login: loginValue, password: pwd })
            ).unwrap();

            setAlert({
                type: 'success',
                message: 'Вы успешно вошли!',
            });

            setTimeout(() => router.push('/'), 800);
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Неверный логин или пароль';

            setAlert({
                type: 'error',
                message,
            });
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
    };

    const handleGithubLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/github`;
    };

    return (
        <>
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <form className="login-form" onSubmit={onSubmit}>
                <h1 className="login-title">Вход в GooseCode</h1>

                <div className="login-field">
                    <label htmlFor="login-email">Email или логин</label>
                    <input
                        id="login-email"
                        type="text"
                        placeholder="you@example.com или username"
                        value={loginValue}
                        onChange={(e) => setLoginValue(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div className="login-field">
                    <label htmlFor="login-pass">Пароль</label>
                    <div className="login-pass-wrap">
                        <input
                            id="login-pass"
                            type={showPwd ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="reveal-btn"
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
                        />
                        Войти через GitHub
                    </button>
                </div>
            </form>
        </>
    );
}
