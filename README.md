# 🛒 BodegaPro — SaaS POS & Micro-Ledger Multimoneda

[![Live Demo](https://img.shields.io/badge/Demo%20en%20Vivo-bodegapro--app.web.app-10B981?style=for-the-badge&logo=firebase&logoColor=white)](https://bodegapro-app.web.app)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready%20%26%20Offline--First-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **SaaS B2B de Punto de Venta (POS), Control de Fiados Inmutable y Gestión Contable en Tiempo Real**, diseñado específicamente para resolver las complejidades operativas del comercio popular y bodegas en economías con doble moneda (USD y Bolívares).

---

## 🌟 Demo en Producción
Accede a la aplicación en vivo: **[https://bodegapro-app.web.app](https://bodegapro-app.web.app)**  
*Optimizado para computadoras de escritorio (pantalla completa para caja) y dispositivos móviles Android / iOS.*

---

## 💡 El Problema y la Solución

En Venezuela y diversos países de Latinoamérica, miles de pequeños comerciantes gestionan sus negocios bajo una constante fricción cambiaria:
1. **Cobros Multimoneda Fragmentados:** Un cliente puede pagar una sola compra combinando dólares en efectivo, bolívares por Pago Móvil, tarjeta de débito por Punto de Venta y pedir el resto "fiado".
2. **Devaluación y Pérdida en Fiados:** El tradicional cuaderno de papel provoca pérdidas masivas porque las deudas anotadas en moneda local pierden valor con cada variación cambiaria.
3. **Costo de Hardware:** Las impresoras térmicas fiscales y el papel continuo representan costos inviables para los pequeños negocios.
4. **Falta de Claridad Contable:** Al mezclar bolívares y dólares en caja, el comerciante desconoce su ganancia neta real al final del día.

### ✨ La Solución: BodegaPro
**BodegaPro** digitaliza la totalidad del flujo de una bodega con una experiencia de usuario ultra rápida (**menos de 10 segundos por ticket**):
- **Doble Anclaje Automático (USD / VES):** Precios siempre al día con la tasa oficial BCV de DolarAPI y override manual.
- **Cobro Split Universal:** Admite pagos divididos en 5 métodos simultáneos en una sola transacción.
- **Micro-Ledger de Fiados Inmutable:** Toda deuda se congela en dólares al instante de la venta.
- **Recibos Digitales por WhatsApp:** Despacho sin papel directo al chat del cliente.
- **PWA Instalable:** Funciona como aplicación de escritorio nativa en PC y como app móvil completa en smartphones.

---

## 🚀 Características Principales

### 1. ⚡ Punto de Venta Rápido (POS)
- Catálogo visual optimizado con buscador en tiempo real por nombre y código de barras.
- Desglose de cobro universal en una sola pantalla:
  - **Efectivo USD ($)**
  - **Efectivo Bolívares (Bs)**
  - **Pago Móvil (Bs)**
  - **Punto de Venta / Débito (Bs)**
  - **Fiado / Crédito ($)**
- Botones de atajo rápido de un solo clic: **"Exacto en USD"**, **"Exacto Efectivo Bs"**, **"Exacto Pago Móvil"**, **"Exacto Punto"** y **"Todo Fiado"**.
- Gestión de vueltos y opción de **acreditar el vuelto como saldo a favor** del cliente para futuras compras.
- Generación instantánea de comprobante de compra formateado para WhatsApp.

### 2. 📒 Control de Clientes y Micro-Ledger de Fiados
- Historial contable inmutable: cada compra a crédito y cada abono queda registrado permanentemente con fecha, hora y cajero.
- La deuda se mantiene fijada en **USD** para proteger al comerciante de la inflación, mostrando su equivalente en bolívares a la tasa del día.
- Límite de crédito configurable por cliente con bloqueo automático si se excede.
- Botón de recordatorio de cobro por WhatsApp con saldo adeudado y desglose de cuenta preformateado.
- Edición y gestión de clientes con protección de integridad histórica (el borrado de un cliente no altera las ganancias ni ventas pasadas).

### 3. 📦 Inventario Inteligente y Despiece de Bultos
- Soporte para venta al detal (unidad, kg, litro) y por bulto/fardo.
- **Módulo de Despiece:** Desempaqueta bultos a unidades individuales recalculando el costo unitario exacto en segundos.
- Control de mermas y pérdidas operativas con registro de motivo (vencido, dañado, consumo propio).
- Alertas visuales de stock bajo.

### 4. 📊 Informes Financieros y Cierre de Caja
- **Arqueo de Caja Diario:** Total facturado, costo de mercancía y **ganancia neta real**, desglosado exactamente por cuánto dinero entró en efectivo $, efectivo Bs, pago móvil y punto de venta.
- **Métricas Semanales y Mensuales:** Gráficos de tendencia de ventas, productos más vendidos y porcentaje de crecimiento mes a mes.
- Exportación del informe diario completo a WhatsApp con un solo clic.

### 5. 📱 PWA Offline-First & App de Escritorio
- Manifiesto web certificado e iconos de alta resolución optimizados para Android, iOS y navegadores de escritorio.
- **Instalación en PC:** Se ejecuta en su propia ventana sin barra de direcciones, brindando la apariencia de un software de caja profesional.
- **Service Worker Activo:** Carga instantánea y soporte de operaciones en modo local.

### 6. 🛡️ Arquitectura Multi-Tenant & Superadmin
- Autenticación segura vía Google Auth.
- Aislamiento de datos por comercio (`tenantId`).
- Panel de control **Superadmin** para activación y gestión del período de prueba (7-14 días) o suscripción mensual de cada comercio.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) | Renderizado reactivo y gestión de componentes |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | Tipado estático y robustez en cálculos contables |
| **Estilos & UI** | [Tailwind CSS](https://tailwindcss.com/) | Diseño responsive, modo cajero y componentes limpios |
| **Iconografía** | [Lucide React](https://lucide.dev/) | Iconos vectoriales modernos y consistentes |
| **Bundler** | [Vite 5](https://vitejs.dev/) | Compilación ultra rápida y optimización de assets |
| **PWA & Offline** | [Vite Plugin PWA](https://vite-pwa-org.netlify.app/) & Workbox | Service Worker, manifiesto e instalación en pantalla |
| **Backend & Cloud** | [Firebase 10](https://firebase.google.com/) | Authentication, Firestore DB y Hosting CDN |
| **Tasas de Cambio** | [DolarAPI](https://dolarapi.com/) | Consulta en tiempo real de la tasa oficial del BCV |

---

## 🏗️ Arquitectura del Proyecto

```text
BodegaPro/
├── public/                     # Iconos PWA, manifest y assets estáticos
│   ├── apple-touch-icon.png    # Icono oficial para dispositivos Apple iOS
│   ├── pwa-192x192.png         # Icono para dispositivos móviles Android
│   ├── pwa-512x512.png         # Icono alta resolución para PC y splash screen
│   └── logo.svg                # Logotipo vectorial de la marca
├── src/
│   ├── components/
│   │   ├── about/              # Modal "Acerca de" con perfil del desarrollador
│   │   ├── auth/               # Login, Registro de Bodega y Aprobación
│   │   ├── common/             # Header, Sidebar, BottomNav, InstallAppModal
│   │   ├── customers/          # Directorio de fiados, abonos y detalle inmutable
│   │   ├── inventory/          # Gestión de stock, despiece de bultos y mermas
│   │   ├── pos/                # Terminal de cobro rápido y atajos de pago
│   │   ├── reports/            # Informes diario, semanal, mensual y WhatsApp
│   │   ├── settings/           # Configuración de bodega y moneda
│   │   └── superadmin/         # Control central de suscripciones y tenants
│   ├── context/
│   │   ├── AuthContext.tsx     # Sesión de usuario y estado de membresía
│   │   ├── CartContext.tsx     # Carrito de venta y precios al vuelo
│   │   ├── CurrencyContext.tsx # Tasa DolarAPI y override de bolívares
│   │   ├── CustomersContext.tsx# Ledger de fiados y cuentas por cobrar
│   │   ├── InventoryContext.tsx# Catálogo de productos y existencias
│   │   └── ReportsContext.tsx  # Inmutabilidad de tickets y balance contable
│   ├── hooks/
│   │   └── usePWAInstall.ts    # Captura de evento de instalación multiplataforma
│   ├── services/
│   │   ├── firebase.ts         # Conexión con Firebase SDK
│   │   ├── localDatabase.ts    # Persistencia offline y sincronización
│   │   └── whatsapp.ts         # Generador de mensajes y recibos formateados
│   ├── types/                  # Modelos de datos TypeScript
│   ├── App.tsx                 # Router principal y orquestador de vistas
│   └── main.tsx                # Entrada de aplicación y registro del SW
├── vite.config.ts              # Configuración de Vite y plugin PWA
└── tailwind.config.js          # Paleta de colores y temas personalizados
```

---

## 💻 Instalación y Desarrollo Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/omanvasquez/bodegapro.git
   cd bodegapro
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el entorno de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

5. **Desplegar en Firebase:**
   ```bash
   firebase deploy --only hosting
   ```

---

## 👨‍💻 Sobre el Desarrollador

<div align="center">
  <h3><strong>Oman Vásquez</strong></h3>
  <p><em>Software Architect & SaaS Builder</em></p>
  <p>Apasionado por crear soluciones de software de alto impacto que simplifican la vida cotidiana y potencian el comercio en América Latina.</p>

  <p>
    <a href="https://oman-vasquez.web.app"><img src="https://img.shields.io/badge/Sitio_Web-oman--vasquez.web.app-4F46E5?style=for-the-badge&logo=google-chrome&logoColor=white" /></a>
    <a href="https://wa.me/584124169949"><img src="https://img.shields.io/badge/WhatsApp-+58_412--4169949-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>
    <a href="https://github.com/omanvasquez"><img src="https://img.shields.io/badge/GitHub-omanvasquez-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
    <a href="https://www.linkedin.com/in/omanvasquez/"><img src="https://img.shields.io/badge/LinkedIn-omanvasquez-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
    <a href="https://omanvasquez.substack.com/"><img src="https://img.shields.io/badge/Substack-Mi_Blog-FF6719?style=for-the-badge&logo=substack&logoColor=white" /></a>
    <a href="https://x.com/omanvasquez_"><img src="https://img.shields.io/badge/X-@omanvasquez__-000000?style=for-the-badge&logo=x&logoColor=white" /></a>
    <a href="https://www.instagram.com/omanvasquez_/"><img src="https://img.shields.io/badge/Instagram-@omanvasquez__-E4405F?style=for-the-badge&logo=instagram&logoColor=white" /></a>
  </p>
</div>

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Puedes consultar el archivo [LICENSE](LICENSE) para más detalles.
