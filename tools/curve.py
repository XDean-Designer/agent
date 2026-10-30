import glob
import numpy as np
from PIL import Image

for v in ['A', 'D', 'E']:
    files = sorted(glob.glob(f'.motion/frames/{v}/*.png'))
    tops = []
    for f in files:
        a = np.asarray(Image.open(f).convert('L')).astype(float)
        crop = a[:, 40:132]
        m = crop < 215
        yy, _ = np.nonzero(m)
        tops.append(yy.min() if len(yy) else 999)
    tops = np.array(tops)
    base = np.median(tops)
    print(f'--- {v}  top edge (rel to median {base:.0f})')
    n = 24
    step = len(tops) / n
    for i in range(n):
        seg = tops[int(i * step):int((i + 1) * step)]
        h = base - seg.mean()
        bar = ' ' * 14 + ('#' * int(round(h * 1.2)) if h > 0 else '')
        pad = ' ' * max(0, 6 - int(round(-h * 1.2))) + ('.' * int(round(-h * 1.2)) if h < 0 else '')
        print(f'  {i * step / 60:4.2f}s {pad:>6}|{bar}')
