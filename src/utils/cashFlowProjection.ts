import type { Transaction, Bill, Wallet } from '../db/db';
import { generateRecurringInstances } from './recurringTransactions';

export interface DailyBalance {
    date: Date;
    dayNumber: number;
    startingBalance: number;
    income: number;
    expenses: number;
    endingBalance: number;
    transactions: Transaction[];
    projectedBills: Bill[];
    isProjected: boolean;
    isCritical: boolean;
    isToday: boolean;
    isPast: boolean;
}

export interface MonthlyCashFlow {
    month: Date;
    startingBalance: number;
    endingBalance: number;
    tightestDay: DailyBalance | null;
    totalIncome: number;
    totalExpenses: number;
    dailyBalances: DailyBalance[];
}

/**
 * Calculate monthly cash flow projection with day-by-day balance analysis
 * @param month Target month (any date within the month)
 * @param transactions All transactions
 * @param bills All recurring bills
 * @param wallets All wallets to calculate starting balance
 * @param criticalThreshold Balance threshold below which a day is marked critical (default: 100)
 */
export function calculateMonthlyCashFlow(
    month: Date,
    transactions: Transaction[],
    bills: Bill[],
    wallets: Wallet[],
    criticalThreshold: number = 100
): MonthlyCashFlow {
    // Get first and last day of the month
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate starting balance from all wallets
    const startingBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

    // Separate one-time and recurring transactions
    const oneTimeTransactions = transactions.filter(t => !t.isRecurring && new Date(t.date) <= lastDay);

    // Generate recurring transaction instances for this month
    const recurringInstances: Transaction[] = [];
    transactions.forEach(t => {
        if (t.isRecurring) {
            const instances = generateRecurringInstances(t, firstDay, lastDay);
            recurringInstances.push(...instances);
        }
    });

    // Combine all transactions
    const allTransactions = [...oneTimeTransactions, ...recurringInstances];

    // Calculate actual balance at start of month
    const transactionsBeforeMonth = allTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate < firstDay;
    });

    const balanceAtMonthStart = startingBalance + transactionsBeforeMonth.reduce((sum, t) => sum + t.amount, 0);

    // Create array for each day of the month
    const dailyBalances: DailyBalance[] = [];
    let runningBalance = balanceAtMonthStart;

    let tightestDay: DailyBalance | null = null;
    let lowestBalance = Infinity;

    let totalIncome = 0;
    let totalExpenses = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(month.getFullYear(), month.getMonth(), day);
        currentDate.setHours(0, 0, 0, 0);

        const isPast = currentDate < today;
        const isToday = currentDate.getTime() === today.getTime();
        const isProjected = currentDate > today;

        // Get transactions for this day (both one-time and recurring)
        const dayTransactions = allTransactions.filter(t => {
            const txDate = new Date(t.date);
            txDate.setHours(0, 0, 0, 0);
            return txDate.getTime() === currentDate.getTime();
        });

        // Get bills due on this day (only for current or future days)
        const dayBills: Bill[] = [];
        if (!isPast) {
            bills.forEach(bill => {
                if (bill.dueDate === day) {
                    dayBills.push(bill);
                }
            });
        }

        // Calculate day's income and expenses
        const dayIncome = dayTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

        const dayExpenses = Math.abs(dayTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0));

        // Add projected bills as expenses for future days
        const projectedBillsExpense = dayBills.reduce((sum, bill) => sum + bill.amount, 0);

        const totalDayIncome = dayIncome;
        const totalDayExpenses = dayExpenses + projectedBillsExpense;

        // Update monthly totals
        totalIncome += dayIncome;
        totalExpenses += dayExpenses + projectedBillsExpense;

        // Calculate ending balance for this day
        const startingDayBalance = runningBalance;
        const endingDayBalance = startingDayBalance + totalDayIncome - totalDayExpenses;

        // Check if this is the tightest day
        if (endingDayBalance < lowestBalance) {
            lowestBalance = endingDayBalance;
        }

        // Create daily balance entry
        const dailyBalance: DailyBalance = {
            date: currentDate,
            dayNumber: day,
            startingBalance: startingDayBalance,
            income: totalDayIncome,
            expenses: totalDayExpenses,
            endingBalance: endingDayBalance,
            transactions: dayTransactions,
            projectedBills: dayBills,
            isProjected,
            isCritical: endingDayBalance < criticalThreshold,
            isToday,
            isPast
        };

        dailyBalances.push(dailyBalance);

        // Track tightest day
        if (endingDayBalance < lowestBalance || tightestDay === null) {
            tightestDay = dailyBalance;
        }

        // Update running balance for next day
        runningBalance = endingDayBalance;
    }

    return {
        month: firstDay,
        startingBalance: balanceAtMonthStart,
        endingBalance: runningBalance,
        tightestDay,
        totalIncome,
        totalExpenses,
        dailyBalances
    };
}

/**
 * Get a descriptive status label for a balance amount
 */
export function getBalanceStatus(balance: number): 'critical' | 'warning' | 'caution' | 'healthy' {
    if (balance < 0) return 'critical';
    if (balance < 100) return 'warning';
    if (balance < 500) return 'caution';
    return 'healthy';
}

/**
 * Calculate how many days of runway until next income
 */
export function getDaysUntilNextIncome(fromDay: DailyBalance, allDays: DailyBalance[]): number {
    const startIndex = allDays.findIndex(d => d.dayNumber === fromDay.dayNumber);
    if (startIndex === -1) return 0;

    for (let i = startIndex + 1; i < allDays.length; i++) {
        if (allDays[i].income > 0) {
            return allDays[i].dayNumber - fromDay.dayNumber;
        }
    }

    return allDays.length - fromDay.dayNumber; // No more income this month
}
