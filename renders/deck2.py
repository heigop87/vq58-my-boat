import sys, json, base64, urllib.request
from pathlib import Path
sys.path.insert(0, '/Users/heigopaartalu/Work/yachtway/model-renders')
sys.argv=['x']
from render import KEY, API, MODELS
img={"inline_data":{"mime_type":"image/jpeg","data":base64.b64encode(Path('deck-src/plan2.jpg').read_bytes()).decode()}}
P=("This is a designer's hand sketch of the custom lower deck floorplan of a yacht, top view, bow pointing right. From left to right: an aft master cabin with a double bed and a chaise lounge along the upper side, a shower and bathroom in the upper middle, stairs in the lower middle, a U-shaped bench with a table in the upper middle right, a galley counter with sink along the lower side, and a forward cabin with a double bed in the bow. "
"Recreate exactly this floorplan as a clean, flat, perfectly top-down architectural render. Keep every wall, door, room, bed, seat, table, counter, sink, shower, stair and the hull outline in exactly the same position, shape and proportion as the sketch. Do not add, move or remove rooms or furniture. Do not add a stern section, cockpit or swim platform: the plan ends at the flat aft wall of the master cabin on the left. "
"Remove: all handwriting and labels, leader lines, arrows, crossed box marks, the frame, the signature and the faint drawing underneath. "
"Look: the hull outline horizontal and centered, filling the frame with a small margin. Light and bright daytime finish: pale oak floors, white and light grey upholstery and bed linen, white marble counters, light grey hull band. Soft even light, no dark shadows, no lamps glowing. Pure white background outside the hull. No text, no letters, no numbers, no logo.")
body={"contents":[{"parts":[{"text":P},img]}],"generationConfig":{"responseModalities":["IMAGE"],"imageConfig":{"aspectRatio":"3:2","imageSize":"2K"}}}
for m in MODELS:
    try:
        r=json.load(urllib.request.urlopen(urllib.request.Request(API.format(m),json.dumps(body).encode(),{"x-goog-api-key":KEY,"Content-Type":"application/json"}),timeout=300))
        for part in r["candidates"][0]["content"]["parts"]:
            d=part.get("inlineData") or part.get("inline_data")
            if d: Path('deck2-raw.png').write_bytes(base64.b64decode(d["data"])); print('ok',m); sys.exit()
        print(m,'no image',json.dumps(r)[:300])
    except Exception as e: print(m,e)
