import glob
import numpy as np
from PIL import Image

for v in ['A', 'D', 'E']:
    files = sorted(glob.glob(f'.motion/frames/{v}/*.png'))
    hs = []
    for f in files:
        a = np.asarray(Image.open(f).convert('L')).astype(float)
        crop = a[:, 44:128]
        m = crop < 200
        yy, _ = np.nonzero(m)
        hs.append((yy.max() - yy.min()) if len(yy) else 0)
    hs = np.array([x for x in hs if x > 0])
    print(f'{v}: head pixel-height min={hs.min()} max={hs.max()} '
          f'(squash {hs.max() - hs.min()}px = {100 * (1 - hs.min() / hs.max()):.1f}%)')
    i = int(np.argmin(hs))
    print(f'   max squash at frame {i} = {i / 60:.2f}s (height {hs[i]} vs {hs.max()})')
