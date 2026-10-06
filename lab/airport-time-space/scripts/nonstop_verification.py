"""Require independent flight-route evidence; a page caption is insufficient."""
import json
from pathlib import Path

REVIEWED = json.loads(Path(__file__).with_name('reviewed-flight-observations.json').read_text())

# Independently checked stopovers take precedence over the crowdsourced index.
# Match a flight and direction, never discard its valid constituent legs.
CONFIRMED_STOPOVERS = {
 ('SIN', 'CPT', 'SQ478'), ('DOH', 'DUR', 'QR1375'),
 ('DUR', 'DOH', 'QR1376'), ('FIH', 'DOH', 'QR1491'),
 ('HRE', 'DOH', 'QR1456'), ('RUH', 'AMS', 'KL423'),
 ('DPS', 'AMS', 'KL836'), ('BOG', 'IST', 'TK801'),
 ('SGN', 'VTE', 'VN920'), ('VTE', 'SGN', 'VN921'),
}


def normalized_callsigns(number, airlines):
 """Preserve digit-bearing airline codes: G31682 is G3 + 1682, not G + 31682."""
 number=''.join(number.upper().split())
 for length in [2,3]:
  code,suffix=number[:length],number[length:]
  if code in airlines and suffix.isdigit():
   return [icao+str(int(suffix)) for icao in sorted(airlines[code])]
 return []


def verify_observation(row, evidence, reviewed=None):
 """Return a copy with evidence, or a reason to quarantine the observation."""
 a, b, number = row['from_airport'], row['to_airport'], row['flight_number']
 if (a, b, number) in CONFIRMED_STOPOVERS:
  return None, 'independently confirmed stopover'
 review = (REVIEWED['observations'] if reviewed is None else reviewed).get(row.get('observation_id'))
 if review:
  # A dated review never licenses a whole route or a future schedule. Rechecking
  # our own corrected snapshot is idempotent; original provider minutes remain.
  original = {**row, 'minutes': row.get('original_minutes', row.get('minutes'))}
  if any(original.get(k) != v for k, v in review['expected'].items()):
   return None, 'reviewed observation changed; requires another audit'
  if (a, b) not in list(zip(review['airports'], review['airports'][1:])):
   return None, 'nonadjacent airports in reviewed flight sequence'
  verified = {**row, 'stop_count': 0, 'nonstop_verified': True,
              'time_basis': 'published scheduled nonstop duration',
              'verification_method': 'independent flight-route adjacency',
              'verification_basis': review['basis'],
              'verification_route': ' → '.join(review['airports']),
              'verification_source': review['source'], 'reviewed_at': REVIEWED['reviewed_at']}
  if 'minutes' in review:
   verified.update(minutes=review['minutes'], original_minutes=original['minutes'],
                   duration_verification_source=review['duration_source'],
                   duration_verification_basis=review['duration_basis'])
  return verified, None
 candidates = evidence['flights'].get(number, [])
 if not candidates:
  return None, 'no independent flight-route evidence'
 matches = [r for r in candidates if (a, b) in list(zip(r['airports'], r['airports'][1:]))]
 if not matches:
  through = any(a in r['airports'] and b in r['airports'] and
                r['airports'].index(a) < r['airports'].index(b) for r in candidates)
  return None, 'nonadjacent airports in flight sequence' if through else 'flight-route mismatch'
 match = matches[0]
 filename = match['source_file']
 source = ('https://github.com/vradarserver/standing-data/blob/' + evidence['snapshot'] +
           '/routes/schema-01/' + filename[0] + '/' + filename)
 return {**row, 'stop_count': 0, 'nonstop_verified': True,
         'time_basis': 'published scheduled nonstop duration',
         'verification_method': 'independent flight-route adjacency',
         'verification_basis': 'Scheduled departure matches consecutive airports in independent flight sequence: ' + match['callsign'],
         'verification_route': ' → '.join(match['airports']),
         'verification_source': source}, None
