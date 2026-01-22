import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from '../db/db';
import { generateRecurringInstances } from '../utils/recurringTransactions';

export default function Calendar() {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

    const transactions = useLiveQuery(() => db.transactions.toArray());
    const bills = useLiveQuery(() => db.bills.toArray());

    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const getDayEvents = (day: number) => {

        const dayTransactions = transactions?.filter(t =>
            !t.isRecurring &&
            t.date.getDate() === day &&
            t.date.getMonth() === currentDate.getMonth() &&
            t.date.getFullYear() === currentDate.getFullYear()
        ) || [];


        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const recurringInstances: any[] = [];
        transactions?.forEach(t => {
            if (t.isRecurring) {
                const instances = generateRecurringInstances(t, monthStart, monthEnd);
                recurringInstances.push(...instances.filter(inst => inst.date.getDate() === day));
            }
        });


        const allDayTransactions = [...dayTransactions, ...recurringInstances];

        const dayBills = bills?.filter(b => b.dueDate === day) || [];
        const totalIncome = allDayTransactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
        const totalExpense = allDayTransactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
        return { transactions: allDayTransactions, bills: dayBills, totalIncome, totalExpense };
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


    const upcomingBills = bills?.sort((a, b) => a.dueDate - b.dueDate).slice(0, 5) || [];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('calendar.title')}</h1>
                    <p className="page-subtitle">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="btn btn-secondary">←</button>
                    <button onClick={() => setCurrentDate(new Date())} className="btn btn-secondary text-xs">Today</button>
                    <button onClick={nextMonth} className="btn btn-secondary">→</button>
                </div>
            </div>

            <div className="calendar-layout">
                {/* Left Sidebar: Mini Calendar + Tasks/Bills */}
                <aside className="calendar-sidebar">
                    {/* Mini Calendar Card */}
                    <div className="card-elevated" style={{ padding: '1.5rem' }}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-sm">{monthNames[currentDate.getMonth()].substring(0, 3)} {currentDate.getFullYear()}</span>
                            <div className="flex gap-1">
                                <button onClick={prevMonth} className="text-xs p-1 hover:bg-input rounded transition-colors">←</button>
                                <button onClick={nextMonth} className="text-xs p-1 hover:bg-input rounded transition-colors">→</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 text-center mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-xs text-tertiary font-bold">{d}</span>)}
                        </div>
                        <div className="grid-cols-7 text-center gap-1">
                            {blanks.map((_, i) => <div key={`mini-blank-${i}`}></div>)}
                            {days.map(day => {
                                const isSelected = selectedDay === day;
                                const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth();
                                return (
                                    <div
                                        key={`mini-${day}`}
                                        onClick={() => setSelectedDay(day)}
                                        className={`text-xs h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors
                                            ${isSelected ? 'font-bold' : 'hover:bg-input text-secondary'}
                                            ${isToday && !isSelected ? 'text-primary' : ''}
                                        `}
                                        style={isSelected ? { backgroundColor: 'var(--primary-color)', color: '#fff' } : isToday ? { border: '1px solid var(--primary-color)' } : {}}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Upcoming Bills (Sidebar List) */}
                    <div className="card-elevated flex-1">
                        <h3 className="text-sm font-bold uppercase text-tertiary mb-4 tracking-wider">Upcoming Bills</h3>
                        <div className="flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: '300px' }}>
                            {upcomingBills.map(bill => (
                                <div key={bill.id} className="flex items-center p-3 rounded bg-input border border-border-color">
                                    <div className="w-10 h-10 rounded bg-card flex items-center justify-center font-bold text-sm border border-border-color mr-3" style={{ color: 'var(--trend-neutral)' }}>
                                        {bill.dueDate}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{bill.name}</p>
                                        <p className="text-xs text-tertiary">${bill.amount}</p>
                                    </div>
                                </div>
                            ))}
                            {upcomingBills.length === 0 && <p className="text-sm text-tertiary italic">No upcoming bills found.</p>}
                        </div>
                    </div>
                </aside>

                {/* Main Content: Large Grid */}
                <main className="calendar-container">
                    <div className="calendar-header-row">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="calendar-header-cell">{d}</div>)}
                    </div>
                    <div className="calendar-grid">
                        {blanks.map((_, i) => <div key={`main-blank-${i}`} className="calendar-cell" style={{ background: 'var(--bg-app)', cursor: 'default' }}></div>)}
                        {days.map(day => {
                            const { bills, totalIncome, totalExpense } = getDayEvents(day);
                            const isSelected = selectedDay === day;
                            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth();
                            const hasTransactions = totalIncome > 0 || totalExpense > 0 || bills.length > 0;

                            return (
                                <div
                                    key={`main-${day}`}
                                    onClick={() => setSelectedDay(day)}
                                    className={`calendar-cell ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''} ${hasTransactions ? 'has-transactions' : ''}`}
                                >
                                    <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-secondary'}`}>{day}</span>

                                    <div className="flex flex-col gap-1 mt-auto">
                                        {bills.map(b => (
                                            <div key={`b-${b.id}`} className="text-[10px] px-1.5 py-0.5 rounded border truncate" style={{
                                                backgroundColor: 'var(--trend-neutral-bg)',
                                                color: 'var(--trend-neutral)',
                                                borderColor: 'var(--trend-neutral-border)'
                                            }}>
                                                {b.name}
                                            </div>
                                        ))}
                                        {totalIncome > 0 && (
                                            <div className="text-[10px] px-1.5 py-0.5 rounded border" style={{
                                                backgroundColor: 'var(--trend-positive-bg)',
                                                color: 'var(--trend-positive)',
                                                borderColor: 'var(--trend-positive-border)'
                                            }}>
                                                +${totalIncome.toFixed(0)}
                                            </div>
                                        )}
                                        {totalExpense > 0 && (
                                            <div className="text-[10px] px-1.5 py-0.5 rounded border" style={{
                                                backgroundColor: 'var(--trend-negative-bg)',
                                                color: 'var(--trend-negative)',
                                                borderColor: 'var(--trend-negative-border)'
                                            }}>
                                                -${totalExpense.toFixed(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}


