"""Build the local search index from Omio's advertiser-format Swiss catalog."""
import argparse
from datetime import date
import csv
import gzip
import json
from pathlib import Path
from urllib.parse import urlsplit

cli = argparse.ArgumentParser(description=__doc__)
cli.add_argument('quelle', type=Path)
cli.add_argument('--stand', required=True, type=date.fromisoformat, help='Exportdatum YYYY-MM-DD')
cli.add_argument('--ziel', type=Path, default=Path(__file__).resolve().parents[2] / 'public/omio-prototyp/katalog.json')
args = cli.parse_args()
places, routes, counts, publishers = {}, {}, {}, set()
modes = ('train', 'bus', 'flight', 'ferry')
with gzip.open(args.quelle, 'rt', encoding='utf-8-sig', newline='') as stream:
    for row in csv.DictReader(stream):
        assert row['domain_currency'] == 'CHF'
        outbound = urlsplit(row['link_URL'])
        campaign, publisher, _, program = outbound.path.strip('/').split('/')
        assert outbound.hostname == 'omio.sjv.io' and campaign == 'c' and program == '7385'
        publishers.add(publisher)
        endpoints = []
        for side in ('origin', 'destination'):
            def value(field):
                return row[side + '_' + field]
            place_id = value('position_id')
            lat = float(value('latitude'))
            lng = float(value('longitude'))
            assert -90 <= lat <= 90 and -180 <= lng <= 180 and (lat or lng)
            place = {'id': place_id, 'name':value('name'), 'country':value('country_code'), 'lat':lat,'lng':lng}
            # Source rows sometimes provide rounded versions of the same coordinates.
            if place_id in places:
                old = places[place_id]
                assert (old['name'],old['country']) == (place['name'],place['country'])
            if place_id not in places or (len(str(lat))+len(str(lng)) > len(str(places[place_id]['lat']))+len(str(places[place_id]['lng']))):
                places[place_id]=place
            endpoints.append(place_id)
        key='/'.join(endpoints)
        assert key not in routes
        offers={}
        for mode in modes:
            price=row[mode+'_min_price'].strip()
            duration=row[mode+'_min_duration'].strip()
            if price or duration:
                offers[mode]=[round(float(price)*100) if price else None,int(duration) if duration else None]
        assert offers
        routes[key]=offers
        for endpoint in endpoints:
            counts[endpoint]=counts.get(endpoint,0)+1
assert len(publishers)==1
for k, p in places.items():
    p['weight']=counts[k]
data={'date':args.stand.isoformat(),'publisher':publishers.pop(),'places':list(places.values()),'routes':routes}
args.ziel.parent.mkdir(parents=True, exist_ok=True)
# Replace only after parsing every route, preserving the previous usable snapshot on errors.
import tempfile
with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=args.ziel.parent, delete=False) as tmp:
    json.dump(data, tmp, ensure_ascii=False, separators=(',',':'))
Path(tmp.name).replace(args.ziel)
print(len(places),'Orte,',len(routes),'eindeutige Strecken')
