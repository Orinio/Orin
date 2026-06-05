export interface Tool {
  name: string;
  description: string;
  category: 'verification' | 'search' | 'analysis' | 'safety' | 'data';
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
  execute: (args: Record<string, any>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface AgentResponse {
  thinking?: string;
  tool_call?: ToolCall;
  answer?: string;
}

// SSRF protection: validate URLs before fetching
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS metadata
  'metadata.google.internal', // GCP metadata
  '100.100.100.200', // Alibaba metadata
];

const BLOCKED_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
];

export function isUrlSafe(url: string): { safe: boolean; reason?: string } {
  try {
    const urlObj = new URL(url);

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { safe: false, reason: 'Only HTTP/HTTPS URLs are allowed' };
    }

    const hostname = urlObj.hostname.toLowerCase();

    // Check blocked hosts
    if (BLOCKED_HOSTS.includes(hostname)) {
      return { safe: false, reason: 'Internal URLs are blocked' };
    }

    // Check blocked IP ranges
    for (const pattern of BLOCKED_IP_RANGES) {
      if (pattern.test(hostname)) {
        return { safe: false, reason: 'Internal IP addresses are blocked' };
      }
    }

    // Block metadata endpoints
    if (hostname.endsWith('.internal') || hostname.endsWith('.local')) {
      return { safe: false, reason: 'Internal hostnames are blocked' };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

// ============================================================
// VERIFICATION TOOLS
// ============================================================
// VERIFICATION TOOLS
// ============================================================

export const verifyGithubRepoTool: Tool = {
  name: 'verify_github_repo',
  description: 'Verify if a GitHub repository exists and get detailed information (stars, forks, language, description, topics, license)',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'GitHub repository URL (e.g., https://github.com/user/repo)' }
    },
    required: ['url']
  },
  execute: async (args) => {
    try {
      const { url } = args;
      const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (!match) return { success: false, error: 'Invalid GitHub URL format' };
      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');

      const res = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-Proof-Verifier' }
      });

      if (!res.ok) return { success: true, data: { exists: false, status: res.status, message: `Repository not found (${res.status})` } };

      const data = await res.json();
      return {
        success: true,
        data: {
          exists: true,
          name: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          watchers: data.watchers_count,
          language: data.language,
          topics: data.topics || [],
          license: data.license?.name || 'None',
          created_at: data.created_at,
          updated_at: data.updated_at,
          pushed_at: data.pushed_at,
          size_kb: data.size,
          open_issues: data.open_issues_count,
          default_branch: data.default_branch,
          is_fork: data.fork,
          is_archived: data.archived,
          owner: { login: data.owner.login, type: data.owner.type, avatar_url: data.owner.avatar_url }
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

export const verifyGithubUserTool: Tool = {
  name: 'verify_github_user',
  description: 'Verify if a GitHub user exists and get their profile information',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      username: { type: 'string', description: 'GitHub username' }
    },
    required: ['username']
  },
  execute: async (args) => {
    try {
      const { username } = args;
      const res = await fetch(`https://api.github.com/users/${username}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-Proof-Verifier' }
      });

      if (!res.ok) return { success: true, data: { exists: false, status: res.status } };

      const data = await res.json();
      return {
        success: true,
        data: {
          exists: true,
          login: data.login,
          name: data.name,
          bio: data.bio,
          public_repos: data.public_repos,
          followers: data.followers,
          following: data.following,
          created_at: data.created_at,
          avatar_url: data.avatar_url,
          location: data.location,
          company: data.company,
          blog: data.blog
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

export const verifyCertificateTool: Tool = {
  name: 'verify_certificate',
  description: 'Verify if a certificate URL is valid and accessible. Supports Coursera, Udemy, edX, LinkedIn Learning, HackerRank, LeetCode',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Certificate verification URL' }
    },
    required: ['url']
  },
  execute: async (args) => {
    try {
      const { url } = args;
      const urlObj = new URL(url);
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

      const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });

      return {
        success: true,
        data: {
          exists: res.ok,
          status: res.status,
          platform,
          accessible: res.status === 200,
          redirected: res.redirected,
          final_url: res.url
        }
      };
    } catch (error) {
      return { success: true, data: { exists: false, error: error instanceof Error ? error.message : 'Timeout', accessible: false } };
    }
  }
};

export const verifyKaggleTool: Tool = {
  name: 'verify_kaggle',
  description: 'Verify if a Kaggle notebook or dataset exists',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Kaggle notebook or dataset URL' }
    },
    required: ['url']
  },
  execute: async (args) => {
    try {
      const { url } = args;
      const isNotebook = url.includes('/code/') || url.includes('/kernels/');
      const isDataset = url.includes('/datasets/');
      const type = isNotebook ? 'notebook' : isDataset ? 'dataset' : 'unknown';

      const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });

      return {
        success: true,
        data: {
          exists: res.ok,
          status: res.status,
          type,
          accessible: res.status === 200,
          platform: 'Kaggle'
        }
      };
    } catch (error) {
      return { success: true, data: { exists: false, error: error instanceof Error ? error.message : 'Timeout', accessible: false } };
    }
  }
};

export const verifyLinkedInTool: Tool = {
  name: 'verify_linkedin',
  description: 'Verify if a LinkedIn profile URL is valid format',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'LinkedIn profile URL' }
    },
    required: ['url']
  },
  execute: async (args) => {
    try {
      const { url } = args;
      const isValidFormat = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(url);
      const username = url.match(/linkedin\.com\/in\/([^\/\?]+)/)?.[1] || null;

      return {
        success: true,
        data: {
          valid_format: isValidFormat,
          username,
          platform: 'LinkedIn',
          note: 'LinkedIn blocks automated access. Profile exists if format is valid.'
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// ============================================================
// SEARCH TOOLS
// ============================================================

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for information about a topic, person, or certificate',
  category: 'search',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      num_results: { type: 'number', description: 'Number of results (default 5)' }
    },
    required: ['query']
  },
  execute: async (args) => {
    try {
      const { query, num_results = 5 } = args;
      const apiKey = process.env.SERPAPI_KEY || process.env.GOOGLE_SEARCH_API_KEY;

      if (!apiKey) {
        return {
          success: true,
          data: {
            query,
            results: [],
            message: 'Web search requires API key configuration (SERPAPI_KEY or GOOGLE_SEARCH_API_KEY)',
            alternative: 'Use direct verification tools instead'
          }
        };
      }

      const res = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${num_results}`);
      const data = await res.json();

      return {
        success: true,
        data: {
          query,
          results: (data.organic_results || []).slice(0, num_results).map((r: any) => ({
            title: r.title,
            url: r.link,
            snippet: r.snippet,
            position: r.position
          }))
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

export const fetchWebpageTool: Tool = {
  name: 'fetch_webpage',
  description: 'Fetch and extract text content from a webpage URL',
  category: 'search',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to fetch' },
      max_length: { type: 'number', description: 'Max characters to return (default 2000)' }
    },
    required: ['url']
  },
  execute: async (args) => {
    try {
      const { url, max_length = 2000 } = args;

      // SSRF protection
      const urlCheck = isUrlSafe(url);
      if (!urlCheck.safe) {
        return { success: false, error: urlCheck.reason };
      }

      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Orin-Bot/1.0' }
      });

      const html = await res.text();
      const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                       .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                       .replace(/<[^>]+>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim()
                       .substring(0, max_length);

      return {
        success: true,
        data: {
          url,
          status: res.status,
          content_type: res.headers.get('content-type'),
          text_length: text.length,
          text
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Timeout' };
    }
  }
};

// ============================================================
// ANALYSIS TOOLS
// ============================================================

export const analyzeCodeTool: Tool = {
  name: 'analyze_code',
  description: 'Analyze code from a GitHub repository file',
  category: 'analysis',
  parameters: {
    type: 'object',
    properties: {
      repo_url: { type: 'string', description: 'GitHub repository URL' },
      file_path: { type: 'string', description: 'Path to file in repo' }
    },
    required: ['repo_url', 'file_path']
  },
  execute: async (args) => {
    try {
      const { repo_url, file_path } = args;
      const match = repo_url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (!match) return { success: false, error: 'Invalid GitHub URL' };

      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');

      // First, get the default branch from GitHub API
      let defaultBranch = 'main';
      try {
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
          headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-Proof-Verifier' }
        });
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          defaultBranch = repoData.default_branch || 'main';
        }
      } catch {
        // Fallback to trying main then master
      }

      const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${defaultBranch}/${file_path}`;

      // SSRF protection
      const urlCheck = isUrlSafe(rawUrl);
      if (!urlCheck.safe) {
        return { success: false, error: urlCheck.reason };
      }

      let res = await fetch(rawUrl);
      if (!res.ok && defaultBranch !== 'master') {
        const masterUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/master/${file_path}`;
        res = await fetch(masterUrl);
      }

      if (!res.ok) return { success: false, error: 'File not found' };

      const code = await res.text();
      const lines = code.split('\n');
      const imports = lines.filter(l => l.match(/^import|^require|^from|^using/));
      const functions = lines.filter(l => l.match(/function |def |const.*=.*=>|class /));
      const comments = lines.filter(l => l.match(/^\/\/|^#|^\/\*|^\*|^\/\//));

      return {
        success: true,
        data: {
          file: file_path,
          language: file_path.split('.').pop(),
          lines: lines.length,
          imports: imports.length,
          functions: functions.length,
          comments: comments.length,
          code_preview: code.substring(0, 500),
          has_tests: code.includes('test') || code.includes('spec') || code.includes('describe('),
          has_types: code.includes(': string') || code.includes(': number') || code.includes('interface ') || code.includes('type ')
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

export const extractSkillsTool: Tool = {
  name: 'extract_skills',
  description: 'Extract technical skills from text content (proof description, resume, etc.)',
  category: 'analysis',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to extract skills from' }
    },
    required: ['text']
  },
  execute: async (args) => {
    try {
      const { text } = args;
      const skillPatterns: Record<string, string[]> = {
        'Programming Languages': ['javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql'],
        'Web Frameworks': ['react', 'next\\.?js', 'vue', 'angular', 'svelte', 'node\\.?js', 'express', 'django', 'flask', 'fastapi', 'rails', 'spring'],
        'Cloud & DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab'],
        'Databases': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'firebase', 'supabase', 'prisma', 'sequelize'],
        'Data Science': ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'matplotlib', 'jupyter', 'machine learning', 'deep learning', 'nlp'],
        'Tools': ['git', 'github', 'vs code', 'figma', 'postman', 'jira', 'notion', 'slack', 'docker', 'webpack', 'vite'],
        'Soft Skills': ['leadership', 'communication', 'teamwork', 'problem solving', 'project management', 'agile', 'scrum']
      };

      const found: Record<string, string[]> = {};
      const lowerText = text.toLowerCase();

      for (const [category, skills] of Object.entries(skillPatterns)) {
        const matched = skills.filter(skill => {
          const regex = new RegExp(skill, 'i');
          return regex.test(lowerText);
        });
        if (matched.length > 0) found[category] = matched;
      }

      const allSkills = Object.values(found).flat();

      return {
        success: true,
        data: {
          total_skills: allSkills.length,
          categories: found,
          all_skills: allSkills
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

export const analyzePortfolioTool: Tool = {
  name: 'analyze_portfolio',
  description: 'Analyze a complete proof portfolio and provide insights',
  category: 'analysis',
  parameters: {
    type: 'object',
    properties: {
      proofs: { type: 'string', description: 'JSON array of proof objects' }
    },
    required: ['proofs']
  },
  execute: async (args) => {
    try {
      const proofs = JSON.parse(args.proofs);
      const totalProofs = proofs.length;
      const verifiedCount = proofs.filter((p: any) => p.verification_status === 'verified').length;
      const sourceTypes = proofs.reduce((acc: Record<string, number>, p: any) => {
        acc[p.source_type] = (acc[p.source_type] || 0) + 1;
        return acc;
      }, {});

      const allSkills = [...new Set(proofs.flatMap((p: any) => [...(p.skills_extracted || []), ...(p.skills_user_added || [])]))];
      const skillCounts = allSkills.map(skill => ({
        name: skill,
        count: proofs.filter((p: any) => [...(p.skills_extracted || []), ...(p.skills_user_added || [])].includes(skill)).length
      })).sort((a: any, b: any) => b.count - a.count);

      return {
        success: true,
        data: {
          total_proofs: totalProofs,
          verified: verifiedCount,
          verification_rate: totalProofs > 0 ? Math.round((verifiedCount / totalProofs) * 100) : 0,
          source_types: sourceTypes,
          unique_skills: allSkills.length,
          top_skills: skillCounts.slice(0, 10),
          suggestions: [
            totalProofs < 5 ? 'Add more proofs to strengthen your portfolio' : null,
            verifiedCount < totalProofs ? 'Get more proofs verified for credibility' : null,
            allSkills.length < 5 ? 'Add more skills to improve discoverability' : null,
            !sourceTypes['github'] ? 'Consider adding GitHub projects' : null,
            !sourceTypes['certificate'] ? 'Add certificates to validate skills' : null
          ].filter(Boolean)
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// ============================================================
// SAFETY TOOLS
// ============================================================

export const checkUrlSafetyTool: Tool = {
  name: 'check_url_safety',
  description: 'Check if a URL is safe and not malicious',
  category: 'safety',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to check' }
    },
    required: ['url']
  },
  execute: async (args) => {
    try {
      const { url } = args;
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      const suspiciousPatterns = [
        /bit\.ly/, /tinyurl/, /t\.co/, /goo\.gl/, /is\.gd/,
        /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
        /phishing/, /malware/, /hack/, /crack/
      ];

      const isSuspicious = suspiciousPatterns.some(p => p.test(url));
      const isHttp = urlObj.protocol === 'http:';
      const hasPort = urlObj.port && urlObj.port !== '80' && urlObj.port !== '443';

      const trustedDomains = [
        'github.com', 'gitlab.com', 'bitbucket.org',
        'coursera.org', 'udemy.com', 'edx.org',
        'kaggle.com', 'leetcode.com', 'hackerrank.com',
        'linkedin.com', 'twitter.com', 'dev.to',
        'medium.com', 'stackoverflow.com',
        'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com'
      ];

      const isTrusted = trustedDomains.some(d => domain.includes(d));

      return {
        success: true,
        data: {
          url,
          domain,
          is_safe: !isSuspicious && !isHttp,
          is_trusted: isTrusted,
          is_suspicious: isSuspicious,
          uses_https: !isHttp,
          has_port: hasPort,
          warnings: [
            isSuspicious ? 'URL contains suspicious patterns' : null,
            isHttp ? 'URL uses HTTP (not HTTPS)' : null,
            hasPort ? 'URL uses non-standard port' : null
          ].filter(Boolean)
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Invalid URL' };
    }
  }
};

export const validateEmailTool: Tool = {
  name: 'validate_email',
  description: 'Validate if an email address format is valid',
  category: 'safety',
  parameters: {
    type: 'object',
    properties: {
      email: { type: 'string', description: 'Email address to validate' }
    },
    required: ['email']
  },
  execute: async (args) => {
    try {
      const { email } = args;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      const [, domain] = email.split('@');
      const disposableDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com'];
      const isDisposable = disposableDomains.includes(domain);

      return {
        success: true,
        data: {
          email,
          valid_format: isValid,
          domain,
          is_disposable: isDisposable,
          is_valid: isValid && !isDisposable
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// ============================================================
// DATA TOOLS
// ============================================================

export const generateEmbeddingsTool: Tool = {
  name: 'generate_embeddings',
  description: 'Generate embeddings for text using NVIDIA NIM embedding models',
  category: 'data',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to generate embeddings for' },
      model: { type: 'string', description: 'Model to use (default: nvidia/nv-embed-v1)' }
    },
    required: ['text']
  },
  execute: async (args) => {
    try {
      const { text, model = 'nvidia/nv-embed-v1' } = args;
      const apiKey = process.env.NVIDIA_API_KEY;

      if (!apiKey) return { success: false, error: 'NVIDIA_API_KEY not configured' };

      const res = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, input: text })
      });

      if (!res.ok) return { success: false, error: `Embedding API error: ${res.status}` };

      const data = await res.json();
      return {
        success: true,
        data: {
          model,
          embedding: data.data?.[0]?.embedding,
          dimensions: data.data?.[0]?.embedding?.length,
          tokens_used: data.usage?.total_tokens
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

export const detectLanguageTool: Tool = {
  name: 'detect_language',
  description: 'Detect the programming language of code',
  category: 'data',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code snippet to analyze' }
    },
    required: ['code']
  },
  execute: async (args) => {
    try {
      const { code } = args;
      const patterns: Record<string, RegExp[]> = {
        javascript: [/const\s+\w+\s*=/, /let\s+\w+\s*=/, /var\s+\w+\s*=/, /=>\s*{/, /import\s+.*from/],
        typescript: [/:\s*(string|number|boolean|any)/, /interface\s+\w+/, /type\s+\w+\s*=/],
        python: [/def\s+\w+\s*\(/, /import\s+\w+/, /from\s+\w+\s+import/, /class\s+\w+.*:/],
        java: [/public\s+class/, /private\s+/, /protected\s+/, /System\.out/],
        go: [/func\s+\w+/, /package\s+\w+/, /import\s+\(/],
        rust: [/fn\s+\w+/, /let\s+mut/, /impl\s+\w+/, /pub\s+fn/],
        sql: [/SELECT\s+/i, /FROM\s+/i, /WHERE\s+/i, /INSERT\s+INTO/i]
      };

      const scores: Record<string, number> = {};
      for (const [lang, regexes] of Object.entries(patterns)) {
        scores[lang] = regexes.filter(r => r.test(code)).length;
      }

      const detected = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      return {
        success: true,
        data: {
          language: detected[1] > 0 ? detected[0] : 'unknown',
          confidence: detected[1] / (patterns[detected[0]]?.length || 1),
          scores
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// ============================================================
// EXPORT ALL TOOLS
// ============================================================

export const allTools: Tool[] = [
  verifyGithubRepoTool,
  verifyGithubUserTool,
  verifyCertificateTool,
  verifyKaggleTool,
  verifyLinkedInTool,
  webSearchTool,
  fetchWebpageTool,
  analyzeCodeTool,
  extractSkillsTool,
  analyzePortfolioTool,
  checkUrlSafetyTool,
  validateEmailTool,
  generateEmbeddingsTool,
  detectLanguageTool
];

export function getToolByName(name: string): Tool | undefined {
  return allTools.find(t => t.name === name);
}

export function getToolsByCategory(category: Tool['category']): Tool[] {
  return allTools.filter(t => t.category === category);
}

export function getToolDescriptions(): string {
  return allTools.map(t => `- ${t.name} (${t.category}): ${t.description}`).join('\n');
}
