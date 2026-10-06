"""Cross-check a schedule snapshot and quarantine every unmatched observation."""
import argparse, csv, json
from collections import Counter
from pathlib import Path
from nonstop_verification import verify_observation, REVIEWED

ROOT = Path(__file__).resolve().parents[1]
out = ROOT / 'dist'
parser=argparse.ArgumentParser()
parser.add_argument('--input',default=str(out),help='Complete raw schedule snapshot directory, including excluded flights')
args=parser.parse_args()
source=Path(args.input)
data = json.loads((source / 'flights.json').read_text())
evidence = json.loads((ROOT / 'scripts/flight-route-evidence.json').read_text())
raw = [r for file in data['route_files'] for r in json.loads((source / file).read_text())]
retained, excluded, reasons = [], [], Counter()
for row in raw:
 verified, reason = verify_observation(row, evidence)
 if verified:
  retained.append(verified)
 else:
  reasons[reason] += 1
  excluded.append({k: row[k] for k in ['from_airport','to_airport','flight_number','minutes','source']} | {'reason': reason})
if len(retained) < 200 or len({r['from_airport'] for r in retained}) < 60:
 raise RuntimeError('Insufficient independently cross-checked flights; snapshot unchanged')
ids = {r[k] for r in retained for k in ['from_airport','to_airport']}
data['airports'] = [a for a in data['airports'] if a['id'] in ids]
data['title'] = 'Flight-route cross-checked nonstop schedules'
data['nonstop_verification'] = {'method':'independent flight-route adjacency',
 'provider':evidence['provider'], 'snapshot':evidence['snapshot'], 'retrieved':evidence['retrieved'],
 'source':evidence['source'], 'unmatched_policy':'exclude',
 'individualReviews':{'date':REVIEWED['reviewed_at'], 'observations':sum('reviewed_at' in r for r in retained),
                     'durationCorrections':sum('original_minutes' in r for r in retained)},
 'limitation':'The independent route database is crowdsourced and can be stale. Matching is a stronger schedule check, not certification of an actual flown flight.'}
data['description'] = ('Aircraft-specific scheduled durations, retained only when the flight number and direction match consecutive airports in an independent flight-route sequence. '
 'Known stopovers and every unmatched or conflicting observation are excluded before aircraft filtering and directional averaging. '
 'Individual dated schedule reviews repair identified stale index entries and conflicting durations, retaining original provider minutes and correction sources. '
 'The route index is crowdsourced and may be stale; these are cross-checked schedules, not certified actual flight measurements. No geographic coordinates or inferred path sums are supplied.')
data['route_files'] = []
for i in range(0, len(retained), 2500):
 filename = f'flight-observations-{i//2500+1:03d}.json'
 data['route_files'].append(filename)
 (out / filename).write_text(json.dumps(retained[i:i+2500],ensure_ascii=False,separators=(',',':'))+'\n')
for file in out.glob('flight-observations-*.json'):
 if file.name not in data['route_files']:file.unlink()
(out / 'flights.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
with (out / 'aircraft-flights.csv').open('w',newline='') as file:
 writer=csv.DictWriter(file,fieldnames=list(dict.fromkeys(k for r in retained for k in r)),lineterminator='\n')
 writer.writeheader();writer.writerows(retained)
with (out / 'quarantined-flight-observations.csv').open('w',newline='') as file:
 writer=csv.DictWriter(file,fieldnames=['from_airport','to_airport','flight_number','minutes','source','reason'],lineterminator='\n')
 writer.writeheader();writer.writerows(excluded)
report={'retrieved':evidence['retrieved'],'provider':data['provider'],'timeBasis':'published scheduled nonstop duration',
 'date_window':data['date_window'],'airports':len(ids),'observations':len(retained),
 'pairs':len({tuple(sorted([r['from_airport'],r['to_airport']])) for r in retained}),
 'collectedDirections':len({(r['from_airport'],r['to_airport']) for r in retained}),
 'inputObservations':len(raw),'quarantinedObservations':len(excluded),'quarantineReasons':dict(reasons),
 'nonstopVerification':data['nonstop_verification'],'everyObservationIndependentlyCrossChecked':True,
 'coordinatesRetained':False,'unmatchedRecordsAssumedConnecting':False}
(out / 'flight-collection-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
