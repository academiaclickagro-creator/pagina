// api/send-agenda.js - Envío de Agenda Agro 2027 Digital por correo con Resend

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kigeuajghtzzzyfkljrs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_Re59yb6lwFXIIJFAFVHUkg_H2iAChlu';

async function updateOrderSentStatusInSupabase(pedidoId, adminEmail = 'Resend API') {
  try {
    const url = `${SUPABASE_URL}/rest/v1/pedidos_digital?id=eq.${encodeURIComponent(pedidoId)}`;
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    const body = JSON.stringify({
      enviado: true,
      fecha_envio: nowIso,
      enviado_por: adminEmail
    });

    const resp = await fetch(url, { method: 'PATCH', headers, body });
    if (!resp.ok) {
      const errText = await resp.text();
      console.warn(`Supabase update error en send-agenda [${pedidoId}]:`, errText);
    }
  } catch (err) {
    console.warn('Error actualizando estado en Supabase:', err.message);
  }
}

function updateOrderSentStatusInMemory(pedidoId) {
  if (global.__CLICKAGRO_PEDIDOS_MEMORIA__ && Array.isArray(global.__CLICKAGRO_PEDIDOS_MEMORIA__.digital)) {
    const order = global.__CLICKAGRO_PEDIDOS_MEMORIA__.digital.find(o => o.id === pedidoId);
    if (order) {
      order.enviado = true;
      order.fechaEnvio = new Date().toISOString().replace('T', ' ').substring(0, 16);
      order.enviadoPor = 'info@academiaclickagro.com.ar';
    }
  }
}

export default async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido. Use POST.' });
  }

  try {
    const {
      email,
      nombre,
      pedidoId,
      buyerEmail,
      buyerName,
      orderId,
      apiKey
    } = req.body || {};

    const targetEmail = (email || buyerEmail || '').trim();
    const targetNombre = (nombre || buyerName || 'Productor Agropecuario').trim();
    const targetPedidoId = (pedidoId || orderId || 'DIG-000').trim();

    if (!targetEmail) {
      return res.status(400).json({ success: false, error: 'El email del destinatario es obligatorio.' });
    }

    const effectiveResendKey = (process.env.RESEND_API_KEY || apiKey || '').trim();

    if (!effectiveResendKey) {
      return res.status(400).json({
        success: false,
        error: 'No se encontró la clave RESEND_API_KEY configurada en el entorno de Vercel.'
      });
    }

    const pdfUrl = 'https://academiaclickagro.com.ar/agenda/Agenda%20agro%202027.pdf';
    const pdfName = 'Agenda agro 2027.pdf';
    const subject = '🌾 Tu Agenda Agro 2027 Digital ya está lista · Click Agro';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <!-- Encabezado Click Agro -->
        <div style="background: linear-gradient(135deg, #113322 0%, #1e3d2f 100%); padding: 32px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">Click Agro</h1>
          <p style="color: #86efac; margin: 8px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
            Educación, Gestión y Soluciones Agropecuarias
          </p>
        </div>

        <!-- Cuerpo del Correo -->
        <div style="padding: 34px 30px; color: #1f2937; line-height: 1.6;">
          <h2 style="color: #1e3d2f; font-size: 22px; margin-top: 0; font-weight: 700;">¡Hola ${targetNombre}!</h2>
          <p style="font-size: 16px; color: #374151;">
            ¡Muchas gracias por confiar en <strong>Click Agro</strong> para potenciar y organizar la gestión de tu campo!
          </p>
          <p style="font-size: 15px; color: #4b5563;">
            Te confirmamos la entrega de tu <strong>Agenda Agro 2027 (Edición Digital Interactiva)</strong>.
          </p>
          
          <!-- Caja de Descarga del PDF -->
          <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 14px; padding: 26px 20px; text-align: center; margin: 28px 0;">
            <p style="margin: 0 0 6px 0; font-weight: 800; color: #166534; font-size: 17px;">
              📄 Archivo Listo para Descargar
            </p>
            <p style="margin: 0 0 18px 0; color: #4b5563; font-size: 14px;">
              Formato PDF Interactivo de Alta Resolución (8.3 MB)
            </p>
            <a href="${pdfUrl}" target="_blank" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 15px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(22,163,74,0.35);">
              📥 Descargar Agenda agro 2027.pdf
            </a>
          </div>

          <!-- Instructivo -->
          <h3 style="color: #1e3d2f; font-size: 17px; margin-top: 25px; margin-bottom: 12px; font-weight: 700;">
            📱 ¿Cómo empezar a usarla en tu tablet?
          </h3>
          <ul style="color: #4b5563; font-size: 14px; padding-left: 20px; margin-bottom: 25px;">
            <li style="margin-bottom: 8px;">Descargá el archivo y abrilo en <strong>Goodnotes, Samsung Notes, Notability</strong> o cualquier visor de PDF.</li>
            <li style="margin-bottom: 8px;">Navegá fluidamente entre solapas, lluvias, lotes, caravanas y campañas tocando los hipervínculos interactivos.</li>
            <li>Completá las planillas con tu lápiz óptico o teclado.</li>
          </ul>

          <div style="background: #f8fafc; border-left: 4px solid #1e3d2f; padding: 14px 18px; border-radius: 0 8px 8px 0; font-size: 13px; color: #475569;">
            <strong>Referencia de Pedido:</strong> ${targetPedidoId}<br>
            <strong>Destinatario:</strong> ${targetEmail}
          </div>
        </div>

        <!-- Footer del Correo -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
          <strong>Click Agro</strong> · Saladillo, Provincia de Buenos Aires, Argentina<br>
          WhatsApp de Soporte: <strong>+54 11 2366-3993</strong> · <a href="https://academiaclickagro.com.ar" style="color: #16a34a; text-decoration: none; font-weight: 600;">academiaclickagro.com.ar</a>
        </div>
      </div>
    `;

    // Intentar envío con remitente oficial
    let primaryFrom = 'Click Agro <info@academiaclickagro.com.ar>';
    let fallbackFrom = 'Click Agro <onboarding@resend.dev>';

    let resendPayload = {
      from: primaryFrom,
      reply_to: 'academiaclickagro@gmail.com',
      to: [targetEmail],
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: pdfName,
          path: pdfUrl
        }
      ]
    };

    let resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveResendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload)
    });

    let resendData = await resendResponse.json().catch(() => ({}));

    // Si Resend rechaza el dominio porque aún no está verificado en resend.com, intentar fallback a onboarding@resend.dev
    if (!resendResponse.ok && resendData.message && (resendData.message.includes('domain is not verified') || resendData.message.includes('verify a domain') || resendData.message.includes('unverified'))) {
      console.warn('Dominio info@academiaclickagro.com.ar no verificado en Resend. Reintentando con onboarding@resend.dev...');
      resendPayload.from = fallbackFrom;
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveResendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resendPayload)
      });
      resendData = await resendResponse.json().catch(() => ({}));
    }

    if (!resendResponse.ok) {
      let errorMsg = resendData.message || 'Error en Resend API al enviar el correo.';
      let isTestModeRestriction = false;

      if (typeof errorMsg === 'string' && errorMsg.includes('own email address')) {
        isTestModeRestriction = true;
        errorMsg = 'Resend (Modo Prueba): Tu cuenta de Resend solo permite enviar correos a tu propia casilla de registro (academiaclickagro@gmail.com). Para despachar a clientes automáticamente, debes verificar el dominio academiaclickagro.com.ar en resend.com/domains. Mientras tanto, puedes despachar este pedido inmediatamente usando Gmail Oficial o WhatsApp.';
      } else if (typeof errorMsg === 'string' && (errorMsg.includes('domain is not verified') || errorMsg.includes('verify a domain') || errorMsg.includes('unverified'))) {
        errorMsg = 'El remitente requiere que el dominio academiaclickagro.com.ar esté verificado en resend.com/domains.';
      }

      console.warn('Aviso Resend API:', errorMsg);

      // Responder con status 200 y success: false para gestión controlada en el panel
      return res.status(200).json({
        success: false,
        error: errorMsg,
        isTestModeRestriction: isTestModeRestriction,
        details: resendData
      });
    }

    // Al enviarse exitosamente, marcar el estado del pedido como enviado (enviado: true)
    updateOrderSentStatusInMemory(targetPedidoId);
    await updateOrderSentStatusInSupabase(targetPedidoId, 'info@academiaclickagro.com.ar');

    console.log(`✓ Agenda Agro 2027 enviada exitosamente a ${targetEmail} (Pedido: ${targetPedidoId})`);

    return res.status(200).json({
      success: true,
      message: `Agenda Agro 2027 enviada exitosamente a ${targetEmail}`,
      pedidoId: targetPedidoId,
      resendId: resendData.id
    });

  } catch (error) {
    console.error('Error no controlado en /api/send-agenda:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
