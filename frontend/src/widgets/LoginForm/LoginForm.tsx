'use client';

import { useState } from 'react';
import './LoginForm.css';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: запрос на логин
    };

    return (
        <form className="login-form" onSubmit={onSubmit}>
            <h1 className="login-title">Вход в GooseCode</h1>

            <div className="login-field">
                <label htmlFor="login-email">Email</label>
                <input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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

            <button className="login-btn" type="submit">Войти</button>
        </form>
    );
}
