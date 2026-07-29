'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AdminApiService, { AdminAchievement, AchievementRarity } from '@/shared/services/AdminApiService';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal/ConfirmationModal';
import './AchievementsManageTab.css';

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9005/api').replace(/\/api$/, '');

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const act = (fn: () => void) => { fn(); setOpen(false); };

    return (
        <div className="amt-menu" ref={ref}>
            <button className="amt-menu__btn" onClick={() => setOpen(v => !v)} title="Действия">⋯</button>
            {open && (
                <div className="amt-menu__dropdown">
                    <button className="amt-menu__item amt-menu__item--edit" onClick={() => act(onEdit)}>
                        <img src="/images/edit.png" alt="" />
                        Изменить
                    </button>
                    <div className="amt-menu__divider" />
                    <button className="amt-menu__item amt-menu__item--delete" onClick={() => act(onDelete)}>
                        <img src="/images/trash.png" alt="" />
                        Удалить
                    </button>
                </div>
            )}
        </div>
    );
}

const RARITIES: AchievementRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_LABELS: Record<AchievementRarity, string> = {
    common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
};
const RARITY_COLOR: Record<AchievementRarity, string> = {
    common: '#9ca3af', uncommon: '#4ade80', rare: '#60a5fa', epic: '#c084fc', legendary: '#fbbf24',
};

const PAGE_SIZES = [8, 16, 24];

interface FormState {
    title: string;
    desc: string;
    rarity: AchievementRarity;
    imageFile: File | null;
    previewUrl: string | null;
}

const EMPTY_FORM: FormState = { title: '', desc: '', rarity: 'common', imageFile: null, previewUrl: null };

function AchievementModal({ title, initial, onSave, onClose, saving }: {
    title: string;
    initial: FormState;
    onSave: (f: FormState) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<FormState>(initial);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        setForm(f => ({ ...f, imageFile: file, previewUrl: URL.createObjectURL(file) }));
    };

    return createPortal(
        <div className="amt-modal-overlay" onClick={onClose}>
            <div className="amt-modal" onClick={e => e.stopPropagation()}>
                <div className="amt-modal__header">
                    <h3 className="amt-modal__title">{title}</h3>
                    <button className="amt-modal__close" onClick={onClose}>✕</button>
                </div>

                <div className="amt-modal__body">
                    <div className="amt-form__img-picker" onClick={() => fileRef.current?.click()}>
                        {form.previewUrl
                            ? <img src={form.previewUrl} alt="preview" className="amt-form__preview" />
                            : <span className="amt-form__img-placeholder">+ Картинка</span>
                        }
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                    </div>

                    <div className="amt-modal__fields">
                        <label className="amt-modal__label">Название</label>
                        <input
                            className="amt-input"
                            placeholder="Название достижения"
                            value={form.title}
                            maxLength={80}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        />

                        <label className="amt-modal__label">Описание</label>
                        <textarea
                            className="amt-input amt-textarea"
                            placeholder="Описание достижения"
                            value={form.desc}
                            maxLength={200}
                            rows={3}
                            onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                        />

                        <label className="amt-modal__label">Редкость</label>
                        <div className="amt-rarity-row">
                            {RARITIES.map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    className={`amt-rarity-btn${form.rarity === r ? ' amt-rarity-btn--active' : ''}`}
                                    style={form.rarity === r ? { borderColor: RARITY_COLOR[r], color: RARITY_COLOR[r] } : undefined}
                                    onClick={() => setForm(f => ({ ...f, rarity: r }))}
                                >
                                    {RARITY_LABELS[r]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="amt-modal__footer">
                    <button className="tt-btn tt-btn--cancel" onClick={onClose}>Отмена</button>
                    <button
                        className="tt-btn tt-btn--primary"
                        disabled={saving || !form.title.trim() || !form.desc.trim()}
                        onClick={() => onSave(form)}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function AchievementsManageTab() {
    const [list,         setList]         = useState<AdminAchievement[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<AdminAchievement | null>(null);
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState('');
    const [successMsg,   setSuccessMsg]   = useState('');
    const [page,         setPage]         = useState(1);
    const [pageSize,     setPageSize]     = useState(8);
    const [modalMode,    setModalMode]    = useState<'create' | 'edit' | null>(null);
    const [editTarget,   setEditTarget]   = useState<AdminAchievement | null>(null);

    const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

    const load = async () => {
        setLoading(true);
        try { setList(await AdminApiService.getAdminAchievements()); }
        catch { setError('Не удалось загрузить достижения'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const paginated  = list.slice((page - 1) * pageSize, page * pageSize);

    const buildForm = (f: FormState): FormData => {
        const fd = new FormData();
        fd.append('title', f.title);
        fd.append('desc', f.desc);
        fd.append('rarity', f.rarity);
        if (f.imageFile) fd.append('image', f.imageFile);
        return fd;
    };

    const handleCreate = async (f: FormState) => {
        setSaving(true); setError('');
        try {
            const row = await AdminApiService.createAdminAchievement(buildForm(f));
            setList(l => [...l, row]);
            setModalMode(null);
            setPage(1);
            flash('Достижение создано');
        } catch (e: any) { setError(e?.response?.data?.message ?? 'Ошибка'); }
        finally { setSaving(false); }
    };

    const handleUpdate = async (f: FormState) => {
        if (!editTarget) return;
        setSaving(true); setError('');
        try {
            const row = await AdminApiService.updateAdminAchievement(editTarget.id, buildForm(f));
            setList(l => l.map(a => a.id === row.id ? row : a));
            setModalMode(null);
            setEditTarget(null);
            flash('Достижение обновлено');
        } catch (e: any) { setError(e?.response?.data?.message ?? 'Ошибка'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await AdminApiService.deleteAdminAchievement(deleteTarget.id);
            setList(l => l.filter(a => a.id !== deleteTarget.id));
            setPage(p => Math.min(p, Math.max(1, Math.ceil((list.length - 1) / pageSize))));
            flash('Достижение удалено');
        } catch (e: any) { setError(e?.response?.data?.message ?? 'Ошибка'); }
        finally { setDeleteTarget(null); }
    };

    const openEdit = (a: AdminAchievement) => {
        setEditTarget(a);
        setModalMode('edit');
    };

    const editInitial = (): FormState => editTarget ? {
        title: editTarget.title,
        desc: editTarget.desc,
        rarity: editTarget.rarity,
        imageFile: null,
        previewUrl: editTarget.imageFilename ? `${BACKEND_BASE}/achievements/${editTarget.imageFilename}` : null,
    } : EMPTY_FORM;

    return (
        <section className="amt-section">
            <div className="tt-section__header">
                <div className="tt-section__accent" />
                <h2 className="tt-section__title">Управление достижениями</h2>
                <span className="tt-section__badge">{list.length} достижений</span>
            </div>

            {error      && <div className="tt-alert tt-alert--error">{error}</div>}
            {successMsg && <div className="tt-alert tt-alert--success">{successMsg}</div>}

            {/* Toolbar */}
            <div className="amt-toolbar">
                <button className="tt-btn tt-btn--primary" onClick={() => setModalMode('create')}>
                    + Создать достижение
                </button>
                <div className="amt-toolbar__sizes">
                    {PAGE_SIZES.map(s => (
                        <button
                            key={s}
                            className={`amt-size-btn${pageSize === s ? ' amt-size-btn--active' : ''}`}
                            onClick={() => { setPageSize(s); setPage(1); }}
                        >{s}</button>
                    ))}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="amt-grid">
                    {Array.from({ length: pageSize }).map((_, i) => <div key={i} className="amt-skeleton" />)}
                </div>
            ) : (
                <div className="amt-grid">
                    {paginated.map(a => (
                        <div
                            key={a.id}
                            className="amt-card amt-card--item"
                            style={{ '--color': RARITY_COLOR[a.rarity] } as React.CSSProperties}
                        >
                            <div className="amt-item__top">
                                <div className="amt-item__img-wrap">
                                    {a.imageFilename
                                        ? <img src={`${BACKEND_BASE}/achievements/${a.imageFilename}`} alt={a.title} className="amt-item__img" />
                                        : <span className="amt-item__img-placeholder">🏅</span>
                                    }
                                </div>
                                <div className="amt-item__info">
                                    <span className="amt-item__title">{a.title}</span>
                                    <span className="amt-item__rarity" style={{ color: RARITY_COLOR[a.rarity] }}>
                                        {RARITY_LABELS[a.rarity]}
                                    </span>
                                    <p className="amt-item__desc">{a.desc}</p>
                                </div>
                            </div>
                            <div className="amt-item__footer">
                                <span className="amt-item__pct">{a.percent ?? 0}% игроков</span>
                                <RowMenu
                                    onEdit={() => openEdit(a)}
                                    onDelete={() => setDeleteTarget(a)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="amt-pagination">
                    <button className="amt-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><img src="/images/left-arrow.png" alt="←" style={{width:'14px',height:'14px',verticalAlign:'middle'}} /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            className={`amt-page-btn${page === p ? ' amt-page-btn--active' : ''}`}
                            onClick={() => setPage(p)}
                        >{p}</button>
                    ))}
                    <button className="amt-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><img src="/images/right-arrow.png" alt="→" style={{width:'14px',height:'14px',verticalAlign:'middle'}} /></button>
                </div>
            )}

            {/* Modals */}
            {modalMode === 'create' && (
                <AchievementModal
                    title="Новое достижение"
                    initial={EMPTY_FORM}
                    onSave={handleCreate}
                    onClose={() => setModalMode(null)}
                    saving={saving}
                />
            )}
            {modalMode === 'edit' && editTarget && (
                <AchievementModal
                    title="Редактирование достижения"
                    initial={editInitial()}
                    onSave={handleUpdate}
                    onClose={() => { setModalMode(null); setEditTarget(null); }}
                    saving={saving}
                />
            )}

            {deleteTarget && (
                <ConfirmationModal
                    isOpen
                    title="Удаление достижения"
                    message={`Удалить достижение «${deleteTarget.title}»? Прогресс пользователей будет потерян.`}
                    confirmText="Удалить"
                    type="danger"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </section>
    );
}
