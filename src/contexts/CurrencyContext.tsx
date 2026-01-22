import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'USD' | 'TRY' | 'EUR';

type CurrencyContextType = {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    formatAmount: (amount: number) => string;
    getCurrencySymbol: () => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const currencySymbols: Record<Currency, string> = {
    USD: '$',
    TRY: '₺',
    EUR: '€'
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>(() => {
        const saved = localStorage.getItem('currency');
        return (saved as Currency) || 'USD';
    });

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
    };

    const getCurrencySymbol = () => currencySymbols[currency];

    const formatAmount = (amount: number): string => {
        const symbol = currencySymbols[currency];
        const absAmount = Math.abs(amount);

        // Format with 2 decimal places
        const formatted = absAmount.toFixed(2);

        // Add currency symbol
        if (currency === 'TRY') {
            return `${formatted}${symbol}`; // TRY uses symbol after amount
        } else {
            return `${symbol}${formatted}`; // USD and EUR use symbol before amount
        }
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, getCurrencySymbol }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
