#!/usr/bin/env python3
"""Generate src/v2/styles/bridge.css.

Older screens (admin panels hosted in the student area, the exam runner, the parent page) are styled
with Tailwind colour utilities like bg-white / text-slate-900 / bg-indigo-600. Inside an element with
the .nx-bridge class this file re-points every colour utility the codebase actually uses to the v2
tokens, so those screens pick up the copper palette and dark mode without being rewritten.

Run after adding new Tailwind colour classes:  python3 scripts/v2/gen-bridge.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(SRC, 'v2', 'styles', 'bridge.css')

FAMILIES = {
    'neutral': ['slate', 'gray', 'zinc', 'neutral', 'stone'],
    'copper': ['indigo', 'violet', 'purple', 'blue', 'sky', 'cyan', 'orange', 'fuchsia', 'pink'],
    'gold': ['amber', 'yellow', 'lime'],
    'patina': ['green', 'emerald', 'teal'],
    'danger': ['red', 'rose'],
}
ROLE = {fam: role for role, fams in FAMILIES.items() for fam in fams}
SOLID = {'copper': '#C0592A', 'gold': '#B97F14', 'patina': '#13806F', 'danger': '#C0303F'}
SOLID_DEEP = {'copper': '#9A3F18', 'gold': '#8A5E0C', 'patina': '#0D5E52', 'danger': '#93202D'}
TOKEN = {'copper': '--nx-copper', 'gold': '--nx-gold', 'patina': '--nx-patina', 'danger': '--nx-danger'}
SOFT = {'copper': '--nx-copper-soft', 'gold': '--nx-gold-soft', 'patina': '--nx-patina-soft', 'danger': '--nx-danger-soft'}

PATTERN = re.compile(
    r"(?<![\w-])((?:(?:sm|md|lg|xl|2xl|hover|focus|active|disabled|group-hover|focus-within|placeholder):)*)"
    r"(bg|text|border|border-[trblxyse]|from|via|to|ring|ring-offset|fill|stroke|divide|shadow|outline|placeholder|accent|caret|decoration)"
    r"-(white|black|transparent|" + '|'.join(ROLE) + r")(?:-(\d{2,3}))?(?:/(\d{1,3}))?(?![\w-])"
)
BREAKPOINTS = {'sm': 640, 'md': 768, 'lg': 1024, 'xl': 1280, '2xl': 1536}


def colour(role, shade, prop):
    s = int(shade) if shade else 500
    if role == 'white':
        if prop == 'bg':
            return 'var(--nx-surface)'
        if prop.startswith('border') or prop in ('divide', 'ring', 'outline'):
            return 'var(--nx-line)'
        return None  # text-white stays white
    if role == 'neutral':
        if prop == 'bg':
            return {50: 'var(--nx-bg-2)', 100: 'var(--nx-sunk)', 200: 'var(--nx-line)', 300: 'var(--nx-line-strong)',
                    400: 'var(--nx-ink-3)', 500: 'var(--nx-ink-3)', 600: 'var(--nx-ink-2)', 700: '#3A2D24',
                    800: 'var(--nx-night-3)', 900: 'var(--nx-night-2)', 950: 'var(--nx-night)'}.get(s)
        if prop in ('text', 'placeholder', 'fill', 'stroke', 'caret', 'decoration'):
            if s <= 100:
                return '#F7EFE7'
            if s <= 300:
                return '#D9CBBB' if prop == 'text' else 'var(--nx-line-strong)'
            if s <= 500:
                return 'var(--nx-ink-3)'
            if s <= 700:
                return 'var(--nx-ink-2)'
            return 'var(--nx-ink)'
        if prop in ('from', 'via', 'to'):
            return {50: 'var(--nx-bg-2)', 100: 'var(--nx-sunk)', 200: 'var(--nx-line)'}.get(s, 'var(--nx-night-2)' if s >= 700 else 'var(--nx-ink-3)')
        # borders, rings, divides
        if s >= 700:
            return 'var(--nx-night-line)'
        return 'var(--nx-line)' if s <= 200 else 'var(--nx-line-strong)'
    # coloured roles
    tok, soft = TOKEN[role], SOFT[role]
    if prop in ('bg', 'from', 'via', 'to'):
        if s <= 50:
            return f'color-mix(in srgb, var({soft}) 55%, var(--nx-surface))'
        if s <= 100:
            return f'var({soft})'
        if s <= 200:
            return f'color-mix(in srgb, var({tok}) 24%, var(--nx-surface))'
        if s <= 400:
            return f'color-mix(in srgb, {SOLID[role]} 70%, #FFFFFF)'
        if s <= 600:
            return SOLID[role]
        return SOLID_DEEP[role]
    if prop in ('text', 'placeholder', 'fill', 'stroke', 'caret', 'decoration', 'accent'):
        if s <= 200:
            return f'var({soft})' if prop != 'text' else f'color-mix(in srgb, {SOLID[role]} 18%, #FFFFFF)'
        if s <= 600:
            return f'var({tok})'
        return f'color-mix(in srgb, var({tok}) 72%, var(--nx-ink))'
    if prop == 'shadow':
        return SOLID[role]
    # borders, rings, divides, outlines
    if s <= 200:
        return f'color-mix(in srgb, var({tok}) 26%, var(--nx-line))'
    return f'var({tok})'


def with_alpha(value, alpha):
    if alpha is None:
        return value
    return f'color-mix(in srgb, {value} {int(alpha)}%, transparent)'


def esc(cls):
    return re.sub(r'([:/\.\[\]\(\)%#])', r'\\\1', cls)


def declarations(prop, value):
    if prop == 'bg':
        return f'background-color: {value}'
    if prop == 'text':
        return f'color: {value}'
    if prop == 'border':
        return f'border-color: {value}'
    if prop.startswith('border-'):
        side = prop[-1]
        sides = {'t': ['top'], 'b': ['bottom'], 'r': ['right'], 'l': ['left'], 'x': ['left', 'right'], 'y': ['top', 'bottom'],
                 's': ['inline-start'], 'e': ['inline-end']}[side]
        return '; '.join(f'border-{x}-color: {value}' for x in sides)
    if prop == 'from':
        return (f'--tw-gradient-from: {value} var(--tw-gradient-from-position); '
                f'--tw-gradient-to: color-mix(in srgb, {value} 0%, transparent) var(--tw-gradient-to-position); '
                f'--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)')
    if prop == 'via':
        return (f'--tw-gradient-to: color-mix(in srgb, {value} 0%, transparent) var(--tw-gradient-to-position); '
                f'--tw-gradient-stops: var(--tw-gradient-from), {value} var(--tw-gradient-via-position), var(--tw-gradient-to)')
    if prop == 'to':
        return f'--tw-gradient-to: {value} var(--tw-gradient-to-position)'
    if prop == 'ring':
        return f'--tw-ring-color: {value}'
    if prop == 'ring-offset':
        return f'--tw-ring-offset-color: {value}'
    if prop == 'fill':
        return f'fill: {value}'
    if prop == 'stroke':
        return f'stroke: {value}'
    if prop == 'divide':
        return f'border-color: {value}'
    if prop == 'shadow':
        return f'--tw-shadow-color: {value}; --tw-shadow: var(--tw-shadow-colored)'
    if prop == 'outline':
        return f'outline-color: {value}'
    if prop == 'placeholder':
        return f'color: {value}'
    if prop == 'accent':
        return f'accent-color: {value}'
    if prop == 'caret':
        return f'caret-color: {value}'
    if prop == 'decoration':
        return f'text-decoration-color: {value}'
    return None


def main():
    found = set()
    for base, _dirs, files in os.walk(SRC):
        rel = os.path.relpath(base, SRC)
        if rel == 'v2' or rel.startswith('v2' + os.sep):
            continue
        for name in files:
            if not name.endswith(('.jsx', '.js')):
                continue
            with open(os.path.join(base, name), encoding='utf-8', errors='ignore') as fh:
                for m in PATTERN.finditer(fh.read()):
                    found.add(m.groups())

    plain, media = [], {}
    for variants, prop, fam, shade, alpha in sorted(found, key=lambda g: (g[0].count(':'), tuple(x or '' for x in g))):
        role = 'white' if fam == 'white' else ROLE.get(fam)
        if role is None:
            continue
        if fam == 'white' and shade:
            continue
        value = colour(role, shade, prop)
        if value is None:
            continue
        value = with_alpha(value, alpha)
        decl = declarations(prop, value)
        if not decl:
            continue
        cls = f'{variants}{prop}-{fam}' + (f'-{shade}' if shade else '') + (f'/{alpha}' if alpha else '')
        sel = '.' + esc(cls)
        mods = [v for v in variants.split(':') if v]
        bp = next((v for v in mods if v in BREAKPOINTS), None)
        states = [v for v in mods if v not in BREAKPOINTS]
        for st in states:
            if st == 'group-hover':
                sel = '.group:hover ' + sel
            elif st == 'placeholder':
                sel += '::placeholder'
            else:
                sel += f':{st}'
        if prop == 'divide':
            sel += ' > :not([hidden]) ~ :not([hidden])'
        rule = f'.nx-bridge {sel} {{ {decl}; }}'
        if bp:
            media.setdefault(bp, []).append(rule)
        else:
            plain.append(rule)

    lines = ['/* Generated by scripts/v2/gen-bridge.py — do not edit by hand. */']
    lines += plain
    for bp in sorted(media, key=lambda b: BREAKPOINTS[b]):
        lines.append(f'@media (min-width: {BREAKPOINTS[bp]}px) {{')
        lines += ['  ' + r for r in media[bp]]
        lines.append('}')
    # surfaces that hard-code a white panel background through other means
    lines.append('.nx-bridge { color: var(--nx-ink); }')
    lines.append('.nx-bridge input, .nx-bridge select, .nx-bridge textarea { color: var(--nx-ink); }')
    lines.append(':root[data-theme="dark"] .nx-bridge input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), :root[data-theme="dark"] .nx-bridge select, :root[data-theme="dark"] .nx-bridge textarea { background-color: var(--nx-surface-2); border-color: var(--nx-line); }')
    lines.append('.nx-bridge .glass-card, .nx-bridge .glass-panel { background: var(--nx-surface); border-color: var(--nx-line); }')
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')
    print(f'{OUT}: {len(plain) + sum(len(v) for v in media.values())} rules from {len(found)} classes', file=sys.stderr)


if __name__ == '__main__':
    main()
