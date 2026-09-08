import React, { useState, useMemo } from 'react';
import { 
  X, 
  DollarSign, 
  Smartphone, 
  CreditCard, 
  BookOpen, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  MessageCircle, 
  Star 
} from 'lucide-react';
import { PaymentMethod, PaymentSplit, SaleTicket, Customer } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useCustomers } from '../../context/CustomersContext';
import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import { generateSaleTicketWhatsApp, openWhatsAppLink } from '../../services/whatsapp';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  totalUSD: number;
  totalVES: number;
  onSaleCompleted: (ticket: SaleTicket) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalUSD,
  totalVES,
  onSaleCompleted,
}) => {
  const { effectiveRate, toVES, toUSD } = useCurrency();
  const { customers, addCustomer } = useCustomers();
  const { recordSale } = useReports();
  const { tenant } = useAuth();

  // Payment inputs
  const [usdCash, setUsdCash] = useState<string>('');
  const [vesCash, setVesCash] = useState<string>('');
  const [pagoMovil, setPagoMovil] = useState<string>('');
  const [puntoVenta, setPuntoVenta] = useState<string>('');
  const [fiadoUSD, setFiadoUSD] = useState<string>('');

  // Selected customer for credit or saldo a favor
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showNewCustomer, setShowNewCustomer] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  // Decision on surplus change
  const [saveSurplusAsCredit, setSaveSurplusAsCredit] = useState<boolean>(true);

  // Completed state
  const [completedTicket, setCompletedTicket] = useState<SaleTicket | null>(null);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Parse entered numbers
  const valUsdCash = parseFloat(usdCash) || 0;
  const valVesCash = parseFloat(vesCash) || 0;
  const valPagoMovil = parseFloat(pagoMovil) || 0;
  const valPuntoVenta = parseFloat(puntoVenta) || 0;
  const valFiadoUSD = parseFloat(fiadoUSD) || 0;

  // Convert Bs inputs to USD to evaluate remaining total
  const totalPaidInUSD = useMemo(() => {
    const fromVesCash = toUSD(valVesCash);
    const fromPagoMovil = toUSD(valPagoMovil);
    const fromPunto = toUSD(valPuntoVenta);
    return Math.round((valUsdCash + fromVesCash + fromPagoMovil + fromPunto + valFiadoUSD) * 100) / 100;
  }, [valUsdCash, valVesCash, valPagoMovil, valPuntoVenta, valFiadoUSD, toUSD]);

  const remainingUSD = Math.round((totalUSD - totalPaidInUSD) * 100) / 100;
  const remainingVES = toVES(Math.max(0, remainingUSD));
  const isPaidInFull = remainingUSD <= 0;
  const changeUSD = remainingUSD < 0 ? Math.abs(remainingUSD) : 0;
  const changeVES = toVES(changeUSD);

  // Fast payment shortcuts
  const fillExactUSD = () => {
    setUsdCash(totalUSD.toFixed(2));
    setVesCash('');
    setPagoMovil('');
    setPuntoVenta('');
    setFiadoUSD('');
  };

  const fillExactPagoMovil = () => {
    setPagoMovil(totalVES.toFixed(2));
    setUsdCash('');
    setVesCash('');
    setPuntoVenta('');
    setFiadoUSD('');
  };

  const fillExactFiado = () => {
    setFiadoUSD(totalUSD.toFixed(2));
    setUsdCash('');
    setVesCash('');
    setPagoMovil('');
    setPuntoVenta('');
  };

  const handleCreateNewCustomer = () => {
    if (newCustName.trim()) {
      const created = addCustomer(newCustName.trim(), newCustPhone.trim(), 30);
      setSelectedCustomerId(created.id);
      setShowNewCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
    }
  };

  const handleProcessSale = () => {
    if (!isPaidInFull) return;

    // Check if fiado requires a customer
    if (valFiadoUSD > 0 && !selectedCustomerId) {
      alert('Debes seleccionar o crear un cliente para registrar una venta fiada.');
      return;
    }

    // Build payment split
    const payments: PaymentSplit[] = [];
    if (valUsdCash > 0) {
      payments.push({
        method: 'usd_cash',
        amountUSD: valUsdCash,
        amountVES: toVES(valUsdCash),
      });
    }
    if (valVesCash > 0) {
      payments.push({
        method: 'ves_cash',
        amountUSD: toUSD(valVesCash),
        amountVES: valVesCash,
      });
    }
    if (valPagoMovil > 0) {
      payments.push({
        method: 'pago_movil',
        amountUSD: toUSD(valPagoMovil),
        amountVES: valPagoMovil,
      });
    }
    if (valPuntoVenta > 0) {
      payments.push({
        method: 'punto_venta',
        amountUSD: toUSD(valPuntoVenta),
        amountVES: valPuntoVenta,
      });
    }
    if (valFiadoUSD > 0) {
      payments.push({
        method: 'fiado',
        amountUSD: valFiadoUSD,
        amountVES: toVES(valFiadoUSD),
      });
    }

    const ticket = recordSale({
      items: cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        finalPriceUSD: item.finalPriceUSD,
        finalPriceVES: item.finalPriceVES,
      })),
      payments,
      changeGivenUSD: !saveSurplusAsCredit ? changeUSD : 0,
      changeGivenVES: !saveSurplusAsCredit ? changeVES : 0,
      changeCreditedUSD: saveSurplusAsCredit && selectedCustomerId ? changeUSD : 0,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer ? selectedCustomer.name : undefined,
      cashierName: tenant.ownerName || 'Cajero',
    });

    setCompletedTicket(ticket);
    onSaleCompleted(ticket);
  };

  const handleSendWhatsApp = () => {
    if (!completedTicket) return;
    const text = generateSaleTicketWhatsApp(completedTicket, tenant.name);
    const phone = selectedCustomer ? selectedCustomer.phone : '';
    openWhatsAppLink(phone, text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-brand-emerald-400 font-bold uppercase tracking-wider">
              Cobro y Métodos de Pago
            </span>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-2xl font-black tracking-tight text-white">
                ${totalUSD.toFixed(2)}
              </h2>
              <span className="text-sm font-semibold text-slate-300">
                / Bs {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!completedTicket ? (
          <div className="p-5 overflow-y-auto space-y-4 text-slate-800">
            
            {/* Quick action pill buttons */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              <button
                onClick={fillExactUSD}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition whitespace-nowrap flex items-center space-x-1"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exacto en USD</span>
              </button>
              <button
                onClick={fillExactPagoMovil}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition whitespace-nowrap flex items-center space-x-1"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Exacto Pago Móvil</span>
              </button>
              <button
                onClick={fillExactFiado}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition whitespace-nowrap flex items-center space-x-1"
              >
                <BookOpen className="w-3.5 h-3.5 text-rose-600" />
                <span>Todo Fiado</span>
              </button>
            </div>

            {/* Payment Fields (Universal Multi-payment) */}
            <div className="space-y-3">
              
              {/* USD Cash */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-brand-emerald-500 focus-within:bg-white transition">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Efectivo USD ($)</span>
                    <span className="text-[10px] text-slate-400">Billetes en mano</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={usdCash}
                    onChange={(e) => setUsdCash(e.target.value)}
                    className="w-28 text-right font-bold text-base px-2 py-1 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Bs Cash */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-brand-emerald-500 focus-within:bg-white transition">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Efectivo Bolívares (Bs)</span>
                    <span className="text-[10px] text-slate-400">Sencillo en caja</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold text-slate-400">Bs</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={vesCash}
                    onChange={(e) => setVesCash(e.target.value)}
                    className="w-28 text-right font-bold text-base px-2 py-1 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Pago Móvil */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-brand-emerald-500 focus-within:bg-white transition">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Pago Móvil (Bs)</span>
                    <span className="text-[10px] text-slate-400">Transferencia bancaria</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold text-slate-400">Bs</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={pagoMovil}
                    onChange={(e) => setPagoMovil(e.target.value)}
                    className="w-28 text-right font-bold text-base px-2 py-1 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Punto de Venta */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-brand-emerald-500 focus-within:bg-white transition">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Punto de Venta (Bs)</span>
                    <span className="text-[10px] text-slate-400">Tarjeta de débito</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold text-slate-400">Bs</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={puntoVenta}
                    onChange={(e) => setPuntoVenta(e.target.value)}
                    className="w-28 text-right font-bold text-base px-2 py-1 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Fiado (Crédito) */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-rose-50/30 focus-within:border-rose-500 focus-within:bg-white transition">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Fiado / Crédito ($)</span>
                    <span className="text-[10px] text-rose-500 font-semibold">Congelado en USD</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={fiadoUSD}
                    onChange={(e) => setFiadoUSD(e.target.value)}
                    className="w-28 text-right font-bold text-base px-2 py-1 bg-transparent focus:outline-none text-rose-600"
                  />
                </div>
              </div>
            </div>

            {/* Customer selection (required for fiado or saldo a favor) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Cliente (Opcional o para fiado):
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(!showNewCustomer)}
                  className="text-xs text-brand-emerald-600 font-bold flex items-center space-x-1 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showNewCustomer ? 'Seleccionar existente' : '+ Nuevo cliente'}</span>
                </button>
              </div>

              {!showNewCustomer ? (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-500"
                >
                  <option value="">-- Cliente Mostrador (General) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentDebtUSD > 0 ? `(Deuda: $${c.currentDebtUSD.toFixed(2)})` : ''}
                      {c.positiveBalanceUSD > 0 ? ` [Saldo a favor: $${c.positiveBalanceUSD.toFixed(2)}]` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="tel"
                      placeholder="Teléfono (WhatsApp ej: 04121234567)"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewCustomer}
                      className="px-3 py-1.5 bg-brand-slate-900 text-white text-xs font-bold rounded-xl"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Balance and Change Calculation Banner */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total a Pagar:</span>
                <span className="font-bold text-slate-800">${totalUSD.toFixed(2)} (Bs {totalVES.toFixed(2)})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Ingresado:</span>
                <span className="font-bold text-slate-900">${totalPaidInUSD.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                {remainingUSD > 0 ? (
                  <>
                    <span className="text-xs font-bold text-rose-600 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Falta por cobrar:</span>
                    </span>
                    <span className="text-base font-black text-rose-600">
                      ${remainingUSD.toFixed(2)} <span className="text-xs">/ Bs {remainingVES.toFixed(2)}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pago Completo {changeUSD > 0 ? `(Vuelto: $${changeUSD.toFixed(2)} / Bs ${changeVES.toFixed(2)})` : ''}</span>
                      </span>
                      {changeUSD > 0 && selectedCustomerId && (
                        <label className="flex items-center space-x-2 text-[11px] text-slate-600 cursor-pointer pt-0.5">
                          <input
                            type="checkbox"
                            checked={saveSurplusAsCredit}
                            onChange={(e) => setSaveSurplusAsCredit(e.target.checked)}
                            className="rounded text-brand-emerald-600"
                          />
                          <span className="flex items-center space-x-1 font-semibold text-emerald-800">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                            <span>Acreditar vuelto ($) como saldo a favor del cliente</span>
                          </span>
                        </label>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Sale Success Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Venta Procesada Exitosamente
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                Ticket #{completedTicket.ticketNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total: ${completedTicket.totalUSD.toFixed(2)} • Bs {completedTicket.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 text-left">
              <p><strong>Artículos:</strong> {completedTicket.items.length} productos registrados.</p>
              <p><strong>Ganancia neta calculada:</strong> ${completedTicket.netProfitUSD.toFixed(2)}</p>
              <p><strong>Tasa inmutable:</strong> Bs {completedTicket.exchangeRateSnapshot.appliedRate.toFixed(2)}</p>
            </div>

            {/* WhatsApp Receipt Button */}
            <button
              onClick={handleSendWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Enviar Recibo por WhatsApp</span>
            </button>
          </div>
        )}

        {/* Footer actions */}
        <div className="bg-slate-100/90 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          {!completedTicket ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                disabled={!isPaidInFull}
                onClick={handleProcessSale}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition ${
                  isPaidInFull
                    ? 'bg-brand-emerald-600 text-white hover:bg-brand-emerald-700'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Completar Venta
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-brand-slate-900 text-white text-sm font-bold rounded-xl hover:bg-brand-slate-800 transition"
            >
              Nueva Venta
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
