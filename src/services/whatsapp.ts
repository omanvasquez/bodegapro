import { SaleTicket, Customer } from '../types';

export function sanitizePhone(phone: string): string {
  // Limpiar caracteres no numéricos
  let clean = phone.replace(/\D/g, '');
  // Si empieza con 0 (ej. 0412...), reemplazar por 58
  if (clean.startsWith('0')) {
    clean = '58' + clean.slice(1);
  } else if (!clean.startsWith('58') && clean.length === 10) {
    clean = '58' + clean;
  }
  return clean;
}

export function generateSaleTicketWhatsApp(ticket: SaleTicket, storeName: string): string {
  const dateStr = new Date(ticket.timestamp).toLocaleString('es-VE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const itemsList = ticket.items
    .map(
      (item) =>
        `• ${item.quantity} ${item.unit} x ${item.productName}: $${item.totalUSD.toFixed(2)} (Bs ${item.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`
    )
    .join('\n');

  const paymentDetails = ticket.payments
    .map((p) => {
      const labels: Record<string, string> = {
        usd_cash: '💵 Efectivo $',
        ves_cash: '💵 Efectivo Bs',
        pago_movil: '📱 Pago Móvil',
        punto_venta: '💳 Punto de Venta',
        fiado: '📝 Fiado (Crédito)',
      };
      return `  - ${labels[p.method] || p.method}: $${p.amountUSD.toFixed(2)} (Bs ${p.amountVES.toFixed(2)})`;
    })
    .join('\n');

  const text = `🏪 *${storeName}*
🧾 *Ticket #${ticket.ticketNumber}*
📅 Fecha: ${dateStr}
👤 Atendido por: ${ticket.cashierName}
💱 Tasa aplicada: Bs ${ticket.exchangeRateSnapshot.appliedRate.toFixed(2)}

🛒 *Detalle de compra:*
${itemsList}

💰 *TOTAL:* $${ticket.totalUSD.toFixed(2)} / *Bs ${ticket.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}*

💳 *Forma de pago:*
${paymentDetails}
${ticket.changeGivenVES ? `🔄 Vuelto entregado: Bs ${ticket.changeGivenVES.toFixed(2)}\n` : ''}${ticket.changeCreditedUSD ? `⭐ Vuelto a favor guardado: $${ticket.changeCreditedUSD.toFixed(2)}\n` : ''}
¡Muchas gracias por su compra! 🙏`;

  return encodeURIComponent(text);
}

export function generateCreditChargeWhatsApp(
  customer: Customer,
  chargeAmountUSD: number,
  chargeAmountVES: number,
  storeName: string,
  rate: number
): string {
  const text = `🏪 *${storeName}*
Hola *${customer.name}*, registramos un nuevo consumo a crédito:

➕ *Monto cargado:* $${chargeAmountUSD.toFixed(2)} (Aprox. Bs ${chargeAmountVES.toFixed(2)} a tasa Bs ${rate.toFixed(2)})
📊 *Saldo total adeudado:* *$${customer.currentDebtUSD.toFixed(2)}*
${customer.positiveBalanceUSD > 0 ? `⭐ Saldo a favor disponible: $${customer.positiveBalanceUSD.toFixed(2)}\n` : ''}
Gracias por su confianza. 🤝`;

  return encodeURIComponent(text);
}

export function generateCreditPaymentWhatsApp(
  customer: Customer,
  paidUSD: number,
  paidVES: number,
  storeName: string
): string {
  const text = `🏪 *${storeName}*
Hola *${customer.name}*, hemos registrado su abono con éxito:

✅ *Abono recibido:* $${paidUSD.toFixed(2)} (Bs ${paidVES.toFixed(2)})
📉 *Saldo restante pendiente:* *$${customer.currentDebtUSD.toFixed(2)}*
${customer.positiveBalanceUSD > 0 ? `⭐ Saldo a favor disponible: $${customer.positiveBalanceUSD.toFixed(2)}\n` : ''}
¡Gracias por mantener su cuenta al día! 🙏`;

  return encodeURIComponent(text);
}

export function generateDailyClosingWhatsApp(
  summary: {
    date: string;
    totalUSD: number;
    totalVES: number;
    grossProfitUSD?: number;
    netProfitUSD: number;
    expensesUSD?: number;
    expensesVES?: number;
    cashUSD: number;
    cashVES: number;
    pagoMovilVES: number;
    puntoVES: number;
    creditIssuedUSD: number;
    creditCollectedUSD: number;
  },
  storeName: string,
  productsSold?: { name: string; quantity: number; unit: string; totalUSD: number }[],
  expensesList?: { description: string; amountUSD: number; category: string }[],
  wastesList?: { productName: string; quantity: number; unit: string; costUSD: number; reason: string }[]
): string {
  let productsBlock = '';
  if (productsSold && productsSold.length > 0) {
    const list = productsSold
      .slice(0, 15) // Top 15 productos
      .map((p) => `• ${p.quantity} ${p.unit} × ${p.name} ($${p.totalUSD.toFixed(2)})`)
      .join('\n');
    productsBlock = `\n\n🛒 *Salida de Mercancía Hoy (${productsSold.length}):*\n${list}${productsSold.length > 15 ? '\n• ...y otros más' : ''}`;
  }

  let expensesBlock = '';
  if (expensesList && expensesList.length > 0) {
    const list = expensesList
      .map((e) => `• ${e.description}: -$${e.amountUSD.toFixed(2)}`)
      .join('\n');
    expensesBlock = `\n\n💸 *Salidas / Gastos de Caja (-$${(summary.expensesUSD || 0).toFixed(2)}):*\n${list}`;
  }

  let wastesBlock = '';
  if (wastesList && wastesList.length > 0) {
    const totalWasteCost = wastesList.reduce((acc, w) => acc + w.costUSD, 0);
    const list = wastesList
      .map((w) => `• ${w.quantity} ${w.unit} × ${w.productName} (-$${w.costUSD.toFixed(2)}) [${w.reason}]`)
      .join('\n');
    wastesBlock = `\n\n⚠️ *Mermas / Consumo Propio (-$${totalWasteCost.toFixed(2)}):*\n${list}`;
  }

  const text = `📊 *CIERRE DIARIO - ${storeName}*
📅 Fecha: ${summary.date}

💵 *Facturación Total:* $${summary.totalUSD.toFixed(2)} (Bs ${summary.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })})
${summary.expensesUSD ? `💸 *Total Gastos de Caja:* -$${summary.expensesUSD.toFixed(2)}\n` : ''}📈 *Ganancia Neta de Bolsillo:* $${summary.netProfitUSD.toFixed(2)}

📦 *Arqueo de Gaveta y Bancos (Dinero Real):*
- 💵 Efectivo $: $${summary.cashUSD.toFixed(2)}
- 💵 Efectivo Bs: Bs ${summary.cashVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
- 📱 Pago Móvil: Bs ${summary.pagoMovilVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
- 💳 Punto de Venta: Bs ${summary.puntoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}

📝 *Balance de Fiados:*
- Fiados concedidos hoy: $${summary.creditIssuedUSD.toFixed(2)}
- Abonos cobrados hoy: $${summary.creditCollectedUSD.toFixed(2)}${expensesBlock}${wastesBlock}${productsBlock}

Generado automáticamente por BodegaPro.`;

  return encodeURIComponent(text);
}

export function generateWeeklyReportWhatsApp(
  summary: {
    totalUSD: number;
    totalVES: number;
    grossProfitUSD: number;
    expensesUSD: number;
    netProfitUSD: number;
    profitMarginPercent: number;
    ticketsCount: number;
    averageTicketUSD: number;
    averageDailyUSD: number;
    cashUSD: number;
    cashVES: number;
    pagoMovilVES: number;
    puntoVES: number;
    creditIssuedUSD: number;
    creditCollectedUSD: number;
  },
  storeName: string
): string {
  const text = `📈 *REPORTE SEMANAL (7 DÍAS) - ${storeName}*
🗓️ Período: Últimos 7 días

💵 *Facturación 7 Días:* $${summary.totalUSD.toFixed(2)} (Bs ${summary.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })})
💸 *Gastos de Operación:* -$${summary.expensesUSD.toFixed(2)}
🏆 *Ganancia Neta Real:* +$${summary.netProfitUSD.toFixed(2)} (Margen: ${summary.profitMarginPercent.toFixed(1)}%)

📊 *Rendimiento y Promedios:*
• Venta diaria promedio: $${summary.averageDailyUSD.toFixed(2)} / día
• Total tickets cobrados: ${summary.ticketsCount} compras
• Ticket promedio: $${summary.averageTicketUSD.toFixed(2)} / cliente

📦 *Canales de Cobro de la Semana:*
• 💵 Efectivo $: $${summary.cashUSD.toFixed(2)}
• 💵 Efectivo Bs: Bs ${summary.cashVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
• 📱 Pago Móvil: Bs ${summary.pagoMovilVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
• 💳 Punto de Venta: Bs ${summary.puntoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}

📝 *Movimiento de Fiados de la Semana:*
• Fiados otorgados: $${summary.creditIssuedUSD.toFixed(2)}
• Abonos cobrados: $${summary.creditCollectedUSD.toFixed(2)}

Generado automáticamente por BodegaPro.`;

  return encodeURIComponent(text);
}

export function generateMonthlyReportWhatsApp(
  summary: {
    monthName: string;
    totalUSD: number;
    totalVES: number;
    grossProfitUSD: number;
    expensesUSD: number;
    netProfitUSD: number;
    profitMarginPercent: number;
    growthPercent: number;
    ticketsCount: number;
    averageTicketUSD: number;
    averageDailyUSD: number;
    cashUSD: number;
    cashVES: number;
    pagoMovilVES: number;
    puntoVES: number;
    creditIssuedUSD: number;
    creditCollectedUSD: number;
    collectionRatePercent: number;
  },
  storeName: string
): string {
  const text = `📊 *CIERRE FINANCIERO MENSUAL - ${storeName}*
🗓️ Mes: ${summary.monthName.toUpperCase()}
${summary.growthPercent !== 0 ? `🚀 Crecimiento vs mes anterior: ${summary.growthPercent > 0 ? '+' : ''}${summary.growthPercent}%\n` : ''}
💵 *Facturación Acumulada:* $${summary.totalUSD.toFixed(2)} (Bs ${summary.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })})
💸 *Gastos de Caja / Operación:* -$${summary.expensesUSD.toFixed(2)}
🏆 *Utilidad Neta de Bolsillo:* +$${summary.netProfitUSD.toFixed(2)} (Margen: ${summary.profitMarginPercent.toFixed(1)}%)

📈 *Indicadores Clave del Mes:*
• Venta promedio por día: $${summary.averageDailyUSD.toFixed(2)}
• Tickets / compras cobradas: ${summary.ticketsCount} tickets
• Compra promedio: $${summary.averageTicketUSD.toFixed(2)} / ticket

📦 *Ingresos por Canal de Pago:*
• 💵 Efectivo $: $${summary.cashUSD.toFixed(2)}
• 💵 Efectivo Bs: Bs ${summary.cashVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
• 📱 Pago Móvil: Bs ${summary.pagoMovilVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
• 💳 Punto de Venta: Bs ${summary.puntoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}

📝 *Créditos y Fiados del Mes:*
• Fiados otorgados: $${summary.creditIssuedUSD.toFixed(2)}
• Abonos recuperados: $${summary.creditCollectedUSD.toFixed(2)}
• Tasa de cobranza: ${summary.collectionRatePercent.toFixed(1)}%

Generado automáticamente por BodegaPro.`;

  return encodeURIComponent(text);
}

export function openWhatsAppLink(phone: string, encodedText: string): void {
  const clean = sanitizePhone(phone);
  const url = clean.length > 5 
    ? `https://wa.me/${clean}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  window.open(url, '_blank');
}
