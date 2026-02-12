"""
Generates Ancoralis placeholder icons.
Replace these with your real icons from Affinity Designer later.
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = '/home/claude/ancoralis/public'
os.makedirs(OUT, exist_ok=True)

BG = (10, 10, 15)
PURPLE = (124, 58, 237)
LIGHT = (167, 139, 250)

def make_icon(size, path):
    img = Image.new('RGBA', (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Hexagon shape for the ⬡ symbol
    cx, cy = size // 2, size // 2
    r = size * 0.38
    import math
    pts = [(cx + r * math.cos(math.radians(90 + 60*i)),
            cy + r * math.sin(math.radians(90 + 60*i))) for i in range(6)]
    draw.polygon(pts, outline=PURPLE, fill=None)
    # Inner dot
    ir = size * 0.1
    draw.ellipse([cx-ir, cy-ir, cx+ir, cy+ir], fill=LIGHT)

    img.save(path, 'PNG')
    print(f'  ✓ {path}')

sizes = {
    'icon-192.png': 192,
    'icon-512.png': 512,
    'apple-touch-icon.png': 180,
}

for name, sz in sizes.items():
    make_icon(sz, os.path.join(OUT, name))

print('Icons generated. Replace with real artwork from Affinity Designer.')
