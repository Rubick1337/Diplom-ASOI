'use client';

import { useState } from 'react';
import './RegisterForm.css';

export default function RegisterForm() {
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [pwd2, setPwd2] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: валидация/запрос
    };

    return (
        <form className="register-form" onSubmit={onSubmit}>
            <h1 className="register-title">Создать аккаунт</h1>

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

            <button className="register-btn" type="submit">Зарегистрироваться</button>
        </form>
    );
}
