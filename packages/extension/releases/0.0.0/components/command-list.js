import { forwardRef } from 'react';
import { UiCommandItem, UiCommandList } from '@repo/ui';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

var L=UiCommandList,p=forwardRef(({prefix:e,title:r,value:i,onSelect:m,subtitle:s,children:n},d)=>jsx(UiCommandItem,{ref:d,value:i,onSelect:m,className:"group aria-selected:bg-secondary min-h-12",children:n||jsxs(Fragment,{children:[e&&jsx("span",{className:"h-8 w-8 mr-2 inline-flex items-center justify-center",children:e}),jsxs("div",{children:[jsx("p",{className:"leading-tight",children:r}),jsx("p",{className:"text-muted-foreground leading-tight",children:s})]})]})}));p.displayName="ExtCommandListItem";var u=forwardRef(({icon:e},r)=>jsx("span",{ref:r,className:"group-aria-selected:bg-secondary-hover  group-aria-selected:text-foreground text-muted-foreground inline-flex justify-center items-center bg-secondary rounded-sm border border-border/40 h-full w-full",children:typeof e=="string"?e:jsx(e,{className:"h-4 w-4"})}));u.displayName="ExtCommandListIcon";

export { L as ExtCommandList, u as ExtCommandListIcon, p as ExtCommandListItem };
