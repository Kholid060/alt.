var O = Object.defineProperty;
var C = (c, i, s) => i in c ? O(c, i, { enumerable: !0, configurable: !0, writable: !0, value: s }) : c[i] = s;
var E = (c, i, s) => (C(c, typeof i != "symbol" ? i + "" : i, s), s);
import { jsx as x } from "react/jsx-runtime";
import b from "react";
import { ExtensionProvider as P } from "./context/extension.context.js";
function M(c) {
  return c && c.__esModule && Object.prototype.hasOwnProperty.call(c, "default") ? c.default : c;
}
var L = { exports: {} };
(function(c) {
  var i = Object.prototype.hasOwnProperty, s = "~";
  function d() {
  }
  Object.create && (d.prototype = /* @__PURE__ */ Object.create(null), new d().__proto__ || (s = !1));
  function g(o, t, n) {
    this.fn = o, this.context = t, this.once = n || !1;
  }
  function w(o, t, n, r, p) {
    if (typeof n != "function")
      throw new TypeError("The listener must be a function");
    var l = new g(n, r || o, p), a = s ? s + t : t;
    return o._events[a] ? o._events[a].fn ? o._events[a] = [o._events[a], l] : o._events[a].push(l) : (o._events[a] = l, o._eventsCount++), o;
  }
  function _(o, t) {
    --o._eventsCount === 0 ? o._events = new d() : delete o._events[t];
  }
  function u() {
    this._events = new d(), this._eventsCount = 0;
  }
  u.prototype.eventNames = function() {
    var t = [], n, r;
    if (this._eventsCount === 0)
      return t;
    for (r in n = this._events)
      i.call(n, r) && t.push(s ? r.slice(1) : r);
    return Object.getOwnPropertySymbols ? t.concat(Object.getOwnPropertySymbols(n)) : t;
  }, u.prototype.listeners = function(t) {
    var n = s ? s + t : t, r = this._events[n];
    if (!r)
      return [];
    if (r.fn)
      return [r.fn];
    for (var p = 0, l = r.length, a = new Array(l); p < l; p++)
      a[p] = r[p].fn;
    return a;
  }, u.prototype.listenerCount = function(t) {
    var n = s ? s + t : t, r = this._events[n];
    return r ? r.fn ? 1 : r.length : 0;
  }, u.prototype.emit = function(t, n, r, p, l, a) {
    var h = s ? s + t : t;
    if (!this._events[h])
      return !1;
    var e = this._events[h], v = arguments.length, m, f;
    if (e.fn) {
      switch (e.once && this.removeListener(t, e.fn, void 0, !0), v) {
        case 1:
          return e.fn.call(e.context), !0;
        case 2:
          return e.fn.call(e.context, n), !0;
        case 3:
          return e.fn.call(e.context, n, r), !0;
        case 4:
          return e.fn.call(e.context, n, r, p), !0;
        case 5:
          return e.fn.call(e.context, n, r, p, l), !0;
        case 6:
          return e.fn.call(e.context, n, r, p, l, a), !0;
      }
      for (f = 1, m = new Array(v - 1); f < v; f++)
        m[f - 1] = arguments[f];
      e.fn.apply(e.context, m);
    } else {
      var A = e.length, y;
      for (f = 0; f < A; f++)
        switch (e[f].once && this.removeListener(t, e[f].fn, void 0, !0), v) {
          case 1:
            e[f].fn.call(e[f].context);
            break;
          case 2:
            e[f].fn.call(e[f].context, n);
            break;
          case 3:
            e[f].fn.call(e[f].context, n, r);
            break;
          case 4:
            e[f].fn.call(e[f].context, n, r, p);
            break;
          default:
            if (!m)
              for (y = 1, m = new Array(v - 1); y < v; y++)
                m[y - 1] = arguments[y];
            e[f].fn.apply(e[f].context, m);
        }
    }
    return !0;
  }, u.prototype.on = function(t, n, r) {
    return w(this, t, n, r, !1);
  }, u.prototype.once = function(t, n, r) {
    return w(this, t, n, r, !0);
  }, u.prototype.removeListener = function(t, n, r, p) {
    var l = s ? s + t : t;
    if (!this._events[l])
      return this;
    if (!n)
      return _(this, l), this;
    var a = this._events[l];
    if (a.fn)
      a.fn === n && (!p || a.once) && (!r || a.context === r) && _(this, l);
    else {
      for (var h = 0, e = [], v = a.length; h < v; h++)
        (a[h].fn !== n || p && !a[h].once || r && a[h].context !== r) && e.push(a[h]);
      e.length ? this._events[l] = e.length === 1 ? e[0] : e : _(this, l);
    }
    return this;
  }, u.prototype.removeAllListeners = function(t) {
    var n;
    return t ? (n = s ? s + t : t, this._events[n] && _(this, n)) : (this._events = new d(), this._eventsCount = 0), this;
  }, u.prototype.off = u.prototype.removeListener, u.prototype.addListener = u.prototype.on, u.prefixed = s, u.EventEmitter = u, c.exports = u;
})(L);
var j = L.exports;
const k = /* @__PURE__ */ M(j);
var H = class extends k {
  constructor(i) {
    super();
    E(this, "port");
    this.port = i, this.port.addEventListener("message", this._messageHandler.bind(this)), this.port.start();
  }
  _messageHandler(i) {
    typeof i.data != "object" || Array.isArray(i.data) || !Array.isArray(i.data.data) || !i.data.name || this.emit(i.data.name, ...i.data.data);
  }
  sendMessage(i, ...s) {
    this.port.postMessage({ data: s, name: i });
  }
  destroy() {
    this.removeAllListeners(), this.port.removeEventListener("message", this._messageHandler), this.port.close();
  }
}, R = H;
function F(c) {
  const i = b.memo(c);
  return function({ messagePort: d }) {
    const g = new R(
      d
    );
    return /* @__PURE__ */ x(b.StrictMode, { children: /* @__PURE__ */ x(P, { messagePort: g, children: /* @__PURE__ */ x(i, {}) }) });
  };
}
export {
  F as default
};
