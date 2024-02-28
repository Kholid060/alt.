import { jsx as d, jsxs as x } from "react/jsx-runtime";
import { UiCommandInput as p, UiCommand as v } from "@repo/ui";
import { createContext as C, forwardRef as h, useRef as w, useState as E, useEffect as b } from "react";
const q = C({
  query: ""
}), y = h(({ value: e }, n) => /* @__PURE__ */ d(p, { ref: n, value: e, rootClass: "hidden", style: { display: "none" } }));
y.displayName = "CommandInput";
function R({
  children: e,
  messagePort: n,
  value: f
}) {
  const i = w(null), [o, l] = E(() => f ?? "");
  return b(() => {
    const u = (t) => {
      l(t);
    }, r = (t) => {
      var c;
      (c = i.current) == null || c.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: !0, ...t })
      );
    };
    return n == null || n.addListener("extension:query-change", u), n == null || n.addListener("extension:keydown-event", r), () => {
      n == null || n.removeListener("extension:query-change", u), n == null || n.removeListener("extension:keydown-event", r);
    };
  }, [n]), /* @__PURE__ */ d(q.Provider, { value: { query: o }, children: /* @__PURE__ */ x(v, { ref: i, children: [
    /* @__PURE__ */ d(y, { value: o }),
    e
  ] }) });
}
export {
  q as ExtensionContext,
  R as ExtensionProvider
};
