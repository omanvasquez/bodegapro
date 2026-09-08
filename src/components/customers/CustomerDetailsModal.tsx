import React from 'react';
import { X, User, Phone, DollarSign, Calendar, ArrowUpRight, ArrowDownLeft, MessageCircle } from 'lucide-react';
import { Customer } from '../../types';
import { useCustomers } from '../../context/CustomersContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { generateCreditChargeWhatsApp, openWhatsAppLink } from '../../services/whatsapp';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  onClose: () => void;
  onOpenPayment: () => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  onClose,
  onOpenPayment,
}) => {
  const { getCustomerTransactions } = useCustomers();
  const { toVES, effectiveRate } = useCurrency();
  const { tenant } = useAuth();

  if (!customer) return null;

  const history = getCustomerTransactions(customer.id);

  const handleSendReminder = () => {
    const text = generateCreditChargeWhatsApp(
      customer,
      0,
      0,
      tenant.name,
      effectiveRate
    );
    openWhatsAppLink(customer.phone, text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-brand-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{customer.name}</h3>
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <Phone className="w-3 h-3" />
                <span>{customer.phone || 'Sin teléfono'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Debt & Balance Cards */}
        <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50 border-b border-slate-200">
          <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-sm">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
              Deuda Pendiente (USD)
            </span>
            <span className="text-xl font-black text-rose-600 block">
              ${customer.currentDebtUSD.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              Bs {toVES(customer.currentDebtUSD).toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Saldo a Favor
              </span>
              <span className="text-xl font-black text-brand-emerald-600 block">
                ${customer.positiveBalanceUSD.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Límite: ${customer.creditLimitUSD.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
          {customer.currentDebtUSD > 0 && (
            <button
              onClick={handleSendReminder}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recordar por WhatsApp</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenPayment();
            }}
            className="flex-1 py-2 px-3 bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-sm transition"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Registrar Abono</span>
          </button>
        </div>

        {/* Immutable History List (Micro-ledger) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Historial Inmutable de Movimientos
          </h4>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No hay movimientos registrados.</p>
          ) : (
            history.map((tx) => {
              const isCargo = tx.type === 'cargo';
              const dateStr = new Date(tx.timestamp).toLocaleString('es-VE', {
                dateStyle: 'short',
                timeStyle: 'short',
              });

              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCargo ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isCargo ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">
                        {isCargo ? 'Fiado (Cargo a cuenta)' : 'Abono recibido'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {dateStr} • {tx.notes || ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-xs block ${
                        isCargo ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isCargo ? '+' : '-'}${tx.amountUSD.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Bs {tx.amountVES.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
