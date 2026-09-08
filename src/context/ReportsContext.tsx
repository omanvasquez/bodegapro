import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { SaleTicket, PaymentSplit, TicketItemSnapshot } from '../types';
import { dbInit } from '../services/localDatabase';
import { useCurrency } from './CurrencyContext';
import { useInventory } from './InventoryContext';
import { useCustomers } from './CustomersContext';
import { useExpenses } from './ExpensesContext';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

interface ReportsContextType {
  sales: SaleTicket[];
  recordSale: (params: {
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unit: any;
      finalPriceUSD: number;
      finalPriceVES: number;
    }[];
    payments: PaymentSplit[];
    changeGivenVES?: number;
    changeGivenUSD?: number;
    changeCreditedUSD?: number;
    customerId?: string;
    customerName?: string;
    cashierName?: string;
  }) => SaleTicket;
  dailySummary: {
    date: string;
    totalUSD: number;
    totalVES: number;
    totalCostUSD: number;
    grossProfitUSD: number;
    netProfitUSD: number;
    expensesUSD: number;
    expensesVES: number;
    cashUSD: number;
    cashVES: number;
    pagoMovilVES: number;
    puntoVES: number;
    creditIssuedUSD: number;
    creditCollectedUSD: number;
    ticketsCount: number;
  };
  weeklySalesData: { day: string; dateStr: string; totalUSD: number; tickets: number }[];
  topSellingProducts: { name: string; quantity: number; totalUSD: number }[];
  monthlySummary: {
    monthName: string;
    totalUSD: number;
    totalVES: number;
    netProfitUSD: number;
    growthPercent: number;
    ticketsCount: number;
  };
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<SaleTicket[]>(() => dbInit.getSales());
  const { effectiveRate, rates, isOverride } = useCurrency();
  const { products, adjustStock } = useInventory();
  const { recordCharge, transactions } = useCustomers();
  const { todayTotalExpensesUSD, todayTotalExpensesVES, todayExpensesByMethod } = useExpenses();
  const { tenant } = useAuth();

  // Sincronización en segundo plano de tickets de venta (Offline-First)
  useEffect(() => {
    if (!db || !tenant?.id) return;

    const salesCol = collection(db, 'tenants', tenant.id, 'sales');
    const unsubscribe = onSnapshot(
      salesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudSales: SaleTicket[] = [];
          snapshot.forEach((docSnap) => {
            cloudSales.push(docSnap.data() as SaleTicket);
          });
          cloudSales.sort((a, b) => b.timestamp - a.timestamp);
          setSales(cloudSales);
          dbInit.saveSales(cloudSales);
        } else {
          // Si Firestore está vacío (primer uso), respaldar ventas locales
          const localSales = dbInit.getSales();
          if (localSales && localSales.length > 0) {
            localSales.forEach((s) => {
              setDoc(doc(db, 'tenants', tenant.id, 'sales', s.id), s).catch(() => {});
            });
          }
        }
      },
      (err) => {
        console.warn('Sincronización de ventas en segundo plano:', err);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id]);

  const recordSale = ({
    items,
    payments,
    changeGivenVES = 0,
    changeGivenUSD = 0,
    changeCreditedUSD = 0,
    customerId,
    customerName,
    cashierName = 'Cajero Principal',
  }: {
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unit: any;
      finalPriceUSD: number;
      finalPriceVES: number;
    }[];
    payments: PaymentSplit[];
    changeGivenVES?: number;
    changeGivenUSD?: number;
    changeCreditedUSD?: number;
    customerId?: string;
    customerName?: string;
    cashierName?: string;
  }): SaleTicket => {
    let totalUSD = 0;
    let totalVES = 0;
    let totalCostUSD = 0;

    const itemSnapshots: TicketItemSnapshot[] = items.map((cartItem) => {
      const liveProduct = products.find((p) => p.id === cartItem.productId);
      const costUSD = liveProduct ? liveProduct.costUSD : cartItem.finalPriceUSD * 0.7; // Snapshot del costo en este segundo
      const itemTotalUSD = cartItem.finalPriceUSD * cartItem.quantity;
      const itemTotalVES = cartItem.finalPriceVES * cartItem.quantity;
      const itemCostTotal = costUSD * cartItem.quantity;

      totalUSD += itemTotalUSD;
      totalVES += itemTotalVES;
      totalCostUSD += itemCostTotal;

      // Descontar inventario inmediatamente
      adjustStock(cartItem.productId, -cartItem.quantity);

      return {
        productId: cartItem.productId,
        productName: cartItem.productName,
        quantity: cartItem.quantity,
        unit: cartItem.unit,
        costUSDAtSale: costUSD,
        priceUSDAtSale: cartItem.finalPriceUSD,
        priceVESAtSale: cartItem.finalPriceVES,
        totalUSD: Math.round(itemTotalUSD * 100) / 100,
        totalVES: Math.round(itemTotalVES * 100) / 100,
      };
    });

    const netProfitUSD = Math.round((totalUSD - totalCostUSD) * 100) / 100;
    const ticketId = 'ticket_' + Date.now();

    const newTicket: SaleTicket = {
      id: ticketId,
      tenantId: tenant?.id || 'tenant_cojedes_01',
      ticketNumber: sales.length + 1001,
      timestamp: Date.now(),
      cashierName,
      items: itemSnapshots,
      totalUSD: Math.round(totalUSD * 100) / 100,
      totalVES: Math.round(totalVES * 100) / 100,
      totalCostUSD: Math.round(totalCostUSD * 100) / 100,
      netProfitUSD,
      exchangeRateSnapshot: {
        bcv: rates.bcv,
        overrideActive: isOverride,
        appliedRate: effectiveRate,
      },
      payments,
      changeGivenVES,
      changeGivenUSD,
      changeCreditedUSD,
      customerId,
      customerName,
    };

    // Si hubo pago con fiado, registrar el cargo en el micro-ledger
    const fiadoPayment = payments.find((p) => p.method === 'fiado');
    if (fiadoPayment && customerId && fiadoPayment.amountUSD > 0) {
      recordCharge(customerId, fiadoPayment.amountUSD, ticketId, cashierName);
    }

    const updated = [newTicket, ...sales];
    setSales(updated);
    dbInit.saveSales(updated);

    if (db && tenant?.id) {
      setDoc(doc(db, 'tenants', tenant.id, 'sales', newTicket.id), newTicket).catch(() => {});
    }

    return newTicket;
  };

  // Resumen Diario (Hoy)
  const dailySummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();

    const todaySales = sales.filter((s) => s.timestamp >= startOfToday);
    const todayTx = transactions.filter((t) => t.timestamp >= startOfToday);

    let totalUSD = 0;
    let totalVES = 0;
    let totalCostUSD = 0;
    let cashUSD = 0;
    let cashVES = 0;
    let pagoMovilVES = 0;
    let puntoVES = 0;
    let creditIssuedUSD = 0;

    for (const ticket of todaySales) {
      totalUSD += ticket.totalUSD;
      totalVES += ticket.totalVES;
      totalCostUSD += ticket.totalCostUSD;

      for (const p of ticket.payments) {
        if (p.method === 'usd_cash') cashUSD += p.amountUSD;
        if (p.method === 'ves_cash') cashVES += p.amountVES;
        if (p.method === 'pago_movil') pagoMovilVES += p.amountVES;
        if (p.method === 'punto_venta') puntoVES += p.amountVES;
        if (p.method === 'fiado') creditIssuedUSD += p.amountUSD;
      }
    }

    // Abonos cobrados hoy de fiados anteriores
    let creditCollectedUSD = 0;
    for (const tx of todayTx) {
      if (tx.type === 'abono') {
        creditCollectedUSD += tx.amountUSD;
        if (tx.payments) {
          for (const p of tx.payments) {
            if (p.method === 'usd_cash') cashUSD += p.amountUSD;
            if (p.method === 'ves_cash') cashVES += p.amountVES;
            if (p.method === 'pago_movil') pagoMovilVES += p.amountVES;
            if (p.method === 'punto_venta') puntoVES += p.amountVES;
          }
        }
      }
    }

    const grossProfitUSD = Math.round((totalUSD - totalCostUSD) * 100) / 100;
    const netProfitUSD = Math.round((grossProfitUSD - todayTotalExpensesUSD) * 100) / 100;

    // Descontar salidas de efectivo y gastos pagados de la gaveta / cuentas
    const finalCashUSD = Math.max(0, Math.round((cashUSD - todayExpensesByMethod.cashUSD) * 100) / 100);
    const finalCashVES = Math.max(0, Math.round((cashVES - todayExpensesByMethod.cashVES) * 100) / 100);
    const finalPagoMovilVES = Math.max(0, Math.round((pagoMovilVES - todayExpensesByMethod.pagoMovilVES) * 100) / 100);
    const finalPuntoVES = Math.max(0, Math.round((puntoVES - todayExpensesByMethod.puntoVES) * 100) / 100);

    return {
      date: new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' }),
      totalUSD: Math.round(totalUSD * 100) / 100,
      totalVES: Math.round(totalVES * 100) / 100,
      totalCostUSD: Math.round(totalCostUSD * 100) / 100,
      grossProfitUSD,
      netProfitUSD,
      expensesUSD: todayTotalExpensesUSD,
      expensesVES: todayTotalExpensesVES,
      cashUSD: finalCashUSD,
      cashVES: finalCashVES,
      pagoMovilVES: finalPagoMovilVES,
      puntoVES: finalPuntoVES,
      creditIssuedUSD: Math.round(creditIssuedUSD * 100) / 100,
      creditCollectedUSD: Math.round(creditCollectedUSD * 100) / 100,
      ticketsCount: todaySales.length,
    };
  }, [sales, transactions, todayTotalExpensesUSD, todayTotalExpensesVES, todayExpensesByMethod]);

  // Resumen Semanal (Últimos 7 días)
  const weeklySalesData = useMemo(() => {
    const daysName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;

      const daySales = sales.filter((s) => s.timestamp >= start && s.timestamp < end);
      const dayTotal = daySales.reduce((acc, s) => acc + s.totalUSD, 0);

      result.push({
        day: daysName[d.getDay()],
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        totalUSD: Math.round(dayTotal * 100) / 100,
        tickets: daySales.length,
      });
    }

    return result;
  }, [sales]);

  // Top Productos Más Vendidos
  const topSellingProducts = useMemo(() => {
    const map: Record<string, { quantity: number; totalUSD: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!map[item.productName]) {
          map[item.productName] = { quantity: 0, totalUSD: 0 };
        }
        map[item.productName].quantity += item.quantity;
        map[item.productName].totalUSD += item.totalUSD;
      }
    }

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        quantity: Math.round(data.quantity * 100) / 100,
        totalUSD: Math.round(data.totalUSD * 100) / 100,
      }))
      .sort((a, b) => b.totalUSD - a.totalUSD)
      .slice(0, 8);
  }, [sales]);

  // Resumen Mensual
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    const currentMonthSales = sales.filter((s) => s.timestamp >= startOfMonth);
    const prevMonthSales = sales.filter(
      (s) => s.timestamp >= startOfPrevMonth && s.timestamp < startOfMonth
    );

    const currentUSD = currentMonthSales.reduce((acc, s) => acc + s.totalUSD, 0);
    const currentCost = currentMonthSales.reduce((acc, s) => acc + s.totalCostUSD, 0);
    const currentVES = currentMonthSales.reduce((acc, s) => acc + s.totalVES, 0);
    const prevUSD = prevMonthSales.reduce((acc, s) => acc + s.totalUSD, 0);

    const growth = prevUSD > 0 ? Math.round(((currentUSD - prevUSD) / prevUSD) * 100) : 0;

    return {
      monthName: now.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' }),
      totalUSD: Math.round(currentUSD * 100) / 100,
      totalVES: Math.round(currentVES * 100) / 100,
      netProfitUSD: Math.round((currentUSD - currentCost) * 100) / 100,
      growthPercent: growth,
      ticketsCount: currentMonthSales.length,
    };
  }, [sales]);

  return (
    <ReportsContext.Provider
      value={{
        sales,
        recordSale,
        dailySummary,
        weeklySalesData,
        topSellingProducts,
        monthlySummary,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) throw new Error('useReports must be used within a ReportsProvider');
  return context;
};
