import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'EUR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (priceInUsd: number, status?: string) => string;
  formatPriceCompact: (priceInUsd: number, status?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const EXCHANGE_RATE_USD_TO_EUR = 0.92;

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');

  const convert = (priceInUsd: number) => {
    return currency === 'EUR' ? priceInUsd * EXCHANGE_RATE_USD_TO_EUR : priceInUsd;
  };

  const getSymbol = () => (currency === 'EUR' ? '€' : '$');

  const formatPrice = (priceInUsd: number, status?: string) => {
    const amount = convert(priceInUsd);
    const formattedAmount = amount.toLocaleString('en-US', {
      maximumFractionDigits: 0
    });
    
    const symbol = getSymbol();
    const suffix = status === 'rent' ? '/mo' : '';
    
    return `${symbol}${formattedAmount}${suffix}`;
  };

  const formatPriceCompact = (priceInUsd: number, status?: string) => {
    const amount = convert(priceInUsd);
    const symbol = getSymbol();
    
    let compactAmount = '';
    if (status === 'rent') {
      compactAmount = `${Math.round(amount / 100) / 10}K`;
    } else if (amount >= 1000000) {
      compactAmount = `${(amount / 1000000).toFixed(1)}M`;
    } else {
      compactAmount = `${Math.round(amount / 1000)}K`;
    }
    
    const suffix = status === 'rent' ? '/mo' : '';
    return `${symbol}${compactAmount}${suffix}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, formatPriceCompact }}>
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
