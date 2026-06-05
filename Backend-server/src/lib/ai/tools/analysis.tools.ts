import type { Tool } from '../core/types.js';

export const analyzeCodeTool: Tool = {
  name: 'analyze_code',
  description: 'Analyze code from a GitHub repository file',
  category: 'analysis',
  parameters: {
    type: 'object',
    properties: {
      repo_url: { type: 'string', description: 'GitHub repository URL' },
      file_path: { type: 'string', description: 'Path to file in repo' },
    },
    required: ['repo_url', 'file_path'],
  },
  execute: async (args) => {
    try {
      const match = args.repo_url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (!match) return { success: false, error: 'Invalid GitHub URL' };
      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');

      let defaultBranch = 'main';
      try {
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
          headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-Proof-Verifier' },
        });
        if (repoRes.ok) {
          const repoData = await repoRes.json() as any;
          defaultBranch = repoData.default_branch || 'main';
        }
      } catch { /* fallback */ }

      const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${defaultBranch}/${args.file_path}`;
      let res = await fetch(rawUrl);
      if (!res.ok && defaultBranch !== 'master') {
        res = await fetch(`https://raw.githubusercontent.com/${owner}/${cleanRepo}/master/${args.file_path}`);
      }
      if (!res.ok) return { success: false, error: 'File not found' };

      const code = await res.text();
      const lines = code.split('\n');
      return {
        success: true,
        data: {
          file: args.file_path, language: args.file_path.split('.').pop(),
          lines: lines.length,
          imports: lines.filter(l => l.match(/^import|^require|^from|^using/)).length,
          functions: lines.filter(l => l.match(/function |def |const.*=.*=>|class /)).length,
          has_tests: code.includes('test') || code.includes('spec') || code.includes('describe('),
          has_types: code.includes(': string') || code.includes(': number') || code.includes('interface '),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export const extractSkillsTool: Tool = {
  name: 'extract_skills',
  description: 'Extract technical skills from text content',
  category: 'analysis',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to extract skills from' },
    },
    required: ['text'],
  },
  execute: async (args) => {
    try {
      const skillPatterns: Record<string, string[]> = {
        'Programming Languages': ['javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin'],
        'Web Frameworks': ['react', 'next\\.?js', 'vue', 'angular', 'svelte', 'node\\.?js', 'express', 'django', 'flask', 'fastapi'],
        'Cloud & DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions'],
        'Databases': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'firebase', 'supabase', 'prisma'],
        'Data Science': ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'machine learning', 'deep learning', 'nlp'],
        'Tools': ['git', 'github', 'vs code', 'figma', 'postman', 'jira', 'notion', 'webpack', 'vite'],
        'Soft Skills': ['leadership', 'communication', 'teamwork', 'problem solving', 'project management', 'agile', 'scrum'],
      };

      const found: Record<string, string[]> = {};
      const lowerText = args.text.toLowerCase();
      for (const [category, skills] of Object.entries(skillPatterns)) {
        const matched = skills.filter(skill => new RegExp(skill, 'i').test(lowerText));
        if (matched.length > 0) found[category] = matched;
      }

      const allSkills = Object.values(found).flat();
      return { success: true, data: { total_skills: allSkills.length, categories: found, all_skills: allSkills } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export const analyzePortfolioTool: Tool = {
  name: 'analyze_portfolio',
  description: 'Analyze a complete proof portfolio and provide insights',
  category: 'analysis',
  parameters: {
    type: 'object',
    properties: {
      proofs: { type: 'string', description: 'JSON array of proof objects' },
    },
    required: ['proofs'],
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
          total_proofs: totalProofs, verified: verifiedCount,
          verification_rate: totalProofs > 0 ? Math.round((verifiedCount / totalProofs) * 100) : 0,
          unique_skills: allSkills.length,
          suggestions: [
            totalProofs < 5 ? 'Add more proofs' : null,
            verifiedCount < totalProofs ? 'Get more proofs verified' : null,
            allSkills.length < 5 ? 'Add more skills' : null,
          ].filter(Boolean),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
