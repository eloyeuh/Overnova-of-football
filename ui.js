// ===== INTERFACE =====
var ICONS = {
  effectif: '<path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0Z"/>',
  tactique: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M12 4v16"/><circle cx="12" cy="12" r="3"/>',
  objectifs: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  mercato: '<path d="M4 8h14l-3.5-3.5"/><path d="M20 16H6l3.5 3.5"/>',
  boutique: '<path d="M5 8h14l-1.2 12H6.2Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  competitions: '<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H5v1a3 3 0 0 0 3 3"/><path d="M16 6h3v1a3 3 0 0 1-3 3"/><path d="M12 13v4M9 20h6M10 17h4"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
};
function icon(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>'; }
var TABS = [['effectif', 'Effectif'], ['tactique', 'Tactique'], ['objectifs', 'Objectifs'], ['mercato', 'Mercato'], ['boutique', 'Boutique'], ['competitions', 'Compétitions']];

function kept(k, def) { return S.keep && S.keep[k] != null ? S.keep[k] : def; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fmtN(x, d) { return Number(x).toLocaleString('fr-FR', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }); }
function fmtM(x) { return fmtN(x, Math.abs(x) < 10 ? 1 : 0) + ' M€'; }
function pct(x) { return Math.round(x * 100) + ' %'; }
function rtClass(ovr, kind) { return kind === 'legend' ? 'leg' : ovr >= 85 ? 'gold' : ovr >= 78 ? 'silver' : 'bronze'; }
function rt(ovr, kind, size) { return '<span class="rt ' + rtClass(ovr, kind) + (size ? ' ' + size : '') + '">' + ovr + '</span>'; }
function posChip(pos) { return '<span class="pos ' + LINE[pos] + '" title="' + POS_NAME[pos] + '">' + pos + '</span>'; }
// Poste principal + second poste (même efficacité)
function posChips(p) {
  if (!p.pos2) return '<span class="poss">' + posChip(p.pos) + '</span>';
  return '<span class="poss">' + posChip(p.pos) + '<span class="pos2 ' + LINE[p.pos2] + '" title="Aussi ' + POS_NAME[p.pos2] + '">' + p.pos2 + '</span></span>';
}
function posNames(p) { return POS_NAME[p.pos] + (p.pos2 ? ' · aussi ' + POS_NAME[p.pos2].toLowerCase() : ''); }
function crest(cid, size) {
  var c = CLUB[cid];
  return '<span class="crest ' + (size || '') + '" style="background:linear-gradient(135deg,' + c.colors[0] + ' 0 50%,' + c.colors[1] + ' 50% 100%)"><span>' + esc(c.short) + '</span></span>';
}
function gauge(v, max, cls) { return '<div class="gauge ' + (cls || '') + '"><i style="width:' + clamp(v / max * 100, 0, 100).toFixed(1) + '%"></i></div>'; }
function riskCls(r) { return r >= 0.15 ? 'bad' : r >= 0.07 ? 'warn' : 'ok'; }
function stateChips(p, showRisk) {
  var h = '';
  if (p.inj) h += '<span class="pill bad">Blessé · ' + p.inj + ' m.</span>';
  if (p.susp) h += '<span class="pill bad">Suspendu</span>';
  if (!p.inj && !p.susp && showRisk) {
    var r = injuryRisk(p, p.st);
    h += '<span class="pill ' + (r >= 0.07 ? riskCls(r) : 'neutral') + '" title="Risque de blessure s’il est titulaire">Risque ' + pct(r) + '</span>';
  }
  if (p.kind === 'legend') h += '<span class="pill leg">Légende</span>';
  if (p.kind === 'pack') h += '<span class="pill leg">' + RARITY[p.rarity] + '</span>';
  return h;
}
function toast(msg) {
  var t = document.getElementById('toast'); if (!t) return;
  var d = document.createElement('div'); d.textContent = msg; t.appendChild(d);
  while (t.children.length > 2) t.removeChild(t.firstChild);
  setTimeout(function () { d.remove(); }, 2800);
}
function flashSaved() {
  var el = document.getElementById('saved'); if (!el) return;
  el.classList.add('on'); setTimeout(function () { el.classList.remove('on'); }, 1400);
}

// ---------- Rendu principal ----------
var _rq = null;
function render() { if (_rq) return; _rq = requestAnimationFrame(function () { _rq = null; doRender(); }); }
function doRender() {
  var app = document.getElementById('app');
  var ae = document.activeElement, fid = ae && ae.id, sel = null;
  try { if (ae && ae.selectionStart != null) sel = [ae.selectionStart, ae.selectionEnd]; } catch (e) { }
  if (S.needLogin) { app.innerHTML = renderLogin(); return; }
  if (!S.ready) { app.innerHTML = '<div class="loading"><div><b class="disp" style="font-size:28px">Carrière Foot</b><p>Connexion au vestiaire…</p></div></div>'; return; }
  var me = myClubId();
  if (isLegacy()) app.innerHTML = renderLegacy();
  else if (!me) app.innerHTML = renderOnboarding();
  else app.innerHTML = renderTop(me) + '<div class="wrap">' + renderTabs(me) + renderStrip(me) + '<main id="page" data-sec="' + S.ui.tab + '">' + renderPage(me) + '</main></div>';
  if (fid) { var el = document.getElementById(fid); if (el) { el.focus(); try { if (sel) el.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
  if (S.sheet && S.sheet.kind !== 'match' && S.sheet.kind !== 'pack') renderSheet();
  updateCountdowns();
}
function renderTop(me) {
  var c = clubDoc(me), note = clubNote(me), xi = xiNote(me);
  var circ = 2 * Math.PI * 22, off = circ * (1 - clamp((note - 50) / 50, 0, 1));
  var pend = pendingActions(me).length;
  var cc = CLUB[me].colors;
  return '<header class="top" style="--c1:' + cc[0] + ';--c2:' + cc[1] + '"><div class="wrap top-in">' + crest(me) +
    '<div class="club-id"><div class="name disp">' + esc(CLUB[me].name) + '</div><div class="sub">Coach ' + esc(c.pseudo || 'sans nom') + ' · Saison ' + seasonNo() + ' <span class="mode ' + (Store.online() ? 'on' : '') + '">' + (Store.online() ? 'En ligne' : 'Solo local') + '</span>' + (Store.mode === 'fb' ? ' <button class="lnk" data-a="logout">Déconnexion</button>' : '') + '</div></div>' +
    '<div class="top-stats">' +
    '<div class="row" title="Note club : moyenne des notes de tout l’effectif"><div class="ring"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="5"/><circle cx="26" cy="26" r="22" fill="none" stroke="var(--yel)" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><span class="v">' + Math.round(note) + '</span></div>' +
    '<div class="stat-mini hide-sm" style="align-items:flex-start"><span class="lbl">Note club</span><span class="small muted">' + fmtN(note) + ' · onze ' + Math.round(xi) + '</span></div></div>' +
    '<div class="stat-mini"><span class="lbl">Budget</span><b class="money">' + fmtM(available(me)) + '</b></div>' +
    '<button class="bell" data-a="notifs" aria-label="Notifications">' + icon('bell') + (pend ? '<i>' + pend + '</i>' : '') + '</button>' +
    '</div></div><div class="scarf" aria-hidden="true"></div></header>';
}
function renderTabs(me) {
  var dots = {
    mercato: pendingActions(me).length > 0,
    objectifs: claimableCount(me) > 0,
    boutique: Object.keys(S.d.auctions).some(function (k) { return lotLive(S.d.auctions[k]); })
  };
  return '<nav class="tabs" aria-label="Pages du club">' + TABS.map(function (t) {
    return '<button class="tab" data-a="tab" data-v="' + t[0] + '" data-sec="' + t[0] + '"' + (S.ui.tab === t[0] ? ' aria-current="page"' : '') + '><span class="ic">' + icon(t[0]) + '</span><b>' + t[1] + '</b>' + (dots[t[0]] ? '<span class="dot"></span>' : '') + '</button>';
  }).join('') + '</nav>';
}
function renderStrip(me) {
  var g = game(), L = leagueDoc();
  if (S.liveMatch) {
    var r = findResult(S.liveMatch);
    return '<div class="strip live"><b>Ton match vient d’être joué.</b><span class="grow">' + (r ? esc(CLUB[r.h].name) + ' – ' + esc(CLUB[r.a].name) : '') + '</span><button class="btn pri sm" data-a="match" data-mid="' + S.liveMatch + '">Regarder (1 min)</button><button class="btn sm" data-a="live-x">Plus tard</button></div>';
  }
  if (g.phase === 'en_cours') {
    var nf = nextFixture(me);
    if (nf && nf.pair) {
      var home = nf.pair[0] === me, opp = home ? nf.pair[1] : nf.pair[0];
      return '<div class="strip"><b>Journée ' + (nf.md + 1) + '</b><span class="grow">' + fmtWhen(nf.t) + ' · ' + (home ? 'contre ' : 'chez ') + '<b>' + esc(CLUB[opp].name) + '</b> (' + (home ? 'domicile ×1,10' : 'extérieur ×0,95') + ') · coup d’envoi dans <span class="count" data-cd="' + nf.t + '"></span></span><button class="btn sm" data-a="tab" data-v="tactique">Régler la tactique</button></div>';
    }
    if (nf) return '<div class="strip"><span class="grow">Journée ' + (nf.md + 1) + ' : ton club est exempté. Repos pour tout l’effectif.</span></div>';
    if (L && L.clubs && L.clubs.indexOf(me) < 0) return '<div class="strip"><span class="grow">Une saison est en cours sans ton club. Tu pourras t’inscrire à la prochaine. En attendant : coupe du samedi, enchères et mercato.</span><button class="btn sm" data-a="goto" data-v="competitions" data-s="coupe">Voir la coupe</button></div>';
  }
  if (g.phase === 'inscriptions') {
    var regd = registeredClubs(L), mine = regd.indexOf(me) >= 0;
    return '<div class="strip"><b>Saison ' + seasonNo() + ' · inscriptions</b><span class="grow">' + regd.length + ' club' + (regd.length > 1 ? 's' : '') + ' inscrit' + (regd.length > 1 ? 's' : '') + (mine ? ', dont le tien.' : '. Ton club n’est pas encore inscrit.') + '</span>' + (mine ? '' : '<button class="btn pri sm" data-a="lg-reg">Inscrire mon club</button>') + '<button class="btn sm" data-a="goto" data-v="competitions" data-s="ligue">Voir la ligue</button></div>';
  }
  if (g.phase === 'terminee' && L && L.champion) {
    return '<div class="strip"><b>Saison ' + seasonNo() + ' terminée</b><span class="grow">Champion : ' + esc(CLUB[L.champion].name) + '.</span><button class="btn sm" data-a="goto" data-v="competitions" data-s="ligue">Classement final</button></div>';
  }
  return '';
}
function renderPage(me) {
  switch (S.ui.tab) {
    case 'tactique': return pageTactique(me);
    case 'objectifs': return pageObjectifs(me);
    case 'mercato': return pageMercato(me);
    case 'boutique': return pageBoutique(me);
    case 'competitions': return pageCompetitions(me);
    default: return pageEffectif(me);
  }
}
function subtabs(page, items) {
  return '<div class="subtabs">' + items.map(function (it) {
    return '<button class="chip" data-a="sub" data-p="' + page + '" data-v="' + it[0] + '" aria-pressed="' + (S.ui.sub[page] === it[0]) + '">' + it[1] + (it[2] ? '<span class="n">' + it[2] + '</span>' : '') + '</button>';
  }).join('') + '</div>';
}
function pendingActions(me) {
  return Object.keys(S.d.offers).map(function (k) { return S.d.offers[k]; }).filter(function (o) {
    return o.st === 'open' && ((o.to === me && o.turn === 'to') || (o.from === me && o.turn === 'from'));
  });
}
function claimableCount(me) {
  var n = 0, ss = seasonStats(me), x = objCtx(me);
  CLUB_OBJ.forEach(function (o) { var pr = o.prog(ss, x); if (pr[0] >= pr[1] && !S.d.ledger['ob-s' + seasonNo() + '-' + me + '-' + o.id]) n++; });
  var c = clubDoc(me), rc = c.rec || {};
  ['r', 'o', 'u'].forEach(function (t) { if (!(c.legends || {})[t] && LEGEND_TIERS[t].prog(rc).every(function (p) { return p[0] >= p[1]; })) n++; });
  return n;
}
function objCtx(me) {
  var L = leagueDoc();
  return { podium: !!(L && L.podium && L.podium.indexOf(me) >= 0), champion: !!(L && L.champion === me) };
}
function myTactic(me) { return S.tacDraft || clone(clubDoc(me).tactic) || defaultTactic(); }
function xiPlayers(me, tac) {
  tac = tac || myTactic(me);
  var slots = FORMATIONS[tac.f] || FORMATIONS['4-3-3'], ids = squadIds(me);
  return slots.map(function (s, i) {
    var pid = tac.xi && tac.xi[i];
    if (!pid || ids.indexOf(pid) < 0) return { slot: s, i: i, p: null };
    return { slot: s, i: i, p: P(pid, me) };
  });
}
function xiNote(me) {
  var xs = xiPlayers(me).filter(function (x) { return x.p; });
  if (!xs.length) return 0;
  return xs.reduce(function (a, x) { return a + x.p.ovr - penOf(x.p, x.slot.pos); }, 0) / xs.length;
}
function updateCountdowns() {
  var now = Date.now();
  document.querySelectorAll('[data-cd]').forEach(function (el) { el.textContent = fmtLeft(+el.getAttribute('data-cd') - now); });
}

function findResult(mid) {
  var out = null;
  Object.keys(S.d.league).forEach(function (k) {
    var L = S.d.league[k]; if (!L.res) return;
    Object.keys(L.res).forEach(function (md) { var m = L.res[md].m || {}; Object.keys(m).forEach(function (key) { if (m[key].mid === mid) { var ab = key.split('_'); out = { h: ab[0], a: ab[1], r: m[key] }; } }); });
  });
  Object.keys(S.d.cups).forEach(function (k) { var c = S.d.cups[k]; Object.keys(c.r || {}).forEach(function (rd) { (c.r[rd] || []).forEach(function (m) { if (m.mid === mid) out = { h: m.a, a: m.b, r: { hg: m.sa, ag: m.sb } }; }); }); });
  return out;
}

// ---------- Page Effectif ----------
function playerRow(p, opts) {
  opts = opts || {};
  var s = subRatings(p.ovr, p.pos);
  var clubCell = opts.club ? '<span class="club">' + crest(p.club || p.origin, 'sm') + esc(p.club ? CLUB[p.club].name : 'Libre') + (opts.club && p.club ? ' · ' + esc(clubLabel(p.club)) : '') + '</span>' : '';
  return '<button class="prow" data-a="player" data-pid="' + p.id + '">' +
    posChips(p) +
    '<span class="pname"><span class="fn">' + esc(p.fn || ' ') + '</span><span class="ln">' + esc(p.ln) + '</span>' + clubCell + '</span>' +
    '<span class="c-age num muted">' + (p.age || '—') + '</span>' +
    rt(p.ovr, p.kind, 'sm') +
    '<span class="pot c-pot" title="Potentiel">' + p.pot + '</span>' +
    '<span class="val money">' + fmtM(p.val) + '</span>' +
    '<span class="minig c-gauges" title="Attaque · Défense · Créativité">' + gauge(s.att, 99, 'att') + gauge(s.def, 99, 'def') + gauge(s.cre, 99, 'cre') + '</span>' +
    '<span class="state c-state">' + stateChips(p, opts.risk) + '</span>' +
    '</button>';
}
function plistHead(club) {
  return '<div class="prow head"><span>Poste</span><span>Joueur' + (club ? ' · club' : '') + '</span><span class="c-age">Âge</span><span>Note</span><span class="c-pot">Pot.</span><span style="text-align:right">Prix</span><span class="c-gauges">Att · Déf · Cré</span><span class="c-state" style="text-align:right">État</span></div>';
}
function sortPlayers(list, key) {
  var f = {
    ovr: function (a, b) { return b.ovr - a.ovr || b.pot - a.pot; },
    pot: function (a, b) { return b.pot - a.pot || b.ovr - a.ovr; },
    val: function (a, b) { return b.val - a.val; },
    valAsc: function (a, b) { return a.val - b.val; },
    age: function (a, b) { return (a.age || 99) - (b.age || 99); },
    pos: function (a, b) { return POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos) || b.ovr - a.ovr; }
  }[key] || function (a, b) { return b.ovr - a.ovr; };
  return list.slice().sort(f);
}
function pageEffectif(me) {
  var m = mgrOf(me), sq = squad(me), f = S.ui.eff;
  var inj = sq.filter(function (p) { return p.inj || p.susp; }).length;
  var list = sq.filter(function (p) { return f.line === 'Tous' || LINE[p.pos] === f.line; });
  list = sortPlayers(list, f.sort);
  var lines = [['Tous', 'Tous'], ['G', 'Gardiens'], ['DEF', 'Défense'], ['MIL', 'Milieu'], ['ATT', 'Attaque']];
  return '<div class="page-h"><h1 class="disp">Effectif</h1><span class="muted small">' + sq.length + ' joueurs</span></div>' +
    '<div class="grid g2" style="margin-bottom:12px">' +
    '<div class="card mgr"><div class="face">' + esc((m.fn[0] || '') + (m.ln[0] || '')) + '</div><div class="stack" style="gap:6px">' +
    '<div class="row wrap-r"><div><span class="lbl">Entraîneur</span><div class="disp" style="font-size:22px">' + esc(m.fn + ' ' + m.ln) + '</div></div><span class="sp"></span><button class="btn sm" data-a="goto" data-v="mercato" data-s="coachs">Changer</button></div>' +
    '<div class="gline"><span>Tactique</span>' + gauge(m.tac, 99) + '<b>' + m.tac + '</b></div>' +
    '<div class="gline"><span>Potent.</span>' + gauge(m.pot, 99, 'money') + '<b>' + m.pot + '</b></div>' +
    '<div class="small muted">Respect de la tactique : <b style="color:var(--ink)">' + tacticRespect(m.tac) + ' %</b> · Prix marché <span class="money">' + fmtM(m.val) + '</span></div>' +
    '</div></div>' +
    '<div class="grid g2" style="gap:8px">' +
    kpi('Note club', fmtN(clubNote(me)), '/100') + kpi('Note du onze', fmtN(xiNote(me)), '/100') +
    kpi('Valeur de l’effectif', fmtN(squadValue(me), 0), 'M€') + kpi('Indisponibles', inj, inj > 1 ? 'joueurs' : 'joueur') +
    '</div></div>' +
    '<div class="toolbar">' + lines.map(function (l) { return '<button class="chip" data-a="eline" data-v="' + l[0] + '" aria-pressed="' + (f.line === l[0]) + '">' + l[1] + '</button>'; }).join('') +
    '<span class="sp"></span><label class="small muted" for="esort">Trier</label><select class="input" id="esort" data-in="esort" style="width:auto;padding:6px 10px">' +
    [['ovr', 'Note'], ['pot', 'Potentiel'], ['val', 'Prix'], ['age', 'Âge'], ['pos', 'Poste']].map(function (o) { return '<option value="' + o[0] + '"' + (f.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
    '<div class="plist">' + plistHead() + list.map(function (p) { return playerRow(p, { risk: true }); }).join('') + '</div>';
}
function kpi(label, v, unit) { return '<div class="card kpi"><span class="lbl">' + label + '</span><div class="v">' + v + ' <small>' + (unit || '') + '</small></div></div>'; }

// ---------- Page Tactique ----------
function tacticPowers(me, tac) {
  var xs = xiPlayers(me, tac).filter(function (x) { return x.p && !x.p.inj && !x.p.susp; });
  var on = xs.map(function (x) { return onEntry(x.p, x.slot.pos, 0); });
  var P0 = lineupPower(on);
  var fx = tacticFx(tac, mgrOf(me).tac, P0, { ment: 0, off: 'possession', def: 'median' }, on);
  return { P: P0, fx: fx, n: on.length };
}
function pageTactique(me) {
  var tac = myTactic(me), xs = xiPlayers(me, tac), m = mgrOf(me);
  var pw = tacticPowers(me, tac);
  var unavailable = xs.filter(function (x) { return x.p && (x.p.inj || x.p.susp); });
  var empty = xs.filter(function (x) { return !x.p; }).length;
  var tokens = xs.map(function (x) {
    var s = x.slot;
    if (!x.p) return '<button class="tok empty" style="left:' + s.x + '%;top:' + s.y + '%" data-a="tok" data-i="' + x.i + '"><span class="disc">+</span><span class="nm">Choisir</span><span class="sl">' + s.pos + '</span></button>';
    var pen = penOf(x.p, s.pos), eff = x.p.ovr - pen;
    var cls = pen === 0 ? '' : pen <= 5 ? 'close' : 'bad';
    var risk = injuryRisk(x.p, x.p.st), flag = '';
    if (x.p.inj || x.p.susp) flag = '<span class="flag">' + (x.p.inj ? 'B' : 'S') + '</span>';
    else if (risk >= 0.07) flag = '<span class="flag ' + (risk < 0.15 ? 'w' : '') + '">' + Math.round(risk * 100) + '%</span>';
    return '<button class="tok ' + cls + '" style="left:' + s.x + '%;top:' + s.y + '%" data-a="tok" data-i="' + x.i + '" title="' + esc(fullName(x.p)) + ' · ' + posLabel(x.p) + ' joue ' + s.pos + (pen ? ' (−' + pen + ')' : '') + '"><span class="disc">' + eff + flag + '</span><span class="nm">' + esc(shortName(x.p)) + '</span><span class="sl">' + s.pos + (pen ? ' · −' + pen : '') + '</span></button>';
  }).join('');
  var bench = [];
  for (var i = 0; i < 7; i++) {
    var pid = tac.bench && tac.bench[i], p = pid && squadIds(me).indexOf(pid) >= 0 ? P(pid, me) : null;
    bench.push('<button class="bslot ' + (p ? 'filled' : '') + '" data-a="bslot" data-i="' + i + '">' + (p ? posChips(p) + '<span class="nm">' + esc(shortName(p)) + '</span>' + rt(p.ovr, p.kind, 'sm') : '<span class="muted small">Banc ' + (i + 1) + '</span><span class="muted">+</span>') + '</button>');
  }
  var fx = pw.fx, P0 = pw.P;
  var attMul = fx.own, defMul = 1 / fx.opp;
  var q = fx.q, f = fx.f;
  var errLvl = f - q <= 0.05 ? ['Faible', 'ok'] : f - q <= 0.2 ? ['Modéré', 'warn'] : ['Élevé', 'bad'];
  var seg = function (key, vals, labels, cur) {
    return '<div class="seg" role="group">' + vals.map(function (v, k) { return '<button data-a="tset" data-k="' + key + '" data-v="' + v + '" aria-pressed="' + (String(cur) === String(v)) + '">' + labels[k] + '</button>'; }).join('') + '</div>';
  };
  var chipsSel = function (key, map, cur) {
    return '<div class="chips">' + Object.keys(map).map(function (k) { return '<button class="chip" data-a="tset" data-k="' + key + '" data-v="' + k + '" aria-pressed="' + (cur === k) + '">' + map[k] + '</button>'; }).join('') + '</div>';
  };
  var warn = '';
  if (unavailable.length) warn += '<div class="warnbox">' + unavailable.length + ' titulaire' + (unavailable.length > 1 ? 's' : '') + ' indisponible' + (unavailable.length > 1 ? 's' : '') + ' (' + unavailable.map(function (x) { return esc(shortName(x.p)); }).join(', ') + '). Ils seront remplacés automatiquement au coup d’envoi.</div>';
  if (empty) warn += '<div class="warnbox">' + empty + ' poste' + (empty > 1 ? 's' : '') + ' vide' + (empty > 1 ? 's' : '') + ' : complétés automatiquement par les meilleurs disponibles.</div>';
  var risky = xs.filter(function (x) { return x.p && !x.p.inj && !x.p.susp && injuryRisk(x.p, x.p.st) >= 0.15; });
  if (risky.length) warn += '<div class="warnbox">Risque de blessure élevé pour ' + risky.map(function (x) { return esc(shortName(x.p)) + ' (' + pct(injuryRisk(x.p, x.p.st)) + ')'; }).join(', ') + ' : ils enchaînent les titularisations. Pense à les faire tourner.</div>';
  return '<div class="page-h"><h1 class="disp">Tactique</h1><span class="saved" id="saved">Enregistré</span></div>' +
    '<div class="tac"><div>' +
    '<div class="pitch"><span class="ln half"></span><span class="ln circ"></span><span class="ln box-t"></span><span class="ln box-b"></span><span class="ln six-t"></span><span class="ln six-b"></span>' + tokens + '</div>' +
    '<div class="row" style="margin-top:10px"><span class="lbl">Banc (7)</span><span class="sp"></span><span class="small muted">Jusqu’à 5 changements auto, même poste ou poste proche</span></div>' +
    '<div class="bench">' + bench.join('') + '</div>' +
    '<div class="row wrap-r" style="margin-top:12px"><button class="btn pri" data-a="auto">Compo auto</button><label class="row small" style="gap:6px"><input type="checkbox" id="avoid" data-in="avoid"' + (S.ui.avoidRisk ? ' checked' : '') + '> Ménager les joueurs à risque</label></div>' +
    (warn ? '<div class="stack" style="margin-top:12px">' + warn + '</div>' : '') +
    '</div><div class="stack">' +
    '<div class="card"><h3 class="disp">Puissance du onze</h3><div class="powers">' +
    '<div class="pw"><span style="color:var(--att)">Attaque</span>' + gauge(P0.Ra, 100, 'att') + '<b>' + Math.round(P0.a) + '</b></div>' +
    '<div class="pw"><span style="color:var(--def)">Défense</span>' + gauge(P0.Rd, 100, 'def') + '<b>' + Math.round(P0.d) + '</b></div>' +
    '<div class="pw"><span style="color:var(--cre)">Créativité</span>' + gauge(creScore(P0.Rc), 100, 'cre') + '<b>' + Math.round(creScore(P0.Rc)) + '<small>/100</small></b></div>' +
    '</div><p class="fx" style="margin:10px 0 0">Effet de tes choix : attaque <b>×' + fmtN(attMul, 2) + '</b> · solidité défensive <b>×' + fmtN(defMul, 2) + '</b> · respect de la tactique <b>' + tacticRespect(m.tac) + ' %</b> (' + esc(m.ln) + ').</p></div>' +
    '<div class="card">' +
    '<div class="opt"><span class="lbl">Formation · ' + Object.keys(FORMATIONS).length + ' schémas</span>' + ['4', '3', '5'].map(function (d) { return '<div class="fgroup"><span class="small muted">Défense à ' + d + '</span><div class="chips">' + Object.keys(FORMATIONS).filter(function (k) { return k[0] === d; }).map(function (k) { return '<button class="chip" data-a="form" data-v="' + k + '" aria-pressed="' + (tac.f === k) + '">' + k + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>' +
    '<div class="opt"><span class="lbl">Mentalité</span>' + seg('ment', [-2, -1, 0, 1, 2], ['Très déf.', 'Déf.', 'Équilibrée', 'Off.', 'Très off.'], tac.ment || 0) + '<span class="fx">Plus offensif : plus d’attaque, moins de défense. Et inversement.</span></div>' +
    '<div class="opt"><span class="lbl">Style offensif</span>' + chipsSel('off', OFF_STYLES, tac.off || 'possession') + '</div>' +
    '<div class="opt"><span class="lbl">Style défensif</span>' + chipsSel('def', DEF_STYLES, tac.def || 'median') + '</div>' +
    '<div class="opt"><span class="lbl">Rapidité de jeu</span>' + seg('tempo', [1, 2, 3, 4, 5], ['Très lent', 'Lent', 'Normal', 'Rapide', 'Très rap.'], tac.tempo || 3) + '<span class="fx">Plus rapide : plus d’occasions des deux côtés, plus de fautes et d’erreurs.</span></div>' +
    '<div class="opt"><div class="row"><span class="lbl">Liberté créative</span><span class="sp"></span><b class="num" id="freev">' + (tac.free == null ? 50 : tac.free) + ' %</b></div>' +
    '<input type="range" min="0" max="100" step="5" id="free" data-in="free" value="' + (tac.free == null ? 50 : tac.free) + '">' +
    '<div class="gline wide"><span>Créativité du onze</span>' + gauge(creScore(P0.Rc), 100, 'cre') + '<b>' + Math.round(creScore(P0.Rc)) + '</b></div><span class="fx">Très exigeante : un onze noté 90 atteint ≈ 90, un onze à 80 ≈ 40, à 75 ≈ 20. Règle la liberté créative à peu près à ce niveau.</span>' +
    '<div class="row small" id="freefx"><span>Occasions créées <b>+' + Math.max(0, Math.round((fx.cre - 1) * 100)) + ' %</b></span><span class="sp"></span><span>Risque d’erreur <span class="pill ' + errLvl[1] + '">' + errLvl[0] + '</span></span></div>' +
    '<span class="fx">Mal dosée, la liberté créative provoque des erreurs qui offrent des occasions à l’adversaire.</span></div>' +
    '</div></div></div>';
}

// ---------- Page Objectifs ----------
function pageObjectifs(me) {
  var sub = S.ui.sub.objectifs, cc = claimableCount(me);
  var h = '<div class="page-h"><h1 class="disp">Objectifs</h1>' + subtabs('objectifs', [['joueurs', 'Joueurs'], ['club', 'Club'], ['legendes', 'Légendes']]) + '</div>';
  if (sub === 'club') {
    var ss = seasonStats(me), x = objCtx(me);
    h += '<div class="card" style="padding:0">' + CLUB_OBJ.map(function (o) {
      var pr = o.prog(ss, x), done = pr[0] >= pr[1], got = !!S.d.ledger['ob-s' + seasonNo() + '-' + me + '-' + o.id];
      return '<div class="obj" style="grid-template-columns:minmax(0,1.4fr) minmax(120px,1fr) 130px"><div><b>' + o.label + '</b><div class="small muted">Saison ' + seasonNo() + ' · récompense <span class="money">' + fmtM(o.reward) + '</span></div></div>' +
        '<div class="c-prog">' + gauge(pr[0], pr[1], done ? 'ok' : '') + '<span class="small muted num">' + Math.min(pr[0], pr[1]) + ' / ' + pr[1] + '</span></div>' +
        '<div style="text-align:right">' + (got ? '<span class="pill ok">Récupéré</span>' : '<button class="btn sm ' + (done ? 'pri' : '') + '" data-a="claim" data-v="' + o.id + '"' + (done ? '' : ' disabled') + '>Récupérer</button>') + '</div></div>';
    }).join('') + '</div><p class="small muted">Les objectifs club se renouvellent chaque saison et alimentent ton budget transferts.</p>';
    return h;
  }
  if (sub === 'legendes') {
    var c = clubDoc(me), rc = c.rec || {};
    h += '<div class="grid g3">' + ['r', 'o', 'u'].map(function (t, i) {
      var pid = CLUB[me].legends[i], p = PLAYERS[pid], L = LEGEND_TIERS[t];
      var signed = !!(c.legends || {})[t], prog = L.prog(rc), ok = prog.every(function (q) { return q[0] >= q[1]; });
      return '<div class="card legend-card ' + (ok || signed ? '' : 'locked') + '"><span class="lbl">' + L.label + '</span><div class="who">' + rt(p.ovr, 'legend', 'lg') + '<div><div class="disp" style="font-size:22px">' + esc(fullName(p)) + '</div><div class="row small">' + posChips(p) + '<span class="muted">' + POS_NAME[p.pos] + '</span></div></div></div>' +
        '<div class="small"><b>Condition :</b> ' + L.cond + '</div>' + prog.map(function (q) { return '<div class="row small">' + '<div class="sp">' + gauge(q[0], q[1], q[0] >= q[1] ? 'ok' : '') + '</div><span class="num muted">' + q[0] + ' / ' + q[1] + '</span></div>'; }).join('') +
        (signed ? '<span class="pill ok">Dans ton effectif</span>' : '<button class="btn ' + (ok ? 'pri' : '') + '" data-a="legend" data-v="' + t + '"' + (ok ? '' : ' disabled') + '>Faire signer</button>') + '</div>';
    }).join('') + '</div><p class="small muted">Les compteurs de victoires, coupes et titres sont cumulés depuis la création de ton club.</p>';
    return h;
  }
  var sq = sortPlayers(squad(me), 'pos').map(function (p) {
    var o = p.ovr < p.pot ? objectiveFor(p.pos, p.ovr) : null, ob = p.ob || { w: 0, v: 0, m: 0 };
    var cur = o ? (o.multi ? ob.m : ob.v) : 0;
    return { p: p, o: o, ob: ob, cur: cur, ratio: o ? (p.ups >= UPS_PER_SEASON ? -0.5 : cur / o.k) : -1 };
  }).sort(function (a, b) { return b.ratio - a.ratio; });
  h += '<p class="small muted" style="margin-top:0">Chaque objectif réussi fait gagner +1 de note, jusqu’au potentiel, avec un maximum de ' + UPS_PER_SEASON + ' progressions par joueur et par saison : atteindre son potentiel prend plusieurs saisons. Plus la note est haute, plus l’objectif est exigeant. Si la fenêtre de matchs se termine sans succès, une nouvelle tentative démarre.</p>';
  h += '<div class="card" style="padding:0">' + sq.map(function (x) {
    var p = x.p;
    if (!x.o) return '<div class="obj">' + posChips(p) + '<div class="pname"><span class="ln">' + esc(fullName(p)) + '</span><span class="small muted">Potentiel atteint</span></div><div class="c-prog"></div><div class="arrow">' + rt(p.ovr, p.kind, 'sm') + '</div></div>';
    if (p.ups >= UPS_PER_SEASON) return '<button class="obj" style="width:100%;border-left:0;border-right:0;border-top:0;background:transparent;text-align:left" data-a="player" data-pid="' + p.id + '">' + posChips(p) + '<div class="pname"><span class="ln">' + esc(fullName(p)) + '</span><span class="small muted">Plafond de la saison atteint (' + p.ups + '/' + UPS_PER_SEASON + ')</span></div><div class="c-prog"><span class="pill ok">Reprend la saison prochaine</span></div><div class="arrow">' + p.ovr + '<div class="small muted" style="font-weight:600">pot. ' + p.pot + '</div></div></button>';
    var left = x.o.n - x.ob.w;
    var unit = x.o.multi ? 'doublé' + (x.cur > 1 ? 's' : '') : { but: 'but', pd: 'passe déc.', int: 'interception', cs: 'clean sheet' }[x.o.stat] + (x.cur > 1 && x.o.stat !== 'pd' ? 's' : '');
    return '<button class="obj" style="width:100%;border-left:0;border-right:0;border-top:0;background:transparent;text-align:left" data-a="player" data-pid="' + p.id + '">' + posChips(p) +
      '<div class="pname"><span class="ln">' + esc(fullName(p)) + '</span><span class="small muted">' + objectiveText(x.o) + (p.ups ? ' · ' + p.ups + '/' + UPS_PER_SEASON + ' cette saison' : '') + '</span></div>' +
      '<div class="c-prog">' + gauge(x.cur, x.o.k, x.ratio >= 0.66 ? 'ok' : '') + '<span class="small muted num">' + x.cur + ' / ' + x.o.k + ' ' + unit + ' · ' + left + ' match' + (left > 1 ? 's' : '') + ' restant' + (left > 1 ? 's' : '') + '</span></div>' +
      '<div class="arrow">' + p.ovr + ' → <span style="color:var(--ok)">' + (p.ovr + 1) + '</span><div class="small muted" style="font-weight:600">pot. ' + p.pot + '</div></div></button>';
  }).join('') + '</div>';
  return h;
}

// ---------- Page Mercato ----------
var LEDGER_KINDS = { match: 'Matchs', obj: 'Objectifs', transfer: 'Transferts', auction: 'Enchères', pack: 'Packs', cup: 'Coupes', mgr: 'Entraîneur', test: 'Tests' };
function budgetCard(me) {
  var c = clubDoc(me), led = ledgerOf(me), by = {};
  led.forEach(function (l) { by[l.k] = (by[l.k] || 0) + l.amt; });
  var eng = engaged(me);
  return '<div class="card"><div class="row wrap-r" style="align-items:flex-end"><div><span class="lbl">Budget transferts disponible</span><div class="disp money" style="font-size:34px">' + fmtM(available(me)) + '</div></div><span class="sp"></span>' +
    '<div class="small muted bud-r">Total ' + fmtM(budget(me)) + (eng ? ' · engagé en enchères ' + fmtM(eng) : '') + '<br>Départ ' + fmtM(c.budget0) + ' (identique pour tous)</div></div>' +
    '<hr class="sep"><div class="chips">' + Object.keys(LEDGER_KINDS).filter(function (k) { return by[k]; }).map(function (k) { return '<span class="pill neutral">' + LEDGER_KINDS[k] + ' <b class="' + (by[k] >= 0 ? '' : '') + '">' + (by[k] > 0 ? '+' : '') + fmtM(by[k]) + '</b></span>'; }).join('') + (led.length ? '' : '<span class="small muted">Aucun mouvement pour l’instant.</span>') + '</div></div>';
}
function marketList(me) {
  var q = S.ui.mq, txt = q.q.trim().toLowerCase();
  var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var ntxt = norm(txt);
  var out = [];
  Object.keys(S.ownerOf).forEach(function (pid) {
    var cid = S.ownerOf[pid]; if (cid === me) return;
    if (q.live && !isLiveClub(cid)) return;
    var p = P(pid, cid);
    if (q.line !== 'Tous' && LINE[p.pos] !== q.line) return;
    if (q.min && p.ovr < q.min) return;
    if (q.pot && p.pot < q.pot) return;
    if (q.max && p.val > q.max) return;
    if (ntxt && norm(fullName(p) + ' ' + CLUB[cid].name + ' ' + p.pos).indexOf(ntxt) < 0) return;
    out.push(p);
  });
  return sortPlayers(out, q.sort);
}
function pageMercato(me) {
  var sub = S.ui.sub.mercato, pend = pendingActions(me).length;
  var h = '<div class="page-h"><h1 class="disp">Mercato</h1>' + subtabs('mercato', [['chercher', 'Rechercher'], ['offres', 'Mes offres', pend], ['coachs', 'Entraîneurs']]) + '</div>';
  h += budgetCard(me) + '<div style="height:12px"></div>';
  if (sub === 'offres') return h + offersView(me);
  if (sub === 'coachs') return h + coachesView(me);
  var q = S.ui.mq;
  var opt = function (id, vals, cur, lab) {
    return '<label class="stack" style="gap:3px;min-width:110px"><span class="lbl">' + lab + '</span><select class="input" id="' + id + '" data-in="' + id + '" style="padding:7px 10px">' + vals.map(function (v) { return '<option value="' + v[0] + '"' + (String(cur) === String(v[0]) ? ' selected' : '') + '>' + v[1] + '</option>'; }).join('') + '</select></label>';
  };
  var list = marketList(me), shown = list.slice(0, 60);
  h += '<div class="card" style="margin-bottom:12px"><div class="stack">' +
    '<input class="input" id="mq" data-in="mq" type="search" placeholder="Rechercher un joueur, un club…" value="' + esc(q.q) + '" autocomplete="off">' +
    '<div class="chips">' + [['Tous', 'Tous postes'], ['G', 'Gardiens'], ['DEF', 'Défense'], ['MIL', 'Milieu'], ['ATT', 'Attaque']].map(function (l) { return '<button class="chip" data-a="mline" data-v="' + l[0] + '" aria-pressed="' + (q.line === l[0]) + '">' + l[1] + '</button>'; }).join('') +
    '<button class="chip" data-a="mlive" aria-pressed="' + q.live + '">Clubs connectés seulement</button></div>' +
    '<div class="row wrap-r" style="align-items:flex-end">' +
    opt('mmin', [[0, 'Toutes'], [70, '70+'], [75, '75+'], [80, '80+'], [85, '85+'], [88, '88+']], q.min, 'Note') +
    opt('mpot', [[0, 'Tous'], [80, '80+'], [85, '85+'], [88, '88+'], [90, '90+']], q.pot, 'Potentiel') +
    opt('mmax', [[0, 'Sans limite'], [5, '≤ 5 M€'], [15, '≤ 15 M€'], [30, '≤ 30 M€'], [60, '≤ 60 M€'], [100, '≤ 100 M€']], q.max, 'Prix max') +
    opt('msort', [['ovr', 'Note'], ['pot', 'Potentiel'], ['val', 'Prix décroissant'], ['valAsc', 'Prix croissant'], ['age', 'Âge']], q.sort, 'Trier par') +
    '</div></div></div>';
  h += '<div id="mres">' + marketResults(list, shown) + '</div>';
  return h;
}
function marketResults(list, shown) {
  if (!list.length) return '<div class="empty"><b>Aucun joueur ne correspond.</b>Élargis les filtres ou change ta recherche.</div>';
  return '<div class="small muted" style="margin-bottom:6px">' + list.length + ' joueur' + (list.length > 1 ? 's' : '') + (list.length > shown.length ? ' · ' + shown.length + ' affichés, affine la recherche pour voir les autres' : '') + '. Seuls les clubs avec un propriétaire connecté acceptent des offres.</div>' +
    '<div class="plist">' + plistHead(true) + shown.map(function (p) { return playerRow(p, { club: true }); }).join('') + '</div>';
}
function offerLine(o, me, pre) {
  pre = pre || 'ctr-';
  var p = o.kind === 'coach' ? null : PLAYERS[o.pid], g = o.give ? PLAYERS[o.give] : null, mg = o.kind === 'coach' ? MANAGERS[o.pid] : null;
  var incoming = o.to === me, other = incoming ? o.from : o.to;
  var myTurn = o.st === 'open' && ((incoming && o.turn === 'to') || (!incoming && o.turn === 'from'));
  var stLabel = { open: myTurn ? 'À toi de répondre' : 'En attente de ' + CLUB[other].name, done: 'Transfert conclu', refused: 'Refusée', cancelled: 'Annulée', failed: 'Échec' }[o.st];
  var stCls = { open: myTurn ? 'warn' : 'neutral', done: 'ok', refused: 'bad', cancelled: 'neutral', failed: 'bad' }[o.st];
  var deal = mg ? 'Entraîneur <b>' + esc(mg.fn + ' ' + mg.ln) + '</b> · ' + esc(CLUB[o.from].name) + ' propose <span class="money">' + fmtM(o.amt) + '</span> à ' + esc(CLUB[o.to].name)
    : o.kind === 'echange'
    ? '<b>' + esc(fullName(p)) + '</b> (' + esc(CLUB[o.to].name) + ') contre <b>' + esc(fullName(g)) + '</b> (' + esc(CLUB[o.from].name) + ')' + (o.amt ? ' + <span class="money">' + fmtM(o.amt) + '</span>' : '')
    : '<b>' + esc(fullName(p)) + '</b> · ' + esc(CLUB[o.from].name) + ' propose <span class="money">' + fmtM(o.amt) + '</span> à ' + esc(CLUB[o.to].name);
  var last = o.log && o.log[o.log.length - 1];
  var h = '<div class="offer"><div class="row wrap-r"><span class="pill ' + stCls + '">' + stLabel + '</span><span class="small muted">' + (incoming ? 'Reçue de ' : 'Envoyée à ') + esc(CLUB[other].name) + ' · ' + esc(clubLabel(other)) + '</span><span class="sp"></span><span class="small muted">' + (last ? fmtWhen(last.t) : '') + '</span></div>' +
    '<div class="deal">' + crest(o.to, 'sm') + '<span>' + deal + '</span></div>';
  if (o.log && o.log.length > 1) h += '<div class="small muted">' + o.log.map(function (l) { return (l.by === me ? 'Toi' : CLUB[l.by] ? CLUB[l.by].short : '') + ' : ' + l.act + (l.amt != null ? ' ' + fmtM(l.amt) : ''); }).join(' → ') + '</div>';
  if (o.why) h += '<div class="small" style="color:var(--bad)">' + esc(o.why) + '</div>';
  if (myTurn) {
    h += '<div class="row wrap-r"><button class="btn pri sm" data-a="resp" data-id="' + o.id + '" data-v="accept">Accepter ' + fmtM(o.amt) + '</button><button class="btn sm danger" data-a="resp" data-id="' + o.id + '" data-v="refuse">Refuser</button>' +
      '<span class="row" style="gap:6px"><input class="input" style="width:110px;padding:6px 8px" type="number" min="0" step="0.5" id="' + pre + o.id + '" data-keep="ctr-' + o.id + '" value="' + esc(kept('ctr-' + o.id, o.amt)) + '" aria-label="Montant de la contre-offre en M€"><button class="btn sm" data-a="resp" data-id="' + o.id + '" data-inp="' + pre + o.id + '" data-v="counter">Contre-offre</button></span></div>';
  } else if (o.st === 'open' && o.from === me) {
    h += '<div><button class="btn sm" data-a="resp" data-id="' + o.id + '" data-v="cancel">Annuler l’offre</button></div>';
  }
  return h + '</div>';
}
function offersView(me) {
  var all = Object.keys(S.d.offers).map(function (k) { return S.d.offers[k]; }).filter(function (o) { return o.from === me || o.to === me; }).sort(function (a, b) { return b.upd - a.upd; });
  var act = all.filter(function (o) { return o.st === 'open'; }), old = all.filter(function (o) { return o.st !== 'open'; }).slice(0, 12);
  if (!all.length) return '<div class="empty"><b>Aucune offre pour l’instant.</b>Cherche un joueur dans l’onglet Rechercher, puis fais une offre à son club. Le club reçoit une notification et peut accepter, refuser ou faire une contre-offre.</div>';
  return (act.length ? '<h3 class="disp">En cours</h3><div class="card" style="padding:0;margin-bottom:12px">' + act.map(function (o) { return offerLine(o, me); }).join('') + '</div>' : '') +
    (old.length ? '<h3 class="disp">Historique</h3><div class="card" style="padding:0">' + old.map(function (o) { return offerLine(o, me); }).join('') + '</div>' : '');
}
function coachesView(me) {
  var cur = mgrOf(me);
  var list = Object.keys(MANAGERS).filter(function (id) { return !managerTaken(id); }).map(function (id) { return MANAGERS[id]; }).sort(function (a, b) { return b.tac - a.tac; });
  var others = Object.keys(S.d.clubs).filter(function (cid) { return cid !== me && isLiveClub(cid) && clubDoc(cid).mgr !== 'm-int'; }).map(function (cid) { return { cid: cid, m: MANAGERS[clubDoc(cid).mgr], tac: clubDoc(cid).mgrTac || MANAGERS[clubDoc(cid).mgr].tac }; }).sort(function (a, b) { return b.tac - a.tac; });
  var othersH = '<h3 class="disp" style="margin-top:16px">Entraîneurs des autres clubs connectés</h3>' + (others.length ? '<div class="card" style="padding:0">' + others.map(function (x) {
    return '<div class="offer"><div class="row wrap-r">' + crest(x.cid, 'sm') + '<div><b>' + esc(x.m.fn + ' ' + x.m.ln) + '</b><div class="small muted">' + esc(CLUB[x.cid].name) + ' · ' + esc(clubLabel(x.cid)) + '</div></div><span class="sp"></span><span class="pill neutral">Tactique ' + x.tac + '</span><span class="pill neutral">Pot. ' + x.m.pot + '</span><span class="money">' + fmtM(x.m.val) + '</span><button class="btn sm" data-a="coach-offer" data-v="' + x.cid + '">Faire une offre</button></div></div>';
  }).join('') + '</div><p class="small muted">S’il accepte, son club reçoit l’argent et passe sous la direction d’un entraîneur adjoint (note 65) le temps d’en engager un autre. Ton ancien entraîneur repart sur le marché.</p>' : '<p class="small muted">Aucun autre club connecté pour l’instant.</p>');
  var interim = clubDoc(me).mgr === 'm-int';
  return (interim ? '<div class="warnbox" style="margin-bottom:12px">Ton entraîneur est parti : un adjoint assure l’intérim (respect de la tactique ' + tacticRespect(cur.tac) + ' %). Engage un nouvel entraîneur ci-dessous.</div>' : '') + '<div class="card" style="margin-bottom:12px"><span class="lbl">Ton entraîneur</span><div class="row wrap-r"><b class="disp" style="font-size:22px">' + esc(cur.fn + ' ' + cur.ln) + '</b><span class="pill neutral">Tactique ' + cur.tac + '</span><span class="pill neutral">Potentiel ' + cur.pot + '</span><span class="sp"></span><span class="small muted">+1 en tactique toutes les 5 victoires, jusqu’au potentiel</span></div></div>' +
    (list.length ? '<div class="card" style="padding:0">' + list.map(function (m) {
      return '<div class="offer"><div class="row wrap-r"><div class="mgr" style="grid-template-columns:auto 1fr"><div class="face" style="width:40px;height:40px;font-size:16px">' + esc(m.fn[0] + m.ln[0]) + '</div><div><b>' + esc(m.fn + ' ' + m.ln) + '</b><div class="small muted">' + (m.club ? 'Ex-' + esc(CLUB[m.club].name) : 'Libre (dans le jeu)') + ' · respect de la tactique ' + tacticRespect(m.tac) + ' %</div></div></div><span class="sp"></span>' +
        '<span class="pill neutral">Tactique ' + m.tac + '</span><span class="pill neutral">Pot. ' + m.pot + '</span><span class="money">' + fmtM(m.val) + '</span><button class="btn sm pri" data-a="buy-mgr" data-v="' + m.id + '"' + (available(me) >= m.val ? '' : ' disabled') + '>Engager</button></div></div>';
    }).join('') + '</div>' : '<div class="empty">Aucun entraîneur libre.</div>') + othersH;
}

// ---------- Page Boutique ----------
function lotCard(lot, me) {
  var p = P(lot.pid), h = lotHigh(lot), live = lotLive(lot);
  var next = h ? h.a + Math.max(1, Math.round(h.a * 0.05)) : lot.min;
  var lead = h && h.c === me;
  var kindLabel = { vendredi: 'Enchère du vendredi', dimanche: 'Enchère du dimanche', surprise: 'Enchère surprise', test: 'Enchère test' }[lot.kind] || 'Enchère';
  return '<div class="card lot"><div>' + rt(p.ovr, p.kind, 'lg') + '</div><div class="stack" style="gap:8px">' +
    '<div class="row wrap-r"><span class="lbl">' + kindLabel + '</span><span class="sp"></span>' + (live ? '<span class="pill warn">Fin dans <span class="count" data-cd="' + lot.end + '"></span></span>' : '<span class="pill neutral">Terminée</span>') + '</div>' +
    '<div><div class="disp" style="font-size:22px">' + esc(fullName(p)) + '</div><div class="row small">' + posChips(p) + '<span class="muted">' + p.age + ' ans · pot. ' + p.pot + ' · valeur ' + fmtM(p.val) + (p.from ? ' · ' + esc(p.from) : '') + '</span></div></div>' +
    '<div class="row wrap-r"><div><span class="lbl">' + (h ? 'Meilleure offre' : 'Mise de départ') + '</span><div class="bid money">' + fmtM(h ? h.a : lot.min) + '</div><div class="small ' + (lead ? '' : 'muted') + '" style="' + (lead ? 'color:var(--ok);font-weight:700' : '') + '">' + (h ? (lead ? 'Tu es en tête' : 'En tête : ' + esc(CLUB[h.c].name)) : 'Aucune offre') + '</div></div><span class="sp"></span>' +
    (live ? '<div class="row" style="gap:6px"><input class="input" type="number" min="' + next + '" step="0.5" id="bid-' + lot.id + '" data-keep="bid-' + lot.id + '" value="' + esc(kept('bid-' + lot.id, next)) + '" style="width:100px" aria-label="Montant de l’enchère en M€"><button class="btn pri" data-a="bid" data-v="' + lot.id + '"' + (lead ? ' disabled' : '') + '>Enchérir</button></div>' : '') +
    '</div></div></div>';
}
function pageBoutique(me) {
  var lots = Object.keys(S.d.auctions).map(function (k) { return S.d.auctions[k]; });
  var live = lots.filter(function (l) { return lotLive(l); }).sort(function (a, b) { return a.end - b.end; });
  var done = lots.filter(function (l) { return l.settled; }).sort(function (a, b) { return b.end - a.end; }).slice(0, 8);
  var nx = nextAuctionTimes(Date.now());
  var used = packsUsed(me), pool = CLUB[me].pack;
  var h = '<div class="page-h"><h1 class="disp">Boutique</h1><span class="small muted">Budget disponible <b class="money">' + fmtM(available(me)) + '</b></span></div>';
  h += '<h3 class="disp">Enchères</h3>';
  h += live.length ? '<div class="grid g2" style="margin-bottom:12px">' + live.map(function (l) { return lotCard(l, me); }).join('') + '</div>'
    : '<div class="empty" style="margin-bottom:12px"><b>Pas d’enchère en cours.</b>Prochaines : ' + nx.map(function (n) { var l = fmtWhen(n.t); if (/^(demain|aujourd)/.test(l)) l += ' (' + n.kind + ')'; return l + ', dans <span class="count" data-cd="' + n.t + '"></span>'; }).join(' · ') + '. Une enchère surprise de 2 h tombe aussi une fois par semaine, un jour au hasard à 18h.</div>';
  h += '<p class="small muted" style="margin-top:-4px">Les joueurs viennent d’une base de joueurs hors des clubs du jeu. Le montant le plus élevé à la clôture l’emporte. Tes mises en tête sont réservées sur ton budget.</p>';
  h += '<div class="grid g2" style="margin-top:12px"><div class="card"><div class="row">' + crest(me, 'lg') + '<div><span class="lbl">Pack club</span><div class="disp" style="font-size:24px">Anciens de ' + esc(CLUB[me].name) + '</div><div class="small muted">12 anciens du club, 3 par rareté : un au hasard.</div></div></div>' +
    '<div class="rarg">' + PACK_ODDS.map(function (o) {
      return '<div class="rar ' + o[0] + '"><div class="row"><b>' + RARITY[o[0]] + '</b><span class="sp"></span><b class="num">' + o[1] + ' %</b></div>' +
        pool.filter(function (pid) { return PLAYERS[pid].rarity === o[0]; }).map(function (pid) { var p = PLAYERS[pid]; return '<div class="rp' + (S.ownerOf[pid] ? ' got' : '') + '"><span>' + esc(shortName(p)) + '</span><b class="num">' + p.ovr + '</b></div>'; }).join('') + '</div>';
    }).join('') + '</div>' +
    '<div class="row" style="margin-top:12px"><span class="money disp" style="font-size:24px">' + fmtM(PACK_PRICE) + '</span><span class="small muted">' + (PACK_MAX - used) + ' / ' + PACK_MAX + ' restants cette saison</span><span class="sp"></span><button class="btn pri" data-a="pack"' + (used < PACK_MAX ? '' : ' disabled') + '>Voir les chances et ouvrir</button></div></div>' +
    '<div class="card"><h3 class="disp">Dernières enchères</h3>' + (done.length ? done.map(function (l) {
      var p = PLAYERS[l.pid];
      return '<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)">' + rt(P(l.pid).ovr, p.kind, 'sm') + '<div class="pname sp"><span class="ln">' + esc(fullName(p)) + '</span><span class="small muted">' + (l.winner ? 'Remportée par ' + esc(CLUB[l.winner].name) : 'Aucune offre') + '</span></div>' + (l.winner ? '<span class="money">' + fmtM(l.price) + '</span>' : '') + '</div>';
    }).join('') : '<p class="small muted">Aucune enchère terminée.</p>') + '</div></div>';
  return h;
}

// ---------- Page Compétitions ----------
function fixtureRow(h, a, r, label) {
  var click = r && r.mid;
  return '<' + (click ? 'button' : 'div') + ' class="fixture ' + (click ? 'click' : '') + '"' + (click ? ' data-a="match" data-mid="' + r.mid + '"' : '') + '>' +
    '<span class="h"><b>' + esc(CLUB[h].name) + '</b>' + crest(h, 'sm') + '</span>' +
    '<span class="sc">' + (r ? r.hg + ' – ' + r.ag : (label || 'vs')) + '</span>' +
    '<span class="a">' + crest(a, 'sm') + '<b>' + esc(CLUB[a].name) + '</b></span></' + (click ? 'button' : 'div') + '>';
}
function leagueView(me) {
  var g = game(), L = leagueDoc();
  var h = '';
  var info = '<p class="small muted">1 match par jour à 20h (heure de Paris), chaque club rencontre les autres 4 fois. Gains : victoire <span class="money">' + fmtM(REWARD.w) + '</span>, nul <span class="money">' + fmtM(REWARD.d) + '</span>, défaite <span class="money">' + fmtM(REWARD.l) + '</span>. Domicile ×1,10, extérieur ×0,95. Chaque club subit un « jour sans » (×0,90) et vit un « état de grâce » (×1,20) à des journées tirées au sort.</p>';
  if (g.phase === 'inscriptions') {
    var regd = registeredClubs(L), mine = regd.indexOf(me) >= 0;
    h += '<div class="card"><div class="row wrap-r"><div><span class="lbl">Saison ' + seasonNo() + '</span><h2 class="disp" style="margin:0">Inscriptions ouvertes</h2></div><span class="sp"></span>' +
      (mine ? '<button class="btn" data-a="lg-unreg">Retirer mon inscription</button>' : '<button class="btn pri" data-a="lg-reg">Inscrire mon club</button>') +
      (S.isOwner ? '<button class="btn dark" data-a="lg-launch"' + (regd.length >= 2 ? '' : ' disabled') + '>Lancer la saison</button>' : '') + '</div>' + info +
      '<div class="stack" style="gap:6px">' + (regd.length ? regd.map(function (c) { return '<div class="row">' + crest(c, 'sm') + '<b>' + esc(CLUB[c].name) + '</b><span class="muted small">' + esc(clubLabel(c)) + ' · note ' + fmtN(clubNote(c)) + '</span></div>'; }).join('') : '<span class="muted small">Aucun club inscrit.</span>') + '</div>' +
      (S.isOwner ? '' : '<p class="small muted">Le propriétaire de la partie lance la saison quand tout le monde est inscrit.</p>') + '</div>';
    return h;
  }
  if (!L || !L.fx) return '<div class="empty">Aucune ligue.</div>';
  var tbl = leagueTable(L);
  if (g.phase === 'terminee' && L.champion) {
    h += '<div class="card" style="margin-bottom:12px"><div class="row wrap-r">' + crest(L.champion, 'lg') + '<div><span class="lbl">Champion saison ' + L.season + '</span><div class="disp" style="font-size:28px">' + esc(CLUB[L.champion].name) + '</div><div class="small muted">' + esc(clubLabel(L.champion)) + '</div></div><span class="sp"></span>' + (S.isOwner ? '<button class="btn pri" data-a="lg-new">Ouvrir la saison ' + (L.season + 1) + '</button>' : '') + '</div></div>';
  }
  h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Club</th><th>J</th><th>G</th><th>N</th><th>P</th><th>BP</th><th>BC</th><th>Diff</th><th>Pts</th><th>Forme</th></tr></thead><tbody>' +
    tbl.map(function (r, i) {
      return '<tr class="' + (r.c === me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td><span class="row">' + crest(r.c, 'sm') + '<b>' + esc(CLUB[r.c].name) + '</b><span class="small muted">' + esc(clubLabel(r.c)) + '</span></span></td><td>' + r.j + '</td><td>' + r.g + '</td><td>' + r.n + '</td><td>' + r.p + '</td><td>' + r.bp + '</td><td>' + r.bc + '</td><td>' + (r.bp - r.bc > 0 ? '+' : '') + (r.bp - r.bc) + '</td><td class="pts">' + r.pts + '</td><td><span class="form">' + r.form.slice(-5).map(function (f) { return '<i class="' + f + '">' + f + '</i>'; }).join('') + '</span></td></tr>';
    }).join('') + '</tbody></table></div>';
  var played = Object.keys(L.res || {}).filter(function (k) { return L.res[k].done; }).map(Number);
  var lastMd = played.length ? Math.max.apply(null, played) : -1;
  var nextMd = lastMd + 1 < L.fx.length ? lastMd + 1 : -1;
  h += '<div class="grid g2" style="margin-top:12px">';
  if (lastMd >= 0) h += '<div class="card" style="padding:0"><div style="padding:12px 14px 4px"><span class="lbl">Journée ' + (lastMd + 1) + ' · résultats</span></div>' + L.fx[lastMd].map(function (pr) { return fixtureRow(pr[0], pr[1], L.res[lastMd].m[pr[0] + '_' + pr[1]]); }).join('') + '</div>';
  if (nextMd >= 0) h += '<div class="card" style="padding:0"><div style="padding:12px 14px 4px"><span class="lbl">Journée ' + (nextMd + 1) + ' · ' + fmtWhen(matchdayTime(L, nextMd)) + '</span></div>' + L.fx[nextMd].map(function (pr) { return fixtureRow(pr[0], pr[1], null, '20:00'); }).join('') + '</div>';
  h += '</div>' + info;
  return h;
}
function cupView(me) {
  var cup = currentCup(), b = cup.band, doc = cup.doc;
  var ent = doc ? Object.keys(doc.ent || {}).filter(function (k) { return doc.ent[k]; }) : [];
  var mine = ent.indexOf(me) >= 0, note = clubNote(me), elig = note >= b.min && note <= b.max;
  var pz = cupPrizes(b, Math.max(ent.length, 1));
  var h = '<div class="card"><div class="row wrap-r"><div><span class="lbl">Tournoi du samedi · ' + fmtWhen(parisTime(cup.date, 15)).replace(/ 15h$/, '') + '</span><h2 class="disp" style="margin:0">' + b.name + '</h2><div class="small muted">Réservée aux clubs notés de ' + b.min + ' à ' + b.max + ' · ta note : <b style="color:' + (elig ? 'var(--ok)' : 'var(--bad)') + '">' + fmtN(note) + '</b></div></div><span class="sp"></span>' +
    (!doc || doc.st === 'open' ? (mine ? '<button class="btn" data-a="cup-unreg">Se désinscrire</button>' : '<button class="btn pri" data-a="cup-reg"' + (elig && ent.length < 8 ? '' : ' disabled') + '>S’inscrire · ' + fmtM(b.fee) + '</button>') : '') + '</div>' +
    '<div class="grid g4" style="margin-top:12px;gap:8px">' + kpi('Inscrits', ent.length, '/ 8') + kpi('Droit d’entrée', fmtN(b.fee), 'M€') + kpi('Prime vainqueur', fmtN(pz.w, 0), 'M€') + kpi('Prime finaliste', fmtN(pz.f, 0), 'M€') + '</div>' +
    '<p class="small muted">Demi-finalistes : ' + fmtM(pz.s) + ' chacun. Les primes du vainqueur et du finaliste grossissent avec le nombre d’inscrits (50 % et 25 % des droits d’entrée). Élimination directe, tirage au sort. Quarts à 15h00, demies à 15h15, finale à 15h30. Terrain neutre ; en cas d’égalité, tirs au but. Clôture des inscriptions au tirage, samedi 15h. Les tranches de note changent chaque semaine (Espoirs, Challenger, Élite).</p>';
  if (ent.length) h += '<div class="chips">' + ent.map(function (c) { return '<span class="pill neutral">' + crest(c, 'sm') + esc(CLUB[c].name) + '</span>'; }).join('') + '</div>';
  h += '</div>';
  if (doc && doc.br) h += bracketView(doc);
  var past = Object.keys(S.d.cups).map(function (k) { return S.d.cups[k]; }).filter(function (c) { return c.id !== cup.id && c.st === 'done'; }).sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 3);
  if (past.length) h += '<h3 class="disp" style="margin-top:16px">Coupes précédentes</h3>' + past.map(function (c) { return '<div class="card" style="margin-bottom:8px"><div class="row">' + crest(c.w, 'sm') + '<b>' + esc(CLUB[c.w].name) + '</b><span class="muted small">remporte la ' + CUP_BANDS[c.band].name + ' du ' + fmtWhen(parisTime(c.date, 12)).replace(/ 12h$/, '') + '</span></div></div>'; }).join('');
  return h;
}
function bracketView(doc) {
  var rounds = doc.br.length === 8 ? ['qf', 'sf', 'f'] : doc.br.length === 4 ? ['sf', 'f'] : ['f'];
  var col = function (rd) {
    var ms = doc.r && doc.r[rd];
    if (!ms) {
      if (rd === rounds[0]) { ms = []; for (var i = 0; i < doc.br.length; i += 2) ms.push({ a: doc.br[i], b: doc.br[i + 1] }); }
      else return '<div><span class="lbl">' + ROUND_NAME[rd] + '</span><p class="small muted">' + cupTimeLabel(rd) + '</p></div>';
    }
    return '<div><span class="lbl">' + ROUND_NAME[rd] + ' · ' + cupTimeLabel(rd) + '</span><div style="margin-top:6px">' + ms.map(function (m) {
      var line = function (c, s, pk) { return '<div class="' + (m.w && m.w === c ? 'w' : '') + '">' + (c ? crest(c, 'sm') + esc(CLUB[c].short) : '<span class="muted">Exempt</span>') + '<span class="s">' + (s != null ? s + (pk != null ? ' (' + pk + ')' : '') : '') + '</span></div>'; };
      var inner = line(m.a, m.sa, m.pa) + line(m.b, m.sb, m.pb);
      return m.mid ? '<button class="bm" style="width:100%;padding:0;text-align:left" data-a="match" data-mid="' + m.mid + '">' + inner + '</button>' : '<div class="bm">' + inner + '</div>';
    }).join('') + '</div></div>';
  };
  return '<div class="card" style="margin-top:12px"><div class="bracket">' + rounds.map(col).join('') + '</div>' + (doc.w ? '<p><b>Vainqueur : ' + esc(CLUB[doc.w].name) + '</b></p>' : '') + '</div>';
}
function myMatches(me) {
  var out = [];
  Object.keys(S.d.league).forEach(function (k) {
    var L = S.d.league[k]; if (!L.res) return;
    Object.keys(L.res).forEach(function (md) {
      var m = L.res[md].m || {};
      Object.keys(m).forEach(function (key) {
        var ab = key.split('_'); if (ab[0] !== me && ab[1] !== me) return;
        out.push({ t: L.res[md].t || 0, h: ab[0], a: ab[1], r: m[key], label: 'Ligue S' + L.season + ' · J' + (+md + 1) });
      });
    });
  });
  Object.keys(S.d.cups).forEach(function (k) {
    var c = S.d.cups[k]; if (!c.r) return;
    Object.keys(c.r).forEach(function (rd) {
      (c.r[rd] || []).forEach(function (m) {
        if (!m.mid || (m.a !== me && m.b !== me)) return;
        out.push({ t: parisTime(c.date, CUP_TIMES[rd][0], CUP_TIMES[rd][1]), h: m.a, a: m.b, r: { hg: m.sa, ag: m.sb, mid: m.mid }, label: CUP_BANDS[c.band].name + ' · ' + ROUND_NAME[rd] });
      });
    });
  });
  return out.sort(function (a, b) { return b.t - a.t; });
}
function pageCompetitions(me) {
  var sub = S.ui.sub.competitions;
  var h = '<div class="page-h"><h1 class="disp">Compétitions</h1>' + subtabs('competitions', [['ligue', 'Ligue'], ['coupe', 'Coupe du samedi'], ['matchs', 'Mes matchs']]) + '</div>';
  if (sub === 'coupe') h += cupView(me);
  else if (sub === 'matchs') {
    var ms = myMatches(me);
    h += ms.length ? '<div class="card" style="padding:0">' + ms.map(function (m) { return '<div style="padding:8px 14px 0" class="lbl">' + esc(m.label) + '</div>' + fixtureRow(m.h, m.a, m.r); }).join('') + '</div>' : '<div class="empty"><b>Aucun match joué.</b>Inscris-toi à la ligue ou à la coupe du samedi.</div>';
  } else h += leagueView(me);
  if (S.isOwner) h += testTools();
  return h;
}
function testTools() {
  var g = game();
  return '<details class="tools"' + (S.ui.toolsOpen ? ' open' : '') + ' data-a="tools"><summary>Outils de test (visibles par le propriétaire de la partie)</summary>' +
    '<p class="small muted">Pour essayer le jeu sans attendre 20h ni d’autres joueurs. Les clubs IA répondent aux offres et participent aux enchères.</p><div class="chips">' +
    '<button class="btn sm" data-a="t-bots">Ajouter 5 clubs IA</button>' +
    (g.phase === 'inscriptions' ? '<button class="btn sm" data-a="lg-launch">Lancer la saison</button>' : '') +
    (g.phase === 'en_cours' ? '<button class="btn sm" data-a="t-next">Jouer la prochaine journée maintenant</button>' : '') +
    '<button class="btn sm" data-a="t-botscup">Inscrire les IA à la coupe</button>' +
    '<button class="btn sm" data-a="t-cup">Jouer la coupe maintenant</button>' +
    '<button class="btn sm" data-a="t-auction">Lancer une enchère test (10 min)</button>' +
    '<button class="btn sm" data-a="t-close">Clôturer les enchères</button>' +
    '<button class="btn sm" data-a="t-money">+50 M€</button>' +
    '<button class="btn sm danger" data-a="t-reset">Réinitialiser la partie</button>' +
    '</div></details>';
}

function renderLegacy() {
  return '<div class="onb"><div class="hero"><span class="lbl">Carrière Foot · mise à jour</span><h1 class="disp">Nouvelle base de joueurs</h1>' +
    '<p class="lead">Nouveautés : prix des joueurs recalculés selon leur note, deux postes par joueur, packs club de 12 joueurs, même budget de départ (150 M€) pour tous. La partie en cours utilise l’ancienne base : il faut la réinitialiser pour repartir proprement. Clubs, budgets, ligue, coupes, offres et enchères seront effacés.</p></div>' +
    (S.isOwner ? '<div class="card" style="max-width:560px"><div class="row wrap-r"><span class="small muted">Chaque coach devra reprendre un club.</span><span class="sp"></span><button class="btn pri" data-a="reset-world">Repartir sur la nouvelle base</button></div></div>'
      : '<div class="warnbox" style="max-width:560px">Le propriétaire de la partie doit lancer la réinitialisation. Reviens dans un moment.</div>') + '</div>';
}

// ---------- Création de compte / choix du club ----------
function renderOnboarding() {
  var o = S.ui.onb;
  var h = '<div class="onb"><div class="hero"><span class="lbl">Carrière Foot · multijoueur</span>';
  if (!S.canWrite) h += '<div class="warnbox" style="margin:12px 0">Tu peux regarder la partie, mais pas encore jouer. Demande au propriétaire de t’inviter comme Éditeur.</div>';
  if (o.step === 1) {
    return h + '<h1 class="disp">Crée ton compte de coach</h1><p class="lead">Choisis un pseudo, prends un club parmi les 5 grands championnats et les grands clubs d’ailleurs, puis affronte les autres coachs connectés.</p></div>' +
      '<div class="card" style="max-width:520px"><label class="stack" for="pseudo" style="gap:6px"><span class="lbl">Pseudo</span><input class="input" id="pseudo" data-in="pseudo" maxlength="24" placeholder="Ex. Nathan" value="' + esc(o.pseudo) + '" autocomplete="nickname"></label>' +
      '<div class="row" style="margin-top:12px"><span class="small muted">' + (Store.mode === 'fb' ? 'Connecté avec ' + esc(S.email || 'ton compte Google') + ' · <button class="lnk" data-a="logout">changer de compte</button>' : Store.mode === 'db' ? 'Ton compte est lié à ton identifiant claude.ai.' : (window.FIREBASE_CONFIG ? 'Firebase n’est pas encore configuré (fichier js/firebase-config.js) : mode solo, la partie reste dans ce navigateur.' : 'Mode solo : la partie est enregistrée dans ce navigateur.')) + '</span><span class="sp"></span><button class="btn pri" data-a="onb-next"' + (o.pseudo.trim().length >= 2 ? '' : ' disabled') + '>Continuer</button></div></div></div>';
  }
  var clubs = CLUBS.filter(function (c) { return c.lg === o.lg; });
  var sel = o.club ? CLUB[o.club] : null;
  h += '<h1 class="disp">Choisis ton club, ' + esc(o.pseudo) + '</h1><p class="lead">La note club est la moyenne des notes de l’effectif. Tous les clubs démarrent avec le même budget : <b class="money">' + fmtM(START_BUDGET[5]) + '</b>.</p></div>' +
    '<div class="chips" style="margin-bottom:12px">' + LEAGUES.map(function (l) { return '<button class="chip" data-a="onb-lg" data-v="' + l.id + '" aria-pressed="' + (o.lg === l.id) + '">' + l.name + '</button>'; }).join('') + '</div>' +
    '<div class="cgrid">' + clubs.map(function (c) {
      var taken = clubDoc(c.id) && clubDoc(c.id).owner;
      return '<button class="ctile" data-a="onb-club" data-v="' + c.id + '" aria-pressed="' + (o.club === c.id) + '"' + (taken ? ' disabled' : '') + '>' + crest(c.id) + '<span style="min-width:0"><b>' + esc(c.name) + '</b><span class="small muted">' + (taken ? 'Pris par ' + esc(clubLabel(c.id)) : 'Entraîneur ' + esc(MANAGERS[c.mgr].ln)) + '</span></span>' + rt(Math.round(clubNoteStatic(c.id)), null, 'sm') + '</button>';
    }).join('') + '</div>';
  if (sel) {
    var top = sel.squad.map(function (pid) { return PLAYERS[pid]; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 5);
    h += '<div class="card" style="margin-top:14px"><div class="row wrap-r">' + crest(sel.id, 'lg') + '<div><span class="lbl">' + LEAGUES.filter(function (l) { return l.id === sel.lg; })[0].name + '</span><div class="disp" style="font-size:26px">' + esc(sel.name) + '</div><div class="small muted">Stars : ' + top.map(function (p) { return esc(shortName(p)) + ' ' + p.ovr; }).join(' · ') + '</div></div><span class="sp"></span><button class="btn pri" data-a="onb-sign"' + (S.canWrite ? '' : ' disabled') + '>Prendre les commandes</button></div></div>';
  }
  return h + '<p class="small muted" style="margin-top:16px">Effectifs 2026-27 : composition, âges et entraîneurs d’après fussballdaten.de (octobre 2026) ; notes EA SPORTS FC 27 d’après fcratings.com. Potentiels estimés selon l’âge. Prix calculés selon la note : meilleur attaquant 200 M€, milieu 175 M€, défenseur 150 M€, gardien 125 M€.</p></div>';
}

// ---------- Feuilles (fiche joueur, choix de poste, notifications…) ----------
function openSheet(kind, args) { S.sheet = { kind: kind, args: args || {} }; renderSheet(); }
function closeSheet() {
  if (S.view && S.view.timer) clearInterval(S.view.timer);
  S.view = null; S.sheet = null;
  var el = document.getElementById('sheet'); el.hidden = true; el.innerHTML = '';
}
function renderSheet() {
  var el = document.getElementById('sheet'); if (!S.sheet) { el.hidden = true; return; }
  var k = S.sheet.kind, a = S.sheet.args, body = '';
  var ae = document.activeElement, fid = ae && el.contains(ae) ? ae.id : null, sel = null;
  try { if (fid && ae.selectionStart != null) sel = [ae.selectionStart, ae.selectionEnd]; } catch (e) { }
  if (k === 'player') body = sheetPlayer(a);
  else if (k === 'slot') body = sheetSlot(a);
  else if (k === 'notifs') body = sheetNotifs();
  else if (k === 'coach') body = sheetCoach(a);
  else if (k === 'match') body = '<div id="mview">Chargement du match…</div>';
  else if (k === 'pack') body = a.html;
  el.className = 'sheet' + (k === 'match' ? ' wide' : '');
  el.innerHTML = '<div class="scrim" data-a="close"></div><div class="panel" role="dialog" aria-modal="true"><button class="x" data-a="close" aria-label="Fermer">✕</button>' + body + '</div>';
  el.hidden = false;
  if (fid) { var f = document.getElementById(fid); if (f) { f.focus(); try { if (sel) f.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
}
function sheetPlayer(a) {
  var me = myClubId(), cid = S.ownerOf[a.pid] || null, p = P(a.pid, cid), s = subRatings(p.ovr, p.pos);
  var mine = cid === me, live = cid && isLiveClub(cid);
  var risk = injuryRisk(p, p.st);
  var st = p.s || {};
  var h = '<div class="phead">' + rt(p.ovr, p.kind, 'lg') + '<div style="min-width:0"><div class="small muted">' + esc(p.fn || '') + '</div><h2 class="disp">' + esc(p.ln) + '</h2><div class="row small wrap-r">' + posChips(p) + '<span class="muted">' + posNames(p) + '</span>' + (cid ? '<span class="row" style="gap:5px">' + crest(cid, 'sm') + esc(CLUB[cid].name) + '</span>' : '<span class="muted">Sans club</span>') + '</div></div></div>';
  h += '<div class="grid g4" style="gap:8px">' + kpi('Potentiel', p.pot, '') + kpi('Prix marché', fmtN(p.val), 'M€') + kpi('Âge', p.age || '—', p.age ? 'ans' : '') + kpi('Note de base', PLAYERS[p.id].ovr, '') + '</div>';
  h += '<div class="card" style="margin-top:10px"><div class="stack" style="gap:8px">' +
    '<div class="gline"><span style="color:var(--att);font-weight:700">ATT</span>' + gauge(s.att, 99, 'att') + '<b>' + s.att + '</b></div>' +
    '<div class="gline"><span style="color:var(--def);font-weight:700">DÉF</span>' + gauge(s.def, 99, 'def') + '<b>' + s.def + '</b></div>' +
    '<div class="gline"><span style="color:var(--cre);font-weight:700">CRÉ</span>' + gauge(s.cre, 99, 'cre') + '<b>' + s.cre + '</b></div>' +
    '<div class="small muted">Puissances offensive, défensive et créative, déduites de la note et du poste.' + (p.est ? ' Note estimée : joueur absent d’EA FC 27.' : '') + '</div></div></div>';
  if (cid) {
    h += '<div class="card" style="margin-top:10px"><div class="row wrap-r"><span class="lbl">État</span><span class="sp"></span>' + (stateChips(p, false) || '<span class="pill ok">Disponible</span>') + '</div>' +
      '<div class="gline" style="grid-template-columns:auto 1fr 44px;margin-top:8px"><span>Risque de blessure s’il est titulaire</span>' + gauge(risk, 0.5, riskCls(risk)) + '<b>' + pct(risk) + '</b></div>' +
      '<div class="small muted">' + (p.st ? p.st + ' titularisation' + (p.st > 1 ? 's' : '') + ' d’affilée. Le risque grimpe à chaque match enchaîné ; un match de repos le remet à zéro.' : 'Reposé : risque au plus bas.') + '</div></div>';
    h += '<div class="card" style="margin-top:10px"><span class="lbl">Saison ' + seasonNo() + '</span><div class="grid g4" style="gap:6px;margin-top:6px">' +
      [['Matchs', st.mp || 0], ['Buts', st.g || 0], ['Passes D.', st.a || 0], ['Intercept.', st.int || 0], ['Clean sheets', st.cs || 0], ['Jaunes', st.y || 0], ['Rouges', st.r || 0], ['Cartons cumulés', (p.yc || 0) + '/3']].map(function (x) { return '<div><div class="lbl">' + x[0] + '</div><b class="disp" style="font-size:20px">' + x[1] + '</b></div>'; }).join('') + '</div></div>';
    if (p.ovr < p.pot) {
      var o = objectiveFor(p.pos, p.ovr), ob = p.ob || { w: 0, v: 0, m: 0 }, cur = o.multi ? ob.m : ob.v;
      h += '<div class="card" style="margin-top:10px"><div class="row"><span class="lbl">Objectif pour passer à ' + (p.ovr + 1) + '</span><span class="sp"></span><span class="pill ' + (p.ups >= UPS_PER_SEASON ? 'warn' : 'neutral') + '">Progressions cette saison ' + p.ups + '/' + UPS_PER_SEASON + '</span></div>' +
        (p.ups >= UPS_PER_SEASON ? '<p class="small" style="margin:6px 0 0">Plafond de la saison atteint : l’objectif reprend la saison prochaine.</p>' :
        '<div style="margin:4px 0 8px"><b>' + objectiveText(o) + '</b></div>' + gauge(cur, o.k, 'ok') + '<div class="small muted" style="margin-top:4px">' + cur + ' / ' + o.k + ' · ' + (o.n - ob.w) + ' match(s) restant(s) dans la fenêtre</div>') + '</div>';
    }
  }
  h += '<div style="margin-top:14px">';
  if (mine) h += '<div class="row wrap-r"><button class="btn" data-a="goto" data-v="tactique">Voir la tactique</button><span class="small muted">Pour vendre, attends une offre d’un autre club.</span></div>';
  else if (!cid) h += '<p class="small muted">Joueur libre : disponible uniquement via les enchères de la boutique.</p>';
  else if (!live) h += '<div class="warnbox">' + esc(CLUB[cid].name) + ' n’a pas de propriétaire connecté : transfert impossible.</div>';
  else h += offerComposer(p, cid, me, a.mode || 'achat');
  return h + '</div>';
}
function offerComposer(p, cid, me, mode) {
  var h = '<div class="card"><div class="row wrap-r" style="margin-bottom:10px"><span class="lbl">Proposer à ' + esc(CLUB[cid].name) + '</span><span class="sp"></span><div class="seg" style="width:auto"><button data-a="omode" data-v="achat" aria-pressed="' + (mode === 'achat') + '">Achat</button><button data-a="omode" data-v="echange" aria-pressed="' + (mode === 'echange') + '">Échange</button></div></div>';
  if (mode === 'achat') {
    var v = p.val;
    h += '<div class="row wrap-r"><input class="input" type="number" min="0" step="0.5" id="oamt" data-keep="oamt-' + p.id + '" value="' + esc(kept('oamt-' + p.id, v)) + '" style="width:130px" aria-label="Montant en M€"><span class="muted">M€</span>' +
      [['−10 %', 0.9], ['Valeur', 1], ['+10 %', 1.1], ['+25 %', 1.25]].map(function (q) { return '<button class="chip" data-a="oquick" data-v="' + Math.round(v * q[1] * 10) / 10 + '">' + q[0] + '</button>'; }).join('') + '</div>' +
      '<div class="small muted" style="margin:8px 0">Budget disponible : <span class="money">' + fmtM(available(me)) + '</span>. Le club peut accepter, refuser ou répondre avec un autre prix.</div>' +
      '<button class="btn pri" data-a="osend" data-v="' + p.id + '" data-c="' + cid + '">Envoyer l’offre</button>';
  } else {
    var mineList = sortPlayers(squad(me), 'val');
    var give = S.sheet.args.give || null, gp = give ? P(give, me) : null;
    var diff = gp ? Math.round((p.val - gp.val) * 10) / 10 : 0;
    h += '<label class="stack" style="gap:4px"><span class="lbl">Joueur que tu proposes</span><select class="input" id="ogive" data-in="ogive"><option value="">Choisir un joueur…</option>' + mineList.map(function (q) { return '<option value="' + q.id + '"' + (give === q.id ? ' selected' : '') + '>' + esc(fullName(q)) + ' · ' + q.pos + ' · ' + q.ovr + ' · ' + fmtM(q.val) + '</option>'; }).join('') + '</select></label>';
    if (gp) h += '<div class="okbox" style="margin-top:8px">' + (diff > 0 ? 'Valeurs : ' + fmtM(p.val) + ' contre ' + fmtM(gp.val) + '. Tu paies la différence de marché : <b class="money">' + fmtM(diff) + '</b>.' : 'Ton joueur vaut autant ou plus (' + fmtM(gp.val) + ' contre ' + fmtM(p.val) + ') : échange sans paiement.') + '</div>';
    h += '<div style="margin-top:10px"><button class="btn pri" data-a="osend-ex" data-v="' + p.id + '" data-c="' + cid + '"' + (gp && Math.max(0, diff) <= available(me) ? '' : ' disabled') + '>Proposer l’échange</button></div>';
  }
  return h + '</div>';
}
function sheetCoach(a) {
  var me = myClubId(), c = clubDoc(a.cid), m = MANAGERS[c.mgr], tac = c.mgrTac || m.tac;
  var h = '<div class="phead"><div class="mgr" style="grid-template-columns:auto 1fr"><div class="face">' + esc(m.fn[0] + m.ln[0]) + '</div><div><span class="lbl">Entraîneur de ' + esc(CLUB[a.cid].name) + '</span><h2 class="disp">' + esc(m.fn + ' ' + m.ln) + '</h2></div></div></div>';
  h += '<div class="grid g4" style="gap:8px">' + kpi('Tactique', tac, '') + kpi('Potentiel', m.pot, '') + kpi('Respect tactique', tacticRespect(tac), '%') + kpi('Prix marché', fmtN(m.val), 'M€') + '</div>';
  h += '<div class="card" style="margin-top:10px"><span class="lbl">Ton offre</span><div class="row wrap-r" style="margin-top:6px"><input class="input" type="number" min="0" step="0.5" id="camt" data-keep="camt-' + a.cid + '" value="' + esc(kept('camt-' + a.cid, m.val)) + '" style="width:130px" aria-label="Montant en M€"><span class="muted">M€</span>' +
    [['Valeur', 1], ['+15 %', 1.15], ['+30 %', 1.3]].map(function (q) { return '<button class="chip" data-a="cquick" data-v="' + Math.round(m.val * q[1] * 10) / 10 + '">' + q[0] + '</button>'; }).join('') + '</div>' +
    '<div class="small muted" style="margin:8px 0">Budget disponible : <span class="money">' + fmtM(available(me)) + '</span>. ' + esc(CLUB[a.cid].name) + ' peut accepter, refuser ou répondre avec un autre prix.</div>' +
    '<button class="btn pri" data-a="csend" data-c="' + a.cid + '">Envoyer l’offre</button></div>';
  return h;
}
function sheetSlot(a) {
  var me = myClubId(), tac = myTactic(me), slots = FORMATIONS[tac.f];
  var isBench = a.bench, slot = isBench ? null : slots[a.i];
  var inXi = {}; Object.keys(tac.xi || {}).forEach(function (k) { if (tac.xi[k]) inXi[tac.xi[k]] = +k; });
  var inBench = {}; (tac.bench || []).forEach(function (pid, i) { if (pid) inBench[pid] = i; });
  var list = squad(me).map(function (p) {
    var pen = slot ? penOf(p, slot.pos) : 0;
    return { p: p, pen: pen, eff: p.ovr - pen };
  }).sort(function (x, y) { return (x.p.inj || x.p.susp ? 1 : 0) - (y.p.inj || y.p.susp ? 1 : 0) || y.eff - x.eff; });
  var cur = isBench ? (tac.bench || [])[a.i] : (tac.xi || {})[a.i];
  var h = '<div class="phead"><div><span class="lbl">' + (isBench ? 'Banc · place ' + (a.i + 1) : 'Poste dans le onze') + '</span><h2 class="disp">' + (isBench ? 'Remplaçant' : POS_NAME[slot.pos] + ' (' + slot.pos + ')') + '</h2></div></div>';
  h += '<div class="plist">' + list.map(function (x) {
    var p = x.p, role = inXi[p.id] != null ? 'Titulaire (' + slots[inXi[p.id]].pos + ')' : inBench[p.id] != null ? 'Banc' : '';
    var risk = injuryRisk(p, p.st), dis = p.inj || p.susp;
    return '<button class="prow" style="grid-template-columns:46px minmax(0,1fr) 44px auto" data-a="pick" data-pid="' + p.id + '"' + (p.id === cur ? ' aria-pressed="true"' : '') + '>' + posChips(p) +
      '<span class="pname"><span class="ln">' + esc(fullName(p)) + '</span><span class="small muted">' + (role ? role + ' · ' : '') + (x.pen ? 'hors poste −' + x.pen : 'à son poste') + (dis ? '' : ' · risque ' + pct(risk)) + '</span></span>' +
      rt(x.eff, p.kind, 'sm') + '<span class="state">' + stateChips(p, false) + (p.id === cur ? '<span class="pill ok">Actuel</span>' : '') + '</span></button>';
  }).join('') + '</div>';
  if (cur) h += '<div style="margin-top:10px"><button class="btn" data-a="pick" data-pid="">Libérer la place</button></div>';
  return h;
}
function sheetNotifs() {
  var me = myClubId(), pend = pendingActions(me);
  var recent = Object.keys(S.d.offers).map(function (k) { return S.d.offers[k]; }).filter(function (o) { return (o.from === me || o.to === me) && o.st !== 'open' && Date.now() - o.upd < 3 * 86400000; }).sort(function (a, b) { return b.upd - a.upd; }).slice(0, 6);
  var won = Object.keys(S.d.auctions).map(function (k) { return S.d.auctions[k]; }).filter(function (l) { return l.settled && l.winner === me && Date.now() - l.end < 3 * 86400000; });
  var ms = myMatches(me).slice(0, 3);
  var h = '<div class="phead"><h2 class="disp">Notifications</h2></div>';
  h += '<span class="lbl">À traiter</span>' + (pend.length ? '<div class="card" style="padding:0;margin:6px 0 14px">' + pend.map(function (o) { return offerLine(o, me, 'sctr-'); }).join('') + '</div>' : '<p class="small muted">Rien à traiter.</p>');
  if (ms.length) h += '<span class="lbl">Derniers matchs</span><div class="card" style="padding:0;margin:6px 0 14px">' + ms.map(function (m) { return fixtureRow(m.h, m.a, m.r); }).join('') + '</div>';
  if (won.length) h += '<span class="lbl">Enchères remportées</span><div class="stack" style="margin:6px 0 14px">' + won.map(function (l) { return '<div class="okbox">' + esc(fullName(PLAYERS[l.pid])) + ' rejoint ton club pour ' + fmtM(l.price) + '.</div>'; }).join('') + '</div>';
  if (recent.length) h += '<span class="lbl">Offres récentes</span><div class="card" style="padding:0;margin-top:6px">' + recent.map(function (o) { return offerLine(o, me, 'sctr-'); }).join('') + '</div>';
  return h;
}

// ---------- Match en direct (1 minute) ----------
function minuteNum(lab) { var p = String(lab).split('+'); return +p[0] + (p[1] ? +p[1] * 0.4 : 0); }
function evText(e, doc) {
  var nm = function (pid) { return pid && PLAYERS[pid] ? esc(shortName(PLAYERS[pid])) : '?'; };
  var team = function (s) { return esc(CLUB[s === 0 ? doc.h : doc.a].short); };
  switch (e.t) {
    case 'ko': return ['Coup d’envoi', 'minor', ''];
    case 'mult': return [(e.v > 1 ? 'État de grâce pour ' + esc(CLUB[e.s === 0 ? doc.h : doc.a].name) + ' : niveau ×1,20 aujourd’hui' : 'Jour sans pour ' + esc(CLUB[e.s === 0 ? doc.h : doc.a].name) + ' : niveau ×0,90 aujourd’hui'), '', ''];
    case 'goal': return ['BUT ! ' + nm(e.p) + ' (' + team(e.s) + ')' + (e.a ? ', passe décisive de ' + nm(e.a) : e.e ? ' profite d’une erreur de ' + nm(e.e) : '') + ' · ' + e.sc[0] + '-' + e.sc[1], 'goal', '<span class="ball"></span>'];
    case 'miss': return [e.k === 'save' ? 'Arrêt de ' + nm(e.g) + ' devant ' + nm(e.p) + ' (' + team(e.s) + ')' : e.k === 'post' ? 'Poteau ! Frappe de ' + nm(e.p) + ' (' + team(e.s) + ')' : 'But raté : ' + nm(e.p) + ' (' + team(e.s) + ') tire à côté', '', '·'];
    case 'foul': return ['Faute de ' + nm(e.p) + ' (' + team(e.s) + ')', 'minor', ''];
    case 'yellow': return ['Carton jaune : ' + nm(e.p) + ' (' + team(e.s) + ')', '', '<span class="card-y"></span>'];
    case 'red': return ['Carton rouge' + (e.k === '2j' ? ' (2e jaune)' : ' direct') + ' : ' + nm(e.p) + ' (' + team(e.s) + ')', '', '<span class="card-r"></span>'];
    case 'inj': return ['Blessure : ' + nm(e.p) + ' (' + team(e.s) + '), absent ' + e.d + ' match' + (e.d > 1 ? 's' : ''), '', '✚'];
    case 'sub': return ['Changement ' + team(e.s) + ' : ' + nm(e.p) + ' remplace ' + nm(e.a) + (e.w ? ' (' + e.w + ')' : ''), 'minor', '⇄'];
    case 'ht': return ['Mi-temps · ' + e.sc[0] + '-' + e.sc[1], '', ''];
    case 'ft': return ['Fin du match · ' + e.sc[0] + '-' + e.sc[1], 'goal', ''];
  }
  return ['', '', ''];
}
async function openMatch(mid) {
  if (S.liveMatch === mid) S.liveMatch = null;
  openSheet('match');
  var doc = S.matchCache[mid] || await Store.get('matches/' + mid);
  if (!doc) { document.getElementById('mview').textContent = 'Match introuvable.'; return; }
  S.matchCache[mid] = doc;
  var times = [], last = 0, total = 0;
  doc.ev.forEach(function (e) { total = Math.max(total, minuteNum(e.m)); });
  total = Math.max(total, 90);
  doc.ev.forEach(function (e, i) {
    var t = e.t === 'ft' ? 60 : e.t === 'ko' || e.t === 'mult' ? 0.3 * i : minuteNum(e.m) / total * 59;
    if (e.t === 'ht') t = 45 / total * 59 + 0.01;
    last = Math.max(last, t); times.push(last);
  });
  S.view = { mid: mid, doc: doc, times: times, t: 0, shown: 0, speed: 1, filter: 'all', timer: null };
  renderMatchShell();
  S.view.timer = setInterval(function () { stepMatch(0.1); }, 100);
  stepMatch(0);
}
function renderMatchShell() {
  var v = S.view, d = v.doc;
  var lab = d.label || '';
  var tab = d.tab ? ' · t.a.b. ' + d.tab[0] + '-' + d.tab[1] : '';
  document.getElementById('mview').innerHTML = '<span class="lbl">' + esc(lab) + tab + '</span>' +
    '<div class="board" style="margin-top:8px"><div class="tm">' + crest(d.h) + '<b><span class="lgn">' + esc(CLUB[d.h].name) + '</span><span class="shn">' + esc(CLUB[d.h].short) + '</span></b></div><div><div class="score" id="msc">0-0</div><div class="clock" id="mclk">0’</div></div><div class="tm r"><b><span class="lgn">' + esc(CLUB[d.a].name) + '</span><span class="shn">' + esc(CLUB[d.a].short) + '</span></b>' + crest(d.a) + '</div></div>' +
    '<div class="prog"><i id="mprog"></i></div>' +
    '<div class="row wrap-r" style="margin-top:10px"><div class="seg" style="width:auto"><button data-a="mf" data-v="all" aria-pressed="true">Tout</button><button data-a="mf" data-v="hl" aria-pressed="false">Temps forts</button></div><span class="sp"></span><button class="btn sm" data-a="mspeed">Vitesse ×1</button><button class="btn sm" data-a="mend">Résultat final</button></div>' +
    '<div class="feed" id="mfeed"></div><div id="mend"></div>';
}
function stepMatch(dt) {
  var v = S.view; if (!v) return;
  v.t = Math.min(60, v.t + dt * v.speed);
  var d = v.doc, feed = document.getElementById('mfeed'); if (!feed) return;
  var sc = [0, 0];
  while (v.shown < d.ev.length && v.times[v.shown] <= v.t) {
    var e = d.ev[v.shown], tx = evText(e, d);
    var div = document.createElement('div');
    div.className = 'ev ' + tx[1] + ' side' + (e.s || 0);
    div.setAttribute('data-k', tx[1] === 'minor' ? 'minor' : 'hl');
    if (v.filter === 'hl' && tx[1] === 'minor') div.hidden = true;
    div.innerHTML = '<span class="m">' + (e.t === 'ko' || e.t === 'mult' ? '0’' : e.m + '’') + '</span><span class="ic">' + tx[2] + '</span><span class="t">' + tx[0] + '</span>';
    feed.insertBefore(div, feed.firstChild);
    v.shown++;
  }
  for (var i = 0; i < v.shown; i++) { if (d.ev[i].sc) sc = d.ev[i].sc; }
  var cur = v.shown ? d.ev[v.shown - 1] : null;
  document.getElementById('msc').textContent = sc[0] + '-' + sc[1];
  document.getElementById('mclk').textContent = v.t >= 60 ? 'TERMINÉ' : (cur ? (cur.t === 'ht' ? 'MI-TEMPS' : (cur.m || 0) + '’') : '0’');
  document.getElementById('mprog').style.width = (v.t / 60 * 100) + '%';
  if (v.t >= 60 && v.timer) { clearInterval(v.timer); v.timer = null; renderMatchEnd(); }
}
function renderMatchEnd() {
  var v = S.view, d = v.doc, st = d.stats;
  var bar = function (k, a, b, fmt) {
    var t = (a + b) || 1;
    return '<div class="mstat"><span class="k">' + k + '</span><b>' + (fmt ? fmt(a) : a) + '</b><span class="bar"><i><b style="width:' + (a / t * 100) + '%"></b></i><i><b style="width:' + (b / t * 100) + '%"></b></i></span><b style="text-align:right">' + (fmt ? fmt(b) : b) + '</b></div>';
  };
  var motm = d.motm && PLAYERS[d.motm];
  var recs = d.rec || {};
  var lineup = function (side) {
    var ids = Object.keys(recs).filter(function (pid) { return recs[pid][0] === side; }).sort(function (x, y) { return (recs[y][1] - recs[x][1]) || (recs[y][10] - recs[x][10]); });
    return ids.map(function (pid) {
      var r = recs[pid], p = PLAYERS[pid];
      var tags = (r[3] ? ' <span class="ball" style="display:inline-block;vertical-align:-1px"></span>' + (r[3] > 1 ? '×' + r[3] : '') : '') + (r[4] ? ' <span class="small muted">PD' + (r[4] > 1 ? '×' + r[4] : '') + '</span>' : '') + (r[7] && !r[8] ? ' <span class="card-y"></span>' : '') + (r[8] ? ' <span class="card-r"></span>' : '') + (r[9] ? ' <span style="color:var(--bad)">✚</span>' : '');
      return '<div class="row small" style="padding:3px 0;border-bottom:1px solid var(--line)">' + posChip(p.pos) + '<span class="sp" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (r[1] ? '' : '↑ ') + esc(shortName(p)) + tags + '</span><b class="num">' + (r[10] >= 0 ? fmtN(r[10]) : '–') + '</b></div>';
    }).join('');
  };
  document.getElementById('mend').innerHTML = '<div class="card" style="margin-top:12px">' + (motm ? '<div class="row"><span class="lbl">Homme du match</span><b>' + esc(fullName(motm)) + '</b><span class="pill ok">' + fmtN(recs[d.motm][10]) + '</span></div>' : '') +
    '<div class="mstats">' + bar('Possession estimée', st[0].poss, st[1].poss, function (x) { return x + '%'; }) + bar('Tirs', st[0].shots, st[1].shots) + bar('Tirs cadrés', st[0].sot, st[1].sot) + bar('Fautes', st[0].fouls, st[1].fouls) + bar('Cartons jaunes', st[0].y, st[1].y) + '</div></div>' +
    '<div class="grid g2" style="margin-top:12px"><div class="card"><span class="lbl">' + esc(CLUB[d.h].name) + ' · notes</span>' + lineup(0) + '</div><div class="card"><span class="lbl">' + esc(CLUB[d.a].name) + ' · notes</span>' + lineup(1) + '</div></div>';
}

// ---------- Interactions ----------
var H = {};
H.tab = function (t) { S.ui.tab = t.dataset.v; render(); window.scrollTo(0, 0); };
H.goto = function (t) { S.ui.tab = t.dataset.v; if (t.dataset.s) S.ui.sub[t.dataset.v] = t.dataset.s; closeSheet(); render(); window.scrollTo(0, 0); };
H.sub = function (t) { S.ui.sub[t.dataset.p] = t.dataset.v; render(); };
H.eline = function (t) { S.ui.eff.line = t.dataset.v; render(); };
H.player = function (t) { openSheet('player', { pid: t.dataset.pid }); };
H.close = function () { closeSheet(); };
H.notifs = function () { openSheet('notifs'); };
H['live-x'] = function () { S.liveMatch = null; render(); };
H.match = function (t) { openMatch(t.dataset.mid); };
H.tok = function (t) { openSheet('slot', { i: +t.dataset.i, bench: false }); };
H.bslot = function (t) { openSheet('slot', { i: +t.dataset.i, bench: true }); };
H.pick = function (t) {
  var me = myClubId(), tac = myTactic(me), a = S.sheet.args, pid = t.dataset.pid || null;
  tac.xi = tac.xi || {}; tac.bench = (tac.bench || []).slice(); while (tac.bench.length < 7) tac.bench.push(null);
  var prev = a.bench ? tac.bench[a.i] : tac.xi[a.i];
  if (pid) {
    var inX = null; Object.keys(tac.xi).forEach(function (k) { if (tac.xi[k] === pid) inX = +k; });
    var inB = tac.bench.indexOf(pid);
    if (inX != null && !(!a.bench && inX === a.i)) tac.xi[inX] = prev || null;
    if (inB >= 0 && !(a.bench && inB === a.i)) tac.bench[inB] = prev || null;
  }
  if (a.bench) tac.bench[a.i] = pid; else tac.xi[a.i] = pid;
  S.tacDraft = tac; saveTactic(tac); closeSheet(); render();
};
H.form = function (t) {
  var me = myClubId(), tac = myTactic(me), f = t.dataset.v;
  var ids = squadIds(me);
  var cur = Object.keys(tac.xi || {}).map(function (k) { return tac.xi[k]; }).filter(function (pid) { return pid && ids.indexOf(pid) >= 0; });
  var pool = cur.map(function (pid) { var p = P(pid, me); return { id: pid, pos: p.pos, pos2: p.pos2, ovr: p.ovr, st: p.st, age: p.age }; });
  var lu = pickLineup(pool, f, {}, []);
  var xi = {}; lu.xi.forEach(function (pid, i) { xi[i] = pid || null; });
  var all = squad(me).filter(function (p) { return !p.inj && !p.susp; }).map(function (p) { return { id: p.id, pos: p.pos, pos2: p.pos2, ovr: p.ovr, st: p.st, age: p.age }; });
  var lu2 = pickLineup(all, f, xi, tac.bench || []);
  xi = {}; lu2.xi.forEach(function (pid, i) { xi[i] = pid || null; });
  tac.f = f; tac.xi = xi; tac.bench = lu2.bench;
  S.tacDraft = tac; saveTactic(tac); render();
};
H.tset = function (t) {
  var me = myClubId(), tac = myTactic(me), k = t.dataset.k, v = t.dataset.v;
  tac[k] = (k === 'ment' || k === 'tempo') ? +v : v;
  S.tacDraft = tac; saveTactic(tac); render();
};
H.auto = function () {
  var me = myClubId(), tac = myTactic(me), c = clubDoc(me);
  var lu = autoLineup(me, c.pl, tac.f, S.ui.avoidRisk ? { avoidRisk: 0.15 } : null);
  tac.xi = lu.xi; tac.bench = lu.bench;
  S.tacDraft = tac; saveTactic(tac, true); render(); toast('Composition mise à jour.');
};
H.mline = function (t) { S.ui.mq.line = t.dataset.v; render(); };
H.mlive = function () { S.ui.mq.live = !S.ui.mq.live; render(); };
H.omode = function (t) { S.sheet.args.mode = t.dataset.v; renderSheet(); };
H.cquick = function (t) { var el = document.getElementById('camt'); if (el) { el.value = t.dataset.v; S.keep[el.dataset.keep] = t.dataset.v; } };
H.oquick = function (t) { var el = document.getElementById('oamt'); if (el) { el.value = t.dataset.v; S.keep[el.dataset.keep] = t.dataset.v; } };
H.osend = function (t) {
  var amt = parseFloat(String(document.getElementById('oamt').value).replace(',', '.'));
  if (!(amt >= 0)) { toast('Indique un montant valide.'); return; }
  sendOffer({ to: t.dataset.c, kind: 'achat', pid: t.dataset.v, amt: Math.round(amt * 10) / 10 }).then(function () { closeSheet(); botNudge(t.dataset.c); });
};
H['coach-offer'] = function (t) { openSheet('coach', { cid: t.dataset.v }); };
H['csend'] = function (t) {
  var amt = parseFloat(String(document.getElementById('camt').value).replace(',', '.'));
  if (!(amt >= 0)) { toast('Indique un montant valide.'); return; }
  var cid = t.dataset.c, c = clubDoc(cid);
  sendOffer({ to: cid, kind: 'coach', pid: c.mgr, amt: Math.round(amt * 10) / 10 }).then(function () { closeSheet(); botNudge(cid); });
};
H['osend-ex'] = function (t) {
  var me = myClubId(), give = S.sheet.args.give; if (!give) return;
  var diff = Math.max(0, Math.round((P(t.dataset.v, t.dataset.c).val - P(give, me).val) * 10) / 10);
  sendOffer({ to: t.dataset.c, kind: 'echange', pid: t.dataset.v, give: give, amt: diff }).then(function () { closeSheet(); botNudge(t.dataset.c); });
};
function botNudge(cid) { if (isBot(cid)) setTimeout(tick, 13500); }
H.resp = function (t) {
  var id = t.dataset.id, act = t.dataset.v, amt = null;
  if (act === 'counter') { var el = document.getElementById(t.dataset.inp || ('ctr-' + id)); amt = parseFloat(String(el.value).replace(',', '.')); if (!(amt >= 0)) { toast('Indique un montant valide.'); return; } }
  var o = S.d.offers[id];
  delete S.keep['ctr-' + id];
  respondOffer(id, act, amt).then(function () { if (act === 'counter' && o) botNudge(o.to); });
};
H.bid = function (t) {
  var id = t.dataset.v, el = document.getElementById('bid-' + id);
  var amt = parseFloat(String(el.value).replace(',', '.'));
  delete S.keep['bid-' + id];
  placeBid(id, Math.round(amt * 10) / 10);
};
H.pack = function () {
  var me = myClubId(), odds = packOdds(me), used = packsUsed(me), can = used < PACK_MAX && available(me) >= PACK_PRICE;
  var best = odds.filter(function (o) { return !o.owned; }).sort(function (a, b) { return PLAYERS[b.pid].ovr - PLAYERS[a.pid].ovr; })[0];
  var html = '<div class="phead">' + crest(me, 'lg') + '<div><span class="lbl">Pack club · ' + fmtM(PACK_PRICE) + '</span><h2 class="disp">Tes chances</h2></div></div>' +
    '<div class="plist">' + odds.map(function (o) {
      var p = PLAYERS[o.pid];
      return '<div class="prow" style="grid-template-columns:46px minmax(0,1fr) 44px 74px;cursor:default">' + posChips(p) + '<span class="pname"><span class="ln">' + esc(fullName(p)) + '</span><span class="small muted">' + RARITY[p.rarity] + (o.owned ? ' · déjà dans un effectif' : '') + '</span></span>' + rt(p.ovr, p.rarity === 'M' ? 'legend' : null, 'sm') + '<b class="num" style="text-align:right;font-size:18px">' + (o.owned ? '0 %' : fmtN(o.p * 100) + ' %') + '</b></div>';
    }).join('') + '</div>' +
    (best ? '<p class="small">Chance d’obtenir le meilleur joueur disponible (' + esc(fullName(PLAYERS[best.pid])) + ', ' + PLAYERS[best.pid].ovr + ') : <b>' + fmtN(best.p * 100) + ' %</b>.</p>' : '<p class="small">Tous les anciens de ton club sont déjà dans des effectifs : la moitié du prix serait remboursée.</p>') +
    '<p class="small muted">Chaque rareté a sa cote (Commun 55 %, Rare 30 %, Épique 12 %, Mythique 3 %), partagée entre ses 3 joueurs. Si un joueur est déjà dans un effectif, sa part est redistribuée entre les autres. ' + (PACK_MAX - used) + ' / ' + PACK_MAX + ' packs restants cette saison · budget disponible ' + fmtM(available(me)) + '.</p>' +
    '<div class="row"><button class="btn" data-a="close">Annuler</button><span class="sp"></span><button class="btn pri" data-a="pack-go"' + (can ? '' : ' disabled') + '>Ouvrir pour ' + fmtM(PACK_PRICE) + '</button></div>';
  openSheet('pack', { html: html });
};
H['pack-go'] = function () {
  closeSheet();
  openPack().then(function (r) {
    if (!r) return;
    var html;
    if (r.none) html = '<div class="reveal"><h2 class="disp">Collection complète</h2><p>Tous les anciens de ton club sont déjà dans des effectifs. La moitié du prix t’est remboursée.</p></div>';
    else {
      var p = PLAYERS[r.pid];
      html = '<div class="reveal"><span class="lbl">Pack club · ' + RARITY[p.rarity] + '</span><div class="packcard ' + p.rarity + '"><div class="stack" style="align-items:center;gap:8px">' + rt(p.ovr, p.rarity === 'M' ? 'legend' : null, 'lg') + posChips(p) + '<b class="disp" style="font-size:22px;text-align:center">' + esc(fullName(p)) + '</b><span class="small muted">Ancien de ' + esc(CLUB[p.club].name) + '</span></div></div><p>Il rejoint ton effectif.</p><button class="btn pri" data-a="close">Super</button></div>';
    }
    openSheet('pack', { html: html });
  });
};
H.legend = function (t) { signLegend(t.dataset.v); };
H.claim = function (t) { claimObjective(t.dataset.v); };
H['buy-mgr'] = function (t) { buyManager(t.dataset.v); };
H['lg-reg'] = function () { registerLeague(true); };
H['lg-unreg'] = function () { registerLeague(false); };
H['lg-launch'] = function () { launchSeason(); };
H['lg-new'] = function () { newSeason(); };
H['cup-reg'] = function () { registerCup(true); };
H['cup-unreg'] = function () { registerCup(false); };
H['t-bots'] = function () { testAddBots(5); };
H['t-botscup'] = function () { testBotsToCup(); };
H['t-next'] = function () { toast('Simulation de la journée…'); testPlayNext(); };
H['t-cup'] = function () { toast('Simulation de la coupe…'); testPlayCup(); };
H['t-auction'] = function () { testAuction(); };
H['t-close'] = function () { testCloseAuctions(); };
H['t-money'] = function () { testMoney(); };
H['t-reset'] = function (t) {
  if (t.dataset.ok !== '1') { t.dataset.ok = '1'; t.textContent = 'Confirmer : tout effacer'; return; }
  t.disabled = true; t.textContent = 'Réinitialisation…';
  resetWorld().then(function () { if (Store.mode === 'local') Store.wipeLocal(); toast('Partie réinitialisée.'); render(); });
};
H['reset-world'] = function (t) {
  if (t.dataset.ok !== '1') { t.dataset.ok = '1'; t.textContent = 'Confirmer la réinitialisation'; return; }
  t.disabled = true; t.textContent = 'Réinitialisation…';
  resetWorld().then(function () { if (Store.mode === 'local') Store.wipeLocal(); toast('Partie réinitialisée : choisis ton club.'); render(); });
};
H.tools = function () { };
H['onb-next'] = function () { S.ui.onb.step = 2; render(); };
H['onb-lg'] = function (t) { S.ui.onb.lg = t.dataset.v; render(); };
H['onb-club'] = function (t) { S.ui.onb.club = t.dataset.v; render(); };
H['onb-sign'] = function () {
  var o = S.ui.onb; if (!o.club) return;
  claimClub(o.club, o.pseudo).then(function (ok) { if (ok) { S.ui.tab = 'effectif'; toast('Bienvenue à ' + CLUB[o.club].name + ' !'); } });
};
H.mf = function (t) {
  if (!S.view) return; S.view.filter = t.dataset.v;
  t.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
  document.querySelectorAll('#mfeed .ev').forEach(function (el) { el.hidden = S.view.filter === 'hl' && el.getAttribute('data-k') === 'minor'; });
};
H.mspeed = function (t) { if (!S.view) return; S.view.speed = S.view.speed === 1 ? 4 : 1; t.textContent = 'Vitesse ×' + S.view.speed; };
H.mend = function () { if (!S.view) return; S.view.t = 59.99; stepMatch(0.1); };

document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-a]'); if (!t) return;
  if (t.tagName === 'DETAILS') { S.ui.toolsOpen = !t.open; return; }
  var f = H[t.dataset.a]; if (!f) return;
  if (t.tagName === 'BUTTON' || t.classList.contains('scrim')) e.preventDefault();
  if (t.disabled) return;
  f(t, e);
});
document.addEventListener('input', function (e) {
  var t = e.target;
  if (t.dataset && t.dataset.keep) S.keep[t.dataset.keep] = t.value;
  var k = t.dataset && t.dataset.in; if (!k) return;
  if (k === 'pseudo') {
    S.ui.onb.pseudo = t.value;
    var b = document.querySelector('[data-a="onb-next"]'); if (b) b.disabled = t.value.trim().length < 2;
  } else if (k === 'mq') {
    S.ui.mq.q = t.value;
    var me = myClubId(), list = marketList(me), box = document.getElementById('mres');
    if (box) box.innerHTML = marketResults(list, list.slice(0, 60));
  } else if (k === 'free') {
    var me2 = myClubId(), tac = myTactic(me2); tac.free = +t.value;
    S.tacDraft = tac;
    document.getElementById('freev').textContent = t.value + ' %';
    var pw = tacticPowers(me2, tac), fx = pw.fx, gap = fx.f - fx.q;
    var lvl = gap <= 0.05 ? ['Faible', 'ok'] : gap <= 0.2 ? ['Modéré', 'warn'] : ['Élevé', 'bad'];
    document.getElementById('freefx').innerHTML = '<span>Occasions créées <b>+' + Math.max(0, Math.round((fx.cre - 1) * 100)) + ' %</b></span><span class="sp"></span><span>Risque d’erreur <span class="pill ' + lvl[1] + '">' + lvl[0] + '</span></span>';
  }
});
document.addEventListener('change', function (e) {
  var t = e.target, k = t.dataset && t.dataset.in; if (!k) return;
  if (k === 'esort') { S.ui.eff.sort = t.value; render(); }
  else if (k === 'mmin') { S.ui.mq.min = +t.value; render(); }
  else if (k === 'mpot') { S.ui.mq.pot = +t.value; render(); }
  else if (k === 'mmax') { S.ui.mq.max = +t.value; render(); }
  else if (k === 'msort') { S.ui.mq.sort = t.value; render(); }
  else if (k === 'avoid') { S.ui.avoidRisk = t.checked; }
  else if (k === 'free') { var me = myClubId(), tac = myTactic(me); tac.free = +t.value; S.tacDraft = tac; saveTactic(tac); render(); }
  else if (k === 'ogive') { S.sheet.args.give = t.value || null; renderSheet(); }
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.sheet) closeSheet(); });

// ---------- Connexion (version site autonome) ----------
function loginErrText(e) {
  var c = e && e.code || '';
  if (c === 'auth/unauthorized-domain') return 'Ce site n’est pas encore autorisé : dans Firebase › Authentication › Paramètres › Domaines autorisés, ajoute « ' + location.hostname + ' ».';
  if (c === 'auth/popup-closed-by-user') return 'Fenêtre de connexion fermée avant la fin. Réessaie.';
  if (c === 'auth/operation-not-allowed') return 'La connexion Google n’est pas activée : Firebase › Authentication › Méthodes de connexion › Google.';
  return 'Connexion impossible' + (c ? ' (' + c + ')' : '') + '. Réessaie.';
}
function renderLogin() {
  return '<div class="onb"><div class="hero"><span class="lbl">Carrière Foot · multijoueur</span><h1 class="disp">Entre dans le vestiaire</h1>' +
    '<p class="lead">Connecte-toi avec ton compte Google pour retrouver ton club sur n’importe quel appareil et affronter tes amis.</p></div>' +
    '<div class="card" style="max-width:520px"><div class="stack"><button class="btn pri" data-a="login" style="align-self:flex-start">Se connecter avec Google</button>' +
    (S.loginErr ? '<div class="warnbox">' + esc(S.loginErr) + '</div>' : '') +
    '<span class="small muted">Le tout premier compte connecté devient l’administrateur de la partie (réinitialisation, lancement des saisons).</span></div></div></div>';
}
H.login = function () {
  S.loginErr = '';
  Store.login().then(function (r) { if (r !== undefined || (Store.auth && Store.auth.currentUser)) { S.needLogin = false; boot(); } })
    .catch(function (e) { S.loginErr = loginErrText(e); render(); });
};
H.logout = function () { Store.logout().then(function () { location.reload(); }); };

// ---------- Démarrage ----------
var _booted = false;
function boot() {
  render();
  Store.init().then(function (r) {
    if (r.needLogin) {
      S.needLogin = true;
      if (Store.loginErr) S.loginErr = loginErrText(Store.loginErr);
      render(); return;
    }
    if (_booted) return; _booted = true;
    S.needLogin = false; S.email = r.email || '';
    S.me = r.me; S.isOwner = r.isOwner; S.canWrite = r.canWrite;
    var colls = ['game', 'clubs', 'offers', 'ledger', 'auctions', 'cups', 'league'];
    colls.forEach(function (coll) {
      Store.watch(coll, function (m) {
        S.d[coll] = m; S.loaded[coll] = 1;
        if (coll === 'clubs') rebuildIndex();
        var was = S.ready;
        S.ready = colls.every(function (c) { return S.loaded[c]; });
        if (S.ready && !was) setTimeout(tick, 600);
        render();
      }, function () { toast('Connexion aux données perdue. Recharge la page.'); });
    });
    setInterval(tick, 30000);
    setInterval(updateCountdowns, 1000);
  });
}
boot();
