// api/pedidos.js - Endpoint Serverless en Vercel para Click Agro (Agenda Agro 2027)

// Memoria persistente en el contexto de ejecución Serverless (reutilizado entre invocaciones cálidas)
global.__CLICKAGRO_PEDIDOS_MEMORIA__ = global.__CLICKAGRO_PEDIDOS_MEMORIA__ || {
  fisica: [
    {
      id: 'FIS-1727601001',
      fecha: '2026-09-28 14:32',
      nombre: 'Juan Bautista Echeverría',
      dni: '28.450.912',
      telefono: '+54 9 2344 421099',
      tel: '+54 9 2344 421099',
      email: 'jbecheverria@campoagro.com.ar',
      direccion: 'Ruta 205 Km 182, Campo El Trébol',
      localidad: 'Saladillo',
      ciudad: 'Saladillo',
      provincia: 'Buenos Aires',
      cp: '7260',
      notas: 'Dejar en tranquera blanca con encargado Pedro.',
      cuotas: '1 pago de $150.000',
      monto: 150000,
      tipo: 'fisica',
      estadoPago: 'Confirmado',
      estadoDespacho: 'En preparación',
      numeroGuia: 'AR-7260-9921'
    }
  ],
  digital: [
    {
      id: 'DIG-1727603100',
      fecha: '2026-09-28 15:10',
      nombre: 'Ing. Agr. Florencia Morresi',
      email: 'florencia.morresi@gmail.com',
      telefono: '+54 9 236 4658901',
      tel: '+54 9 236 4658901',
      cuotas: '1 pago de $50.000',
      monto: 50000,
      tipo: 'digital',
      estadoPago: 'Confirmado',
      enviado: true,
      fechaEnvio: '2026-09-28 15:45'
    },
    {
      id: 'DIG-1727604500',
      fecha: '2026-09-28 17:22',
      nombre: 'Esteban Di Marco',
      email: 'estebandimarco.agro@yahoo.com.ar',
      telefono: '+54 9 11 5894 1234',
      tel: '+54 9 11 5894 1234',
      cuotas: '2 cuotas de $25.000',
      monto: 50000,
      tipo: 'digital',
      estadoPago: 'Confirmado',
      enviado: false,
      fechaEnvio: null
    }
  ]
};

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kigeuajghtzzzyfkljrs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_Re59yb6lwFXIIJFAFVHUkg_H2iAChlu';

// Helper para llamadas REST directas a Supabase
async function querySupabase(endpoint, method = 'GET', body = null) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const resp = await fetch(url, options);
    if (!resp.ok) {
      const errText = await resp.text();
      console.warn(`Supabase REST [${method} ${endpoint}] ${resp.status}:`, errText);
      return null;
    }
    return await resp.json().catch(() => null);
  } catch (err) {
    console.warn(`Error de conexión con Supabase REST (${endpoint}):`, err.message);
    return null;
  }
}

export default async function handler(req, res) {
  // Cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // -------------------------------------------------------------
  // MÉTODO DELETE: Limpiar completamente la base de datos y memoria
  // -------------------------------------------------------------
  if (req.method === 'DELETE') {
    try {
      global.__CLICKAGRO_PEDIDOS_MEMORIA__ = { fisica: [], digital: [] };

      // Ejecutar borrado en Supabase
      await Promise.allSettled([
        querySupabase('pedidos_fisica?id=not.is.null', 'DELETE'),
        querySupabase('pedidos_digital?id=not.is.null', 'DELETE'),
        querySupabase('pedidos_fisica?id=neq._none_', 'DELETE'),
        querySupabase('pedidos_digital?id=neq._none_', 'DELETE')
      ]);

      // Verificación de vaciado
      const [checkF, checkD] = await Promise.all([
        querySupabase('pedidos_fisica?select=id'),
        querySupabase('pedidos_digital?select=id')
      ]);

      const remF = Array.isArray(checkF) ? checkF.length : 0;
      const remD = Array.isArray(checkD) ? checkD.length : 0;

      return res.status(200).json({
        success: remF === 0 && remD === 0,
        verified: true,
        remainingFisica: remF,
        remainingDigital: remD,
        message: remF === 0 && remD === 0
          ? 'Base de datos en Supabase y memoria reseteadas a 0 correctamente.'
          : `Atención: Quedan ${remF} físicos y ${remD} digitales en Supabase.`
      });
    } catch (err) {
      console.error('Error en DELETE /api/pedidos:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // -------------------------------------------------------------
  // MÉTODO GET: Consulta de pedidos desde el Panel de Administración
  // Query: ?tipo=fisica | ?tipo=digital
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const tipo = (req.query.tipo || '').toLowerCase();

      // Consultar pedidos físicos
      if (tipo === 'fisica') {
        const dbRows = await querySupabase('pedidos_fisica?select=*&order=created_at.desc');
        let pedidos = [];
        if (Array.isArray(dbRows)) {
          // Si dbRows es array (incluso vacío []), retornar los registros reales de la BD
          pedidos = dbRows.map(row => ({
            id: row.id,
            fecha: row.fecha || '',
            nombre: row.nombre || '',
            dni: row.dni || '',
            telefono: row.tel || '',
            tel: row.tel || '',
            email: row.email || '',
            direccion: row.direccion || '',
            localidad: row.ciudad || '',
            ciudad: row.ciudad || '',
            provincia: row.provincia || '',
            cp: row.cp || '',
            notas: row.notas || '',
            cuotas: row.cuotas || '1 pago de $150.000',
            monto: Number(row.monto) || 150000,
            tipo: 'fisica',
            estadoPago: row.estado_pago || 'Registrado',
            estadoDespacho: row.estado_despacho || 'Pendiente',
            numeroGuia: row.numero_guia || ''
          }));
        } else {
          // Solo fallback si falló la conexión con Supabase
          pedidos = global.__CLICKAGRO_PEDIDOS_MEMORIA__.fisica || [];
        }

        return res.status(200).json({
          success: true,
          tipo: 'fisica',
          total: pedidos.length,
          pedidos
        });
      }

      // Consultar pedidos digitales
      if (tipo === 'digital') {
        const dbRows = await querySupabase('pedidos_digital?select=*&order=created_at.desc');
        let pedidos = [];
        if (Array.isArray(dbRows)) {
          // Si dbRows es array (incluso vacío []), retornar los registros reales de la BD
          pedidos = dbRows.map(row => ({
            id: row.id,
            fecha: row.fecha || '',
            nombre: row.nombre || '',
            email: row.email || '',
            telefono: row.tel || '',
            tel: row.tel || '',
            cuotas: row.cuotas || '1 pago de $50.000',
            monto: Number(row.monto) || 50000,
            tipo: 'digital',
            estadoPago: row.estado_pago || 'Registrado',
            enviado: Boolean(row.enviado),
            fechaEnvio: row.fecha_envio || null,
            enviadoPor: row.enviado_por || null
          }));
        } else {
          pedidos = global.__CLICKAGRO_PEDIDOS_MEMORIA__.digital || [];
        }

        return res.status(200).json({
          success: true,
          tipo: 'digital',
          total: pedidos.length,
          pedidos
        });
      }

      // Si no se especifica tipo, retornar ambos consultando Supabase
      const [rowsFisica, rowsDigital] = await Promise.all([
        querySupabase('pedidos_fisica?select=*&order=created_at.desc'),
        querySupabase('pedidos_digital?select=*&order=created_at.desc')
      ]);

      const pedidosFisica = Array.isArray(rowsFisica)
        ? rowsFisica.map(row => ({
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
            tipo: 'fisica',
            estadoPago: row.estado_pago || 'Registrado',
            estadoDespacho: row.estado_despacho || 'Pendiente',
            numeroGuia: row.numero_guia || ''
          }))
        : (global.__CLICKAGRO_PEDIDOS_MEMORIA__.fisica || []);

      const pedidosDigital = Array.isArray(rowsDigital)
        ? rowsDigital.map(row => ({
            id: row.id,
            fecha: row.fecha || '',
            nombre: row.nombre || '',
            email: row.email || '',
            tel: row.tel || '',
            cuotas: row.cuotas || '1 pago de $50.000',
            monto: Number(row.monto) || 50000,
            tipo: 'digital',
            estadoPago: row.estado_pago || 'Registrado',
            enviado: Boolean(row.enviado),
            fechaEnvio: row.fecha_envio || null,
            enviadoPor: row.enviado_por || null
          }))
        : (global.__CLICKAGRO_PEDIDOS_MEMORIA__.digital || []);

      return res.status(200).json({
        success: true,
        pedidos: {
          fisica: pedidosFisica,
          digital: pedidosDigital
        }
      });
    } catch (err) {
      console.error('Error en GET /api/pedidos:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // -------------------------------------------------------------
  // MÉTODO POST: Registro de compra desde la web
  // Body: { nombre, email, telefono, tipo, direccion, localidad, provincia, cp, notas, ... }
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    try {
      const data = req.body || {};
      const {
        nombre,
        email,
        telefono,
        tel,
        tipo,
        direccion,
        localidad,
        ciudad,
        provincia,
        cp,
        notas,
        dni,
        cuotas,
        monto
      } = data;

      const finalTel = (telefono || tel || '').trim();
      const finalEmail = (email || '').trim();
      const finalNombre = (nombre || '').trim();
      const finalTipo = (tipo || 'digital').toLowerCase();

      // Validaciones básicas
      if (!finalNombre) {
        return res.status(400).json({ success: false, error: 'El nombre es obligatorio.' });
      }
      if (!finalTel) {
        return res.status(400).json({ success: false, error: 'El teléfono es obligatorio.' });
      }

      const timestamp = new Date();
      const fechaFormatted = timestamp.toISOString().replace('T', ' ').substring(0, 16);
      const uniqueSuffix = Date.now().toString().slice(-6);

      let nuevoPedido = null;

      if (finalTipo === 'fisica') {
        const orderId = `FIS-${uniqueSuffix}`;
        const dirEnvio = (direccion || '').trim();
        const locEnvio = (localidad || ciudad || '').trim();
        const provEnvio = (provincia || '').trim();
        const cpEnvio = (cp || '').trim();

        if (!dirEnvio || !locEnvio || !provEnvio || !cpEnvio) {
          return res.status(400).json({
            success: false,
            error: 'Para la edición física se requiere dirección, localidad, provincia y código postal.'
          });
        }

        nuevoPedido = {
          id: orderId,
          fecha: fechaFormatted,
          nombre: finalNombre,
          dni: (dni || '').trim(),
          telefono: finalTel,
          tel: finalTel,
          email: finalEmail,
          direccion: dirEnvio,
          localidad: locEnvio,
          ciudad: locEnvio,
          provincia: provEnvio,
          cp: cpEnvio,
          notas: (notas || '').trim(),
          cuotas: cuotas || '1 pago de $150.000',
          monto: Number(monto) || 150000,
          tipo: 'fisica',
          estadoPago: 'Registrado',
          estadoDespacho: 'Pendiente',
          numeroGuia: '',
          origen: 'web'
        };

        // Guardar en memoria persistente
        global.__CLICKAGRO_PEDIDOS_MEMORIA__.fisica.unshift(nuevoPedido);

        // Guardar en Supabase PostgreSQL
        const dbPayload = {
          id: nuevoPedido.id,
          fecha: nuevoPedido.fecha,
          nombre: nuevoPedido.nombre,
          dni: nuevoPedido.dni || 'No especificado',
          tel: nuevoPedido.tel,
          email: nuevoPedido.email || null,
          direccion: nuevoPedido.direccion,
          ciudad: nuevoPedido.ciudad,
          provincia: nuevoPedido.provincia,
          cp: nuevoPedido.cp,
          notas: nuevoPedido.notas || null,
          cuotas: nuevoPedido.cuotas,
          monto: nuevoPedido.monto,
          estado_pago: nuevoPedido.estadoPago,
          estado_despacho: nuevoPedido.estadoDespacho,
          numero_guia: '',
          origen: 'web'
        };

        await querySupabase('pedidos_fisica', 'POST', dbPayload);

      } else {
        // Pedido Digital
        if (!finalEmail) {
          return res.status(400).json({ success: false, error: 'El email es obligatorio para la edición digital.' });
        }

        const orderId = `DIG-${uniqueSuffix}`;
        nuevoPedido = {
          id: orderId,
          fecha: fechaFormatted,
          nombre: finalNombre,
          email: finalEmail,
          telefono: finalTel,
          tel: finalTel,
          cuotas: cuotas || '1 pago de $50.000',
          monto: Number(monto) || 50000,
          tipo: 'digital',
          estadoPago: 'Registrado',
          enviado: false,
          fechaEnvio: null,
          enviadoPor: null,
          origen: 'web'
        };

        // Guardar en memoria persistente
        global.__CLICKAGRO_PEDIDOS_MEMORIA__.digital.unshift(nuevoPedido);

        // Guardar en Supabase PostgreSQL
        const dbPayload = {
          id: nuevoPedido.id,
          fecha: nuevoPedido.fecha,
          nombre: nuevoPedido.nombre,
          email: nuevoPedido.email,
          tel: nuevoPedido.tel,
          cuotas: nuevoPedido.cuotas,
          monto: nuevoPedido.monto,
          estado_pago: nuevoPedido.estadoPago,
          enviado: false,
          fecha_envio: null,
          enviado_por: null,
          origen: 'web'
        };

        await querySupabase('pedidos_digital', 'POST', dbPayload);
      }

      console.log(`✓ Pedido registrado exitosamente [${finalTipo}]: ${nuevoPedido.id}`);

      return res.status(200).json({
        success: true,
        message: 'Pedido registrado con éxito.',
        pedido: nuevoPedido
      });
    } catch (err) {
      console.error('Error registrando pedido en POST /api/pedidos:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido. Use GET o POST.' });
}
