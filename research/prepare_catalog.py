import csv,gzip,json,math
from pathlib import Path
p=Path('public/data')
stars=[]
with gzip.open('research/hyg-v40.csv.gz','rt',encoding='utf-8') as f:
 for r in csv.DictReader(f):
  d=float(r['dist']); mag=float(r['mag'])
  if r['id']=='0' or d<=0 or d>=100000:continue
  if mag>6.5 and not r['proper'] and d>20:continue
  stars.append({'id':'hyg-'+r['id'],'hip':r['hip'],'name':r['proper'] or r['bf'] or 'HIP '+r['hip'] if r['hip'] else r['proper'] or r['gl'] or 'HYG '+r['id'],'ra':round(float(r['ra'])*15,6),'dec':round(float(r['dec']),6),'distanceLy':round(d*3.261563777,5),'mag':mag,'absMag':float(r['absmag']),'bv':float(r['ci']) if r['ci'] else None,'spectral':r['spect'],'constellation':r['con'],'named':bool(r['proper'])})
stars.sort(key=lambda s:s['mag'])
(p/'stars-3d.json').write_text(json.dumps(stars,separators=(',',':')),encoding='utf8')
print('3D stars:',len(stars),'Named:',sum(s['named'] for s in stars))
print([s for s in stars if s['name'] in ['Sirius','Rigel','Betelgeuse','Proxima Centauri']])
