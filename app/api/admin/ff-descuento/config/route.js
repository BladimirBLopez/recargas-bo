import crypto from 'node:crypto';
import { sql } from '../../../../../lib/db.js';
import { isAdmin } from '../../../../../lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

const manualReady = () => process.env.FF_MANUAL_PAYMENTS_READY === 'true';
const num = (v) => (v === null || v === undefined ? null : Number(v));

async function readAll() {
  const q = sql();
  const cfg = await q`SELECT enabled, open_hour, close_hour, timezone, valid_hours FROM ff_discount_config WHERE id = 1`;
  const prices = await q`SELECT id, base_package_id, label, price, cost, active, sort FROM ff_discount_prices ORDER BY sort, id`;
  return {
    config: cfg[0] || null,
    manualReady: manualReady(),
    prices: prices.map((p) => ({
      id: p.id,
      base_package_id: p.base_package_id,
      label: p.label,
      price: num(p.price),
      cost: num(p.cost),
      active: p.active === true,
      sort: p.sort,
    })),
  };
}

function fail(e, where) {
  console.error('ff config ' + where, e?.code || '', e?.message || '');
  return json({ error: 'db' }, 500);
}

export async function GET(req) {
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  try {
    return json(await readAll());
  } catch (e) {
    return fail(e, 'get');
  }
}

function parseNum(v, current) {
  if (v === undefined) return { ok: true, v: num(current) };
  if (v === null || String(v).trim() === '') return { ok: true, v: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100000) return { ok: false };
  return { ok: true, v: Math.round(n * 100) / 100 };
}


export async function POST(req) {
  if (!await isAdmin(req)) {
    return json({ error: 'no_autorizado' }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }

  const label = String(body?.label ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  if (label.length < 2 || label.length > 40) {
    return json({ error: 'etiqueta_invalida' }, 400);
  }

  const pr = parseNum(body?.price, null);
  const co = parseNum(body?.cost, null);

  if (!pr.ok || !Number.isInteger(pr.v) || pr.v <= 0) {
    return json({ error: 'precio_invalido_activo' }, 400);
  }

  if (!co.ok) {
    return json({ error: 'costo_invalido' }, 400);
  }

  try {
    const q = sql();

    const duplicate = await q`
      SELECT 1 FROM ff_discount_prices
      WHERE lower(trim(label)) = lower(${label})
      LIMIT 1`;

    if (duplicate.length) {
      return json({ error: 'paquete_duplicado' }, 409);
    }

    const id = 'ffd-' + crypto.randomBytes(8).toString('hex');

    await q`
      INSERT INTO ff_discount_prices (
        id, base_package_id, label,
        price, cost, active, sort
      )
      VALUES (
        ${id}, ${null}, ${label},
        ${pr.v}, ${co.v}, false,
        (SELECT COALESCE(MAX(sort), 0) + 10
         FROM ff_discount_prices)
      )`;

    return json(await readAll(), 201);
  } catch (e) {
    if (e?.code === '23505') {
      return json({ error: 'paquete_duplicado' }, 409);
    }
    return fail(e, 'post');
  }
}


export async function DELETE(req) {
  if (!await isAdmin(req)) {
    return json({ error: 'no_autorizado' }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }

  const id = String(body?.id ?? '').trim();

  if (!/^ffd-[a-z0-9-]{1,40}$/.test(id)) {
    return json({ error: 'datos_invalidos' }, 400);
  }

  try {
    const q = sql();

    // Borrado protegido y condicionado.
    // No eliminar paquetes activos ni utilizados.
    const deleted = await q`
      DELETE FROM ff_discount_prices p
      WHERE p.id = ${id}
        AND p.active = false
        AND NOT EXISTS (
          SELECT 1
          FROM ff_discount_requests r
          WHERE r.discount_price_id = p.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM orders o
          WHERE o.game_slug = 'free-fire'
            AND (
              o.package_id = p.id
              OR (
                o.discount = true
                AND p.base_package_id IS NOT NULL
                AND o.package_id = p.base_package_id
              )
            )
        )
      RETURNING p.id`;

    if (deleted.length) {
      return json(await readAll());
    }

    const current = (await q`
      SELECT active
      FROM ff_discount_prices
      WHERE id = ${id}
    `)[0];

    if (!current) {
      return json({ error: 'no_existe' }, 404);
    }

    if (current.active) {
      return json({ error: 'paquete_activo' }, 409);
    }

    return json({ error: 'paquete_en_uso' }, 409);

  } catch (e) {
    if (e?.code === '23503') {
      return json({ error: 'paquete_en_uso' }, 409);
    }
    return fail(e, 'delete');
  }
}

export async function PATCH(req) {
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  try {
    const q = sql();

    if (body?.action === 'config') {
      const cur = (await q`SELECT enabled, open_hour, close_hour, valid_hours FROM ff_discount_config WHERE id = 1`)[0];
      if (!cur) return json({ error: 'sin_config' }, 500);
      const enabled = typeof body.enabled === 'boolean' ? body.enabled : cur.enabled;
      const open = body.open_hour === undefined ? cur.open_hour : Number(body.open_hour);
      const close = body.close_hour === undefined ? cur.close_hour : Number(body.close_hour);
      const valid = body.valid_hours === undefined ? cur.valid_hours : Number(body.valid_hours);
      if (!Number.isInteger(open) || !Number.isInteger(close) || open < 0 || close > 23 || open >= close) {
        return json({ error: 'horario_invalido' }, 400);
      }
      if (!Number.isInteger(valid) || valid < 1 || valid > 168) return json({ error: 'vigencia_invalida' }, 400);
      if (enabled && !cur.enabled) {
        if (!manualReady()) return json({ error: 'cobro_manual_no_configurado' }, 409);
        const n = (await q`SELECT count(*)::int AS n FROM ff_discount_prices WHERE active = true`)[0]?.n || 0;
        if (!n) return json({ error: 'sin_precios_activos' }, 409);
      }
      await q`UPDATE ff_discount_config
        SET enabled = ${enabled}, open_hour = ${open}, close_hour = ${close}, valid_hours = ${valid}, updated_at = now()
        WHERE id = 1`;
      return json(await readAll());
    }

    if (body?.action === 'precio') {
      const id = String(body.id ?? '').trim();
      if (!/^ffd-[a-z0-9-]{1,40}$/.test(id)) return json({ error: 'datos_invalidos' }, 400);
      const cur = (await q`SELECT label, price, cost, active FROM ff_discount_prices WHERE id = ${id}`)[0];
      if (!cur) return json({ error: 'no_existe' }, 404);
      const label = body.label === undefined ? cur.label : String(body.label).replace(/\s+/g, ' ').trim();
      if (label.length < 2 || label.length > 40) return json({ error: 'etiqueta_invalida' }, 400);
      const pr = parseNum(body.price, cur.price);
      const co = parseNum(body.cost, cur.cost);
      if (!pr.ok) return json({ error: 'precio_invalido' }, 400);
      if (!co.ok) return json({ error: 'costo_invalido' }, 400);
      const active = typeof body.active === 'boolean' ? body.active : cur.active === true;
      if (active && !(Number.isInteger(pr.v) && pr.v > 0)) return json({ error: 'precio_invalido_activo' }, 400);
      if (!active && cur.active === true) {
        const s = (await q`SELECT c.enabled AS enabled,
          (SELECT count(*) FROM ff_discount_prices WHERE active = true AND id <> ${id})::int AS otros
          FROM ff_discount_config c WHERE c.id = 1`)[0];
        if (s && s.enabled && !s.otros) return json({ error: 'sin_precios_activos' }, 409);
      }
      await q`UPDATE ff_discount_prices SET label = ${label}, price = ${pr.v}, cost = ${co.v}, active = ${active} WHERE id = ${id}`;
      return json(await readAll());
    }

    return json({ error: 'datos_invalidos' }, 400);
  } catch (e) {
    return fail(e, 'patch');
  }
}
