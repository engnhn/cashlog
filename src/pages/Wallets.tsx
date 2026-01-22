import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from '../db/db';

export default function Wallets() {
    const { t } = useTranslation();
    const wallets = useLiveQuery(() => db.wallets.toArray());
    const transactions = useLiveQuery(() => db.transactions.toArray());

    const [showModal, setShowModal] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<'cash' | 'bank' | 'credit_card'>('cash');
    const [initialBalance, setInitialBalance] = useState('0');
    const [currency, setCurrency] = useState('USD');

    const getWalletBalance = (walletId: number, initial: number) => {
        if (!transactions) return initial;
        const walletTransactions = transactions.filter(t => t.walletId === walletId);
        const total = walletTransactions.reduce((acc, t) => acc + t.amount, 0);
        return initial + total;
    };

    const totalAssetBalance = (wallets || []).reduce((acc, w) => {
        return acc + getWalletBalance(w.id, w.balance);
    }, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        await db.wallets.add({
            name,
            type,
            balance: parseFloat(initialBalance),
            currency
        });
        setShowModal(false);
        // Reset form
        setName('');
        setType('cash');
        setInitialBalance('0');
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter mb-1">{t('wallets.title')}</h1>
                    <p className="text-text-secondary text-lg">{t('wallets.subtitle')}</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary-strong">
                    + {t('wallets.add')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* Total Summar card could go here */}
                <div className="card p-6 bg-surface-active border border-text-primary text-text-primary col-span-full md:col-span-1">
                    <h3 className="text-xs uppercase tracking-widest font-bold opacity-70 mb-2">{t('wallets.totalBalance')}</h3>
                    <p className="text-4xl font-bold tracking-tight">${totalAssetBalance.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallets?.map(wallet => {
                    const currentBalance = getWalletBalance(wallet.id, wallet.balance);
                    return (
                        <div key={wallet.id} className="card p-6 border border-border-color flex flex-col justify-between h-48 group relative hover:border-text-secondary transition-colors">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 rounded bg-surface-active">
                                        {/* Icon based on type */}
                                        {wallet.type === 'cash' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>}
                                        {wallet.type === 'bank' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M10 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6"></path></svg>}
                                        {wallet.type === 'credit_card' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>}
                                    </div>
                                    <span className="text-xs uppercase font-bold text-text-tertiary">{wallet.currency}</span>
                                </div>
                                <h3 className="text-xl font-bold text-text-primary">{wallet.name}</h3>
                                <p className="text-sm text-text-tertiary capitalize">{t(`wallets.form.${wallet.type}`)}</p>
                            </div>
                            <div>
                                <p className={`text-2xl font-bold tracking-tight ${currentBalance < 0 ? 'text-danger-text' : 'text-text-primary'}`}>
                                    ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal-content modal-standard">
                        <h2 className="text-2xl font-bold mb-6 text-text-primary">{t('wallets.form.title')}</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('wallets.form.name')}</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" autoFocus required />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('wallets.form.type')}</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="w-full bg-bg-color border border-border-color rounded p-2 text-text-primary"
                                >
                                    <option value="cash">{t('wallets.form.cash')}</option>
                                    <option value="bank">{t('wallets.form.bank')}</option>
                                    <option value="credit_card">{t('wallets.form.credit')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('wallets.form.initialBalance')}</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={initialBalance}
                                        onChange={e => setInitialBalance(e.target.value)}
                                        style={{ paddingLeft: '2rem', fontSize: '1.1rem', fontWeight: 600 }}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('wallets.form.currency')}</label>
                                <input type="text" value={currency} onChange={e => setCurrency(e.target.value)} className="w-full" />
                            </div>

                            <div className="flex justify-end gap-3 mt-4" style={{ borderTop: '1px solid var(--border-app)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">{t('wallets.form.cancel')}</button>
                                <button type="submit" className="btn btn-primary-strong">{t('wallets.form.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
