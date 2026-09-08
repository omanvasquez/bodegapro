import React, { createContext, useContext, useState } from 'react';
import { Customer, CreditTransaction, PaymentSplit } from '../types';
import { dbInit } from '../services/localDatabase';
import { useCurrency } from './CurrencyContext';

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
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export const CustomersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => dbInit.getCustomers());
  const [transactions, setTransactions] = useState<CreditTransaction[]>(() =>
    dbInit.getTransactions()
  );
  const { effectiveRate, toVES } = useCurrency();

  const addCustomer = (name: string, phone: string, creditLimitUSD: number): Customer => {
    const newCust: Customer = {
      id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      tenantId: 'tenant_cojedes_01',
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
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
      );
      dbInit.saveCustomers(updated);
      return updated;
    });
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      dbInit.saveCustomers(updated);
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

    return {
      success: true,
      message: `Abono de $${amountUSD.toFixed(2)} aplicado exitosamente.`,
      customer: updatedCustomer,
    };
  };

  const getCustomerTransactions = (customerId: string) => {
    return transactions.filter((t) => t.customerId === customerId);
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
