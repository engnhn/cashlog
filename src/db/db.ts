import Dexie, { type EntityTable } from 'dexie';

interface Wallet {
    id: number;
    name: string;
    type: 'cash' | 'bank' | 'credit_card';
    balance: number;
    currency: string;
}

interface Transaction {
    id: number;
    walletId: number;
    amount: number; // positive for income, negative for expense
    categoryId: number;
    date: Date; // For recurring: this is the start date
    description: string;

    // Recurring transaction fields
    isRecurring?: boolean;
    recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    recurrenceEndDate?: Date | null; // null means "until canceled"
}

interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
}

interface Bill {
    id: number;
    name: string;
    description?: string;
    amount: number;
    dueDate: number; // Day of month (1-31)
    categoryId: number;
    lastPaidDate?: Date;
    type: 'bill' | 'loan';
    startDate?: Date;
    endDate?: Date;
    totalInstallments?: number;
}

const db = new Dexie('CashlogDatabase') as Dexie & {
    wallets: EntityTable<Wallet, 'id'>;
    transactions: EntityTable<Transaction, 'id'>;
    categories: EntityTable<Category, 'id'>;
    bills: EntityTable<Bill, 'id'>;
};

// Version 1: Initial schema
db.version(1).stores({
    wallets: '++id, name, type',
    transactions: '++id, walletId, date, categoryId',
    categories: '++id, name, type',
    bills: '++id, dueDate, type'
});

// Version 2: Add recurring transaction support
db.version(2).stores({
    wallets: '++id, name, type',
    transactions: '++id, walletId, date, categoryId, isRecurring',
    categories: '++id, name, type',
    bills: '++id, dueDate, type'
}).upgrade(tx => {
    // Migration: existing transactions are non-recurring by default
    return tx.table('transactions').toCollection().modify(transaction => {
        if (transaction.isRecurring === undefined) {
            transaction.isRecurring = false;
        }
    });
});

db.on('populate', () => {
    db.categories.bulkAdd([
        { name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#ef4444' }, // Red
        { name: 'Transportation', type: 'expense', icon: 'car', color: '#f97316' }, // Orange
        { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#ec4899' }, // Pink
        { name: 'Housing', type: 'expense', icon: 'home', color: '#8b5cf6' }, // Violet
        { name: 'Entertainment', type: 'expense', icon: 'film', color: '#3b82f6' }, // Blue
        { name: 'Health', type: 'expense', icon: 'heart', color: '#10b981' }, // Emerald
        { name: 'Salary', type: 'income', icon: 'briefcase', color: '#22c55e' }, // Green
        { name: 'Freelance', type: 'income', icon: 'laptop', color: '#06b6d4' }, // Cyan
        { name: 'Investments', type: 'income', icon: 'chart-line', color: '#eab308' } // Yellow
    ]);

    db.wallets.add({
        name: 'Main Wallet',
        type: 'cash',
        balance: 0,
        currency: 'USD'
    });
});

export { db };
export type { Wallet, Transaction, Category, Bill };
