import { UiCommandInput, UiCommand } from '@repo/ui';
import { createContext, forwardRef, useRef, useState, useEffect } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

var f=createContext({query:""}),d=forwardRef(({value:n},e)=>jsx(UiCommandInput,{ref:e,value:n,rootClass:"hidden",style:{display:"none"}}));d.displayName="CommandInput";function P({children:n,messagePort:e,value:u}){let r=useRef(null),[s,x]=useState(()=>u??"");return useEffect(()=>{let a=t=>{x(t);},i=t=>{r.current?.dispatchEvent(new KeyboardEvent("keydown",{bubbles:!0,...t}));};return e?.addListener("extension:query-change",a),e?.addListener("extension:keydown-event",i),()=>{e?.removeListener("extension:query-change",a),e?.removeListener("extension:keydown-event",i);}},[e]),jsx(f.Provider,{value:{query:s},children:jsxs(UiCommand,{ref:r,children:[jsx(d,{value:s}),n]})})}

export { f as a, P as b };
