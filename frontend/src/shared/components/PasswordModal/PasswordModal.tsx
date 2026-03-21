import Image from 'next/image';
import './PasswordModal.css';

interface PasswordModalProps {
    password: string;
    error?: string;
    onPasswordChange: (value: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function PasswordModal({ password, error, onPasswordChange, onConfirm, onCancel }: PasswordModalProps) {
    return (
        <div className="password-modal">
            <div className="password-modal-inner">
                <div className="password-modal-title">
                    <Image src="/images/arena/locker.png" alt="" width={20} height={20} />
                    <h3>Комната защищена паролем</h3>
                </div>
                <input
                    className="password-modal-input"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={e => onPasswordChange(e.target.value)}
                    type="password"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && onConfirm()}
                />
                {error && <p className="password-modal-error">⚠️ {error}</p>}
                <div className="password-modal-buttons">
                    <button className="btn-apply" style={{ flex: 1, maxWidth: 'none' }} onClick={onConfirm}>
                        Войти
                    </button>
                    <button className="btn-reset" style={{ flex: 1 }} onClick={onCancel}>
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
}
