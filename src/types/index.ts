export type TenantStatus = 'pendiente' | 'trial' | 'activo' | 'inactivo';

export interface Tenant {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  status: TenantStatus;
  trialEndsAt: number;
  createdAt: number;
  defaultWhatsAppMsg?: string;
}

export type PricingMode = 'USD' | 'VES';
export type ProductUnit = 'unidad' | 'kg' | 'g' | 'litro' | 'paquete';

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  pricingMode: PricingMode;
  priceUSD: number;
  priceVES: number;
  costUSD: number; // Último costo de reposición
  stock: number;   // Admite decimales (ej. 0.25 kg)
  unit: ProductUnit;
  isBulkPack?: boolean;
  packUnits?: number;      // Cantidad de unidades por bulto
  packCostUSD?: number;    // Costo del bulto entero
  barcode?: string;
  updatedAt: number;
}

export interface CartItem {
  product: Product;
  quantity: number; // Admite decimales (ej. 0.500)
  originalPriceUSD: number;
  originalPriceVES: number;
  finalPriceUSD: number; // Permite ajuste al vuelo
  finalPriceVES: number;
  isOverridden: boolean;
}

export type PaymentMethod = 'usd_cash' | 'ves_cash' | 'pago_movil' | 'punto_venta' | 'fiado';

export interface PaymentSplit {
  method: PaymentMethod;
  amountUSD: number;
  amountVES: number;
  reference?: string;
}

export interface TicketItemSnapshot {
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  costUSDAtSale: number;   // Snapshot inmutable
  priceUSDAtSale: number;  // Snapshot inmutable
  priceVESAtSale: number;  // Snapshot inmutable
  totalUSD: number;
  totalVES: number;
}

export interface SaleTicket {
  id: string;
  tenantId: string;
  ticketNumber: number;
  timestamp: number;
  cashierName: string;
  items: TicketItemSnapshot[];
  totalUSD: number;
  totalVES: number;
  totalCostUSD: number;    // Para cálculo de ganancia real
  netProfitUSD: number;    // totalUSD - totalCostUSD
  exchangeRateSnapshot: {
    bcv: number;
    overrideActive: boolean;
    appliedRate: number;
  };
  payments: PaymentSplit[];
  changeGivenVES?: number;
  changeGivenUSD?: number;
  changeCreditedUSD?: number; // Vuelto guardado como saldo a favor
  customerId?: string;
  customerName?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  creditLimitUSD: number;
  currentDebtUSD: number;      // Toda deuda se lleva en USD
  positiveBalanceUSD: number;  // Saldo a favor (vueltos acreditados)
  createdAt: number;
  updatedAt: number;
}

export type CreditTransactionType = 'cargo' | 'abono';

export interface CreditTransaction {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  type: CreditTransactionType;
  amountUSD: number;
  amountVES: number;
  exchangeRate: number;
  timestamp: number;
  saleTicketId?: string;
  payments?: PaymentSplit[];
  notes?: string;
  cashierName: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  contactName?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  supplierName: string;
  timestamp: number;
  dueDate?: number; // Fecha promesa de pago
  status: 'pagado' | 'pendiente';
  totalUSD: number;
  notes?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitCostUSD: number;
    isBulto?: boolean;
    unitsPerBulto?: number;
  }[];
}

export type WasteReason = 'consumo_propio' | 'danado' | 'vencido' | 'otro';

export interface InventoryWaste {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  reason: WasteReason;
  costUSD: number;
  timestamp: number;
  notes?: string;
}

export type ExpenseCategory = 
  | 'gasolina'       // Combustible para planta eléctrica o transporte
  | 'personal'       // Pago diario o semanal a empleados, ayudantes
  | 'proveedor'      // Pago de facturas de mercancía o despacho
  | 'servicios'      // Luz, internet, agua, recargas
  | 'suministros'    // Bolsas plásticas, hielo, cinta, empaques
  | 'mantenimiento'  // Reparación de neveras, bombillos, etc.
  | 'otro';          // Otros gastos imprevistos

export interface Expense {
  id: string;
  tenantId: string;
  timestamp: number;
  description: string;
  category: ExpenseCategory;
  amountUSD: number;
  amountVES: number;
  paymentMethod: 'usd_cash' | 'ves_cash' | 'pago_movil' | 'punto_venta';
  registeredBy?: string;
  notes?: string;
}

export interface ExchangeRates {
  bcv: number;
  euro: number;
  usdt: number;
  lastUpdated: number;
  source: string;
  manualOverride: {
    active: boolean;
    rate: number;
  };
}
