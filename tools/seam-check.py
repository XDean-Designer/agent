import glob, os, sys, statistics
import numpy as np
from PIL import Image, ImageChops, ImageStat

for v in ['A', 'D', 'E']:
    d = f'.motion/frames/{v}'
    files = sorted(glob.glob(os.path.join(d, '*.png')))
    if not files:
        continue
    prev = None
    diffs = []
    for f in files:
        im = Image.open(f).convert('L').resize((160, 100))
        if prev is not None:
            diffs.append(ImageStat.Stat(ImageChops.difference(im, prev)).mean[0])
        prev = im
    a = Image.open(files[-1]).convert('L').resize((160, 100))
    b = Image.open(files[0]).convert('L').resize((160, 100))
    seam = ImageStat.Stat(ImageChops.difference(a, b)).mean[0]
    pct = sum(1 for x in diffs if x < seam) / len(diffs) * 100
    print(f'{v}: frames={len(files)} size={Image.open(files[0]).size} '
          f'consec mean={statistics.mean(diffs):.3f} max={max(diffs):.3f} '
          f'seam={seam:.3f} (seam smaller than {pct:.0f}% of frame steps)')
