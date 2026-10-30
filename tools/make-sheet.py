from PIL import Image, ImageDraw

picks = [
    ('A · Alive   3.4s',         '.motion/frames/A/f0102.png', 'A'),
    ('D · Wave Float   3.0s',    '.motion/frames/D/f0090.png', 'D'),
    ('E · Heart Trace   1.8s',   '.motion/frames/E/f0064.png', 'E'),
]
tiles = [(label, Image.open(p).convert('RGB'), tag) for label, p, tag in picks]
w, h = tiles[0][1].size
pad, head = 10, 22

sheet = Image.new('RGB', (w + pad * 2, (h + head) * len(tiles) + pad * 2), (246, 242, 236))
d = ImageDraw.Draw(sheet)
for i, (label, img, tag) in enumerate(tiles):
    y = pad + i * (h + head)
    d.text((pad + 2, y + 5), label, fill=(108, 95, 105))
    sheet.paste(img, (pad, y + head))

sheet.save('out/compare.png')
print('out/compare.png', sheet.size)

for (label, p, tag) in picks:
    Image.open(p).convert('RGB').save(f'out/still-{tag}.png')
print('stills ok')
