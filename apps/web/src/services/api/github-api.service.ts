import { afetch } from '@/utils/afetch';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/';

export interface GithubRepoContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  type: string;
  git_url: string;
  content?: string;
  html_url: string;
  download_url: string;
}

class GithubAPIService {
  static instance = new GithubAPIService();

  static getRawURL(path: string, isBase?: false): string;
  static getRawURL(path: string, isBase: true): (path: string) => string;
  static getRawURL(
    path: string,
    isBase?: boolean,
  ): string | ((path: string) => string) {
    if (isBase) {
      return (nestedPath) => `${GITHUB_RAW_BASE_URL}${path}${nestedPath}`;
    }

    return `${GITHUB_RAW_BASE_URL}${path}`;
  }

  fetch<T = unknown>(path: string, init?: RequestInit) {
    return afetch<T>(`${GITHUB_API_BASE_URL}${path}`, init);
  }

  getRepoContents(owner: string, repo: string, path = '') {
    return this.fetch<GithubRepoContent | GithubRepoContent[]>(
      `/repos/${owner}/${repo}/contents/${path}`,
    );
  }
}

export default GithubAPIService;
