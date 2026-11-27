import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Factura electrónica con Factus (DIAN).
 * Se activa con FACTUS_ENABLED=true. Mientras esté apagada, el pedido queda
 * en invoiceStatus = "pending" y no se llama a ningún servicio externo.
 */

const prisma = new PrismaClient();

const ENABLED = process.env.FACTUS_ENABLED === 'true';
const BASE = (process.env.FACTUS_BASE_URL ?? 'https://api-sandbox.factus.com.co').replace(/\/$/, '');

// Código DIAN del tipo de documento. Verificar en las tablas de referencia de Factus.
const DOC_CODE: Record<string, string> = { CC: '13', CE: '22', NIT: '31', PAS: '41' };

// Mapeo DANE de principales municipios de Colombia para facturación electrónica
const DANE_CITIES: Record<string, string> = {
  bogota: '11001',
  medellin: '05001',
  cali: '76001',
  barranquilla: '08001',
  cartagena: '13001',
  cucuta: '54001',
  bucaramanga: '68001',
  pereira: '66001',
  santa_marta: '47001',
  ibague: '73001',
  pasto: '52001',
  manizales: '17001',
  neiva: '41001',
  villavicencio: '50001',
  armenia: '63001',
  monteria: '23001',
  valledupar: '20001',
  popayan: '19001',
  sincelejo: '70001',
  florencia: '18001',
  tunja: '15001',
  quibdo: '27001',
  riohacha: '44001',
  yopal: '85001',
  soacha: '25754',
  bello: '05088',
  envigado: '05266',
  itagui: '05360',
  floridablanca: '68276',
  palmira: '76520',
};

function getMunicipalityCode(city?: string): string {
  if (!city) return process.env.FACTUS_MUNICIPALITY_CODE ?? '11001';
  const clean = city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_');
  return DANE_CITIES[clean] ?? process.env.FACTUS_MUNICIPALITY_CODE ?? '11001';
}

type InvoiceOrder = Prisma.OrderGetPayload<{ include: { items: true; user: true } }>;

let cachedToken: { token: string; expiresAt: number } | null = null;

function need(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en el backend`);
  return value;
}

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const form = new FormData();
  form.append('grant_type', 'password');
  form.append('client_id', need('FACTUS_CLIENT_ID'));
  form.append('client_secret', need('FACTUS_CLIENT_SECRET'));
  form.append('username', need('FACTUS_USERNAME'));
  form.append('password', need('FACTUS_PASSWORD'));

  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: form,
  });
  if (!res.ok) throw new Error(`Factus autenticación respondió ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

function buildPayload(order: InvoiceOrder) {
  const address = (order.shippingAddress ?? {}) as { address?: string; neighborhood?: string; city?: string };
  const docType = order.customerDocType ?? '';
  const name = order.user?.name ?? 'Cliente';
  const isCompany = docType === 'NIT';

  const items = order.items.map((i) => ({
    code_reference: i.productId,
    name: i.name ?? i.productId,
    quantity: String(i.quantity),
    price: String(i.unitPrice), // precio sin impuesto
    discount_rate: '0',
    unit_measure_code: '94',
    standard_code: '999',
    taxes: [{ code: '01', rate: '19.00' }], // IVA 19% (Colombia)
  }));
  if (order.shippingCost > 0) {
    items.push({
      code_reference: 'ENVIO',
      name: 'Envío',
      quantity: '1',
      price: String(order.shippingCost),
      discount_rate: '0',
      unit_measure_code: '94',
      standard_code: '999',
      taxes: [], // verificar en sandbox si el envío lleva IVA
    });
  }

  const numberingRange = process.env.FACTUS_NUMBERING_RANGE_ID;

  return {
    reference_code: order.orderNumber,
    document: '01',
    operation_type: '10',
    send_email: false,
    ...(numberingRange ? { numbering_range_id: Number(numberingRange) } : {}),
    payment_details: [
      {
        payment_form: '1', // contado
        payment_method_code: process.env.FACTUS_PAYMENT_METHOD_CODE ?? '10',
        amount: String(order.total),
      },
    ],
    customer: {
      identification_document_code: DOC_CODE[docType],
      identification: order.customerDocNumber,
      legal_organization_code: isCompany ? '1' : '2',
      ...(isCompany ? { company: name } : { names: name }),
      tribute_code: 'ZZ',
      responsibilities: ['R-99-PN'],
      email: order.customerEmail ?? order.user?.email ?? undefined,
      phone: order.phone ?? undefined,
      address: [address.address, address.neighborhood].filter(Boolean).join(', ') || 'Sin dirección',
      country_code: 'CO',
      municipality_code: getMunicipalityCode(address.city),
    },
    items,
  };
}

/** Emite la factura del pedido pagado. Nunca lanza: guarda el resultado en el pedido. */
export async function issueInvoice(order: InvoiceOrder): Promise<void> {
  if (!ENABLED) {
    await prisma.order.update({ where: { id: order.id }, data: { invoiceStatus: 'pending' } });
    return;
  }

  try {
    if (!order.customerDocType || !order.customerDocNumber || !DOC_CODE[order.customerDocType]) {
      throw new Error('Falta el documento del cliente');
    }
    const token = await getToken();
    const res = await fetch(`${BASE}/v2/bills/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(buildPayload(order)),
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string; data?: { number?: string } };
    if (!res.ok) throw new Error(body.message ?? `Factus respondió ${res.status}`);

    await prisma.order.update({
      where: { id: order.id },
      data: { invoiceStatus: 'issued', invoiceNumber: body.data?.number ?? null, invoiceError: null },
    });
  } catch (err) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        invoiceStatus: 'error',
        invoiceError: err instanceof Error ? err.message : 'Error desconocido',
      },
    });
  }
}
