import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Banknote, 
  Smartphone, 
  CreditCard, 
  Fuel, 
  UserCheck, 
  Truck, 
  Zap, 
  Package, 
  Wrench, 
  HelpCircle,
  Plus
} from 'lucide-react';
import { ExpenseCategory } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useExpenses } from '../../context/ExpensesContext';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded?: () => void;
}

const CATEGORIES: { id: ExpenseCategory; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
  { id: 'gasolina', label: 'Gasolina / Planta', icon: Fuel, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'personal', label: 'Personal / Sueldo', icon: UserCheck, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'proveedor', label: 'Pago a Proveedor', icon: Truck, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'servicios', label: 'Servicios (Luz/Net)', icon: Zap, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'suministros', label: 'Bolsas / Hielo', icon: Package, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench, color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'otro', label: 'Otro Imprevisto', icon: HelpCircle, color: 'bg-slate-100 text-slate-800 border-slate-300' },
];

const SUGGESTIONS = [
  'Gasolina para planta eléctrica',
  'Pago jornal de ayudante',
  'Compra de bolsas plásticas',
  'Bolsa de hielo',
  'Pago a camión de mercancía',
  'Recarga saldo / internet',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onExpenseAdded }) => {
  const { effectiveRate, toVES, toUSD } = useCurrency();
  const { addExpense } = useExpenses();

  const [category, setCategory] = useState<ExpenseCategory>('gasolina');
  const [description, setDescription] = useState<string>('');
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'VES'>('USD');
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'usd_cash' | 'ves_cash' | 'pago_movil' | 'punto_venta'>('usd_cash');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const rawAmount = parseFloat(amountInput) || 0;
  const amountUSD = currencyMode === 'USD' ? rawAmount : toUSD(rawAmount);
  const amountVES = currencyMode === 'VES' ? rawAmount : toVES(rawAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || rawAmount <= 0) {
      alert('Por favor indica la descripción y un monto válido.');
      return;
    }

    addExpense({
      description: description.trim(),
      category,
      amountUSD,
      amountVES,
      paymentMethod,
      registeredBy: 'Caja',
      notes: notes.trim() || undefined,
    });

    if (onExpenseAdded) onExpenseAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-brand-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Plus className="w-5 h-5 rotate-45" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">Registrar Salida de Dinero</h3>
              <p className="text-[11px] text-slate-400">Gasto operativo para cuadrar la caja física</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-800">
          
          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Categoría del Gasto:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (!description) {
                        if (cat.id === 'gasolina') setDescription('Gasolina para planta eléctrica');
                        if (cat.id === 'suministros') setDescription('Compra de bolsas plásticas');
                        if (cat.id === 'personal') setDescription('Pago de jornada de ayudante');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition ${
                      isSelected
                        ? `${cat.color} font-black ring-2 ring-brand-emerald-500 shadow-xs`
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700 font-semibold'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Descripción / Motivo:
            </label>
            <input
              type="text"
              required
              placeholder="Ej: 10 litros de gasolina para la planta"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-emerald-500 bg-slate-50/50"
            />
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDescription(sug)}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Amount and Currency */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Monto del Gasto:
              </label>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCurrencyMode('USD')}
                  className={`px-2 py-0.5 rounded ${currencyMode === 'USD' ? 'bg-brand-slate-900 text-white' : 'text-slate-600'}`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyMode('VES')}
                  className={`px-2 py-0.5 rounded ${currencyMode === 'VES' ? 'bg-brand-slate-900 text-white' : 'text-slate-600'}`}
                >
                  Bs VES
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-black text-slate-400">
                {currencyMode === 'USD' ? '$' : 'Bs'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-lg font-black focus:outline-none focus:ring-2 focus:ring-brand-emerald-500 bg-slate-50/50"
              />
            </div>

            {/* Equivalent preview */}
            {rawAmount > 0 && (
              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>Equivalente aproximado:</span>
                <span className="font-bold text-brand-emerald-700">
                  {currencyMode === 'USD' 
                    ? `Bs ${amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` 
                    : `$${amountUSD.toFixed(2)} USD`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Payment Method / De dónde salió la plata */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              ¿De dónde salió el dinero? (Método de Pago):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('usd_cash')}
                className={`p-3 rounded-xl border flex items-center space-x-2.5 text-left transition ${
                  paymentMethod === 'usd_cash'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500 text-emerald-900'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block">Efectivo en $</span>
                  <span className="text-[10px] text-slate-400">Resta de gaveta $</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ves_cash')}
                className={`p-3 rounded-xl border flex items-center space-x-2.5 text-left transition ${
                  paymentMethod === 'ves_cash'
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500 text-blue-900'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block">Efectivo en Bs</span>
                  <span className="text-[10px] text-slate-400">Resta de gaveta Bs</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('pago_movil')}
                className={`p-3 rounded-xl border flex items-center space-x-2.5 text-left transition ${
                  paymentMethod === 'pago_movil'
                    ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500 text-indigo-900'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block">Pago Móvil</span>
                  <span className="text-[10px] text-slate-400">Transferencia banco</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('punto_venta')}
                className={`p-3 rounded-xl border flex items-center space-x-2.5 text-left transition ${
                  paymentMethod === 'punto_venta'
                    ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500 text-amber-900'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block">Tarjeta / Punto</span>
                  <span className="text-[10px] text-slate-400">Débito del negocio</span>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition shadow-md flex items-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4 rotate-45" />
              <span>Registrar Salida de Dinero</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
