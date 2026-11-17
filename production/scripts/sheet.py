import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; out=sys.argv[1]
ims=[Image.open(f'out/stills/{f}.jpg') for f in fs]
w,h=ims[0].size; cols=min(len(ims),6); rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(cols*w,rows*h),'red'); d=ImageDraw.Draw(s)
for i,(im,f) in enumerate(zip(ims,fs)):
    x,y=(i%cols)*w,(i//cols)*h; s.paste(im,(x,y)); d.text((x+8,y+8),f,fill='yellow')
s.save(out,quality=88)
