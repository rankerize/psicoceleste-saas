import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

export async function POST(req: Request) {
  try {
    // MercadoPago puede enviar los datos en URL o en body
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    
    // El formato del webhook o IPN Notification indica action, type, id.
    // Dependiendo si es Webhook o IPN, 'type' puede ser 'payment' o la url tener 'topic=payment'.
    const type = url.searchParams.get('type') || body.type;
    const topic = url.searchParams.get('topic');
    const paymentId = url.searchParams.get('data.id') || body.data?.id || url.searchParams.get('id');

    if (type !== 'payment' && topic !== 'payment') {
      return new NextResponse('Ignored', { status: 200 }); // Ignoramos eventos que no sean de pagos
    }

    if (!paymentId) {
      return new NextResponse('Missing payment ID', { status: 400 });
    }

    if (!MP_ACCESS_TOKEN) {
      console.error('Falta MERCADOPAGO_ACCESS_TOKEN en el entorno');
      return new NextResponse('Server Error', { status: 500 });
    }

    // Inicializar MP
    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN, options: { timeout: 5000 } });
    const paymentClient = new Payment(client);

    // Obtener los detalles reales del pago desde MercadoPago (seguridad vital)
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment || !payment.date_approved) {
      return new NextResponse('Pago no aprobado aún', { status: 200 });
    }

    if (payment.status === 'approved') {
       // El external_reference tiene el userId, o podemos sacarlo de metadata
       const userId = payment.external_reference || (payment.metadata && (payment.metadata as any).userId);
       const planComprado = payment.metadata && (payment.metadata as any).plan; // 'starter' o 'pro'

       if (!userId) {
         console.error('No se encontro external_reference/userId en el pago:', paymentId);
         return new NextResponse('Falta UserId', { status: 400 });
       }

       // Actualizar en Firestore el perfil de la empresa/usuario
       try {
         const userRef = doc(db, 'users', userId);
         const userSnap = await getDoc(userRef);

         if (userSnap.exists()) {
           const userData = userSnap.data();
           
           if (planComprado === 'starter') {
             // Sumamos 100 baterías al límite actual
             const limiteActual = typeof userData.baterias_limite === 'number' ? userData.baterias_limite : 0;
             await updateDoc(userRef, {
               plan: 'starter',
               baterias_limite: limiteActual + 100
             });
             console.log(`Usuario ${userId} actualizado a plan starter (+100 baterias)`);
           } else if (planComprado === 'pro') {
             await updateDoc(userRef, {
               plan: 'pro',
               baterias_limite: 'ilimitado'
             });
             console.log(`Usuario ${userId} actualizado a plan PRO`);
           }

           // Opcional: registrar el movimiento (transacción) en una subcolección
         }
       } catch (dbError) {
         console.error('Error actualizando Firestore en webhook:', dbError);
         // Podría fallar por permisos en cliente si no usamos firebase-admin
       }
    }

    return new NextResponse('Notificación procesada exitosamente', { status: 200 });

  } catch (error: any) {
    console.error('Error critico en Webhook MercadoPago:', error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
