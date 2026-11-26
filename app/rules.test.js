// node rules.test.js : the eight hard safety rules, one check each.
const assert = require('assert');
const VQ = require('./rules.js');
const owner = { who: 'Owner', device: 'phone', role: 'owner' }, guest = { who: 'Guest', device: 'ipad', role: 'guest' };
const S = () => VQ.fresh();
let s;

// dry run is on by default, and turning it off cannot reach hardware
s = S(); assert.strictEqual(s.dry, true);
s.dry = false; assert.throws(() => VQ.run(s, { t: 'light.set', id: 'salon', v: 1 }, owner)); assert.strictEqual(s.light.salon, 0);

// 1. engines: monitoring only
s = S(); for (const t of ['engine.start', 'engine.stop', 'engine.throttle']) assert.strictEqual(VQ.run(s, { t, id: 'port' }, owner).ok, false);

// 2. bilge: manual run yes, automatic off never
s = S(); assert.ok(VQ.run(s, { t: 'bilge.run', id: 'aft' }, owner).ok);
assert.strictEqual(VQ.run(s, { t: 'bilge.auto', id: 'aft', v: 0 }, owner).ok, false);

// 3. Seakeeper: spin up stays locked, never engage, powered through spin-down
s = S(); assert.ok(VQ.run(s, { t: 'sk.spin' }, owner).ok); assert.strictEqual(s.sk.st, 'spinup');
assert.strictEqual(VQ.run(s, { t: 'sk.engage' }, owner).ok, false);
VQ.run(s, { t: 'sk.stop' }, owner); assert.deepStrictEqual(s.sk, { st: 'spindown', pw: 1 });
assert.strictEqual(VQ.run(s, { t: 'sk.power', v: 0 }, owner).ok, false); assert.strictEqual(s.sk.pw, 1);

// 4. generator start needs every check
s = S(); assert.strictEqual(VQ.genChecks(s).length, 3); assert.ok(VQ.run(s, { t: 'gen.start' }, owner).ok);
for (const k of ['co', 'fault', 'exhHot']) { s = S(); s.gen[k] = 1; assert.strictEqual(VQ.run(s, { t: 'gen.start' }, owner).ok, false, k); assert.strictEqual(s.gen.on, 0); }
s = S(); s.gen.exhSensor = 0; s.gen.exhHot = 1; assert.strictEqual(VQ.genChecks(s).length, 2); assert.ok(VQ.run(s, { t: 'gen.start' }, owner).ok);

// 5. Done never switches off the protected systems
s = S(); s.light.uw = 1; s.light.galley = 1; s.sk = { st: 'ready', pw: 1 };
assert.ok(VQ.plan(s, 'done').every(c => !VQ.PROTECTED.includes(c.id)));
for (const id of VQ.PROTECTED) assert.strictEqual(VQ.run(s, { t: 'cir.set', id, v: 0, src: 'done' }, owner).ok, false, id);
assert.strictEqual(VQ.run(s, { t: 'cir.set', id: 'fridge', v: 0 }, owner).ok, false);
const r = VQ.run(s, { t: 'mode.done' }, owner);
assert.ok(r.ok && r.steps.every(x => x.ok));
assert.ok(s.cir.fridge && s.pw.chg && !s.light.uw && !s.light.galley && !s.ac.salon.on && !s.cir.heater);
assert.deepStrictEqual(s.sk, { st: 'spindown', pw: 1 });

// 6. Done only with both engines off
s = S(); s.eng.stbd.on = 1; assert.strictEqual(VQ.run(s, { t: 'mode.done' }, owner).ok, false); assert.strictEqual(s.ac.salon.on, 1);

// 7. every write is logged with who, device and when, refused ones too
s = S(); VQ.run(s, { t: 'light.set', id: 'salon', v: 1 }, owner); VQ.run(s, { t: 'engine.start' }, guest);
assert.strictEqual(s.log.length, 2);
assert.ok(s.log.every(l => l.who && l.device && !isNaN(Date.parse(l.at)) && l.dry === true));
assert.strictEqual(s.log[0].ok, false); assert.strictEqual(s.log[1].ok, true);

// 8. guest: AC, lights, audio, cameras only
s = S();
for (const c of [{ t: 'ac.set', id: 'salon', v: 0 }, { t: 'light.set', id: 'uw', v: 1 }, { t: 'audio.set', id: 'salon', v: 1 }]) assert.ok(VQ.run(s, c, guest).ok, c.t);
for (const c of [{ t: 'gen.start' }, { t: 'power.set', id: 'inv', v: 0 }, { t: 'sk.spin' }, { t: 'mode.ready' }, { t: 'mode.set', id: 'ready', k: 'gen', v: 1 }, { t: 'alert.set', id: 'long', v: 0 }, { t: 'cir.set', id: 'ice', v: 1 }, { t: 'bilge.run', id: 'aft' }])
  assert.strictEqual(VQ.run(s, c, guest).ok, false, c.t);

// roles: no systems permission means no writes; generator is captain and owner only
s = S(); assert.strictEqual(VQ.run(s, { t: 'light.set', id: 'salon', v: 1 }, { who: 'Family', device: 'phone', role: 'family', sys: false }).ok, false);
const crew = { who: 'Crew', device: 'phone', role: 'crew', sys: true };
assert.ok(VQ.run(s, { t: 'light.set', id: 'salon', v: 1 }, crew).ok); assert.strictEqual(VQ.run(s, { t: 'gen.start' }, crew).ok, false);
assert.ok(VQ.run(s, { t: 'gen.start' }, { who: 'Captain', device: 'phone', role: 'captain', sys: true }).ok);
assert.strictEqual(VQ.run(s, { t: 'engine.start' }, { who: 'Captain', device: 'phone', role: 'captain', sys: true }).ok, false);
assert.strictEqual(VQ.run(S(), { t: 'gen.start' }, { who: 'Captain', device: 'phone', role: 'captain', sys: true, gen: false }).ok, false); // Share: Captain generator toggle off

// Get ready: Seakeeper first, generator only when included and shore power is off
s = S(); assert.strictEqual(VQ.plan(s, 'ready')[0].t, 'sk.spin'); assert.ok(!VQ.plan(s, 'ready').some(c => c.t === 'gen.start'));
s.modes.ready.gen = 1; assert.ok(!VQ.plan(s, 'ready').some(c => c.t === 'gen.start'));
s.shore.on = 0; assert.ok(VQ.plan(s, 'ready').some(c => c.t === 'gen.start'));

{ const s = VQ.fresh(), by = { who: 'Owner', device: 'Phone', role: 'owner' };
  assert.equal(VQ.ddm(25.5, 'N', 'S'), "25°30.000'N"); assert.equal(VQ.ddm(-80.14, 'E', 'W'), "80°8.400'W");
  VQ.run(s, { t: 'mode.ready' }, by); assert.equal(s.mode, 'ready'); VQ.run(s, { t: 'mode.done' }, by); assert.equal(s.mode, 'done'); }
assert.deepEqual(VQ.tile(0, 0, 1), [1, 1]); assert.equal(Math.floor(VQ.tile(25.7707, -80.14, 15)[0]), 9089);
console.log('rules ok');
