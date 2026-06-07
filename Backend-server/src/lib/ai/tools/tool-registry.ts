/**
 * Orin AI - Tool Definitions
 * Registers all 17+ tools for AI agents to interact with the world.
 * Delegates storage to core/tool-registry.ts for shared access.
 */

import { registerTool } from '../core/tool-registry.js';
import { logger } from '../../logger.js';
import { supabase } from '../../supabase.js';
import { generateEmbedding } from '../services/embedding.service.js';

// ============================================================
// VERIFICATION TOOLS
// ============================================================

registerTool({
  name: 'verify_github_repo',
  description: 'Verify if a GitHub repository exists and get details (stars, language, description)',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'GitHub repository URL' }
    },
    required: ['url']
  },
  execute: async (args) => {
    try {
      const match = args.url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (!match) return { success: false, error: 'Invalid GitHub URL' };
      
      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');

      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-AI-Agent' }
      });

      if (!response.ok) {
        return { success: false, error: 'Repository not found', data: { exists: false } };
      }

      const data = await response.json() as any;
      return {
        success: true,
        data: {
          exists: true,
          name: data.name,
          fullName: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language,
          topics: data.topics,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          url: data.html_url
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
});

registerTool({
  name: 'verify_github_user',
  description: 'Verify GitHub user profile and get their repositories',
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
      const response = await fetch(`https://api.github.com/users/${args.username}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-AI-Agent' }
      });

      if (!response.ok) {
        return { success: false, error: 'User not found', data: { exists: false } };
      }

      const data = await response.json() as any;
      return {
        success: true,
        data: {
          exists: true,
          username: data.login,
          name: data.name,
          bio: data.bio,
          publicRepos: data.public_repos,
          followers: data.followers,
          following: data.following,
          avatarUrl: data.avatar_url,
          url: data.html_url
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
});

registerTool({
  name: 'verify_certificate',
  description: 'Verify if a certificate URL is valid (supports Coursera, Udemy, edX, AWS, etc.)',
  category: 'verification',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Certificate URL' }
    },
    required: ['url']
  },
  execute: async (args) => {
    try {
      const parsedUrl = new URL(args.url);
      const hostname = parsedUrl.hostname;
      const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '[::1]'];
      if (blocked.includes(hostname) || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
        return { success: false, error: 'URL points to a private/internal address' };
      }

      const response = await fetch(args.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Orin-AI-Agent' }
      });

      const isValid = response.ok;
      const platform = detectPlatform(args.url);

      return {
        success: true,
        data: {
          exists: isValid,
          url: args.url,
          platform,
          statusCode: response.status
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Timeout' };
    }
  }
});

function detectPlatform(url: string): string {
  if (url.includes('coursera.org')) return 'Coursera';
  if (url.includes('udemy.com')) return 'Udemy';
  if (url.includes('edx.org')) return 'edX';
  if (url.includes('aws.amazon.com')) return 'AWS';
  if (url.includes('google.com')) return 'Google';
  if (url.includes('microsoft.com')) return 'Microsoft';
  if (url.includes('kaggle.com')) return 'Kaggle';
  if (url.includes('leetcode.com')) return 'LeetCode';
  return 'Unknown';
}

// ============================================================
// SEARCH TOOLS
// ============================================================

registerTool({
  name: 'web_search',
  description: 'Search the web for information about any topic',
  category: 'search',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      numResults: { type: 'number', description: 'Number of results (default 5)' }
    },
    required: ['query']
  },
  execute: async (args) => {
    try {
      // Use a search API or scrape results
      const apiKey = process.env.SERPAPI_KEY || process.env.GOOGLE_SEARCH_API_KEY;
      
      if (!apiKey) {
        // Fallback: return mock results with a note
        return {
          success: true,
          data: {
            query: args.query,
            results: [],
            message: 'Web search not configured - using AI knowledge instead'
          }
        };
      }

      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(args.query)}&api_key=${apiKey}&num=${args.numResults || 5}`
      );

      const data = await response.json() as any;
      return {
        success: true,
        data: {
          query: args.query,
          results: (data.organic_results || []).slice(0, args.numResults || 5).map((r: any) => ({
            title: r.title,
            url: r.link,
            snippet: r.snippet
          }))
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
    }
  }
});

registerTool({
  name: 'fetch_webpage',
  description: 'Fetch and extract text content from a webpage URL',
  category: 'search',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to fetch' },
      maxLength: { type: 'number', description: 'Max characters (default 2000)' }
    },
    required: ['url']
  },
  execute: async (args) => {
    try {
      const parsedUrl = new URL(args.url);
      const hostname = parsedUrl.hostname;
      const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '[::1]', 'metadata.google.internal'];
      if (blocked.includes(hostname) || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
        return { success: false, error: 'URL points to a private/internal address' };
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { success: false, error: 'Only HTTP(S) URLs are allowed' };
      }

      const response = await fetch(args.url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Orin-AI-Agent/1.0' }
      });

      const html = await response.text();
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, args.maxLength || 2000);

      return {
        success: true,
        data: {
          url: args.url,
          status: response.status,
          textLength: text.length,
          text
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Timeout' };
    }
  }
});

// ============================================================
// ANALYSIS TOOLS
// ============================================================

registerTool({
  name: 'analyze_code',
  description: 'Analyze code from a GitHub repository file',
  category: 'analysis',
  parameters: {
    type: 'object',
    properties: {
      repoUrl: { type: 'string', description: 'GitHub repository URL' },
      filePath: { type: 'string', description: 'Path to file in repo' }
    },
    required: ['repoUrl', 'filePath']
  },
  execute: async (args) => {
    try {
      const match = args.repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (!match) return { success: false, error: 'Invalid GitHub URL' };

      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');

      let defaultBranch = 'main';
      try {
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
          headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-AI-Agent' }
        });
        if (repoRes.ok) {
          const repoData = await repoRes.json() as any;
          defaultBranch = repoData.default_branch || 'main';
        }
      } catch { /* fallback */ }

      const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${defaultBranch}/${args.filePath}`;
      let res = await fetch(rawUrl);
      if (!res.ok && defaultBranch !== 'master') {
        res = await fetch(`https://raw.githubusercontent.com/${owner}/${cleanRepo}/master/${args.filePath}`);
      }
      if (!res.ok) return { success: false, error: 'File not found' };

      const code = await res.text();
      const lines = code.split('\n');

      return {
        success: true,
        data: {
          file: args.filePath,
          language: args.filePath.split('.').pop(),
          lines: lines.length,
          imports: lines.filter(l => l.match(/^import|^require|^from|^using/)).length,
          functions: lines.filter(l => l.match(/function |def |const.*=.*=>|class /)).length,
          hasTests: code.includes('test') || code.includes('spec') || code.includes('describe('),
          hasTypes: code.includes(': string') || code.includes(': number') || code.includes('interface '),
          preview: lines.slice(0, 20).join('\n')
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
});

registerTool({
  name: 'extract_skills',
  description: 'Extract technical skills from text content',
  category: 'analysis',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to extract skills from' }
    },
    required: ['text']
  },
  execute: async (args) => {
    const skillPatterns: Record<string, string[]> = {
      'Programming Languages': ['javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab'],
      'Web Frameworks': ['react', 'next\\.?js', 'vue', 'angular', 'svelte', 'node\\.?js', 'express', 'django', 'flask', 'fastapi', 'rails', 'laravel'],
      'Cloud & DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab'],
      'Databases': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'firebase', 'supabase', 'prisma', 'sql', 'nosql'],
      'Data Science': ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'machine learning', 'deep learning', 'nlp', 'ai'],
      'Tools': ['git', 'github', 'vs code', 'figma', 'postman', 'jira', 'notion', 'webpack', 'vite', 'npm', 'yarn'],
      'Soft Skills': ['leadership', 'communication', 'teamwork', 'problem solving', 'project management', 'agile', 'scrum'],
      'Mobile': ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android'],
      'Blockchain': ['ethereum', 'solidity', 'web3', 'crypto', 'blockchain']
    };

    const found: Record<string, string[]> = {};
    const lowerText = args.text.toLowerCase();
    
    for (const [category, skills] of Object.entries(skillPatterns)) {
      const matched = skills.filter(skill => new RegExp(skill, 'i').test(lowerText));
      if (matched.length > 0) found[category] = matched;
    }

    const allSkills = Object.values(found).flat();
    return {
      success: true,
      data: {
        totalSkills: allSkills.length,
        categories: found,
        allSkills
      }
    };
  }
});

registerTool({
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
      const allSkills = [...new Set(proofs.flatMap((p: any) => [...(p.skills_extracted || []), ...(p.skills_user_added || [])]))];

      return {
        success: true,
        data: {
          totalProofs,
          verified: verifiedCount,
          verificationRate: totalProofs > 0 ? Math.round((verifiedCount / totalProofs) * 100) : 0,
          uniqueSkills: allSkills.length,
          suggestions: [
            totalProofs < 5 ? 'Add more proofs' : null,
            verifiedCount < totalProofs ? 'Get more proofs verified' : null,
            allSkills.length < 5 ? 'Add more skills' : null,
          ].filter(Boolean)
        }
      };
    } catch (error) {
      return { success: false, error: 'Invalid proofs JSON' };
    }
  }
});

// ============================================================
// SAFETY TOOLS
// ============================================================

registerTool({
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
      const urlObj = new URL(args.url);
      const hostname = urlObj.hostname.toLowerCase();

      const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];
      const BLOCKED_IP_RANGES = [/^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^127\./];

      if (BLOCKED_HOSTS.includes(hostname)) {
        return { success: true, data: { safe: false, reason: 'Internal URL' } };
      }

      for (const pattern of BLOCKED_IP_RANGES) {
        if (pattern.test(hostname)) {
          return { success: true, data: { safe: false, reason: 'Internal IP address' } };
        }
      }

      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { success: true, data: { safe: false, reason: 'Invalid protocol' } };
      }

      return { success: true, data: { safe: true, url: args.url } };
    } catch {
      return { success: true, data: { safe: false, reason: 'Invalid URL format' } };
    }
  }
});

// ============================================================
// DATA TOOLS (Database Access)
// ============================================================

registerTool({
  name: 'fetch_user_profile',
  description: 'Fetch user profile data from database',
  category: 'data',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'User ID' }
    },
    required: ['userId']
  },
  execute: async (args, context) => {
    try {
      const userId = args.userId || context?.userId;
      if (!userId) return { success: false, error: 'User ID required' };

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          username: data.username,
          fullName: data.full_name,
          email: data.email,
          college: data.college,
          year: data.year,
          bio: data.bio,
          headline: data.headline,
          location: data.location,
          createdAt: data.created_at
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Database error' };
    }
  }
});

registerTool({
  name: 'fetch_user_proofs',
  description: 'Fetch all proof cards for a user',
  category: 'data',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'User ID' },
      limit: { type: 'number', description: 'Number of proofs to fetch (default 20)' }
    },
    required: ['userId']
  },
  execute: async (args, context) => {
    try {
      const userId = args.userId || context?.userId;
      if (!userId) return { success: false, error: 'User ID required' };

      const { data, error } = await supabase
        .from('proof_cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 20);

      if (error) throw error;

      return {
        success: true,
        data: {
          proofs: data || [],
          count: data?.length || 0
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Database error' };
    }
  }
});

registerTool({
  name: 'fetch_opportunities',
  description: 'Fetch job, internship, and scholarship opportunities',
  category: 'data',
  parameters: {
    type: 'object',
    properties: {
      type: { type: 'string', description: 'Type: job, internship, scholarship, or all', enum: ['job', 'internship', 'scholarship', 'all'] },
      skills: { type: 'string', description: 'Comma-separated skills to match' },
      limit: { type: 'number', description: 'Number of opportunities (default 10)' }
    },
    required: []
  },
  execute: async (args) => {
    try {
      let query = supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null);

      if (args.type && args.type !== 'all') {
        query = query.eq('type', args.type);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(args.limit || 10);

      if (error) throw error;

      return {
        success: true,
        data: {
          opportunities: data || [],
          count: data?.length || 0
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Database error' };
    }
  }
});

// ============================================================
// USER DATA TOOLS (For Personalized AI Responses)
// ============================================================

registerTool({
  name: 'get_user_portfolio_summary',
  description: 'Get comprehensive user portfolio data including profile, skills, proofs, and opportunities for personalized AI responses',
  category: 'data',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'User ID (optional, uses context userId if not provided)' },
      includeProofs: { type: 'boolean', description: 'Include proof cards (default true)' },
      includeOpportunities: { type: 'boolean', description: 'Include matched opportunities (default true)' },
      includeSkillAnalysis: { type: 'boolean', description: 'Include skill analysis (default true)' }
    },
    required: []
  },
  execute: async (args, context) => {
    try {
      const userId = args.userId || context?.userId;
      if (!userId) return { success: false, error: 'User ID required' };

      // Fetch user profile
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      const result: any = {
        profile: {
          id: userProfile.id,
          username: userProfile.username,
          fullName: userProfile.full_name,
          email: userProfile.email,
          college: userProfile.college,
          year: userProfile.year,
          bio: userProfile.bio,
          headline: userProfile.headline,
          location: userProfile.location,
          websiteUrl: userProfile.website_url,
          githubUrl: userProfile.github_url,
          linkedinUrl: userProfile.linkedin_url,
          twitterUrl: userProfile.twitter_url,
          createdAt: userProfile.created_at
        }
      };

      // Fetch proofs if requested
      if (args.includeProofs !== false) {
        const { data: proofs } = await supabase
          .from('proof_cards')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        const allProofs = proofs || [];
        const verifiedProofs = allProofs.filter(p => p.verification_status === 'verified');
        const allSkills = [...new Set(allProofs.flatMap(p => [...(p.skills_extracted || []), ...(p.skills_user_added || [])]))];
        const skillCounts = allSkills.map(skill => ({
          name: skill,
          count: allProofs.filter(p => (p.skills_extracted || []).includes(skill) || (p.skills_user_added || []).includes(skill)).length
        })).sort((a, b) => b.count - a.count);

        result.proofs = {
          total: allProofs.length,
          verified: verifiedProofs.length,
          verificationRate: allProofs.length > 0 ? Math.round((verifiedProofs.length / allProofs.length) * 100) : 0,
          byType: allProofs.reduce((acc, p) => {
            acc[p.source_type] = (acc[p.source_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          recentProofs: allProofs.slice(0, 5).map(p => ({
            title: p.title,
            sourceType: p.source_type,
            skills: [...(p.skills_extracted || []), ...(p.skills_user_added || [])],
            verificationStatus: p.verification_status,
            viewCount: p.view_count
          }))
        };

        result.skills = {
          total: allSkills.length,
          topSkills: skillCounts.slice(0, 10),
          allSkills: allSkills
        };
      }

      // Fetch opportunities if requested
      if (args.includeOpportunities !== false) {
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('*')
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(20);

        const userSkills = result.skills?.allSkills?.map((s: string) => s.toLowerCase()) || [];
        const matchedOpps = (opportunities || []).map(opp => {
          const required = (opp.required_skills || []).map((s: string) => s.toLowerCase());
          const nice = (opp.nice_to_have || []).map((s: string) => s.toLowerCase());
          const matchedRequired = required.filter((s: string) => userSkills.includes(s));
          const matchedNice = nice.filter((s: string) => userSkills.includes(s));
          const score = Math.round(
            ((matchedRequired.length * 1.0 + matchedNice.length * 0.3) /
              (required.length * 1.0 + nice.length * 0.3)) * 100
          );
          return {
            id: opp.id,
            title: opp.title,
            company: opp.company,
            type: opp.type,
            matchScore: Math.min(100, Math.max(0, score || 0)),
            matchedSkills: [...matchedRequired, ...matchedNice],
            missingSkills: required.filter((s: string) => !userSkills.includes(s))
          };
        }).sort((a: any, b: any) => b.matchScore - a.matchScore);

        result.opportunities = {
          total: matchedOpps.length,
          topMatches: matchedOpps.slice(0, 5),
          byType: matchedOpps.reduce((acc: any, o: any) => {
            acc[o.type] = (acc[o.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };
      }

      // Generate skill analysis if requested
      if (args.includeSkillAnalysis !== false && result.skills) {
        const skillGaps = identifySkillGapsFromProfile(result);
        result.skillAnalysis = {
          strengths: result.skills.topSkills.slice(0, 5).map((s: any) => s.name),
          gaps: skillGaps,
          recommendations: generateRecommendations(result)
        };
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Database error' };
    }
  }
});

// Helper functions for skill analysis
function identifySkillGapsFromProfile(profile: any): string[] {
  const commonSkills = [
    'javascript', 'typescript', 'python', 'react', 'node.js', 'git',
    'sql', 'html', 'css', 'api', 'testing', 'docker'
  ];
  const userSkills = (profile.skills?.allSkills || []).map((s: string) => s.toLowerCase());
  return commonSkills.filter(skill => !userSkills.some((us: string) => us.includes(skill) || skill.includes(us)));
}

function generateRecommendations(profile: any): string[] {
  const recs: string[] = [];
  if (profile.proofs?.total < 5) recs.push('Add more proof cards to strengthen your portfolio');
  if (profile.proofs?.verificationRate < 50) recs.push('Get more proofs verified to increase credibility');
  if (profile.skills?.total < 10) recs.push('Diversify your skill set with new technologies');
  if (profile.opportunities?.total === 0) recs.push('Explore job opportunities that match your skills');
  return recs;
}

// ============================================================
// LEARNING TOOLS
// ============================================================

registerTool({
  name: 'find_learning_resources',
  description: 'Find free learning resources for a specific skill',
  category: 'learning',
  parameters: {
    type: 'object',
    properties: {
      skill: { type: 'string', description: 'Skill to learn' },
      level: { type: 'string', description: 'Level: beginner, intermediate, advanced', enum: ['beginner', 'intermediate', 'advanced'] }
    },
    required: ['skill']
  },
  execute: async (args) => {
    // Curated learning resources database
    const resources: Record<string, any[]> = {
      'react': [
        { title: 'React Official Tutorial', url: 'https://react.dev/learn', type: 'official', free: true },
        { title: 'FreeCodeCamp React Course', url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/', type: 'course', free: true },
        { title: 'Scrimba React Course', url: 'https://scrimba.com/learn/learnreact', type: 'course', free: true }
      ],
      'typescript': [
        { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'official', free: true },
        { title: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play', type: 'practice', free: true }
      ],
      'python': [
        { title: 'Python.org Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'official', free: true },
        { title: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com/', type: 'book', free: true }
      ],
      'nodejs': [
        { title: 'Node.js Official Docs', url: 'https://nodejs.org/en/learn', type: 'official', free: true },
        { title: 'The Odin Project', url: 'https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs', type: 'course', free: true }
      ],
      'aws': [
        { title: 'AWS Free Tier', url: 'https://aws.amazon.com/free/', type: 'practice', free: true },
        { title: 'AWS Cloud Practitioner', url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/', type: 'certification', free: false }
      ]
    };

    const skillLower = args.skill.toLowerCase();
    const matchedResources = resources[skillLower] || [
      { title: `Search for ${args.skill} courses on FreeCodeCamp`, url: 'https://www.freecodecamp.org', type: 'search', free: true },
      { title: `Search for ${args.skill} on YouTube`, url: 'https://www.youtube.com', type: 'video', free: true }
    ];

    return {
      success: true,
      data: {
        skill: args.skill,
        level: args.level || 'beginner',
        resources: matchedResources
      }
    };
  }
});

registerTool({
  name: 'calculate_skill_match',
  description: 'Calculate how well user skills match job requirements',
  category: 'career',
  parameters: {
    type: 'object',
    properties: {
      userSkills: { type: 'string', description: 'Comma-separated user skills' },
      requiredSkills: { type: 'string', description: 'Comma-separated required skills' },
      niceToHaveSkills: { type: 'string', description: 'Comma-separated nice-to-have skills' }
    },
    required: ['userSkills', 'requiredSkills']
  },
  execute: async (args) => {
    const userSkills = args.userSkills.split(',').map((s: string) => s.trim().toLowerCase());
    const requiredSkills = args.requiredSkills.split(',').map((s: string) => s.trim().toLowerCase());
    const niceToHaveSkills = args.niceToHaveSkills?.split(',').map((s: string) => s.trim().toLowerCase()) || [];

    const matchedRequired = requiredSkills.filter((s: string) => userSkills.some((us: string) => us.includes(s) || s.includes(us)));
    const matchedNice = niceToHaveSkills.filter((s: string) => userSkills.some((us: string) => us.includes(s) || s.includes(us)));
    const missingRequired = requiredSkills.filter((s: string) => !matchedRequired.includes(s));

    const requiredWeight = 1.0;
    const niceWeight = 0.3;
    const score = Math.round(
      (matchedRequired.length * requiredWeight + matchedNice.length * niceWeight) /
      (requiredSkills.length * requiredWeight + niceToHaveSkills.length * niceWeight) * 100
    );

    return {
      success: true,
      data: {
        score: score || 0,
        matchedRequired,
        matchedNice,
        missingRequired,
        totalRequired: requiredSkills.length,
        totalNice: niceToHaveSkills.length
      }
    };
  }
});

// ============================================================
// CODE TOOLS
// ============================================================

registerTool({
  name: 'detect_language',
  description: 'Detect programming language from code snippet',
  category: 'code',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code snippet' }
    },
    required: ['code']
  },
  execute: async (args) => {
    const patterns: Record<string, RegExp[]> = {
      'javascript': [/^import\s+.*from\s+['"]/, /^const\s+\w+\s*=/, /=>\s*{/, /console\.log/],
      'typescript': [/:\s*(string|number|boolean|any)/, /interface\s+\w+/, /<\w+>/],
      'python': [/def\s+\w+\(/, /import\s+\w+/, /from\s+\w+\s+import/],
      'java': [/public\s+class\s+/, /public\s+static\s+void/],
      'go': [/^package\s+\w+/, /^func\s+\w+/],
      'rust': [/fn\s+\w+/, /let\s+mut\s+/, /impl\s+\w+/],
      'sql': [/SELECT\s+/i, /FROM\s+/i, /WHERE\s+/i]
    };

    const code = args.code;
    const scores: Record<string, number> = {};

    for (const [lang, regexes] of Object.entries(patterns)) {
      scores[lang] = regexes.filter(r => r.test(code)).length;
    }

    const detected = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

    return {
      success: true,
      data: {
        language: detected[1] > 0 ? detected[0] : 'unknown',
        confidence: detected[1] / 3
      }
    };
  }
});

// ============================================================
// MISSING TOOLS — Required by agents but not previously registered
// ============================================================

registerTool({
  name: 'verify_kaggle',
  description: 'Verify if a Kaggle notebook or dataset exists and get details',
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
      const match = args.url.match(/kaggle\.com\/([^\/]+)\/([^\/]+)(?:\/(code|dataset))?/);
      if (!match) return { success: false, error: 'Invalid Kaggle URL' };

      const [, username, slug, type] = match;
      const isNotebook = (type === 'code') || args.url.includes('/code/');
      const apiPath = isNotebook ? 'code' : 'datasets';

      const response = await fetch(`https://www.kaggle.com/api/v1/${apiPath}/${username}/${slug}`, {
        headers: { 'User-Agent': 'Orin-AI-Agent/1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { success: false, error: 'Kaggle content not found', data: { exists: false } };
      }

      const data = await response.json() as any;
      return {
        success: true,
        data: {
          exists: true,
          type: isNotebook ? 'notebook' : 'dataset',
          title: data.title || slug,
          owner: data.owner || username,
          votes: data.totalVotes || 0,
          url: args.url
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
    }
  }
});

registerTool({
  name: 'verify_linkedin',
  description: 'Verify if a LinkedIn profile URL format is valid',
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
      const match = args.url.match(/linkedin\.com\/in\/([^\/\?]+)/);
      if (!match) return { success: false, error: 'Invalid LinkedIn profile URL', data: { exists: false } };

      const slug = match[1];
      const response = await fetch(`https://www.linkedin.com/in/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Orin-AI-Agent/1.0)' },
        signal: AbortSignal.timeout(10000),
        redirect: 'follow',
      });

      const isValid = response.ok || response.status === 999;
      return {
        success: true,
        data: {
          exists: isValid,
          slug,
          url: args.url,
          statusCode: response.status
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
    }
  }
});

registerTool({
  name: 'generate_embeddings',
  description: 'Generate vector embeddings for text for similarity search',
  category: 'data',
  parameters: {
    type: 'object',
    properties: {
      texts: { type: 'string', description: 'Array of text strings to embed' }
    },
    required: ['texts']
  },
  execute: async (args) => {
    try {
      const texts = Array.isArray(args.texts) ? args.texts : [args.texts];
      const results = await Promise.all(texts.map(t => generateEmbedding(t)));
      return {
        success: true,
        data: {
          embeddings: results.map(r => r.embedding),
          model: 'baai/bge-m3',
          dimension: results[0]?.dimensions ?? 0,
          tokensUsed: results.reduce((sum, r) => sum + r.tokensUsed, 0),
          count: results.length
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Embedding generation failed' };
    }
  }
});

// ============================================================
// Initialize — just logs (tools self-register at module load)
// ============================================================
import { getAllTools as _getAllTools } from '../core/tool-registry.js';

export function initTools(): void {
  logger.info(`Initialized ${_getAllTools().length} AI tools`);
}
