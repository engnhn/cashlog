import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from '../db/db';
import type { Transaction } from '../db/db';
import { Table } from '../components/Table';
import { TransactionForm } from '../components/TransactionForm';
import { formatRecurrenceSummary } from '../utils/recurringTransactions';
import { useCurrency } from '../contexts/CurrencyContext';

type FilterType = 'all' | 'income' | 'expense';

export default function Transactions() {
    const { t } = useTranslation();
    const { formatAmount } = useCurrency();
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const [filter, setFilter] = useState<FilterType>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

    const handleDelete = async (id: number) => {
        if (confirm(t('categories.delete') + '?')) { // Reusing delete confirmation
            await db.transactions.delete(id);
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowForm(true);
    };

    const handleAdd = () => {
        setEditingTransaction(undefined);
        setShowForm(true);
    };

    const filteredTransactions = (transactions || [])
        .filter(t => {
            if (filter === 'all') return true;
            if (filter === 'income') return t.amount > 0;
            return t.amount < 0;
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first

    const columns = [
        {
            header: t('transactions.table.date'),
            accessor: (row: Transaction) => row.date.toLocaleDateString(),
            className: 'w-32'
        },
        {
            header: t('transactions.table.description'),
            accessor: (row: Transaction) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span>{row.description}</span>
                        {row.isRecurring && <span style={{ fontSize: '0.9rem' }}>🔄</span>}
                    </div>
                    {row.isRecurring && (
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            {formatRecurrenceSummary(row)}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: t('transactions.table.category'),
            accessor: (row: Transaction) => {
                const cat = categories?.find(c => c.id === row.categoryId);
                return cat ? cat.name : '-';
            }
        },
        {
            header: t('transactions.table.amount'),
            accessor: (row: Transaction) => (
                <span className={`table-amount ${row.amount > 0 ? 'positive' : 'negative'}`}>
                    {row.amount > 0 ? '+' : '-'}{formatAmount(Math.abs(row.amount))}
                </span>
            ),
            className: 'text-right'
        },
        {
            header: '',
            accessor: (row: Transaction) => (
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(row)} className="text-text-secondary hover:text-text-primary p-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="text-text-secondary hover:text-danger-text p-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            ),
            className: 'w-24 text-right'
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="page-title" style={{ fontSize: '2.25rem' }}>{t('transactions.title')}</h1>
                    <p className="page-subtitle">{t('transactions.subtitle')}</p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary-strong">
                    + {t('transactions.add')}
                </button>
            </div>

            <div className="segmented-control mb-8" style={{ maxWidth: '400px' }}>
                <button
                    className={`segmented-option ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    {t('transactions.filterAll')}
                </button>
                <button
                    className={`segmented-option ${filter === 'income' ? 'active positive' : ''}`}
                    onClick={() => setFilter('income')}
                >
                    {t('transactions.filterIncome')}
                </button>
                <button
                    className={`segmented-option ${filter === 'expense' ? 'active negative' : ''}`}
                    onClick={() => setFilter('expense')}
                >
                    {t('transactions.filterExpense')}
                </button>
            </div>

            <Table columns={columns} data={filteredTransactions} />

            {showForm && <TransactionForm onClose={() => setShowForm(false)} transaction={editingTransaction} />}
        </div>
    );
}
