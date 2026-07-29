'use client';

import type { FormEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './RegisterForm.css';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { registration } from '@/shared/store/slice/authSlice';
import AuthService from '@/shared/services/AuthService';
import Alert from '@/shared/components/Alert/Alert';

export default function RegisterForm() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { isLoading } = useAppSelector((s) => s.auth);

    const [step, setStep] = useState<1 | 2>(1);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [pwd2, setPwd2] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);
    const [code, setCode] = useState<string[]>(Array(6).fill(''));
    const [isSending, setIsSending] = useState(false);
    const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const onSendCode = async (e: FormEvent) => {
        e.preventDefault();

        if (!username.trim() || username.trim().length < 3) {
            setAlert({ type: 'error', message: 'Имя пользователя должно быть не короче 3 символов' });
            return;
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setAlert({ type: 'error', message: 'Введите корректный email' });
            return;
        }
        if (!pwd || pwd.length < 6) {
            setAlert({ type: 'error', message: 'Пароль должен быть не короче 6 символов' });
            return;
        }
        if (pwd !== pwd2) {
            setAlert({ type: 'error', message: 'Пароли не совпадают' });
            return;
        }

        setIsSending(true);
        try {
            await AuthService.sendVerificationCode(username.trim(), email.trim(), pwd);
            setStep(2);
            setAlert(null);
        } catch (err: unknown) {
            const msg =
                (err as any)?.response?.data?.message ||
                (err instanceof Error ? err.message : 'Ошибка отправки кода');
            setAlert({ type: 'error', message: msg });
        } finally {
            setIsSending(false);
        }
    };

    const onRegister = async (e: FormEvent) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setAlert({ type: 'error', message: 'Введите 6-значный код' });
            return;
        }

        try {
            await dispatch(registration({ email: email.trim(), code: fullCode })).unwrap();
            setAlert({ type: 'success', message: 'Аккаунт успешно создан!' });
            setTimeout(() => router.push('/challenges'), 800);
        } catch (err: unknown) {
            const msg = typeof err === 'string' ? err : (err instanceof Error ? err.message : 'Ошибка при регистрации');
            setAlert({ type: 'error', message: msg });
        }
    };

    const onCodeChange = (idx: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...code];
        next[idx] = value;
        setCode(next);
        if (value && idx < 5) codeRefs.current[idx + 1]?.focus();
    };

    const onCodeKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0) {
            codeRefs.current[idx - 1]?.focus();
        }
    };

    const onCodePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!text) return;
        const next = Array(6).fill('');
        for (let i = 0; i < text.length; i++) next[i] = text[i];
        setCode(next);
        codeRefs.current[Math.min(text.length, 5)]?.focus();
    };

    const onResend = async () => {
        setIsSending(true);
        try {
            await AuthService.sendVerificationCode(username.trim(), email.trim(), pwd);
            setCode(Array(6).fill(''));
            setAlert({ type: 'success', message: 'Новый код отправлен' });
            codeRefs.current[0]?.focus();
        } catch (err: unknown) {
            const msg = (err as any)?.response?.data?.message || 'Ошибка повторной отправки';
            setAlert({ type: 'error', message: msg });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

            <div className="reg-steps">
                <div className="reg-step">
                    <div className={`reg-step-circle ${step === 1 ? 'active' : 'done'}`}>
                        {step > 1 ? '✓' : '1'}
                    </div>
                    <span className={`reg-step-label ${step === 1 ? 'active' : ''}`}>Данные</span>
                </div>
                <div className={`reg-step-line ${step > 1 ? 'done' : ''}`} />
                <div className="reg-step">
                    <div className={`reg-step-circle ${step === 2 ? 'active' : ''}`}>2</div>
                    <span className={`reg-step-label ${step === 2 ? 'active' : ''}`}>Подтверждение</span>
                </div>
            </div>

            <form className="register-form" onSubmit={step === 1 ? onSendCode : onRegister}>
                <h1 className="register-title">Создать аккаунт</h1>

                {step === 1 && (
                    <>
                        <div className="reg-field">
                            <label htmlFor="reg-username">Имя пользователя</label>
                            <input
                                id="reg-username"
                                type="text"
                                placeholder="nickname"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isSending}
                            />
                        </div>

                        <div className="reg-field">
                            <label htmlFor="reg-email">Email</label>
                            <input
                                id="reg-email"
                                type="text"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isSending}
                            />
                        </div>

                        <div className="reg-field">
                            <label htmlFor="reg-pass">Пароль</label>
                            <div className="reg-pass-wrap">
                                <input
                                    id="reg-pass"
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={pwd}
                                    onChange={(e) => setPwd(e.target.value)}
                                    disabled={isSending}
                                />
                                <button type="button" className="reveal-btn" aria-pressed={showPwd} onClick={() => setShowPwd((v) => !v)}>
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
                                    placeholder="••••••••"
                                    value={pwd2}
                                    onChange={(e) => setPwd2(e.target.value)}
                                    disabled={isSending}
                                />
                                <button type="button" className="reveal-btn" aria-pressed={showPwd2} onClick={() => setShowPwd2((v) => !v)}>
                                    {showPwd2 ? 'Скрыть' : 'Показать'}
                                </button>
                            </div>
                        </div>

                        <button className="register-btn" type="submit" disabled={isSending}>
                            {isSending ? 'Отправка кода...' : 'Далее →'}
                        </button>

                        <div className="register-divider"><span>или</span></div>

                        <div className="register-social">
                            <button
                                type="button"
                                className="social-btn google-btn"
                                onClick={() => { window.location.href = 'http://localhost:8000/api/auth/google'; }}
                                disabled={isSending}
                            >
                                <Image src="/images/CreatorSection/google.png" alt="Google" width={22} height={22} className="social-icon-auth" />
                                Продолжить через Google
                            </button>
                            <button
                                type="button"
                                className="social-btn github-btn"
                                onClick={() => { window.location.href = 'http://localhost:8000/api/auth/github'; }}
                                disabled={isSending}
                            >
                                <Image src="/images/CreatorSection/Github.png" alt="GitHub" width={22} height={22} className="social-icon-auth" />
                                Продолжить через GitHub
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <p className="reg-code-hint">
                            Мы отправили 6-значный код на <strong>{email}</strong>
                        </p>

                        <div className="reg-code-inputs">
                            {code.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => { codeRefs.current[idx] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    className="reg-code-box"
                                    onChange={(e) => onCodeChange(idx, e.target.value)}
                                    onKeyDown={(e) => onCodeKeyDown(idx, e)}
                                    onPaste={onCodePaste}
                                    disabled={isLoading}
                                    autoFocus={idx === 0}
                                />
                            ))}
                        </div>

                        <button
                            className="register-btn"
                            type="submit"
                            disabled={isLoading || code.join('').length < 6}
                        >
                            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                        </button>

                        <div className="reg-code-actions">
                            <button
                                type="button"
                                className="reg-link-btn"
                                onClick={() => setStep(1)}
                                disabled={isSending || isLoading}
                            >
                                ← Назад
                            </button>
                            <button
                                type="button"
                                className="reg-link-btn"
                                onClick={onResend}
                                disabled={isSending || isLoading}
                            >
                                {isSending ? 'Отправка...' : 'Отправить повторно'}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </>
    );
}
