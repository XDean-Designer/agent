import glob
from PIL import Image, ImageDraw

for v, n in [('A', 8), ('D', 6), ('E', 8)]:
    files = sorted(glob.glob(f'.motion/frames/{v}/*.png'))
    picks = [files[round(i * (len(files) - 1) / n)] for i in range(n)]
    ims = [Image.open(p).convert('RGB') for p in picks]
    w, h = ims[0].size
    cw = 170
    ims = [im.crop((0, 0, cw, h)) for im in ims]
    sheet = Image.new('RGB', (cw * n, h), (255, 255, 255))
    for i, im in enumerate(ims):
        sheet.paste(im, (cw * i, 0))
        ImageDraw.Draw(sheet).line([(cw * i, 0), (cw * i, h)], fill=(220, 210, 200))
    sheet.save(f'out/filmstrip-{v}.png')
    print(f'filmstrip-{v}.png', sheet.size)
