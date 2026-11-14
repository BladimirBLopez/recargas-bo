'use client';
import { useEffect, useState, useCallback } from 'react';
import { MdExpandMore, MdSave, MdRestartAlt, MdImage, MdSettings, MdInventory2 } from 'react-icons/md';
import DetailBannerEditor from './admin/DetailBannerEditor';
import GameProfileImageEditor from './admin/GameProfileImageEditor';

function PackageRow({ p, onChanged, onError, onNote = () => {}, canEdit = false }) {
  const [price, setPrice] = useState(String(p.price));
  const [cost, setCost] = useState(p.cost === null ? '' : String(p.cost));
  const [active, setActive] = useState(p.active);
  const [bonus, setBonus] = useState(p.bonus || '');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(p.label);
  const [askDel, setAskDel] = useState(false);

  useEffect(() => {
    setPrice(String(p.price));
    setCost(p.cost === null ? '' : String(p.cost));
    setActive(p.active);
    setBonus(p.bonus || '');
  }, [p.price, p.cost, p.active, p.bonus]);

  const dirty =
    Number(price) !== p.price ||
    (cost === '' ? p.cost !== null : Number(cost) !== p.cost) ||
    active !== p.active ||
    bonus.trim() !== (p.bonus || '');
  const modified = p.price !== p.basePrice || p.cost !== null || !p.active;
  const gan = price !== '' && cost !== '' ? Number(price) - Number(cost) : null;

  async function send(payload) {
    setBusy(true);
    onError('');
    try {
      const r = await fetch('/api/admin/paquetes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, ...payload }),
      });
      if (!r.ok) onError('No se pudo guardar (' + r.status + '). Inténtalo otra vez.');
      else await onChanged();
    } catch (e) {
      onError('Sin conexión');
    }
    setBusy(false);
  }

  async function rename() {
    const lab = name.trim();
    if (!lab || lab === p.label) {
      setEditing(false);
      setName(p.label);
      return;
    }
    setBusy(true);
    onError('');
    try {
      const r = await fetch('/api/admin/paquetes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, label: lab, price: p.price, cost: p.cost, active: p.active }),
      });
      if (!r.ok) onError('No se pudo cambiar el nombre (' + r.status + ').');
      else {
        setEditing(false);
        await onChanged();
      }
    } catch (e) {
      onError('Sin conexión');
    }
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    onError('');
    try {
      const r = await fetch('/api/admin/paquetes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        onError('No se pudo borrar (' + r.status + ').');
        setBusy(false);
        return;
      }
      onNote(
        d.pendientes > 0
          ? 'Se borró "' + p.label + '". Tenía ' + d.pendientes + ' pedido(s) pendiente(s): confírmalos o cancélalos.'
          : 'Se borró "' + p.label + '".',
        d.pendientes > 0
      );
      await onChanged();
    } catch (e) {
      onError('Sin conexión');
      setBusy(false);
    }
  }

  const inp =
    'mt-1 w-full rounded-xl border border-white/15 bg-[#081A2F]/80 px-3 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20';

  return (
    <div className={'rounded-2xl border p-3.5 transition-colors ' + (active ? 'border-cyan-400/15 bg-[#102B49]/80' : 'border-red-400/25 bg-red-400/5')}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus className={inp} />
          ) : (
            <div className="truncate text-sm font-extrabold text-white">{p.label}</div>
          )}
          <div className="text-[11px] text-slate-400">Base: Bs {p.basePrice}</div>
        </div>
        <button
          onClick={() => setActive((v) => !v)}
          className={'rounded-full border px-3 py-1 text-xs font-bold ' + (active ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-red-400/30 bg-red-400/10 text-red-300')}
        >
          {active ? 'Activo' : 'Pausado'}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-[11px] text-white/50">
          Precio (Bs)
          <input type="number" inputMode="decimal" min="0" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} />
        </label>
        <label className="text-[11px] text-white/50">
          Costo (Bs)
          <input type="number" inputMode="decimal" min="0" step="0.5" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Sin costo" className={inp} />
        </label>
      </div>
      <label className="mt-3 block text-[11px] text-white/50">
        Bono (opcional, máx. 24 letras)
        <input type="text" maxLength={24} value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="Ej: +10% extra" className={inp} />
      </label>
      {gan !== null && (
        <div className={'mt-2 text-xs font-semibold ' + (gan >= 0 ? 'text-emerald-300' : 'text-red-300')}>
          Ganancia: Bs {Math.round(gan * 100) / 100}
          {Number(price) > 0 ? ' (' + Math.round((gan / Number(price)) * 100) + '%)' : ''}
        </div>
      )}
      {canEdit && (
        <div className="mt-3 border-t border-white/10 pt-3">
          {editing ? (
            <div className="flex gap-2">
              <button
                disabled={busy || !name.trim()}
                onClick={rename}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#007BFF] py-2.5 text-sm font-extrabold text-slate-950 transition active:scale-95 disabled:opacity-50"
              >
                <MdSave className="text-lg" /> Guardar nombre
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setName(p.label);
                }}
                className="rounded-xl border border-white/15 bg-[#163554] px-4 py-2 text-xs font-bold text-slate-200 transition active:scale-95"
              >
                Cancelar
              </button>
            </div>
          ) : askDel ? (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-3">
              <p className="text-xs text-red-200">¿Borrar este paquete? Los pedidos ya creados no se borran.</p>
              <div className="mt-2 flex gap-2">
                <button
                  disabled={busy}
                  onClick={remove}
                  className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-extrabold text-white transition active:scale-95 disabled:opacity-50"
                >
                  Sí, borrar
                </button>
                <button
                  disabled={busy}
                  onClick={() => setAskDel(false)}
                  className="rounded-xl border border-white/15 bg-[#163554] px-4 py-2 text-xs font-bold text-slate-200 transition active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setName(p.label);
                  setEditing(true);
                }}
                className="flex-1 rounded-xl border border-cyan-400/20 bg-[#163554] py-2 text-xs font-bold text-slate-200 transition active:scale-95"
              >
                Editar nombre
              </button>
              <button
                onClick={() => setAskDel(true)}
                className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-xs font-bold text-red-300 transition active:scale-95"
              >
                Borrar
              </button>
            </div>
          )}
        </div>
      )}
      {(dirty || modified) && (
        <div className="mt-2 flex gap-2">
          {dirty && (
            <button
              disabled={busy}
              onClick={() => send({ price: price === '' ? null : Number(price), cost: cost === '' ? null : Number(cost), active, bonus: bonus.trim() })}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#007BFF] py-2.5 text-sm font-extrabold text-slate-950 shadow-md shadow-cyan-500/15 transition active:scale-95 disabled:opacity-50"
            >
              <MdSave className="text-lg" /> Guardar
            </button>
          )}
          {modified && (
            <button
              disabled={busy}
              onClick={() => send({ reset: true })}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/20 bg-[#163554] px-3 py-2 text-xs font-bold text-slate-200 transition active:scale-95 disabled:opacity-50"
            >
              <MdRestartAlt className="text-lg" /> Restablecer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const TONE = {
  ok: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  warn: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  bad: 'border-red-400/30 bg-red-400/10 text-red-200',
};

const ADD_ERR = {
  existe: 'Ya hay un paquete con ese nombre en este juego.',
  demasiados: 'Este juego ya tiene el máximo de 30 paquetes.',
  datos_invalidos: 'Revisa el nombre y el precio (el precio debe ser mayor a 0).',
  juego_invalido: 'Este juego no admite paquetes propios desde aquí.',
  no_autorizado: 'Tu sesión venció. Vuelve a entrar al panel.',
};

function AddPackage({ slug, onChanged, onError, onNote }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    const lab = label.trim();
    const pr = Number(price);
    if (!lab || !(pr > 0)) {
      onError(ADD_ERR.datos_invalidos);
      return;
    }
    setBusy(true);
    onError('');
    try {
      const r = await fetch('/api/admin/paquetes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, label: lab, price: pr }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        onError(ADD_ERR[d.error] || 'No se pudo crear el paquete (' + r.status + ').');
      } else {
        onNote('Paquete "' + lab + '" creado. Si el juego está publicado, ya aparece en la tienda.');
        setLabel('');
        setPrice('');
        setOpen(false);
        await onChanged();
      }
    } catch (e) {
      onError('Sin conexión');
    }
    setBusy(false);
  }

  const inp =
    'mt-1 w-full rounded-xl border border-white/15 bg-[#081A2F]/80 px-3 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20';

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-cyan-400/40 bg-cyan-400/5 py-3 text-sm font-extrabold text-cyan-200 transition active:scale-95"
      >
        + Agregar paquete
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-[#102B49]/80 p-3.5">
      <div className="text-sm font-extrabold text-white">Nuevo paquete</div>
      <div className="mt-3 grid gap-3">
        <label className="text-[11px] text-white/50">
          Nombre del paquete
          <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="Ej. 100 diamantes" className={inp} />
        </label>
        <label className="text-[11px] text-white/50">
          Precio (Bs)
          <input type="number" inputMode="decimal" min="0" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className={inp} />
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          disabled={busy || !label.trim() || !(Number(price) > 0)}
          onClick={create}
          className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#007BFF] py-2.5 text-sm font-extrabold text-slate-950 shadow-md shadow-cyan-500/15 transition active:scale-95 disabled:opacity-50"
        >
          Crear paquete
        </button>
        <button
          disabled={busy}
          onClick={() => {
            setOpen(false);
            onError('');
          }}
          className="rounded-xl border border-white/15 bg-[#163554] px-4 py-2 text-xs font-bold text-slate-200 transition active:scale-95"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function AdminGames() {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState('');
  const [section, setSection] = useState('paquetes');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/juegos', { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr('No se pudo cargar la lista (' + r.status + ').');
        return;
      }
      setList(d.games || []);
      setErr('');
    } catch (e) {
      setErr('Sin conexión');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const [note, setNote] = useState('');
  const [pnote, setPnote] = useState(null);

  async function toggle(g, state) {
    setBusy(g.slug);
    setErr('');
    try {
      const r = await fetch('/api/admin/juegos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: g.slug, state }),
      });
      if (!r.ok) {
        setErr('No se pudo cambiar (' + r.status + ')');
        setNote('');
      } else {
        const d = await r.json().catch(() => ({}));
        setNote(
          d.pendientes > 0 && state !== 'publicado'
            ? g.name + ' tiene ' + d.pendientes + ' pedido(s) pendiente(s). Confírmalos o cancélalos.'
            : ''
        );
      }
      await load();
    } catch (e) {
      setErr('Sin conexión');
    }
    setBusy('');
  }

  if (!list) {
    return err ? (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>
    ) : (
      <div className="skeleton h-20 rounded-2xl" />
    );
  }

  const activos = list.filter((g) => !g.maintenance).length;
  const ocultos = list.filter((g) => g.state === 'oculto').length;

  return (
    <div>
      <div className="mb-4 rounded-xl border border-cyan-400/15 bg-[#102B49]/70 px-4 py-3 text-sm font-semibold text-slate-300">
        {activos} publicados · {list.length - activos - ocultos} en mantenimiento · {ocultos} ocultos
      </div>
      {note && <div className="mb-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{note}</div>}
      {err && <div className="mb-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {list.map((g) => {
          const isOpen = open === g.slug;
          return (
            <div key={g.slug} className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-[#122B49] to-[#09192E] p-4 shadow-lg shadow-black/15 transition-colors hover:border-cyan-400/30">
              <div className="flex items-center gap-3">
                {g.image ? (
                  <img src={g.image} alt="" className="h-14 w-11 shrink-0 rounded-xl border border-white/10 object-cover" />
                ) : (
                  <span className="grid h-14 w-11 shrink-0 place-items-center rounded-xl border border-cyan-400/15 bg-[#163554] text-2xl">{g.emoji}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold text-white">{g.name}</div>
                  <div className={'mt-0.5 flex items-center gap-1.5 text-xs font-semibold ' + (g.state === 'oculto' ? 'text-slate-400' : g.maintenance ? 'text-amber-300' : 'text-emerald-300')}>
                    <span className={'h-1.5 w-1.5 rounded-full ' + (g.state === 'oculto' ? 'bg-slate-400' : g.maintenance ? 'bg-amber-400' : 'bg-emerald-400')} />
                    {g.state === 'oculto' ? 'Oculto' : g.maintenance ? 'En mantenimiento' : 'Publicado'}
                    {!g.canToggle && ' · sin paquetes'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(isOpen ? '' : g.slug);
                  setSection('paquetes');
                  setPnote(null);
                }}
                className="mt-3 flex w-full items-center justify-between rounded-xl border border-cyan-400/20 bg-[#163554]/70 px-3 py-3 text-sm font-bold text-cyan-100"
              >
                <span>Administrar juego</span>
                <MdExpandMore className={'text-xl transition ' + (isOpen ? 'rotate-180' : '')} />
              </button>

              {isOpen && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['paquetes', 'Paquetes', MdInventory2],
                      ['estado', 'Estado', MdSettings],
                      ['banner', 'Imágenes', MdImage],
                    ].map(([id, label, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSection(id)}
                        className={
                          'flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold ' +
                          (section === id
                            ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200'
                            : 'border-white/10 bg-[#102B49] text-slate-400')
                        }
                      >
                        <Icon className="text-xl" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {section === 'paquetes' && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400">
                        {g.packages.length === 0 ? 'Sin paquetes todavía' : g.packages.length === 1 ? '1 paquete' : g.packages.length + ' paquetes'}
                      </div>
                      {pnote && pnote.slug === g.slug && (
                        <div className={'rounded-xl border px-3 py-2 text-xs font-semibold ' + TONE[pnote.tone]}>{pnote.m}</div>
                      )}
                      {g.custom ? (
                        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                          Los paquetes de este servicio se administran en Servicios.
                        </div>
                      ) : (
                        <AddPackage
                          slug={g.slug}
                          onChanged={load}
                          onError={(m) => setPnote(m ? { slug: g.slug, m, tone: 'bad' } : null)}
                          onNote={(m, warn) => setPnote(m ? { slug: g.slug, m, tone: warn ? 'warn' : 'ok' } : null)}
                        />
                      )}
                      {g.packages.map((p) => (
                        <PackageRow
                          key={p.id}
                          p={p}
                          onChanged={load}
                          onError={(m) => setPnote(m ? { slug: g.slug, m, tone: 'bad' } : null)}
                          onNote={(m, warn) => setPnote(m ? { slug: g.slug, m, tone: warn ? 'warn' : 'ok' } : null)}
                          canEdit={Boolean(p.custom) && !g.custom}
                        />
                      ))}
                    </div>
                  )}

                  {section === 'estado' && (
                    <div className="rounded-xl border border-white/10 bg-[#102B49] p-4">
                      <div className="text-sm font-bold text-white">Estado del servicio</div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          ['publicado', 'Publicado', 'border-emerald-400/50 bg-emerald-400/15 text-emerald-200'],
                          ['mantenimiento', 'Mantenimiento', 'border-amber-400/50 bg-amber-400/15 text-amber-200'],
                          ['oculto', 'Oculto', 'border-slate-400/50 bg-slate-400/15 text-slate-200'],
                        ].map(([id, label, on]) => (
                          <button
                            key={id}
                            type="button"
                            disabled={busy === g.slug || (id === 'publicado' && !g.canToggle)}
                            onClick={() => g.state !== id && toggle(g, id)}
                            className={
                              'rounded-xl border px-2 py-3 text-xs font-bold disabled:opacity-40 ' +
                              (g.state === id ? on : 'border-white/10 bg-[#0d2440] text-slate-400')
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        {g.state === 'oculto'
                          ? 'No aparece en la tienda ni se puede comprar.'
                          : g.state === 'mantenimiento'
                          ? 'Pausado: no se puede comprar hasta que lo publiques.'
                          : 'Visible en la tienda y listo para recibir pedidos.'}
                      </p>
                      {!g.canToggle && (
                        <p className="mt-1 text-xs text-amber-300">Sin paquetes: agrega uno para poder publicarlo.</p>
                      )}
                    </div>
                  )}

                                    {section === 'banner' && (
                    <div className="rounded-xl border border-white/10 bg-[#102B49] p-4">
                      <div className="text-sm font-bold text-white">Imágenes del juego</div>
                      <p className="mt-2 text-xs text-slate-400">
                        Cambia la foto de perfil y la portada por separado.
                      </p>
                      <div className="mt-4">
                        <GameProfileImageEditor
                          gameSlug={g.slug}
                          image={g.image}
                          onSaved={load}
                        />
                      </div>

                      <div className="mt-5 border-t border-white/10 pt-5">
                        <h3 className="mb-2 text-sm font-bold text-white">
                          Portada del juego
                        </h3>
                        <p className="mb-4 text-xs text-slate-400">
                          Imagen panorámica independiente de la foto de perfil.
                        </p>
                        <DetailBannerEditor
                          key={g.slug}
                          gameSlug={g.slug}
                          providedGames={list}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
