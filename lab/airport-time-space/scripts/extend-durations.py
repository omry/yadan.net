"""Extend the published duration snapshot without geographic coordinates."""
import concurrent.futures, csv, json, runpy
from pathlib import Path
from datetime import date

ROOT=Path(__file__).resolve().parents[1]
fetch=runpy.run_path(str(ROOT/'scripts/collect-durations.py'))['fetch']
ADDITIONS=[
 ('PEK','Beijing Capital'),('PVG','Shanghai Pudong'),('CAN','Guangzhou Baiyun'),
 ('TPE','Taipei Taoyuan'),('KUL','Kuala Lumpur'),('CGK','Jakarta Soekarno–Hatta'),
 ('MNL','Manila Ninoy Aquino'),('SGN','Ho Chi Minh City'),('BOM','Mumbai'),
 ('ATL','Atlanta'),('ORD','Chicago O’Hare'),('MIA','Miami'),('DFW','Dallas Fort Worth'),
 ('BOS','Boston Logan'),('SEA','Seattle Tacoma'),('YVR','Vancouver'),
 ('PTY','Panama City Tocumen'),('BOG','Bogotá El Dorado'),('LIM','Lima'),
 ('SCL','Santiago'),('EZE','Buenos Aires Ezeiza'),('CPT','Cape Town'),
 ('NBO','Nairobi Jomo Kenyatta'),('CMN','Casablanca'),('LOS','Lagos'),
 ('AUH','Abu Dhabi'),('RUH','Riyadh'),('MAD','Madrid'),('FCO','Rome Fiumicino'),
 ('ZRH','Zurich'),('MUC','Munich'),('HEL','Helsinki'),('CPH','Copenhagen'),
 ('DUB','Dublin'),('MEL','Melbourne'),('PER','Perth')]
HUBS=['LHR','JFK','DXB','SIN','CDG','FRA','IST','DOH']
ROUTE_GROUPS=[['PEK','PVG','CAN','TPE','KUL','CGK','MNL','SGN','BOM'],
 ['ATL','ORD','MIA','DFW','BOS','SEA','YVR'],['PTY','BOG','LIM','SCL','EZE'],
 ['CPT','NBO','CMN','LOS'],['AUH','RUH','MAD','FCO','ZRH','MUC','HEL','CPH','DUB'],
 ['MEL','PER','SYD','AKL']]

if __name__=='__main__':
 data=json.loads((ROOT/'dist/data.json').read_text())
 present={a['id'] for a in data['airports']}
 additions=[(a,name) for a,name in ADDITIONS if a not in present]
 existing={(r['from_airport'],r['to_airport']) for r in data['routes']}
 pairs={(a,b) for a,_ in ADDITIONS for b in HUBS if a!=b}
 pairs|={(b,a) for a,b in list(pairs)}
 for group in ROUTE_GROUPS:
  pairs|={(a,b) for a in group for b in group if a!=b}
 pairs=sorted(pairs-existing)
 fetched=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for i,result in enumerate(pool.map(fetch,pairs)):
   if result:
    result['retrieved']=date.today().isoformat();fetched.append(result)
   if (i+1)%100==0: print(json.dumps({'checked':i+1,'total':len(pairs),'found':len(fetched)}),flush=True)
 for r in data['routes']: r.setdefault('retrieved','2026-10-03')
 data['routes']+=fetched
 observed={r[key] for r in data['routes'] for key in ['from_airport','to_airport']}
 data['airports'] += [{'id':a,'name':name} for a,name in additions if a in observed]
 data['retrieved']=date.today().isoformat()
 data['description']='Published non-stop route flight times. Directional observations are averaged per airport pair. Fixed snapshot collected October 3–4, 2026; not live schedules.'
 (ROOT/'dist/data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
 with (ROOT/'dist/flight-times.csv').open('w') as f:
  writer=csv.DictWriter(f,fieldnames=['from_airport','to_airport','minutes','source','retrieved']);writer.writeheader();writer.writerows(data['routes'])
 print(json.dumps({'airports':len(data['airports']),'observations':len(data['routes']),'pairs':len({tuple(sorted((r['from_airport'],r['to_airport']))) for r in data['routes']}),'unobserved':[a for a,_ in additions if a not in observed]}),flush=True)
