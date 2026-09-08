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
    netProfitUSD: number;
    cashUSD: number;
    cashVES: number;
    pagoMovilVES: number;
    puntoVES: number;
    creditIssuedUSD: number;
    creditCollectedUSD: number;
  },
  storeName: string
): string {
  const text = `📊 *CIERRE DIARIO - ${storeName}*
📅 Fecha: ${summary.date}

💵 *Facturación Total:* $${summary.totalUSD.toFixed(2)} (Bs ${summary.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })})
📈 *Ganancia Neta Real:* $${summary.netProfitUSD.toFixed(2)}

📦 *Arqueo por Canal de Cobro:*
- 💵 Efectivo $: $${summary.cashUSD.toFixed(2)}
- 💵 Efectivo Bs: Bs ${summary.cashVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
- 📱 Pago Móvil: Bs ${summary.pagoMovilVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
- 💳 Punto de Venta: Bs ${summary.puntoVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}

📝 *Balance de Fiados:*
- Fiados concedidos hoy: $${summary.creditIssuedUSD.toFixed(2)}
- Abonos cobrados hoy: $${summary.creditCollectedUSD.toFixed(2)}

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
