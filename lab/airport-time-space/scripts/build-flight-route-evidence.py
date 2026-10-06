"""Build a pinned flight-route index from public standing-data CSV files.

Use a complete raw schedule snapshot, including previously quarantined records.
Airport-code references are identifiers only; coordinates never enter this index.
"""
import argparse, csv, datetime, json
from pathlib import Path
from nonstop_verification import normalized_callsigns


def build(args):
 root=Path(args.schedules_dir);meta=json.loads((root/'flights.json').read_text())
 rows=[r for file in meta['route_files'] for r in json.loads((root/file).read_text())]
 airlines={}
 for row in csv.DictReader(Path(args.airlines).open(encoding='utf-8-sig')):
  if not row['ICAO']:continue
  airlines.setdefault(row['ICAO'],set()).add(row['ICAO'])
  if row['IATA']:airlines.setdefault(row['IATA'],set()).add(row['ICAO'])
 airports={row['icao']:row['iata'] for row in csv.DictReader(Path(args.airport_codes).open())}
 routes={}
 for file in Path(args.route_directory).glob('*.csv'):
  for row in csv.DictReader(file.open(encoding='utf-8-sig')):
   routes[row['Callsign']]={'airports':[airports.get(c,c) for c in row['AirportCodes'].split('-')],
                          'source_file':file.name,'callsign':row['Callsign']}
 flights={number:[routes[c] for c in normalized_callsigns(number,airlines) if c in routes]
          for number in sorted({r['flight_number'] for r in rows})}
 result={'provider':'Virtual Radar Server standing-data flight route sequences','snapshot':args.snapshot,
  'retrieved':datetime.date.today().isoformat(),'source':'https://github.com/vradarserver/standing-data',
  'description':'Independent callsign airport sequences, normalized to airport identifiers only. Crowdsourced routes may be stale. Unmatched records are excluded. Airline codes use their full two-character IATA prefix, including digits, or a known three-character ICAO prefix. Leading flight-number zeros are normalized.',
  'flights':flights}
 Path(args.output).write_text(json.dumps(result,separators=(',',':'))+'\n')
 print(json.dumps({'flights':len(flights),'withEvidence':sum(bool(v) for v in flights.values())}))


if __name__=='__main__':
 parser=argparse.ArgumentParser()
 for name in ['schedules-dir','airlines','airport-codes','route-directory','snapshot','output']:
  parser.add_argument('--'+name,required=True)
 build(parser.parse_args())
