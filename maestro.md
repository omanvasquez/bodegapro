# Maestro.md - Proyecto BodegaPro

## 1. Visión General del Proyecto
*   **Nombre de la App:** BodegaPro
*   **Modelo de Negocio:** SaaS (Software as a Service) para bodegas y pequeños comercios. Suscripción mensual ($4 - $5 USD).
*   **Alcance Inicial:** Despliegue local (Las Vegas, Lagunita, San Carlos, Tinaco, Tinaquillo - Edo. Cojedes) buscando tracción inicial de 100 a 500 comercios.
*   **Cuenta / Propiedad:**
    *   Desarrollador / Propietario: Oman Vásquez (`omanjrvasquez@gmail.com`).
    *   Repositorio GitHub: [https://github.com/omanvasquez](https://github.com/omanvasquez)
    *   Instancia Firebase: Asociada a la cuenta `omanjrvasquez@gmail.com`.
*   **Stack Tecnológico y Soporte Multiplataforma:** 
    *   **Frontend (Web Desktop & PWA Móvil):** Arquitectura híbrida adaptable.
        *   *En Celular / Tablet:* PWA instalable con comportamiento idéntico a app nativa (pantalla completa sin barra del navegador, barra de navegación táctil inferior, botones de cobro ergonómicos para el pulgar).
        *   *En PC / Laptop:* Interfaz web de escritorio optimizada con pantalla expandida (catálogo a la izquierda, carrito y cobro fijo a la derecha) y atajos de teclado para agilizar la caja.
    *   **Backend / DB:** Firebase (Auth con persistencia local estricta, Firestore con soporte offline vía IndexedDB, Hosting).
    *   **Integraciones:** DolarAPI (BCV, Euro, USDT) con fallback manual local; API/Web link de WhatsApp para comprobantes e informes sin impresora.

---

## 2. UI / UX (Interfaz y Experiencia)
*   **Identidad Visual:**
    *   *Color Primario:* Azul Pizarra Oscuro (Slate Blue/Navy) para barras, menús y solidez institucional.
    *   *Color Secundario (Acción):* Verde Esmeralda (Cobrar, Guardar, Ingresos, WhatsApp).
    *   *Alertas / Alertas de deuda:* Rojo Ladrillo/Coral (Deudas, stock bajo, cuentas vencidas).
    *   *Fondo:* Gris Perla suave para reducir la fatiga visual en jornadas largas.
*   **Diseño Dual (Móvil y Escritorio):**
    *   *Modo Móvil (App):* 100% táctil, navegación limpia por pestañas inferiores, botones gigantes para registrar cantidades y cobrar rápido.
    *   *Modo PC:* Aprovechamiento de pantallas grandes para ver simultáneamente inventario, ticket actual, métricas del día y atajos rápidos de teclado.
*   **Sección / Modal "Acerca de" y Footer Global:**
    *   **Versión:** 1.0
    *   **Autor:** Desarrollado por **Oman Vásquez**
    *   **Web Oficial:** [https://oman-vasquez.web.app](https://oman-vasquez.web.app)
    *   **WhatsApp de Soporte/Contacto:** [+584124169949](https://wa.me/584124169949)
    *   **GitHub (Otros programas):** [https://github.com/omanvasquez](https://github.com/omanvasquez)
    *   **Blog / Newsletter:** [https://omanvasquez.substack.com/](https://omanvasquez.substack.com/)
    *   **LinkedIn:** [https://www.linkedin.com/in/omanvasquez/](https://www.linkedin.com/in/omanvasquez/)
    *   **Instagram:** [https://www.instagram.com/omanvasquez_/](https://www.instagram.com/omanvasquez_/)
    *   **X (Twitter):** [https://x.com/omanvasquez_/](https://x.com/omanvasquez_/)

---

## 3. Arquitectura Multitenant, Roles y Seguridad
*   **Autenticación:** Google Auth con persistencia local estricta (`LOCAL`). Si la bodega pasa días sin conexión a internet, la sesión local se mantiene activa en el dispositivo.
*   **Aislamiento de Datos (Multitenant):** Cada bodega opera bajo un `tenantId` único. Todas las consultas y colecciones en Firestore están filtradas y protegidas por reglas de seguridad multitenant.
*   **Control de Suscripción y Período de Prueba:**
    *   *Trial de Bienvenida:* Cada nueva bodega disfruta de 7 a 14 días de prueba gratuita completa.
    *   *Estado de Cuenta:* Si el estado es `inactivo` (suscripción vencida sin renovación), el dashboard se bloquea y se muestra la pantalla de cobro/reactivación con contacto a WhatsApp de soporte.
*   **Rol Superadmin (Exclusivo para Oman Vásquez):**
    *   Correo asignado: `omanjrvasquez@gmail.com`.
    *   Vista administrativa simplificada para ver comercios registrados y conmutar el botón de estado `Activo` / `Inactivo` de cada tenant con un solo toque (la gestión de cobros y fechas maestras se administra en el sistema central externo de Oman).
*   **Configuración Local del Negocio:** Personalización del nombre de la bodega, encargado, teléfono de contacto y mensaje predeterminado para comprobantes de WhatsApp.

---

## 4. Módulos Core y Lógica de Negocio

### A. Tasa de Cambio
*   **Sincronización Automática:** Conexión a DolarAPI para BCV, Euro y USDT.
*   **Control Manual (Override):** Botón de sobreescritura manual persistente para fijar una tasa personalizada de contingencia (ante fallos de internet o trabajo con tasa paralela).

### B. Inventario y Precios (Doble Anclaje, Granel y Despiece)
*   **Modelo de Costo:** Último Costo de Reposición.
*   **Doble Anclaje de Precios (Toggle por Producto):**
    *   *Modo USD (Víveres y empaquetados):* Precio base en dólares; calcula el equivalente en Bs en tiempo real según la tasa activa.
    *   *Modo Bs (Menudeo y chucherías):* Precio base fijo en bolívares; calcula el contravalor en USD de forma invisible para los reportes de rentabilidad.
*   **Venta a Granel y Decimales:** Soporte nativo para fracciones y cantidades decimales en inventario y venta (ej. `0.250 kg` de queso, `0.5 kg` de azúcar, granel de líquidos).
*   **Despiece de Bultos a Unidades:** Conversión ágil para ingresar compras en bultos/cajas y transformarlas en unidades sueltas con costo prorrateado.
*   **Mermas y Consumo Propio:** Módulo rápido para registrar salidas de stock no monetizadas (consumo personal/familiar del bodeguero, productos dañados o vencidos), manteniendo el inventario cuadrado.

### C. Punto de Venta (Caja) y Arqueo Multimoneda
*   **Snapshot Inmutable (Vital):** Cada ticket procesado almacena una captura fija: tasa de cambio del momento, costo unitario del producto en ese instante y precio final de venta. Cambios futuros en inventario no alteran los márgenes históricos.
*   **Pagos Mixtos Universales:** En cualquier venta común se permite fraccionar el pago en múltiples métodos: Efectivo USD, Efectivo Bs, Pago Móvil y Punto de Venta.
*   **Gestión de Vueltos y Saldo a Favor:**
    *   Registro de vueltos entregados (ej. por Pago Móvil si pagaron en USD físico).
    *   Opción de abonar el vuelto como **"Saldo a Favor" (Crédito Positivo)** en la ficha del cliente para sus próximas compras.
*   **Ajuste de Precio al Vuelo:** Modificación manual directa de precios en el carrito antes de cerrar la venta (para regateos, redondeos de sencillo o promociones de momento).
*   **Comprobantes por WhatsApp (Sin hardware):** Generación con 1 clic de mensaje de texto formateado listo para enviar al WhatsApp del cliente con el detalle de la compra.
*   **Cierre de Caja y Arqueo Diario:** Resumen del día desglosado por vía de ingreso para cuadre de gavetas físicas y bancos:
    *   Total Efectivo USD.
    *   Total Efectivo Bs.
    *   Total recibido en Pago Móvil.
    *   Total pasado por Punto de Venta.
    *   Total en fiados concedidos y abonos recibidos.

### D. Clientes y Fiado (Micro-Ledger)
*   **Regla de Oro:** Toda deuda se fija, congela y consolida estrictamente en **USD**.
*   **Historial Intocable:** Prohibida la edición directa de saldos; se registran únicamente eventos inmutables de *Cargos* (compras a crédito) y *Abonos* (pagos parciales o totales).
*   **Abonos al Cuadre del Día:** Todo abono se registra especificando el método de pago e ingresa al flujo de caja diario en su renglón correspondiente.
*   **Límites de Crédito:** Tope máximo de deuda configurable por cliente que bloquea nuevas ventas a crédito si se excede.
*   **Avisos de Cobro por WhatsApp:** Botón rápido para enviar al cliente el comprobante de fiado o recibo de abono con su saldo pendiente acumulado (*«Hola Juan, registramos tu compra fiada por $3.50. Tu saldo pendiente es: $12.00»*).

### E. Compras y Proveedores (Cuentas por Pagar)
*   **Entrada Rápida de Mercancía:** Aumento inmediato de stock con actualización automática del último costo.
*   **Compras a Crédito:** Asignación de proveedor y fecha promesa de pago.
*   **Alertas Visuales en Dashboard:** Indicadores en el panel principal con deudas próximas a vencer o vencidas sin depender de correos externos.

### F. Informes y Analíticas Visuales (Diario, Semanal y Mensual)
*   **Diseño Visual de Alto Impacto:** Tarjetas KPI estéticas, limpias, con micro-gráficos modernos y fáciles de entender para cualquier comerciante (sin tecnicismos contables innecesarios).
*   **Informe Diario (Cierre de Jornada):**
    *   Ventas totales en USD y Bs.
    *   **Ganancia Neta Real del Día** (calculada con el costo congelado de cada venta).
    *   Desglose exacto de caja por gavetas/bancos (Efectivo $, Efectivo Bs, Pago Móvil, Punto).
    *   Balance de fiados del día (Fiado otorgado vs. Cobranza/Abonos recibidos).
    *   Botón de **"Compartir Cierre por WhatsApp"** (para enviar el resumen diario al dueño de la bodega al cerrar).
*   **Informe Semanal (Tendencia y Rendimiento):**
    *   Curva gráfica de ventas de lunes a domingo para identificar los días pico y días flojos.
    *   Top 5 / Top 10 productos más vendidos y productos más rentables de la semana.
    *   Comparativa de flujo de caja semanal.
*   **Informe Mensual (Salud y Rentabilidad del Negocio):**
    *   Facturación total acumulada del mes y ganancia neta consolidada.
    *   Comparativa contra el mes anterior (% de crecimiento o retroceso).
    *   Ranking de mejores clientes (frecuencia y volumen de compra).
    *   Estado global de la cartera de fiados (deuda total en la calle vs. recuperada).
    *   Valor total del inventario actual a costo de reposición.

### G. Arquitectura Offline-First y Robustez Local
*   **Generación de IDs Locales (UUID):** Tickets, clientes y movimientos se crean con identificadores únicos generados en el dispositivo para garantizar cero colisiones al reconectar con Firestore.
*   **Persistencia en Caché:** Operación fluida de venta y consulta sin conexión activa a internet.

---

## 5. Próximos Pasos de Desarrollo
1. **Configuración de Firebase:** Crear/enlazar proyecto Firebase con `omanjrvasquez@gmail.com` (Auth, Firestore con índices y persistencia, Hosting).
2. **Modelo de Datos y Reglas de Seguridad:** Diseñar la estructura multitenant por colecciones/subcolecciones y reglas de Firestore (incluyendo validación del rol Superadmin `omanjrvasquez@gmail.com`).
3. **Estructura Base del Frontend (PWA + Web Desktop):** Configuración del proyecto PWA responsivo (React + Vite + TailwindCSS + Lucide Icons + gráficos ligeros) con soporte móvil y PC.
4. **Módulo de Tasa y Configuración:** DolarAPI, override manual y persistencia local.
5. **Superadmin & Onboarding:** Pantalla Superadmin para conmutar `activo`/`inactivo` y lógica del período de prueba (Trial).
6. **Módulo de Inventario:** Doble anclaje, granel, bultos y mermas.
7. **Punto de Venta y Micro-Ledger de Fiados:** Carrito, snapshot inmutable, pagos mixtos, saldo a favor y tickets por WhatsApp.
8. **Módulo de Informes Visuales:** Vistas ejecutivas y estéticas de reportes Diario, Semanal y Mensual con exportación/envío por WhatsApp.