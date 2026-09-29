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
      buyerEmail,
      buyerName = 'Productor Agropecuario',
      orderId = 'DIG-000',
      apiKey,
      senderEmail
    } = req.body || {};

    if (!buyerEmail) {
      return res.status(400).json({ success: false, error: 'El email del comprador es obligatorio.' });
    }

    const pdfUrl = 'https://academiaclickagro.com.ar/agenda/Agenda%20agro%202027.pdf';
    const pdfName = 'Agenda agro 2027.pdf';
    const subject = '🌾 Tu Agenda Agro 2027 Digital ya está lista · Click Agro';

    const effectiveResendKey = (apiKey || process.env.RESEND_API_KEY || '').trim();

    if (effectiveResendKey) {
      // Regla de Resend: No permite casillas @gmail.com en el 'from'.
      // Debe ser 'onboarding@resend.dev' o un dominio previamente verificado en Resend.
      let fromAddress = 'Click Agro <onboarding@resend.dev>';
      if (senderEmail && !senderEmail.toLowerCase().includes('@gmail.com') && !senderEmail.toLowerCase().includes('@yahoo.') && !senderEmail.toLowerCase().includes('@hotmail.')) {
        fromAddress = `Click Agro <${senderEmail.trim()}>`;
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: #1e3d2f; padding: 24px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px;">Click Agro</h1>
            <p style="color: #86efac; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Educación, Gestión y Soluciones Agropecuarias</p>
          </div>
          <div style="padding: 30px; color: #1f2937; line-height: 1.6;">
            <h2 style="color: #1e3d2f; font-size: 20px; margin-top: 0;">¡Hola ${buyerName}!</h2>
            <p style="font-size: 16px;">¡Muchas gracias por confiar en <strong>Click Agro</strong> para potenciar la planificación de tu campo!</p>
            <p style="font-size: 15px;">Te confirmamos la entrega de tu <strong>Agenda Agro 2027 (Edición Digital Interactiva)</strong>.</p>
            
            <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #166534; font-size: 16px;">📄 Archivo Listo para Descargar:</p>
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px;">Formato PDF Interactivo de Alta Resolución (8.3 MB)</p>
              <a href="${pdfUrl}" target="_blank" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(22,163,74,0.3);">
                📥 Descargar Agenda agro 2027.pdf
              </a>
            </div>

            <h3 style="color: #1e3d2f; font-size: 16px; margin-top: 25px;">📱 ¿Cómo empezar a usarla?</h3>
            <ul style="color: #4b5563; font-size: 14px; padding-left: 20px;">
              <li>Abrí el archivo en tu tablet con Goodnotes, Samsung Notes, Notability o cualquier lector PDF.</li>
              <li>Navegá entre solapas, meses, lluvias y campañas con un simple toque.</li>
              <li>Completá los checklists con tu lápiz óptico o teclado.</li>
            </ul>

            <div style="background: #f9fafb; border-left: 4px solid #1e3d2f; padding: 12px 16px; margin-top: 20px; font-size: 13px; color: #6b7280;">
              <strong>Referencia de pedido:</strong> ${orderId}
            </div>
          </div>
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            Click Agro · Saladillo, Provincia de Buenos Aires, Argentina<br>
            WhatsApp de Soporte: +54 11 2366-3993 · academiaclickagro.com.ar
          </div>
        </div>
      `;

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveResendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          reply_to: 'academiaclickagro@gmail.com',
          to: [buyerEmail],
          subject: subject,
          html: htmlContent,
          attachments: [
            {
              filename: pdfName,
              path: pdfUrl
            }
          ]
        })
      });

      const resendData = await resendResponse.json().catch(() => ({}));

      if (!resendResponse.ok) {
        let errorMsg = resendData.message || 'Error en Resend API';
        if (typeof resendData.message === 'string') {
          if (resendData.message.includes('own email address')) {
            errorMsg = 'Resend (modo prueba) solo permite enviar correos a la misma casilla con la que creaste tu cuenta en Resend. Para enviar a otros compradores, verifica un dominio propio en resend.com/domains o usa el botón de Gmail Oficial.';
          } else if (resendData.message.includes('domain is not verified') || resendData.message.includes('verify a domain')) {
            errorMsg = 'El remitente debe pertenecer a un dominio verificado en Resend o ser onboarding@resend.dev.';
          }
        }

        return res.status(resendResponse.status).json({
          success: false,
          provider: 'resend',
          error: errorMsg,
          raw: resendData
        });
      }

      return res.status(200).json({
        success: true,
        provider: 'resend',
        id: resendData.id,
        message: `Correo enviado a ${buyerEmail}`
      });
    }

    return res.status(200).json({
      success: false,
      needApiKey: true,
      error: 'No hay una API Key de Resend configurada en el panel.'
    });

  } catch (error) {
    console.error('Error en /api/send-agenda:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
