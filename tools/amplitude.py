import glob
import numpy as np
from PIL import Image

for v in ['A', 'D', 'E']:
    files = sorted(glob.glob(f'.motion/frames/{v}/*.png'))
    cy, top, bot = [], [], []
    for f in files:
        a = np.asarray(Image.open(f).convert('L')).astype(float)
        crop = a[:, 24:140]                 # bot only
        m = crop < 225
        if m.sum() < 50:
            continue
        yy, _ = np.nonzero(m)
        cy.append(yy.mean()); top.append(yy.min()); bot.append(yy.max())
    cy = np.array(cy); top = np.array(top); bot = np.array(bot)
    print(f'{v}: head centroid amp={cy.max()-cy.min():.1f}px  top edge varies {top.max()-top.min():.0f}px  '
          f'bottom edge varies {bot.max()-bot.min():.0f}px')
