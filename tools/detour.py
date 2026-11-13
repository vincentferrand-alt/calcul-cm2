# Usage : python3 tools/detour.py <dossier des images d origine> assets/creatures  (puis tools/planche-creatures.py assets/creatures <dossier> pour la planche de contrôle)
# Détourage fond vert uni -> transparence propre, recadrage commun, WebP 512 + ombre au sol séparée.
import sys, os, glob, json
import numpy as np, cv2
from PIL import Image, ImageFilter
SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
NAMES = {"add": "add", "sub": "sub", "mul": "mul", "dbl": "dbl", "frac": "frac", "K9 ": "comp", "trick": "trick", "div": "div"}
SIZE, MARGIN, FOOT = 512, 14, 0.955   # canevas carré, marge, ligne du sol (fraction de la hauteur)
report = {}

def src_path(prefix, st):
    for ext in ("jpg", "jpeg", "png"):
        p = os.path.join(SRC, f"{prefix}{st}.{ext}" if prefix.endswith(" ") else f"{prefix}-{st}.{ext}")
        if os.path.exists(p): return p
    return None

def key(img):
    f = img.astype(np.float32)
    h, w, _ = f.shape
    border = np.concatenate([f[:12].reshape(-1, 3), f[-12:].reshape(-1, 3), f[:, :12].reshape(-1, 3), f[:, -12:].reshape(-1, 3)])
    B = np.median(border, axis=0)
    spread = np.percentile(np.abs(border - B).max(axis=1), 95)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    d = g - np.maximum(r, b)                       # « vert en trop »
    dB = B[1] - max(B[0], B[2])
    hi, lo = dB * 0.80, 14.0
    a = np.clip((hi - d) / (hi - lo), 0, 1)
    # bruit JPEG : on ramène à 0 ce qui ressemble beaucoup au fond, couleur comprise
    near = np.linalg.norm(f - B, axis=2) < 38
    a[near] = 0
    # petites taches isolées (bruit), en gardant les étincelles nettes
    m = (a > 0.08).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < 60 or (area < 400 and a[lab == i].max() < 0.5): a[lab == i] = 0
    a = cv2.GaussianBlur(a, (0, 0), 0.8)
    a = np.clip((a - 0.06) / 0.94, 0, 1)            # léger resserrement : coupe le liseré
    # couleur : on retire la part du fond vert (désmélange), puis anti-débordement vert sur les bords
    af = np.maximum(a, 1e-3)[..., None]
    F = (f - (1 - af) * B) / af
    F = np.where(a[..., None] > 0.995, f, F)
    F = np.clip(F, 0, 255)
    edge = cv2.dilate((a < 0.995).astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    lim = np.maximum(F[..., 0], F[..., 2]) + 6
    g2 = np.where(edge, np.minimum(F[..., 1], lim), F[..., 1])
    F[..., 1] = g2
    rgba = np.dstack([F, a * 255]).round().clip(0, 255).astype(np.uint8)
    return rgba, B, spread

def leftover_green(rgba):
    f = rgba[..., :3].astype(np.float32); a = rgba[..., 3]
    d = f[..., 1] - np.maximum(f[..., 0], f[..., 2])
    edge = (a > 20) & (a < 235)
    return float((d[edge] > 25).mean()) if edge.any() else 0.0

for prefix, cid in NAMES.items():
    for st in range(1, 5):
        p = src_path(prefix, st)
        if not p: report[f"{cid}-{st}"] = {"error": "image absente"}; continue
        img = np.array(Image.open(p).convert("RGB"))
        rgba, B, spread = key(img)
        ys, xs = np.where(rgba[..., 3] > 10)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        cw, chh = x1 - x0, y1 - y0
        avail_w, avail_h = SIZE - 2 * MARGIN, SIZE * FOOT - MARGIN
        sc = min(avail_w / cw, avail_h / chh)
        crop = Image.fromarray(rgba[y0:y1, x0:x1]).convert("RGBa")
        nw, nh = max(1, round(cw * sc)), max(1, round(chh * sc))
        small = crop.resize((nw, nh), Image.LANCZOS).convert("RGBA")
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ox, oy = round((SIZE - nw) / 2), round(SIZE * FOOT - nh)
        canvas.alpha_composite(small, (ox, oy))
        # pixels invisibles : couleur neutre (évite tout halo vert si un navigateur filtre la texture)
        arr = np.array(canvas); arr[arr[..., 3] == 0, :3] = 0; canvas = Image.fromarray(arr)
        name = f"{cid}-{st}"
        q = 82
        while True:
            canvas.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6, alpha_quality=75)
            kb = os.path.getsize(os.path.join(OUT, name + ".webp")) / 1024
            if kb <= 40 or q <= 60: break
            q -= 4
        # ombre au sol séparée : ellipse floue sous l'appui (bas de la silhouette)
        al = np.array(canvas)[..., 3].astype(np.float32) / 255
        rows = np.where(al.max(axis=1) > 0.3)[0]; bottom = rows.max()
        band = al[max(0, bottom - int(SIZE * 0.07)):bottom + 1]
        cols = np.where(band.max(axis=0) > 0.4)[0]
        sx0, sx1 = cols.min(), cols.max()
        cx, rw = (sx0 + sx1) / 2, max(40, (sx1 - sx0) / 2 * 0.95 + 14)
        sh = Image.new("L", (SIZE, SIZE), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(sh).ellipse([cx - rw, bottom - rw * 0.16, cx + rw, bottom + rw * 0.16], fill=120)
        sh = sh.filter(ImageFilter.GaussianBlur(9))
        shadow = Image.merge("RGBA", (Image.new("L", (SIZE, SIZE), 12), Image.new("L", (SIZE, SIZE), 16), Image.new("L", (SIZE, SIZE), 40), sh))
        shadow.save(os.path.join(OUT, name + "-ombre.webp"), "WEBP", quality=70, method=6, alpha_quality=70)
        report[name] = {"src": os.path.basename(p), "bg": [int(v) for v in B], "bruit_bord": round(float(spread), 1), "q": q, "ko": round(kb, 1),
                        "ombre_ko": round(os.path.getsize(os.path.join(OUT, name + "-ombre.webp")) / 1024, 1), "vert_restant_bord": round(leftover_green(np.array(canvas)), 4),
                        "sol": round(bottom / SIZE, 3), "largeur": round((sx1 - sx0) / SIZE, 3)}
        print(name, report[name], flush=True)
json.dump(report, open(os.path.join(OUT, "rapport.json"), "w"), indent=1)
