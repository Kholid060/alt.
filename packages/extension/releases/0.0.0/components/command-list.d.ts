import * as react from 'react';
import { LucideIcon } from 'lucide-react';

declare const ExtCommandList: react.ForwardRefExoticComponent<Omit<{
    children?: react.ReactNode;
} & react.HTMLAttributes<HTMLDivElement> & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
interface ExtCommandItemProps extends Omit<React.DetailsHTMLAttributes<HTMLDivElement>, 'children' | 'prefix'> {
    title: string;
    value?: string;
    subtitle?: string;
    onSelect?: () => void;
    prefix?: React.ReactNode;
}
declare const ExtCommandListItem: react.ForwardRefExoticComponent<ExtCommandItemProps & {
    children?: React.ReactNode;
} & react.RefAttributes<HTMLDivElement>>;
declare const ExtCommandListIcon: react.ForwardRefExoticComponent<{
    icon: LucideIcon | string;
} & react.RefAttributes<HTMLSpanElement>>;

export { type ExtCommandItemProps, ExtCommandList, ExtCommandListIcon, ExtCommandListItem };
