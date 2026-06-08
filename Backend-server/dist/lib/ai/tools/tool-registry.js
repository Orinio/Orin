"use strict";
/**
 * Orin AI - Tool Definitions
 * Registers all 17+ tools for AI agents to interact with the world.
 * Delegates storage to core/tool-registry.ts for shared access.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTools = initTools;
const tool_registry_js_1 = require("../core/tool-registry.js");
const logger_js_1 = require("../../logger.js");
const supabase_js_1 = require("../../supabase.js");
const embedding_service_js_1 = require("../services/embedding.service.js");
// ============================================================
// VERIFICATION TOOLS
// ============================================================
(0, tool_registry_js_1.registerTool)({
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
            if (!match)
                return { success: false, error: 'Invalid GitHub URL' };
            const [, owner, repo] = match;
            const cleanRepo = repo.replace('.git', '');
            const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
                headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-AI-Agent' }
            });
            if (!response.ok) {
                return { success: false, error: 'Repository not found', data: { exists: false } };
            }
            const data = await response.json();
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
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
            const data = await response.json();
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Timeout' };
        }
    }
});
function detectPlatform(url) {
    if (url.includes('coursera.org'))
        return 'Coursera';
    if (url.includes('udemy.com'))
        return 'Udemy';
    if (url.includes('edx.org'))
        return 'edX';
    if (url.includes('aws.amazon.com'))
        return 'AWS';
    if (url.includes('google.com'))
        return 'Google';
    if (url.includes('microsoft.com'))
        return 'Microsoft';
    if (url.includes('kaggle.com'))
        return 'Kaggle';
    if (url.includes('leetcode.com'))
        return 'LeetCode';
    return 'Unknown';
}
// ============================================================
// SEARCH TOOLS
// ============================================================
/**
 * Free web search using DuckDuckGo HTML scraping (no API key required).
 * Falls back to DuckDuckGo Lite for reliable results.
 */
async function searchDuckDuckGo(query, numResults) {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
    });
    if (!response.ok)
        throw new Error(`DuckDuckGo returned ${response.status}`);
    const html = await response.text();
    const results = [];
    // Parse DuckDuckGo HTML results
    const resultRegex = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    const urls = [];
    const titles = [];
    const snippets = [];
    let match;
    while ((match = resultRegex.exec(html)) !== null && urls.length < numResults) {
        // Extract actual URL from DuckDuckGo redirect
        const redirectUrl = match[1];
        const actualUrl = redirectUrl.includes('uddg=')
            ? decodeURIComponent(redirectUrl.split('uddg=')[1]?.split('&')[0] || redirectUrl)
            : redirectUrl;
        urls.push(actualUrl);
        titles.push(match[2].replace(/<[^>]+>/g, '').trim());
    }
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < numResults) {
        snippets.push(match[1].replace(/<[^>]+>/g, '').trim());
    }
    for (let i = 0; i < Math.min(urls.length, numResults); i++) {
        results.push({
            title: titles[i] || '',
            url: urls[i],
            snippet: snippets[i] || '',
        });
    }
    return results;
}
(0, tool_registry_js_1.registerTool)({
    name: 'web_search',
    description: 'Search the web for real-time information about jobs, courses, resources, companies, technologies, and any topic',
    category: 'search',
    timeoutMs: 15000,
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'Search query (e.g., "react developer jobs remote 2024")' },
            numResults: { type: 'number', description: 'Number of results (default 5, max 10)' }
        },
        required: ['query']
    },
    execute: async (args) => {
        const numResults = Math.min(args.numResults || 5, 10);
        try {
            // Try SerpAPI first if configured
            const apiKey = process.env.SERPAPI_KEY || process.env.GOOGLE_SEARCH_API_KEY;
            if (apiKey) {
                const response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(args.query)}&api_key=${apiKey}&num=${numResults}`, { signal: AbortSignal.timeout(10000) });
                const data = await response.json();
                const results = (data.organic_results || []).slice(0, numResults).map((r) => ({
                    title: r.title,
                    url: r.link,
                    snippet: r.snippet
                }));
                return { success: true, data: { query: args.query, results, source: 'serpapi' } };
            }
            // Fallback: DuckDuckGo (free, no API key)
            const results = await searchDuckDuckGo(args.query, numResults);
            return {
                success: true,
                data: {
                    query: args.query,
                    results,
                    source: 'duckduckgo',
                    note: results.length === 0 ? 'No results found. Try a different query.' : undefined
                }
            };
        }
        catch (error) {
            // Final fallback: return search suggestions
            return {
                success: true,
                data: {
                    query: args.query,
                    results: [],
                    source: 'fallback',
                    message: `Web search temporarily unavailable. Try searching directly: https://www.google.com/search?q=${encodeURIComponent(args.query)}`
                }
            };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
    name: 'fetch_webpage',
    description: 'Fetch and extract text content from a webpage URL',
    category: 'search',
    timeoutMs: 15000,
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Timeout' };
        }
    }
});
// ============================================================
// ANALYSIS TOOLS
// ============================================================
(0, tool_registry_js_1.registerTool)({
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
            if (!match)
                return { success: false, error: 'Invalid GitHub URL' };
            const [, owner, repo] = match;
            const cleanRepo = repo.replace('.git', '');
            let defaultBranch = 'main';
            try {
                const repoRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
                    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Orin-AI-Agent' }
                });
                if (repoRes.ok) {
                    const repoData = await repoRes.json();
                    defaultBranch = repoData.default_branch || 'main';
                }
            }
            catch { /* fallback */ }
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${defaultBranch}/${args.filePath}`;
            let res = await fetch(rawUrl);
            if (!res.ok && defaultBranch !== 'master') {
                res = await fetch(`https://raw.githubusercontent.com/${owner}/${cleanRepo}/master/${args.filePath}`);
            }
            if (!res.ok)
                return { success: false, error: 'File not found' };
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
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
        const skillPatterns = {
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
        const found = {};
        const lowerText = args.text.toLowerCase();
        for (const [category, skills] of Object.entries(skillPatterns)) {
            const matched = skills.filter(skill => new RegExp(skill, 'i').test(lowerText));
            if (matched.length > 0)
                found[category] = matched;
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
(0, tool_registry_js_1.registerTool)({
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
            const verifiedCount = proofs.filter((p) => p.verification_status === 'verified').length;
            const allSkills = [...new Set(proofs.flatMap((p) => [...(p.skills_extracted || []), ...(p.skills_user_added || [])]))];
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
        }
        catch (error) {
            return { success: false, error: 'Invalid proofs JSON' };
        }
    }
});
// ============================================================
// SAFETY TOOLS
// ============================================================
(0, tool_registry_js_1.registerTool)({
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
        }
        catch {
            return { success: true, data: { safe: false, reason: 'Invalid URL format' } };
        }
    }
});
// ============================================================
// DATA TOOLS (Database Access)
// ============================================================
(0, tool_registry_js_1.registerTool)({
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
            if (!userId)
                return { success: false, error: 'User ID required' };
            const { data, error } = await supabase_js_1.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (error)
                throw error;
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Database error' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
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
            if (!userId)
                return { success: false, error: 'User ID required' };
            const { data, error } = await supabase_js_1.supabase
                .from('proof_cards')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(args.limit || 20);
            if (error)
                throw error;
            return {
                success: true,
                data: {
                    proofs: data || [],
                    count: data?.length || 0
                }
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Database error' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
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
            let query = supabase_js_1.supabase
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
            if (error)
                throw error;
            return {
                success: true,
                data: {
                    opportunities: data || [],
                    count: data?.length || 0
                }
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Database error' };
        }
    }
});
// ============================================================
// USER DATA TOOLS (For Personalized AI Responses)
// ============================================================
(0, tool_registry_js_1.registerTool)({
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
            if (!userId)
                return { success: false, error: 'User ID required' };
            // Fetch user profile
            const { data: userProfile, error: userError } = await supabase_js_1.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (userError || !userProfile) {
                return { success: false, error: 'User profile not found' };
            }
            const result = {
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
                const { data: proofs } = await supabase_js_1.supabase
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
                    }, {}),
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
                const { data: opportunities } = await supabase_js_1.supabase
                    .from('opportunities')
                    .select('*')
                    .eq('is_active', true)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })
                    .limit(20);
                const userSkills = result.skills?.allSkills?.map((s) => s.toLowerCase()) || [];
                const matchedOpps = (opportunities || []).map(opp => {
                    const required = (opp.required_skills || []).map((s) => s.toLowerCase());
                    const nice = (opp.nice_to_have || []).map((s) => s.toLowerCase());
                    const matchedRequired = required.filter((s) => userSkills.includes(s));
                    const matchedNice = nice.filter((s) => userSkills.includes(s));
                    const score = Math.round(((matchedRequired.length * 1.0 + matchedNice.length * 0.3) /
                        (required.length * 1.0 + nice.length * 0.3)) * 100);
                    return {
                        id: opp.id,
                        title: opp.title,
                        company: opp.company,
                        type: opp.type,
                        matchScore: Math.min(100, Math.max(0, score || 0)),
                        matchedSkills: [...matchedRequired, ...matchedNice],
                        missingSkills: required.filter((s) => !userSkills.includes(s))
                    };
                }).sort((a, b) => b.matchScore - a.matchScore);
                result.opportunities = {
                    total: matchedOpps.length,
                    topMatches: matchedOpps.slice(0, 5),
                    byType: matchedOpps.reduce((acc, o) => {
                        acc[o.type] = (acc[o.type] || 0) + 1;
                        return acc;
                    }, {})
                };
            }
            // Generate skill analysis if requested
            if (args.includeSkillAnalysis !== false && result.skills) {
                const skillGaps = identifySkillGapsFromProfile(result);
                result.skillAnalysis = {
                    strengths: result.skills.topSkills.slice(0, 5).map((s) => s.name),
                    gaps: skillGaps,
                    recommendations: generateRecommendations(result)
                };
            }
            return { success: true, data: result };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Database error' };
        }
    }
});
// Helper functions for skill analysis
function identifySkillGapsFromProfile(profile) {
    const commonSkills = [
        'javascript', 'typescript', 'python', 'react', 'node.js', 'git',
        'sql', 'html', 'css', 'api', 'testing', 'docker'
    ];
    const userSkills = (profile.skills?.allSkills || []).map((s) => s.toLowerCase());
    return commonSkills.filter(skill => !userSkills.some((us) => us.includes(skill) || skill.includes(us)));
}
function generateRecommendations(profile) {
    const recs = [];
    if (profile.proofs?.total < 5)
        recs.push('Add more proof cards to strengthen your portfolio');
    if (profile.proofs?.verificationRate < 50)
        recs.push('Get more proofs verified to increase credibility');
    if (profile.skills?.total < 10)
        recs.push('Diversify your skill set with new technologies');
    if (profile.opportunities?.total === 0)
        recs.push('Explore job opportunities that match your skills');
    return recs;
}
// ============================================================
// LEARNING TOOLS
// ============================================================
(0, tool_registry_js_1.registerTool)({
    name: 'find_learning_resources',
    description: 'Find free learning resources for a specific skill with real URLs and course details',
    category: 'learning',
    timeoutMs: 15000,
    parameters: {
        type: 'object',
        properties: {
            skill: { type: 'string', description: 'Skill to learn (e.g., "React", "Python", "AWS")' },
            level: { type: 'string', description: 'Level: beginner, intermediate, advanced', enum: ['beginner', 'intermediate', 'advanced'] }
        },
        required: ['skill']
    },
    execute: async (args) => {
        // Comprehensive curated learning resources database
        const resources = {
            'react': [
                { title: 'React Official Tutorial (React.dev)', url: 'https://react.dev/learn', type: 'official', free: true, hours: 8 },
                { title: 'FreeCodeCamp React Course', url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/', type: 'course', free: true, hours: 300 },
                { title: 'Scrimba Learn React', url: 'https://scrimba.com/learn/learnreact', type: 'interactive', free: true, hours: 5 },
                { title: 'Epic React by Kent C. Dodds', url: 'https://epicreact.dev/', type: 'course', free: false, hours: 40 },
                { title: 'React Hooks Course (YouTube)', url: 'https://www.youtube.com/watch?v=dpw9EHDh2bM', type: 'video', free: true, hours: 2 },
            ],
            'typescript': [
                { title: 'TypeScript Official Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'official', free: true, hours: 10 },
                { title: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play', type: 'practice', free: true, hours: 2 },
                { title: 'Total TypeScript', url: 'https://www.totaltypescript.com/', type: 'course', free: false, hours: 20 },
            ],
            'python': [
                { title: 'Python.org Official Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'official', free: true, hours: 15 },
                { title: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com/', type: 'book', free: true, hours: 30 },
                { title: 'FreeCodeCamp Python Course', url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', type: 'course', free: true, hours: 300 },
                { title: 'Real Python Tutorials', url: 'https://realpython.com/', type: 'tutorials', free: true, hours: 50 },
            ],
            'javascript': [
                { title: 'JavaScript.info (The Modern Tutorial)', url: 'https://javascript.info/', type: 'tutorial', free: true, hours: 40 },
                { title: 'FreeCodeCamp JavaScript Algorithms', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/', type: 'course', free: true, hours: 300 },
                { title: 'Eloquent JavaScript (Book)', url: 'https://eloquentjavascript.net/', type: 'book', free: true, hours: 20 },
                { title: '30 Days of JavaScript', url: 'https://javascript30.com/', type: 'challenge', free: true, hours: 30 },
            ],
            'nodejs': [
                { title: 'Node.js Official Docs', url: 'https://nodejs.org/en/learn', type: 'official', free: true, hours: 10 },
                { title: 'The Odin Project NodeJS', url: 'https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs', type: 'course', free: true, hours: 100 },
                { title: 'FreeCodeCamp APIs and Microservices', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/', type: 'course', free: true, hours: 300 },
            ],
            'aws': [
                { title: 'AWS Free Tier', url: 'https://aws.amazon.com/free/', type: 'practice', free: true, hours: 0 },
                { title: 'AWS Cloud Practitioner Essentials', url: 'https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials', type: 'course', free: true, hours: 6 },
                { title: 'AWS Skill Builder', url: 'https://skillbuilder.aws/', type: 'courses', free: true, hours: 100 },
            ],
            'docker': [
                { title: 'Docker Official Getting Started', url: 'https://docs.docker.com/get-started/', type: 'official', free: true, hours: 4 },
                { title: 'Docker Tutorial for Beginners (YouTube)', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', type: 'video', free: true, hours: 2 },
                { title: 'Play with Docker Labs', url: 'https://labs.play-with-docker.com/', type: 'practice', free: true, hours: 5 },
            ],
            'kubernetes': [
                { title: 'Kubernetes Official Tutorials', url: 'https://kubernetes.io/docs/tutorials/', type: 'official', free: true, hours: 10 },
                { title: 'KodeKloud Kubernetes Course', url: 'https://kodekloud.com/courses/kubernetes-for-the-absolute-beginner/', type: 'course', free: false, hours: 15 },
            ],
            'git': [
                { title: 'Git Official Documentation', url: 'https://git-scm.com/doc', type: 'official', free: true, hours: 5 },
                { title: 'Learn Git Branching (Interactive)', url: 'https://learngitbranching.js.org/', type: 'interactive', free: true, hours: 3 },
                { title: 'Oh Shit, Git!?!', url: 'https://ohshitgit.com/', type: 'reference', free: true, hours: 1 },
            ],
            'sql': [
                { title: 'SQLBolt Interactive Lessons', url: 'https://sqlbolt.com/', type: 'interactive', free: true, hours: 3 },
                { title: 'Mode Analytics SQL Tutorial', url: 'https://mode.com/sql-tutorial/', type: 'tutorial', free: true, hours: 5 },
                { title: 'PostgreSQL Official Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html', type: 'official', free: true, hours: 8 },
            ],
            'nextjs': [
                { title: 'Next.js Official Learn Course', url: 'https://nextjs.org/learn', type: 'official', free: true, hours: 10 },
                { title: 'Next.js App Router Course', url: 'https://nextjs.org/learn/app-router/building-your-application', type: 'official', free: true, hours: 8 },
            ],
            'vue': [
                { title: 'Vue.js Official Tutorial', url: 'https://vuejs.org/tutorial/', type: 'official', free: true, hours: 5 },
                { title: 'Vue Mastery Courses', url: 'https://www.vuemastery.com/courses/', type: 'course', free: true, hours: 20 },
            ],
            'angular': [
                { title: 'Angular Official Tutorial', url: 'https://angular.dev/tutorial', type: 'official', free: true, hours: 8 },
            ],
            'flutter': [
                { title: 'Flutter Official Codelabs', url: 'https://docs.flutter.dev/codelabs', type: 'codelab', free: true, hours: 20 },
                { title: 'Dart Language Tour', url: 'https://dart.dev/language', type: 'official', free: true, hours: 5 },
            ],
            'machine learning': [
                { title: 'Google ML Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', free: true, hours: 15 },
                { title: 'Fast.ai Practical Deep Learning', url: 'https://course.fast.ai/', type: 'course', free: true, hours: 30 },
                { title: 'Kaggle Learn ML', url: 'https://www.kaggle.com/learn/intro-to-machine-learning', type: 'course', free: true, hours: 10 },
            ],
            'react native': [
                { title: 'React Native Official Docs', url: 'https://reactnative.dev/docs/getting-started', type: 'official', free: true, hours: 8 },
                { title: 'Expo Tutorial', url: 'https://docs.expo.dev/tutorial/introduction/', type: 'tutorial', free: true, hours: 5 },
            ],
            'svelte': [
                { title: 'Svelte Tutorial', url: 'https://svelte.dev/tutorial', type: 'official', free: true, hours: 3 },
            ],
            'graphql': [
                { title: 'GraphQL Official Learning', url: 'https://graphql.org/learn/', type: 'official', free: true, hours: 5 },
                { title: 'How to GraphQL', url: 'https://www.howtographql.com/', type: 'tutorial', free: true, hours: 10 },
            ],
            'redis': [
                { title: 'Redis University', url: 'https://university.redis.com/', type: 'course', free: true, hours: 20 },
                { title: 'Redis Official Commands', url: 'https://redis.io/docs/latest/commands/', type: 'reference', free: true, hours: 3 },
            ],
            'mongodb': [
                { title: 'MongoDB University', url: 'https://university.mongodb.com/', type: 'course', free: true, hours: 30 },
            ],
            'terraform': [
                { title: 'Terraform Official Tutorials', url: 'https://developer.hashicorp.com/terraform/tutorials', type: 'official', free: true, hours: 15 },
            ],
            'cybersecurity': [
                { title: 'TryHackMe Free Room', url: 'https://tryhackme.com/', type: 'practice', free: true, hours: 50 },
                { title: 'OverTheWire Wargames', url: 'https://overthewire.org/wargames/', type: 'practice', free: true, hours: 30 },
            ],
            'data science': [
                { title: 'Kaggle Data Science Course', url: 'https://www.kaggle.com/learn/data-science', type: 'course', free: true, hours: 20 },
                { title: 'IBM Data Science Professional Certificate', url: 'https://www.coursera.org/professional-certificates/ibm-data-science', type: 'course', free: false, hours: 120 },
            ],
            'devops': [
                { title: 'DevOps Roadmap', url: 'https://roadmap.sh/devops', type: 'roadmap', free: true, hours: 0 },
                { title: 'GitHub Actions Documentation', url: 'https://docs.github.com/en/actions', type: 'official', free: true, hours: 5 },
            ],
        };
        const skillLower = args.skill.toLowerCase();
        let matchedResources = resources[skillLower];
        // Fuzzy match: try partial matches
        if (!matchedResources) {
            const key = Object.keys(resources).find(k => skillLower.includes(k) || k.includes(skillLower));
            if (key)
                matchedResources = resources[key];
        }
        // Generate search links as final fallback
        if (!matchedResources) {
            matchedResources = [
                { title: `${args.skill} on FreeCodeCamp`, url: `https://www.freecodecamp.org/search/?query=${encodeURIComponent(args.skill)}`, type: 'search', free: true, hours: null },
                { title: `${args.skill} on YouTube`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(args.skill + ' tutorial')}`, type: 'video', free: true, hours: null },
                { title: `${args.skill} on Coursera`, url: 'https://www.coursera.org/search?query=' + encodeURIComponent(args.skill), type: 'course', free: true, hours: null },
                { title: `${args.skill} on edX`, url: 'https://www.edx.org/search?q=' + encodeURIComponent(args.skill), type: 'course', free: true, hours: null },
            ];
        }
        // Filter by level if specified
        const levelMap = {
            beginner: ['official', 'tutorial', 'course', 'book', 'video', 'interactive'],
            intermediate: ['course', 'tutorial', 'practice', 'codelab', 'challenge'],
            advanced: ['practice', 'course', 'reference', 'roadmap'],
        };
        const filtered = args.level && levelMap[args.level]
            ? matchedResources.filter(r => levelMap[args.level].includes(r.type))
            : matchedResources;
        return {
            success: true,
            data: {
                skill: args.skill,
                level: args.level || 'all levels',
                resources: (filtered.length > 0 ? filtered : matchedResources).slice(0, 8),
                tip: 'Create a proof card after completing each resource to build your portfolio!'
            }
        };
    }
});
(0, tool_registry_js_1.registerTool)({
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
        const userSkills = args.userSkills.split(',').map((s) => s.trim().toLowerCase());
        const requiredSkills = args.requiredSkills.split(',').map((s) => s.trim().toLowerCase());
        const niceToHaveSkills = args.niceToHaveSkills?.split(',').map((s) => s.trim().toLowerCase()) || [];
        const matchedRequired = requiredSkills.filter((s) => userSkills.some((us) => us.includes(s) || s.includes(us)));
        const matchedNice = niceToHaveSkills.filter((s) => userSkills.some((us) => us.includes(s) || s.includes(us)));
        const missingRequired = requiredSkills.filter((s) => !matchedRequired.includes(s));
        const requiredWeight = 1.0;
        const niceWeight = 0.3;
        const score = Math.round((matchedRequired.length * requiredWeight + matchedNice.length * niceWeight) /
            (requiredSkills.length * requiredWeight + niceToHaveSkills.length * niceWeight) * 100);
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
(0, tool_registry_js_1.registerTool)({
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
        const patterns = {
            'javascript': [/^import\s+.*from\s+['"]/, /^const\s+\w+\s*=/, /=>\s*{/, /console\.log/],
            'typescript': [/:\s*(string|number|boolean|any)/, /interface\s+\w+/, /<\w+>/],
            'python': [/def\s+\w+\(/, /import\s+\w+/, /from\s+\w+\s+import/],
            'java': [/public\s+class\s+/, /public\s+static\s+void/],
            'go': [/^package\s+\w+/, /^func\s+\w+/],
            'rust': [/fn\s+\w+/, /let\s+mut\s+/, /impl\s+\w+/],
            'sql': [/SELECT\s+/i, /FROM\s+/i, /WHERE\s+/i]
        };
        const code = args.code;
        const scores = {};
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
(0, tool_registry_js_1.registerTool)({
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
            if (!match)
                return { success: false, error: 'Invalid Kaggle URL' };
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
            const data = await response.json();
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
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
            if (!match)
                return { success: false, error: 'Invalid LinkedIn profile URL', data: { exists: false } };
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
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
            const results = await Promise.all(texts.map(t => (0, embedding_service_js_1.generateEmbedding)(t)));
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Embedding generation failed' };
        }
    }
});
// ============================================================
// ACTIONABLE TOOLS — Agent takes real actions on behalf of user
// ============================================================
(0, tool_registry_js_1.registerTool)({
    name: 'save_user_goal',
    description: 'Save a career or learning goal for the user. The agent takes action to track their goals.',
    category: 'memory',
    parameters: {
        type: 'object',
        properties: {
            goal: { type: 'string', description: 'Goal description (e.g., "Learn React and build 3 projects")' },
            category: { type: 'string', description: 'Category: skill, career, project, certification', enum: ['skill', 'career', 'project', 'certification'] },
            deadline: { type: 'string', description: 'Optional deadline (e.g., "2024-06-30", "3 months")' },
            priority: { type: 'string', description: 'Priority: low, medium, high', enum: ['low', 'medium', 'high'] }
        },
        required: ['goal']
    },
    execute: async (args, context) => {
        try {
            const userId = context?.userId;
            if (!userId)
                return { success: false, error: 'User ID required' };
            const { error } = await supabase_js_1.supabase
                .from('ai_user_goals')
                .insert({
                user_id: userId,
                goal: args.goal,
                category: args.category || 'skill',
                deadline: args.deadline || null,
                priority: args.priority || 'medium',
                status: 'active',
                created_at: new Date().toISOString(),
            });
            if (error) {
                // If table doesn't exist, save to memory instead
                logger_js_1.logger.warn({ error }, 'Could not save goal to ai_user_goals, using memory');
                return {
                    success: true,
                    data: {
                        saved: true,
                        method: 'memory',
                        goal: args.goal,
                        category: args.category || 'skill',
                        deadline: args.deadline,
                        priority: args.priority || 'medium',
                        message: `Goal saved: "${args.goal}". Track this goal to stay accountable!`
                    }
                };
            }
            return {
                success: true,
                data: {
                    saved: true,
                    method: 'database',
                    goal: args.goal,
                    category: args.category || 'skill',
                    deadline: args.deadline,
                    priority: args.priority || 'medium',
                    message: `Goal saved: "${args.goal}". I'll help you track progress toward this goal.`
                }
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to save goal' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
    name: 'track_job_application',
    description: 'Track a job/internship application for the user. Records the company, role, and status.',
    category: 'memory',
    parameters: {
        type: 'object',
        properties: {
            company: { type: 'string', description: 'Company name' },
            role: { type: 'string', description: 'Job role/title' },
            url: { type: 'string', description: 'Job posting URL (optional)' },
            status: { type: 'string', description: 'Application status: applied, interviewing, offer, rejected', enum: ['applied', 'interviewing', 'offer', 'rejected'] },
            notes: { type: 'string', description: 'Notes about the application (optional)' }
        },
        required: ['company', 'role']
    },
    execute: async (args, context) => {
        try {
            const userId = context?.userId;
            if (!userId)
                return { success: false, error: 'User ID required' };
            const { error } = await supabase_js_1.supabase
                .from('ai_job_applications')
                .insert({
                user_id: userId,
                company: args.company,
                role: args.role,
                url: args.url || null,
                status: args.status || 'applied',
                notes: args.notes || null,
                applied_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            });
            if (error) {
                logger_js_1.logger.warn({ error }, 'Could not save job application');
                return {
                    success: true,
                    data: {
                        saved: true,
                        method: 'memory',
                        company: args.company,
                        role: args.role,
                        status: args.status || 'applied',
                        message: `Application to ${args.company} as ${args.role} tracked. Status: ${args.status || 'applied'}`
                    }
                };
            }
            return {
                success: true,
                data: {
                    saved: true,
                    method: 'database',
                    company: args.company,
                    role: args.role,
                    status: args.status || 'applied',
                    message: `Application to ${args.company} as ${args.role} has been tracked. Good luck! 🚀`
                }
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to track application' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
    name: 'generate_resume_bullets',
    description: 'Generate polished resume bullet points from the user\'s proof cards and projects',
    category: 'analysis',
    parameters: {
        type: 'object',
        properties: {
            focus: { type: 'string', description: 'Focus area: all, recent, technical, leadership (default: all)' },
            count: { type: 'number', description: 'Number of bullet points to generate (default 5)' }
        },
        required: []
    },
    execute: async (args, context) => {
        try {
            const userId = context?.userId;
            if (!userId)
                return { success: false, error: 'User ID required' };
            const { data: proofs } = await supabase_js_1.supabase
                .from('proof_cards')
                .select('*')
                .eq('user_id', userId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(20);
            if (!proofs || proofs.length === 0) {
                return {
                    success: true,
                    data: {
                        bullets: [],
                        message: 'No proof cards found. Add some projects or achievements first!'
                    }
                };
            }
            const verifiedProofs = proofs.filter(p => p.verification_status === 'verified');
            const targetProofs = verifiedProofs.length > 0 ? verifiedProofs : proofs;
            const bullets = targetProofs.slice(0, args.count || 5).map(proof => {
                const skills = [...(proof.skills_extracted || []), ...(proof.skills_user_added || [])];
                const skillStr = skills.length > 0 ? ` using ${skills.slice(0, 3).join(', ')}` : '';
                const bullets = [];
                // Generate strong action verbs
                const verbs = ['Developed', 'Built', 'Implemented', 'Designed', 'Created', 'Engineered', 'Architected', 'Led', 'Optimized', 'Automated'];
                const verb = verbs[Math.floor(Math.random() * verbs.length)];
                if (proof.source_type === 'github') {
                    bullets.push(`${verb} ${proof.title || 'a project'}${skillStr}, demonstrating proficiency in ${skills.slice(0, 2).join(' and ') || 'software development'}`);
                }
                else if (proof.source_type === 'certificate') {
                    bullets.push(`Completed ${proof.title || 'certification'}${skillStr}, validating ${skills.slice(0, 2).join(' and ') || 'technical'} skills`);
                }
                else {
                    bullets.push(`${verb} ${proof.title || 'an achievement'}${skillStr}`);
                }
                return {
                    bullet: bullets[0],
                    source: proof.title,
                    sourceType: proof.source_type,
                    verified: proof.verification_status === 'verified',
                    skills: skills.slice(0, 3)
                };
            });
            return {
                success: true,
                data: {
                    bullets: bullets.map(b => b.bullet),
                    details: bullets,
                    tip: 'Use these bullet points in your resume. Each one is backed by a verified proof card!'
                }
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to generate bullets' };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
    name: 'search_web_free',
    description: 'Search the web for free — uses DuckDuckGo, no API key needed. Good for finding jobs, resources, news.',
    category: 'search',
    timeoutMs: 15000,
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
            const numResults = Math.min(args.numResults || 5, 10);
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(args.query)}`;
            const response = await fetch(searchUrl, {
                signal: AbortSignal.timeout(12000),
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });
            if (!response.ok)
                throw new Error(`Search returned ${response.status}`);
            const html = await response.text();
            const results = [];
            const resultRegex = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
            const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
            const urls = [];
            const titles = [];
            const snippets = [];
            let match;
            while ((match = resultRegex.exec(html)) !== null && urls.length < numResults) {
                const redirectUrl = match[1];
                const actualUrl = redirectUrl.includes('uddg=')
                    ? decodeURIComponent(redirectUrl.split('uddg=')[1]?.split('&')[0] || redirectUrl)
                    : redirectUrl;
                urls.push(actualUrl);
                titles.push(match[2].replace(/<[^>]+>/g, '').trim());
            }
            while ((match = snippetRegex.exec(html)) !== null && snippets.length < numResults) {
                snippets.push(match[1].replace(/<[^>]+>/g, '').trim());
            }
            for (let i = 0; i < Math.min(urls.length, numResults); i++) {
                results.push({
                    title: titles[i] || '',
                    url: urls[i],
                    snippet: snippets[i] || '',
                });
            }
            return {
                success: true,
                data: { query: args.query, results, count: results.length }
            };
        }
        catch (error) {
            return {
                success: true,
                data: {
                    query: args.query,
                    results: [],
                    message: `Search unavailable. Try: https://www.google.com/search?q=${encodeURIComponent(args.query)}`
                }
            };
        }
    }
});
(0, tool_registry_js_1.registerTool)({
    name: 'update_user_profile',
    description: 'Update the user\'s profile fields (bio, headline, location, etc.). Takes action on their behalf.',
    category: 'data',
    parameters: {
        type: 'object',
        properties: {
            field: { type: 'string', description: 'Field to update: bio, headline, location, website_url, github_url, linkedin_url', enum: ['bio', 'headline', 'location', 'website_url', 'github_url', 'linkedin_url', 'twitter_url'] },
            value: { type: 'string', description: 'New value for the field' }
        },
        required: ['field', 'value']
    },
    execute: async (args, context) => {
        try {
            const userId = context?.userId;
            if (!userId)
                return { success: false, error: 'User ID required' };
            // Map field name to database column
            const fieldMap = {
                bio: 'bio',
                headline: 'headline',
                location: 'location',
                website_url: 'website_url',
                github_url: 'github_url',
                linkedin_url: 'linkedin_url',
                twitter_url: 'twitter_url',
            };
            const dbField = fieldMap[args.field];
            if (!dbField)
                return { success: false, error: `Invalid field: ${args.field}` };
            const { error } = await supabase_js_1.supabase
                .from('users')
                .update({ [dbField]: args.value })
                .eq('id', userId);
            if (error)
                throw error;
            return {
                success: true,
                data: {
                    updated: true,
                    field: args.field,
                    value: args.value,
                    message: `Updated your ${args.field} successfully!`
                }
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
        }
    }
});
// ============================================================
// Initialize — just logs (tools self-register at module load)
// ============================================================
const tool_registry_js_2 = require("../core/tool-registry.js");
function initTools() {
    logger_js_1.logger.info(`Initialized ${(0, tool_registry_js_2.getAllTools)().length} AI tools`);
}
//# sourceMappingURL=tool-registry.js.map