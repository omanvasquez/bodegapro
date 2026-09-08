import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { dbInit } from '../services/localDatabase';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

interface ExpensesContextType {
  expenses: Expense[];
  addExpense: (params: {
    description: string;
    category: ExpenseCategory;
    amountUSD: number;
    amountVES: number;
    paymentMethod: 'usd_cash' | 'ves_cash' | 'pago_movil' | 'punto_venta';
    registeredBy?: string;
    notes?: string;
  }) => Expense;
  deleteExpense: (id: string) => void;
  todayExpenses: Expense[];
  todayTotalExpensesUSD: number;
  todayTotalExpensesVES: number;
  todayExpensesByMethod: {
    cashUSD: number;
    cashVES: number;
    pagoMovilVES: number;
    puntoVES: number;
  };
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>(() => dbInit.getExpenses());
  const { tenant } = useAuth();

  // Sincronización en segundo plano con Firestore (Offline-First)
  useEffect(() => {
    if (!db || !tenant?.id) return;

    const colRef = collection(db, 'tenants', tenant.id, 'expenses');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudExpenses: Expense[] = [];
          snapshot.forEach((docSnap) => {
            cloudExpenses.push(docSnap.data() as Expense);
          });
          cloudExpenses.sort((a, b) => b.timestamp - a.timestamp);
          setExpenses(cloudExpenses);
          dbInit.saveExpenses(cloudExpenses);
        } else {
          // Si Firestore está vacío (primer uso), respaldar gastos locales
          const local = dbInit.getExpenses();
          if (local && local.length > 0) {
            local.forEach((e) => {
              setDoc(doc(db, 'tenants', tenant.id, 'expenses', e.id), e).catch(() => {});
            });
          }
        }
      },
      (err) => {
        console.warn('Sincronización de gastos en segundo plano:', err);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id]);

  const addExpense = ({
    description,
    category,
    amountUSD,
    amountVES,
    paymentMethod,
    registeredBy = 'Caja',
    notes,
  }: {
    description: string;
    category: ExpenseCategory;
    amountUSD: number;
    amountVES: number;
    paymentMethod: 'usd_cash' | 'ves_cash' | 'pago_movil' | 'punto_venta';
    registeredBy?: string;
    notes?: string;
  }): Expense => {
    const newExpense: Expense = {
      id: 'exp_' + Date.now(),
      tenantId: tenant?.id || 'tenant_cojedes_01',
      timestamp: Date.now(),
      description: description.trim(),
      category,
      amountUSD: Math.round(amountUSD * 100) / 100,
      amountVES: Math.round(amountVES * 100) / 100,
      paymentMethod,
      registeredBy,
      notes: notes?.trim() || undefined,
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    dbInit.saveExpenses(updated);

    if (db && tenant?.id) {
      setDoc(doc(db, 'tenants', tenant.id, 'expenses', newExpense.id), newExpense).catch(() => {});
    }

    return newExpense;
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    dbInit.saveExpenses(updated);

    if (db && tenant?.id) {
      deleteDoc(doc(db, 'tenants', tenant.id, 'expenses', id)).catch(() => {});
    }
  };

  // Gastos de hoy
  const todayExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();
    return expenses.filter((e) => e.timestamp >= startOfToday);
  }, [expenses]);

  const todayTotalExpensesUSD = useMemo(() => {
    const sum = todayExpenses.reduce((acc, e) => acc + e.amountUSD, 0);
    return Math.round(sum * 100) / 100;
  }, [todayExpenses]);

  const todayTotalExpensesVES = useMemo(() => {
    const sum = todayExpenses.reduce((acc, e) => acc + e.amountVES, 0);
    return Math.round(sum * 100) / 100;
  }, [todayExpenses]);

  const todayExpensesByMethod = useMemo(() => {
    let cashUSD = 0;
    let cashVES = 0;
    let pagoMovilVES = 0;
    let puntoVES = 0;

    for (const e of todayExpenses) {
      if (e.paymentMethod === 'usd_cash') cashUSD += e.amountUSD;
      if (e.paymentMethod === 'ves_cash') cashVES += e.amountVES;
      if (e.paymentMethod === 'pago_movil') pagoMovilVES += e.amountVES;
      if (e.paymentMethod === 'punto_venta') puntoVES += e.amountVES;
    }

    return {
      cashUSD: Math.round(cashUSD * 100) / 100,
      cashVES: Math.round(cashVES * 100) / 100,
      pagoMovilVES: Math.round(pagoMovilVES * 100) / 100,
      puntoVES: Math.round(puntoVES * 100) / 100,
    };
  }, [todayExpenses]);

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        addExpense,
        deleteExpense,
        todayExpenses,
        todayTotalExpensesUSD,
        todayTotalExpensesVES,
        todayExpensesByMethod,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpensesContext);
  if (!context) throw new Error('useExpenses must be used within an ExpensesProvider');
  return context;
};
