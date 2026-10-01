// ===== TEMPS (heure de Paris) & STOCKAGE =====
var TZ = 'Europe/Paris';
var _fmtParts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, weekday: 'short' });
function parisParts(ms) {
  var o = {};
  _fmtParts.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
  var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: wd };
}
function tzOffsetMin(ms) {
  var p = parisParts(ms);
  return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - ms) / 60000);
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function parisDate(ms) { var p = parisParts(ms); return p.y + '-' + pad2(p.mo) + '-' + pad2(p.d); }
function addDays(dateStr, n) {
  var a = dateStr.split('-').map(Number);
  var t = new Date(Date.UTC(a[0], a[1] - 1, a[2] + n));
  return t.getUTCFullYear() + '-' + pad2(t.getUTCMonth() + 1) + '-' + pad2(t.getUTCDate());
}
function weekdayOf(dateStr) { var a = dateStr.split('-').map(Number); return new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay(); }
// Instant UTC (ms) correspondant à une date + heure de Paris
function parisTime(dateStr, h, mi) {
  var a = dateStr.split('-').map(Number);
  var guess = Date.UTC(a[0], a[1] - 1, a[2], h, mi || 0);
  var t = guess - tzOffsetMin(guess) * 60000;
  var off2 = tzOffsetMin(t);
  return guess - off2 * 60000;
}
function isoWeek(dateStr) {
  var a = dateStr.split('-').map(Number);
  var d = new Date(Date.UTC(a[0], a[1] - 1, a[2]));
  var day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
  var y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return d.getUTCFullYear() * 100 + Math.ceil(((d - y0) / 86400000 + 1) / 7);
}
var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
function fmtWhen(ms) {
  var p = parisParts(ms), today = parisDate(Date.now()), ds = parisDate(ms);
  var hm = pad2(p.h) + 'h' + (p.mi ? pad2(p.mi) : '');
  if (ds === today) return "aujourd'hui " + hm;
  if (ds === addDays(today, 1)) return 'demain ' + hm;
  if (ds === addDays(today, -1)) return 'hier ' + hm;
  return JOURS[p.wd] + ' ' + p.d + ' ' + MOIS[p.mo - 1] + ' ' + hm;
}
function fmtLeft(ms) {
  var s = Math.max(0, Math.round(ms / 1000));
  var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  if (d) return d + ' j ' + h + ' h';
  if (h) return h + ' h ' + pad2(m) + ' min';
  if (m) return m + ' min ' + pad2(sec) + ' s';
  return sec + ' s';
}

// ---------- Stockage : base partagée (multijoueur) ou local (solo) ----------
function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
function deepMerge(dst, src) {
  Object.keys(src).forEach(function (k) {
    var v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) deepMerge(dst[k], v);
    else dst[k] = clone(v);
  });
  return dst;
}
var LS_KEY = 'carriere-foot-v1';
// Firestore refuse les tableaux directement imbriqués dans des tableaux : on les emballe en { _a: [...] }
function fbEncode(v) {
  if (Array.isArray(v)) return v.map(function (e) { return Array.isArray(e) ? { _a: fbEncode(e) } : fbEncode(e); });
  if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = fbEncode(v[k]); }); return o; }
  return v;
}
function fbDecode(v) {
  if (Array.isArray(v)) return v.map(fbDecode);
  if (v && typeof v === 'object') {
    var ks = Object.keys(v);
    if (ks.length === 1 && ks[0] === '_a' && Array.isArray(v._a)) return fbDecode(v._a);
    var o = {}; ks.forEach(function (k) { o[k] = fbDecode(v[k]); }); return o;
  }
  return v;
}
function fbConfigured() {
  var c = typeof window !== 'undefined' && window.FIREBASE_CONFIG;
  return !!(c && c.apiKey && c.projectId && String(c.apiKey).indexOf('COLLE') < 0);
}
var Store = {
  mode: 'local', db: null, fs: null, auth: null, user: null, local: {}, listeners: [], _saveT: null,
  // ---------- Version site autonome : Firebase (connexion Google + base Firestore) ----------
  _initFb: function () {
    var self = this;
    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
    self.auth = firebase.auth(); self.fs = firebase.firestore(); self.mode = 'fb';
    return Promise.resolve(self.auth.getRedirectResult ? self.auth.getRedirectResult().catch(function (e) { self.loginErr = e; }) : null).then(function () {
      return new Promise(function (res) { var un = self.auth.onAuthStateChanged(function (u) { un(); res(u); }); });
    }).then(function (u) {
      if (!u) return { needLogin: true };
      self.user = u;
      // Le tout premier compte connecté devient l'administrateur de la partie
      var ref = self.fs.doc('admin/owner');
      return self.fs.runTransaction(function (tx) {
        return tx.get(ref).then(function (s) {
          if (!s.exists) { tx.set(ref, { uid: u.uid, at: Date.now() }); return u.uid; }
          return s.data().uid;
        });
      }).catch(function () {
        return ref.get().then(function (s) { return s.exists ? s.data().uid : null; }).catch(function () { return null; });
      }).then(function (ownerUid) {
        return { me: u.uid, isOwner: ownerUid === u.uid, canWrite: true, email: u.email || '', name: u.displayName || '' };
      });
    });
  },
  login: function () {
    var self = this, prov = new firebase.auth.GoogleAuthProvider();
    prov.setCustomParameters({ prompt: 'select_account' });
    return self.auth.signInWithPopup(prov).catch(function (e) {
      if (e && ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].indexOf(e.code) >= 0) return self.auth.signInWithRedirect(prov);
      throw e;
    });
  },
  logout: function () { return this.auth ? this.auth.signOut() : Promise.resolve(); },
  online: function () { return this.mode === 'db' || this.mode === 'fb'; },
  init: function () {
    var self = this;
    if (typeof window !== 'undefined' && window.firebase && fbConfigured()) return self._initFb();
    var hasClaude = typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function';
    var timeout = function (ms) { return new Promise(function (r) { setTimeout(function () { r(null); }, ms); }); };
    var tryDb = !hasClaude ? Promise.resolve(null) : Promise.race([
      Promise.all([window.claude.use('db'), window.claude.use('user')]), timeout(7000)
    ]).then(function (arr) {
      if (!arr || !arr[0] || !arr[1]) return null;
      var db = arr[0], user = arr[1];
      return Promise.all([user.id(), user.isOwner(), user.can('data.write')]).then(function (r) {
        if (!r[0]) return null;
        return { db: db, id: r[0], owner: r[1], canWrite: r[2] !== false };
      });
    }).catch(function () { return null; });
    return tryDb.then(function (res) {
      if (res) {
        self.mode = 'db'; self.db = res.db;
        return { me: res.id, isOwner: res.owner, canWrite: res.canWrite };
      }
      self.mode = 'local';
      try { var raw = localStorage.getItem(LS_KEY); if (raw) self.local = JSON.parse(raw) || {}; } catch (e) { self.local = {}; }
      return { me: 'moi', isOwner: true, canWrite: true };
    });
  },
  _persist: function () {
    var self = this;
    clearTimeout(this._saveT);
    this._saveT = setTimeout(function () { try { localStorage.setItem(LS_KEY, JSON.stringify(self.local)); } catch (e) { } }, 300);
  },
  _notify: function (coll) {
    var self = this;
    setTimeout(function () {
      self.listeners.forEach(function (l) { if (l.coll === coll) l.cb(clone(self.local[coll] || {})); });
    }, 0);
  },
  _split: function (path) { var i = path.lastIndexOf('/'); return [path.slice(0, i), path.slice(i + 1)]; },
  watch: function (coll, cb, onErr) {
    var self = this;
    if (this.mode === 'fb') {
      return this.fs.collection(coll).onSnapshot(function (snap) {
        var m = {};
        snap.forEach(function (d) { m[d.id] = fbDecode(d.data()); });
        cb(m);
      }, function (e) { if (onErr) onErr(e); });
    }
    if (this.mode === 'db') {
      return this.db.collection(coll).onSnapshot(function (snap) {
        var m = {};
        snap.docs.forEach(function (d) { if (d.exists) m[d.id] = clone(d.data()); });
        cb(m);
      }, function (e) { if (onErr) onErr(e); });
    }
    var l = { coll: coll, cb: cb }; this.listeners.push(l);
    setTimeout(function () { cb(clone(self.local[coll] || {})); }, 0);
    return function () { self.listeners = self.listeners.filter(function (x) { return x !== l; }); };
  },
  get: function (path) {
    if (this.mode === 'fb') return this.fs.doc(path).get().then(function (s) { return s.exists ? fbDecode(s.data()) : null; });
    if (this.mode === 'db') return this.db.doc(path).get().then(function (s) { return s.exists ? clone(s.data()) : null; });
    var sp = this._split(path), c = this.local[sp[0]];
    return Promise.resolve(c && c[sp[1]] ? clone(c[sp[1]]) : null);
  },
  set: function (path, data) {
    if (this.mode === 'fb') return this.fs.doc(path).set(fbEncode(clone(data)));
    if (this.mode === 'db') return this.db.doc(path).set(clone(data));
    var sp = this._split(path);
    (this.local[sp[0]] = this.local[sp[0]] || {})[sp[1]] = clone(data);
    this._persist(); this._notify(sp[0]);
    return Promise.resolve();
  },
  update: function (path, data) {
    var self = this;
    // Fusion profonde (les objets imbriqués sont fusionnés, les tableaux remplacés), document créé s'il n'existe pas
    if (this.mode === 'fb') return this.fs.doc(path).set(fbEncode(clone(data)), { merge: true });
    if (this.mode === 'db') {
      return this.db.doc(path).update(clone(data)).catch(function (e) {
        if (e && e.code === 'invalid_argument') return self.db.doc(path).get().then(function (s) {
          if (!s.exists) return self.db.doc(path).set(clone(data));
          throw e;
        });
        throw e;
      });
    }
    var sp = this._split(path);
    var c = (this.local[sp[0]] = this.local[sp[0]] || {});
    c[sp[1]] = deepMerge(c[sp[1]] || {}, data);
    this._persist(); this._notify(sp[0]);
    return Promise.resolve();
  },
  del: function (path) {
    if (this.mode === 'fb') return this.fs.doc(path).delete();
    if (this.mode === 'db') return this.db.doc(path).delete();
    var sp = this._split(path);
    if (this.local[sp[0]]) delete this.local[sp[0]][sp[1]];
    this._persist(); this._notify(sp[0]);
    return Promise.resolve();
  },
  listIds: function (coll) {
    if (this.mode === 'fb') return this.fs.collection(coll).get().then(function (snap) { return snap.docs.map(function (d) { return d.id; }); }).catch(function () { return []; });
    if (this.mode === 'db') return this.db.collection(coll).get().then(function (snap) { return snap.docs.filter(function (d) { return d.exists; }).map(function (d) { return d.id; }); }).catch(function () { return []; });
    return Promise.resolve(Object.keys(this.local[coll] || {}));
  },
  lock: function (path, holder, ttl) {
    if (this.mode === 'fb') {
      var fs = this.fs, ref = fs.doc('locks/' + path.replace(/\//g, '_'));
      return fs.runTransaction(function (tx) {
        return tx.get(ref).then(function (s) {
          var d = s.exists ? s.data() : null, now = Date.now();
          if (d && d.h !== holder && d.exp > now) return false;
          tx.set(ref, { h: holder, exp: now + (ttl || 15000) });
          return true;
        });
      }).catch(function () { return false; });
    }
    if (this.mode !== 'db') return Promise.resolve(true);
    return this.db.doc(path).acquire({ holder: holder, ttlMs: ttl || 15000 }).then(function (r) { return !!r.acquired; }).catch(function () { return false; });
  },
  wipeLocal: function () {
    this.local = {};
    try { localStorage.removeItem(LS_KEY); } catch (e) { }
    var self = this;
    ['game', 'clubs', 'offers', 'ledger', 'auctions', 'cups', 'league', 'matches'].forEach(function (c) { self._notify(c); });
  }
};
