import { Product, Customer, SaleTicket, CreditTransaction, InventoryWaste, Supplier, Tenant, Expense } from '../types';

const INITIAL_TENANT: Tenant = {
  id: 'tenant_cojedes_01',
  name: 'Bodega y Víveres Don Pedro',
  ownerName: 'Oman Vásquez',
  ownerEmail: 'omanjrvasquez@gmail.com',
  phone: '04124169949',
  status: 'activo',
  trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
  createdAt: Date.now(),
  defaultWhatsAppMsg: 'Gracias por su compra en Bodega Don Pedro',
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    tenantId: 'tenant_cojedes_01',
    name: 'Harina PAN 1kg',
    category: 'Víveres',
    pricingMode: 'USD',
    priceUSD: 1.20,
    priceVES: 0,
    costUSD: 0.95,
    stock: 48,
    unit: 'unidad',
    isBulkPack: true,
    packUnits: 20,
    packCostUSD: 19.00,
    barcode: '759101112001',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_2',
    tenantId: 'tenant_cojedes_01',
    name: 'Arroz Mary Tradicional 1kg',
    category: 'Víveres',
    pricingMode: 'USD',
    priceUSD: 1.35,
    priceVES: 0,
    costUSD: 1.05,
    stock: 35,
    unit: 'unidad',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_3',
    tenantId: 'tenant_cojedes_01',
    name: 'Pasta Primor Larga 1kg',
    category: 'Víveres',
    pricingMode: 'USD',
    priceUSD: 1.45,
    priceVES: 0,
    costUSD: 1.15,
    stock: 28,
    unit: 'unidad',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_4',
    tenantId: 'tenant_cojedes_01',
    name: 'Queso Blanco Llanero',
    category: 'Charcutería',
    pricingMode: 'USD',
    priceUSD: 5.50,
    priceVES: 0,
    costUSD: 4.20,
    stock: 12.5, // 12.5 kg en nevera
    unit: 'kg',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_5',
    tenantId: 'tenant_cojedes_01',
    name: 'Café Fama de América 250g',
    category: 'Víveres',
    pricingMode: 'USD',
    priceUSD: 2.30,
    priceVES: 0,
    costUSD: 1.85,
    stock: 15,
    unit: 'paquete',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_6',
    tenantId: 'tenant_cojedes_01',
    name: 'Malta Polar 250ml',
    category: 'Bebidas',
    pricingMode: 'USD',
    priceUSD: 0.85,
    priceVES: 0,
    costUSD: 0.62,
    stock: 54,
    unit: 'unidad',
    isBulkPack: true,
    packUnits: 24,
    packCostUSD: 14.88,
    updatedAt: Date.now(),
  },
  {
    id: 'prod_7',
    tenantId: 'tenant_cojedes_01',
    name: 'Chuchería Pirulín Mini',
    category: 'Chucherías',
    pricingMode: 'VES', // Modo Bs fijo
    priceUSD: 0,
    priceVES: 35.00,
    costUSD: 0.35,
    stock: 40,
    unit: 'unidad',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_8',
    tenantId: 'tenant_cojedes_01',
    name: 'Caramelos Surtidos (Unidad)',
    category: 'Chucherías',
    pricingMode: 'VES', // Modo Bs fijo
    priceUSD: 0,
    priceVES: 5.00,
    costUSD: 0.04,
    stock: 120,
    unit: 'unidad',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_9',
    tenantId: 'tenant_cojedes_01',
    name: 'Aceite Mazeite 1L',
    category: 'Víveres',
    pricingMode: 'USD',
    priceUSD: 2.80,
    priceVES: 0,
    costUSD: 2.25,
    stock: 18,
    unit: 'unidad',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_10',
    tenantId: 'tenant_cojedes_01',
    name: 'Detergente Las Llaves 500g',
    category: 'Limpieza',
    pricingMode: 'USD',
    priceUSD: 1.10,
    priceVES: 0,
    costUSD: 0.82,
    stock: 22,
    unit: 'paquete',
    updatedAt: Date.now(),
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    tenantId: 'tenant_cojedes_01',
    name: 'Carlos Mendoza (Vecino Casa 12)',
    phone: '04121234567',
    creditLimitUSD: 25.00,
    currentDebtUSD: 12.50,
    positiveBalanceUSD: 0,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'cust_2',
    tenantId: 'tenant_cojedes_01',
    name: 'Doña Carmen Silva (La Maestra)',
    phone: '04147654321',
    creditLimitUSD: 40.00,
    currentDebtUSD: 18.20,
    positiveBalanceUSD: 1.50, // Saldo a favor de un vuelto anterior
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'cust_3',
    tenantId: 'tenant_cojedes_01',
    name: 'José Gregorio (Taller Mecánico)',
    phone: '04249876543',
    creditLimitUSD: 50.00,
    currentDebtUSD: 0.00,
    positiveBalanceUSD: 0,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    tenantId: 'tenant_cojedes_01',
    name: 'Distribuidora Alimentos Cojedes',
    phone: '04128889900',
    contactName: 'Marcos Pérez',
    notes: 'Despacho los martes. Crédito a 7 días.',
  },
  {
    id: 'sup_2',
    tenantId: 'tenant_cojedes_01',
    name: 'Lácteos Tinaco C.A.',
    phone: '04247776655',
    contactName: 'Don Emiro',
    notes: 'Queso y embutidos frescos.',
  },
];

export function getLocalData<T>(key: string, defaultData: T): T {
  try {
    const saved = localStorage.getItem(`bodegapro_${key}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error cargando data local', key, e);
  }
  return defaultData;
}

export function saveLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`bodegapro_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando data local', key, e);
  }
}

export const dbInit = {
  getTenant: (): Tenant => getLocalData<Tenant>('tenant', INITIAL_TENANT),
  saveTenant: (t: Tenant) => saveLocalData('tenant', t),

  getProducts: (): Product[] => getLocalData<Product[]>('products', INITIAL_PRODUCTS),
  saveProducts: (p: Product[]) => saveLocalData('products', p),

  getCustomers: (): Customer[] => getLocalData<Customer[]>('customers', INITIAL_CUSTOMERS),
  saveCustomers: (c: Customer[]) => saveLocalData('customers', c),

  getSales: (): SaleTicket[] => getLocalData<SaleTicket[]>('sales', []),
  saveSales: (s: SaleTicket[]) => saveLocalData('sales', s),

  getTransactions: (): CreditTransaction[] => getLocalData<CreditTransaction[]>('credit_tx', []),
  saveTransactions: (tx: CreditTransaction[]) => saveLocalData('credit_tx', tx),

  getWastes: (): InventoryWaste[] => getLocalData<InventoryWaste[]>('wastes', []),
  saveWastes: (w: InventoryWaste[]) => saveLocalData('wastes', w),

  getSuppliers: (): Supplier[] => getLocalData<Supplier[]>('suppliers', INITIAL_SUPPLIERS),
  saveSuppliers: (s: Supplier[]) => saveLocalData('suppliers', s),

  getExpenses: (): Expense[] => getLocalData<Expense[]>('expenses', []),
  saveExpenses: (e: Expense[]) => saveLocalData('expenses', e),
};
