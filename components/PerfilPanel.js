'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MdHistory, MdLogout, MdLock } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { useUser, setUser } from '@/components/useUser';

const MSG = {
  credenciales: 'Correo o PIN incorrecto.',
  correo_existe: 'Ya existe una cuenta con ese correo. Prueba ingresando.',
  nombre_invalido: 'Escribe tu nombre (de 2 a 40 letras).',
  correo_invalido: 'Revisa tu correo.',
  pin_invalido: 'El PIN debe tener 4 números.',
  limite: 'Demasiados intentos. Espera un minuto.',
  usa_google: 'Esa cuenta entra con Google.',
  sin_config: 'Falta configurar el servidor.',
};

const inputCls =
  'w-full rounded-2xl border-2 border-white/15 bg-zinc-950 px-4 py-3.5 text-base outline-none placeholder:text-white/40 focus:border-yellow-300';

const btnMain =
  'flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 py-3.5 font-display text-lg font-extrabold uppercase text-black shadow-[0_6px_20px_-6px_rgb(var(--accent)/0.8)] transition active:scale-95 disabled:opacity-60';

function Title() {
  return (
    <h2 className="flex items-center gap-3 font-display text-3xl font-extrabold uppercase italic">
      <span className="h-7 w-1.5 -skew-x-12 rounded-sm bg-yellow-300 shadow-[0_0_10px_rgb(var(--accent)/0.8)]" />
      Perfil
    </h2>
  );
}

export default function PerfilPanel() {
  const { user, loading } = useUser();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      const r = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, pin } : { name, email, pin }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.user) {
        setUser(d.user);
        setName('');
        setEmail('');
        setPin('');
      } else if (d.error === 'bloqueado') {
        setErr('Demasiados intentos fallidos. Espera ' + (d.minutos || 15) + ' min e intenta otra vez.');
      } else {
        setErr(MSG[d.error] || 'No se pudo. Intenta otra vez.');
      }
    } catch (e2) {
      setErr('Sin conexión. Revisa tu internet.');
    }
    setBusy(false);
  }

  async function logout() {
    try {
      await fetch('/api/auth/salir', { method: 'POST' });
    } catch (e) {}
    setUser(null);
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-28">
        <Title />
        <div className="skeleton h-72 rounded-3xl" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="space-y-6 pb-28">
        <Title />
        <div className="relative overflow-hidden rounded-3xl border border-yellow-300/30 bg-zinc-950/80 p-6 text-center shadow-[0_0_40px_-14px_rgb(var(--accent)/0.6)]">
          <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-yellow-300 to-orange-500" />
          <span className="clip-corner mx-auto grid h-20 w-20 place-items-center bg-gradient-to-br from-yellow-300 to-orange-500 font-display text-4xl font-extrabold text-black shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <h3 className="mt-4 font-display text-2xl font-extrabold uppercase italic">{user.name}</h3>
          <p className="truncate text-sm text-white/60">{user.email}</p>
        </div>
        <Link
          href="/historial"
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-4 font-semibold transition active:scale-95"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-yellow-300/15 text-yellow-300">
            <MdHistory size={20} />
          </span>
          Mis pedidos
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/20 py-3 font-display text-lg font-bold uppercase transition active:scale-95"
        >
          <MdLogout size={20} /> Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <Title />
      <div className="rounded-3xl border border-yellow-300/25 bg-zinc-950/80 p-5 shadow-[0_0_40px_-14px_rgb(var(--accent)/0.6)]">
        <div className="mb-5 grid grid-cols-2 gap-3">
          {[
            ['login', 'Entrar'],
            ['registro', 'Crear cuenta'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setMode(k);
                setErr('');
              }}
              className={`rounded-2xl border-2 py-2.5 font-display text-base font-bold uppercase transition ${
                mode === k
                  ? 'border-yellow-300 bg-yellow-300 text-black'
                  : 'border-white/10 bg-zinc-950 text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'registro' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              maxLength={40}
              className={inputCls}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            autoComplete="email"
            className={inputCls}
          />
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="PIN de 4 dígitos"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            maxLength={4}
            className={inputCls}
          />
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button type="submit" disabled={busy} className={btnMain}>
            {busy ? 'Un momento...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase text-white/40">
          <span className="h-px flex-1 bg-white/10" />
          o
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-black opacity-50"
        >
          <FcGoogle size={22} /> Continuar con Google · muy pronto
        </button>

        <p className="mt-4 flex items-start gap-2 text-xs text-white/50">
          <MdLock size={16} className="mt-0.5 shrink-0 text-green-400" />
          <span>
            Tu PIN se guarda cifrado. Anótalo bien: no se recupera por correo; si lo olvidas podrás volver a
            entrar con Google.
          </span>
        </p>
      </div>
      <p className="text-center text-xs text-white/40">También puedes comprar sin crear cuenta.</p>
    </div>
  );
}
