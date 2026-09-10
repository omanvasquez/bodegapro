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
  Clock,
  MinusCircle,
  Plus,
  Trash2,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useReports } from '../../context/ReportsContext';
import { useInventory } from '../../context/InventoryContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useExpenses } from '../../context/ExpensesContext';
import { useAuth } from '../../context/AuthContext';
import { 
  generateDailyClosingWhatsApp, 
  generateWeeklyReportWhatsApp, 
  generateMonthlyReportWhatsApp, 
  openWhatsAppLink 
} from '../../services/whatsapp';
import { ExpenseModal } from '../expenses/ExpenseModal';

const categoryMeta: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  gasolina: { label: 'Gasolina / Planta', icon: '⛽', bg: 'bg-amber-100', text: 'text-amber-800' },
  personal: { label: 'Personal / Sueldos', icon: '👷', bg: 'bg-blue-100', text: 'text-blue-800' },
  proveedor: { label: 'Pago a Proveedor', icon: '🚛', bg: 'bg-purple-100', text: 'text-purple-800' },
  servicios: { label: 'Servicios (Luz/Net)', icon: '💡', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  suministros: { label: 'Bolsas / Hielo', icon: '🛍️', bg: 'bg-pink-100', text: 'text-pink-800' },
  mantenimiento: { label: 'Mantenimiento', icon: '🔧', bg: 'bg-orange-100', text: 'text-orange-800' },
  otro: { label: 'Otro Imprevisto', icon: '📦', bg: 'bg-slate-100', text: 'text-slate-800' },
};

const wasteReasonMeta: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  consumo_propio: { label: 'Consumo Propio', icon: '👤', bg: 'bg-blue-100', text: 'text-blue-800' },
  danado: { label: 'Producto Dañado', icon: '⚠️', bg: 'bg-amber-100', text: 'text-amber-800' },
  vencido: { label: 'Producto Vencido', icon: '⏳', bg: 'bg-rose-100', text: 'text-rose-800' },
  otro: { label: 'Ajuste Inventario', icon: '📦', bg: 'bg-slate-100', text: 'text-slate-800' },
};

export const ReportsView: React.FC = () => {
  const { dailySummary, weeklySalesData, weeklySummary, topSellingProducts, monthlySummary, sales, clearAllCalculations } = useReports();
  const { products, wastes } = useInventory();
  const { effectiveRate } = useCurrency();
  const { tenant } = useAuth();
  const { todayExpenses, deleteExpense, todayExpensesByMethod } = useExpenses();

  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dailyHistoryView, setDailyHistoryView] = useState<'products' | 'tickets' | 'expenses' | 'wastes'>('products');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleConfirmReset = () => {
    clearAllCalculations();
    setIsResetModalOpen(false);
    setResetSuccessMessage('✓ Cálculos reiniciados exitosamente. El inventario y tus clientes permanecen intactos.');
    setTimeout(() => {
      setResetSuccessMessage(null);
    }, 5000);
  };

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

  // Mermas y consumo propio de hoy
  const todayWastes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();
    return wastes.filter((w) => w.timestamp >= startOfToday);
  }, [wastes]);

  const todayWastesCostUSD = useMemo(() => {
    return Math.round(todayWastes.reduce((acc, w) => acc + w.costUSD, 0) * 100) / 100;
  }, [todayWastes]);

  const todayWastesCostVES = useMemo(() => {
    return Math.round(todayWastesCostUSD * effectiveRate * 100) / 100;
  }, [todayWastesCostUSD, effectiveRate]);

  // Mermas y consumo propio últimos 7 días
  const weekWastes = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const startOfSevenDays = sevenDaysAgo.getTime();
    return wastes.filter((w) => w.timestamp >= startOfSevenDays);
  }, [wastes]);

  const weekWastesCostUSD = useMemo(() => {
    return Math.round(weekWastes.reduce((acc, w) => acc + w.costUSD, 0) * 100) / 100;
  }, [weekWastes]);

  // Mermas y consumo propio del mes en curso
  const monthlyWastes = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return wastes.filter((w) => w.timestamp >= startOfMonth);
  }, [wastes]);

  const monthlyWastesCostUSD = useMemo(() => {
    return Math.round(monthlyWastes.reduce((acc, w) => acc + w.costUSD, 0) * 100) / 100;
  }, [monthlyWastes]);

  // Total inventory valuation at replacement cost
  const inventoryValuationUSD = Math.round(
    products.reduce((acc, p) => acc + p.costUSD * p.stock, 0) * 100
  ) / 100;

  const handleShareDailyWhatsApp = () => {
    const text = generateDailyClosingWhatsApp(
      dailySummary, 
      tenant?.name || 'BodegaPro',
      todayProductsSummary,
      todayExpenses.map((e) => ({
        description: e.description,
        amountUSD: e.amountUSD,
        category: e.category,
      })),
      todayWastes.map((w) => ({
        productName: w.productName,
        quantity: w.quantity,
        unit: w.unit,
        costUSD: w.costUSD,
        reason: wasteReasonMeta[w.reason]?.label || w.reason,
      }))
    );
    openWhatsAppLink(tenant?.phone || '', text);
  };

  const handleShareWeeklyWhatsApp = () => {
    const text = generateWeeklyReportWhatsApp(weeklySummary, tenant?.name || 'BodegaPro');
    openWhatsAppLink(tenant?.phone || '', text);
  };

  const handleShareMonthlyWhatsApp = () => {
    const text = generateMonthlyReportWhatsApp(monthlySummary, tenant?.name || 'BodegaPro');
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

        {/* Actions & Tab switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-95"
            title="Poner en cero todos los cálculos, ventas, gastos y deudas de fiado para iniciar un nuevo ciclo"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Limpiar Cálculos</span>
          </button>

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
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Banner de confirmación de reinicio exitoso */}
        {resetSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between shadow-xs animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resetSuccessMessage}</span>
            </div>
            <button
              onClick={() => setResetSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-0.5 rounded-lg hover:bg-emerald-100/50"
            >
              ✕
            </button>
          </div>
        )}
        
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Facturación Total
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
                  ${dailySummary.totalUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block mt-0.5 truncate">
                  Bs {dailySummary.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                  Gastos de Caja
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-600 block mt-1">
                  -${dailySummary.expensesUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-rose-500 font-semibold block mt-0.5 truncate">
                  Bs {dailySummary.expensesVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  Mermas / Consumo
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-700 block mt-1">
                  -${todayWastesCostUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-amber-600 font-semibold block mt-0.5 truncate">
                  Bs {todayWastesCostVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} • {todayWastes.length} {todayWastes.length === 1 ? 'salida' : 'salidas'}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Ganancia Neta Real
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 block mt-1">
                  +${dailySummary.netProfitUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-800 font-medium block mt-0.5 truncate">
                  Descontando costos y gastos
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tickets Emitidos
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
                  {dailySummary.ticketsCount}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 block mt-0.5">
                  Promedio: ${dailySummary.ticketsCount > 0 ? (dailySummary.totalUSD / dailySummary.ticketsCount).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {/* Arqueo por Canales (Cuadre de caja) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-black text-sm text-slate-900 tracking-tight">
                    Arqueo de Gaveta y Bancos (Cierre de Caja)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Verifica lo que debe existir físicamente en caja y en tus cuentas bancarias:
                  </p>
                </div>
                {(todayExpensesByMethod.cashUSD > 0 || todayExpensesByMethod.cashVES > 0) && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                    ⚠️ Se restaron gastos pagados en efectivo
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Efectivo en Dólares ($)</span>
                      <span className="text-[10px] text-slate-400">
                        {todayExpensesByMethod.cashUSD > 0 ? `Gaveta (-$${todayExpensesByMethod.cashUSD.toFixed(2)} en gastos)` : 'Gaveta física de billetes'}
                      </span>
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
                      <span className="text-[10px] text-slate-400">
                        {todayExpensesByMethod.cashVES > 0 ? `Gaveta (-Bs ${todayExpensesByMethod.cashVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} en gastos)` : 'Gaveta física sencillo Bs'}
                      </span>
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
                      <span className="text-[10px] text-slate-400">
                        {todayExpensesByMethod.pagoMovilVES > 0 ? `Banco (-Bs ${todayExpensesByMethod.pagoMovilVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} en gastos)` : 'Estado de cuenta banco'}
                      </span>
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
                      <span className="text-[10px] text-slate-400">
                        {todayExpensesByMethod.puntoVES > 0 ? `Terminal (-Bs ${todayExpensesByMethod.puntoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} en gastos)` : 'Lote cierre de terminal'}
                      </span>
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

                {/* Switcher entre Productos Salidos, Registro de Tickets y Gastos de Caja */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
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
                      <span>Productos ({todayProductsSummary.length})</span>
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
                    <button
                      type="button"
                      onClick={() => setDailyHistoryView('expenses')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        dailyHistoryView === 'expenses'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Gastos ({todayExpenses.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDailyHistoryView('wastes')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        dailyHistoryView === 'wastes'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Mermas ({todayWastes.length})</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Gasto</span>
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

              {/* VISTA 3: GASTOS Y SALIDAS DE CAJA */}
              {dailyHistoryView === 'expenses' && (
                <div className="space-y-3">
                  {todayExpenses.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <MinusCircle className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">No se han registrado salidas de caja o gastos hoy.</p>
                      <button
                        type="button"
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Registrar Primer Gasto</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/80">
                        <span>Total gastos de la jornada:</span>
                        <div className="text-right">
                          <span className="text-rose-700 font-black text-sm block">
                            -${dailySummary.expensesUSD.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-rose-600 font-semibold">
                            Bs {dailySummary.expensesVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {todayExpenses.map((expense) => {
                          const categoryLabels: Record<string, { label: string; bg: string; text: string }> = {
                            gasolina: { label: '⛽ Gasolina', bg: 'bg-amber-100', text: 'text-amber-800' },
                            personal: { label: '👷 Empleado/Pago', bg: 'bg-blue-100', text: 'text-blue-800' },
                            proveedor: { label: '🚛 Proveedor/Factura', bg: 'bg-purple-100', text: 'text-purple-800' },
                            servicios: { label: '💡 Servicios/Luz', bg: 'bg-emerald-100', text: 'text-emerald-800' },
                            suministros: { label: '🛍️ Bolsas/Suministros', bg: 'bg-pink-100', text: 'text-pink-800' },
                            mantenimiento: { label: '🔧 Mantenimiento', bg: 'bg-orange-100', text: 'text-orange-800' },
                            otro: { label: '📦 Otro Gasto', bg: 'bg-slate-100', text: 'text-slate-800' },
                          };

                          const methodLabels: Record<string, string> = {
                            usd_cash: 'Efectivo $',
                            ves_cash: 'Efectivo Bs',
                            pago_movil: 'Pago Móvil',
                            punto_venta: 'Punto de Venta',
                          };

                          const catMeta = categoryLabels[expense.category] || categoryLabels.otro;
                          const methodStr = methodLabels[expense.paymentMethod] || expense.paymentMethod;
                          const timeStr = new Date(expense.timestamp).toLocaleTimeString('es-VE', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });

                          return (
                            <div key={expense.id} className="py-3 flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 font-bold text-xs">
                                  💸
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <span className="font-bold text-xs text-slate-800 truncate">
                                      {expense.description}
                                    </span>
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${catMeta.bg} ${catMeta.text}`}>
                                      {catMeta.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{timeStr}</span>
                                    </span>
                                    <span>•</span>
                                    <span className="font-semibold text-slate-500">{methodStr}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 shrink-0">
                                <div className="text-right">
                                  <span className="font-black text-rose-600 text-sm block">
                                    -${expense.amountUSD.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold block">
                                    Bs {expense.amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`¿Eliminar gasto "${expense.description}" de $${expense.amountUSD.toFixed(2)}?`)) {
                                      deleteExpense(expense.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Eliminar gasto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* VISTA 4: MERMAS, DAÑADOS Y CONSUMO PROPIO */}
              {dailyHistoryView === 'wastes' && (
                <div className="space-y-3">
                  {todayWastes.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <AlertTriangle className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">
                        No se han registrado mermas ni salidas de consumo el día de hoy.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        <span>Costo total en mermas y salidas hoy:</span>
                        <span className="font-black text-sm">
                          -${todayWastesCostUSD.toFixed(2)} (Bs {todayWastesCostVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })})
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        {todayWastes.map((waste) => {
                          const meta = wasteReasonMeta[waste.reason] || wasteReasonMeta.otro;
                          const timeStr = new Date(waste.timestamp).toLocaleTimeString('es-VE', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });
                          const vesAmount = Math.round(waste.costUSD * effectiveRate * 100) / 100;

                          return (
                            <div key={waste.id} className="p-3 hover:bg-slate-50/80 transition flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 font-bold text-xs">
                                  {meta.icon}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <h5 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                                      {waste.productName}
                                    </h5>
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${meta.bg} ${meta.text}`}>
                                      {meta.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{timeStr}</span>
                                    </span>
                                    <span>•</span>
                                    <span className="font-bold text-slate-600">
                                      Cantidad: -{waste.quantity} {waste.unit}
                                    </span>
                                    {waste.notes && (
                                      <>
                                        <span>•</span>
                                        <span className="italic text-slate-500 truncate max-w-[150px]">
                                          "{waste.notes}"
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-black text-amber-700 text-sm block">
                                  -${waste.costUSD.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold block">
                                  Bs {vesAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= INFORME SEMANAL ================= */}
        {activeReportTab === 'weekly' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            
            {/* Header banner with WhatsApp sharing */}
            <div className="p-4 rounded-2xl bg-brand-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[10px] text-brand-emerald-400 font-bold uppercase tracking-widest block">
                  Rendimiento Semanal (7 Días)
                </span>
                <h3 className="text-lg font-black capitalize">Balance de los Últimos 7 Días</h3>
                <p className="text-xs text-slate-400">
                  {weeklySummary.ticketsCount} tickets de venta • Promedio diario: ${weeklySummary.averageDailyUSD.toFixed(2)} / día
                </p>
              </div>

              <button
                onClick={handleShareWeeklyWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Balance Semanal por WhatsApp</span>
              </button>
            </div>

            {/* Main KPI Cards (Semana) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Facturación 7 Días
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
                  ${weeklySummary.totalUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block mt-0.5 truncate">
                  Bs {weeklySummary.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                  Gastos de Operación
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-600 block mt-1">
                  -${weeklySummary.expensesUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-rose-500 font-semibold block mt-0.5 truncate">
                  Bs {weeklySummary.expensesVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  Mermas 7 Días
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-700 block mt-1">
                  -${weekWastesCostUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-amber-600 font-semibold block mt-0.5 truncate">
                  Bs {(weekWastesCostUSD * effectiveRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} • {weekWastes.length} {weekWastes.length === 1 ? 'salida' : 'salidas'}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Ganancia Neta Real
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 block mt-1">
                  +${weeklySummary.netProfitUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-800 font-medium block mt-0.5 truncate">
                  Margen real: {weeklySummary.profitMarginPercent.toFixed(1)}%
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ticket Promedio
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
                  ${weeklySummary.averageTicketUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 block mt-0.5">
                  {weeklySummary.ticketsCount} compras registradas
                </span>
              </div>
            </div>

            {/* 7-Day Chart with Summary */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-black text-base text-slate-900">Tendencia de Ventas Diarias</h4>
                  <p className="text-xs text-slate-500">Ventas en USD por día en los últimos 7 días</p>
                </div>
                <div className="text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                  Ritmo: <strong className="text-brand-emerald-700 font-black">${weeklySummary.averageDailyUSD.toFixed(2)}/día</strong>
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

            {/* Canales de Cobro Semanales */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-black text-sm text-slate-900 tracking-tight">
                Canales de Cobro Acumulados (Últimos 7 Días)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Efectivo en Dólares ($)</span>
                      <span className="text-[10px] text-slate-400">Total recaudado 7 días</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-700">
                    ${weeklySummary.cashUSD.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Efectivo en Bolívares (Bs)</span>
                      <span className="text-[10px] text-slate-400">Total recaudado 7 días</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-blue-700">
                    Bs {weeklySummary.cashVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Pago Móvil Recibido</span>
                      <span className="text-[10px] text-slate-400">Transferencias bancarias</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-indigo-700">
                    Bs {weeklySummary.pagoMovilVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Punto de Venta</span>
                      <span className="text-[10px] text-slate-400">Tarjetas de débito</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-amber-700">
                    Bs {weeklySummary.puntoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Fiado balance de la semana */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between mt-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Movimiento de Fiados de la Semana</span>
                    <span className="text-[10px] text-slate-500">
                      Fiados concedidos: ${weeklySummary.creditIssuedUSD.toFixed(2)} • Abonos cobrados: ${weeklySummary.creditCollectedUSD.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">Balance Neto Fiados:</span>
                  <span className={`text-sm font-black ${weeklySummary.creditCollectedUSD >= weeklySummary.creditIssuedUSD ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${(weeklySummary.creditCollectedUSD - weeklySummary.creditIssuedUSD).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dos Columnas: Top Productos y Gastos Semanales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Selling Products */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-brand-emerald-600" />
                  <span>Productos Más Vendidos (7 Días)</span>
                </h4>
                
                {topSellingProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No hay ventas registradas aún.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {topSellingProducts.map((p, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[11px] shrink-0">
                            #{i + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-400 block">{p.quantity} despachados</span>
                          </div>
                        </div>
                        <span className="font-black text-slate-900 shrink-0">${p.totalUSD.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gastos de la Semana por Categoría */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                  <MinusCircle className="w-4 h-4 text-rose-600" />
                  <span>Salidas de Dinero por Categoría</span>
                </h4>

                {weeklySummary.expensesUSD === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No se registraron gastos en los últimos 7 días.</p>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {Object.entries(weeklySummary.expensesByCategory).map(([catKey, amount]) => {
                      const meta = categoryMeta[catKey] || categoryMeta.otro;
                      const percent = Math.round((amount / (weeklySummary.expensesUSD || 1)) * 100);

                      return (
                        <div key={catKey} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                              <span>{meta.icon}</span>
                              <span>{meta.label}</span>
                            </span>
                            <span className="font-black text-rose-600">
                              -${amount.toFixed(2)} <span className="text-[10px] text-slate-400 font-semibold">({percent}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= INFORME MENSUAL ================= */}
        {activeReportTab === 'monthly' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            
            {/* Header banner with WhatsApp sharing */}
            <div className="p-4 rounded-2xl bg-brand-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[10px] text-brand-emerald-400 font-bold uppercase tracking-widest block">
                  Cierre y Salud Financiera Mensual
                </span>
                <div className="flex items-center space-x-2.5 mt-0.5">
                  <h3 className="text-xl font-black capitalize">{monthlySummary.monthName}</h3>
                  {monthlySummary.growthPercent !== 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center space-x-1 ${
                        monthlySummary.growthPercent >= 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>{monthlySummary.growthPercent > 0 ? '+' : ''}{monthlySummary.growthPercent}% vs mes anterior</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {monthlySummary.ticketsCount} tickets de venta cobrados en el mes • Ritmo diario: ${monthlySummary.averageDailyUSD.toFixed(2)} / día
                </p>
              </div>

              <button
                onClick={handleShareMonthlyWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Cierre Mensual por WhatsApp</span>
              </button>
            </div>

            {/* Main KPI Cards (Mes) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Facturación del Mes
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
                  ${monthlySummary.totalUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block mt-0.5 truncate">
                  Bs {monthlySummary.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                  Gastos Operativos
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-600 block mt-1">
                  -${monthlySummary.expensesUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-rose-500 font-semibold block mt-0.5 truncate">
                  Bs {monthlySummary.expensesVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  Mermas del Mes
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-700 block mt-1">
                  -${monthlyWastesCostUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-amber-600 font-semibold block mt-0.5 truncate">
                  Bs {(monthlyWastesCostUSD * effectiveRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} • {monthlyWastes.length} {monthlyWastes.length === 1 ? 'salida' : 'salidas'}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Utilidad Neta Real
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 block mt-1">
                  +${monthlySummary.netProfitUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-800 font-medium block mt-0.5 truncate">
                  Margen de ganancia: {monthlySummary.profitMarginPercent.toFixed(1)}%
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Venta Diaria Promedio
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
                  ${monthlySummary.averageDailyUSD.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 block mt-0.5">
                  Ticket prom: ${monthlySummary.averageTicketUSD.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Canales de Cobro Acumulados del Mes */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-black text-sm text-slate-900 tracking-tight">
                Ingresos y Cobranzas por Canal de Pago (Mes Completo)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Efectivo en Dólares ($)</span>
                      <span className="text-[10px] text-slate-400">Total mes en gaveta $</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-700">
                    ${monthlySummary.cashUSD.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Efectivo en Bolívares (Bs)</span>
                      <span className="text-[10px] text-slate-400">Total mes en gaveta Bs</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-blue-700">
                    Bs {monthlySummary.cashVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Pago Móvil Recibido</span>
                      <span className="text-[10px] text-slate-400">Total transferencias banco</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-indigo-700">
                    Bs {monthlySummary.pagoMovilVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Punto de Venta</span>
                      <span className="text-[10px] text-slate-400">Lote bancario acumulado</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-amber-700">
                    Bs {monthlySummary.puntoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Salud de Créditos y Fiados del Mes */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between mt-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Control de Cartera y Fiados del Mes</span>
                    <span className="text-[10px] text-slate-500">
                      Otorgado: ${monthlySummary.creditIssuedUSD.toFixed(2)} • Recuperado: ${monthlySummary.creditCollectedUSD.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">Tasa de Cobranza:</span>
                  <span className="text-sm font-black text-emerald-600">
                    {monthlySummary.collectionRatePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Dos Columnas: Gastos del Mes y Valoración del Inventario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Desglose de Gastos del Mes */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                  <MinusCircle className="w-4 h-4 text-rose-600" />
                  <span>Gastos del Mes por Categoría</span>
                </h4>

                {monthlySummary.expensesUSD === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No se han registrado salidas de dinero este mes.</p>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {Object.entries(monthlySummary.expensesByCategory).map(([catKey, amount]) => {
                      const meta = categoryMeta[catKey] || categoryMeta.otro;
                      const percent = Math.round((amount / (monthlySummary.expensesUSD || 1)) * 100);

                      return (
                        <div key={catKey} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                              <span>{meta.icon}</span>
                              <span>{meta.label}</span>
                            </span>
                            <span className="font-black text-rose-600">
                              -${amount.toFixed(2)} <span className="text-[10px] text-slate-400 font-semibold">({percent}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Inventario y Rentabilidad de Mercancía */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Valoración y Rendimiento del Inventario</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Salud patrimonial y costo de reposición del negocio.
                  </p>

                  <div className="space-y-3 pt-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Valor Stock en Bodega
                        </span>
                        <span className="text-base font-black text-slate-900">
                          ${inventoryValuationUSD.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">A costo de reposición</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Costo Mercancía Vendida
                        </span>
                        <span className="text-base font-black text-slate-900">
                          ${monthlySummary.totalCostUSD.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Costo de artículos</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          Utilidad Bruta de Mercancía
                        </span>
                        <span className="text-base font-black text-emerald-700">
                          +${monthlySummary.grossProfitUSD.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold">Antes de gastos</span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          Mermas y Consumo del Mes
                        </span>
                        <span className="text-base font-black text-amber-700">
                          -${monthlyWastesCostUSD.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold">{monthlyWastes.length} salidas registradas</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 text-center">
                  Cifras calculadas automáticamente en tiempo real
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para registrar nuevo gasto desde informes */}
      {isExpenseModalOpen && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
        />
      )}

      {/* Modal de Confirmación para Reiniciar Cálculos */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-br from-rose-50 via-white to-amber-50 border-b border-rose-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    ¿Reiniciar Cálculos de la App?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Iniciar un nuevo ciclo contable desde este momento
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-slate-600">
              <p className="font-medium text-slate-700">
                Esta acción te permite poner en cero las métricas de venta y arqueo para comenzar a calcular desde cero cuando lo desees:
              </p>

              <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-2">
                <span className="font-black text-rose-900 uppercase tracking-wider text-[10px] block">
                  Se pondrá en cero ($0.00):
                </span>
                <ul className="space-y-1.5 text-slate-700 font-medium list-disc list-inside">
                  <li>Todos los cálculos del informe <strong>Diario, Semanal y Mensual</strong>.</li>
                  <li>Arqueo de caja (Efectivo $, Efectivo Bs, Pago Móvil y Punto de Venta).</li>
                  <li>El historial de gastos registrados de caja.</li>
                  <li>El historial de mermas y salidas de consumo del ciclo anterior.</li>
                  <li>Las deudas de las <strong>personas que deben fiado</strong> volverán a <strong>$0.00</strong>.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-emerald-900 font-black uppercase tracking-wider text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Totalmente Protegido (NO se borra):</span>
                </div>
                <ul className="space-y-1 text-emerald-800 font-medium list-disc list-inside">
                  <li><strong>Tu inventario:</strong> Todos los productos, existencias en stock, costos y precios quedan intactos.</li>
                  <li><strong>Fichas de clientes:</strong> Los nombres, teléfonos y datos de las personas registradas se conservan.</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sí, Reiniciar a Cero</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
