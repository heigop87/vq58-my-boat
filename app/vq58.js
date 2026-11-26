// VQ58 personal fork: boat control screens on top of the My Boat base. Simulator only.
// Every write goes through VQ.run (rules.js). Nothing here talks to hardware.
const V = VQ.fresh();
S.engTab = 'port'; S.fuelU = 'h';
let vqPin = ''; // guest PIN, memory only, gone on reload

Object.assign(S, { hero: 'vq58.png', photos: ['vq58.png'], name: 'PEGASU5', slip: 'Miami Beach Marina, Slip C27', marina: 'Miami Beach Marina', addr: '300 Alton Rd, Miami Beach, FL 33139', slipNo: 'C27', slipRate: 5750, elecInc: true, autoH: true }); // autoH: hours come from the boat, no manual logging (owner). Simulated until aboard. // owner gave $5,750 a month; electric treated as included until they say otherwise
S.ab.name = S.name;
Object.assign(S.H, { port: V.eng.port.h, stbd: V.eng.stbd.h, gen: V.gen.h, sk: 8 });
// shortcut: first service set one interval from zero hours, replace with the Volvo, Mase and Seakeeper first-service schedule when confirmed
IT.forEach(i => { if (i.due != null) i.due = i.ev; });
S.ab.f.year = 'New build'; // model year not confirmed, none invented
I.ctl = '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>';
SIDE[0][1].splice(1, 0, ['ctl', 'Control'], ['cams', 'Cameras']); SIDEK.push('ctl', 'cams');

document.head.insertAdjacentHTML('beforeend', `<style>
.vqt{display:grid;grid-template-columns:1fr;gap:12px;flex:none}
/* batteries, shore power and generator all open Power, so they are one card */
.vqt .card.vqp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 12px}.vqp>span{display:block;min-width:0}.vqp>.vqo{display:flex;grid-column:1/-1}.vqt .vqp b{font-size:22px}.vqd .vqp{grid-column:span 3}
.vqt .card{display:flex;flex-direction:column;justify-content:flex-start;padding:14px 18px;text-align:left;font:inherit;color:inherit;cursor:pointer}
.vqg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;cursor:pointer}.vqg .s{display:flex;justify-content:space-between;align-items:center}.vqg .s b{color:var(--ink);font-weight:600}
body:not(.desk) .vqt .card.vqb{flex-direction:row;align-items:baseline;gap:10px;padding:11px 18px}body:not(.desk) .vqt .vqb b{font-size:17px;margin:0 auto 0 0}
.vqo{display:flex;align-items:center;gap:6px;margin-top:6px;color:var(--or)}.vqo::before{content:"";flex:none;width:6px;height:6px;border-radius:3px;background:currentColor}.vqt b{display:block;font:400 28px/1.1 var(--fig);margin:4px 0}
.vqcam{aspect-ratio:16/9;border-radius:16px;background:var(--fill2);display:flex;align-items:center;justify-content:center;color:var(--l2);font-size:13px;flex:none}
.vqstep{display:flex;align-items:center;gap:10px}.vqstep b{font:400 22px var(--fig);min-width:52px;text-align:center}
.vqrun{animation:in .4s both}.ov:has(.vqrun.d),.sh:has(.vqrun.d){animation:none}@media (prefers-reduced-motion:reduce){.vqrun{animation:none}}
.vq2{display:flex;gap:8px;padding:8px 0 14px}.vq2 .btn{flex:1}
</style>`);

const by = () => V.guest ? { who: 'Guest', device: 'iPad', role: 'guest' } : { who: S.as, device: 'Phone', role: S.as.toLowerCase(), sys: can(6), gen: S.as != 'Captain' || S.capGen }; // role and the 'Manage onboard systems' permission from Share
// shortcut: timers stand in for real device state (Seakeeper spin times, pump run), replace with live readings aboard.
const later = (ms, f) => setTimeout(() => { f(); render(); }, ms);

A.cmd = (t, x = '') => {
  const [id, v, k] = x.split('|'), r = VQ.run(V, { t, ...(id && { id }), ...(v !== undefined && { v: +v }), ...(k && { k }) }, by());
  if (!r.ok && r.why == 'Needs the owner PIN') return void (S.sheet = { k: 'vqguest', v: '', err: '' });
  if (!r.ok) return toast(r.why);
  if (t == 'mode.set') (S.md ||= {})[id] = 1; // edited since last save: button reads Save new settings
  if (t == 'sk.spin') later(6000, () => { if (V.sk.st == 'spinup') V.sk.st = 'ready'; });
  if (t == 'sk.stop' || t == 'mode.done') later(6000, () => { if (V.sk.st == 'spindown') V.sk = { st: 'off', pw: 0 }; });
  if (t == 'mode.ready') later(6000, () => { if (V.sk.st == 'spinup') V.sk.st = 'ready'; });
  if (t == 'bilge.run') later(3000, () => { V.bilge[id].run = 0; V.bilge[id].cy++; });
  if (r.steps) S.sheet = { k: 'vqrun', v: t.slice(5), steps: r.steps, at: Date.now(), err: '' }; // play the steps one by one
};
// Simulator test knobs. These fake sensor readings, they are not boat commands.
A.vqsim = p => { if (V.guest) return toast('Needs the owner PIN'); const k = p.split('.'), o = k.slice(0, -1).reduce((a, b) => a[b], V); o[k.at(-1)] = o[k.at(-1)] ? 0 : 1; if (p == 'shore.on') outage(V.shore, Date.now()); };
A.vqguest = () => {
  const p = val('vqpin');
  if (!V.guest) { if (!/^\d{4,8}$/.test(p)) return fail('Enter 4 to 8 digits'); vqPin = p; V.guest = true; }
  else { if (p !== vqPin) return fail('Wrong PIN'); V.guest = false; vqPin = ''; }
  S.sheet = null;
};
SH.vqguest = () => [V.guest ? 'Owner PIN' : 'Start guest mode', `${V.guest ? '' : '<div class="note">Guests get AC, lights, audio and cameras. Set a PIN to leave guest mode.</div>'}${fld('vqpin', 'PIN', '', 'password', 'inputmode="numeric" autocomplete="off"')}${err()}${btns(`<button class="btn pri" ${at('vqguest')}>${V.guest ? 'Unlock' : 'Start'}</button>`)}`];

const row = (t, s, r = '', a = '') => `<div class="row" ${a}><div class="grow"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</div>${r}</div>`;
const link = (t, s, to) => row(t, s, '<span class="chev"></span>', tap('go', to));
const sw = (on, t, id, label, k) => tg(on, 'cmd', t, label, `${id}|${on ? 0 : 1}${k ? '|' + k : ''}`);
const card = (h, body, r = '') => `<section class="card">${h ? `<div class="ch"><h2>${h}</h2>${r}</div>` : ''}${body}</section>`;
const checks = l => l.map(([n, ok]) => row(n, '', chip(ok ? 'ok' : 'err', ok ? 'Pass' : 'Fail'))).join('');
const step = (val, t, id, d, unit) => `<div class="vqstep"><button class="btn sm" ${at('cmd', t, id + '|' + (val - d))} aria-label="Lower">−</button><b>${val}${unit}</b><button class="btn sm" ${at('cmd', t, id + '|' + (val + d))} aria-label="Raise">+</button></div>`;
const SKL = { off: 'Off', spinup: 'Spinning up, locked', ready: 'At speed, locked. Engage at the helm', spindown: 'Spinning down, stays powered' };
const NAMES = { ac: { salon: 'Lounge', master: 'Primary Bedroom', guest: 'Guest Bedroom' }, light: { salon: 'Salon', cockpit: 'Cockpit', courtesy: 'Courtesy and deck', uw: 'Underwater', anchor: 'Anchor light', master: 'Master cabin', bath: 'Bathroom', lounge: 'Lounge', galley: 'Main galley', fwd: 'Forward cabin' }, bilge: { fwd: 'Forward', mid: 'Mid', er: 'Engine room', aft: 'Aft' }, audio: { cockpit: 'Cockpit', salon: 'Salon' } };
const cycles = () => Object.values(V.bilge).reduce((a, b) => a + b.cy, 0);
const alerts = () => [V.gen.co && 'CO alarm', V.gen.fault && 'Generator fault', V.gen.exhHot && 'Generator exhaust hot', V.highWater && 'High water'].filter(Boolean);
const acRow = z => row(NAMES.ac[z] + ' AC', `${V.ac[z].on ? '' : 'Off · '}Now ${V.ac[z].now}°F`, step(V.ac[z].set, 'ac.temp', z, 1, '°')); // on and off lives on the AC screen

// Last shore outage. Simulator record, UNVERIFIED: the real one comes from the Cerbo GX AC input history.
// shortcut: keeps only the latest outage, add a list when the backend logs them.
const outage = (sh, now) => { if (!sh.on) sh.out = { at: now }; else if (sh.out) sh.out.min = Math.max(1, Math.round((now - sh.out.at) / 6e4)); };
{ const t = { on: 0 }; outage(t, 0); t.on = 1; outage(t, 3e5); console.assert(t.out.min == 5, 'outage'); }
const outTxt = () => { const o = V.shore.out; if (!o) return ''; const d = new Date(o.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); return o.min ? `Last outage ${d}, ${o.min} min` : `Out since ${d}`; };
const tiles = () => { const b = V.batt; return `<div class="vqt">
  <button class="card vqp" ${at('go', 'pwr')}>
   <span><span class="s">Batteries</span><b>${b.soc}%</b><span class="s">${V.pw.chg ? `Charging +${b.a} A` : 'Not charging'}</span></span>
   <span><span class="s">Shore power</span><b>${V.shore.on ? 'On' : 'Off'}</b><span class="s">Limit ${V.shore.limit} A</span></span>
   <span><span class="s">Generator</span><b>${V.gen.on ? 'Running' : 'Off'}</b><span class="s">${VQ.genChecks(V).every(c => c[1]) ? 'Ready' : 'Start blocked'}</span></span>
   ${outTxt() && `<span class="s vqo">${outTxt()}</span>`}</button>
  <button class="card vqb" ${at('go', 'bilge')}><span class="s">Bilges</span><b>${V.highWater ? 'High water' : 'All dry'}</b><span class="s">${cycles()} ${cycles() == 1 ? 'cycle' : 'cycles'} today</span></button>
 </div>`; };
const sysChecks = () => [['Batteries above 50%', V.batt.soc >= 50], ['Bilges dry', !V.highWater], ['Generator ready to start', VQ.genChecks(V).every(c => c[1])], ...VQ.doneChecks(V), ['No active alerts', !alerts().length]];
SH.vqchecks = () => ['Systems check', checks(sysChecks()) + btns()];
const TANK_IC = { fuel: '<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M8 7h4v4H8zM15 11h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V9l-3-3"/>', water: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>', hold: '<path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="12" r="1"/><path d="m12.5 17-.5-1-.5 1h1z"/>' }; // pump, drop, skull for black water
SC.vqglance = () => `<div class="vqg" ${tap('go', 'engs')} aria-label="Open tanks">${[['fuel', 'Fuel'], ['water', 'Water'], ['hold', 'Black water']].map(([k, n]) => `<div><div class="s"><span role="img" aria-label="${n}" title="${n}">${svg(TANK_IC[k], 18)}</span><b>${V.tanks[k]}%</b></div><div class="meter"><i style="width:${V.tanks[k]}%;background:var(--ink)"></i></div></div>`).join('')}</div>`; // simulator levels until tank senders are read
const MODE = { ready: 'Outing', done: 'Back home' };
// The active mode is the last one run. shortcut: it does not clear when single switches change afterwards, compare live state once the boat reports it.
const modeChip = () => V.mode ? chip('ok', MODE[V.mode] + ' active') : chip('', 'No mode active');
const modeBtns = () => `<div class="vq2">${Object.keys(MODE).map(m => `<button class="btn${V.mode == m ? ' pri' : ''}" aria-pressed="${V.mode == m}" ${at('cmd', 'mode.' + m)}>${MODE[m]}${V.mode == m ? ' · On' : ''}</button>`).join('')}</div>`;
// shortcut: simulator fix, UNVERIFIED, no tracker aboard yet. The live fix and last moved time come from the tracker over the VPN, never from the public site.
// The map is an OpenStreetMap embed. The artifact viewer blocks embeds, so there it is the Map link only.
const locCard = () => { const { lat, lon, moved } = V.pos, d = .004, when = new Date(moved).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return card('Location', (/github\.io$|^localhost$|^$/.test(location.hostname) ? `<iframe title="Map with the boat position" loading="lazy" style="width:100%;height:240px;border:0;border-radius:12px;display:block" src="https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&layer=mapnik&marker=${lat},${lon}"></iframe>` : '')
    + row(VQ.ddm(lat, 'N', 'S') + ' ' + VQ.ddm(lon, 'E', 'W'), 'At the home slip', `<a class="btn sm" target="_blank" rel="noopener" href="https://maps.apple.com/?ll=${lat},${lon}&q=PEGASU5">Map</a>`)
    + row('Last moved', 'Simulator position, no tracker yet', `<span class="t">${when}</span>`)); };
// Mode run: one row per kind of step, shown in order. [title, what, ok, why]
const STEP = { 'sk.spin': 'Seakeeper spins up, stays locked', 'sk.stop': 'Seakeeper spins down, stays powered', 'ac.set': 'Air conditioning', 'light.set': 'Lights', 'audio.set': 'Audio', 'cir.set': 'Circuits', 'gen.start': 'Generator starts' };
const CIRN = { heater: 'Water heater', ice: 'Ice maker', outlets: 'Outlets' };
const runRows = steps => Object.values(steps.reduce((g, s) => { const r = g[s.t] ||= [STEP[s.t] + (s.v === undefined ? '' : s.v ? ' on' : ' off'), [], 1, '']; if (s.id) r[1].push((NAMES[s.t.split('.')[0]] || CIRN)[s.id]); if (!s.ok) { r[2] = 0; r[3] = s.why; } return g; }, {}));
console.assert(runRows([{ t: 'light.set', id: 'salon', v: 1, ok: true }, { t: 'light.set', id: 'cockpit', v: 1, ok: false, why: 'x' }]).join() == 'Lights on,Salon,Cockpit,0,x', 'runRows');
// Negative delay after a re-render keeps finished rows in place instead of replaying them.
SH.vqrun = m => { const h = S.sheet, rows = runRows(h.steps), el = Date.now() - h.at, n = h.steps.filter(s => s.ok).length;
  const li = (i, html) => `<div class="vqrun${el > 600 ? ' d' : ''}" style="animation-delay:${i * 450 - el}ms">${html}</div>`;
  return [m == 'ready' ? 'Outing' : 'Back home', rows.map(([t, w, ok, why], i) => li(i, row(t, ok ? w.join(', ') : why, chip(ok ? 'ok' : 'err', ok ? 'Done' : 'Skipped')))).join('') + li(rows.length, `<div class="note">${n} of ${h.steps.length} steps, dry run. Nothing was sent to the boat.</div>`) + btns()]; };
SH.vqmodes = () => ['Get ready', `<div class="note">Outing preps the boat. Back home shuts it down. Both are dry run.</div><div style="padding:8px 0">${modeChip()}</div>${modeBtns()}${btns()}`]; // Home quick action
// Home screen block for the VQ58: system controls, systems check, then the two modes.
SC.vqhome = () => `${V.guest ? `<div class="lock">${chip('', 'Guest mode')}</div>` : ''}
 ${tiles()}
 ${card('Controls', acRow('salon') + row('Exterior lights', 'Courtesy and deck', sw(V.light.courtesy, 'light.set', 'courtesy', 'Exterior lights')) + link('All controls', 'AC, lighting, audio, Seakeeper, cameras', 'ctl'))}
 ${(c => { const bad = c.filter(x => !x[1]); // Home shows only what failed; tap for every check
  return `<section class="card" ${tap('sheet', 'vqchecks')} style="cursor:pointer"><div class="ch" style="padding-top:0;min-height:56px"><h2>Systems check</h2><span style="display:flex;align-items:center;gap:8px">${chip(bad.length ? 'err' : 'ok', bad.length ? bad.length + ' to check' : 'All ' + c.length + ' pass')}<span class="chev"></span></span></div>${checks(bad)}</section>`; })(sysChecks())}
 ${locCard()}
 ${card('Cameras', link('View cameras', 'Cockpit, bow, engine room, swim platform', 'cams'))}
 ${card('Start a mode', `<div class="s" style="padding-bottom:4px">Outing spins up the Seakeeper and brings AC, lights and audio on. Back home shuts the boat down safely.</div>${modeBtns()}${link('Edit modes', 'Steps and checks', 'modes')}`, modeChip())}`;

SC.ctl = () => {
  const al = alerts();
  return topHd('Control', me()) + `<div class="body gl">
 <div class="lock">${chip('warn', 'Simulator, dry run')}${V.guest ? chip('', 'Guest mode') : ''}<span>No command reaches the boat</span></div>
 ${locCard()}
 ${card('Cameras', link('View cameras', 'Cockpit, bow, engine room, swim platform', 'cams'))}
 ${card('Start a mode', `<div class="s" style="padding-bottom:4px">Outing spins up the Seakeeper and brings AC, lights and audio on. Back home shuts the boat down safely.</div>${modeBtns()}${link('Edit modes', 'Steps and checks', 'modes')}`, modeChip())}
 ${tiles()}
 <div class="grp">Quick controls</div>
 ${card('', acRow('salon') + acRow('master') + acRow('guest') + row('Exterior lights', 'Courtesy and deck', sw(V.light.courtesy, 'light.set', 'courtesy', 'Exterior lights')) + row('Underwater lights', '', sw(V.light.uw, 'light.set', 'uw', 'Underwater lights')) + lightsLink() + link('All controls', 'AC, audio, circuits', 'ctls'))}
 ${card('', row('Seakeeper 9', SKL[V.sk.st], V.sk.st == 'off' || V.sk.st == 'spindown' ? `<button class="btn sm" ${at('cmd', 'sk.spin')}>Spin up</button>` : `<button class="btn sm" ${at('cmd', 'sk.stop')}>Stop</button>`) + link('Engines and tanks', 'Monitoring only', 'engs'))}
 <div class="grp">Alerts</div>
 ${card('', al.length ? al.map(a => row(a, '', chip('err', 'Active'))).join('') : row('No active alerts.', ''))}
 ${V.guest ? `<button class="btn" ${at('sheet', 'vqguest')}>Owner PIN</button>` : `<div class="grp">Simulator</div>
 ${card('', [['eng.port.on', 'Port engine running'], ['eng.stbd.on', 'Starboard engine running'], ['gen.co', 'CO alarm'], ['gen.fault', 'Generator fault'], ['shore.on', 'Shore power connected'], ['highWater', 'High water alarm']].map(([p, l]) => row(l, '', tg(p.split('.').reduce((a, k) => a[k], V), 'vqsim', p, l))).join('') + row('Guest mode', 'AC, lights, audio and cameras only', `<button class="btn sm" ${at('sheet', 'vqguest')}>Start</button>`) + link('Command log', V.log.length + ' entries', 'clog'))}
 <div class="note">Test switches fake the sensors so the safety rules can be tried. They are not boat commands.</div>`}
 </div>`;
};

// On and off on a system's own page, only where a command exists. Same A.cmd path, so every rule and the log apply.
// Windlass, winch, thruster, Starlink and chartplotters are records only: no card.
SC.vqsys = id => id == 'gen' ? card('Control', row(V.gen.on ? 'Running' : 'Off', 'Checked before remote start', V.gen.on ? `<button class="btn sm" ${at('cmd', 'gen.stop')}>Stop</button>` : `<button class="btn sm" ${at('cmd', 'gen.start')}>Start</button>`) + checks(VQ.genChecks(V)))
  : id == 'sk' ? card('Control', row(SKL[V.sk.st], 'Stays locked. Engage at the helm', V.sk.st == 'off' || V.sk.st == 'spindown' ? `<button class="btn sm" ${at('cmd', 'sk.spin')}>Spin up</button>` : `<button class="btn sm" ${at('cmd', 'sk.stop')}>Stop</button>`))
  : id == 'port' || id == 'stbd' ? card('Control', row('Monitoring only', 'Start and stop stay at the helm'))
  : '';
SC.pwr = () => {
  const b = V.batt, ok = VQ.genChecks(V);
  return nav('Power') + `<div class="body">
 ${card('House batteries', `<div class="big" style="padding:6px 0 12px"><div><b>${b.soc}%</b><span>Charge</span></div><div><b>${b.v}</b><span>Volts</span></div><div><b>${b.load}</b><span>Load kW</span></div></div>`, chip(V.pw.chg ? 'ok' : '', V.pw.chg ? `+${b.a} A` : 'Idle'))}
 ${card('Shore power', row('Input current limit', '0 to 50 A', step(V.shore.limit, 'power.limit', '', 2, ' A')) + row('Inverter', 'Powers AC loads off shore power', sw(V.pw.inv, 'power.set', 'inv', 'Inverter')) + row('Charger', '', sw(V.pw.chg, 'power.set', 'chg', 'Charger')) + (outTxt() && row(outTxt(), 'Simulator record')), chip(V.shore.on ? 'ok' : 'warn', V.shore.on ? 'Connected' : 'Off'))}
 ${card('Mase generator', `<div class="s">Checked before remote start</div>${checks(ok)}<div class="vq2">${V.gen.on ? `<button class="btn" ${at('cmd', 'gen.stop')}>Stop generator</button>` : `<button class="btn pri" ${at('cmd', 'gen.start')}>Start generator</button>`}</div>${row('Auto-start', 'When batteries drop below 30% and shore power is lost', sw(V.pw.auto, 'power.set', 'auto', 'Auto-start'))}`, chip(V.gen.on ? 'ok' : '', `${V.gen.on ? 'Running' : 'Off'} · ${V.gen.h} h`))}
 <div class="note">Mase manual interlocks are not in yet. Remote start stays simulator only until they are.</div></div>`;
};

SC.ctls = () => nav('Controls') + `<div class="body">
 ${card(NAMES.ac.salon + ' AC', row('Set point', `Now ${V.ac.salon.now}°F`, step(V.ac.salon.set, 'ac.temp', 'salon', 1, '°')), sw(V.ac.salon.on, 'ac.set', 'salon', NAMES.ac.salon + ' AC'))}
 ${card('Bedroom AC', ['master', 'guest'].map(acRow).join(''))}
 ${card('', lightsLink())}
 ${card('Audio', Object.keys(V.audio).map(z => row(NAMES.audio[z], 'Last source', sw(V.audio[z], 'audio.set', z, NAMES.audio[z] + ' audio'))).join(''))}
 ${card('Circuits', row('Water heater', '', sw(V.cir.heater, 'cir.set', 'heater', 'Water heater')) + row('Ice maker', 'Cockpit', sw(V.cir.ice, 'cir.set', 'ice', 'Ice maker')) + row('Refrigeration', 'Always on', svg(I.lock, 16)) + row('Cockpit outlets', '', sw(V.cir.outlets, 'cir.set', 'outlets', 'Cockpit outlets')))}
 <div class="note">Available circuits follow the EmpirBus setup of the boat. Safety circuits stay locked.</div></div>`;

// UNVERIFIED: groups and ids are placeholders. The builder's EmpirBus light list replaces LIGHTS; ids not listed fall under Other.
// Below deck plan (deck.jpg, rendered from the builder's Top view drawing). UNVERIFIED: one light per room is a placeholder.
// shortcut: spots are eyeballed, percent of the image; redo from the builder's light list, one spot per EmpirBus channel.
const SPOTS = { master: [16, 63], bath: [34, 28], lounge: [52, 35], galley: [47, 73], fwd: [75, 50] };
const deckPlan = () => {
  const on = Object.keys(SPOTS).filter(l => V.light[l]), m = on.map(l => `radial-gradient(17% 30% at ${SPOTS[l][0]}% ${SPOTS[l][1]}%,transparent 35%,#000)`).join(',');
  return `<div style="position:relative;border-radius:16px;overflow:hidden;background:#fff"><img src="deck.jpg" alt="Below deck floorplan, bow to the right" style="display:block;width:100%">
  <div style="position:absolute;inset:0;background:rgba(20,26,38,.42);pointer-events:none;${m ? `-webkit-mask:${m};mask:${m};-webkit-mask-composite:source-in;mask-composite:intersect` : ''}"></div>
  ${Object.entries(SPOTS).map(([l, [x, y]]) => `<button ${at('cmd', 'light.set', `${l}|${V.light[l] ? 0 : 1}`)} aria-pressed="${!!V.light[l]}" aria-label="${NAMES.light[l]} light" style="position:absolute;left:${x}%;top:${y}%;width:44px;height:44px;margin:-22px;border:0;border-radius:50%;cursor:pointer;background:${V.light[l] ? 'radial-gradient(#ffd98a 0 22%,rgba(255,217,138,.45) 24%,rgba(255,217,138,0) 70%)' : 'radial-gradient(#fff 0 18%,rgba(255,255,255,.35) 20% 30%,transparent 32%)'}"></button>`).join('')}</div>`;
};
const LIGHTS = [['Interior', [...Object.keys(SPOTS), 'salon']], ['Exterior', ['cockpit', 'courtesy', 'uw', 'anchor']]];
const lightsLink = () => link('Lights', `${Object.values(V.light).filter(Boolean).length} of ${Object.keys(V.light).length} on`, 'lights');
SC.lights = () => {
  const rest = Object.keys(V.light).filter(l => !LIGHTS.some(g => g[1].includes(l)));
  console.assert(Object.keys(SPOTS).every(l => l in V.light), 'plan spot without a light');
  return nav('Lights') + `<div class="body">
  ${card('Floorplan', deckPlan() + '<div class="note" style="padding:10px 16px 14px">Tap a light on the plan.</div>')}
 ${[...LIGHTS, ...(rest.length ? [['Other', rest]] : [])].map(([g, ids]) => card(g, ids.map(l => row(NAMES.light[l] || l, '', sw(V.light[l], 'light.set', l, NAMES.light[l] || l))).join(''), chip('', ids.filter(l => V.light[l]).length + ' on'))).join('')}
 <div class="note">The light list follows the EmpirBus setup of the boat.</div></div>`;
};

SC.cams = () => nav('Cameras') + `<div class="body">
 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px">${['Cockpit main', 'Bow', 'Engine room', 'Swim platform'].map(c => `<div><div class="grp">${c}</div><div class="vqcam">No feed in the simulator</div></div>`).join('')}</div>
 ${card('', row('Person detection alerts', 'Ignores birds, waves and shadows', sw(V.al.person, 'alert.set', 'person', 'Person detection alerts')))}
 </div>`;

// Fuel curve: [rpm, knots, gal/h both engines]. Simulator samples, not Volvo or Vanquish figures. Real trips replace this array.
const TRIPS = [[600, 6, 3], [1000, 9, 12], [1400, 12, 32], [1700, 20, 52], [1900, 27, 64], [2100, 33, 78], [2250, 38, 90], [2400, 43, 102]];
// Best cruise = most miles per gallon once on plane. shortcut: plane is fixed at 18 knots, take it from the trip data when real logs exist.
const bestCruise = t => t.filter(p => p[1] >= 18).reduce((a, b) => b[1] / b[2] > a[1] / a[2] ? b : a);
console.assert(bestCruise(TRIPS)[1] == 33 && bestCruise([[1, 5, 1], [2, 20, 40], [3, 30, 90]])[1] == 20, 'best cruise ignores idle and picks the top miles per gallon');
const fuelCard = () => {
  const nm = S.fuelU == 'nm', f = p => nm ? p[2] / p[1] : p[2], b = bestCruise(TRIPS), x = k => 34 + k * 6, y = g => 130 - g * (nm ? 40 : 1), mpg = (b[1] / b[2]).toFixed(2);
  return card('Fuel and speed', `${seg('fuelU', [['h', 'Gal per hour'], ['nm', 'Gal per nm']])}<svg viewBox="0 0 320 152" width="100%" role="img" aria-label="Fuel burn by speed. Best cruise ${b[1]} knots at ${b[2]} gallons per hour, ${(b[2] / b[1]).toFixed(2)} per nautical mile." style="display:block;margin-top:10px;font:500 10px var(--lab);fill:var(--l2)">
 ${(nm ? [0, 1, 2, 3] : [0, 50, 100]).map(g => `<path d="M34 ${y(g)}H310" stroke="var(--sep)"/><text x="28" y="${y(g) + 3}" text-anchor="end">${g}</text>`).join('')}
 ${[0, 10, 20, 30, 40].map(k => `<text x="${x(k)}" y="146" text-anchor="middle">${k}</text>`).join('')}
 <path d="M${TRIPS.map(p => x(p[1]) + ' ' + y(f(p))).join('L')}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
 ${TRIPS.map(p => `<circle cx="${x(p[1])}" cy="${y(f(p))}" r="${p == b ? 5 : 2.5}" fill="${p == b ? 'var(--ink)' : '#fff'}" stroke="var(--ink)" stroke-width="1.5"/>`).join('')}
 <text x="${x(b[1]) - 8}" y="${y(f(b)) - 10}" text-anchor="end" style="fill:var(--ink);font-size:11px">Best cruise</text></svg>
 <div class="s" style="margin:2px 0 6px">Gallons per ${nm ? 'nautical mile' : 'hour'}, both engines, by speed in knots</div>` +
    [['Best cruise', `${b[1]} knots at ${b[0].toLocaleString()} rpm`], ['Fuel burn at best cruise', nm ? (b[2] / b[1]).toFixed(2) + ' gal/nm' : b[2] + ' gal/h'], ['Miles per gallon', mpg + ' nm'], ['Range, full tanks, 10% reserve', Math.round(421 * .9 * b[1] / b[2]) + ' nm'], ['Top speed logged', TRIPS.at(-1)[1] + ' knots']].map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join('') +
    `<div class="s" style="padding:8px 0 4px">Simulator data. Fills in from your own trips once the boat is connected.</div>`);
};
// UNVERIFIED: standard NMEA 2000 engine fields with simulator idle values. What this boat sends depends on a Volvo EVC gateway. Read only (Rule 1).
SC.engs = () => nav('Engines', chip('', 'Monitoring only')) + `<div class="body">
 <div style="position:sticky;top:-16px;z-index:10;margin:-16px -16px -8px;padding:12px 16px 8px;background:rgba(239,242,246,.7);backdrop-filter:blur(18px) saturate(1.8);-webkit-backdrop-filter:blur(18px) saturate(1.8)">${seg('engTab', [['port', 'Port'], ['stbd', 'Starboard']])}</div>
 ${card('Tanks', [['fuel', 421, 'Fuel'], ['water', 105, 'Fresh water'], ['hold', 19, 'Black water']].map(([k, cap, n]) => `<div class="row">${svg(TANK_IC[k], 22)}<div class="grow"><div class="t" style="display:flex;justify-content:space-between;gap:8px"><span>${n} · ${V.tanks[k]}%</span><span class="s">${Math.round(cap * V.tanks[k] / 100)} of ${cap} gal</span></div><div class="meter"><i style="display:block;height:100%;width:${V.tanks[k]}%;background:var(--ink)"></i></div></div></div>`).join(''))}
 ${[['port', 'Port'], ['stbd', 'Starboard']].filter(e => e[0] == S.engTab).map(([k, n]) => { const e = V.eng[k]; return card(n + ' · Volvo Penta D13-IPS 1350', [['Hours', e.h + ' h'], ['RPM', e.on ? 600 : 0], ['Engine load', (e.on ? 12 : 0) + '%'], ['Boost', (e.on ? 2 : 0) + ' psi'], ['Coolant', e.cool + '°F'], ['Oil pressure', (e.on ? 58 : e.oil) + ' psi'], ['Oil temperature', (e.on ? 185 : 80) + '°F'], ['Fuel rate', (e.on ? 1.6 : 0) + ' gal/h'], ['Voltage', V.batt.v + ' V'], ['Gear', 'Neutral'], ['Drive oil', (e.on ? 140 : 80) + '°F'], ['Trip fuel', '0 gal'], ['Warnings', 'None']].map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join(''), chip(e.on ? 'ok' : '', e.on ? 'Running' : 'Off')); }).join('')}
 ${fuelCard()}
 ${card('Each engine', [['Crankshaft power','1,000 hp at 2,400 rpm'],['Propshaft power','942 hp at 2,400 rpm'],['Displacement','12.8 L, in-line 6'],['Aspiration','Dual stage turbo'],['Rating','R5'],['Dry weight with propellers','5,419 lb'],['Voltage','24 V'],['Speed range','19 to 42 knots']].map(([a, b]) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`).join('') + '<div class="note">From the Volvo Penta data sheet, January 2020.</div>')}
 ${card('', link('Bilge pumps', `${V.highWater ? 'High water' : 'All dry'} · ${cycles()} today`, 'bilge'))}
 <div class="note">Engines can be watched from anywhere but never started or controlled remotely.</div></div>`;

SC.bilge = () => nav('Bilges') + `<div class="body">
 ${card('Pumps', Object.keys(V.bilge).map(p => row(NAMES.bilge[p], V.bilge[p].run ? 'Running' : `Auto · ${V.bilge[p].cy} ${V.bilge[p].cy == 1 ? 'cycle' : 'cycles'} today`, `<button class="btn sm" ${at('cmd', 'bilge.run', p)}${V.bilge[p].run ? ' disabled' : ''}>Run 30 s</button>`)).join('') + row('High water alarm', '', chip(V.highWater ? 'err' : 'ok', V.highWater ? 'Alarm' : 'Normal')))}
 <div class="grp">Alert me when</div>
 ${card('', [['long', 'A pump runs longer than 60 s'], ['cyc', 'More than 5 cycles in an hour'], ['cam', 'Show engine room camera with alerts']].map(([k, l]) => row(l, '', sw(V.al[k], 'alert.set', k, l))).join(''))}
 <div class="note">Float switches always stay in charge. The app can add a manual run but can never turn automatic pumping off.</div></div>`;

const STEPS = {
  ready: [['sk', 'Seakeeper 9', 'Spins up first, stays locked until you engage'], ['ac', 'AC, all zones', 'On at each set point'], ['light', 'Lights', 'Salon, cockpit and courtesy'], ['audio', 'Audio', 'Salon and cockpit zones, last source'], ['heater', 'Water heater', 'On'], ['gen', 'Generator', 'Only if shore power is off']],
  done: [['light', 'All lights', 'Off, anchor light left alone'], ['ac', 'AC, all zones', 'Off'], ['audio', 'Audio', 'All zones off'], ['sk', 'Seakeeper 9', 'Stops, stays powered until spun down'], ['heater', 'Water heater', 'Off'], ['ice', 'Ice maker and outlets', 'Off']],
};
const modeCard = (m, h) => card(h, STEPS[m].map(([k, t, s], i) => row(`${i + 1}. ${t}`, s, sw(V.modes[m][k], 'mode.set', m, 'Include ' + t, k))).join('') + `<div class="vq2">${S.md?.[m] ? `<button class="btn pri" ${at('vqmsave', m)}>Save new settings</button>` : `<button class="btn pri" ${at('cmd', 'mode.' + m)}>Run, dry run</button>`}</div>`);
A.vqmsave = m => { delete S.md[m]; toast('Settings saved'); }; // switches already apply and are logged as they are flipped
SC.modes = () => nav('Modes') + `<div class="body">
 ${modeCard('ready', 'Outing')}
 ${card('Checked first', checks(VQ.doneChecks(V)))}
 ${modeCard('done', 'Back home')}
 <div class="note">Always stays on: bilge pumps, refrigeration, battery charger, cameras and alerts, Starlink and Peplink. Back home only runs with both engines off.</div></div>`;

SC.clog = () => nav('Command log') + `<div class="body">${V.log.length ? card('', V.log.slice(0, 80).map(l => row(esc([l.t, l.id, l.v].filter(x => x !== undefined).join(' ')), esc(`${l.who} · ${l.device} · ${new Date(l.at).toLocaleTimeString()}${l.src ? ' · ' + l.src : ''}${l.ok ? '' : ' · ' + l.why}`), chip(l.ok ? 'ok' : 'err', l.ok ? 'Dry run' : 'Refused'))).join('')) : '<div class="note">No commands yet.</div>'}</div>`;

render();
