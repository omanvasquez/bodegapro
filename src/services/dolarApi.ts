import { ExchangeRates } from '../types';

const STORAGE_KEY = 'bodegapro_rates';
const DEFAULT_RATES: ExchangeRates = {
  bcv: 72.50, // Tasa de respaldo referencial
  euro: 77.20,
  usdt: 74.00,
  lastUpdated: Date.now(),
  source: 'Respaldo Local',
  manualOverride: {
    active: false,
    rate: 72.50,
  },
};

export function getStoredRates(): ExchangeRates {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading stored rates', e);
  }
  return DEFAULT_RATES;
}

export function saveStoredRates(rates: ExchangeRates): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
  } catch (e) {
    console.error('Error saving rates', e);
  }
}

export async function fetchLiveRates(currentRates: ExchangeRates): Promise<ExchangeRates> {
  try {
    // Consulta a DolarAPI Venezuela (Oficial BCV)
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) throw new Error('DolarAPI status: ' + res.status);
    const data = await res.json();
    
    const newBcv = data.promedio || data.venta || currentRates.bcv;

    // Intentar obtener USDT / Paralelo si está disponible
    let newUsdt = currentRates.usdt;
    try {
      const resParalelo = await fetch('https://ve.dolarapi.com/v1/dolares/paralelo');
      if (resParalelo.ok) {
        const dataP = await resParalelo.json();
        newUsdt = dataP.promedio || newUsdt;
      }
    } catch {
      // Usar anterior si falla
    }

    const updated: ExchangeRates = {
      ...currentRates,
      bcv: Number(newBcv),
      usdt: Number(newUsdt),
      lastUpdated: Date.now(),
      source: 'DolarAPI Oficial (BCV)',
    };

    saveStoredRates(updated);
    return updated;
  } catch (err) {
    console.warn('Fallo al conectar con DolarAPI (modo offline o sin red). Usando tasas locales.', err);
    return currentRates;
  }
}

export function getEffectiveRate(rates: ExchangeRates): number {
  if (rates.manualOverride.active && rates.manualOverride.rate > 0) {
    return rates.manualOverride.rate;
  }
  return rates.bcv || 1;
}

export function convertUSDToVES(amountUSD: number, rate: number): number {
  return Math.round((amountUSD * rate) * 100) / 100;
}

export function convertVESToUSD(amountVES: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.round((amountVES / rate) * 100) / 100;
}
