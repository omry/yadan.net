"""Build a reproducible, duration-only snapshot from public route pages."""
import concurrent.futures, csv, html, json, re, urllib.request
from pathlib import Path

AIRPORTS = [
 ('LHR','London Heathrow'),('JFK','New York JFK'),('DXB','Dubai'),
 ('SIN','Singapore Changi'),('LAX','Los Angeles'),('HND','Tokyo Haneda'),
 ('SYD','Sydney'),('GRU','São Paulo Guarulhos'),('JNB','Johannesburg'),
 ('CDG','Paris Charles de Gaulle'),('FRA','Frankfurt'),('AMS','Amsterdam'),
 ('IST','Istanbul'),('DOH','Doha Hamad'),('HKG','Hong Kong'),
 ('ICN','Seoul Incheon'),('DEL','Delhi'),('BKK','Bangkok Suvarnabhumi'),
 ('YYZ','Toronto Pearson'),('MEX','Mexico City'),('SFO','San Francisco'),
 ('AKL','Auckland'),('ADD','Addis Ababa'),('CAI','Cairo')]

def fetch(pair):
 a,b=pair
 url=f'https://www.flightconnections.com/flights-from-{a.lower()}-to-{b.lower()}'
 try:
  request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(request,timeout=25) as response: raw=response.read().decode()
  text=html.unescape(re.sub('<[^>]+>',' ',raw))
  text=re.sub(r'\s+',' ',text)
  match=re.search(r'Flight time\s+(?:(\d+) hours?\s*(?:and\s*)?)?(?:(\d+) minutes?)?',text)
  if match and (match[1] or match[2]):
   minutes=int(match[1] or 0)*60+int(match[2] or 0)
   if minutes>0: return dict(from_airport=a,to_airport=b,minutes=minutes,source=url)
 except Exception: pass
 return None

if __name__=='__main__':
 codes=[a for a,_ in AIRPORTS]
 pairs=[(a,b) for i,a in enumerate(codes) for b in codes[i+1:]]
 # Observe both directions for the core hubs; never infer missing flight times.
 pairs += [(b,a) for i,a in enumerate(codes[:4]) for b in codes[i+1:]]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  rows=[r for r in pool.map(fetch,pairs) if r]
 out=Path(__file__).resolve().parents[1]/'dist'
 data={'title':'Major international airports','retrieved':'2026-10-03',
       'provider':'FlightConnections','description':'Published non-stop route flight times. Directional observations are averaged per airport pair. This is a fixed snapshot, not live schedules.',
       'airports':[{'id':a,'name':name} for a,name in AIRPORTS], 'routes':rows}
 (out/'data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
 with (out/'flight-times.csv').open('w') as f:
  writer=csv.DictWriter(f,fieldnames=['from_airport','to_airport','minutes','source'])
  writer.writeheader();writer.writerows(rows)
 print(json.dumps({'airports':len(codes),'observations':len(rows),'pairs':len({tuple(sorted((r['from_airport'],r['to_airport']))) for r in rows})}))
