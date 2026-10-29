'use client';

import { useEffect, useState } from 'react';

export default function GameProfileImageEditor({
  gameSlug,
  image,
  onSaved,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function upload(selectedFile) {
    const response = await fetch('/api/admin/subir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'games' }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo preparar la subida');
    }

    const form = new FormData();
    form.append('file', selectedFile);
    form.append('api_key', data.apiKey);
    form.append('timestamp', data.timestamp);
    form.append('asset_folder', data.folder);
    form.append('public_id_prefix', data.folder);
    form.append('signature', data.signature);

    const result = await fetch(
      'https://api.cloudinary.com/v1_1/' +
        data.cloudName +
        '/image/upload',
      {
        method: 'POST',
        body: form,
      }
    );

    const uploaded = await result.json();

    if (!result.ok) {
      throw new Error(
        uploaded.error?.message || 'Error al subir la imagen'
      );
    }

    return {
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    };
  }

  function selectFile(event) {
    const selected = event.target.files?.[0];
    event.target.value = '';

    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setMessage('Selecciona una imagen válida.');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setMessage('La imagen no debe superar 5 MB.');
      return;
    }

    setFile(selected);
    setMessage('');
  }

  async function save() {
    if (!file || !gameSlug || busy) return;

    setBusy(true);
    setMessage('Guardando foto de perfil…');

    try {
      const uploaded = await upload(file);

      const response = await fetch('/api/admin/servicios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: gameSlug,
          image: uploaded,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo guardar la foto');
      }

      setFile(null);
      setMessage('Foto de perfil guardada correctamente.');

      if (onSaved) await onSaved();
    } catch (error) {
      setMessage(error.message || 'Error al guardar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-[#102B49] p-4">
      <h3 className="font-extrabold text-white">
        Foto de perfil del juego
      </h3>

      <p className="mt-2 text-xs text-slate-400">
        Esta imagen aparece en el catálogo. No modifica la portada.
      </p>

      <div className="mt-4 flex items-center gap-4">
        {preview || image ? (
          <img
            src={preview || image}
            alt="Foto de perfil del juego"
            className="h-24 w-24 rounded-xl border border-white/15 object-cover"
          />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-xl border border-white/15 bg-[#163554] text-xs text-slate-400">
            Sin foto
          </div>
        )}

        <div className="min-w-0 flex-1">
          <label className="inline-flex cursor-pointer rounded-xl border border-cyan-400/30 bg-[#163554] px-3 py-2.5 text-sm font-bold text-cyan-200">
            Elegir foto
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={selectFile}
              className="hidden"
            />
          </label>

          <p className="mt-2 text-xs text-slate-400">
            Recomendado: imagen cuadrada. Máximo 5 MB.
          </p>
        </div>
      </div>

      {file && (
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-extrabold text-slate-950 disabled:opacity-50"
        >
          {busy ? 'Guardando…' : 'Guardar foto de perfil'}
        </button>
      )}

      {message && (
        <p role="status" className="mt-3 text-sm text-cyan-200">
          {message}
        </p>
      )}
    </div>
  );
}
