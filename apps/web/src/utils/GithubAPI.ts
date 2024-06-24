import { ARequestInit, afetch } from '@alt-dot/shared';
import { EXT_BANNER_NAME_REGEX } from './constant';

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

class GithubAPI {
  static instance = new GithubAPI();

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

  fetch<T = unknown>(path: string, init?: ARequestInit) {
    return afetch<T>(`${GITHUB_API_BASE_URL}${path}`, init);
  }

  getRepoContents(owner: string, repo: string, path = '') {
    return this.fetch<GithubRepoContent | GithubRepoContent[]>(
      `/repos/${owner}/${repo}/contents/${path}`,
    );
  }

  async getExtBanners(owner: string, repo: string) {
    const files = await this.getRepoContents(owner, repo, 'asset').then(
      (result) => (Array.isArray(result) ? result : [result]),
    );
    const banners: string[] = [];
    for (const file of files) {
      if (file.type === 'file' && EXT_BANNER_NAME_REGEX.test(file.name)) {
        banners.push(file.download_url);
      }
    }

    return banners;
  }
}

export default GithubAPI;
