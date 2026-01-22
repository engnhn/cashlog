import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from '../db/db';
import { calculateMonthlyCashFlow, getBalanceStatus, getDaysUntilNextIncome, type DailyBalance } from '../utils/cashFlowProjection';

export default function CashFlow() {
    const { t } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<DailyBalance | null>(null);


    const transactions = useLiveQuery(() => db.transactions.toArray());
    const bills = useLiveQuery(() => db.bills.toArray());
    const wallets = useLiveQuery(() => db.wallets.toArray());


    const cashFlow = transactions && bills && wallets
        ? calculateMonthlyCashFlow(currentMonth, transactions, bills, wallets)
        : null;


    const goToPrevMonth = () => {
        const prev = new Date(currentMonth);
        prev.setMonth(prev.getMonth() - 1);
        setCurrentMonth(prev);
        setSelectedDay(null);
    };

    const goToNextMonth = () => {
        const next = new Date(currentMonth);
        next.setMonth(next.getMonth() + 1);
        setCurrentMonth(next);
        setSelectedDay(null);
    };

    const goToCurrentMonth = () => {
        setCurrentMonth(new Date());
        setSelectedDay(null);
    };


    const monthName = currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' });

    if (!cashFlow) {
        return <div>Loading...</div>;
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const firstDayWeekday = firstDayOfMonth.getDay();

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="page-title" style={{ fontSize: '2.25rem' }}>{t('cashflow.title')}</h1>
                    <p className="page-subtitle">{t('cashflow.subtitle')}</p>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-8">
                <button onClick={goToPrevMonth} className="btn btn-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">{monthName}</h2>
                    <button onClick={goToCurrentMonth} className="btn btn-tertiary text-sm">
                        {t('cashflow.currentMonth')}
                    </button>
                </div>

                <button onClick={goToNextMonth} className="btn btn-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-3 gap-6 mb-8">
                <div className="card-metric">
                    <div className="metric-label">{t('cashflow.startingBalance')}</div>
                    <div className="metric-value">${cashFlow.startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>

                <div className="card-metric">
                    <div className="metric-label">{t('cashflow.projectedEnding')}</div>
                    <div className="metric-value" style={{ color: cashFlow.endingBalance < 0 ? '#ef4444' : 'var(--trend-positive)' }}>
                        ${cashFlow.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="card-metric">
                    <div className="metric-label">{t('cashflow.tightestDay')}</div>
                    {cashFlow.tightestDay && (
                        <>
                            <div className="metric-value" style={{ color: getBalanceStatus(cashFlow.tightestDay.endingBalance) === 'critical' ? '#ef4444' : 'var(--trend-negative)' }}>
                                ${cashFlow.tightestDay.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                                Day {cashFlow.tightestDay.dayNumber}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="card p-0 overflow-hidden">
                {/* Week day headers */}
                <div className="cashflow-grid" style={{ borderBottom: '2px solid var(--border-highlight)' }}>
                    {weekDays.map(day => (
                        <div key={day} style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="cashflow-grid">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: firstDayWeekday }).map((_, i) => (
                        <div key={`empty-${i}`} className="cashflow-day" style={{ opacity: 0.3 }} />
                    ))}

                    {/* Actual calendar days */}
                    {cashFlow.dailyBalances.map(day => {
                        const status = getBalanceStatus(day.endingBalance);
                        const isSelected = selectedDay?.dayNumber === day.dayNumber;

                        return (
                            <div
                                key={day.dayNumber}
                                className={`cashflow-day ${day.isPast ? 'past' : ''} ${day.isToday ? 'today' : ''} ${status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : status === 'healthy' ? 'healthy' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => setSelectedDay(day)}
                                style={isSelected ? { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.3)' } : {}}
                            >
                                {/* Day number */}
                                <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {day.dayNumber}
                                </div>

                                {/* Transaction/Bill indicators */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                                    {day.income > 0 && (
                                        <div style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'var(--trend-positive-bg)', color: 'var(--trend-positive)', fontWeight: 500 }}>
                                            +${day.income.toFixed(0)}
                                        </div>
                                    )}
                                    {day.expenses > 0 && (
                                        <div style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'var(--trend-negative-bg)', color: 'var(--trend-negative)', fontWeight: 500 }}>
                                            -${day.expenses.toFixed(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Balance */}
                                <div className={`balance-display ${status}`} style={{ fontSize: '1rem' }}>
                                    ${day.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                </div>

                                {/* Critical warning icon */}
                                {day.isCritical && (
                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                            <path d="M12 2L2 22h20L12 2z M12 9v4 M12 17h.01" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Detail Panel */}
            {selectedDay && (
                <div className="card mt-8 p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-bold mb-1">
                                {selectedDay.date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h3>
                            <p className="text-text-secondary">
                                {selectedDay.isPast ? t('cashflow.actual') : selectedDay.isToday ? t('cashflow.today') : t('cashflow.projected')}
                            </p>
                        </div>
                        <button onClick={() => setSelectedDay(null)} className="text-text-tertiary hover:text-text-primary">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-3 gap-6 mb-6">
                        <div>
                            <div className="text-xs font-bold text-text-tertiary uppercase mb-2">Starting Balance</div>
                            <div className="text-2xl font-bold">${selectedDay.startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-text-tertiary uppercase mb-2">Income</div>
                            <div className="text-2xl font-bold" style={{ color: 'var(--trend-positive)' }}>+${selectedDay.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-text-tertiary uppercase mb-2">Expenses</div>
                            <div className="text-2xl font-bold" style={{ color: 'var(--trend-negative)' }}>-${selectedDay.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    <div className="mb-6" style={{ borderTop: '1px solid var(--border-app)', paddingTop: '1.5rem' }}>
                        <div className="text-xs font-bold text-text-tertiary uppercase mb-2">Ending Balance</div>
                        <div className={`text-3xl font-bold balance-display ${getBalanceStatus(selectedDay.endingBalance)}`}>
                            ${selectedDay.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Transactions */}
                    {selectedDay.transactions.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-lg font-bold mb-3">{t('cashflow.transactions')}</h4>
                            <div className="flex flex-col gap-2">
                                {selectedDay.transactions.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center p-3 rounded" style={{ background: 'var(--bg-input)' }}>
                                        <span>{tx.description}</span>
                                        <span className={`font-bold ${tx.amount > 0 ? 'text-trend-positive' : 'text-trend-negative'}`} style={{ color: tx.amount > 0 ? 'var(--trend-positive)' : 'var(--trend-negative)' }}>
                                            {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projected Bills */}
                    {selectedDay.projectedBills.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-lg font-bold mb-3">{t('cashflow.projectedBills')}</h4>
                            <div className="flex flex-col gap-2">
                                {selectedDay.projectedBills.map(bill => (
                                    <div key={bill.id} className="flex justify-between items-center p-3 rounded" style={{ background: 'var(--bg-input)', borderLeft: '3px solid var(--trend-neutral)' }}>
                                        <div>
                                            <div className="font-semibold">{bill.name}</div>
                                            {bill.description && <div className="text-sm text-text-tertiary">{bill.description}</div>}
                                        </div>
                                        <span className="font-bold" style={{ color: 'var(--trend-neutral)' }}>
                                            -${bill.amount.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warning if critical */}
                    {selectedDay.isCritical && (
                        <div className="p-4 rounded" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <div className="flex items-start gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                    <path d="M12 2L2 22h20L12 2z M12 9v4 M12 17h.01" />
                                </svg>
                                <div>
                                    <div className="font-bold" style={{ color: '#ef4444' }}>{t('cashflow.criticalWarning')}</div>
                                    <div className="text-sm mt-1" style={{ color: '#ef4444', opacity: 0.8 }}>
                                        {selectedDay.endingBalance < 0
                                            ? t('cashflow.negativeBalance')
                                            : t('cashflow.lowBalance')}
                                    </div>
                                    {selectedDay.income === 0 && (
                                        <div className="text-sm mt-2">
                                            {getDaysUntilNextIncome(selectedDay, cashFlow.dailyBalances)} {t('cashflow.daysUntilIncome')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
