import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  MessageCircle, 
  CheckCircle2, 
  PieChart, 
  Layers, 
  ArrowUpRight, 
  Smartphone, 
  Banknote, 
  CreditCard, 
  BookOpen,
  Package,
  Receipt,
  Clock
} from 'lucide-react';
import { useReports } from '../../context/ReportsContext';
import { useInventory } from '../../context/InventoryContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { generateDailyClosingWhatsApp, openWhatsAppLink } from '../../services/whatsapp';

export const ReportsView: React.FC = () => {
  const { dailySummary, weeklySalesData, topSellingProducts, monthlySummary, sales } = useReports();
  const { products } = useInventory();
  const { effectiveRate } = useCurrency();
  const { tenant } = useAuth();

  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dailyHistoryView, setDailyHistoryView] = useState<'products' | 'tickets'>('products');

  // Ventas de hoy
  const todaySales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();
    return sales.filter((s) => s.timestamp >= startOfToday);
  }, [sales]);

  // Consolidado de productos que han salido en el día
  const todayProductsSummary = useMemo(() => {
    const map = new Map<string, {
      name: string;
      unit: string;
      quantity: number;
      totalUSD: number;
      totalVES: number;
      ticketsCount: number;
    }>();

    todaySales.forEach((ticket) => {
      ticket.items.forEach((item) => {
        const key = item.productId || item.productName;
        const existing = map.get(key);
        if (existing) {
          existing.quantity = Math.round((existing.quantity + item.quantity) * 1000) / 1000;
          existing.totalUSD = Math.round((existing.totalUSD + item.totalUSD) * 100) / 100;
          existing.totalVES = Math.round((existing.totalVES + item.totalVES) * 100) / 100;
          existing.ticketsCount += 1;
        } else {
          map.set(key, {
            name: item.productName,
            unit: item.unit,
            quantity: item.quantity,
            totalUSD: item.totalUSD,
            totalVES: item.totalVES,
            ticketsCount: 1,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [todaySales]);

  const totalItemsSoldToday = useMemo(() => {
    return Math.round(todayProductsSummary.reduce((acc, p) => acc + p.quantity, 0) * 100) / 100;
  }, [todayProductsSummary]);

  // Total inventory valuation at replacement cost
  const inventoryValuationUSD = Math.round(
    products.reduce((acc, p) => acc + p.costUSD * p.stock, 0) * 100
  ) / 100;

  const handleShareDailyWhatsApp = () => {
    const text = generateDailyClosingWhatsApp(
      dailySummary, 
      tenant?.name || 'BodegaPro',
      todayProductsSummary
    );
    openWhatsAppLink(tenant?.phone || '', text);
  };

  const maxWeeklyUSD = Math.max(...weeklySalesData.map((d) => d.totalUSD), 10);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden pb-16 md:pb-0">
      
      {/* Top Header & Tab switcher */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Informes y Rendimiento</span>
            <span className="text-xs bg-brand-emerald-100 text-brand-emerald-800 font-bold px-2 py-0.5 rounded-full">
              En Vivo
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Analítica de ganancias reales, arqueo de caja y rotación de mercancía.
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveReportTab('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeReportTab === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Diario (Cierre)
          </button>
          <button
            onClick={() => setActiveReportTab('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeReportTab === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setActiveReportTab('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeReportTab === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Mensual
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        
        {/* ================= INFORME DIARIO ================= */}
        {activeReportTab === 'daily' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            
            {/* Header banner with WhatsApp sharing */}
            <div className="p-4 rounded-2xl bg-brand-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[10px] text-brand-emerald-400 font-bold uppercase tracking-widest block">
                  Resumen de la Jornada
                </span>
                <h3 className="text-lg font-black capitalize">{dailySummary.date}</h3>
                <p className="text-xs text-slate-400">
                  {dailySummary.ticketsCount} tickets de venta cobrados hoy
                </p>
              </div>

              <button
                onClick={handleShareDailyWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Cierre por WhatsApp</span>
              </button>
            </div>

            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Facturación Total
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1">
                  ${dailySummary.totalUSD.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                  Bs {dailySummary.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Ganancia Neta Real
                </span>
                <span className="text-2xl font-black text-emerald-600 block mt-1">
                  +${dailySummary.netProfitUSD.toFixed(2)}
                </span>
                <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                  Utilidad pura descontando costo de reposición
                </span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tickets Emitidos
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1">
                  {dailySummary.ticketsCount}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Promedio: ${dailySummary.ticketsCount > 0 ? (dailySummary.totalUSD / dailySummary.ticketsCount).toFixed(2) : '0.00'} / ticket
                </span>
              </div>
            </div>

            {/* Arqueo por Canales (Cuadre de caja) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-black text-sm text-slate-900 tracking-tight">
                Arqueo de Gaveta y Bancos (Cierre de Caja)
              </h4>
              <p className="text-xs text-slate-500">
                Verifica lo que debe existir físicamente en caja y en tus cuentas bancarias:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Efectivo en Dólares ($)</span>
                      <span className="text-[10px] text-slate-400">Gaveta física de billetes</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-700">
                    ${dailySummary.cashUSD.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Efectivo en Bolívares (Bs)</span>
                      <span className="text-[10px] text-slate-400">Gaveta física sencillo Bs</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-blue-700">
                    Bs {dailySummary.cashVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Pago Móvil Recibido</span>
                      <span className="text-[10px] text-slate-400">Estado de cuenta banco</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-indigo-700">
                    Bs {dailySummary.pagoMovilVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Punto de Venta</span>
                      <span className="text-[10px] text-slate-400">Lote cierre de terminal</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-amber-700">
                    Bs {dailySummary.puntoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Fiado balance */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between mt-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Movimiento de Fiados Hoy</span>
                    <span className="text-[10px] text-slate-500">
                      Fiado otorgado: ${dailySummary.creditIssuedUSD.toFixed(2)} • Abonos cobrados: ${dailySummary.creditCollectedUSD.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">Balance Neto Fiados:</span>
                  <span className={`text-sm font-black ${dailySummary.creditCollectedUSD >= dailySummary.creditIssuedUSD ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${(dailySummary.creditCollectedUSD - dailySummary.creditIssuedUSD).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Historial de Salida de Mercancía y Ventas del Día */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm sm:text-base text-slate-900 tracking-tight flex items-center space-x-2">
                    <Package className="w-5 h-5 text-brand-emerald-600" />
                    <span>Salida de Mercancía e Historial de Hoy</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Control diario de artículos despachados y tickets cobrados en la jornada.
                  </p>
                </div>

                {/* Switcher entre Productos Salidos y Registro de Tickets */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setDailyHistoryView('products')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                      dailyHistoryView === 'products'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-brand-emerald-600" />
                    <span>Productos Salidos ({todayProductsSummary.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailyHistoryView('tickets')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                      dailyHistoryView === 'tickets'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tickets ({todaySales.length})</span>
                  </button>
                </div>
              </div>

              {/* VISTA 1: PRODUCTOS VENDIDOS / SALIDA DE MERCANCÍA */}
              {dailyHistoryView === 'products' && (
                <div className="space-y-3">
                  {todayProductsSummary.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Layers className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">No se han registrado ventas de productos el día de hoy.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span>Total despachado hoy:</span>
                        <span className="text-brand-emerald-700 font-black">
                          {totalItemsSoldToday} unidades / artículos en total
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {todayProductsSummary.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white hover:bg-slate-50/80 transition flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                                {item.name}
                              </h5>
                              <span className="text-[11px] text-slate-400 font-medium">
                                Presente en {item.ticketsCount} {item.ticketsCount === 1 ? 'ticket' : 'tickets'} hoy
                              </span>
                            </div>

                            <div className="flex items-center space-x-3 shrink-0">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-black text-xs sm:text-sm border border-emerald-200">
                                {item.quantity} {item.unit}
                              </span>
                              <div className="text-right min-w-[70px]">
                                <span className="font-black text-xs sm:text-sm text-slate-900 block">
                                  ${item.totalUSD.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium block">
                                  Bs {item.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* VISTA 2: TICKETS INDIVIDUALES */}
              {dailyHistoryView === 'tickets' && (
                <div className="space-y-2.5">
                  {todaySales.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">No se han emitido tickets el día de hoy.</p>
                    </div>
                  ) : (
                    todaySales.map((ticket) => {
                      const timeStr = new Date(ticket.timestamp).toLocaleTimeString('es-VE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });

                      return (
                        <div
                          key={ticket.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-black text-xs sm:text-sm text-slate-900">
                                  Ticket #{ticket.ticketNumber}
                                </span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{timeStr}</span>
                                </span>
                                {ticket.customerName && (
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                                    {ticket.customerName}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                Atendido por: {ticket.cashierName || 'Cajero'}
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-black text-sm sm:text-base text-slate-900 block">
                                ${ticket.totalUSD.toFixed(2)}
                              </span>
                              <span className="text-[11px] text-brand-emerald-600 font-bold block">
                                Bs {ticket.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* List of items in this ticket */}
                          <div className="pt-2 border-t border-slate-200/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Artículos ({ticket.items.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-700">
                              {ticket.items.map((item, i) => (
                                <div key={i} className="flex items-baseline justify-between bg-white px-2 py-1 rounded-lg border border-slate-200/50">
                                  <span className="truncate pr-2 font-medium">
                                    <strong className="text-brand-emerald-700">{item.quantity} {item.unit}</strong> × {item.productName}
                                  </span>
                                  <span className="shrink-0 font-bold text-[11px] text-slate-600">
                                    ${item.totalUSD.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Payment split badges */}
                          <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                            {ticket.payments.map((p, pIdx) => {
                              const methodLabels: Record<string, { label: string; bg: string; text: string }> = {
                                usd_cash: { label: 'Efectivo $', bg: 'bg-emerald-100', text: 'text-emerald-800' },
                                ves_cash: { label: 'Efectivo Bs', bg: 'bg-blue-100', text: 'text-blue-800' },
                                pago_movil: { label: 'Pago Móvil', bg: 'bg-indigo-100', text: 'text-indigo-800' },
                                punto_venta: { label: 'Punto', bg: 'bg-amber-100', text: 'text-amber-800' },
                                fiado: { label: 'Fiado', bg: 'bg-rose-100', text: 'text-rose-800' },
                              };
                              const meta = methodLabels[p.method] || { label: p.method, bg: 'bg-slate-100', text: 'text-slate-800' };
                              return (
                                <span
                                  key={pIdx}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${meta.bg} ${meta.text}`}
                                >
                                  {meta.label}: ${p.amountUSD.toFixed(2)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= INFORME SEMANAL ================= */}
        {activeReportTab === 'weekly' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            
            {/* 7-Day Chart */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-base text-slate-900">Tendencia de Ventas (Últimos 7 Días)</h4>
                  <p className="text-xs text-slate-500">Ventas en USD por día de la semana</p>
                </div>
              </div>

              <div className="pt-6 pb-2 grid grid-cols-7 gap-2 items-end h-48 border-b border-slate-200">
                {weeklySalesData.map((d, index) => {
                  const heightPercent = Math.max(8, (d.totalUSD / maxWeeklyUSD) * 100);
                  const isToday = index === weeklySalesData.length - 1;

                  return (
                    <div key={index} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition">
                        ${d.totalUSD.toFixed(0)}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-500 ${
                          isToday
                            ? 'bg-brand-emerald-500'
                            : 'bg-brand-slate-800 group-hover:bg-brand-emerald-600'
                        }`}
                      />
                      <span className="text-[11px] font-bold text-slate-700 mt-2 block">
                        {d.day}
                      </span>
                      <span className="text-[9px] text-slate-400">{d.dateStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-black text-sm text-slate-900">Productos Más Vendidos</h4>
              
              {topSellingProducts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No hay ventas registradas aún.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topSellingProducts.map((p, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[11px]">
                          #{i + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800">{p.name}</span>
                          <span className="text-[11px] text-slate-400 block">{p.quantity} unidades despachadas</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">${p.totalUSD.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= INFORME MENSUAL ================= */}
        {activeReportTab === 'monthly' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-emerald-600 uppercase tracking-wider block">
                    Salud y Rentabilidad del Negocio
                  </span>
                  <h3 className="text-xl font-black text-slate-900 capitalize">
                    {monthlySummary.monthName}
                  </h3>
                </div>
                {monthlySummary.growthPercent !== 0 && (
                  <div
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                      monthlySummary.growthPercent >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{monthlySummary.growthPercent > 0 ? '+' : ''}{monthlySummary.growthPercent}% vs mes anterior</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Facturación Acumulada del Mes
                  </span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">
                    ${monthlySummary.totalUSD.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                    Bs {monthlySummary.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                    Utilidad / Ganancia Neta del Mes
                  </span>
                  <span className="text-2xl font-black text-emerald-600 block mt-1">
                    +${monthlySummary.netProfitUSD.toFixed(2)}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium block mt-0.5">
                    Ganancia pura real acumulada
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Valuation Card */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Valor Total del Inventario en Bodega
                  </span>
                  <span className="text-xl font-black text-slate-900 block mt-0.5">
                    ${inventoryValuationUSD.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500">
                    Calculado a último costo de reposición
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
