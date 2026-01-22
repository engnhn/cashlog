import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Transaction } from '../db/db';
import { useCurrency } from '../contexts/CurrencyContext';

interface TransactionFormProps {
    onClose: () => void;
    transaction?: Transaction;
}

export function TransactionForm({ onClose, transaction }: TransactionFormProps) {
    const { t } = useTranslation();
    const { getCurrencySymbol } = useCurrency();
    const [type, setType] = useState<'income' | 'expense'>(transaction ? (transaction.amount > 0 ? 'income' : 'expense') : 'expense');
    const [amount, setAmount] = useState(transaction ? Math.abs(transaction.amount).toString() : '');
    const [description, setDescription] = useState(transaction ? transaction.description : '');
    const [categoryId, setCategoryId] = useState<number>(transaction ? transaction.categoryId : 0);
    const [walletId, setWalletId] = useState<number>(transaction ? transaction.walletId : 1); // Default to 1 (main)

    // Recurring transaction state
    const [isRecurring, setIsRecurring] = useState(transaction?.isRecurring || false);
    const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
        transaction?.recurrenceFrequency || 'monthly'
    );
    const [untilCanceled, setUntilCanceled] = useState(!transaction?.recurrenceEndDate);

    // Format date for input (YYYY-MM-DD)
    const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState(transaction ? formatDateForInput(transaction.date) : formatDateForInput(new Date()));
    const [endDate, setEndDate] = useState(
        transaction?.recurrenceEndDate ? formatDateForInput(transaction.recurrenceEndDate) : ''
    );

    // Fetch wallets and categories
    const wallets = useLiveQuery(() => db.wallets.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalAmount = parseFloat(amount);
        if (!finalAmount || !description) return; // Basic validation

        const transactionData = {
            walletId: walletId || (wallets?.[0]?.id || 1),
            categoryId: categoryId || (categories?.[0]?.id || 0),
            amount: type === 'income' ? finalAmount : -finalAmount,
            date: new Date(date + 'T12:00:00'), // Use selected date (set to noon to avoid timezone issues)
            description,
            isRecurring,
            recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
            recurrenceEndDate: isRecurring && !untilCanceled && endDate ? new Date(endDate + 'T12:00:00') : null
        };

        if (transaction) {
            await db.transactions.update(transaction.id, transactionData);
        } else {
            await db.transactions.add(transactionData);
        }

        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content modal-standard">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{transaction ? t('transactions.form.edit') : t('transactions.form.title')}</h2>
                    <button onClick={onClose} className="text-text-tertiary hover:text-text-primary text-2xl transition-colors" style={{ border: 'none', background: 'none', cursor: 'pointer', lineHeight: 1, padding: '0.25rem' }}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* Segmented Control for Income/Expense */}
                    <div className="segmented-control mb-6">
                        <button
                            type="button"
                            className={`segmented-option ${type === 'income' ? 'active positive' : ''}`}
                            onClick={() => setType('income')}
                        >
                            {t('transactions.form.income')}
                        </button>
                        <button
                            type="button"
                            className={`segmented-option ${type === 'expense' ? 'active negative' : ''}`}
                            onClick={() => setType('expense')}
                        >
                            {t('transactions.form.expense')}
                        </button>
                    </div>

                    {/* Recurring Toggle */}
                    <div className="flex items-center justify-between mb-6 p-4 rounded" style={{
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-app)'
                    }}>
                        <div className="flex items-center gap-3">
                            <span style={{ fontSize: '1.25rem' }}>🔄</span>
                            <div>
                                <label className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    Recurring Transaction
                                </label>
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                    Repeat this transaction automatically
                                </p>
                            </div>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    {/* Recurring Options (visible when toggle is ON) */}
                    {isRecurring && (
                        <div className="mb-6 p-4 rounded animate-fade-in" style={{
                            backgroundColor: 'rgba(99, 102, 241, 0.05)',
                            border: '1px solid rgba(99, 102, 241, 0.2)'
                        }}>
                            <div className="mb-4">
                                <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">Frequency</label>
                                <select
                                    value={recurrenceFrequency}
                                    onChange={e => setRecurrenceFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            <div className="grid-2 mb-4" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">Start Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        disabled={untilCanceled}
                                        style={untilCanceled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={untilCanceled}
                                    onChange={(e) => setUntilCanceled(e.target.checked)}
                                    style={{ width: 'auto', cursor: 'pointer' }}
                                />
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Until Canceled</span>
                            </label>
                        </div>
                    )}

                    <div className="grid-2 mb-4" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                        <div>
                            <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">{t('wallets.title')}</label>
                            <select
                                value={walletId}
                                onChange={e => setWalletId(parseInt(e.target.value))}
                            >
                                {wallets?.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">{t('categories.form.title')}</label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(parseInt(e.target.value))}
                            >
                                {categories?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">{t('transactions.form.amount')}</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{getCurrencySymbol()}</span>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{ paddingLeft: '2rem', fontSize: '1.2rem', fontWeight: 'bold' }}
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">{t('transactions.form.description')}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Dinner, Groceries..."
                            rows={3}
                            required
                        />
                    </div>

                    {!isRecurring && (
                        <div className="mb-6">
                            <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">{t('transactions.form.date')}</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3" style={{ borderTop: '1px solid var(--border-app)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">{t('transactions.form.cancel')}</button>
                        <button type="submit" className="btn btn-primary-strong">{t('transactions.form.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
