/**
 * Click Agro - Gestor de Datos y Pedidos (Agenda Agro 2027)
 * Soporta Firebase Firestore + Almacenamiento Local (LocalStorage) con sincronización automática.
 */

const CLICKAGRO_STORAGE_KEY_FISICA = 'clickagro_orders_fisica_v1';
const CLICKAGRO_STORAGE_KEY_DIGITAL = 'clickagro_orders_digital_v1';
const CLICKAGRO_CONFIG_KEY = 'clickagro_admin_config_v1';

// Cuentas de Administrador Autorizadas
const AUTHORIZED_ADMIN_EMAILS = [
  'academiaclickagro@gmail.com',
  'mariaelinapiriz@gmail.com',
  'info@clickagro.org'
];

// Configuración por defecto del sistema
const DEFAULT_CONFIG = {
  firebaseConfig: {
    apiKey: "",
    authDomain: "clickagro-admin.firebaseapp.com",
    projectId: "clickagro-admin",
    storageBucket: "clickagro-admin.appspot.com",
    messagingSenderId: "",
    appId: ""
  },
  emailService: {
    provider: 'resend', // 'resend', 'emailjs', 'webhook', 'direct'
    apiKey: '',
    emailJsServiceId: '',
    emailJsTemplateId: '',
    emailJsPublicKey: '',
    webhookUrl: '',
    senderEmail: 'academiaclickagro@gmail.com',
    senderName: 'Click Agro Argentina'
  },
  pdfUrl: 'https://academiaclickagro.com.ar/agenda/Agenda%20agro%202027.pdf',
  pdfFileName: 'Agenda agro 2027.pdf',
  aliasPago: 'CLICKAGRO',
  titularPago: 'MARIAELINAPIRIZ',
  whatsappOficial: '+54 11 2366-3993',
  whatsappRaw: '5491123663993'
};

// Cargar configuración guardada o por defecto
function getClickAgroConfig() {
  try {
    const raw = localStorage.getItem(CLICKAGRO_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Error leyendo configuración:', e);
  }
  return { ...DEFAULT_CONFIG };
}

function saveClickAgroConfig(cfg) {
  try {
    localStorage.setItem(CLICKAGRO_CONFIG_KEY, JSON.stringify(cfg));
    return true;
  } catch (e) {
    console.error('Error guardando configuración:', e);
    return false;
  }
}

// Datos iniciales de demostración si el almacenamiento está vacío
const INITIAL_DEMO_FISICA = [
  {
    id: 'FIS-1727601001',
    fecha: '2026-09-28 14:32',
    nombre: 'Juan Bautista Echeverría',
    dni: '28.450.912',
    tel: '+54 9 2344 421099',
    email: 'jbecheverria@campoagro.com.ar',
    direccion: 'Ruta 205 Km 182, Campo El Trébol',
    ciudad: 'Saladillo',
    provincia: 'Buenos Aires',
    cp: '7260',
    notas: 'Dejar en tranquera blanca con encargado Pedro.',
    cuotas: '1 pago de $150.000',
    monto: 150000,
    estadoPago: 'Confirmado', // Pendiente, Registrado, Confirmado
    estadoDespacho: 'En preparación', // Pendiente, En preparación, Despachado, Entregado
    numeroGuia: 'AR-7260-9921',
    origen: 'web'
  },
  {
    id: 'FIS-1727602410',
    fecha: '2026-09-28 16:15',
    nombre: 'Agropecuaria Las Lilas S.A.',
    dni: '30-71458923-8',
    tel: '+54 9 2477 558912',
    email: 'administracion@laslilasagro.com',
    direccion: 'Av. Alsina 450, Piso 3 Of. B',
    ciudad: 'Pergamino',
    provincia: 'Buenos Aires',
    cp: '2700',
    notas: 'Horario comercial de 8 a 17 hs.',
    cuotas: '3 cuotas de $50.000',
    monto: 150000,
    estadoPago: 'Registrado',
    estadoDespacho: 'Pendiente',
    numeroGuia: '',
    origen: 'web'
  },
  {
    id: 'FIS-1727605900',
    fecha: '2026-09-29 08:45',
    nombre: 'Martín Zavaleta',
    dni: '33.109.845',
    tel: '+54 9 2293 481120',
    email: 'martinzavaleta@gmail.com',
    direccion: 'Calle Rodríguez 782',
    ciudad: 'Tandil',
    provincia: 'Buenos Aires',
    cp: '7000',
    notas: 'Timbre casa principal.',
    cuotas: '1 pago de $150.000',
    monto: 150000,
    estadoPago: 'Pendiente',
    estadoDespacho: 'Pendiente',
    numeroGuia: '',
    origen: 'web'
  }
];

const INITIAL_DEMO_DIGITAL = [
  {
    id: 'DIG-1727603100',
    fecha: '2026-09-28 15:10',
    nombre: 'Ing. Agr. Florencia Morresi',
    email: 'florencia.morresi@gmail.com',
    tel: '+54 9 236 4658901',
    cuotas: '1 pago de $50.000',
    monto: 50000,
    estadoPago: 'Confirmado', // Pendiente, Registrado, Confirmado
    enviado: true,
    fechaEnvio: '2026-09-28 15:45',
    enviadoPor: 'academiaclickagro@gmail.com',
    origen: 'web'
  },
  {
    id: 'DIG-1727604500',
    fecha: '2026-09-28 17:22',
    nombre: 'Esteban Di Marco',
    email: 'estebandimarco.agro@yahoo.com.ar',
    tel: '+54 9 11 5894 1234',
    cuotas: '2 cuotas de $25.000',
    monto: 50000,
    estadoPago: 'Confirmado',
    enviado: false,
    fechaEnvio: null,
    enviadoPor: null,
    origen: 'web'
  },
  {
    id: 'DIG-1727606100',
    fecha: '2026-09-29 09:12',
    nombre: 'María Soledad Carrizo',
    email: 'msolecarrizo@gmail.com',
    tel: '+54 9 2346 612845',
    cuotas: '1 pago de $50.000',
    monto: 50000,
    estadoPago: 'Registrado',
    enviado: false,
    fechaEnvio: null,
    enviadoPor: null,
    origen: 'web'
  }
];

// Obtener Pedidos Físicos
function getPhysicalOrders() {
  try {
    const raw = localStorage.getItem(CLICKAGRO_STORAGE_KEY_FISICA);
    if (!raw) {
      localStorage.setItem(CLICKAGRO_STORAGE_KEY_FISICA, JSON.stringify(INITIAL_DEMO_FISICA));
      return [...INITIAL_DEMO_FISICA];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al obtener pedidos físicos:', e);
    return [];
  }
}

// Guardar Pedidos Físicos
function savePhysicalOrders(orders) {
  try {
    localStorage.setItem(CLICKAGRO_STORAGE_KEY_FISICA, JSON.stringify(orders));
    notifyStorageChange();
    return true;
  } catch (e) {
    console.error('Error al guardar pedidos físicos:', e);
    return false;
  }
}

// Agregar Nuevo Pedido Físico (desde landing o admin)
function addPhysicalOrder(data) {
  const orders = getPhysicalOrders();
  const newOrder = {
    id: 'FIS-' + Date.now(),
    fecha: formatCurrentDateTime(),
    nombre: data.nombre || '',
    dni: data.dni || '',
    tel: data.tel || '',
    email: data.email || '',
    direccion: data.direccion || '',
    ciudad: data.ciudad || '',
    provincia: data.provincia || '',
    cp: data.cp || '',
    notas: data.notas || '',
    cuotas: data.cuotas || '1 pago de $150.000',
    monto: 150000,
    estadoPago: data.estadoPago || 'Registrado',
    estadoDespacho: data.estadoDespacho || 'Pendiente',
    numeroGuia: data.numeroGuia || '',
    origen: data.origen || 'web'
  };

  orders.unshift(newOrder);
  savePhysicalOrders(orders);

  // Intentar sincronizar con Firebase si está configurado
  syncOrderToFirebase('pedidos_fisica', newOrder);

  return newOrder;
}

// Obtener Pedidos Digitales
function getDigitalOrders() {
  try {
    const raw = localStorage.getItem(CLICKAGRO_STORAGE_KEY_DIGITAL);
    if (!raw) {
      localStorage.setItem(CLICKAGRO_STORAGE_KEY_DIGITAL, JSON.stringify(INITIAL_DEMO_DIGITAL));
      return [...INITIAL_DEMO_DIGITAL];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al obtener pedidos digitales:', e);
    return [];
  }
}

// Guardar Pedidos Digitales
function saveDigitalOrders(orders) {
  try {
    localStorage.setItem(CLICKAGRO_STORAGE_KEY_DIGITAL, JSON.stringify(orders));
    notifyStorageChange();
    return true;
  } catch (e) {
    console.error('Error al guardar pedidos digitales:', e);
    return false;
  }
}

// Agregar Nuevo Pedido Digital (desde landing o admin)
function addDigitalOrder(data) {
  const orders = getDigitalOrders();
  const newOrder = {
    id: 'DIG-' + Date.now(),
    fecha: formatCurrentDateTime(),
    nombre: data.nombre || '',
    email: data.email || '',
    tel: data.tel || '',
    cuotas: data.cuotas || '1 pago de $50.000',
    monto: 50000,
    estadoPago: data.estadoPago || 'Registrado',
    enviado: false,
    fechaEnvio: null,
    enviadoPor: null,
    origen: data.origen || 'web'
  };

  orders.unshift(newOrder);
  saveDigitalOrders(orders);

  // Intentar sincronizar con Firebase si está configurado
  syncOrderToFirebase('pedidos_digital', newOrder);

  return newOrder;
}

// Actualizar Estado de Pago en Pedido Físico
function updatePhysicalOrderStatus(id, newStatus) {
  const orders = getPhysicalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].estadoPago = newStatus;
    savePhysicalOrders(orders);
    updateFirebaseDocument('pedidos_fisica', id, { estadoPago: newStatus });
    return true;
  }
  return false;
}

// Actualizar Despacho en Pedido Físico
function updatePhysicalOrderDispatch(id, dispatchStatus, trackingNumber = '') {
  const orders = getPhysicalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].estadoDespacho = dispatchStatus;
    if (trackingNumber !== undefined) {
      orders[index].numeroGuia = trackingNumber;
    }
    savePhysicalOrders(orders);
    updateFirebaseDocument('pedidos_fisica', id, {
      estadoDespacho: dispatchStatus,
      numeroGuia: orders[index].numeroGuia
    });
    return true;
  }
  return false;
}

// Actualizar Estado de Pago en Pedido Digital
function updateDigitalOrderStatus(id, newStatus) {
  const orders = getDigitalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].estadoPago = newStatus;
    saveDigitalOrders(orders);
    updateFirebaseDocument('pedidos_digital', id, { estadoPago: newStatus });
    return true;
  }
  return false;
}

// Marcar Pedido Digital como Enviado (Acción del botón ENVIAR)
function markDigitalOrderSent(id, adminEmail) {
  const orders = getDigitalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].enviado = true;
    orders[index].fechaEnvio = formatCurrentDateTime();
    orders[index].enviadoPor = adminEmail || 'Admin Click Agro';
    saveDigitalOrders(orders);
    updateFirebaseDocument('pedidos_digital', id, {
      enviado: true,
      fechaEnvio: orders[index].fechaEnvio,
      enviadoPor: orders[index].enviadoPor
    });
    return orders[index];
  }
  return null;
}

// Eliminar Pedido
function deleteOrder(type, id) {
  if (type === 'fisica') {
    const orders = getPhysicalOrders().filter(o => o.id !== id);
    savePhysicalOrders(orders);
    deleteFirebaseDocument('pedidos_fisica', id);
    return true;
  } else if (type === 'digital') {
    const orders = getDigitalOrders().filter(o => o.id !== id);
    saveDigitalOrders(orders);
    deleteFirebaseDocument('pedidos_digital', id);
    return true;
  }
  return false;
}

// Restaurar Datos de Demostración
function resetDemoData() {
  localStorage.setItem(CLICKAGRO_STORAGE_KEY_FISICA, JSON.stringify(INITIAL_DEMO_FISICA));
  localStorage.setItem(CLICKAGRO_STORAGE_KEY_DIGITAL, JSON.stringify(INITIAL_DEMO_DIGITAL));
  notifyStorageChange();
}

// Formateador de Fecha y Hora actual
function formatCurrentDateTime() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const min = pad(now.getMinutes());
  return `${y}-${m}-${d} ${h}:${min}`;
}

// Notificar cambio a listeners locales
function notifyStorageChange() {
  window.dispatchEvent(new CustomEvent('clickagro-orders-updated'));
}

// ==========================================
// INTEGRACIÓN CON FIREBASE FIRESTORE (OPCIONAL)
// ==========================================
let firebaseDbInstance = null;

function initFirebase() {
  const config = getClickAgroConfig();
  if (window.firebase && config.firebaseConfig && config.firebaseConfig.apiKey) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(config.firebaseConfig);
      }
      firebaseDbInstance = firebase.firestore();
      console.log('Firebase Firestore inicializado exitosamente.');
      return true;
    } catch (e) {
      console.warn('No se pudo inicializar Firebase con la configuración dada:', e);
    }
  }
  return false;
}

function syncOrderToFirebase(collectionName, orderData) {
  if (firebaseDbInstance) {
    try {
      firebaseDbInstance.collection(collectionName).doc(orderData.id).set(orderData, { merge: true })
        .catch(err => console.warn('Error sincronizando con Firebase:', err));
    } catch (e) {
      console.warn('Excepción sincronizando con Firebase:', e);
    }
  }
}

function updateFirebaseDocument(collectionName, docId, updates) {
  if (firebaseDbInstance) {
    try {
      firebaseDbInstance.collection(collectionName).doc(docId).update(updates)
        .catch(err => console.warn('Error actualizando documento en Firebase:', err));
    } catch (e) {
      console.warn('Excepción actualizando documento en Firebase:', e);
    }
  }
}

function deleteFirebaseDocument(collectionName, docId) {
  if (firebaseDbInstance) {
    try {
      firebaseDbInstance.collection(collectionName).doc(docId).delete()
        .catch(err => console.warn('Error eliminando documento en Firebase:', err));
    } catch (e) {
      console.warn('Excepción eliminando documento en Firebase:', e);
    }
  }
}

// Exportar Pedidos a CSV
function exportOrdersToCSV(type) {
  let orders = [];
  let filename = '';
  let csvContent = '';

  if (type === 'fisica') {
    orders = getPhysicalOrders();
    filename = `clickagro_pedidos_agenda_fisica_${new Date().toISOString().slice(0, 10)}.csv`;
    const headers = ['ID', 'Fecha', 'Nombre', 'DNI/CUIT', 'Telefono', 'Email', 'Direccion', 'Ciudad', 'Provincia', 'Codigo Postal', 'Notas Entrega', 'Cuotas', 'Monto', 'Estado Pago', 'Estado Despacho', 'Numero Guia'];
    csvContent = headers.join(';') + '\n';

    orders.forEach(o => {
      const row = [
        `"${o.id || ''}"`,
        `"${o.fecha || ''}"`,
        `"${(o.nombre || '').replace(/"/g, '""')}"`,
        `"${o.dni || ''}"`,
        `"${o.tel || ''}"`,
        `"${o.email || ''}"`,
        `"${(o.direccion || '').replace(/"/g, '""')}"`,
        `"${(o.ciudad || '').replace(/"/g, '""')}"`,
        `"${(o.provincia || '').replace(/"/g, '""')}"`,
        `"${o.cp || ''}"`,
        `"${(o.notas || '').replace(/"/g, '""')}"`,
        `"${o.cuotas || ''}"`,
        o.monto || 150000,
        `"${o.estadoPago || ''}"`,
        `"${o.estadoDespacho || ''}"`,
        `"${o.numeroGuia || ''}"`
      ];
      csvContent += row.join(';') + '\n';
    });
  } else {
    orders = getDigitalOrders();
    filename = `clickagro_pedidos_agenda_digital_${new Date().toISOString().slice(0, 10)}.csv`;
    const headers = ['ID', 'Fecha', 'Nombre', 'Email', 'Telefono', 'Cuotas', 'Monto', 'Estado Pago', 'Enviado', 'Fecha Envio', 'Enviado Por'];
    csvContent = headers.join(';') + '\n';

    orders.forEach(o => {
      const row = [
        `"${o.id || ''}"`,
        `"${o.fecha || ''}"`,
        `"${(o.nombre || '').replace(/"/g, '""')}"`,
        `"${o.email || ''}"`,
        `"${o.tel || ''}"`,
        `"${o.cuotas || ''}"`,
        o.monto || 50000,
        `"${o.estadoPago || ''}"`,
        o.enviado ? 'SI' : 'NO',
        `"${o.fechaEnvio || ''}"`,
        `"${o.enviadoPor || ''}"`
      ];
      csvContent += row.join(';') + '\n';
    });
  }

  // Descargar archivo Blob CSV con BOM UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
