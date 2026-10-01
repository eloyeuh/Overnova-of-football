// ===== MOTEUR DE JEU =====
var LINE = { G: 'G', DD: 'DEF', DC: 'DEF', DG: 'DEF', MDC: 'MIL', MC: 'MIL', MOC: 'MIL', MD: 'MIL', MG: 'MIL', AD: 'ATT', AG: 'ATT', BU: 'ATT' };
var POS_NAME = { G: 'Gardien', DD: 'Latéral droit', DC: 'Défenseur central', DG: 'Latéral gauche', MDC: 'Milieu défensif', MC: 'Milieu central', MOC: 'Milieu offensif', MD: 'Milieu droit', MG: 'Milieu gauche', AD: 'Ailier droit', AG: 'Ailier gauche', BU: 'Buteur' };
var POS_ORDER = ['G', 'DD', 'DC', 'DG', 'MDC', 'MC', 'MD', 'MG', 'MOC', 'AD', 'AG', 'BU'];
// Poids de chaque poste dans la puissance offensive / défensive / créative
var ARCH = {
  G: { a: .10, d: 1.0, c: .35 }, DC: { a: .32, d: 1.0, c: .48 }, DD: { a: .58, d: .86, c: .68 }, DG: { a: .58, d: .86, c: .68 },
  MDC: { a: .48, d: .88, c: .78 }, MC: { a: .68, d: .68, c: .95 }, MOC: { a: .86, d: .40, c: 1.0 },
  MD: { a: .82, d: .48, c: .85 }, MG: { a: .82, d: .48, c: .85 }, AD: { a: .94, d: .34, c: .86 }, AG: { a: .94, d: .34, c: .86 }, BU: { a: 1.0, d: .28, c: .62 }
};
var NEAR = { 'DD-DG': 4, 'AD-AG': 2, 'MD-MG': 2, 'MC-MDC': 2, 'MC-MOC': 3, 'DC-MDC': 5, 'BU-MOC': 5, 'AD-MOC': 4, 'AG-MOC': 4, 'AD-BU': 4, 'AG-BU': 4, 'AD-MD': 2, 'AG-MG': 2, 'DD-MD': 2, 'DG-MG': 2, 'DC-DD': 5, 'DC-DG': 5, 'MC-MD': 4, 'MC-MG': 4, 'MD-MOC': 4, 'MG-MOC': 4, 'AD-DD': 7, 'AG-DG': 7, 'DD-MDC': 6, 'DG-MDC': 6 };
var LINE_N = { G: 0, DC: 1, DD: 1, DG: 1, MDC: 2, MC: 3, MD: 3, MG: 3, MOC: 4, AD: 5, AG: 5, BU: 5 };
var SIDE = { DD: 1, MD: 1, AD: 1, DG: -1, MG: -1, AG: -1 };
function posPenalty(nat, slot) {
  if (nat === slot) return 0;
  if (nat === 'G' || slot === 'G') return 45;
  var k = [nat, slot].sort().join('-');
  if (NEAR[k] != null) return NEAR[k];
  var dl = Math.abs(LINE_N[nat] - LINE_N[slot]);
  var ds = (SIDE[nat] || 0) !== (SIDE[slot] || 0) ? 2 : 0;
  return Math.min(22, 6 + 3 * dl + ds);
}
// Chaque joueur a jusqu'à deux postes naturels : on garde la pénalité la plus faible des deux
function penOf(p, slot) {
  var a = posPenalty(p.pos, slot);
  return p.pos2 ? Math.min(a, posPenalty(p.pos2, slot)) : a;
}
function posLabel(p) { return p.pos2 ? p.pos + ' · ' + p.pos2 : p.pos; }

var FORMATIONS = {
  '4-3-3': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MC', 28, 49], ['MDC', 50, 58], ['MC', 72, 49], ['AG', 16, 22], ['BU', 50, 13], ['AD', 84, 22]],
  '4-4-2': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MG', 13, 43], ['MC', 38, 50], ['MC', 62, 50], ['MD', 87, 43], ['BU', 37, 15], ['BU', 63, 15]],
  '4-2-3-1': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MDC', 37, 57], ['MDC', 63, 57], ['AG', 15, 31], ['MOC', 50, 34], ['AD', 85, 31], ['BU', 50, 12]],
  '4-1-2-1-2': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MDC', 50, 59], ['MC', 28, 46], ['MC', 72, 46], ['MOC', 50, 33], ['BU', 37, 14], ['BU', 63, 14]],
  '4-4-1-1': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MG', 13, 45], ['MC', 38, 52], ['MC', 62, 52], ['MD', 87, 45], ['MOC', 50, 31], ['BU', 50, 13]],
  '4-1-4-1': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MDC', 50, 60], ['MG', 13, 42], ['MC', 36, 44], ['MC', 64, 44], ['MD', 87, 42], ['BU', 50, 14]],
  '4-3-2-1': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MC', 28, 50], ['MDC', 50, 57], ['MC', 72, 50], ['MOC', 33, 30], ['MOC', 67, 30], ['BU', 50, 13]],
  '4-2-2-2': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MDC', 37, 56], ['MDC', 63, 56], ['MOC', 20, 33], ['MOC', 80, 33], ['BU', 37, 14], ['BU', 63, 14]],
  '4-5-1': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MG', 12, 44], ['MC', 32, 50], ['MDC', 50, 58], ['MC', 68, 50], ['MD', 88, 44], ['BU', 50, 14]],
  '4-2-4': [['G', 50, 90], ['DG', 13, 70], ['DC', 37, 75], ['DC', 63, 75], ['DD', 87, 70], ['MC', 37, 52], ['MC', 63, 52], ['AG', 14, 22], ['BU', 38, 15], ['BU', 62, 15], ['AD', 86, 22]],
  '3-5-2': [['G', 50, 90], ['DC', 26, 74], ['DC', 50, 77], ['DC', 74, 74], ['MG', 10, 45], ['MC', 32, 48], ['MDC', 50, 58], ['MC', 68, 48], ['MD', 90, 45], ['BU', 37, 15], ['BU', 63, 15]],
  '3-4-3': [['G', 50, 90], ['DC', 26, 74], ['DC', 50, 77], ['DC', 74, 74], ['MG', 11, 47], ['MC', 38, 52], ['MC', 62, 52], ['MD', 89, 47], ['AG', 17, 22], ['BU', 50, 13], ['AD', 83, 22]],
  '3-4-1-2': [['G', 50, 90], ['DC', 26, 74], ['DC', 50, 77], ['DC', 74, 74], ['MG', 11, 48], ['MC', 38, 54], ['MC', 62, 54], ['MD', 89, 48], ['MOC', 50, 33], ['BU', 37, 14], ['BU', 63, 14]],
  '3-4-2-1': [['G', 50, 90], ['DC', 26, 74], ['DC', 50, 77], ['DC', 74, 74], ['MG', 11, 50], ['MC', 38, 56], ['MC', 62, 56], ['MD', 89, 50], ['MOC', 33, 30], ['MOC', 67, 30], ['BU', 50, 13]],
  '5-3-2': [['G', 50, 90], ['DG', 9, 63], ['DC', 30, 75], ['DC', 50, 77], ['DC', 70, 75], ['DD', 91, 63], ['MC', 28, 47], ['MDC', 50, 54], ['MC', 72, 47], ['BU', 37, 15], ['BU', 63, 15]],
  '5-4-1': [['G', 50, 90], ['DG', 9, 64], ['DC', 30, 75], ['DC', 50, 77], ['DC', 70, 75], ['DD', 91, 64], ['MG', 14, 44], ['MC', 38, 48], ['MC', 62, 48], ['MD', 86, 44], ['BU', 50, 15]],
  '5-2-3': [['G', 50, 90], ['DG', 9, 63], ['DC', 30, 75], ['DC', 50, 77], ['DC', 70, 75], ['DD', 91, 63], ['MC', 36, 50], ['MC', 64, 50], ['AG', 17, 22], ['BU', 50, 14], ['AD', 83, 22]]
};
Object.keys(FORMATIONS).forEach(function (k) {
  FORMATIONS[k] = FORMATIONS[k].map(function (s) { return { pos: s[0], x: s[1], y: s[2] }; });
});
// Référence = moyenne des formations, pour qu'une équipe équilibrée ait ATT ≈ DEF ≈ sa note
var REF = (function () {
  var r = { a: 0, d: 0, c: 0 }, keys = Object.keys(FORMATIONS);
  keys.forEach(function (k) { FORMATIONS[k].forEach(function (s) { r.a += ARCH[s.pos].a; r.d += ARCH[s.pos].d; r.c += ARCH[s.pos].c; }); });
  r.a /= keys.length; r.d /= keys.length; r.c /= keys.length;
  return r;
})();

// ---------- Aléatoire déterministe ----------
function hashStr(str) {
  var h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
  for (var i = 0; i < str.length; i++) {
    var ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0) ^ (h2 >>> 0);
}
function makeRng(seed) {
  var a = hashStr(String(seed)) >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash01(s) { return (hashStr(s) >>> 0) / 4294967296; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function pickW(R, items, wf) {
  var tot = 0, ws = items.map(function (it) { var w = Math.max(0, wf(it)); tot += w; return w; });
  if (tot <= 0) return items[Math.floor(R() * items.length)];
  var r = R() * tot;
  for (var i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
function poisson(R, l) {
  if (l <= 0) return 0;
  var L = Math.exp(-l), k = 0, p = 1;
  do { k++; p *= R(); } while (p > L && k < 30);
  return k - 1;
}

// ---------- Notes dérivées ----------
function subRatings(ovr, pos) {
  var w = ARCH[pos];
  return { att: Math.round(ovr * w.a), def: Math.round(ovr * w.d), cre: Math.round(ovr * w.c) };
}
function injParams(p) {
  var r = hash01(p.id + ':inj'), r2 = hash01(p.id + ':mul');
  // Risque de base jamais nul : 1 à 3 % (gardien 1 à 2 %)
  if (p.pos === 'G') return { b: 0.01 + r * 0.01, m: 1.1 + r2 * 0.2 };
  var age = p.age || 30;
  return { b: Math.min(0.03, 0.01 + r * 0.02 + (age >= 32 ? 0.004 : 0)), m: 1.7 + r2 * 0.3 };
}
// Risque de blessure si le joueur est titulaire au prochain match (st = titularisations consécutives)
function injuryRisk(p, st) {
  var ip = injParams(p);
  var r = ip.b * Math.pow(ip.m, st || 0);
  return Math.min(p.pos === 'G' ? 0.08 : 0.5, r);
}

// ---------- Composition ----------
function defaultTactic() {
  return { f: '4-3-3', ment: 0, off: 'possession', def: 'median', tempo: 3, free: 50, xi: {}, bench: [] };
}
function pickLineup(pool, formation, xi, bench, opts) {
  opts = opts || {};
  var slots = FORMATIONS[formation] || FORMATIONS['4-3-3'];
  var byId = {}; pool.forEach(function (p) { byId[p.id] = p; });
  var used = {}, res = slots.map(function () { return null; });
  slots.forEach(function (s, i) {
    var pid = xi && xi[i];
    if (pid && byId[pid] && !used[pid]) { res[i] = pid; used[pid] = 1; }
  });
  // Postes restants : affectation optimale (méthode hongroise) qui maximise la somme des notes effectives,
  // pour ne pas sacrifier un joueur à son poste naturel au profit d'un autre placé hors poste.
  var freeSlots = [], freeP = pool.filter(function (p) { return !used[p.id]; });
  slots.forEach(function (s, i) { if (!res[i]) freeSlots.push(i); });
  if (freeSlots.length && freeP.length) {
    var val = freeSlots.map(function (i) {
      return freeP.map(function (p) {
        var pen = penOf(p, slots[i].pos), v = p.ovr - pen - 0.01 * pen;
        if (opts.avoidRisk && injuryRisk(p, p.st) >= opts.avoidRisk) v -= 9;
        return v;
      });
    });
    var asg = hungarianMax(val, freeSlots.length, freeP.length);
    asg.forEach(function (j, k) { if (j >= 0 && j < freeP.length) { res[freeSlots[k]] = freeP[j].id; used[freeP[j].id] = 1; } });
  }
  var b = [];
  (bench || []).forEach(function (pid) { if (pid && byId[pid] && !used[pid] && b.length < 7) { b.push(pid); used[pid] = 1; } });
  var rest = pool.filter(function (p) { return !used[p.id]; }).sort(function (x, y) { return y.ovr - x.ovr; });
  if (b.length < 7 && !b.some(function (id) { return byId[id].pos === 'G'; })) {
    var g = rest.filter(function (p) { return p.pos === 'G'; })[0];
    if (g) { b.push(g.id); used[g.id] = 1; }
  }
  rest.forEach(function (p) { if (b.length < 7 && !used[p.id]) { b.push(p.id); used[p.id] = 1; } });
  return { xi: res, bench: b };
}
// Affectation maximisant la somme val[ligne][colonne] (lignes = postes, colonnes = joueurs) ; -1 si aucun joueur
function hungarianMax(val, n, m0) {
  var m = Math.max(m0, n), INF = 1e15, a = [], i, j;
  for (i = 0; i < n; i++) { a.push([]); for (j = 0; j < m; j++) a[i].push(j < m0 ? -val[i][j] : 1e6); }
  var u = new Array(n + 1).fill(0), v = new Array(m + 1).fill(0), p = new Array(m + 1).fill(0), way = new Array(m + 1).fill(0);
  for (i = 1; i <= n; i++) {
    p[0] = i; var j0 = 0, minv = new Array(m + 1).fill(INF), usedC = new Array(m + 1).fill(false);
    do {
      usedC[j0] = true; var i0 = p[j0], delta = INF, j1 = 0;
      for (j = 1; j <= m; j++) if (!usedC[j]) {
        var cur = a[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (j = 0; j <= m; j++) { if (usedC[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
      j0 = j1;
    } while (p[j0] !== 0);
    do { var jj = way[j0]; p[j0] = p[jj]; j0 = jj; } while (j0);
  }
  var res = new Array(n).fill(-1);
  for (j = 1; j <= m; j++) if (p[j]) res[p[j] - 1] = j - 1 < m0 ? j - 1 : -1;
  return res;
}
// Puissances d'un onze (sommes brutes + indices ramenés à l'échelle des notes)
function lineupPower(players) {
  var a = 0, d = 0, c = 0, o = 0, n = 0;
  players.forEach(function (x) { a += x.att; d += x.def; c += x.cre; o += x.eff; n++; });
  return { a: a, d: d, c: c, Ra: a / REF.a, Rd: d / REF.d, Rc: c / REF.c, ovr: n ? o / n : 0 };
}
function onEntry(p, slot, minute) {
  var eff = p.ovr - penOf(p, slot);
  var s = subRatings(eff, slot);
  return { p: p, id: p.id, slot: slot, eff: eff, att: s.att, def: s.def, cre: s.cre, yel: 0, inMin: minute, outMin: null, out: false };
}

// ---------- Effets tactiques ----------
var MENT_OWN = [0.85, 0.93, 1, 1.08, 1.15];
var MENT_OPP = [0.87, 0.935, 1, 1.075, 1.16];
var MENT_NAME = ['Très défensive', 'Défensive', 'Équilibrée', 'Offensive', 'Très offensive'];
var OFF_STYLES = { possession: 'Possession', contre: 'Contre-attaque', direct: 'Jeu direct', ailes: 'Jeu sur les ailes' };
var DEF_STYLES = { bas: 'Bloc bas', median: 'Bloc médian', pressing: 'Pressing haut' };
var TEMPO_NAME = ['', 'Très lent', 'Lent', 'Normal', 'Rapide', 'Très rapide'];
// Créativité de l'onze sur 100 : chute vite quand le niveau baisse (≈ 89 pour un onze à 90, 40 à 80, 6 à 70)
function creScore(Rc) { return 100 * Math.pow(clamp((Rc - 66) / 26, 0, 1), 1.5); }
function mgrEfficiency(tac) { return clamp((tac - 60) / 35, 0, 1); }
function tacticRespect(tac) { return Math.round(60 + 40 * mgrEfficiency(tac)); }
function wideQuality(on) {
  var s = 0, n = 0;
  on.forEach(function (o) { if (!o.out && ['AD', 'AG', 'MD', 'MG', 'DD', 'DG'].indexOf(o.slot) >= 0) { s += o.att; n++; } });
  return n ? clamp((s / n - 50) / 30, 0, 1) : 0;
}
function tacticFx(tac, mgrTac, P, oppTac, on) {
  tac = tac || {}; oppTac = oppTac || {};
  var e = mgrEfficiency(mgrTac || 70);
  var sc = function (x) { return x >= 1 ? 1 + (x - 1) * (0.6 + 0.4 * e) : 1 - (1 - x) * (1.25 - 0.45 * e); };
  var scOpp = function (x) { return 1 / sc(1 / x); };
  var m = clamp(tac.ment | 0, -2, 2);
  var own = sc(MENT_OWN[m + 2]), opp = scOpp(MENT_OPP[m + 2]);
  var q = creScore(P.Rc) / 100;
  var f = clamp((tac.free == null ? 50 : tac.free) / 100, 0, 1);
  var creW = 1, errMul = 1, foul = 1, inj = 1;
  switch (tac.off) {
    case 'possession': own *= sc(0.94 + 0.12 * q); opp *= scOpp(0.93); break;
    case 'contre': own *= sc(1 + 0.12 * clamp(oppTac.ment | 0, -2, 2) / 2); break;
    case 'direct': own *= sc(1.06); creW = 0.5; errMul *= 0.75; foul *= 1.05; break;
    case 'ailes': own *= sc(0.96 + 0.10 * wideQuality(on || [])); break;
  }
  switch (tac.def) {
    case 'bas': opp *= scOpp(0.90); own *= sc(0.94); foul *= 0.9; break;
    case 'pressing': opp *= scOpp(oppTac.off === 'direct' ? 1.04 : 0.93); own *= sc(1.05); foul *= 1.25; inj *= 1.15; break;
  }
  var t = (tac.tempo == null ? 3 : tac.tempo) - 3;
  own *= 1 + 0.05 * t; opp *= 1 + 0.035 * t; foul *= 1 + 0.08 * t; errMul *= 1 + 0.12 * t;
  var cre = 1 + 0.5 * creW * (f * q - f * f / 2);
  var err = (0.05 * f + 0.9 * Math.pow(Math.max(0, f - q), 2)) * errMul;
  return { own: own, opp: opp, cre: cre, err: err, foul: foul, inj: inj, e: e, q: q, f: f };
}

// ---------- Simulation d'un match ----------
var SIM = { BASE: 1.32, SENS: 0.05, HOME: [1.1, 0.95] };
var INTR = { G: 0.3, DC: 3.6, DD: 4.4, DG: 4.4, MDC: 4.2, MC: 2.6, MD: 1.6, MG: 1.6, MOC: 1.0, AD: 0.8, AG: 0.8, BU: 0.4 };

function simulateMatch(cfg) {
  var R = makeRng(cfg.seed);
  var home = cfg.neutral ? [1, 1] : SIM.HOME;
  var mult = cfg.mults || [1, 1];
  var ev = [], rec = {}, score = [0, 0];
  var teams = cfg.teams.map(function (T, ti) {
    T.tactic = T.tactic || defaultTactic();
    var f = FORMATIONS[T.tactic.f] ? T.tactic.f : '4-3-3';
    var players = T.players.map(function (p) { return Object.assign({}, p); });
    var avail = players.filter(function (p) { return !(p.inj > 0) && !(p.susp > 0); });
    var lu = pickLineup(avail, f, T.tactic.xi, T.tactic.bench, T.autoRotate ? { avoidRisk: 0.15 } : null);
    var slots = FORMATIONS[f];
    var byId = {}; players.forEach(function (p) { byId[p.id] = p; });
    var on = [];
    lu.xi.forEach(function (pid, i) {
      if (!pid) return;
      var o = onEntry(byId[pid], slots[i].pos, 0); on.push(o);
      rec[pid] = { side: ti, start: 1, min: 0, g: 0, a: 0, int: 0, cs: 0, y: 0, r: 0, inj: 0, slot: slots[i].pos };
    });
    return {
      T: T, on: on, bench: lu.bench.map(function (id) { return byId[id]; }), lineup: lu,
      subs: 0, fsy: 0, ycount: 0, shots: 0, sot: 0, fouls: 0, y: 0, r: 0,
      jA: (R() * 2 - 1) * 15, jD: (R() * 2 - 1) * 15, jC: (R() * 2 - 1) * 15
    };
  });
  function power(t) {
    var a = t.jA, d = t.jD, c = t.jC;
    t.on.forEach(function (o) { if (!o.out) { a += o.att; d += o.def; c += o.cre; } });
    return { a: a, d: d, c: c, Ra: a / REF.a, Rd: d / REF.d, Rc: c / REF.c };
  }
  var rates, lam0;
  function computeRates() {
    var P = teams.map(power);
    var F = teams.map(function (t, i) { return tacticFx(t.T.tactic, t.T.mgrTac, P[i], teams[1 - i].T.tactic, t.on); });
    rates = [0, 1].map(function (i) {
      var j = 1 - i;
      var lam = SIM.BASE * Math.exp(SIM.SENS * (P[i].Ra - P[j].Rd)) * F[i].own * F[j].opp * F[i].cre * (home[i] * mult[i]) / (home[j] * mult[j]);
      lam = clamp(lam, 0.12, 3.2);
      return { lam: lam, err: F[j].err, tot: lam + F[j].err, foul: F[i].foul, inj: F[i].inj, P: P[i], F: F[i] };
    });
    if (!lam0) lam0 = rates.map(function (r) { return { lam: r.lam, err: r.err, P: r.P, F: r.F }; });
  }
  computeRates();

  // blessures pré-tirées pour les titulaires
  var injSched = [];
  teams.forEach(function (t, i) {
    t.on.forEach(function (o) {
      var risk = injuryRisk(o.p, o.p.st || 0) * rates[i].inj;
      if (R() < risk) {
        var dur = pickW(R, [1, 2, 3, 4, 6, 10], function (d) { return { 1: 40, 2: 25, 3: 15, 4: 10, 6: 7, 10: 3 }[d]; });
        injSched.push({ m: 3 + Math.floor(R() * 86), t: i, o: o, dur: dur });
      }
    });
  });

  function add(e) { ev.push(e); }
  function recOf(o, side) {
    if (!rec[o.id]) rec[o.id] = { side: side, start: 0, min: 0, g: 0, a: 0, int: 0, cs: 0, y: 0, r: 0, inj: 0, slot: o.slot };
    return rec[o.id];
  }
  function bestBench(t, slot, maxPen) {
    var best = null, bv = -1e9;
    t.bench.forEach(function (b) {
      if (!b || b._used) return;
      var pen = penOf(b, slot);
      if (pen > maxPen) return;
      var v = b.ovr - pen;
      if (v > bv) { bv = v; best = b; }
    });
    return best ? { p: best, eff: bv } : null;
  }
  function doSub(t, i, outO, inP, lab, m, why) {
    outO.out = true; outO.outMin = m;
    inP._used = true; t.subs++;
    var o = onEntry(inP, outO.slot, m);
    if (m >= 55) { o.eff += 2; var s = subRatings(o.eff, o.slot); o.att = s.att; o.def = s.def; o.cre = s.cre; }
    t.on.push(o); recOf(o, i);
    add({ t: 'sub', m: lab, s: i, p: inP.id, a: outO.id, w: why || '' });
    computeRates();
  }
  function tacticalSubs(t, i, m, lab, maxN) {
    var diff = score[i] - score[1 - i];
    var cands = t.on.filter(function (o) { return !o.out && o.slot !== 'G' && o.inMin === 0; }).map(function (o) {
      var s = (o.yel ? 3 : 0) + ((o.p.st || 0) >= 2 ? 2 : 0) + (diff < 0 && LINE[o.slot] === 'ATT' ? 1 : 0) + (o.eff < 72 ? 1 : 0);
      return { o: o, s: s };
    }).filter(function (c) { return c.s >= 2; }).sort(function (a, b) { return b.s - a.s; });
    var n = 0;
    for (var k = 0; k < cands.length && n < maxN && t.subs < 5; k++) {
      var c = cands[k].o;
      var bb = bestBench(t, c.slot, 5);
      if (bb && bb.eff + 2 >= c.eff - 4) { doSub(t, i, c, bb.p, lab, m, c.yel ? 'carton' : diff < 0 ? 'offensif' : 'fraîcheur'); n++; }
    }
  }

  var minutes = [];
  for (var m = 1; m <= 45; m++) minutes.push({ m: m, lab: String(m) });
  var x1 = 1 + Math.floor(R() * 3); for (var k = 1; k <= x1; k++) minutes.push({ m: 45, lab: '45+' + k, x: 1 });
  minutes.push({ ht: 1 });
  for (m = 46; m <= 90; m++) minutes.push({ m: m, lab: String(m) });
  var x2 = 2 + Math.floor(R() * 4); for (k = 1; k <= x2; k++) minutes.push({ m: 90, lab: '90+' + k, x: 1 });
  var nMin = 90 + x1 + x2;

  add({ t: 'ko', m: '0' });
  if (mult[0] !== 1) add({ t: 'mult', m: '0', s: 0, v: mult[0] });
  if (mult[1] !== 1) add({ t: 'mult', m: '0', s: 1, v: mult[1] });

  minutes.forEach(function (mm) {
    if (mm.ht) { add({ t: 'ht', m: '45', sc: score.slice() }); return; }
    var lab = mm.lab, mi = mm.m;
    if (!mm.x) {
      injSched.forEach(function (j) {
        if (j.m !== mi || j.o.out) return;
        var t = teams[j.t];
        j.o.out = true; j.o.outMin = mi;
        rec[j.o.id].inj = j.dur;
        add({ t: 'inj', m: lab, s: j.t, p: j.o.id, d: j.dur });
        if (t.subs < 5) {
          var bb = bestBench(t, j.o.slot, 7) || bestBench(t, j.o.slot, 15);
          if (bb) doSub(t, j.t, j.o, bb.p, lab, mi, 'blessure');
          else computeRates();
        } else computeRates();
      });
      if (mi === 60 || mi === 70 || mi === 80) teams.forEach(function (t, i) { tacticalSubs(t, i, mi, lab, mi === 80 ? 1 : 2); });
    }
    var order = R() < 0.5 ? [0, 1] : [1, 0];
    order.forEach(function (i) {
      var t = teams[i], o2 = teams[1 - i], r = rates[i];
      var live = t.on.filter(function (o) { return !o.out; });
      var oppLive = o2.on.filter(function (o) { return !o.out; });
      if (!live.length) return;
      // Gestion du score : l'équipe qui mène largement lève le pied, celle qui est menée pousse en fin de match
      var diff = score[i] - score[1 - i];
      var gm = diff >= 3 ? 0.5 : diff >= 2 ? 0.78 : (diff < 0 && mi >= 70 ? 1.15 : 1);
      // But
      if (R() < r.tot * gm / nMin) {
        var outfield = live.filter(function (o) { return o.slot !== 'G'; });
        if (!outfield.length) outfield = live;
        var fromErr = R() < r.err / r.tot;
        var scorer = pickW(R, outfield, function (o) { return Math.pow(Math.max(5, o.att), 3) * (o.slot === 'BU' ? 1.4 : 1); });
        var assist = null, culprit = null;
        if (fromErr) {
          var oppField = oppLive.filter(function (o) { return o.slot !== 'G'; });
          if (oppField.length) culprit = pickW(R, oppField, function (o) { return o.cre; });
        } else if (R() < 0.84) {
          var mates = live.filter(function (o) { return o !== scorer; });
          if (mates.length) assist = pickW(R, mates, function (o) { return Math.pow(Math.max(5, o.cre), 3) * (o.slot === 'G' ? 0.02 : 1); });
        }
        score[i]++; t.shots++; t.sot++;
        recOf(scorer, i).g++;
        if (assist) recOf(assist, i).a++;
        add({ t: 'goal', m: lab, s: i, p: scorer.id, a: assist ? assist.id : null, e: culprit ? culprit.id : null, sc: score.slice() });
        return;
      }
      // Occasion manquée
      if (R() < 1.3 * r.lam * gm / nMin) {
        var sh = pickW(R, live.filter(function (o) { return o.slot !== 'G'; }).concat([]), function (o) { return Math.pow(Math.max(5, o.att), 2); });
        if (!sh) return;
        var v = R(); var kind = v < 0.45 ? 'off' : v < 0.88 ? 'save' : 'post';
        t.shots++; if (kind === 'save') t.sot++;
        var gk = oppLive.filter(function (o) { return o.slot === 'G'; })[0];
        add({ t: 'miss', m: lab, s: i, p: sh.id, k: kind, g: gk ? gk.id : null });
      }
      // Faute
      if (R() < 11 * r.foul / nMin) {
        var cm = pickW(R, live, function (o) { return o.slot === 'G' ? 2 : (o.def + 10) * ({ DEF: 1.2, MIL: 1.1, ATT: 0.7 }[LINE[o.slot]] || 1); });
        t.fouls++;
        var pY = Math.min(0.5, 0.07 + 0.03 * t.fsy);
        var pR = 0.0025 + 0.0015 * t.ycount;
        var cr = recOf(cm, i);
        if (R() < pR) {
          cm.out = true; cm.outMin = mi; cr.r = 1; t.r++;
          add({ t: 'red', m: lab, s: i, p: cm.id, k: 'direct' });
          afterRed(t, i, cm, lab, mi);
        } else if (R() < pY) {
          t.fsy = 0; t.ycount++; t.y++;
          if (cm.yel) {
            cm.out = true; cm.outMin = mi; cr.y++; cr.r = 1; t.r++;
            add({ t: 'red', m: lab, s: i, p: cm.id, k: '2j' });
            afterRed(t, i, cm, lab, mi);
          } else {
            cm.yel = 1; cr.y++;
            add({ t: 'yellow', m: lab, s: i, p: cm.id });
          }
        } else {
          t.fsy++;
          add({ t: 'foul', m: lab, s: i, p: cm.id });
        }
      }
    });
  });
  function afterRed(t, i, cm, lab, mi) {
    if (cm.slot === 'G' && t.subs < 5) {
      var gk = t.bench.filter(function (b) { return b && !b._used && b.pos === 'G'; })[0];
      var sac = t.on.filter(function (o) { return !o.out && o.slot !== 'G'; }).sort(function (a, b) { return a.eff - b.eff; })[0];
      if (gk && sac) {
        sac.out = true; sac.outMin = mi; gk._used = true; t.subs++;
        var o = onEntry(gk, 'G', mi); t.on.push(o); recOf(o, i);
        add({ t: 'sub', m: lab, s: i, p: gk.id, a: sac.id, w: 'gardien' });
      }
    }
    computeRates();
  }
  add({ t: 'ft', m: '90', sc: score.slice() });

  // Minutes jouées, clean sheets, interceptions, notes de match
  teams.forEach(function (t, i) {
    var oppLam = lam0[1 - i].lam;
    t.on.forEach(function (o) {
      var r = rec[o.id]; if (!r) return;
      var end = o.outMin == null ? 90 : o.outMin;
      r.min += Math.max(0, end - o.inMin);
      if (score[1 - i] === 0 && r.min >= 60) r.cs = 1;
      var li = Math.pow(o.def / 100, 2) * (INTR[o.slot] || 1) * (r.min / 90) * Math.sqrt(clamp(oppLam / 1.3, 0.7, 1.5));
      r.int += poisson(R, li);
      var res = score[i] > score[1 - i] ? 0.3 : score[i] < score[1 - i] ? -0.3 : 0;
      var defLine = o.slot === 'G' || LINE[o.slot] === 'DEF';
      var note = 6 + r.g * 1.0 + r.a * 0.7 + r.int * 0.12 + (r.cs && defLine ? 0.7 : 0) + res - r.y * 0.3 - r.r * 1.5 + (o.eff - 76) / 18 + (R() - 0.5) * 0.8;
      if (defLine && !r.cs) note -= 0.15 * score[1 - i];
      r.note = Math.round(clamp(note, 3.5, 10) * 10) / 10;
      if (r.min < 15 && !r.g && !r.a) r.note = null;
    });
  });
  var motm = null, mb = -1;
  Object.keys(rec).forEach(function (pid) { var r = rec[pid]; if (r.note != null && r.note > mb) { mb = r.note; motm = pid; } });

  var poss0 = 50 + (lam0[0].P.Rc - lam0[1].P.Rc) * 0.6
    + (teams[0].T.tactic.off === 'possession' ? 6 : 0) - (teams[1].T.tactic.off === 'possession' ? 6 : 0)
    + (teams[0].T.tactic.def === 'bas' ? -4 : 0) - (teams[1].T.tactic.def === 'bas' ? -4 : 0)
    + (teams[0].T.tactic.off === 'direct' ? -3 : 0) - (teams[1].T.tactic.off === 'direct' ? -3 : 0);
  poss0 = Math.round(clamp(poss0, 30, 70));

  return {
    score: score, ev: ev, rec: rec, motm: motm,
    stats: teams.map(function (t, i) { return { shots: t.shots, sot: t.sot, fouls: t.fouls, y: t.y, r: t.r, subs: t.subs, poss: i === 0 ? poss0 : 100 - poss0 }; }),
    lam: lam0.map(function (l) { return Math.round(l.lam * 100) / 100; }),
    lineups: teams.map(function (t) {
      return { xi: t.on.filter(function (o) { return o.inMin === 0; }).map(function (o) { return [o.id, o.slot]; }), bench: t.lineup.bench };
    })
  };
}

// ---------- Objectifs joueurs ----------
// Plus la note est basse, plus l'objectif est facile. Fenêtres de plusieurs matchs (progression dans la durée).
var OBJ_GROUP = { BU: 'BU', AD: 'AW', AG: 'AW', MOC: 'AM', MC: 'CM', MD: 'CM', MG: 'CM', MDC: 'DM', DD: 'FB', DG: 'FB', DC: 'CB', G: 'GK' };
var GROUP_STAT = { BU: 'but', AW: 'but', AM: 'pd', CM: 'pd', DM: 'int', FB: 'int', CB: 'cs', GK: 'cs' };
var STAT_OF_POS = {}; Object.keys(OBJ_GROUP).forEach(function (p) { STAT_OF_POS[p] = GROUP_STAT[OBJ_GROUP[p]]; });
// Version 2 : objectifs plus durs (réussite par fenêtre ≈ 40 % sous 70, 15 % entre 80 et 84, 3 à 8 % au-delà de 85)
var OBJ = {
  BU: [[3, 6], [3, 5], [4, 6], [5, 7], [2, 4, 2], [3, 6, 2]],
  AW: [[2, 6], [2, 5], [3, 7], [4, 8], [5, 7], [6, 7]],
  AM: [[1, 5], [2, 8], [2, 6], [3, 7], [3, 5], [4, 5]],
  CM: [[1, 6], [2, 8], [2, 6], [3, 8], [4, 7], [5, 7]],
  DM: [[10, 5], [11, 5], [12, 5], [13, 5], [15, 5], [16, 5]],
  FB: [[9, 5], [10, 5], [12, 5], [13, 5], [15, 5], [17, 5]],
  CB: [[2, 7], [2, 5], [3, 8], [3, 6], [4, 6], [4, 5]],
  GK: [[2, 7], [2, 5], [3, 8], [3, 6], [4, 6], [4, 5]]
};
// Plafond : un joueur ne peut gagner que 2 points de note par saison
var UPS_PER_SEASON = 2;
function tierOf(o) { return o < 70 ? 0 : o < 75 ? 1 : o < 80 ? 2 : o < 85 ? 3 : o < 90 ? 4 : 5; }
function objectiveFor(pos, ovr) {
  var g = OBJ_GROUP[pos] || 'CM';
  var o = OBJ[g][tierOf(ovr)];
  return { stat: GROUP_STAT[g], k: o[0], n: o[1], multi: o[2] || 0 };
}
function objectiveText(o) {
  if (o.stat === 'but') return o.multi ? 'Réussir ' + o.k + ' doublés en ' + o.n + ' matchs' : 'Marquer ' + o.k + ' but' + (o.k > 1 ? 's' : '') + ' en ' + o.n + ' matchs';
  if (o.stat === 'pd') return 'Délivrer ' + o.k + ' passe' + (o.k > 1 ? 's' : '') + ' décisive' + (o.k > 1 ? 's' : '') + ' en ' + o.n + ' matchs';
  if (o.stat === 'int') return 'Réussir ' + o.k + ' interceptions en ' + o.n + ' matchs';
  return 'Garder sa cage inviolée ' + o.k + ' fois en ' + o.n + ' matchs';
}
function statFromRec(stat, r) { return stat === 'but' ? r.g : stat === 'pd' ? r.a : stat === 'int' ? r.int : r.cs; }
// Retourne { ob: nouvel état, up: bool, failed: bool }
function progressObjective(ob, pos, ovr, pot, r) {
  if (ovr >= pot) return { ob: null, up: false, failed: false };
  var o = objectiveFor(pos, ovr);
  ob = ob ? { w: ob.w || 0, v: ob.v || 0, m: ob.m || 0 } : { w: 0, v: 0, m: 0 };
  var val = statFromRec(o.stat, r);
  ob.w++; ob.v += val; if (o.multi && val >= o.multi) ob.m++;
  var ok = o.multi ? ob.m >= o.k : ob.v >= o.k;
  if (ok) return { ob: { w: 0, v: 0, m: 0 }, up: true, failed: false };
  if (ob.w >= o.n) return { ob: { w: 0, v: 0, m: 0 }, up: false, failed: true };
  return { ob: ob, up: false, failed: false };
}

if (typeof module !== 'undefined') module.exports = {};
