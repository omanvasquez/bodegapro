import React, { useState } from 'react';
import { X, DollarSign, Smartphone, Banknote, CreditCard, Check, MessageCircle, Star } from 'lucide-react';
import { Customer, PaymentSplit } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useCustomers } from '../../context/CustomersContext';
import { useAuth } from '../../context/AuthContext';
import { generateCreditPaymentWhatsApp, openWhatsAppLink } from '../../services/whatsapp';

interface PaymentModalProps {
  customer: Customer | null;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  customer,
  onClose,
  onPaymentSuccess,
}) => {
  const { effectiveRate, toVES, toUSD } = useCurrency();
  const { recordPayment } = useCustomers();
  const { tenant } = useAuth();

  const [usdCash, setUsdCash] = useState<string>('');
  const [vesCash, setVesCash] = useState<string>('');
  const [pagoMovil, setPagoMovil] = useState<string>('');
  const [puntoVenta, setPuntoVenta] = useState<string>('');
  const [saveSurplusAsCredit, setSaveSurplusAsCredit] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  if (!customer) return null;

  const valUsdCash = parseFloat(usdCash) || 0;
  const valVesCash = parseFloat(vesCash) || 0;
  const valPagoMovil = parseFloat(pagoMovil) || 0;
  const valPuntoVenta = parseFloat(puntoVenta) || 0;

  const totalAbonoUSD = Math.round((valUsdCash + toUSD(valVesCash) + toUSD(valPagoMovil) + toUSD(valPuntoVenta)) * 100) / 100;
  const totalAbonoVES = toVES(totalAbonoUSD);

  const fillExactDebt = () => {
    setUsdCash(customer.currentDebtUSD.toFixed(2));
    setVesCash('');
    setPagoMovil('');
    setPuntoVenta('');
  };

  const handleProcessPayment = () => {
    if (totalAbonoUSD <= 0) return;

    const payments: PaymentSplit[] = [];
    if (valUsdCash > 0) {
      payments.push({ method: 'usd_cash', amountUSD: valUsdCash, amountVES: toVES(valUsdCash) });
    }
    if (valVesCash > 0) {
      payments.push({ method: 'ves_cash', amountUSD: toUSD(valVesCash), amountVES: valVesCash });
    }
    if (valPagoMovil > 0) {
      payments.push({ method: 'pago_movil', amountUSD: toUSD(valPagoMovil), amountVES: valPagoMovil });
    }
    if (valPuntoVenta > 0) {
      payments.push({ method: 'punto_venta', amountUSD: toUSD(valPuntoVenta), amountVES: valPuntoVenta });
    }

    const res = recordPayment(
      customer.id,
      totalAbonoUSD,
      payments,
      tenant.ownerName,
      saveSurplusAsCredit,
      notes.trim() || undefined
    );

    if (res.success && res.customer) {
      // Prompt for WhatsApp receipt
      if (confirm('¿Deseas enviar el comprobante de abono al WhatsApp del cliente?')) {
        const text = generateCreditPaymentWhatsApp(
          res.customer,
          totalAbonoUSD,
          totalAbonoVES,
          tenant.name
        );
        openWhatsAppLink(res.customer.phone, text);
      }
      onPaymentSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-brand-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-brand-emerald-400 font-bold uppercase tracking-wider">
              Abonar a Deuda (Fiado)
            </span>
            <h3 className="text-lg font-black text-white">{customer.name}</h3>
            <p className="text-xs text-slate-300">
              Deuda Actual: <strong className="text-rose-400 font-black">${customer.currentDebtUSD.toFixed(2)}</strong> (Bs {toVES(customer.currentDebtUSD).toFixed(2)})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          
          <button
            type="button"
            onClick={fillExactDebt}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition flex items-center justify-center space-x-1"
          >
            <span>Pagar Deuda Total (${customer.currentDebtUSD.toFixed(2)})</span>
          </button>

          {/* Payment breakdown */}
          <div className="space-y-2.5">
            <label className="font-bold text-slate-800">Métodos con los que abona:</label>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 block">Efectivo USD ($)</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={usdCash}
                  onChange={(e) => setUsdCash(e.target.value)}
                  className="w-full font-black text-sm bg-transparent focus:outline-none"
                />
              </div>

              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 block">Efectivo Bs</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={vesCash}
                  onChange={(e) => setVesCash(e.target.value)}
                  className="w-full font-black text-sm bg-transparent focus:outline-none"
                />
              </div>

              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 block">Pago Móvil (Bs)</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={pagoMovil}
                  onChange={(e) => setPagoMovil(e.target.value)}
                  className="w-full font-black text-sm bg-transparent focus:outline-none"
                />
              </div>

              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 block">Punto de Venta (Bs)</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={puntoVenta}
                  onChange={(e) => setPuntoVenta(e.target.value)}
                  className="w-full font-black text-sm bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800">Nota / Referencia de pago:</label>
            <input
              type="text"
              placeholder="Ej. Pago móvil ref 1234..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-medium"
            />
          </div>

          {/* Summary */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Total a Abonar:</span>
              <span className="font-black text-slate-900 text-sm">
                ${totalAbonoUSD.toFixed(2)} (Bs {totalAbonoVES.toFixed(2)})
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Deuda Restante Proyectada:</span>
              <span className="font-bold text-rose-600">
                ${Math.max(0, customer.currentDebtUSD - totalAbonoUSD).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            disabled={totalAbonoUSD <= 0}
            onClick={handleProcessPayment}
            className={`px-5 py-2 rounded-xl font-black text-white shadow-md transition flex items-center space-x-1.5 ${
              totalAbonoUSD > 0
                ? 'bg-brand-emerald-600 hover:bg-brand-emerald-700'
                : 'bg-slate-300 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Registrar Abono</span>
          </button>
        </div>
      </div>
    </div>
  );
};
