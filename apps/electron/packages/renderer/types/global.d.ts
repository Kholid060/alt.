// https://github.com/kenchris/urlpattern-polyfill

type URLPatternInput = URLPatternInit | string;

declare class URLPattern {
  constructor(init?: URLPatternInput, baseURL?: string);

  test(input?: URLPatternInput, baseURL?: string): boolean;

  exec(input?: URLPatternInput, baseURL?: string): URLPatternResult | null;

  readonly protocol: string;
  readonly username: string;
  readonly password: string;
  readonly hostname: string;
  readonly port: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
}

interface URLPatternInit {
  baseURL?: string;
  username?: string;
  password?: string;
  protocol?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
}

declare interface URLPatternResult {
  inputs: [URLPatternInput];
  protocol: URLPatternComponentResult;
  username: URLPatternComponentResult;
  password: URLPatternComponentResult;
  hostname: URLPatternComponentResult;
  port: URLPatternComponentResult;
  pathname: URLPatternComponentResult;
  search: URLPatternComponentResult;
  hash: URLPatternComponentResult;
}

interface URLPatternComponentResult {
  input: string;
  groups: {
    [key: string]: string | undefined;
  };
}

declare interface Element {
  scrollIntoViewIfNeeded(centerIfNeeded?: boolean): void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<Electron.WebviewTag>;
    }
  }
}
