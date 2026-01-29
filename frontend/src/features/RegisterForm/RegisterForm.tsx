'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import './RegisterForm.css';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { registration } from '@/shared/store/slice/authSlice';
import Alert from '@/shared/components/Alert/Alert';

export default function RegisterForm() {
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((s) => s.auth);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [pwd2, setPwd2] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);

    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const defaultRole = 0;

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // ===== клиентская валидация =====
        if (!username.trim()) {
            setAlert({ type: 'error', message: 'Введите имя пользователя' });
            return;
        }

        if (username.trim().length < 3) {
            setAlert({
                type: 'error',
                message: 'Имя пользователя должно быть не короче 3 символов',
            });
            return;
        }

        if (!email.trim()) {
            setAlert({ type: 'error', message: 'Введите email' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setAlert({ type: 'error', message: 'Некорректный формат email' });
            return;
        }

        if (!pwd.trim() || !pwd2.trim()) {
            setAlert({
                type: 'error',
                message: 'Введите пароль и его подтверждение',
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

        if (pwd !== pwd2) {
            setAlert({ type: 'error', message: 'Пароли не совпадают' });
            return;
        }

        // ===== запрос регистрации =====
        try {
            await dispatch(
                registration({
                    username,
                    email,
                    password: pwd,
                    role: defaultRole,
                })
            ).unwrap();

            setAlert({
                type: 'success',
                message: 'Аккаунт успешно создан!',
            });
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Ошибка при регистрации';

            setAlert({
                type: 'error',
                message,
            });
        }
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

            <form className="register-form" onSubmit={onSubmit}>
                <h1 className="register-title">Создать аккаунт</h1>

                {/* USERNAME */}
                <div className="reg-field">
                    <label htmlFor="reg-username">Имя пользователя</label>
                    <input
                        id="reg-username"
                        type="text"
                        placeholder="nickname"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* EMAIL */}
                <div className="reg-field">
                    <label htmlFor="reg-email">Email</label>
                    <input
                        id="reg-email"
                        type="text"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* PASSWORD */}
                <div className="reg-field">
                    <label htmlFor="reg-pass">Пароль</label>
                    <div className="reg-pass-wrap">
                        <input
                            id="reg-pass"
                            type={showPwd ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
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

                {/* REPEAT PASSWORD */}
                <div className="reg-field">
                    <label htmlFor="reg-pass2">Повторите пароль</label>
                    <div className="reg-pass-wrap">
                        <input
                            id="reg-pass2"
                            type={showPwd2 ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={pwd2}
                            onChange={(e) => setPwd2(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="reveal-btn"
                            aria-pressed={showPwd2}
                            onClick={() => setShowPwd2((v) => !v)}
                            title={showPwd2 ? 'Скрыть пароль' : 'Показать пароль'}
                        >
                            {showPwd2 ? 'Скрыть' : 'Показать'}
                        </button>
                    </div>
                </div>

                <button className="register-btn" type="submit" disabled={isLoading}>
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>

                <div className="register-divider">
                    <span>или</span>
                </div>

                <div className="register-social">
                    <button
                        type="button"
                        className="social-btn google-btn"
                        onClick={() => {
                            window.location.href = 'http://localhost:8000/api/auth/google';
                        }}
                        disabled={isLoading}
                    >
                        <Image
                            src="/images/CreatorSection/google.png"
                            alt="Google"
                            width={22}
                            height={22}
                            className="social-icon-auth"
                        />
                        Продолжить через Google
                    </button>

                    <button
                        type="button"
                        className="social-btn github-btn"
                        onClick={() => {
                            window.location.href = 'http://localhost:8000/api/auth/github';
                        }}
                        disabled={isLoading}
                    >
                        <Image
                            src="/images/CreatorSection/Github.png"
                            alt="GitHub"
                            width={22}
                            height={22}
                            className="social-icon-auth"
                        />
                        Продолжить через GitHub
                    </button>
                </div>
            </form>
        </>
    );
}
