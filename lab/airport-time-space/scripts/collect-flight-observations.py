"""Collect aircraft-specific published nonstop schedules from 2LNR.

No geographic coordinates are read or exported. Times and aircraft assignments
are explicitly SCHEDULED, never claimed as actual flown measurements. Discovery
uses public airport route directories; each observation must come from the
matching airport pair's schedule table AND independent flight-route evidence.
Page captions alone are not verification of a nonstop flight.
"""
import argparse, concurrent.futures, csv, datetime, hashlib, html, json, re, threading
import urllib.error, urllib.request
from collections import Counter
from pathlib import Path
from html.parser import HTMLParser
from nonstop_verification import verify_observation, REVIEWED

ROOT=Path(__file__).resolve().parents[1]
SEEDS='''LHR JFK DXB SIN LAX HND SYD GRU JNB CDG FRA AMS IST DOH HKG ICN DEL BKK
YYZ MEX SFO AKL ADD CAI PEK PVG CAN TPE KUL CGK MNL SGN BOM ATL ORD MIA DFW BOS SEA
YVR PTY BOG LIM SCL EZE CPT NBO CMN LOS AUH RUH MAD FCO ZRH MUC HEL CPH DUB MEL PER
NRT KIX NGO CTS FUK OKA PUS HAN DAD DPS SUB CEB DAC KTM CMB MLE BLR HYD MAA CCU COK
AMD ISB KHI LHE BAH MCT KWI JED DMM TLV AMM BEY IKA SVO DME LED WAW PRG BUD VIE
BRU LIS OPO BCN MXP ATH ARN OSL KEF MAN LGW EDI DUS HAM BER GVA NCE GIG BSB CNF
REC FOR SSA ASU MVD UIO GYE CCS SJO GUA SAL HAV PUJ SJU CUN YUL YYC YEG YOW YHZ
IAH DTW MSP PHL IAD EWR CLT DEN PHX LAS SAN MCO TPA FLL SLC PDX HNL ANC BNE ADL
CHC WLG NAN POM NOU PAP ALG TUN ACC ABJ DKR DAR EBB KGL MRU SEZ DUR LUN HRE LAD
FIH WDH RAK HKT CNX SZX XMN CTU TFU CKG XIY WUH KMG HGH NKG TSN TAO DLC URC
SHA CSX FOC CGO PEN BKI VTE PNH RGN TAS ALA GYD TBS EVN UBN'''.split()


class ScheduleTables(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.tables=[];self.table=None;self.row=None;self.cell=None;self.caption=False
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if tag=='table':self.table={'caption':'','rows':[]}
  elif self.table is not None:
   if tag=='caption':self.caption=True
   elif tag=='tr':self.row={'cells':[],'date':None}
   elif tag in ['td','th'] and self.row is not None:self.cell=''
   elif tag=='time' and self.row is not None:self.row['date']=attrs.get('datetime')
 def handle_data(self,text):
  if self.table is not None and self.caption:self.table['caption']+=text
  elif self.cell is not None:self.cell+=text
 def handle_endtag(self,tag):
  if tag=='caption':self.caption=False
  elif tag in ['td','th'] and self.cell is not None:
   self.row['cells'].append(re.sub(r'\s+',' ',self.cell).strip());self.cell=None
  elif tag=='tr' and self.table is not None and self.row is not None:
   self.table['rows'].append(self.row);self.row=None
  elif tag=='table' and self.table is not None:
   self.tables.append(self.table);self.table=None


def parse_schedule(raw,a,b,start,end):
 parser=ScheduleTables();parser.feed(raw)
 matches=[table for table in parser.tables if re.fullmatch(r'Scheduled nonstop departures from .*\('+re.escape(a)+r'\) to .*\('+re.escape(b)+r'\)',table['caption'].strip())]
 if len(matches)!=1:raise ValueError('matching explicitly nonstop schedule table unavailable')
 table=matches[0];headers=table['rows'][0]['cells']
 if headers!=['Date','Flight','Airline','Departs '+a,'Arrives '+b,'Duration','Aircraft']:raise ValueError('schedule schema changed')
 names=re.fullmatch(r'Scheduled nonstop departures from (.*?) \('+a+r'\) to (.*?) \('+b+r'\)',table['caption'].strip()).groups()
 source_date=re.search(r'Schedule data dated\s*<time datetime="(\d{4}-\d{2}-\d{2})"',raw)
 if not source_date:raise ValueError('schedule source date unavailable')
 source_date=source_date[1]
 if not datetime.date.fromisoformat(source_date)<=datetime.date.today():raise ValueError('future source snapshot date')
 rows=[];seen=set();url=f'https://2lnr.com/routes/{a.lower()}-{b.lower()}'
 for row in table['rows'][1:]:
  cells=row['cells'];date=row['date']
  if len(cells)!=7 or not date or not start<=date<=end:continue
  date=datetime.date.fromisoformat(date).isoformat()
  _,number,airline,departure,arrival,duration,aircraft=cells;number=re.sub(r'\s+','',number)
  if not re.fullmatch(r'[A-Z0-9]{2,3}\d+',number):continue
  if not airline or not aircraft or aircraft.lower() in ['unknown','n/a','—','-']:continue
  if not all(re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',clock) for clock in [departure,arrival]):continue
  parsed=re.fullmatch(r'(?:(\d+)h)?\s*(?:(\d+)m)?',duration)
  if not parsed:continue
  minutes=int(parsed[1] or 0)*60+int(parsed[2] or 0)
  if not 0<minutes<=26*60:continue
  # Retain one dated example per distinct flight-number / aircraft / duration
  # pattern. Repeated daily schedules do not create thousands of duplicates.
  key=(number,aircraft,minutes)
  if key in seen:continue
  seen.add(key)
  identifier=hashlib.sha256((url+date+number+departure+aircraft+str(minutes)).encode()).hexdigest()[:20]
  rows.append({'from_airport':a,'to_airport':b,'aircraft':aircraft,'aircraft_assignment':'scheduled',
   'airline':airline,'flight_number':number,'observation_id':identifier,'date':date,
   'departure_local':departure,'arrival_local':arrival,'minutes':minutes,
   'time_basis':'published scheduled duration','stop_count':None,'nonstop_verified':False,
   'verification_basis':'Unverified source claim: '+table['caption'].strip(),
   'source':url,'source_date':source_date,'retrieved':datetime.date.today().isoformat()})
 if not rows:raise ValueError('no dated aircraft-specific nonstop observations in collection window')
 return {'airports':[{'id':a,'name':names[0]},{'id':b,'name':names[1]}],'routes':rows}


def fetch_text(url,stop):
 if stop.is_set():raise RuntimeError('collection stopped after source access/rate rejection')
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=25) as response:
   if response.status!=200:
    if response.status in [202,403,429]:stop.set()
    raise RuntimeError(f'Unexpected HTTP status {response.status}')
   return response.read().decode()
 except urllib.error.HTTPError as error:
  if error.code in [403,429]:stop.set()
  raise


def cache_result(cache,kind,key,fn):
 path=cache/kind/(hashlib.sha256(key.encode()).hexdigest()+'.json')
 if path.exists():return json.loads(path.read_text())
 try:result={'ok':True,'value':fn()}
 except Exception as error:result={'ok':False,'error':str(error)[:180]}
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,ensure_ascii=False));return result


def directory(code,allowed,stop):
 raw=fetch_text('https://2lnr.com/routes/'+code.lower(),stop)
 pairs=set(re.findall(r'href=["\']/routes/([a-z]{3})-([a-z]{3})["\']',raw))
 return sorted({(a.upper(),b.upper()) for a,b in pairs if a.upper() in allowed and b.upper() in allowed and a!=b})


def main(args):
 cache=Path(args.cache);out=Path(args.output);out.mkdir(parents=True,exist_ok=True);stop=threading.Event();failures=Counter();pairs=set()
 evidence=json.loads(Path(args.verification_index).read_text());quarantined=Counter()
 with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
  futures={pool.submit(cache_result,cache,'directories',code,lambda code=code:directory(code,set(SEEDS),stop)):code for code in SEEDS}
  for i,future in enumerate(concurrent.futures.as_completed(futures),1):
   result=future.result()
   if result['ok']:pairs.update(tuple(p) for p in result['value'])
   else:failures['directory: '+result['error']]+=1
   if i%25==0 or i==len(SEEDS):print(json.dumps({'stage':'nonstop route discovery','checked':i,'total':len(SEEDS),'directedPairs':len(pairs),'failures':sum(failures.values())}),flush=True)
 if stop.is_set():raise RuntimeError('Public source rejected collection; no further requests made')
 rows=[];airports={};successful=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
  futures={pool.submit(cache_result,cache,'schedules',a+':'+b+':'+args.start+':'+args.end,lambda a=a,b=b:parse_schedule(fetch_text(f'https://2lnr.com/routes/{a.lower()}-{b.lower()}',stop),a,b,args.start,args.end)):(a,b) for a,b in sorted(pairs)}
  for i,future in enumerate(concurrent.futures.as_completed(futures),1):
   result=future.result()
   if result['ok']:
    for candidate in result['value']['routes']:
     verified,reason=verify_observation(candidate,evidence)
     if verified:rows.append(verified)
     else:quarantined[reason]+=1
    airports.update({a['id']:a for a in result['value']['airports']});successful.append(futures[future])
   else:failures['schedule: '+result['error']]+=1
   if i%100==0 or i==len(pairs):print(json.dumps({'stage':'dated nonstop schedules','checked':i,'total':len(pairs),'observations':len(rows),'airports':len(airports),'failures':sum(failures.values())}),flush=True)
 # Independent connected components cannot be positioned relative to each other.
 used={r[k] for r in rows for k in ['from_airport','to_airport']};airports={k:v for k,v in airports.items() if k in used}
 adjacent={code:set() for code in airports}
 for row in rows:adjacent[row['from_airport']].add(row['to_airport']);adjacent[row['to_airport']].add(row['from_airport'])
 groups=[];seen=set()
 for code in adjacent:
  if code in seen:continue
  group=[code];seen.add(code)
  for a in group:
   for b in adjacent[a]:
    if b not in seen:seen.add(b);group.append(b)
  groups.append(group)
 groups.sort(key=len,reverse=True);connected=set(groups[0] if groups else [])
 excluded=len(airports)-len(connected);rows=[row for row in rows if row['from_airport'] in connected and row['to_airport'] in connected]
 if len(connected)<60 or len(rows)<200:raise RuntimeError('Expanded dataset too small; deployed snapshot unchanged')
 rows.sort(key=lambda r:(r['from_airport'],r['to_airport'],r['flight_number'],r['date'],r['minutes']))
 data={'title':'Flight-route cross-checked nonstop schedules','provider':'2LNR published flight schedules','retrieved':datetime.date.today().isoformat(),
  'date_window':{'from':args.start,'to':args.end},'duration_basis':'scheduled','nonstop_only':True,
  'nonstop_verification':{'method':'independent flight-route adjacency','snapshot':evidence['snapshot'],'provider':evidence['provider'],'source':evidence['source'],'unmatched_policy':'exclude',
                         'individualReviews':{'date':REVIEWED['reviewed_at'],'observations':sum('reviewed_at' in r for r in rows),'durationCorrections':sum('original_minutes' in r for r in rows)}},
  'description':f'Aircraft-specific schedules during {args.start}–{args.end}, matched by flight number and direction to consecutive airports in independent flight-route sequences. Exact dated observation reviews can repair identified stale entries and conflicting durations, retaining provider originals and evidence. All unmatched records and known stopovers are excluded. The route index is crowdsourced and may be stale. These are cross-checked schedules, not certified actual flown measurements. No geographic coordinates or inferred path sums are supplied.',
  'airports':[airports[code] for code in SEEDS if code in connected],'routes':rows}
 # Keep individual static assets small while retaining every source record.
 files=[]
 for i in range(0,len(rows),2500):
  filename=f'flight-observations-{i//2500+1:03d}.json';files.append(filename)
  (out/filename).write_text(json.dumps(rows[i:i+2500],ensure_ascii=False,separators=(',',':'))+'\n')
 (out/'flights.json').write_text(json.dumps({**data,'routes':[],'route_files':files},ensure_ascii=False,indent=2)+'\n')
 with (out/'aircraft-flights.csv').open('w',newline='') as file:
  writer=csv.DictWriter(file,fieldnames=list(dict.fromkeys(k for r in rows for k in r)),lineterminator="\n");writer.writeheader();writer.writerows(rows)
 report={'retrieved':data['retrieved'],'provider':data['provider'],'timeBasis':'published scheduled nonstop duration','date_window':data['date_window'],
  'candidateAirports':len(SEEDS),'discoveredDirections':len(pairs),'collectedDirections':len({(r['from_airport'],r['to_airport']) for r in rows}),
  'airports':len(connected),'observations':len(rows),'pairs':len({tuple(sorted((r['from_airport'],r['to_airport']))) for r in rows}),
  'excludedDisconnectedAirports':excluded,'everyObservationExplicitlyNonstop':all(r['stop_count']==0 and r['nonstop_verified'] for r in rows),
  'coordinatesRetained':False,'sourceCollectionInterrupted':stop.is_set(),'failures':dict(failures),'quarantineReasons':dict(quarantined),'nonstopVerification':data['nonstop_verification']}
 (out/'flight-collection-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--start',default='2026-10-03');parser.add_argument('--end',default='2026-10-10')
 parser.add_argument('--cache',default='/tmp/nonstop-schedule-cache');parser.add_argument('--output',default=str(ROOT/'dist'));parser.add_argument('--workers',type=int,default=4)
 parser.add_argument('--verification-index',default=str(ROOT/'scripts/flight-route-evidence.json'))
 main(parser.parse_args())
