import { ARequestInit, afetch } from '@altdot/shared';
import { EXT_BANNER_NAME_REGEX } from './constant';
import { mergePath } from './helper';

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

export interface GithubRepoPath {
  repo: string;
  owner: string;
  relativePath?: string;
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

  getRepoContents({ repo, owner, relativePath = '' }: GithubRepoPath) {
    return this.fetch<GithubRepoContent | GithubRepoContent[]>(
      `/repos/${owner}/${repo}/contents/${relativePath}`,
    );
  }

  async getExtBanners({ owner, repo, relativePath }: GithubRepoPath) {
    const files = await this.getRepoContents({
      repo,
      owner,
      relativePath: mergePath(relativePath ?? '', 'asset'),
    }).then((result) => (Array.isArray(result) ? result : [result]));
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
