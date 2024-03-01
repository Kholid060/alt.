import { ExtensionManifest } from '@repo/extension-core/dist/index';
export { default as Extension } from '@repo/extension-core/types/extension-api';
export { UiImage as ExtImage } from '@repo/ui';
import * as lucide_react from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import * as react from 'react';
import react__default from 'react';
import { AMessagePort } from '@repo/shared';

declare const ExtIcon: {
    Clipboard: lucide_react.LucideIcon;
    BadgeDollarSign: lucide_react.LucideIcon;
    Atom: lucide_react.LucideIcon;
    AudioLines: lucide_react.LucideIcon;
    BarChartBig: lucide_react.LucideIcon;
    BellOff: lucide_react.LucideIcon;
    Bell: lucide_react.LucideIcon;
    BellRing: lucide_react.LucideIcon;
    Bike: lucide_react.LucideIcon;
    Book: lucide_react.LucideIcon;
    BookMarked: lucide_react.LucideIcon;
    BookOpen: lucide_react.LucideIcon;
    Bookmark: lucide_react.LucideIcon;
    Braces: lucide_react.LucideIcon;
    Bird: lucide_react.LucideIcon;
    Bitcoin: lucide_react.LucideIcon;
    Brush: lucide_react.LucideIcon;
    Calculator: lucide_react.LucideIcon;
    Cake: lucide_react.LucideIcon;
    CaseSensitive: lucide_react.LucideIcon;
    CheckCheck: lucide_react.LucideIcon;
    Check: lucide_react.LucideIcon;
    CheckCircle: lucide_react.LucideIcon;
    ChevronDown: lucide_react.LucideIcon;
    ChevronsDown: lucide_react.LucideIcon;
    CircleUserRound: lucide_react.LucideIcon;
    Circle: lucide_react.LucideIcon;
    ClipboardCheck: lucide_react.LucideIcon;
    ClipboardList: lucide_react.LucideIcon;
    Clock1: lucide_react.LucideIcon;
    Clock3: lucide_react.LucideIcon;
    CloudHail: lucide_react.LucideIcon;
    CloudLightning: lucide_react.LucideIcon;
    CloudMoon: lucide_react.LucideIcon;
    CloudRain: lucide_react.LucideIcon;
    CloudSunRain: lucide_react.LucideIcon;
    CloudSun: lucide_react.LucideIcon;
    Cloud: lucide_react.LucideIcon;
    Code2: lucide_react.LucideIcon;
    Coffee: lucide_react.LucideIcon;
    Compass: lucide_react.LucideIcon;
    Command: lucide_react.LucideIcon;
    CornerDownRight: lucide_react.LucideIcon;
    Crop: lucide_react.LucideIcon;
    Database: lucide_react.LucideIcon;
    DatabaseBackup: lucide_react.LucideIcon;
    Expand: lucide_react.LucideIcon;
    Divide: lucide_react.LucideIcon;
    Equal: lucide_react.LucideIcon;
    Eye: lucide_react.LucideIcon;
    FileArchive: lucide_react.LucideIcon;
    FileAudio: lucide_react.LucideIcon;
    FileCode: lucide_react.LucideIcon;
    FileJson: lucide_react.LucideIcon;
    FileLock: lucide_react.LucideIcon;
    FileSearch: lucide_react.LucideIcon;
    FileVideo: lucide_react.LucideIcon;
    File: lucide_react.LucideIcon;
    Filter: lucide_react.LucideIcon;
    Files: lucide_react.LucideIcon;
    Film: lucide_react.LucideIcon;
    FolderArchive: lucide_react.LucideIcon;
    Folder: lucide_react.LucideIcon;
    FolderOpen: lucide_react.LucideIcon;
    FolderTree: lucide_react.LucideIcon;
    Gamepad: lucide_react.LucideIcon;
    GitBranchPlus: lucide_react.LucideIcon;
    GitBranch: lucide_react.LucideIcon;
    GitCommitHorizontal: lucide_react.LucideIcon;
    GitCompare: lucide_react.LucideIcon;
    GitFork: lucide_react.LucideIcon;
    GitMerge: lucide_react.LucideIcon;
    GitPullRequestArrow: lucide_react.LucideIcon;
    GitPullRequestCreateArrow: lucide_react.LucideIcon;
    GitPullRequestDraft: lucide_react.LucideIcon;
    HardDrive: lucide_react.LucideIcon;
    Image: lucide_react.LucideIcon;
    ImagePlus: lucide_react.LucideIcon;
    Images: lucide_react.LucideIcon;
    Languages: lucide_react.LucideIcon;
    Laptop: lucide_react.LucideIcon;
    Layers: lucide_react.LucideIcon;
    LayoutDashboard: lucide_react.LucideIcon;
    Mail: lucide_react.LucideIcon;
    MailCheck: lucide_react.LucideIcon;
    MailOpen: lucide_react.LucideIcon;
    MailPlus: lucide_react.LucideIcon;
    MailX: lucide_react.LucideIcon;
    Mails: lucide_react.LucideIcon;
    MapPin: lucide_react.LucideIcon;
    Map: lucide_react.LucideIcon;
    MapPinned: lucide_react.LucideIcon;
    MousePointer2: lucide_react.LucideIcon;
    MousePointerClick: lucide_react.LucideIcon;
    Mouse: lucide_react.LucideIcon;
    Plus: lucide_react.LucideIcon;
    PlusCircle: lucide_react.LucideIcon;
    Pipette: lucide_react.LucideIcon;
    PlaneLanding: lucide_react.LucideIcon;
    PlaneTakeoff: lucide_react.LucideIcon;
    Plane: lucide_react.LucideIcon;
    PlayCircle: lucide_react.LucideIcon;
    Play: lucide_react.LucideIcon;
    Power: lucide_react.LucideIcon;
    PowerCircle: lucide_react.LucideIcon;
    RadioTower: lucide_react.LucideIcon;
    RotateCw: lucide_react.LucideIcon;
    Ruler: lucide_react.LucideIcon;
    ScanBarcode: lucide_react.LucideIcon;
    ScanLine: lucide_react.LucideIcon;
    Search: lucide_react.LucideIcon;
    ScrollText: lucide_react.LucideIcon;
    Settings: lucide_react.LucideIcon;
    StepForward: lucide_react.LucideIcon;
    SkipForward: lucide_react.LucideIcon;
    SunDim: lucide_react.LucideIcon;
    SunMedium: lucide_react.LucideIcon;
    SunMoon: lucide_react.LucideIcon;
    Sun: lucide_react.LucideIcon;
    ShoppingCart: lucide_react.LucideIcon;
    Sparkle: lucide_react.LucideIcon;
    Sparkles: lucide_react.LucideIcon;
    SquarePen: lucide_react.LucideIcon;
    Star: lucide_react.LucideIcon;
    StarOff: lucide_react.LucideIcon;
    StickyNote: lucide_react.LucideIcon;
    Store: lucide_react.LucideIcon;
    Tag: lucide_react.LucideIcon;
    Terminal: lucide_react.LucideIcon;
    TerminalSquare: lucide_react.LucideIcon;
    ThumbsUp: lucide_react.LucideIcon;
    ThumbsDown: lucide_react.LucideIcon;
    TicketPercent: lucide_react.LucideIcon;
    Timer: lucide_react.LucideIcon;
    TimerOff: lucide_react.LucideIcon;
    ToggleRight: lucide_react.LucideIcon;
    Undo: lucide_react.LucideIcon;
    UnlockKeyhole: lucide_react.LucideIcon;
    User: lucide_react.LucideIcon;
    Users: lucide_react.LucideIcon;
    Video: lucide_react.LucideIcon;
    Volume1: lucide_react.LucideIcon;
    VolumeX: lucide_react.LucideIcon;
    Volume2: lucide_react.LucideIcon;
    Volume: lucide_react.LucideIcon;
    Wallet: lucide_react.LucideIcon;
    Wand: lucide_react.LucideIcon;
    Wifi: lucide_react.LucideIcon;
    WifiOff: lucide_react.LucideIcon;
    XCircle: lucide_react.LucideIcon;
};

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

declare enum ExtensionExecutionFinishReason {
    done = 0,
    error = 1,
    timeout = 2
}
interface ExtensionMessagePortEvent {
    'extension:init': [];
    'extension:query-change': [string];
    'extension:keydown-event': [
        Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'isComposing'>
    ];
    'extension:finish-execute': [ExtensionExecutionFinishReason, string?];
}
type ExtensionMessagePortCallback<T extends keyof ExtensionMessagePortEvent> = (...args: ExtensionMessagePortEvent[T]) => void;

type ExtensionCommandView = () => react__default.ReactNode;
type ExtensionCommandRenderer = (detail: {
    messagePort: AMessagePort<ExtensionMessagePortEvent>;
}) => react__default.ReactNode;
declare function commandRenderer(CommandView: ExtensionCommandView): ExtensionCommandRenderer;

type Manifest = Omit<ExtensionManifest, '$apiVersion'>;

export { type ExtCommandItemProps, ExtCommandList, ExtCommandListIcon, ExtCommandListItem, ExtIcon, ExtensionExecutionFinishReason, type ExtensionMessagePortCallback, type ExtensionMessagePortEvent, type Manifest, commandRenderer };
