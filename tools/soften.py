"""Recolour the Louie Mantia hanafuda SVGs (CC BY-SA 4.0) to a softer palette.

Reads cards/src/MM-type.svg, writes cards/<id>.svg where id = (month-1)*4 + index.
Run from the repo root: python3 tools/soften.py
"""
import re, pathlib

PALETTE = {
    '#333333': '#4a413a',  # ink: warm charcoal instead of near-black
    '#000000': '#3d3530',
    '#ffffff': '#f7f0e1',  # paper: warm cream
    '#d81e1e': '#e5584a',  # red: lighter so ribbons and text read clearly
    '#ffeb5c': '#f5dc78',  # yellow
    '#5d4e8c': '#7d6fae',  # purple
    '#ff970d': '#f5a54f',  # orange
    '#ff8db6': '#f4a3bf',  # pink
    '#80e3ed': '#9fd8de',  # sky
    '#50b271': '#6cae80',  # green
    '#ffb85a': '#f5c27e',
}
ORDER = {  # file type -> index within the month (0 = highest card)
    'hikari': 0, 'tane': 0, 'tanzaku': 1, 'kasu1': 2, 'kasu2': 3,
}
SPECIAL = {  # months whose four cards don't follow the usual pattern
    8: {'hikari': 0, 'tane': 1, 'kasu1': 2, 'kasu2': 3},
    11: {'hikari': 0, 'tane': 1, 'tanzaku': 2, 'kasu1': 3},
    12: {'hikari': 0, 'kasu1': 1, 'kasu2': 2, 'kasu3': 3},
}

root = pathlib.Path(__file__).resolve().parent.parent / 'cards'
pat = re.compile('|'.join(re.escape(k) for k in PALETTE), re.I)

def soften(svg: str) -> str:
    return pat.sub(lambda m: PALETTE[m.group(0).lower()], svg)

seen = set()
for f in sorted((root / 'src').glob('*.svg')):
    name = f.stem
    if name == 'back':
        out = 'back'
    else:
        month, kind = name.split('-')
        month = int(month)
        idx = SPECIAL.get(month, ORDER)[kind]
        out = str((month - 1) * 4 + idx)
    assert out not in seen, out
    seen.add(out)
    (root / f'{out}.svg').write_text(soften(f.read_text()))
print(len(seen), 'cards written')
