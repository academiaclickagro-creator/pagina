/**
 * Click Agro - Despachador de Correos para Agenda Digital
 * Envío mediante API Serverless (Resend) + Redirección directa por Gmail Oficial
 */

const ClickAgroMailer = {
  // Generar URLs y contenidos del correo
  buildEmailData(order, adminUser) {
    const config = typeof getClickAgroConfig === 'function' ? getClickAgroConfig() : {};
    const buyerEmail = order.email;
    const buyerName = order.nombre || 'Productor Agropecuario';
    const pdfUrl = config.pdfUrl || 'https://academiaclickagro.com.ar/agenda/Agenda%20agro%202027.pdf';
    const pdfName = config.pdfFileName || 'Agenda agro 2027.pdf';

    const subject = `🌾 Tu Agenda Agro 2027 Digital ya está lista · Click Agro`;
    const messageBodyText = `¡Hola ${buyerName}!

¡Muchas gracias por confiar en Click Agro para potenciar la gestión y planificación de tu campo!

Te confirmamos la entrega de tu Agenda Agro 2027 (Edición Digital Interactiva).

📄 Tu archivo interactivo: "${pdfName}" (8.3 MB)
Podés descargarlo de forma directa e inmediata desde este enlace seguro oficial:
${pdfUrl}

📱 Instructivo de Inicio Rápido:
1. Descargá el archivo en tu tablet (iPad, Samsung Galaxy Tab, Xiaomi o Lenovo).
2. Abrilo en tu aplicación favorita de notas y PDFs (Goodnotes, Samsung Notes, Notability, Acrobat Reader).
3. ¡Utilizá las solapas e hipervínculos interactivos para saltar entre los registros de lluvias, campañas agrícolas, hacienda, caravanas y planificador diario con un simple toque!

📋 Datos de tu Pedido:
• Código de Pedido: ${order.id}
• Fecha: ${order.fecha}
• Modalidad: ${order.cuotas || 'Edición Digital $50.000'}

Por cualquier consulta técnica o duda con tu agenda, estamos a tu disposición por WhatsApp al +54 11 2366-3993.

¡Te deseamos una excelente y muy productiva campaña 2027!

Atentamente,
Equipo de Click Agro Argentina
Saladillo, Provincia de Buenos Aires
https://academiaclickagro.com.ar`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(buyerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBodyText)}`;
    const mailtoUrl = `mailto:${encodeURIComponent(buyerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBodyText)}`;
    const wspUrl = `https://wa.me/${(order.tel || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${buyerName}! Te enviamos el enlace para descargar tu Agenda Agro 2027 Digital: ${pdfUrl}`)}`;

    return {
      buyerEmail,
      buyerName,
      pdfUrl,
      pdfName,
      subject,
      messageBodyText,
      gmailUrl,
      mailtoUrl,
      wspUrl
    };
  },

  // Enviar correo de entrega de la Agenda Digital
  async sendDigitalAgendaEmail(order, adminUser) {
    const config = typeof getClickAgroConfig === 'function' ? getClickAgroConfig() : {};
    const emailData = this.buildEmailData(order, adminUser);
    const apiKey = config.emailService?.apiKey || '';

    // 1. Si hay API Key de Resend, intentar envío serverless automático
    if (apiKey) {
      try {
        const resp = await fetch('/api/send-agenda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerEmail: emailData.buyerEmail,
            buyerName: emailData.buyerName,
            orderId: order.id,
            apiKey: apiKey,
            senderEmail: config.emailService?.senderEmail
          })
        });

        const data = await resp.json().catch(() => null);

        if (resp.ok && data && data.success) {
          return {
            success: true,
            provider: 'resend-api',
            message: `Correo despachado automáticamente a ${emailData.buyerEmail}`,
            ...emailData
          };
        } else {
          const reasonText = (data && data.error) ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) : (apiKey ? 'Error en API Resend' : 'Sin API Key configurada');
          console.warn('Aviso API Resend:', reasonText);
          return {
            success: false,
            needManualSend: true,
            reason: reasonText,
            ...emailData
          };
        }
      } catch (err) {
        console.warn('No se pudo conectar con /api/send-agenda:', err);
      }
    }

    // 2. Si no hay API key configurada o falló el envío serverless:
    // Retornar indicando que requiere acción directa (abrir Gmail / Webmail)
    return {
      success: false,
      needManualSend: true,
      reason: apiKey ? 'Error en API Resend' : 'Sin API Key configurada',
      ...emailData
    };
  }
};
