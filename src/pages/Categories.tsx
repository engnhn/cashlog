import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from '../db/db';
import type { Category } from '../db/db'; // Explicit type import

export default function Categories() {
    const { t } = useTranslation();
    const categories = useLiveQuery(() => db.categories.toArray());
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [color, setColor] = useState('#ffffff');

    const handleEdit = (cat: Category) => {
        setEditingId(cat.id);
        setName(cat.name);
        setType(cat.type);
        setColor(cat.color || '#ffffff');
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingId(null);
        setName('');
        setType('expense');
        setColor('#ffffff');
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm(t('categories.delete') + '?')) {
            await db.categories.delete(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        if (editingId) {
            await db.categories.update(editingId, { name, type, color });
        } else {
            await db.categories.add({ name, type, color });
        }
        setShowModal(false);
    };

    const COLORS = [
        '#ef4444', // Red
        '#f97316', // Orange  
        '#eab308', // Yellow
        '#14b8a6', // Teal
        '#10b981', // Green
        '#3b82f6', // Blue
        '#6366f1', // Indigo
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#f59e0b', // Amber
        '#78716c', // Stone
        '#9ca3af'  // Gray
    ];

    return (
        <div>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter mb-1">{t('categories.title')}</h1>
                    <p className="text-text-secondary text-lg">{t('categories.subtitle')}</p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary-strong">
                    + {t('categories.add')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories?.map(cat => (
                    <div key={cat.id} className="card p-6 border border-border-color group relative hover:bg-surface-hover transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-bg-bg font-bold shadow-sm"
                                style={{ backgroundColor: cat.color || '#fff' }}
                            >
                                {cat.name.charAt(0)}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(cat)} className="text-text-secondary hover:text-text-primary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </button>
                                <button onClick={() => handleDelete(cat.id)} className="text-text-secondary hover:text-danger-text">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">{cat.name}</h3>
                        <span className="text-xs uppercase tracking-wider font-bold text-text-tertiary">{cat.type === 'income' ? t('categories.form.income') : t('categories.form.expense')}</span>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal-content modal-standard">
                        <h2 className="text-2xl font-bold mb-6 text-text-primary">{t('categories.form.title')}</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('categories.form.name')}</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" autoFocus required />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('categories.form.type')}</label>
                                <div className="flex gap-2 p-1 bg-surface-active rounded-md border border-border-color">
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all ${type === 'income' ? 'bg-text-primary text-bg-bg shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                        onClick={() => setType('income')}
                                    >
                                        {t('categories.form.income')}
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all ${type === 'expense' ? 'bg-text-primary text-bg-bg shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                        onClick={() => setType('expense')}
                                    >
                                        {t('categories.form.expense')}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('categories.form.color')}</label>
                                <div className="color-picker-grid">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={`color-option ${color === c ? 'selected' : ''}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4" style={{ borderTop: '1px solid var(--border-app)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">{t('categories.form.cancel')}</button>
                                <button type="submit" className="btn btn-primary-strong">{t('categories.form.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
