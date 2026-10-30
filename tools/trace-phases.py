import glob
from PIL import Image, ImageDraw

files = sorted(glob.glob('.motion/frames/E/*.png'))
n = 10
picks = [files[round(i * (len(files) - 1) / n)] for i in range(n)]
tiles = []
for p in picks:
    im = Image.open(p).convert('RGB')
    tiles.append(im.crop((160, 60, 616, 132)))     # strip region only

w, h = tiles[0].size
gap = 4
lab = 14
sheet = Image.new('RGB', (w, (h + gap + lab) * len(tiles)), (246, 242, 236))
d = ImageDraw.Draw(sheet)
for i, im in enumerate(tiles):
    y = i * (h + gap + lab)
    sheet.paste(im, (0, y + lab))
    d.text((4, y + 2), f'{i / n:.2f}', fill=(120, 110, 115))
sheet.save('out/ecg-trace-phases.png')
print('out/ecg-trace-phases.png', sheet.size, [p.split('\\')[-1] for p in picks])
