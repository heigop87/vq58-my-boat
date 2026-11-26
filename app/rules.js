// VQ58 hard safety rules, outing sequencer and write log. Pure: no DOM, no timers, no network.
// Runs in the app and under node (rules.test.js). The mini PC backend reuses this file as is.
// UNVERIFIED: every id below (circuits, zones, pumps) is a placeholder until the builder's
// EmpirBus, NMEA 2000 and Dometic lists arrive. No PGN, channel or device address is assumed.
const VQ = (() => {
  // Rule 8: all a guest on the iPad may touch.
  const GUEST_OK = ['ac', 'light', 'audio', 'camera'];
  // Rule 5: 'Done with outing' never switches these off.
  const PROTECTED = ['bilge', 'fridge', 'chg', 'cameras', 'alerts', 'starlink', 'peplink', 'minipc', 'cerbo'];

  const fresh = () => ({
    dry: true, // Rule: dry run ON by default. No hardware adapter exists in Phase 0.
    guest: false,
    batt: { soc: 86, v: 26.4, a: 12, load: 2.1 },
    shore: { on: 1, limit: 32 },
    pw: { inv: 1, chg: 1, auto: 0 },
    gen: { on: 0, h: 10, co: 0, fault: 0, exhSensor: 1, exhHot: 0 },
    sk: { st: 'off', pw: 0 }, // off | spinup | ready (locked) | spindown
    eng: { port: { on: 0, h: 12, cool: 82, oil: 0 }, stbd: { on: 0, h: 12, cool: 83, oil: 0 } },
    tanks: { fuel: 72, water: 58, hold: 15 },
    ac: { salon: { on: 1, set: 72, now: 76 }, master: { on: 0, set: 70, now: 77 }, guest: { on: 0, set: 72, now: 78 } },
    light: { salon: 0, cockpit: 0, courtesy: 1, uw: 0, anchor: 0, master: 0, bath: 0, lounge: 0, galley: 0, fwd: 0 },
    cir: { heater: 1, ice: 0, fridge: 1, outlets: 0 },
    audio: { cockpit: 0, salon: 0 },
    bilge: { fwd: { cy: 0, run: 0 }, mid: { cy: 0, run: 0 }, er: { cy: 0, run: 0 }, aft: { cy: 1, run: 0 } },
    highWater: 0,
    al: { long: 1, cyc: 1, cam: 1, person: 1 },
    modes: { ready: { sk: 1, ac: 1, light: 1, audio: 1, heater: 1, gen: 0 }, done: { light: 1, ac: 1, audio: 1, sk: 1, heater: 1, ice: 1 } },
    mode: '', // last mode run: '' | ready | done
    pos: { lat: 25.7707, lon: -80.14, moved: '2026-11-22T21:40:00Z' }, // UNVERIFIED simulator fix at the home slip, no tracker fitted yet. Stored as decimal degrees, shown as degrees and decimal minutes.
    log: [],
  });

  // Rule 4. shortcut: Mase manual interlocks are not in yet, add them here when the model is confirmed.
  const genChecks = s => [
    ['CO alarms clear', !s.gen.co],
    ['No active generator faults', !s.gen.fault],
    ...(s.gen.exhSensor ? [['Exhaust temperature normal', !s.gen.exhHot]] : []),
  ];
  // Rule 6 blocks. The other two are shown, not blocking: open item for the owner.
  const doneChecks = s => [
    ['Both engines off', !s.eng.port.on && !s.eng.stbd.on],
    ['Generator off or on shore power', !s.gen.on || !!s.shore.on],
    ['Shore power connected', !!s.shore.on],
  ];

  const no = why => ({ ok: false, why });
  const ddm = (v, pos, neg) => { const a = Math.abs(v), d = Math.floor(a); return `${d}°${((a - d) * 60).toFixed(3)}'${v < 0 ? neg : pos}`; };
  // Web Mercator tile position (fractional x, y) of a point at a zoom level.
  const tile = (lat, lon, z) => { const n = 2 ** z, r = lat * Math.PI / 180; return [(lon + 180) / 360 * n, (1 - Math.asinh(Math.tan(r)) / Math.PI) / 2 * n]; };
  // Track length in nautical miles, great circle between [lat, lon] points.
  const nm = pts => pts.slice(1).reduce((d, [la, lo], i) => { const r = Math.PI / 180, [a, b] = pts[i], h = Math.sin((la - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(la * r) * Math.sin((lo - b) * r / 2) ** 2; return d + 2 * 3440.065 * Math.asin(Math.sqrt(h)); }, 0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, +v));

  function check(s, c) {
    const fam = c.t.split('.')[0], off = !+c.v;
    if (fam === 'engine') return no('Engines are monitoring only');                                  // Rule 1
    if (c.by.role === 'guest' && !GUEST_OK.includes(fam)) return no('Needs the owner PIN');          // Rule 8
    if (c.by.sys === false) return no('No access to onboard systems');                               // Share: Manage onboard systems
    if (fam === 'gen' && !['owner', 'captain'].includes(c.by.role)) return no('Captain and owner only'); // engines are Rule 1 for everyone
    if (fam === 'gen' && c.by.gen === false) return no('Generator access is off for this role');          // Share: Captain tab toggle
    if (c.t === 'bilge.auto') return no('Float switches always stay in charge');                     // Rule 2
    if (c.t === 'sk.engage') return no('Engage the Seakeeper at the helm');                          // Rule 3
    if (c.t === 'sk.power' && off && s.sk.st !== 'off') return no('Stays powered until spun down');  // Rule 3
    if (c.t === 'gen.start') { const f = genChecks(s).find(x => !x[1]); if (f) return no('Check failed: ' + f[0]); } // Rule 4
    if (c.src === 'done' && off && PROTECTED.includes(c.id || fam)) return no('Always stays on');    // Rule 5
    if (c.t === 'cir.set' && c.id === 'fridge' && off) return no('Refrigeration always stays on');
    if (c.t === 'mode.done' && !doneChecks(s)[0][1]) return no('Both engines must be off');          // Rule 6
    return { ok: true };
  }

  // Ordered steps for a mode. Excluded steps are left out.
  function plan(s, m) {
    const i = s.modes[m], st = [], on = m === 'ready' ? 1 : 0;
    const ac = () => Object.keys(s.ac).forEach(z => st.push({ t: 'ac.set', id: z, v: on }));
    const lights = ids => ids.forEach(l => st.push({ t: 'light.set', id: l, v: on }));
    const audio = () => Object.keys(s.audio).forEach(z => st.push({ t: 'audio.set', id: z, v: on }));
    if (m === 'ready') {
      if (i.sk) st.push({ t: 'sk.spin' });
      if (i.ac) ac();
      if (i.light) lights(['salon', 'cockpit', 'courtesy']);
      if (i.audio) audio();
      if (i.heater) st.push({ t: 'cir.set', id: 'heater', v: 1 });
      if (i.gen && !s.shore.on) st.push({ t: 'gen.start' });
    } else {
      if (i.light) lights(Object.keys(s.light).filter(l => l !== 'anchor')); // anchor light is navigation, left alone
      if (i.ac) ac();
      if (i.audio) audio();
      if (i.sk) st.push({ t: 'sk.stop' });
      if (i.heater) st.push({ t: 'cir.set', id: 'heater', v: 0 });
      if (i.ice) st.push({ t: 'cir.set', id: 'ice', v: 0 }, { t: 'cir.set', id: 'outlets', v: 0 });
    }
    return st.map(c => ({ ...c, src: m }));
  }

  // Simulator state change. A real adapter replaces this, one system at a time.
  function apply(s, c) {
    const v = +c.v ? 1 : 0;
    switch (c.t) {
      case 'light.set': s.light[c.id] = v; break;
      case 'ac.set': s.ac[c.id].on = v; break;
      case 'ac.temp': s.ac[c.id].set = clamp(c.v, 60, 85); break;
      case 'audio.set': s.audio[c.id] = v; break; // real adapter: source on before amps, amps off before source
      case 'cir.set': s.cir[c.id] = v; break;
      case 'power.set': s.pw[c.id] = v; break;
      case 'power.limit': s.shore.limit = clamp(c.v, 0, 50); break;
      case 'gen.start': s.gen.on = 1; break;
      case 'gen.stop': s.gen.on = 0; break;
      case 'sk.spin': if (s.sk.st === 'off' || s.sk.st === 'spindown') s.sk = { st: 'spinup', pw: 1 }; break;
      case 'sk.stop': if (s.sk.st !== 'off') s.sk.st = 'spindown'; break; // power stays on (Rule 3)
      case 'sk.power': s.sk.pw = v; break;
      case 'bilge.run': s.bilge[c.id].run = 1; break;
      case 'alert.set': s.al[c.id] = v; break;
      case 'mode.set': s.modes[c.id][c.k] = v; break;
      case 'mode.ready': case 'mode.done': s.mode = c.t.slice(5); break; // steps run one by one in run()
      default: throw new Error('Unknown command ' + c.t);
    }
  }

  // The only write path. by = {who, device, role}. Rule 7: every command is logged, allowed or not.
  function run(s, c, by) {
    c = { ...c, by };
    const r = check(s, c);
    s.log.unshift({ at: new Date().toISOString(), who: by.who, device: by.device, t: c.t, id: c.id, v: c.v, src: c.src, ok: r.ok, why: r.why, dry: s.dry });
    if (!r.ok) return r;
    if (!s.dry) throw new Error('No hardware adapter. Phase 0 is simulator only.');
    apply(s, c);
    if (c.t === 'mode.ready' || c.t === 'mode.done') r.steps = plan(s, c.t.slice(5)).map(st => ({ ...st, ...run(s, st, by) }));
    return r;
  }

  return { fresh, check, plan, run, genChecks, doneChecks, ddm, tile, nm, GUEST_OK, PROTECTED };
})();
if (typeof module !== 'undefined') module.exports = VQ;
