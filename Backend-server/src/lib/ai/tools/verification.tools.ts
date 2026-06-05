import type { Tool } from '../core/types.js';

export const verifyGithubRepoTool: Tool = {
  name: 'verify_github_repo',
  description: 'Verify if a GitHub repository exists and get detailed information',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'GitHub repository URL' },
    },
    required: ['url'],
  },
  execute: async (args) => {
    try {
      const match = args.url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (!match) return { success: false, error: 'Invalid GitHub URL format' };
      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');

      const res = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-Proof-Verifier' },
      });

      if (!res.ok) return { success: true, data: { exists: false, status: res.status } };

      const data = await res.json() as any;
      return {
        success: true,
        data: {
          exists: true, name: data.full_name, description: data.description,
          stars: data.stargazers_count, forks: data.forks_count,
          language: data.language, topics: data.topics || [],
          license: data.license?.name || 'None', is_fork: data.fork,
          owner: { login: data.owner.login, type: data.owner.type },
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export const verifyGithubUserTool: Tool = {
  name: 'verify_github_user',
  description: 'Verify if a GitHub user exists and get their profile information',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      username: { type: 'string', description: 'GitHub username' },
    },
    required: ['username'],
  },
  execute: async (args) => {
    try {
      const res = await fetch(`https://api.github.com/users/${args.username}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-Proof-Verifier' },
      });
      if (!res.ok) return { success: true, data: { exists: false, status: res.status } };
      const data = await res.json() as any;
      return {
        success: true,
        data: {
          exists: true, login: data.login, name: data.name, bio: data.bio,
          public_repos: data.public_repos, followers: data.followers,
          created_at: data.created_at,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export const verifyCertificateTool: Tool = {
  name: 'verify_certificate',
  description: 'Verify if a certificate URL is valid and accessible',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Certificate verification URL' },
    },
    required: ['url'],
  },
  execute: async (args) => {
    try {
      const urlObj = new URL(args.url);
      const domain = urlObj.hostname;
      let platform = 'Unknown';
      if (domain.includes('coursera')) platform = 'Coursera';
      else if (domain.includes('udemy')) platform = 'Udemy';
      else if (domain.includes('edx')) platform = 'edX';
      else if (domain.includes('linkedin')) platform = 'LinkedIn Learning';
      else if (domain.includes('hackerrank')) platform = 'HackerRank';
      else if (domain.includes('leetcode')) platform = 'LeetCode';
      else if (domain.includes('aws.amazon')) platform = 'AWS';
      else if (domain.includes('google')) platform = 'Google';
      else if (domain.includes('microsoft')) platform = 'Microsoft';

      const res = await fetch(args.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      return {
        success: true,
        data: { exists: res.ok, status: res.status, platform, accessible: res.status === 200 },
      };
    } catch (error) {
      return { success: true, data: { exists: false, error: error instanceof Error ? error.message : 'Timeout', accessible: false } };
    }
  },
};

export const verifyKaggleTool: Tool = {
  name: 'verify_kaggle',
  description: 'Verify if a Kaggle notebook or dataset exists',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Kaggle notebook or dataset URL' },
    },
    required: ['url'],
  },
  execute: async (args) => {
    try {
      const isNotebook = args.url.includes('/code/') || args.url.includes('/kernels/');
      const isDataset = args.url.includes('/datasets/');
      const type = isNotebook ? 'notebook' : isDataset ? 'dataset' : 'unknown';

      const res = await fetch(args.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      return {
        success: true,
        data: { exists: res.ok, status: res.status, type, accessible: res.status === 200, platform: 'Kaggle' },
      };
    } catch (error) {
      return { success: true, data: { exists: false, error: error instanceof Error ? error.message : 'Timeout', accessible: false } };
    }
  },
};

export const verifyLinkedInTool: Tool = {
  name: 'verify_linkedin',
  description: 'Verify if a LinkedIn profile URL is valid format',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'LinkedIn profile URL' },
    },
    required: ['url'],
  },
  execute: async (args) => {
    try {
      const isValidFormat = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(args.url);
      const username = args.url.match(/linkedin\.com\/in\/([^\/\?]+)/)?.[1] || null;
      return {
        success: true,
        data: { valid_format: isValidFormat, username, platform: 'LinkedIn' },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
