from pathlib import Path

p = Path('app/juego/[slug]/page.js')
s = p.read_text()

changes = [
    (
        "import { getGames } from '@/lib/games-state';",
        "import { getGames } from '@/lib/games-state';\n"
        "import { getDetailBanner } from '@/lib/game-detail-banners';"
    ),
    (
        "  const others = all.filter((g) => g.slug !== game.slug && !g.maintenance).slice(0, 4);",
        "  const others = all.filter((g) => g.slug !== game.slug && !g.maintenance).slice(0, 4);\n"
        "  const detail = await getDetailBanner(game.slug);"
    ),
    (
        'className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${game.color} p-5 ring-1 ring-white/15 shadow-[0_20px_50px_-20px_rgb(var(--accent)/0.6)] sm:p-8`}',
        'className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${game.color} p-5 ring-1 ring-white/15 shadow-[0_20px_50px_-20px_rgb(var(--accent)/0.6)] sm:p-8`}'
    ),
]

# Los dos primeros cambios deben existir exactamente una vez.
for old, new in changes[:2]:
    assert s.count(old) == 1, f'No se encontró: {old[:75]}'
    s = s.replace(old, new)

# El banner se añade como fondo, sin cambiar el resto del JSX.
marker = '''        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />'''

assert s.count(marker) == 1

background = '''        {detail?.url && (
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${detail.url}")` }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />
'''

s = s.replace(marker, background + marker)

old_title = '''              Recargar {game.name}'''
new_title = '''              {detail?.title || `Recargar ${game.name}`}'''

assert s.count(old_title) == 1
s = s.replace(old_title, new_title)

old_subtitle = '''            <p className="mt-1.5 text-sm text-white/85">Servicio para Bolivia</p>'''
new_subtitle = '''            <p className="mt-1.5 text-sm text-white/85">{detail?.subtitle || 'Servicio para Bolivia'}</p>'''

assert s.count(old_subtitle) == 1
s = s.replace(old_subtitle, new_subtitle)

old_chips = '''          {CHIPS.map(([Icon, text]) => ('''
new_chips = '''          {CHIPS.map(([Icon, text], index) => (
            '''

# Sustituir únicamente el texto visible de cada chip.
assert s.count(old_chips) == 1
s = s.replace(old_chips, new_chips)

old_text = '''              <Icon size={16} className="text-yellow-300" /> {text}'''
new_text = '''              <Icon size={16} className="text-cyan-300" /> {[detail?.chip1, detail?.chip2, detail?.chip3][index] || text}'''

assert s.count(old_text) == 1
s = s.replace(old_text, new_text)

p.write_text(s)
print('BANNER DE DETALLE CONECTADO')
print('SIN COMMIT NI PUSH')
