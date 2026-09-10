import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, CreditTransaction, PaymentSplit } from '../types';
import { dbInit } from '../services/localDatabase';
import { useCurrency } from './CurrencyContext';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

interface CustomersContextType {
  customers: Customer[];
  transactions: CreditTransaction[];
  addCustomer: (name: string, phone: string, creditLimitUSD: number) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  recordCharge: (
    customerId: string,
    amountUSD: number,
    saleTicketId?: string,
    cashierName?: string,
    notes?: string
  ) => { success: boolean; message: string; customer?: Customer };
  recordPayment: (
    customerId: string,
    amountUSD: number,
    payments: PaymentSplit[],
    cashierName?: string,
    saveSurplusAsCredit?: boolean,
    notes?: string
  ) => { success: boolean; message: string; customer?: Customer };
  getCustomerTransactions: (customerId: string) => CreditTransaction[];
  resetAllDebtsAndTransactions: () => void;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export const CustomersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => dbInit.getCustomers());
  const [transactions, setTransactions] = useState<CreditTransaction[]>(() =>
    dbInit.getTransactions()
  );
  const { effectiveRate, toVES } = useCurrency();
  const { tenant } = useAuth();

  // Sincronización en segundo plano con Firestore (Offline-First)
  useEffect(() => {
    if (!db || !tenant?.id) return;

    // 1. Clientes
    const custCol = collection(db, 'tenants', tenant.id, 'customers');
    const unsubCust = onSnapshot(
      custCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudCustomers: Customer[] = [];
          snapshot.forEach((docSnap) => {
            cloudCustomers.push(docSnap.data() as Customer);
          });
          cloudCustomers.sort((a, b) => a.name.localeCompare(b.name));
          setCustomers(cloudCustomers);
          dbInit.saveCustomers(cloudCustomers);
        } else {
          // Si Firestore está vacío (primer uso), respaldar clientes iniciales
          const local = dbInit.getCustomers();
          if (local && local.length > 0) {
            local.forEach((c) => {
              setDoc(doc(db, 'tenants', tenant.id, 'customers', c.id), c).catch(() => {});
            });
          }
        }
      },
      (err) => {
        console.warn('Sincronización de clientes en segundo plano:', err);
      }
    );

    // 2. Transacciones (Micro-Ledger de fiados y abonos)
    const txCol = collection(db, 'tenants', tenant.id, 'transactions');
    const unsubTx = onSnapshot(
      txCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudTx: CreditTransaction[] = [];
          snapshot.forEach((docSnap) => {
            cloudTx.push(docSnap.data() as CreditTransaction);
          });
          cloudTx.sort((a, b) => b.timestamp - a.timestamp);
          setTransactions(cloudTx);
          dbInit.saveTransactions(cloudTx);
        } else {
          const localTx = dbInit.getTransactions();
          if (localTx && localTx.length > 0) {
            localTx.forEach((tx) => {
              setDoc(doc(db, 'tenants', tenant.id, 'transactions', tx.id), tx).catch(() => {});
            });
          }
        }
      },
      (err) => {
        console.warn('Sincronización de transacciones en segundo plano:', err);
      }
    );

    return () => {
      unsubCust();
      unsubTx();
    };
  }, [tenant?.id]);

  const addCustomer = (name: string, phone: string, creditLimitUSD: number): Customer => {
    const newCust: Customer = {
      id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      tenantId: tenant?.id || 'tenant_cojedes_01',
      name,
      phone,
      creditLimitUSD,
      currentDebtUSD: 0,
      positiveBalanceUSD: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    dbInit.saveCustomers(updated);
    if (db && tenant?.id) {
      setDoc(doc(db, 'tenants', tenant.id, 'customers', newCust.id), newCust).catch(() => {});
    }
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    let changedCust: Customer | undefined;
    setCustomers((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          changedCust = { ...c, ...updates, updatedAt: Date.now() };
          return changedCust;
        }
        return c;
      });
      dbInit.saveCustomers(updated);
      if (db && tenant?.id && changedCust) {
        setDoc(doc(db, 'tenants', tenant.id, 'customers', id), changedCust).catch(() => {});
      }
      return updated;
    });
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      dbInit.saveCustomers(updated);
      if (db && tenant?.id) {
        deleteDoc(doc(db, 'tenants', tenant.id, 'customers', id)).catch(() => {});
      }
      return updated;
    });
  };

  // Registrar Cargo Fiado (Compra a crédito)
  const recordCharge = (
    customerId: string,
    amountUSD: number,
    saleTicketId?: string,
    cashierName: string = 'Cajero',
    notes?: string
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return { success: false, message: 'Cliente no encontrado' };

    // Verificar límite de crédito
    const projectedDebt = customer.currentDebtUSD + amountUSD;
    if (customer.creditLimitUSD > 0 && projectedDebt > customer.creditLimitUSD) {
      return {
        success: false,
        message: `Límite de crédito excedido. Tope: $${customer.creditLimitUSD.toFixed(2)}, Deuda actual: $${customer.currentDebtUSD.toFixed(2)}`,
      };
    }

    // Si el cliente tiene saldo a favor, descontar primero de ahí
    let remainingCharge = amountUSD;
    let newPositiveBalance = customer.positiveBalanceUSD;

    if (newPositiveBalance > 0) {
      if (newPositiveBalance >= remainingCharge) {
        newPositiveBalance -= remainingCharge;
        remainingCharge = 0;
      } else {
        remainingCharge -= newPositiveBalance;
        newPositiveBalance = 0;
      }
    }

    const newDebt = Math.round((customer.currentDebtUSD + remainingCharge) * 100) / 100;
    const updatedCustomer: Customer = {
      ...customer,
      currentDebtUSD: newDebt,
      positiveBalanceUSD: Math.round(newPositiveBalance * 100) / 100,
      updatedAt: Date.now(),
    };

    // Registrar en el Micro-Ledger inmutable
    const tx: CreditTransaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      tenantId: customer.tenantId,
      customerId: customer.id,
      customerName: customer.name,
      type: 'cargo',
      amountUSD,
      amountVES: toVES(amountUSD),
      exchangeRate: effectiveRate,
      timestamp: Date.now(),
      saleTicketId,
      notes: notes || 'Compra a crédito en caja',
      cashierName,
    };

    const updatedCustomers = customers.map((c) => (c.id === customerId ? updatedCustomer : c));
    const updatedTx = [tx, ...transactions];

    setCustomers(updatedCustomers);
    setTransactions(updatedTx);
    dbInit.saveCustomers(updatedCustomers);
    dbInit.saveTransactions(updatedTx);

    if (db && tenant?.id) {
      setDoc(doc(db, 'tenants', tenant.id, 'customers', customerId), updatedCustomer).catch(() => {});
      setDoc(doc(db, 'tenants', tenant.id, 'transactions', tx.id), tx).catch(() => {});
    }

    return {
      success: true,
      message: `Cargo de $${amountUSD.toFixed(2)} registrado con éxito.`,
      customer: updatedCustomer,
    };
  };

  // Registrar Abono (Pago parcial o total de deuda)
  const recordPayment = (
    customerId: string,
    amountUSD: number,
    payments: PaymentSplit[],
    cashierName: string = 'Cajero',
    saveSurplusAsCredit: boolean = true,
    notes?: string
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return { success: false, message: 'Cliente no encontrado' };

    let newDebt = customer.currentDebtUSD;
    let newPositive = customer.positiveBalanceUSD;

    if (amountUSD <= newDebt) {
      newDebt = Math.round((newDebt - amountUSD) * 100) / 100;
    } else {
      const surplus = Math.round((amountUSD - newDebt) * 100) / 100;
      newDebt = 0;
      if (saveSurplusAsCredit) {
        newPositive = Math.round((newPositive + surplus) * 100) / 100;
      }
    }

    const updatedCustomer: Customer = {
      ...customer,
      currentDebtUSD: newDebt,
      positiveBalanceUSD: newPositive,
      updatedAt: Date.now(),
    };

    const tx: CreditTransaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      tenantId: customer.tenantId,
      customerId: customer.id,
      customerName: customer.name,
      type: 'abono',
      amountUSD,
      amountVES: toVES(amountUSD),
      exchangeRate: effectiveRate,
      timestamp: Date.now(),
      payments,
      notes: notes || 'Abono recibido a cuenta de fiado',
      cashierName,
    };

    const updatedCustomers = customers.map((c) => (c.id === customerId ? updatedCustomer : c));
    const updatedTx = [tx, ...transactions];

    setCustomers(updatedCustomers);
    setTransactions(updatedTx);
    dbInit.saveCustomers(updatedCustomers);
    dbInit.saveTransactions(updatedTx);

    if (db && tenant?.id) {
      setDoc(doc(db, 'tenants', tenant.id, 'customers', customerId), updatedCustomer).catch(() => {});
      setDoc(doc(db, 'tenants', tenant.id, 'transactions', tx.id), tx).catch(() => {});
    }

    return {
      success: true,
      message: `Abono de $${amountUSD.toFixed(2)} aplicado exitosamente.`,
      customer: updatedCustomer,
    };
  };

  const getCustomerTransactions = (customerId: string) => {
    return transactions.filter((t) => t.customerId === customerId);
  };

  const resetAllDebtsAndTransactions = () => {
    const updatedCustomers = customers.map((c) => ({
      ...c,
      currentDebtUSD: 0,
      positiveBalanceUSD: 0,
      updatedAt: Date.now(),
    }));

    const currentTx = [...transactions];
    setCustomers(updatedCustomers);
    setTransactions([]);
    dbInit.saveCustomers(updatedCustomers);
    dbInit.saveTransactions([]);

    if (db && tenant?.id) {
      updatedCustomers.forEach((c) => {
        setDoc(doc(db, 'tenants', tenant.id, 'customers', c.id), c).catch(() => {});
      });
      currentTx.forEach((tx) => {
        deleteDoc(doc(db, 'tenants', tenant.id, 'transactions', tx.id)).catch(() => {});
      });
    }
  };

  return (
    <CustomersContext.Provider
      value={{
        customers,
        transactions,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordCharge,
        recordPayment,
        getCustomerTransactions,
        resetAllDebtsAndTransactions,
      }}
    >
      {children}
    </CustomersContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomersContext);
  if (!context) throw new Error('useCustomers must be used within a CustomersProvider');
  return context;
};
