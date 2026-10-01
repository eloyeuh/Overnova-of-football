// ===== LOGIQUE DE JEU (état, règles, actions, traitement planifié) =====
var START_BUDGET = { 5: 150, 4: 150, 3: 150, 2: 150, 1: 150 }; // même budget de départ pour tous
var REWARD = { w: 4, d: 2, l: 1 };
var DATA_VERSION = 3; // 2 = effectifs 2026-27 ; 3 = prix recalculés, 2 postes, packs de 12
var PACK_PRICE = 50, PACK_MAX = 2;
var PACK_ODDS = [['C', 55], ['R', 30], ['E', 12], ['M', 3]];
var RARITY = { C: 'Commun', R: 'Rare', E: 'Épique', M: 'Mythique' };
// Primes fixes (M€) : vainqueur, finaliste, demi-finaliste. S'y ajoutent 50 % / 25 % des droits d'entrée.
var CUP_BANDS = [
  { name: 'Coupe Espoirs', min: 0, max: 77, fee: 3, prize: [15, 6, 2] },
  { name: 'Coupe Challenger', min: 75, max: 81, fee: 5, prize: [22, 9, 3] },
  { name: 'Coupe Élite', min: 79, max: 100, fee: 8, prize: [30, 12, 4] }
];
var CUP_TIMES = { qf: [15, 0], sf: [15, 15], f: [15, 30] };
function cupTimeLabel(rd) { var t = CUP_TIMES[rd]; return t[0] + 'h' + pad2(t[1]); }
function cupPrizes(band, n) {
  var pot = n * band.fee;
  return { w: band.prize[0] + Math.round(pot * 0.5), f: band.prize[1] + Math.round(pot * 0.25), s: band.prize[2] };
}
MANAGERS['m-int'] = { id: 'm-int', fn: 'Entraîneur', ln: 'adjoint (intérim)', tac: 65, pot: 72, val: 1, club: null, interim: true };
var ROUND_NAME = { qf: 'Quarts de finale', sf: 'Demi-finales', f: 'Finale' };
var LEGEND_TIERS = {
  r: { label: 'Légende récente', cond: 'Remporter 8 matchs', prog: function (rc) { return [[Math.min(rc.w || 0, 8), 8]]; } },
  o: { label: 'Légende historique', cond: 'Remporter 20 matchs et 1 coupe du samedi', prog: function (rc) { return [[Math.min(rc.w || 0, 20), 20], [Math.min(rc.cups || 0, 1), 1]]; } },
  u: { label: 'Légende ultime', cond: 'Devenir champion de la ligue', prog: function (rc) { return [[Math.min(rc.titles || 0, 1), 1]]; } }
};
var CLUB_OBJ = [
  { id: 'serie3', label: 'Enchaîner 3 victoires', reward: 8, prog: function (ss) { return [ss.best || 0, 3]; } },
  { id: 'buts15', label: 'Marquer 15 buts', reward: 6, prog: function (ss) { return [ss.gf || 0, 15]; } },
  { id: 'cs3', label: 'Garder sa cage inviolée 3 fois', reward: 5, prog: function (ss) { return [ss.cs || 0, 3]; } },
  { id: 'exploit', label: 'Battre un club mieux noté', reward: 7, prog: function (ss) { return [ss.beat || 0, 1]; } },
  { id: 'progres', label: 'Faire progresser 3 joueurs', reward: 6, prog: function (ss) { return [ss.ups || 0, 3]; } },
  { id: 'coupe', label: 'Remporter une coupe du samedi', reward: 10, prog: function (ss) { return [ss.cups || 0, 1]; } },
  { id: 'podium', label: 'Finir sur le podium de la ligue', reward: 15, prog: function (ss, x) { return [x.podium ? 1 : 0, 1]; } },
  { id: 'titre', label: 'Être champion de la ligue', reward: 30, prog: function (ss, x) { return [x.champion ? 1 : 0, 1]; } }
];

var S = {
  me: null, isOwner: false, canWrite: true, ready: false,
  holder: 'h' + Math.random().toString(36).slice(2),
  d: { game: {}, clubs: {}, offers: {}, ledger: {}, auctions: {}, cups: {}, league: {} },
  loaded: {}, ownerOf: {}, matchCache: {}, liveMatch: null, lastTick: 0, keep: {}, tacDraft: null, sheet: null, view: null,
  ui: {
    tab: 'effectif', sub: { objectifs: 'joueurs', mercato: 'chercher', competitions: 'ligue' },
    eff: { line: 'Tous', sort: 'ovr' },
    mq: { q: '', line: 'Tous', min: 0, pot: 0, max: 0, sort: 'ovr', live: false },
    onb: { step: 1, pseudo: '', lg: 'PL', club: null }, avoidRisk: true
  }
};

// ---------- Lecture de l'état ----------
function game() { return (S.d.game && S.d.game.meta) || { season: 1, phase: 'inscriptions' }; }
function seasonNo() { return game().season || 1; }
function leagueDoc(s) { return S.d.league['s' + (s || seasonNo())] || null; }
function clubDoc(cid) { return S.d.clubs[cid] || null; }
function myClubId() {
  var ids = Object.keys(S.d.clubs);
  for (var i = 0; i < ids.length; i++) if (S.d.clubs[ids[i]].owner === S.me) return ids[i];
  return null;
}
function isLiveClub(cid) { var c = clubDoc(cid); return !!(c && c.owner); }
function isBot(cid) { var c = clubDoc(cid); return !!(c && c.bot); }
function clubLabel(cid) {
  var c = clubDoc(cid);
  if (!c) return 'Club IA';
  return c.bot ? 'IA (test)' : (c.pseudo || 'Joueur');
}
function rebuildIndex() {
  var own = {};
  CLUBS.forEach(function (cl) { if (!S.d.clubs[cl.id]) cl.squad.forEach(function (pid) { own[pid] = cl.id; }); });
  Object.keys(S.d.clubs).forEach(function (cid) {
    var pl = S.d.clubs[cid].pl || {};
    Object.keys(pl).forEach(function (pid) { if (pl[pid] && pl[pid].in && PLAYERS[pid]) own[pid] = cid; });
  });
  S.ownerOf = own;
}
function squadIds(cid) {
  var c = clubDoc(cid);
  if (!c) return CLUB[cid].squad.slice();
  return Object.keys(c.pl || {}).filter(function (pid) { return c.pl[pid] && c.pl[pid].in && PLAYERS[pid]; });
}
function playerValue(b, ovr) { return ovr === b.ovr ? b.val : valueOf(b.pos, ovr, b.age, Math.max(b.pot, ovr)); }
function P(pid, cid) {
  var b = PLAYERS[pid];
  cid = cid || S.ownerOf[pid] || null;
  var c = cid ? clubDoc(cid) : null;
  var st = (c && c.pl && c.pl[pid]) || {};
  var ovr = st.o != null ? st.o : b.ovr;
  return {
    id: pid, fn: b.fn, ln: b.ln, pos: b.pos, pos2: b.pos2 || '', age: b.age, ovr: ovr, pot: Math.max(b.pot, ovr), val: playerValue(b, ovr),
    kind: b.kind, rarity: b.rarity, tier: b.tier, origin: b.club, from: b.from, club: cid,
    inj: st.inj || 0, susp: st.susp || 0, st: st.st || 0, yc: st.yc || 0, ob: st.ob || null, est: !!b.est,
    ups: st.ups && st.ups.s === seasonNo() ? st.ups.n : 0,
    s: st.s && st.s.s === seasonNo() ? st.s : null
  };
}
function squad(cid) { return squadIds(cid).map(function (pid) { return P(pid, cid); }); }
function fullName(p) { return (p.fn ? p.fn + ' ' : '') + p.ln; }
function shortName(p) { return p.ln || p.fn; }
function clubNote(cid) {
  var sq = squad(cid); if (!sq.length) return 0;
  return sq.reduce(function (a, p) { return a + p.ovr; }, 0) / sq.length;
}
function squadValue(cid) { return squad(cid).reduce(function (a, p) { return a + p.val; }, 0); }
function mgrOf(cid) {
  var c = clubDoc(cid);
  var m = MANAGERS[c ? c.mgr : CLUB[cid].mgr];
  return { id: m.id, fn: m.fn, ln: m.ln, pot: m.pot, val: m.val, tac: c && c.mgrTac ? c.mgrTac : m.tac };
}
function ledgerOf(cid) {
  return Object.keys(S.d.ledger).map(function (k) { var l = S.d.ledger[k]; return Object.assign({ id: k }, l); })
    .filter(function (l) { return l.c === cid; }).sort(function (a, b) { return b.t - a.t; });
}
function budget(cid) {
  var c = clubDoc(cid); if (!c) return 0;
  var b = c.budget0 || 0;
  Object.keys(S.d.ledger).forEach(function (k) { var l = S.d.ledger[k]; if (l.c === cid) b += l.amt; });
  return Math.round(b * 10) / 10;
}
function lotHigh(lot) {
  var best = null;
  Object.keys(lot.bids || {}).forEach(function (cid) {
    var b = lot.bids[cid]; if (!b) return;
    if (!best || b.a > best.a || (b.a === best.a && b.t < best.t)) best = { c: cid, a: b.a, t: b.t };
  });
  return best;
}
function lotLive(lot, now) { now = now || Date.now(); return !lot.settled && lot.start <= now && lot.end > now; }
function engaged(cid, exceptLot) {
  var s = 0;
  Object.keys(S.d.auctions).forEach(function (k) {
    var lot = S.d.auctions[k]; if (k === exceptLot || lot.settled) return;
    var h = lotHigh(lot); if (h && h.c === cid) s += h.a;
  });
  return s;
}
function available(cid, exceptLot) { return Math.round((budget(cid) - engaged(cid, exceptLot)) * 10) / 10; }
function seasonStats(cid) {
  var c = clubDoc(cid);
  return c && c.ss && c.ss.s === seasonNo() ? c.ss : { s: seasonNo() };
}
function packsUsed(cid) {
  var s = seasonNo(), n = 0;
  Object.keys(S.d.ledger).forEach(function (k) { var l = S.d.ledger[k]; if (l.c === cid && l.k === 'pack' && l.s === s && l.amt < 0) n++; });
  return n;
}
function leagueTable(L) {
  if (!L || !L.clubs) return [];
  var T = {};
  L.clubs.forEach(function (c) { T[c] = { c: c, j: 0, g: 0, n: 0, p: 0, bp: 0, bc: 0, pts: 0, form: [] }; });
  var mds = Object.keys(L.res || {}).map(Number).sort(function (a, b) { return a - b; });
  mds.forEach(function (md) {
    var r = L.res[md]; if (!r || !r.m) return;
    Object.keys(r.m).forEach(function (k) {
      var ab = k.split('_'), h = ab[0], a = ab[1], m = r.m[k];
      if (!T[h] || !T[a]) return;
      T[h].j++; T[a].j++; T[h].bp += m.hg; T[h].bc += m.ag; T[a].bp += m.ag; T[a].bc += m.hg;
      if (m.hg > m.ag) { T[h].g++; T[a].p++; T[h].pts += 3; T[h].form.push('V'); T[a].form.push('D'); }
      else if (m.hg < m.ag) { T[a].g++; T[h].p++; T[a].pts += 3; T[a].form.push('V'); T[h].form.push('D'); }
      else { T[h].n++; T[a].n++; T[h].pts++; T[a].pts++; T[h].form.push('N'); T[a].form.push('N'); }
    });
  });
  return Object.keys(T).map(function (k) { return T[k]; }).sort(function (x, y) {
    return y.pts - x.pts || (y.bp - y.bc) - (x.bp - x.bc) || y.bp - x.bp || x.c.localeCompare(y.c);
  });
}
function matchdayTime(L, md) { return parisTime(addDays(L.start, md), 20, 0); }
function multFor(L, cid, md) {
  var m = L.mults && L.mults[cid]; if (!m) return 1;
  return (m[0] === md ? 0.9 : 1) * (m[1] === md ? 1.2 : 1);
}
function nextFixture(cid) {
  var L = leagueDoc(); if (!L || !L.fx || game().phase !== 'en_cours') return null;
  for (var md = 0; md < L.fx.length; md++) {
    if (L.res && L.res[md] && L.res[md].done) continue;
    var pair = L.fx[md].filter(function (p) { return p[0] === cid || p[1] === cid; })[0];
    return { md: md, pair: pair || null, t: matchdayTime(L, md) };
  }
  return null;
}
function cupDateFor(ms) {
  var today = parisDate(ms), p = parisParts(ms);
  if (weekdayOf(today) === 6 && p.h < 18) return today;
  var d = today;
  do { d = addDays(d, 1); } while (weekdayOf(d) !== 6);
  return d;
}
function cupBandIdx(date) { return isoWeek(date) % 3; }
function currentCup() {
  var date = cupDateFor(Date.now());
  return { id: 'c-' + date, date: date, band: CUP_BANDS[cupBandIdx(date)], bandIdx: cupBandIdx(date), doc: S.d.cups['c-' + date] || null };
}
function auctionSlots(now) {
  var today = parisDate(now), out = [];
  for (var i = -2; i <= 0; i++) {
    var d = addDays(today, i), wd = weekdayOf(d);
    if (wd === 5) out.push({ id: 'e-' + d + '-ven', kind: 'vendredi', start: parisTime(d, 18), end: parisTime(addDays(d, 1), 18), n: 3 });
    if (wd === 0) out.push({ id: 'e-' + d + '-dim', kind: 'dimanche', start: parisTime(d, 18), end: parisTime(addDays(d, 1), 18), n: 3 });
    if (wd === Math.floor(hash01('surprise' + isoWeek(d)) * 7)) out.push({ id: 'e-' + d + '-sur', kind: 'surprise', start: parisTime(d, 18), end: parisTime(d, 20), n: 1 });
  }
  return out;
}
function nextAuctionTimes(now) {
  var today = parisDate(now), res = [];
  for (var i = 0; i <= 8 && res.length < 2; i++) {
    var d = addDays(today, i), wd = weekdayOf(d), t = parisTime(d, 18);
    if ((wd === 5 || wd === 0) && t > now) res.push({ t: t, kind: wd === 5 ? 'vendredi' : 'dimanche' });
  }
  return res;
}

// ---------- Écritures de base ----------
function guard() {
  if (!S.canWrite) { toast('Lecture seule : demande au propriétaire de t’inviter comme Éditeur.'); return false; }
  return true;
}
function ledgerAdd(cid, amt, why, id, k) {
  return Store.set('ledger/' + id, { c: cid, amt: Math.round(amt * 10) / 10, why: why, t: Date.now(), s: seasonNo(), k: k });
}
function autoLineup(cid, pl, formation, opts) {
  var players = Object.keys(pl).filter(function (pid) { return pl[pid].in; }).map(function (pid) {
    var b = PLAYERS[pid], st = pl[pid];
    return { id: pid, pos: b.pos, pos2: b.pos2 || '', ovr: st.o != null ? st.o : b.ovr, age: b.age || 30, st: st.st || 0, inj: st.inj || 0, susp: st.susp || 0 };
  }).filter(function (p) { return !p.inj && !p.susp; });
  var lu = pickLineup(players, formation, {}, [], opts);
  var xi = {}; lu.xi.forEach(function (pid, i) { xi[i] = pid || null; });
  return { xi: xi, bench: lu.bench };
}
function newClubDoc(cid, owner, pseudo, bot) {
  var cl = CLUB[cid], pl = {};
  cl.squad.forEach(function (pid) { pl[pid] = { in: 1, st: 0 }; });
  var tac = defaultTactic();
  var lu = autoLineup(cid, pl, tac.f);
  tac.xi = lu.xi; tac.bench = lu.bench;
  return {
    id: cid, owner: owner, pseudo: pseudo || '', bot: !!bot, created: Date.now(), budget0: START_BUDGET[cl.tier],
    mgr: cl.mgr, mgrTac: MANAGERS[cl.mgr].tac, tactic: tac, pl: pl,
    rec: { w: 0, d: 0, l: 0, mp: 0, cups: 0, titles: 0 }, ss: { s: seasonNo() }, legends: {}, dv: DATA_VERSION
  };
}

// ---------- Actions joueur ----------
async function claimClub(cid, pseudo) {
  if (!guard()) return false;
  if (myClubId()) { toast('Tu diriges déjà un club.'); return false; }
  var ok = await Store.lock('clubs/' + cid, S.holder, 8000);
  if (!ok) { toast('Ce club est en cours d’attribution, réessaie dans un instant.'); return false; }
  var ex = await Store.get('clubs/' + cid);
  if (ex && ex.owner) { toast(CLUB[cid].name + ' a déjà un propriétaire.'); return false; }
  if (!S.d.game.meta) await Store.set('game/meta', { season: 1, phase: 'inscriptions', created: Date.now() });
  await Store.set('clubs/' + cid, newClubDoc(cid, S.me, pseudo.trim().slice(0, 24), false));
  return true;
}
var _tacT = null, _tacPending = null;
function saveTactic(tac, now) {
  var cid = myClubId(); if (!cid || !guard()) return;
  var c = S.d.clubs[cid]; c.tactic = clone(tac);
  _tacPending = clone(tac);
  clearTimeout(_tacT);
  var go = function () {
    var t = _tacPending; _tacPending = null;
    if (!t) return;
    Store.update('clubs/' + cid, { tactic: t }).then(function () {
      flashSaved();
      if (!_tacPending) S.tacDraft = null;
    }).catch(function () { toast('La tactique n’a pas pu être enregistrée. Réessaie.'); });
  };
  if (now) go(); else _tacT = setTimeout(go, 700);
}
async function sendOffer(o) {
  if (!guard()) return;
  var me = myClubId(); if (!me) return;
  if (!isLiveClub(o.to)) { toast('Ce club n’a pas de propriétaire connecté : transfert impossible.'); return; }
  if (o.amt > available(me)) { toast('Budget insuffisant pour cette offre.'); return; }
  var id = 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  var doc = { id: id, from: me, to: o.to, kind: o.kind, pid: o.pid, give: o.give || null, amt: o.amt, turn: 'to', st: 'open', t: Date.now(), upd: Date.now(), log: [{ by: me, act: 'offre', amt: o.amt, t: Date.now() }] };
  await Store.set('offers/' + id, doc);
  toast('Offre envoyée à ' + CLUB[o.to].name + '.');
}
async function respondOffer(id, act, amt) {
  if (!guard()) return;
  var o = clone(S.d.offers[id]); if (!o || o.st !== 'open') return;
  var me = myClubId();
  var side = o.from === me ? 'from' : o.to === me ? 'to' : null;
  if (!side) return;
  if (act === 'cancel') {
    if (side !== 'from') return;
    o.log.push({ by: me, act: 'annule', t: Date.now() });
    await Store.update('offers/' + id, { st: 'cancelled', upd: Date.now(), log: o.log });
    return;
  }
  if (o.turn !== side) { toast('C’est à l’autre club de répondre.'); return; }
  if (act === 'refuse') {
    o.log.push({ by: me, act: 'refus', t: Date.now() });
    await Store.update('offers/' + id, { st: 'refused', upd: Date.now(), log: o.log });
    toast('Offre refusée.');
  } else if (act === 'counter') {
    amt = Math.max(0, Math.round(amt * 10) / 10);
    o.log.push({ by: me, act: 'contre', amt: amt, t: Date.now() });
    await Store.update('offers/' + id, { amt: amt, turn: side === 'to' ? 'from' : 'to', upd: Date.now(), log: o.log });
    toast('Contre-offre envoyée.');
  } else if (act === 'accept') {
    var r = await executeTransfer(o, me);
    o.log.push({ by: me, act: r.ok ? 'accepte' : 'échec', t: Date.now(), why: r.why || '' });
    await Store.update('offers/' + id, { st: r.ok ? 'done' : 'failed', why: r.why || '', upd: Date.now(), log: o.log });
    toast(r.ok ? 'Transfert conclu !' : 'Transfert impossible : ' + r.why);
  }
}
async function executeTransfer(o) {
  var from = clone(clubDoc(o.from)), to = clone(clubDoc(o.to));
  if (!from || !to) return { ok: false, why: 'club introuvable' };
  if (o.kind === 'coach') {
    if (to.mgr !== o.pid) return { ok: false, why: 'l’entraîneur n’est plus au club' };
    if (o.amt > budget(o.from)) return { ok: false, why: 'budget insuffisant de ' + CLUB[o.from].name };
    var m = MANAGERS[o.pid];
    await ledgerAdd(o.from, -o.amt, 'Entraîneur : ' + m.fn + ' ' + m.ln, 'tr-' + o.id + '-a', 'mgr');
    await ledgerAdd(o.to, o.amt, 'Départ de l’entraîneur ' + m.ln, 'tr-' + o.id + '-b', 'mgr');
    await Store.update('clubs/' + o.from, { mgr: o.pid, mgrTac: to.mgrTac || m.tac });
    await Store.update('clubs/' + o.to, { mgr: 'm-int', mgrTac: MANAGERS['m-int'].tac });
    return { ok: true };
  }
  if (!(to.pl[o.pid] && to.pl[o.pid].in)) return { ok: false, why: 'le joueur n’est plus au club' };
  if (o.kind === 'echange' && !(from.pl[o.give] && from.pl[o.give].in)) return { ok: false, why: 'le joueur proposé n’est plus au club' };
  if (o.amt > budget(o.from)) return { ok: false, why: 'budget insuffisant de ' + CLUB[o.from].name };
  var nTo = squadIds(o.to).length, nFrom = squadIds(o.from).length;
  if (o.kind === 'achat' && nTo <= 14) return { ok: false, why: CLUB[o.to].name + ' doit garder au moins 14 joueurs' };
  if (o.kind === 'achat' && nFrom >= 30) return { ok: false, why: CLUB[o.from].name + ' a déjà 30 joueurs' };
  if (!PLAYERS[o.pid]) return { ok: false, why: 'joueur introuvable' };
  var pName = shortName(PLAYERS[o.pid]);
  if (o.amt > 0) {
    await ledgerAdd(o.from, -o.amt, 'Transfert : ' + pName, 'tr-' + o.id + '-a', 'transfer');
    await ledgerAdd(o.to, o.amt, 'Vente : ' + pName, 'tr-' + o.id + '-b', 'transfer');
  }
  var moved = {}; moved[o.pid] = Object.assign({}, to.pl[o.pid], { in: 1, st: 0 });
  var gone = {}; gone[o.pid] = { in: 0 };
  if (o.kind === 'echange') {
    moved[o.give] = { in: 0 };
    gone[o.give] = Object.assign({}, from.pl[o.give], { in: 1, st: 0 });
  }
  await Store.update('clubs/' + o.from, { pl: moved, tactic: stripTactic(from.tactic, [o.give]) });
  await Store.update('clubs/' + o.to, { pl: gone, tactic: stripTactic(to.tactic, [o.pid]) });
  return { ok: true };
}
function stripTactic(t, pids) {
  t = clone(t || defaultTactic());
  pids = pids.filter(Boolean);
  Object.keys(t.xi || {}).forEach(function (k) { if (pids.indexOf(t.xi[k]) >= 0) t.xi[k] = null; });
  t.bench = (t.bench || []).filter(function (p) { return pids.indexOf(p) < 0; });
  return t;
}
async function placeBid(lotId, amt) {
  if (!guard()) return;
  var me = myClubId(), lot = S.d.auctions[lotId];
  if (!lot || !lotLive(lot)) { toast('Cette enchère est terminée.'); return; }
  var h = lotHigh(lot), minNext = h ? h.a + Math.max(1, Math.round(h.a * 0.05)) : lot.min;
  if (amt < minNext) { toast('Mise minimale : ' + fmtM(minNext)); return; }
  if (h && h.c === me) { toast('Tu es déjà en tête.'); return; }
  if (amt > available(me, lotId)) { toast('Budget disponible insuffisant (' + fmtM(available(me, lotId)) + ').'); return; }
  var bids = {}; bids[me] = { a: amt, t: Date.now() };
  await Store.update('auctions/' + lotId, { bids: bids });
  toast('Enchère placée : ' + fmtM(amt));
}
// Chance exacte de chaque joueur du pack : la cote de sa rareté, partagée entre les joueurs encore disponibles de cette rareté,
// puis ramenée à 100 % si une rareté n'a plus personne de disponible.
function packOdds(cid) {
  var pool = CLUB[cid].pack.filter(function (pid) { return !S.ownerOf[pid]; });
  var w = {}, tot = 0;
  PACK_ODDS.forEach(function (o) {
    var c = pool.filter(function (pid) { return PLAYERS[pid].rarity === o[0]; });
    c.forEach(function (pid) { w[pid] = o[1] / c.length; tot += o[1] / c.length; });
  });
  return CLUB[cid].pack.map(function (pid) { return { pid: pid, p: w[pid] ? w[pid] / tot : 0, owned: !!S.ownerOf[pid] }; });
}
async function openPack() {
  if (!guard()) return null;
  var me = myClubId(); if (!me) return null;
  if (packsUsed(me) >= PACK_MAX) { toast('Limite de ' + PACK_MAX + ' packs par saison atteinte.'); return null; }
  if (available(me) < PACK_PRICE) { toast('Budget insuffisant.'); return null; }
  var pool = CLUB[me].pack.filter(function (pid) { return !S.ownerOf[pid]; });
  var n = packsUsed(me) + 1;
  await ledgerAdd(me, -PACK_PRICE, 'Pack club', 'pk-s' + seasonNo() + '-' + me + '-' + n, 'pack');
  if (!pool.length) {
    await ledgerAdd(me, PACK_PRICE / 2, 'Pack club : remboursement (collection complète)', 'pk-s' + seasonNo() + '-' + me + '-' + n + 'r', 'pack');
    return { none: true };
  }
  var odds = packOdds(me).filter(function (o) { return o.p > 0; });
  var pid = pickW(Math.random, odds, function (o) { return o.p; }).pid;
  var u = {}; u[pid] = { in: 1, st: 0 };
  await Store.update('clubs/' + me, { pl: u });
  return { pid: pid };
}
async function signLegend(tier) {
  if (!guard()) return;
  var me = myClubId(), c = clubDoc(me);
  if ((c.legends || {})[tier]) return;
  var pid = CLUB[me].legends[{ r: 0, o: 1, u: 2 }[tier]];
  var u = {}; u[pid] = { in: 1, st: 0 };
  var lg = {}; lg[tier] = 1;
  await Store.update('clubs/' + me, { pl: u, legends: lg });
  toast(fullName(PLAYERS[pid]) + ' rejoint ton club !');
}
async function claimObjective(oid) {
  if (!guard()) return;
  var me = myClubId(), o = CLUB_OBJ.filter(function (x) { return x.id === oid; })[0];
  await ledgerAdd(me, o.reward, 'Objectif : ' + o.label, 'ob-s' + seasonNo() + '-' + me + '-' + oid, 'obj');
  toast('+' + fmtM(o.reward) + ' ajoutés au budget.');
}
async function buyManager(mid) {
  if (!guard()) return;
  var me = myClubId(), m = MANAGERS[mid];
  if (available(me) < m.val) { toast('Budget insuffisant.'); return; }
  await ledgerAdd(me, -m.val, 'Entraîneur : ' + m.fn + ' ' + m.ln, 'mg-' + me + '-' + Date.now(), 'mgr');
  await Store.update('clubs/' + me, { mgr: mid, mgrTac: m.tac });
  toast(m.fn + ' ' + m.ln + ' prend place sur ton banc.');
}
function managerTaken(mid) {
  if (mid === 'm-int') return true;
  var taken = false;
  CLUBS.forEach(function (cl) {
    var c = clubDoc(cl.id);
    if (c ? c.mgr === mid : cl.mgr === mid) taken = true;
  });
  return taken;
}
async function registerLeague(on) {
  if (!guard()) return;
  var me = myClubId(), L = leagueDoc();
  if (game().phase !== 'inscriptions') { toast('Les inscriptions sont fermées.'); return; }
  var reg = {}; reg[me] = on ? Date.now() : null;
  await Store.update('league/s' + seasonNo(), { season: seasonNo(), reg: reg });
  toast(on ? 'Club inscrit à la ligue.' : 'Inscription retirée.');
}
function registeredClubs(L) { return Object.keys((L && L.reg) || {}).filter(function (c) { return L.reg[c] && clubDoc(c); }); }
async function launchSeason() {
  if (!guard()) return;
  var s = seasonNo(), L = leagueDoc();
  var clubs = registeredClubs(L);
  if (clubs.length < 2) { toast('Il faut au moins 2 clubs inscrits.'); return; }
  var R = makeRng('saison' + s + clubs.join(''));
  clubs = clubs.slice().sort(function () { return R() - 0.5; });
  var list = clubs.slice(); if (list.length % 2) list.push(null);
  var n = list.length, rounds = [];
  for (var r = 0; r < n - 1; r++) {
    var pairs = [];
    for (var i = 0; i < n / 2; i++) {
      var a = list[i], b = list[n - 1 - i];
      if (a && b) pairs.push(r % 2 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop());
  }
  var fx = [];
  for (var cyc = 0; cyc < 4; cyc++) rounds.forEach(function (pairs) { fx.push(pairs.map(function (p) { return cyc % 2 ? [p[1], p[0]] : [p[0], p[1]]; })); });
  var mults = {};
  clubs.forEach(function (c) {
    var a = Math.floor(R() * fx.length), b = Math.floor(R() * fx.length);
    if (b === a) b = (a + 1 + Math.floor(R() * (fx.length - 1))) % fx.length;
    mults[c] = [a, b];
  });
  var p = parisParts(Date.now());
  var start = p.h < 19 ? parisDate(Date.now()) : addDays(parisDate(Date.now()), 1);
  await Store.update('league/s' + s, { season: s, clubs: clubs, fx: fx, mults: mults, start: start, res: {}, launched: Date.now() });
  await Store.update('game/meta', { phase: 'en_cours', season: s });
  toast('Saison ' + s + ' lancée : ' + fx.length + ' journées, 1 match par jour à 20h.');
}
async function newSeason() {
  if (!guard()) return;
  var s = seasonNo() + 1;
  await Store.set('league/s' + s, { season: s, reg: {} });
  await Store.update('game/meta', { season: s, phase: 'inscriptions' });
  toast('Saison ' + s + ' : inscriptions ouvertes.');
}
async function registerCup(on) {
  if (!guard()) return;
  var me = myClubId(), cup = currentCup();
  var note = clubNote(me), band = cup.band;
  if (cup.doc && cup.doc.st && cup.doc.st !== 'open') { toast('Le tirage a déjà eu lieu.'); return; }
  if (on) {
    if (note < band.min || note > band.max) { toast('Ta note club (' + note.toFixed(1) + ') doit être entre ' + band.min + ' et ' + band.max + '.'); return; }
    var n = cup.doc ? Object.keys(cup.doc.ent || {}).filter(function (k) { return cup.doc.ent[k]; }).length : 0;
    if (n >= 8) { toast('La coupe est complète (8 clubs).'); return; }
    if (available(me) < band.fee) { toast('Budget insuffisant.'); return; }
    await ledgerAdd(me, -band.fee, 'Inscription : ' + band.name, 'cf-' + cup.id + '-' + me, 'cup');
  } else {
    await Store.del('ledger/cf-' + cup.id + '-' + me);
  }
  var ent = {}; ent[me] = on ? Date.now() : null;
  await Store.update('cups/' + cup.id, cup.doc ? { ent: ent } : { id: cup.id, date: cup.date, band: cup.bandIdx, fee: band.fee, ent: ent, st: 'open' });
  toast(on ? 'Inscrit à la ' + band.name + '.' : 'Inscription annulée, frais remboursés.');
}

// ---------- Traitement planifié (matchs, coupes, enchères, IA) ----------
function teamInput(cid, w) {
  var ids = w ? Object.keys(w.pl || {}).filter(function (pid) { return w.pl[pid].in && PLAYERS[pid]; }) : CLUB[cid].squad;
  var players = ids.map(function (pid) {
    var b = PLAYERS[pid], st = w ? w.pl[pid] : {};
    return { id: pid, fn: b.fn, ln: b.ln, pos: b.pos, pos2: b.pos2 || '', age: b.age || 30, ovr: st.o != null ? st.o : b.ovr, inj: st.inj || 0, susp: st.susp || 0, st: st.st || 0 };
  });
  var tactic = clone(w && w.tactic ? w.tactic : defaultTactic());
  // Clubs IA : liberté créative réglée sur la créativité de leur onze
  if (!w || w.bot) {
    var top = players.filter(function (p) { return !p.inj && !p.susp; }).map(function (p) { return p.ovr; }).sort(function (a, b) { return b - a; }).slice(0, 11);
    var avg = top.length ? top.reduce(function (a, x) { return a + x; }, 0) / top.length : 75;
    tactic.free = Math.round(creScore(avg) / 5) * 5;
  }
  return { cid: cid, tactic: tactic, mgrTac: w ? (w.mgrTac || MANAGERS[w.mgr].tac) : MANAGERS[CLUB[cid].mgr].tac, players: players, autoRotate: !!(w && w.bot) };
}
function workNote(w) {
  var ids = Object.keys(w.pl || {}).filter(function (pid) { return w.pl[pid].in && PLAYERS[pid]; });
  if (!ids.length) return 0;
  return ids.reduce(function (a, pid) { var st = w.pl[pid]; return a + (st.o != null ? st.o : PLAYERS[pid].ovr); }, 0) / ids.length;
}
function applyResult(w, res, side, oppW, notes) {
  var s = seasonNo(), mine = res.score[side], theirs = res.score[1 - side];
  var win = mine > theirs, draw = mine === theirs;
  Object.keys(w.pl || {}).forEach(function (pid) {
    var d = w.pl[pid]; if (!d.in || !PLAYERS[pid]) return;
    var r = res.rec[pid];
    if (r && r.side === side) {
      d.st = r.start ? (d.st || 0) + 1 : 0;
      var ss = d.s && d.s.s === s ? d.s : { s: s, mp: 0, g: 0, a: 0, int: 0, cs: 0, y: 0, r: 0 };
      ss.mp++; ss.g += r.g; ss.a += r.a; ss.int += r.int; ss.cs += r.cs; ss.y += r.y; ss.r += r.r;
      d.s = ss;
      d.yc = (d.yc || 0) + r.y;
      if (r.r) { d.susp = 1; d.yc = 0; } else if (d.yc >= 3) { d.susp = 1; d.yc = 0; }
      if (r.inj) d.inj = r.inj;
      var b = PLAYERS[pid], ovr = d.o != null ? d.o : b.ovr, pot = Math.max(b.pot, ovr);
      var upsDone = d.ups && d.ups.s === s ? d.ups.n : 0;
      if (upsDone < UPS_PER_SEASON) {
        var pr = progressObjective(d.ob, b.pos, ovr, pot, r);
        d.ob = pr.ob;
        if (pr.up) { d.o = ovr + 1; d.ups = { s: s, n: upsDone + 1 }; w._ups = (w._ups || 0) + 1; if (notes) notes.push({ c: w.id, pid: pid, o: ovr + 1 }); }
      }
    } else {
      d.st = 0;
      if (d.inj > 0) d.inj--;
      if (d.susp > 0) d.susp--;
    }
  });
  var ss = w.ss && w.ss.s === s ? w.ss : { s: s };
  ['mp', 'w', 'd', 'l', 'gf', 'ga', 'cs', 'streak', 'best', 'beat', 'cups', 'ups'].forEach(function (k) { ss[k] = ss[k] || 0; });
  ss.mp++; ss.gf += mine; ss.ga += theirs; if (!theirs) ss.cs++;
  if (win) { ss.w++; ss.streak++; ss.best = Math.max(ss.best, ss.streak); if (oppW && workNote(oppW) > workNote(w)) ss.beat++; }
  else { ss.streak = 0; if (draw) ss.d++; else ss.l++; }
  ss.ups += w._ups || 0; w._ups = 0;
  w.ss = ss;
  var rc = w.rec || {};
  rc.mp = (rc.mp || 0) + 1;
  if (win) rc.w = (rc.w || 0) + 1; else if (draw) rc.d = (rc.d || 0) + 1; else rc.l = (rc.l || 0) + 1;
  w.rec = rc;
  if (win && rc.w % 5 === 0) {
    var m = MANAGERS[w.mgr];
    if ((w.mgrTac || m.tac) < m.pot) { w.mgrTac = (w.mgrTac || m.tac) + 1; w._mgrUp = 1; }
  }
  w._dirty = 1;
}
function restDay(w) {
  Object.keys(w.pl || {}).forEach(function (pid) {
    var d = w.pl[pid]; if (!d.in) return;
    d.st = 0; if (d.inj > 0) d.inj--; if (d.susp > 0) d.susp--;
  });
  w._dirty = 1;
}
function clubPatch(w) {
  var pl = {};
  Object.keys(w.pl || {}).forEach(function (pid) {
    var d = w.pl[pid]; if (!d.in) return;
    pl[pid] = { st: d.st || 0, inj: d.inj || 0, susp: d.susp || 0, yc: d.yc || 0, ob: d.ob || null, s: d.s || null, ups: d.ups || null };
    if (d.o != null) pl[pid].o = d.o;
  });
  var p = { pl: pl, ss: w.ss || null, rec: w.rec || {} };
  if (w._mgrUp) p.mgrTac = w.mgrTac;
  return p;
}
async function flushWork(work) {
  var ids = Object.keys(work);
  for (var i = 0; i < ids.length; i++) {
    var w = work[ids[i]];
    if (w._dirty) { await Store.update('clubs/' + ids[i], clubPatch(w)); w._dirty = 0; w._mgrUp = 0; }
  }
}
function compactRec(rec) {
  var o = {};
  Object.keys(rec).forEach(function (pid) { var r = rec[pid]; o[pid] = [r.side, r.start, r.min, r.g, r.a, r.int, r.cs, r.y, r.r, r.inj, r.note == null ? -1 : r.note]; });
  return o;
}
function matchDocOf(id, comp, label, h, a, res, extra) {
  return Object.assign({ id: id, comp: comp, label: label, h: h, a: a, sc: res.score, ev: res.ev, stats: res.stats, motm: res.motm, lam: res.lam, lineups: res.lineups, rec: compactRec(res.rec), t: Date.now() }, extra || {});
}
function rewardFor(res, side) { var a = res.score[side], b = res.score[1 - side]; return a > b ? REWARD.w : a === b ? REWARD.d : REWARD.l; }
function resultWhy(res, side, opp) {
  var a = res.score[side], b = res.score[1 - side];
  return (a > b ? 'Victoire' : a === b ? 'Nul' : 'Défaite') + ' ' + a + '-' + b + ' contre ' + CLUB[opp].name;
}
async function playMatchday(L, md, work, notes) {
  var s = L.season, results = {}, playing = {};
  var fx = L.fx[md] || [];
  for (var i = 0; i < fx.length; i++) {
    var h = fx[i][0], a = fx[i][1];
    if (!work[h] || !work[a]) continue;
    playing[h] = playing[a] = 1;
    var mid = 's' + s + '-j' + (md + 1) + '-' + h + '-' + a;
    var res = simulateMatch({ seed: mid, teams: [teamInput(h, work[h]), teamInput(a, work[a])], mults: [multFor(L, h, md), multFor(L, a, md)] });
    applyResult(work[h], res, 0, work[a], notes);
    applyResult(work[a], res, 1, work[h], notes);
    await Store.set('matches/' + mid, matchDocOf(mid, 'ligue', 'Ligue · Journée ' + (md + 1), h, a, res, { s: s, md: md }));
    await ledgerAdd(h, rewardFor(res, 0), resultWhy(res, 0, a), 'lg-' + mid + '-' + h, 'match');
    await ledgerAdd(a, rewardFor(res, 1), resultWhy(res, 1, h), 'lg-' + mid + '-' + a, 'match');
    results[h + '_' + a] = { hg: res.score[0], ag: res.score[1], mid: mid };
    var me = myClubId();
    if ((h === me || a === me) && Date.now() - matchdayTime(L, md) < 20 * 60000) S.liveMatch = mid;
    else if ((h === me || a === me) && L.forced != null) S.liveMatch = mid;
  }
  (L.clubs || []).forEach(function (cid) { if (!playing[cid] && work[cid]) restDay(work[cid]); });
  await flushWork(work);
  var r = {}; r[md] = { done: 1, m: results, t: Date.now() };
  await Store.update('league/s' + s, { res: r });
  L.res = L.res || {}; L.res[md] = r[md];
}
async function finishSeason(L, work) {
  var tbl = leagueTable(L);
  if (!tbl.length) return;
  var champ = tbl[0].c, podium = tbl.slice(0, 3).map(function (x) { return x.c; });
  if (work[champ]) { work[champ].rec = work[champ].rec || {}; work[champ].rec.titles = (work[champ].rec.titles || 0) + 1; work[champ]._dirty = 1; }
  await flushWork(work);
  await Store.update('league/s' + L.season, { done: 1, champion: champ, podium: podium });
  await Store.update('game/meta', { phase: 'terminee' });
}
async function processLeague(work, notes) {
  if (game().phase !== 'en_cours') return;
  var L = clone(leagueDoc()); if (!L || !L.fx) return;
  var now = Date.now();
  for (var md = 0; md < L.fx.length; md++) {
    if (L.res && L.res[md] && L.res[md].done) continue;
    var due = (L.forced != null && md <= L.forced) || matchdayTime(L, md) <= now;
    if (!due) break;
    await playMatchday(L, md, work, notes);
  }
  var all = L.fx.every(function (_, md) { return L.res && L.res[md] && L.res[md].done; });
  if (all && !L.done) await finishSeason(L, work);
}
function penalties(R, wa, wb) {
  var ga = 0, gb = 0;
  for (var k = 0; k < 5; k++) { if (R() < 0.76) ga++; if (R() < 0.76) gb++; }
  while (ga === gb) { if (R() < 0.75) ga++; if (R() < 0.75) gb++; }
  return [ga, gb];
}
async function processCups(work) {
  var now = Date.now();
  var ids = Object.keys(S.d.cups);
  for (var i = 0; i < ids.length; i++) {
    var cup = clone(S.d.cups[ids[i]]);
    if (cup.st === 'done' || cup.st === 'annulee') continue;
    var due = function (rd) { return cup.forced || now >= parisTime(cup.date, CUP_TIMES[rd][0], CUP_TIMES[rd][1]); };
    var band = CUP_BANDS[cup.band];
    if (cup.st === 'open') {
      if (!due('qf')) continue;
      var ent = Object.keys(cup.ent || {}).filter(function (k) { return cup.ent[k] && work[k]; });
      if (ent.length < 2) {
        for (var e = 0; e < ent.length; e++) await Store.del('ledger/cf-' + cup.id + '-' + ent[e]);
        await Store.update('cups/' + cup.id, { st: 'annulee' });
        continue;
      }
      var R = makeRng(cup.id + 'tirage');
      ent.sort(function () { return R() - 0.5; });
      var size = ent.length <= 2 ? 2 : ent.length <= 4 ? 4 : 8;
      var br = ent.slice(); while (br.length < size) br.splice(Math.floor(R() * (br.length + 1)), 0, null);
      cup.br = br; cup.st = size === 8 ? 'qf' : size === 4 ? 'sf' : 'f'; cup.r = {};
      await Store.update('cups/' + cup.id, { br: br, st: cup.st, r: {} });
    }
    var rounds = ['qf', 'sf', 'f'];
    while (cup.st !== 'done' && due(cup.st)) {
      var rd = cup.st, prev = rounds[rounds.indexOf(rd) - 1];
      var entrants = rd === 'qf' || !prev || !(cup.r && cup.r[prev]) ? cup.br : cup.r[prev].map(function (m) { return m.w; });
      var list = [];
      for (var j = 0; j < entrants.length; j += 2) {
        var a = entrants[j], b = entrants[j + 1], m = { a: a, b: b };
        if (!a || !b) { m.w = a || b; list.push(m); continue; }
        var mid = cup.id + '-' + rd + '-' + (j / 2 + 1);
        var res = simulateMatch({ seed: mid, neutral: true, teams: [teamInput(a, work[a]), teamInput(b, work[b])] });
        applyResult(work[a], res, 0, work[b]); applyResult(work[b], res, 1, work[a]);
        m.sa = res.score[0]; m.sb = res.score[1]; m.mid = mid;
        if (m.sa === m.sb) { var pk = penalties(makeRng(mid + 'tab')); m.pa = pk[0]; m.pb = pk[1]; }
        m.w = m.sa > m.sb || (m.sa === m.sb && m.pa > m.pb) ? a : b;
        var extra = { cup: cup.id, rd: rd }; if (m.pa != null) extra.tab = [m.pa, m.pb];
        await Store.set('matches/' + mid, matchDocOf(mid, 'coupe', band.name + ' · ' + ROUND_NAME[rd], a, b, res, extra));
        list.push(m);
      }
      cup.r = cup.r || {}; cup.r[rd] = list;
      var upd = { r: {} }; upd.r[rd] = list;
      if (rd === 'sf') {
        for (var q = 0; q < list.length; q++) {
          var loser = list[q].a === list[q].w ? list[q].b : list[q].a;
          if (loser) await ledgerAdd(loser, band.prize[2], 'Demi-finale : ' + band.name, 'cw-' + cup.id + '-' + loser, 'cup');
        }
      }
      if (rd === 'f') {
        var winner = list[0].w, fin = list[0].a === winner ? list[0].b : list[0].a;
        var pz = cupPrizes(band, Object.keys(cup.ent).filter(function (k) { return cup.ent[k]; }).length);
        await ledgerAdd(winner, pz.w, 'Victoire : ' + band.name, 'cw-' + cup.id + '-' + winner, 'cup');
        if (fin) await ledgerAdd(fin, pz.f, 'Finale : ' + band.name, 'cw-' + cup.id + '-' + fin, 'cup');
        if (work[winner]) {
          work[winner].ss = work[winner].ss && work[winner].ss.s === seasonNo() ? work[winner].ss : { s: seasonNo() };
          work[winner].ss.cups = (work[winner].ss.cups || 0) + 1;
          work[winner].rec.cups = (work[winner].rec.cups || 0) + 1; work[winner]._dirty = 1;
        }
        cup.st = 'done'; upd.st = 'done'; upd.w = winner;
      } else { cup.st = rounds[rounds.indexOf(rd) + 1]; upd.st = cup.st; }
      await flushWork(work);
      await Store.update('cups/' + cup.id, upd);
    }
  }
}
function pickAuctionPlayers(evId, n) {
  var R = makeRng(evId);
  var free = POOL_IDS.filter(function (pid) { return !S.ownerOf[pid] && !Object.keys(S.d.auctions).some(function (k) { var l = S.d.auctions[k]; return l.pid === pid && !l.settled; }); });
  var out = [];
  var take = function (f) {
    var c = free.filter(function (pid) { return out.indexOf(pid) < 0 && f(PLAYERS[pid]); });
    if (c.length) out.push(c[Math.floor(R() * c.length)]);
  };
  take(function (p) { return p.val >= 50; });
  if (n > 1) take(function (p) { return p.age <= 23 && p.pot >= 85; });
  if (n > 2) take(function (p) { return p.val < 50 && p.ovr >= 80; });
  while (out.length < n) { var c = free.filter(function (pid) { return out.indexOf(pid) < 0; }); if (!c.length) break; out.push(c[Math.floor(R() * c.length)]); }
  return out;
}
async function createAuctionEvent(ev) {
  var pids = pickAuctionPlayers(ev.id, ev.n);
  for (var i = 0; i < pids.length; i++) {
    var b = PLAYERS[pids[i]];
    await Store.set('auctions/' + ev.id + '-' + (i + 1), { id: ev.id + '-' + (i + 1), ev: ev.id, kind: ev.kind, pid: pids[i], start: ev.start, end: ev.end, min: Math.max(1, Math.round(b.val * 0.3)), bids: {}, settled: 0 });
  }
}
async function processAuctions(work) {
  var now = Date.now();
  var slots = auctionSlots(now);
  for (var i = 0; i < slots.length; i++) {
    var ev = slots[i];
    if (ev.start <= now && ev.end > now && !S.d.auctions[ev.id + '-1']) await createAuctionEvent(ev);
  }
  var ids = Object.keys(S.d.auctions);
  for (var j = 0; j < ids.length; j++) {
    var lot = S.d.auctions[ids[j]];
    if (lot.settled || lot.end > now) continue;
    var bids = Object.keys(lot.bids || {}).filter(function (c) { return lot.bids[c]; }).map(function (c) { return { c: c, a: lot.bids[c].a, t: lot.bids[c].t }; })
      .sort(function (x, y) { return y.a - x.a || x.t - y.t; });
    var win = null;
    for (var k = 0; k < bids.length; k++) { if (clubDoc(bids[k].c) && budget(bids[k].c) >= bids[k].a && !S.ownerOf[lot.pid]) { win = bids[k]; break; } }
    if (win) {
      await ledgerAdd(win.c, -win.a, 'Enchère : ' + fullName(PLAYERS[lot.pid]), 'au-' + lot.id, 'auction');
      var u = {}; u[lot.pid] = { in: 1, st: 0 };
      await Store.update('clubs/' + win.c, { pl: u });
      if (work[win.c]) work[win.c].pl[lot.pid] = { in: 1, st: 0 };
    }
    await Store.update('auctions/' + lot.id, { settled: 1, winner: win ? win.c : null, price: win ? win.a : 0 });
  }
}
async function processBots() {
  var now = Date.now();
  var offerIds = Object.keys(S.d.offers);
  for (var i = 0; i < offerIds.length; i++) {
    var o = S.d.offers[offerIds[i]];
    if (o.st !== 'open' || o.turn !== 'to' || !isBot(o.to) || now - o.upd < 12000) continue;
    var v = o.kind === 'coach' ? MANAGERS[o.pid].val : P(o.pid, o.to).val;
    var offered = o.amt + (o.kind === 'echange' && o.give ? P(o.give, o.from).val : 0);
    var log = clone(o.log);
    if (offered >= v * 1.15) {
      var r = await executeTransfer(o);
      log.push({ by: o.to, act: r.ok ? 'accepte' : 'échec', t: now, why: r.why || '' });
      await Store.update('offers/' + o.id, { st: r.ok ? 'done' : 'failed', why: r.why || '', upd: now, log: log });
    } else if (offered >= v * 0.8 && log.filter(function (x) { return x.by === o.to; }).length < 2) {
      var ask = Math.round((v * 1.2 - (offered - o.amt)) * 10) / 10;
      log.push({ by: o.to, act: 'contre', amt: ask, t: now });
      await Store.update('offers/' + o.id, { amt: ask, turn: 'from', upd: now, log: log });
    } else {
      log.push({ by: o.to, act: 'refus', t: now });
      await Store.update('offers/' + o.id, { st: 'refused', upd: now, log: log });
    }
  }
  var bots = Object.keys(S.d.clubs).filter(isBot);
  var lots = Object.keys(S.d.auctions).map(function (k) { return S.d.auctions[k]; }).filter(function (l) { return lotLive(l, now); });
  for (var j = 0; j < lots.length; j++) {
    var lot = lots[j], h = lotHigh(lot), b = PLAYERS[lot.pid];
    for (var k = 0; k < bots.length; k++) {
      var bc = bots[k];
      if (h && h.c === bc) continue;
      var cap = b.val * (0.45 + hash01(bc + lot.id) * 0.5);
      var next = h ? h.a + Math.max(1, Math.round(h.a * 0.05)) : lot.min;
      if (next <= cap && next <= available(bc, lot.id) && hash01(bc + lot.id + Math.floor(now / 60000)) < 0.5) {
        var bids = {}; bids[bc] = { a: next, t: now };
        await Store.update('auctions/' + lot.id, { bids: bids });
        break;
      }
    }
  }
}
var _ticking = false;
async function tick() {
  if (!S.ready || !S.canWrite || _ticking || !myClubId() || isLegacy()) return;
  _ticking = true;
  try {
    var got = await Store.lock('locks/tick', S.holder, 20000);
    if (!got) return;
    var work = clone(S.d.clubs), notes = [];
    await processAuctions(work);
    await processLeague(work, notes);
    await processCups(work);
    await processBots();
    S.lastTick = Date.now();
    var me = myClubId();
    notes.filter(function (n) { return n.c === me; }).forEach(function (n) { toast(shortName(PLAYERS[n.pid]) + ' progresse : ' + n.o + ' !'); });
  } catch (e) {
    console.error(e);
  } finally { _ticking = false; }
}

// ---------- Mise à jour de la base ----------
function isLegacy() {
  return Object.keys(S.d.clubs).some(function (cid) { return (S.d.clubs[cid].dv || 1) < DATA_VERSION; });
}
async function resetWorld() {
  if (!S.isOwner) return;
  var colls = ['offers', 'ledger', 'auctions', 'cups', 'league', 'clubs', 'game'];
  var mids = await Store.listIds('matches');
  for (var m = 0; m < mids.length; m++) await Store.del('matches/' + mids[m]);
  for (var i = 0; i < colls.length; i++) {
    var ids = Object.keys(S.d[colls[i]] || {});
    for (var j = 0; j < ids.length; j++) await Store.del(colls[i] + '/' + ids[j]);
  }
  S.tacDraft = null; S.liveMatch = null; S.matchCache = {};
  S.ui.onb = { step: 1, pseudo: '', lg: 'PL', club: null };
}

// ---------- Outils de test ----------
async function testAddBots(n) {
  var free = CLUBS.filter(function (c) { return !S.d.clubs[c.id]; });
  var R = Math.random;
  var me = myClubId(), myNote = me ? clubNote(me) : 80;
  free.sort(function (a, b) { return Math.abs(clubNoteStatic(a.id) - myNote) - Math.abs(clubNoteStatic(b.id) - myNote) + (R() - 0.5) * 3; });
  var picked = free.slice(0, n), reg = {};
  for (var i = 0; i < picked.length; i++) {
    await Store.set('clubs/' + picked[i].id, newClubDoc(picked[i].id, 'bot', 'IA', true));
    reg[picked[i].id] = Date.now();
  }
  if (game().phase === 'inscriptions') await Store.update('league/s' + seasonNo(), { season: seasonNo(), reg: reg });
  toast(picked.length + ' clubs IA ajoutés' + (game().phase === 'inscriptions' ? ' et inscrits à la ligue.' : '.'));
}
function clubNoteStatic(cid) { var s = CLUB[cid].squad; return s.reduce(function (a, pid) { return a + PLAYERS[pid].ovr; }, 0) / s.length; }
async function testBotsToCup() {
  var cup = currentCup(), band = cup.band;
  if (cup.doc && cup.doc.st !== 'open') { toast('Le tirage a déjà eu lieu.'); return; }
  var ent = {}, n = cup.doc ? Object.keys(cup.doc.ent || {}).filter(function (k) { return cup.doc.ent[k]; }).length : 0;
  Object.keys(S.d.clubs).filter(isBot).forEach(function (cid) {
    var note = clubNote(cid);
    if (n < 8 && note >= band.min && note <= band.max && !(cup.doc && cup.doc.ent && cup.doc.ent[cid])) { ent[cid] = Date.now(); n++; }
  });
  var keys = Object.keys(ent);
  if (!keys.length) { toast('Aucun club IA dans la tranche de note de la ' + band.name + '. Ajoute des clubs IA proches de ta note.'); return; }
  for (var i = 0; i < keys.length; i++) await ledgerAdd(keys[i], -band.fee, 'Inscription : ' + band.name, 'cf-' + cup.id + '-' + keys[i], 'cup');
  await Store.update('cups/' + cup.id, cup.doc ? { ent: ent } : { id: cup.id, date: cup.date, band: cup.bandIdx, fee: band.fee, ent: ent, st: 'open' });
  toast(keys.length + ' clubs IA inscrits à la coupe.');
}
async function testPlayCup() {
  var cup = currentCup(); if (!cup.doc) { toast('Personne n’est inscrit à la coupe.'); return; }
  await Store.update('cups/' + cup.id, { forced: 1 });
  S.d.cups[cup.id].forced = 1; await tick();
}
async function testPlayNext() {
  var L = leagueDoc(); if (!L || !L.fx) { toast('Lance d’abord la saison.'); return; }
  var md = 0; while (md < L.fx.length && L.res && L.res[md] && L.res[md].done) md++;
  if (md >= L.fx.length) { toast('Toutes les journées sont jouées.'); return; }
  await Store.update('league/s' + L.season, { forced: md });
  S.d.league['s' + L.season].forced = md; await tick();
}
async function testAuction() {
  var now = Date.now(), id = 'e-test-' + now.toString(36);
  await createAuctionEvent({ id: id, kind: 'test', start: now, end: now + 10 * 60000, n: 2 });
  toast('Enchère test lancée pour 10 minutes.');
}
async function testCloseAuctions() {
  var now = Date.now(), ids = Object.keys(S.d.auctions);
  for (var i = 0; i < ids.length; i++) { var l = S.d.auctions[ids[i]]; if (!l.settled && l.end > now) await Store.update('auctions/' + l.id, { end: now - 1 }); }
  setTimeout(tick, 400);
}
async function testMoney() {
  var me = myClubId(); await ledgerAdd(me, 50, 'Bonus test', 'tst-' + Date.now(), 'test'); toast('+50 M€ (test).');
}
