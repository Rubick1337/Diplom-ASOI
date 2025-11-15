'use client';

import { useState } from 'react';
import './RegisterForm.css';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { registration } from '@/shared/store/slice/authSlice';

export default function RegisterForm() {
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((s) => s.auth);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [pwd2, setPwd2] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);

    // роль по умолчанию, например 0 = обычный пользователь
    const defaultRole = 0;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (pwd !== pwd2) {
            alert('Пароли не совпадают');
            return;
        }

        await dispatch(
            registration({
                username,
                email,
                password: pwd,
                role: defaultRole,
            })
        );
    };

    return (
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
                    required
                />
            </div>

            {/* EMAIL */}
            <div className="reg-field">
                <label htmlFor="reg-email">Email</label>
                <input
                    id="reg-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            {/* PASSWORD */}
            <div className="reg-field">
                <label htmlFor="reg-pass">Пароль</label>
                <div className="reg-pass-wrap">
                    <input
                        id="reg-pass"
                        type={showPwd ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        required
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
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={pwd2}
                        onChange={(e) => setPwd2(e.target.value)}
                        required
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

            {/* Ошибка */}
            {error && <div className="auth-error">{error}</div>}

            <button className="register-btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>

            {/* --- разделитель --- */}
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
    );
}
