import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  DollarSign, 
  Phone, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  Star,
  Pencil,
  Trash2
} from 'lucide-react';
import { Customer } from '../../types';
import { useCustomers } from '../../context/CustomersContext';
import { useCurrency } from '../../context/CurrencyContext';
import { PaymentModal } from './PaymentModal';
import { CustomerDetailsModal } from './CustomerDetailsModal';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { toVES } = useCurrency();

  const [search, setSearch] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );
  const [customerForPayment, setCustomerForPayment] = useState<Customer | null>(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);

  // Edit customer state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editLimit, setEditLimit] = useState<string>('30');

  // Delete customer state
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // New customer form state
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newLimit, setNewLimit] = useState<string>('30');

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );
  }, [customers, search]);

  const totalStreetDebtUSD = useMemo(() => {
    return Math.round(customers.reduce((acc, c) => acc + c.currentDebtUSD, 0) * 100) / 100;
  }, [customers]);

  const totalStreetDebtVES = toVES(totalStreetDebtUSD);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addCustomer(newName.trim(), newPhone.trim(), parseFloat(newLimit) || 30);
    setNewName('');
    setNewPhone('');
    setNewLimit('30');
    setIsNewCustomerModalOpen(false);
  };

  const handleStartEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditLimit(customer.creditLimitUSD.toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editName.trim()) return;
    updateCustomer(editingCustomer.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      creditLimitUSD: parseFloat(editLimit) || 0,
    });
    setEditingCustomer(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingCustomer) return;
    deleteCustomer(deletingCustomer.id);
    if (selectedCustomerId === deletingCustomer.id) {
      setSelectedCustomerId(null);
    }
    setDeletingCustomer(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden pb-16 md:pb-0">
      
      {/* Action Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Control de Clientes y Fiados</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
              {customers.length} clientes
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Micro-ledger con deuda congelada en USD y registro de abonos en tiempo real.
          </p>
        </div>

        <button
          onClick={() => setIsNewCustomerModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Cliente</span>
        </button>
      </div>

      {/* Street Debt Summary Banner */}
      <div className="p-4 bg-white border-b border-slate-200 shrink-0">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 font-black" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                Total Deuda en la Calle (Por Cobrar)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-rose-600">
                  ${totalStreetDebtUSD.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-rose-500">
                  / Bs {totalStreetDebtVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 sm:text-right">
            Deuda protegida de la devaluación. Cada fiado se fija en USD al momento de la venta.
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-4 bg-white border-b border-slate-200 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o número telefónico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald-500"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCustomers.map((customer) => {
            const hasDebt = customer.currentDebtUSD > 0;
            const hasPositive = customer.positiveBalanceUSD > 0;
            const debtVES = toVES(customer.currentDebtUSD);

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-brand-emerald-500 hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="pr-2">
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {customer.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{customer.phone || 'Sin teléfono'}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          hasDebt ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {hasDebt ? 'Con Deuda' : 'Al Día'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(customer);
                        }}
                        title="Editar datos del cliente"
                        className="p-1 text-slate-400 hover:text-brand-emerald-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingCustomer(customer);
                        }}
                        title="Eliminar cliente"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Balance details */}
                  <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Deuda en USD:</span>
                      <span className="text-base font-black text-rose-600">
                        ${customer.currentDebtUSD.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Bs {debtVES.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">Saldo a Favor:</span>
                      <span className="text-base font-black text-brand-emerald-600">
                        ${customer.positiveBalanceUSD.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Límite: ${customer.creditLimitUSD}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center justify-center space-x-1"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Historial</span>
                  </button>

                  <button
                    onClick={() => setCustomerForPayment(customer)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white text-xs font-bold transition flex items-center justify-center space-x-1 shadow-sm"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Abonar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomerId(null)}
          onOpenPayment={() => setCustomerForPayment(selectedCustomer)}
          onDeleteCustomer={() => setSelectedCustomerId(null)}
        />
      )}

      {/* Payment (Abono) Modal */}
      {customerForPayment && (
        <PaymentModal
          customer={customerForPayment}
          onClose={() => setCustomerForPayment(null)}
          onPaymentSuccess={() => {
            // refresh
          }}
        />
      )}

      {/* New Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Nuevo Cliente para Fiado</h3>
            
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carmen Silva (Vecina)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="04121234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Límite Máximo de Crédito ($ USD)</label>
                <input
                  type="number"
                  placeholder="30.00"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
                <span className="text-[10px] text-slate-400">
                  Bloquea automáticamente nuevas ventas a crédito si supera este tope.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="py-2 rounded-xl border border-slate-300 font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-brand-emerald-600 text-white font-bold hover:bg-brand-emerald-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Editar Cliente</h3>
            
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-brand-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="04121234567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-brand-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Límite Máximo de Crédito ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-brand-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Bloquea automáticamente nuevas ventas a crédito si supera este tope.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-brand-emerald-600 text-white font-bold hover:bg-brand-emerald-700 transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">¿Eliminar Cliente?</h3>
                <p className="text-xs text-slate-600 mt-1">
                  ¿Estás seguro de eliminar a <strong>{deletingCustomer.name}</strong>?
                </p>
              </div>
            </div>

            {deletingCustomer.currentDebtUSD > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                ⚠️ <strong>Atención:</strong> Este cliente tiene una deuda pendiente de <strong>${deletingCustomer.currentDebtUSD.toFixed(2)} (Bs {toVES(deletingCustomer.currentDebtUSD).toFixed(2)})</strong>. Al eliminarlo, ya no figurará en la lista de fiados activos.
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              ℹ️ Tus reportes históricos de ventas e ingresos mensuales <strong>no se descuadran</strong> ni se alteran (los tickets pasados son inmutables).
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition shadow-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
