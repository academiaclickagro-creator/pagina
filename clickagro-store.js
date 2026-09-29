/**
 * Click Agro - Gestor de Datos y Pedidos (Agenda Agro 2027)
 * Integración nativa con SUPABASE (PostgreSQL + Realtime) + Fallback LocalStorage.
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

// Credenciales Oficiales de Supabase Click Agro
const SUPABASE_CONFIG = {
  url: 'https://kigeuajghtzzzyfkljrs.supabase.co',
  anonKey: 'sb_publishable_Re59yb6lwFXIIJFAFVHUkg_H2iAChlu'
};

// Configuración por defecto del sistema
const DEFAULT_CONFIG = {
  supabaseConfig: {
    url: SUPABASE_CONFIG.url,
    anonKey: SUPABASE_CONFIG.anonKey
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
    estadoPago: 'Confirmado',
    estadoDespacho: 'En preparación',
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
    estadoPago: 'Confirmado',
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
  }
];

// ==========================================
// MAPEOS BIDIRECCIONALES SUPABASE (Postgres <-> JS)
// ==========================================
function mapFisicaFromDb(row) {
  return {
    id: row.id,
    fecha: row.fecha || '',
    nombre: row.nombre || '',
    dni: row.dni || '',
    tel: row.tel || '',
    email: row.email || '',
    direccion: row.direccion || '',
    ciudad: row.ciudad || '',
    provincia: row.provincia || '',
    cp: row.cp || '',
    notas: row.notas || '',
    cuotas: row.cuotas || '1 pago de $150.000',
    monto: Number(row.monto) || 150000,
    estadoPago: row.estado_pago || row.estadoPago || 'Registrado',
    estadoDespacho: row.estado_despacho || row.estadoDespacho || 'Pendiente',
    numeroGuia: row.numero_guia || row.numeroGuia || '',
    origen: row.origen || 'web'
  };
}

function mapFisicaToDb(order) {
  return {
    id: order.id,
    fecha: order.fecha,
    nombre: order.nombre,
    dni: order.dni,
    tel: order.tel,
    email: order.email || null,
    direccion: order.direccion,
    ciudad: order.ciudad,
    provincia: order.provincia,
    cp: order.cp,
    notas: order.notas || null,
    cuotas: order.cuotas,
    monto: Number(order.monto) || 150000,
    estado_pago: order.estadoPago || 'Registrado',
    estado_despacho: order.estadoDespacho || 'Pendiente',
    numero_guia: order.numeroGuia || '',
    origen: order.origen || 'web'
  };
}

function mapDigitalFromDb(row) {
  return {
    id: row.id,
    fecha: row.fecha || '',
    nombre: row.nombre || '',
    email: row.email || '',
    tel: row.tel || '',
    cuotas: row.cuotas || '1 pago de $50.000',
    monto: Number(row.monto) || 50000,
    estadoPago: row.estado_pago || row.estadoPago || 'Registrado',
    enviado: Boolean(row.enviado),
    fechaEnvio: row.fecha_envio || row.fechaEnvio || null,
    enviadoPor: row.enviado_por || row.enviadoPor || null,
    origen: row.origen || 'web'
  };
}

function mapDigitalToDb(order) {
  return {
    id: order.id,
    fecha: order.fecha,
    nombre: order.nombre,
    email: order.email,
    tel: order.tel,
    cuotas: order.cuotas,
    monto: Number(order.monto) || 50000,
    estado_pago: order.estadoPago || 'Registrado',
    enviado: Boolean(order.enviado),
    fecha_envio: order.fechaEnvio || null,
    enviado_por: order.enviadoPor || null,
    origen: order.origen || 'web'
  };
}

// ==========================================
// CLIENTE Y CONECTIVIDAD SUPABASE
// ==========================================
let supabaseClient = null;

function initSupabase() {
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✓ Supabase Client inicializado exitosamente.');
      }
      return supabaseClient;
    } catch (e) {
      console.warn('Error inicializando SDK de Supabase:', e);
    }
  }
  return null;
}

// Envío REST directo a Supabase (funciona con o sin el script SDK cargado)
async function sendSupabaseRest(endpoint, method, body = null) {
  try {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
    };
    const options = {
      method: method,
      headers: headers
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Supabase REST [${method} ${endpoint}] Status ${res.status}:`, errText);
      return null;
    }
    return await res.json().catch(() => true);
  } catch (err) {
    console.warn(`Supabase REST Fetch error [${endpoint}]:`, err);
    return null;
  }
}

// Sincronizar Nuevo Pedido en Supabase
async function syncOrderToSupabase(table, orderData) {
  const payload = table === 'pedidos_fisica' ? mapFisicaToDb(orderData) : mapDigitalToDb(orderData);
  
  // Intento con SDK si está disponible
  const client = initSupabase();
  if (client) {
    try {
      const { data, error } = await client.from(table).upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn(`Error upsert Supabase SDK [${table}]:`, error);
        // Fallback a REST
        sendSupabaseRest(table, 'POST', payload);
      } else {
        console.log(`✓ Pedido sincronizado en Supabase [${table}]:`, payload.id);
      }
      return;
    } catch (e) {
      console.warn('Excepción en syncOrderToSupabase:', e);
    }
  }

  // Fallback REST nativo
  sendSupabaseRest(table, 'POST', payload);
}

// Actualizar Campos en Supabase
async function updateSupabaseDocument(table, id, updates) {
  const dbUpdates = {};
  if (updates.estadoPago !== undefined) dbUpdates.estado_pago = updates.estadoPago;
  if (updates.estadoDespacho !== undefined) dbUpdates.estado_despacho = updates.estadoDespacho;
  if (updates.numeroGuia !== undefined) dbUpdates.numero_guia = updates.numeroGuia;
  if (updates.enviado !== undefined) dbUpdates.enviado = updates.enviado;
  if (updates.fechaEnvio !== undefined) dbUpdates.fecha_envio = updates.fechaEnvio;
  if (updates.enviadoPor !== undefined) dbUpdates.enviado_por = updates.enviadoPor;

  const client = initSupabase();
  if (client) {
    try {
      const { error } = await client.from(table).update(dbUpdates).eq('id', id);
      if (!error) return;
    } catch (e) {}
  }

  // Fallback REST
  sendSupabaseRest(`${table}?id=eq.${encodeURIComponent(id)}`, 'PATCH', dbUpdates);
}

// Eliminar Registro en Supabase
async function deleteSupabaseDocument(table, id) {
  const client = initSupabase();
  if (client) {
    try {
      const { error } = await client.from(table).delete().eq('id', id);
      if (!error) return;
    } catch (e) {}
  }

  // Fallback REST
  sendSupabaseRest(`${table}?id=eq.${encodeURIComponent(id)}`, 'DELETE');
}

// Descargar Órdenes remotas desde Supabase y actualizar LocalStorage
async function fetchOrdersFromSupabase() {
  try {
    const [fisicaRes, digitalRes] = await Promise.all([
      sendSupabaseRest('pedidos_fisica?select=*&order=created_at.desc', 'GET'),
      sendSupabaseRest('pedidos_digital?select=*&order=created_at.desc', 'GET')
    ]);

    let updated = false;

    if (Array.isArray(fisicaRes)) {
      const remoteFisica = fisicaRes.map(mapFisicaFromDb);
      const localFisica = getPhysicalOrders();
      // Fusionar manteniendo únicos por id
      const mergedMap = new Map();
      remoteFisica.forEach(o => mergedMap.set(o.id, o));
      localFisica.forEach(o => { if (!mergedMap.has(o.id)) mergedMap.set(o.id, o); });
      localStorage.setItem(CLICKAGRO_STORAGE_KEY_FISICA, JSON.stringify(Array.from(mergedMap.values())));
      updated = true;
    }

    if (Array.isArray(digitalRes)) {
      const remoteDigital = digitalRes.map(mapDigitalFromDb);
      const localDigital = getDigitalOrders();
      const mergedMap = new Map();
      remoteDigital.forEach(o => mergedMap.set(o.id, o));
      localDigital.forEach(o => { if (!mergedMap.has(o.id)) mergedMap.set(o.id, o); });
      localStorage.setItem(CLICKAGRO_STORAGE_KEY_DIGITAL, JSON.stringify(Array.from(mergedMap.values())));
      updated = true;
    }

    if (updated) {
      notifyStorageChange();
      console.log('✓ Pedidos sincronizados con Supabase Cloud.');
    }
    return true;
  } catch (err) {
    console.warn('Error al obtener pedidos de Supabase:', err);
    return false;
  }
}

// Suscripción Realtime para actualizar el Panel en Vivo
function subscribeToSupabaseRealtime(callback) {
  const client = initSupabase();
  if (!client || typeof client.channel !== 'function') return null;

  try {
    const channel = client.channel('clickagro-pedidos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_fisica' }, (payload) => {
        console.log('⚡ Cambio en tiempo real (Física):', payload);
        fetchOrdersFromSupabase().then(() => { if (typeof callback === 'function') callback(); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_digital' }, (payload) => {
        console.log('⚡ Cambio en tiempo real (Digital):', payload);
        fetchOrdersFromSupabase().then(() => { if (typeof callback === 'function') callback(); });
      })
      .subscribe((status) => {
        console.log('Estado de conexión Realtime Supabase:', status);
      });

    return channel;
  } catch (e) {
    console.warn('Error suscribiendo a Realtime:', e);
    return null;
  }
}

// ==========================================
// GESTIÓN LOCAL (LocalStorage + Sincronización)
// ==========================================
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

  // Sincronizar en la nube con Supabase
  syncOrderToSupabase('pedidos_fisica', newOrder);

  return newOrder;
}

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

  // Sincronizar en la nube con Supabase
  syncOrderToSupabase('pedidos_digital', newOrder);

  return newOrder;
}

function updatePhysicalOrderStatus(id, newStatus) {
  const orders = getPhysicalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].estadoPago = newStatus;
    savePhysicalOrders(orders);
    updateSupabaseDocument('pedidos_fisica', id, { estadoPago: newStatus });
    return true;
  }
  return false;
}

function updatePhysicalOrderDispatch(id, dispatchStatus, trackingNumber = '') {
  const orders = getPhysicalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].estadoDespacho = dispatchStatus;
    if (trackingNumber !== undefined) {
      orders[index].numeroGuia = trackingNumber;
    }
    savePhysicalOrders(orders);
    updateSupabaseDocument('pedidos_fisica', id, {
      estadoDespacho: dispatchStatus,
      numeroGuia: orders[index].numeroGuia
    });
    return true;
  }
  return false;
}

function updateDigitalOrderStatus(id, newStatus) {
  const orders = getDigitalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].estadoPago = newStatus;
    saveDigitalOrders(orders);
    updateSupabaseDocument('pedidos_digital', id, { estadoPago: newStatus });
    return true;
  }
  return false;
}

function markDigitalOrderSent(id, adminEmail) {
  const orders = getDigitalOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].enviado = true;
    orders[index].fechaEnvio = formatCurrentDateTime();
    orders[index].enviadoPor = adminEmail || 'Admin Click Agro';
    saveDigitalOrders(orders);
    updateSupabaseDocument('pedidos_digital', id, {
      enviado: true,
      fechaEnvio: orders[index].fechaEnvio,
      enviadoPor: orders[index].enviadoPor
    });
    return orders[index];
  }
  return null;
}

function deleteOrder(type, id) {
  if (type === 'fisica') {
    const orders = getPhysicalOrders().filter(o => o.id !== id);
    savePhysicalOrders(orders);
    deleteSupabaseDocument('pedidos_fisica', id);
    return true;
  } else if (type === 'digital') {
    const orders = getDigitalOrders().filter(o => o.id !== id);
    saveDigitalOrders(orders);
    deleteSupabaseDocument('pedidos_digital', id);
    return true;
  }
  return false;
}

function resetDemoData() {
  localStorage.setItem(CLICKAGRO_STORAGE_KEY_FISICA, JSON.stringify(INITIAL_DEMO_FISICA));
  localStorage.setItem(CLICKAGRO_STORAGE_KEY_DIGITAL, JSON.stringify(INITIAL_DEMO_DIGITAL));
  notifyStorageChange();
}

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

function notifyStorageChange() {
  window.dispatchEvent(new CustomEvent('clickagro-orders-updated'));
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

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
