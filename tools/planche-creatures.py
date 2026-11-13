# Planche de contrôle des détourages (fond sombre et fond clair) : python3 tools/planche-creatures.py assets/creatures <dossier>
import sys, os
from PIL import Image, ImageDraw
D, out = sys.argv[1], sys.argv[2]
ids = ["add", "sub", "mul", "dbl", "frac", "comp", "div", "trick"]
C = 200
for name, col in [("sombre", (26, 35, 64)), ("clair", (242, 242, 236))]:
    sheet = Image.new("RGB", (C * 4, C * 8), col)
    for r, cid in enumerate(ids):
        for s in range(1, 5):
            tile = Image.new("RGBA", (512, 512), col + (255,))
            sh = Image.open(os.path.join(D, f"{cid}-{s}-ombre.webp")).convert("RGBA")
            im = Image.open(os.path.join(D, f"{cid}-{s}.webp")).convert("RGBA")
            tile.alpha_composite(sh); tile.alpha_composite(im)
            sheet.paste(tile.convert("RGB").resize((C, C), Image.LANCZOS), ((s - 1) * C, r * C))
        ImageDraw.Draw(sheet).text((4, r * C + 4), cid, fill=(255, 80, 80))
    sheet.save(os.path.join(out, f"planche-{name}.png"))
