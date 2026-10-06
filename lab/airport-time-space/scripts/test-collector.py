import importlib.util, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('collector',Path(__file__).with_name('collect-flight-observations.py'))
collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)

def fixture(caption='Scheduled nonstop departures from Sydney (SYD) to Los Angeles (LAX)',aircraft='Boeing 787-9',duration='13h 50m',date='2026-10-05'):
 headers=['Date','Flight','Airline','Departs SYD','Arrives LAX','Duration','Aircraft']
 row=f'<tr><td><time datetime="{date}">{date}</time></td><td>QF11</td><td>Qantas</td><td>09:00</td><td>10:00</td><td>{duration}</td><td>{aircraft}</td></tr>'
 return '<p>Schedule data dated <time datetime="2026-10-04">October 4</time></p><table><caption>'+caption+'</caption><tr>'+''.join('<th>'+h+'</th>' for h in headers)+'</tr>'+row+row+'</table>'

class CollectorTests(unittest.TestCase):
 def parse(self,raw):return collector.parse_schedule(raw,'SYD','LAX','2026-10-03','2026-10-10')
 def test_explicit_duration_and_deduplication(self):
  parsed=self.parse(fixture());self.assertEqual(len(parsed['routes']),1)
  row=parsed['routes'][0];self.assertEqual(row['minutes'],830);self.assertIsNone(row['stop_count']);self.assertFalse(row['nonstop_verified']);self.assertEqual(row['aircraft_assignment'],'scheduled')
  self.assertNotIn('departure_utc',row);self.assertNotIn('latitude',str(parsed))
 def test_reject_connecting_or_mismatched_table(self):
  for caption in ['Connecting flights from Sydney (SYD) to Los Angeles (LAX)','Scheduled nonstop departures from Sydney (SYD) to London (LHR)']:
   with self.assertRaises(ValueError):self.parse(fixture(caption=caption))
 def test_missing_aircraft_duration_and_outside_window(self):
  for kwargs in [{'aircraft':'Unknown'},{'duration':'—'},{'date':'2026-09-01'}]:
   with self.assertRaises(ValueError):self.parse(fixture(**kwargs))
 def test_require_dated_source_and_exact_schema(self):
  for raw in [fixture().replace('Schedule data dated','Updated'),fixture().replace('datetime="2026-10-04"','datetime="2099-01-01"'),fixture().replace('<th>Duration</th>','<th>Connection time</th>')]:
   with self.assertRaises(ValueError):self.parse(raw)
 def test_verify_legs_not_whole_through_flight(self):
  evidence={'snapshot':'test','flights':{'SQ478':[{'airports':['SIN','JNB','CPT'],'callsign':'SIA478','source_file':'SIA-all.csv'}]}}
  for a,b,valid in [('SIN','JNB',True),('JNB','CPT',True),('SIN','CPT',False),('CPT','JNB',False)]:
   result,reason=collector.verify_observation({'from_airport':a,'to_airport':b,'flight_number':'SQ478'},evidence)
   self.assertEqual(result is not None,valid)
   if valid:self.assertEqual(result['stop_count'],0);self.assertTrue(result['nonstop_verified'])
 def test_caption_claim_does_not_rescue_unknown_flight(self):
  row=self.parse(fixture())['routes'][0]
  result,reason=collector.verify_observation(row,{'flights':{}})
  self.assertIsNone(result);self.assertIn('no independent',reason)
 def test_nonadjacent_route_is_quarantined_without_an_exception(self):
  evidence={'flights':{'QF1':[{'airports':['SYD','SIN','LHR']}]}}
  result,reason=collector.verify_observation({'from_airport':'SYD','to_airport':'LHR','flight_number':'QF1'},evidence)
  self.assertIsNone(result);self.assertEqual(reason,'nonadjacent airports in flight sequence')
 def test_known_stopover_overrides_incorrect_index(self):
  evidence={'flights':{'QR1375':[{'airports':['DOH','DUR']}]}}
  result,reason=collector.verify_observation({'from_airport':'DOH','to_airport':'DUR','flight_number':'QR1375'},evidence)
  self.assertIsNone(result);self.assertIn('confirmed stopover',reason)
 def test_airline_code_digits_are_not_part_of_flight_number(self):
  from nonstop_verification import normalized_callsigns
  airlines={'G3':{'GLO'},'B6':{'JBU'},'U2':{'EZY'},'6E':{'IGO'},'AF':{'AFR'},'GLO':{'GLO'}}
  for number,expected in [('G31682',['GLO1682']),('B62659',['JBU2659']),('U28642',['EZY8642']),('6E6613',['IGO6613']),('AF0476',['AFR476']),('GLO1682',['GLO1682'])]:
   self.assertEqual(normalized_callsigns(number,airlines),expected)
  self.assertEqual(normalized_callsigns('G31682',{'G':{'WRONG'}}),[])
  self.assertEqual(normalized_callsigns('UN999',airlines),[])
 def test_dated_review_is_exact_and_correction_is_idempotent(self):
  from nonstop_verification import REVIEWED, verify_observation
  for oid,review in REVIEWED['observations'].items():
   row={**review['expected'],'observation_id':oid}
   result,reason=verify_observation(row,{'flights':{}})
   self.assertIsNone(reason);self.assertTrue(result['nonstop_verified'])
   self.assertEqual(result['verification_source'],review['source'])
   self.assertEqual(verify_observation(result,{'flights':{}})[0],result)
   if 'minutes' in review:
    self.assertEqual(result['original_minutes'],row['minutes'])
    self.assertEqual(result['minutes'],review['minutes'])
    self.assertTrue(result['duration_verification_source'])
   for key,value in [('date','2026-11-01'),('minutes',1),('aircraft','different aircraft'),('departure_local','00:00')]:
    changed={**row,key:value}
    self.assertIsNone(verify_observation(changed,{'flights':{}})[0])
   self.assertIsNone(verify_observation({**row,'observation_id':'unreviewed-future-row'},{'flights':{}})[0])
 def test_review_cannot_rescue_a_through_flight_or_known_stopover(self):
  from nonstop_verification import verify_observation
  row={'from_airport':'AA','to_airport':'CC','flight_number':'TEST1','observation_id':'test'}
  review={'test':{'expected':row,'airports':['AA','BB','CC']}}
  self.assertEqual(verify_observation(row,{'flights':{}},review)[1],'nonadjacent airports in reviewed flight sequence')
  row={'from_airport':'DOH','to_airport':'DUR','flight_number':'QR1375','observation_id':'test'}
  self.assertIn('confirmed stopover',verify_observation(row,{'flights':{}},review)[1])
if __name__=='__main__':unittest.main()
