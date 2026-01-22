import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from '../db/db';
import { SpendingPieChart } from '../components/SpendingPieChart';
import { BalanceTrendChart } from '../components/BalanceTrendChart';

export default function Dashboard() {
    const { t } = useTranslation();
    const transactions = useLiveQuery(() => db.transactions.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());


    const stats = (transactions || []).reduce((acc, t) => {
        if (t.amount > 0) {
            acc.income += t.amount;
        } else {
            acc.expense += Math.abs(t.amount);
        }
        return acc;
    }, { income: 0, expense: 0 });

    const balance = stats.income - stats.expense;


    const expensesByCategory = (transactions || [])
        .filter(t => t.amount < 0)
        .reduce((acc, t) => {
            const catName = categories?.find(c => c.id === t.categoryId)?.name || 'Uncategorized';
            acc[catName] = (acc[catName] || 0) + Math.abs(t.amount);
            return acc;
        }, {} as Record<string, number>);

    const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));


    let runningBalance = 0;
    const trendData = (transactions || [])
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(t => {
            runningBalance += t.amount;
            return {
                date: t.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                amount: runningBalance
            };
        });

    const showCharts = (transactions || []).length > 0;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('dashboard.title')}</h1>
                    <p className="page-subtitle">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary">{t('dashboard.thisMonth')}</button>
                    <button className="btn btn-primary-strong">{t('dashboard.downloadReport')}</button>
                </div>
            </div>

            <div className="grid-3 mb-10">
                {/* Balance */}
                <div className="card-metric">
                    <div>
                        <h3 className="metric-label">{t('dashboard.balance')}</h3>
                        <p className="metric-value">
                            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="mt-auto">
                        <span className="metric-trend positive">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                            +2.4%
                        </span>
                        <span className="text-tertiary text-sm ml-2">{t('dashboard.fromLastMonth')}</span>
                    </div>
                </div>

                {/* Income */}
                <div className="card-metric">
                    <div>
                        <h3 className="metric-label">{t('dashboard.income')}</h3>
                        <p className="metric-value" style={{ color: 'var(--trend-positive)' }}>
                            +${stats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="mt-auto">
                        {stats.income > 0 ? (
                            <span className="text-tertiary text-sm">
                                {(transactions || []).filter(t => t.amount > 0).length} transactions
                            </span>
                        ) : (
                            <span className="text-tertiary text-sm italic">No income recorded</span>
                        )}
                    </div>
                </div>

                {/* Expenses */}
                <div className="card-metric">
                    <div>
                        <h3 className="metric-label">{t('dashboard.expenses')}</h3>
                        <p className="metric-value" style={{ color: 'var(--trend-negative)' }}>
                            -${stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="mt-auto">
                        {stats.expense > 0 ? (
                            <span className="text-tertiary text-sm">
                                {(transactions || []).filter(t => t.amount < 0).length} transactions
                            </span>
                        ) : (
                            <span className="text-tertiary text-sm italic">No expenses recorded</span>
                        )}
                    </div>
                </div>
            </div>

            {showCharts && (
                <div className="grid-3 mb-10">
                    <div className="card-elevated" style={{ gridColumn: 'span 2' }}>
                        <h3 className="text-lg font-bold mb-4">{t('dashboard.balanceTrend')}</h3>
                        <BalanceTrendChart data={trendData} />
                    </div>
                    <div className="card-elevated">
                        <h3 className="text-lg font-bold mb-4">{t('dashboard.spendingByCategory')}</h3>
                        <SpendingPieChart data={pieData} />
                    </div>
                </div>
            )}

            <div className="grid-2">
                <div className="card">
                    <h2 className="text-xl font-bold mb-4">{t('dashboard.quickActions')}</h2>
                    <div className="flex flex-col gap-2">
                        <a href="#/transactions" className="btn btn-tertiary w-full justify-between">
                            <span>{t('dashboard.viewTransactions')}</span>
                            <span>→</span>
                        </a>
                    </div>
                </div>

                <div className="card flex flex-col justify-center items-center text-center cursor-pointer hover:bg-input transition-colors">
                    <div className="mb-4 text-tertiary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                    <h3 className="text-lg font-bold">{t('dashboard.addWidget')}</h3>
                    <p className="text-tertiary text-sm">{t('dashboard.customizeLayout')}</p>
                </div>
            </div>
        </div>
    );
}
