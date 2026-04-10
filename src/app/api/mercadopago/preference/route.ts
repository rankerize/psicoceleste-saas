import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';

// Inicializar configuración de MP (con el access token alojado en env server)
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

export async function POST(req: Request) {
  try {
    const { plan, userId, email, nombre } = await req.json();

    if (!MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Falta MERCADOPAGO_ACCESS_TOKEN' }, { status: 500 });
    }

    if (!userId || !plan) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (userId, plan)' }, { status: 400 });
    }

    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN, options: { timeout: 5000 } });
    const preference = new Preference(client);

    let price = 0;
    let title = '';
    
    if (plan === 'starter') {
      price = 50000;
      title = 'Plan Starter - 100 Baterías PsicoCeleste';
    } else if (plan === 'pro') {
      price = 150000;
      title = 'Plan Pro - Baterías Ilimitadas (1 Mes)';
    } else {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    // El webhook notificará nuestro servidor, pero necesitamos identificar 
    // al usuario y qué compró. Usaremos external_reference y metadata.
    const body = {
      items: [
        {
          id: plan,
          title,
          quantity: 1,
          currency_id: 'COP',
          unit_price: price,
        }
      ],
      payer: {
        email,
        name: nombre,
      },
      external_reference: userId, // Útil para identificar el usuario en el webhook
      metadata: {
        userId,
        plan
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?pago=exitoso`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion?pago=pendiente`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion?pago=fallido`,
      },
      auto_return: 'approved',
      // En producción la URL del webhook debe ser pública (ej. via Vercel o ngrok)
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
    };

    // Crear la preferencia
    const response = await preference.create({ body });

    return NextResponse.json({ preferenceId: response.id });
  } catch (error: any) {
    console.error('Error al crear preferencia de MercadoPago:', error);
    return NextResponse.json({ error: 'No se pudo crear la preferencia de pago', details: error.message }, { status: 500 });
  }
}
