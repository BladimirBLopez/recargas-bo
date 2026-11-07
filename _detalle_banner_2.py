from pathlib import Path

editor = Path('components/admin/DetailBannerEditor.js')
page = Path('app/juego/[slug]/page.js')

e = editor.read_text()
p = page.read_text()

# 1. Vista previa inmediata de la imagen seleccionada.
old = "import { useEffect, useState } from 'react';"
new = "import { useEffect, useState } from 'react';\nimport { MdImage } from 'react-icons/md';"
assert e.count(old) == 1, 'Import del editor inesperado'
e = e.replace(old, new)

old = "  const [image, setImage] = useState(null);"
new = """  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);"""
assert e.count(old) == 1, 'Estado de imagen inesperado'
e = e.replace(old, new)

old = """                backgroundImage: saved?.url
                  ? `linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.25)),url("${saved.url}")`
                  : undefined,"""
new = """                backgroundImage: (previewUrl || saved?.url)
                  ? `linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.25)),url("${previewUrl || saved.url}")`
                  : undefined,"""
assert e.count(old) == 1, 'Fondo de vista previa inesperado'
e = e.replace(old, new)

old = """            <h2 className="font-bold text-white">Vista previa</h2>"""
new = """            <h2 className="flex items-center gap-2 font-bold text-white">
              <MdImage className="text-cyan-300" />
              Vista previa
            </h2>"""
assert e.count(old) == 1, 'Título de vista previa inesperado'
e = e.replace(old, new)

# 2. Etiqueta naranja y botón de cierre en la página pública.
old = "import { MdQrCode2, MdVerifiedUser, MdHeadsetMic, MdChevronRight } from 'react-icons/md';"
new = "import { MdQrCode2, MdVerifiedUser, MdHeadsetMic, MdChevronRight, MdClose } from 'react-icons/md';"
assert p.count(old) == 1, 'Import de iconos inesperado'
p = p.replace(old, new)

old = """        <div className="relative flex items-center gap-4">
          <GameImg"""
new = """        <Link
          href="/"
          aria-label="Cerrar detalle y volver al catálogo"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur hover:bg-black/80 sm:right-5 sm:top-5"
        >
          <MdClose size={21} />
        </Link>

        <div className="relative mb-4 flex flex-wrap gap-2 pr-10">
          <span className="rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-lg sm:text-xs">
            {game.kind === 'tarjeta' ? 'TARJETAS DIGITALES' : 'RECARGA DIRECTA AL ID'}
          </span>
        </div>

        <div className="relative flex items-center gap-4">
          <GameImg"""
assert p.count(old) == 1, 'Encabezado público inesperado'
p = p.replace(old, new)

# 3. Título predeterminado sin la palabra Recargar,
# siguiendo la composición de la referencia.
old = "{detail?.title || `Recargar ${game.name}`}"
new = "{detail?.title || game.name}"
assert p.count(old) == 1, 'Título público inesperado'
p = p.replace(old, new)

# Validar todos los cambios antes de escribir.
assert 'URL.revokeObjectURL(url)' in e
assert 'MdClose size={21}' in p
assert 'getDetailBanner(game.slug)' in p
assert '<Checkout game={game} />' in p

editor.write_text(e)
page.write_text(p)

print('OK: vista previa inmediata preparada')
print('OK: etiqueta naranja añadida')
print('OK: botón de cierre añadido')
print('OK: Checkout conservado')
print('SIN COMMIT NI PUSH')
