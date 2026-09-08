import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ExchangeRates } from '../types';
import { 
  getStoredRates, 
  saveStoredRates, 
  fetchLiveRates, 
  getEffectiveRate, 
  convertUSDToVES, 
  convertVESToUSD 
} from '../services/dolarApi';

interface CurrencyContextType {
  rates: ExchangeRates;
  effectiveRate: number;
  isOverride: boolean;
  isLoading: boolean;
  refreshRates: () => Promise<void>;
  setManualOverride: (active: boolean, customRate?: number) => void;
  toVES: (usd: number) => number;
  toUSD: (ves: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rates, setRates] = useState<ExchangeRates>(() => getStoredRates());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const updated = await fetchLiveRates(rates);
      setRates(updated);
    } finally {
      setIsLoading(false);
    }
  }, [rates]);

  // Actualizar al cargar la app
  useEffect(() => {
    refreshRates();
    // Reintentar cada 30 minutos si hay internet
    const interval = setInterval(refreshRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setManualOverride = (active: boolean, customRate?: number) => {
    setRates((prev) => {
      const updated: ExchangeRates = {
        ...prev,
        manualOverride: {
          active,
          rate: customRate !== undefined ? customRate : prev.manualOverride.rate || prev.bcv,
        },
      };
      saveStoredRates(updated);
      return updated;
    });
  };

  const effectiveRate = getEffectiveRate(rates);

  const toVES = (usd: number) => convertUSDToVES(usd, effectiveRate);
  const toUSD = (ves: number) => convertVESToUSD(ves, effectiveRate);

  return (
    <CurrencyContext.Provider
      value={{
        rates,
        effectiveRate,
        isOverride: rates.manualOverride.active,
        isLoading,
        refreshRates,
        setManualOverride,
        toVES,
        toUSD,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
};
