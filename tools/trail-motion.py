import numpy as np
from PIL import Image

# horizontal behaviour of the trail: how the lit region moves across the seam
for v in ['E']:
    import glob
    files = sorted(glob.glob(f'.motion/frames/{v}/*.png'))
    cov, cx = [], []
    for f in files:
        a = np.asarray(Image.open(f).convert('RGB')).astype(float)
        # strip area: right of the bot, x 170..600, y 70..120
        sub = a[70:122, 168:604]
        ink = 255 - sub.min(axis=2)
        m = ink > 20
        cov.append(m.mean() * 100)
        xs = np.nonzero(m)[1]
        cx.append(xs.mean() if len(xs) else -1)
    cov = np.array(cov); cx = np.array(cx)
    print(f'{v}: strip coverage {cov.min():.1f}%..{cov.max():.1f}% (mean {cov.mean():.1f}%)')
    print(f'   lit centroid x travels {cx.min():.0f}..{cx.max():.0f} px of 436')
    # seam jump: last->first
    print(f'   seam: last frame cov {cov[-1]:.1f}% -> first {cov[0]:.1f}%')
    # check monotonic progress (no teleport in the middle)
    d = np.diff(cx)
    print(f'   max single-frame centroid jump {np.abs(d).max():.0f}px = {np.abs(d).max()/436*100:.1f}% of width')
