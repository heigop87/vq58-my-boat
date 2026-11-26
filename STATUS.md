# VQ58 My Boat: status (26 Nov 2026)

Phase 0. Simulator and mock data only. Dry run is ON by default and no hardware adapter exists.

## What is built
- `app/index.html`: fork of the My Boat prototype, plus a Control tab.
- `app/rules.js`: the 8 hard safety rules, outing sequencer, write log. Pure, runs in the app and under node. The mini PC backend reuses it as is.
- `app/vq58.js`: Control screens (power, AC, lights, audio, circuits, Seakeeper, cameras, engines, bilge, modes, command log), simulator timers, guest mode with PIN.
- `app/rules.test.js`: one check per hard rule. Run: `cd app && node rules.test.js` → `rules ok`.

## UNVERIFIED
- Every circuit, zone and pump id in `rules.js` is a placeholder.
- No NMEA 2000 PGN, EmpirBus channel, device address, or Dometic, Seakeeper, Fusion message format is assumed anywhere.
- Camera count (4) and AC zones (salon, master, VIP, guest) are guesses.

## Open items for the owner
1. Mase generator model and its manual interlocks (rule 4 has 3 checks today).
2. Should "Shore power connected" and "Generator off or on shore power" block Done? Today only "Both engines off" blocks.
3. Model year. (Boat name set: PEGASU5.)
4. Builder lists: EmpirBus channels, NMEA 2000 devices, Dometic zones, cameras.
5. OK on the backend stack before any of it is built: N100 mini PC, Docker Compose, Node service wrapping `rules.js`, Signal K for NMEA 2000, Victron MQTT from the Cerbo GX, PWA served on the boat LAN, Tailscale for remote. No public ports.

6. Windlass brand, Victron charger model, Garmin display count and model, Seakeeper warranty start date. (Images for these are brand level or unconfirmed.)
7. 1350 or 1350 SD drives. Slip electric at C27.
8. Fresh water (105 gal shown) and holding tank (19 gal shown) come from broker listings of other VQ58s, one listing says 116 L holding: confirm on this hull. Still not published by the builder and left off: bridge clearance, cabin layout chosen, berths, heads, guest capacity. Left off the Specs card until known. Cruise speed (28 to 32 knots), cabins (1 or 2) and sleeps (2 to 4) are also listing figures shown as ranges: confirm the layout chosen.
9. Volvo EVC to NMEA 2000 gateway: fitted and on the main backbone? Engine instance numbers? Tank senders on NMEA 2000 or EVC? The Engines screen shows the standard field set (RPM, load, boost, coolant, oil pressure and temperature, fuel rate, voltage, gear, drive oil, trip fuel, warnings) with simulator values until a scan aboard.

## Manuals and product images
- Provider manuals: `MAN` map in `index.html`, keyed by maker. Every boat with a Seakeeper system gets `seakeeper-owners-guide.pdf` (SEAK199) as a Manual row and a Documents entry. Real My Boat users need this shipped to the devs' repos through Kitt.
- Seakeeper service items come from the guide: zinc anode 200 h or 3 months, inspection 1,000 h or 1 yr, dealer service 2,000 h.
- Hours update automatically on this boat, no manual log.
- Images: engines from the owner's Volvo Penta D13-IPS 1350 leaflet; generator from the Mase 2025 catalog (unit shown is a V.S.15.5, boat model unconfirmed); chartplotter is a Garmin GPSMAP 9000 series product photo; Seakeeper 9 kept.

## Specs and roles
- Specs come from vanquish-yachts.com/yachts/vq58: 17.25 m, beam 5.12 m, draft 1.25 m, 21.5 t light ship (estimate), fuel 1,595 L, 45 knots (estimate). Hull ID is still demo data.
- Share has "Manage onboard systems" per role (Captain on, others off by default) and a locked "Engines and generator: Captain and owner only" row. Both are enforced in `rules.js` `check` and tested. Engines stay monitoring only for everyone (rule 1).

## Fuel and speed
- Engines screen has a fuel burn by speed chart with best cruise, miles per gallon and range. The curve (`TRIPS` in `vq58.js`) is simulator data, not Volvo or Vanquish figures. Real version: log RPM, speed over ground and fuel rate per trip on the mini PC and replace the array.

## Not built yet
Backend, Docker Compose, `.env.example`, hardware adapters, live camera feeds and PTZ, Face ID, iPad landscape hub, builder request draft.

## Still demo data from the base
Contacts, service history, invoices, documents, warranty dates, slip electric (slip is real: Miami Beach Marina, C27, $5,750 a month from the owner; electric shown as included until confirmed), first-service hours (set to one interval from zero), value and spend figures, hull ID.

## Added 26 Nov 2026
- Lights: floorplan card with one light per room on a Gemini render of the owner's below-deck sketch (`deck.jpg`). Ids and spots are UNVERIFIED placeholders until the builder's EmpirBus light list arrives.
- Boat profile, Build specs: hull color Azzurro Met, code 592, PPG waterborne (from the Ferrari label photo), matte black roof, Veuve Clicquot pin stripe. Open: paint maker used on the hull itself, roof and stripe codes.
- Systems (records only, no write commands): Maxwell windlass, Kraken bow winch (owner wrote "Karken": confirm spelling), Side-Power bow thruster, Garmin GPSMAP 9219 x 2 at the helm. Models open for windlass, winch and thruster.
- Invoices: `INV` list in `index.html`, screen `invs` (category filter) and `invoice:<id>` (breakdown per system with icons, then the original file). Uploaded photos show as is; uploaded PDFs are drawn with pdf.js 3.11.174 from cdnjs, first 5 pages. The 6 listed invoices are demo data and do not add up to the Spend totals. Uploads live in memory only until there is a backend.

## Added 26 Nov 2026, round 2 (Version 39)
- Home: Cards is the only style. The pill bar is now quick actions: Add invoice, Invoices, Harbor Marine, Directions.
- Invoices are plain records. Approval, dispute and "Ask about $220" are removed (service centers do not submit through the app).
- Lights: two groups. Interior (below deck plus salon), Exterior (cockpit, courtesy, underwater, anchor light).
- Share: "Transfer to buyer" is last under Selling. Captain tab has an "Engines and generator" switch; off refuses generator commands in `rules.js` (`by.gen === false`), tested. Family, Service, Crew stay locked. Engines stay monitoring only (rule 1).
- Photos: windlass `p-maxwell.jpg` (Maxwell RC10 product photo), thruster `p-thruster.jpg` (Side-Power SE170), Starlink `p-starlink.jpg` (owner's photo, full frame), hull uses `boat.jpg`.
- Manuals in `MAN`: Maxwell RC8, RC10, VW10 manual (P103153 Rev 11), Side-Power SE170 installation guide (doc 6367 Rev 17), Starlink Flat High Performance setup guide. All from the makers' own sites.
- UNVERIFIED: windlass and thruster model on this hull. RC10 and SE170 files are stand-ins; Maxwell rates the RC10 for about 30 to 48 ft, so this boat may carry an RC12.
- Missing: bow winch photo and manual (no "Kraken" winch found; could be Harken, whose flush mooring winches exist in 12 and 24 V: owner to confirm). Safety gear photo. Hull and safety gear have no single maker manual.

## Added 26 Nov 2026, round 3 (Version 40)
- Invoices list has an Add button (same flow as the Add tab).
- Invoice, Original file: tap to open in a sheet with Fit and Zoom. Opens in page because new tabs and downloads are blocked in the artifact frame.
- Electronics: one serial per display (`unit` list on `elec`, same sheet as Starlink dishes). Serials are empty and "Helm, port / starboard" are placeholder names.
- Buttons: corner radius 12 px (9 px small), was a full pill.
- Home: hours figures smaller, tank levels (fuel, water, holding) under them, tap opens Engines. Levels are simulator values until tank senders are read.
- Home, Systems check: header centered, tap opens all 7 checks.
- Engines screen starts with Tanks.

## Added 26 Nov 2026, round 4 (Versions 41 and 42)
- "Holding" is now "Black water" everywhere (Specs, Home, Engines).
- Home tank levels show icons, not words: fuel pump, water drop, skull for black water. Engines Tanks card uses the same three (`TANK_IC` in `vq58.js`). Names stay as screen reader labels.
- Home quick actions (Version 43): Lights, Engines, Cameras, Harbor Marine. Add invoice, Invoices and Directions left the row (still under Add, Boat and the slip card). No "log hours": hours update automatically.
- Version 44: Back is a plain chevron (no white circle). Modes: after a step switch is flipped the card button reads "Save new settings"; tap confirms and it returns to "Run, dry run". Switches still apply and log as they are flipped.
- Version 45: Home quick action 4 is "Get ready" (was Harbor Marine): opens a sheet with the two modes, Outing and Back home, same rule checks and dry run as the Control tab. Harbor Marine stays on its contact card.
- Version 46: Outing and Back home open a run sheet. Steps appear one by one, grouped (Seakeeper, AC, lights, audio, circuits, generator), each Done or Skipped with the reason, then the dry run total. Replaces the toast.
- Version 47: Home Shore power tile and the Power screen show the last shore outage (orange dot, date, minutes; "Out since" while it is out). Simulator record only (`outage` in `vq58.js`), UNVERIFIED: the real one comes from the Cerbo GX AC input history. Keeps the latest outage only.
- Version 47 spacing pass over all 37 screens and 12 sheets at phone width: Home tiles top aligned, Pre-sale link password card moved up under "Buyers see" (was a 300 px gap), "1 job" not "1 jobs", Lights floorplan caption padding. Not checked: guest mode, "view as" roles, desktop width.
- Version 48: screens under 900 px wide (phones, tablets, phone landscape) open full screen with no mockup frame. Desktop Overview now has the VQ58 blocks: tank levels in the hero, Batteries, Shore power, Bilges, Generator tiles, Controls, Systems check, Start a mode. Not checked: real devices, desktop Control (content stays 900 px wide).
- Version 49: the Cayman flag and "George Town" in the Home header (phone and desktop) open Documents filtered to Registration. The two documents listed (USCG documentation, Florida registration) are still base demo data: no Cayman certificate of registry is on file yet.
- Version 50: the flag now opens Documents filtered to "Registration, Insurance" (search takes comma separated terms). Demo USCG and Florida entries replaced by two Cayman placeholders with no file: Certificate of British Registry, Transcript of Register. UNVERIFIED until the owner uploads the real papers.
