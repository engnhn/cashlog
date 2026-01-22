import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from '../db/db';

export default function Bills() {
    const { t } = useTranslation();
    const bills = useLiveQuery(() => db.bills.toArray());
    const [showAddModal, setShowAddModal] = useState(false);


    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDay, setDueDay] = useState('');
    const [type, setType] = useState<'bill' | 'loan'>('bill');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [installments, setInstallments] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount || !dueDay) return;

        await db.bills.add({
            name,
            amount: parseFloat(amount),
            dueDate: parseInt(dueDay),
            categoryId: 0,
            type,
            description,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            totalInstallments: installments ? parseInt(installments) : undefined
        });

        setShowAddModal(false);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setAmount('');
        setDueDay('');
        setType('bill');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setInstallments('');
    };

    const markAsPaid = async (id: number) => {
        await db.bills.update(id, { lastPaidDate: new Date() });
    };

    const isPaidThisMonth = (lastPaidDate?: Date) => {
        if (!lastPaidDate) return false;
        const now = new Date();
        return lastPaidDate.getMonth() === now.getMonth() &&
            lastPaidDate.getFullYear() === now.getFullYear();
    };

    const calculateLoanProgress = (bill: any) => {
        if (bill.type !== 'loan' || !bill.startDate) return null;

        const start = bill.startDate;
        const now = new Date();
        const end = bill.endDate;
        const totalInst = bill.totalInstallments;

        let monthsPassed = (now.getFullYear() - start.getFullYear()) * 12;
        monthsPassed -= start.getMonth();
        monthsPassed += now.getMonth();

        if (end) {
            const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 - start.getMonth() + end.getMonth();
            return { current: Math.max(0, monthsPassed), total: totalMonths };
        }

        if (totalInst) {
            return { current: Math.max(0, monthsPassed), total: totalInst };
        }

        return null;
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter mb-1">{t('bills.title')}</h1>
                    <p className="text-text-secondary text-lg">{t('bills.subtitle')}</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    + {t('bills.add')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bills?.map(bill => {
                    const paid = isPaidThisMonth(bill.lastPaidDate);
                    const progress = calculateLoanProgress(bill);

                    return (
                        <div key={bill.id} className="card p-6 border border-border-color group hover:border-text-secondary transition-colors relative overflow-hidden">
                            {/* Status Strip */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${paid ? 'bg-text-success' : 'bg-danger-border'}`}></div>

                            <div className="flex justify-between items-start mb-4 pl-3">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1 block">
                                        {bill.type === 'loan' ? 'LOAN' : 'BILL'} • Due day {bill.dueDate}
                                    </span>
                                    <h3 className="text-xl font-bold text-text-primary">{bill.name}</h3>
                                    {bill.description && <p className="text-sm text-text-tertiary mt-1">{bill.description}</p>}
                                </div>
                                <p className="text-xl font-bold text-text-primary">${bill.amount}</p>
                            </div>

                            {progress && (
                                <div className="pl-3 mb-4">
                                    <div className="flex justify-between text-xs text-text-tertiary mb-1">
                                        <span>Progress</span>
                                        <span>{progress.current} / {progress.total} months</span>
                                    </div>
                                    <div className="h-1 bg-surface-active rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-text-primary"
                                            style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <div className="pl-3 mt-4 pt-4 border-t border-border-color flex justify-between items-center">
                                <span className={`text-sm font-bold ${paid ? 'text-text-success' : 'text-danger-text'}`}>
                                    {paid ? t('bills.paid') : t('bills.pending')}
                                </span>
                                {!paid && (
                                    <button
                                        onClick={() => markAsPaid(bill.id)}
                                        className="text-xs bg-text-primary text-bg-bg px-3 py-1 rounded font-bold hover:opacity-90"
                                    >
                                        {t('bills.markPaid')}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showAddModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="card w-96 max-h-[90vh] overflow-y-auto p-8 relative z-10 bg-surface border border-border-color">
                        <h2 className="text-2xl font-bold mb-6 text-text-primary">{t('bills.form.title')}</h2>
                        <form onSubmit={handleSave} className="flex flex-col gap-5">

                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="isLoan"
                                    checked={type === 'loan'}
                                    onChange={(e) => setType(e.target.checked ? 'loan' : 'bill')}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isLoan" className="text-sm font-bold text-text-primary">{t('bills.form.isLoan')}</label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('bills.form.name')}</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" required />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('bills.form.description')}</label>
                                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('bills.form.amount')}</label>
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('bills.form.dueDay')}</label>
                                    <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full" required />
                                </div>
                            </div>

                            {type === 'loan' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('bills.form.startDate')}</label>
                                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('bills.form.endDate')}</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-tertiary uppercase mb-2">{t('bills.form.installments')}</label>
                                        <input type="number" value={installments} onChange={e => setInstallments(e.target.value)} className="w-full" placeholder="Optional" />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost">{t('bills.form.cancel')}</button>
                                <button type="submit" className="btn btn-primary">{t('bills.form.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
