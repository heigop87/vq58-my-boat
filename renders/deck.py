import sys, json, base64, urllib.request
from pathlib import Path
sys.path.insert(0, '/Users/heigopaartalu/Work/yachtway/model-renders')
sys.argv=['x']
from render import KEY, API, MODELS
img={"inline_data":{"mime_type":"image/jpeg","data":base64.b64encode(Path('deck-src/plan.jpg').read_bytes()).decode()}}
P=("This is a photo of a printed builder drawing: the top view floorplan of the lower deck of a yacht, bow pointing right. "
"Recreate exactly this floorplan as a clean, flat, perfectly top-down architectural render. Keep every wall, room, bed, seat, counter, sink, toilet, shower, stair and hull window in exactly the same position, shape and proportion. Do not add, move or remove rooms or furniture. "
"Remove: all yellow and green numbered tags, all leader lines, all dashed and dash-dot section lines, section letters and arrows, all text and labels (Top view, Mid cabin, Lounge, Galley, Master cabin, Mirror), the paper, the other drawings above and below, glare and the photo perspective. "
"Look: the hull outline horizontal and centered, filling the frame with a small margin, complete from the flat stern on the left to the pointed bow on the right. Light and bright daytime finish: pale oak floors, white and light grey upholstery and bed linen, white marble counters, light grey hull band. Soft even light, no dark shadows, no lamps glowing. Pure white background outside the hull. No text, no letters, no numbers, no logo.")
body={"contents":[{"parts":[{"text":P},img]}],"generationConfig":{"responseModalities":["IMAGE"],"imageConfig":{"aspectRatio":"16:9","imageSize":"2K"}}}
for m in MODELS:
    try:
        r=json.load(urllib.request.urlopen(urllib.request.Request(API.format(m),json.dumps(body).encode(),{"x-goog-api-key":KEY,"Content-Type":"application/json"}),timeout=300))
        for part in r["candidates"][0]["content"]["parts"]:
            d=part.get("inlineData") or part.get("inline_data")
            if d: Path('deck-raw.png').write_bytes(base64.b64decode(d["data"])); print('ok',m); sys.exit()
        print(m,'no image',json.dumps(r)[:300])
    except Exception as e: print(m,e)
