/**
 * Orin - Cold Outreach System
 * Auto-generates Proof Card previews from GitHub profiles for outreach.
 * 
 * Usage:
 *   npx tsx scripts/cold-outreach.ts <github-username> [--format email|markdown|json]
 *   npx tsx scripts/cold-outreach.ts --file usernames.txt [--format email]
 * 
 * Environment:
 *   GITHUB_TOKEN - Optional GitHub API token (increases rate limit to 5000/hr)
 */

interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  publicRepos: number;
  followers: number;
  avatarUrl: string;
  url: string;
}

interface GitHubRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface ProofCardPreview {
  username: string;
  displayName: string;
  headline: string;
  topSkills: string[];
  topRepos: GitHubRepo[];
  stats: {
    totalRepos: number;
    totalStars: number;
    topLanguages: string[];
    activeRepos: number;
  };
  proofCardMarkdown: string;
  emailDraft: string;
  linkedinMessage: string;
}

async function fetchGitHubProfile(username: string): Promise<GitHubProfile | null> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Orin-Outreach-Agent/1.0'
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!response.ok) return null;

    const data = await response.json() as any;
    return {
      username: data.login,
      name: data.name,
      bio: data.bio,
      publicRepos: data.public_repos,
      followers: data.followers,
      avatarUrl: data.avatar_url,
      url: data.html_url
    };
  } catch {
    return null;
  }
}

async function fetchGitHubRepos(username: string, limit: number = 10): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Orin-Outreach-Agent/1.0'
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=stars&direction=desc&per_page=${limit}`,
      { headers }
    );
    if (!response.ok) return [];

    const repos = await response.json() as any[];
    return repos.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      topics: repo.topics || [],
      url: repo.html_url,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at
    }));
  } catch {
    return [];
  }
}

function extractSkillsFromRepos(repos: GitHubRepo[]): string[] {
  const skillKeywords: Record<string, string> = {
    // Languages
    'typescript': 'TypeScript',
    'javascript': 'JavaScript',
    'python': 'Python',
    'java': 'Java',
    'go': 'Go',
    'rust': 'Rust',
    'ruby': 'Ruby',
    'php': 'PHP',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'c++': 'C++',
    'c': 'C',
    'dart': 'Dart',
    // Frameworks
    'react': 'React',
    'nextjs': 'Next.js',
    'vue': 'Vue.js',
    'angular': 'Angular',
    'svelte': 'Svelte',
    'nodejs': 'Node.js',
    'express': 'Express',
    'fastapi': 'FastAPI',
    'django': 'Django',
    'flask': 'Flask',
    'rails': 'Ruby on Rails',
    'laravel': 'Laravel',
    'flutter': 'Flutter',
    'react-native': 'React Native',
    // Cloud & DevOps
    'aws': 'AWS',
    'azure': 'Azure',
    'gcp': 'GCP',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'terraform': 'Terraform',
    'github-actions': 'GitHub Actions',
    // Databases
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'mongodb': 'MongoDB',
    'redis': 'Redis',
    'supabase': 'Supabase',
    'firebase': 'Firebase',
    // Other
    'graphql': 'GraphQL',
    'rest-api': 'REST API',
    'machine-learning': 'Machine Learning',
    'deep-learning': 'Deep Learning',
    'tensorflow': 'TensorFlow',
    'pytorch': 'PyTorch',
    'web3': 'Web3',
    'blockchain': 'Blockchain'
  };

  const skillCounts: Record<string, number> = {};

  for (const repo of repos) {
    // Count from language
    if (repo.language) {
      const lang = repo.language.toLowerCase();
      skillCounts[lang] = (skillCounts[lang] || 0) + 1;
    }

    // Count from topics
    for (const topic of repo.topics) {
      const topicLower = topic.toLowerCase();
      if (skillKeywords[topicLower]) {
        skillCounts[skillKeywords[topicLower]] = (skillCounts[skillKeywords[topicLower]] || 0) + 1;
      }
    }
  }

  // Sort by count and return top skills
  return Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill]) => skill);
}

function generateHeadline(profile: GitHubProfile, skills: string[]): string {
  const topSkills = skills.slice(0, 3).join(' / ') || 'Software Development';
  const name = profile.name || profile.username;
  return `${name} — ${topSkills} Developer`;
}

function generateProofCardMarkdown(profile: GitHubProfile, repos: GitHubRepo[], skills: string[]): string {
  const topRepos = repos.slice(0, 5);
  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
  const topLanguages = [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 5);

  let md = `# Proof Card: ${profile.name || profile.username}\n\n`;
  md += `> ${generateHeadline(profile, skills)}\n\n`;
  md += `## Stats\n\n`;
  md += `- **GitHub:** [@${profile.username}](${profile.url})\n`;
  md += `- **Public Repos:** ${profile.publicRepos}\n`;
  md += `- **Followers:** ${profile.followers}\n`;
  md += `- **Total Stars Earned:** ${totalStars}\n`;
  md += `- **Top Skills:** ${skills.slice(0, 6).join(', ')}\n`;
  md += `- **Languages:** ${topLanguages.join(', ')}\n\n`;

  md += `## Top Projects\n\n`;
  for (const repo of topRepos) {
    md += `### [${repo.name}](${repo.url})\n`;
    if (repo.description) md += `${repo.description}\n`;
    md += `⭐ ${repo.stars} stars | 🍴 ${repo.forks} forks | ${repo.language || 'N/A'}\n\n`;
  }

  md += `---\n`;
  md += `*This Proof Card was auto-generated by [Orin](https://orin.app) — Turn your work into career proof.*\n`;

  return md;
}

function generateEmailDraft(profile: GitHubProfile, skills: string[]): string {
  const firstName = profile.name?.split(' ')[0] || profile.username;
  const topSkills = skills.slice(0, 3).join(', ') || 'software development';

  return `Subject: Your ${topSkills} work deserves to be seen — Free Proof Card inside

Hi ${firstName},

I came across your GitHub profile and was impressed by your work, especially in ${topSkills}.

I'm building [Orin](https://orin.app) — a platform that turns developers' scattered work into verified Proof Cards that recruiters can actually trust.

I auto-generated a Proof Card preview for you based on your public GitHub profile. Here's what it shows:

- **Top Skills:** ${skills.slice(0, 5).join(', ')}
- **Total Stars Earned:** ${profile.followers}+ followers worth of recognition
- **Public Repos:** ${profile.publicRepos} projects

**Want the full version?**

Sign up free at https://orin.app and connect your GitHub. The AI will:
1. Create verified Proof Cards from your repos
2. Match your skills to real job opportunities
3. Generate a shareable profile that recruiters trust

No credit card required. Takes 2 minutes.

Best,
[Your Name]
Orin — Turn Work Into Career Proof

P.S. I'm offering free early access to the first 100 developers who sign up. You're invited.`;
}

function generateLinkedinMessage(profile: GitHubProfile, skills: string[]): string {
  const firstName = profile.name?.split(' ')[0] || profile.username;
  const topSkills = skills.slice(0, 2).join(' and ') || 'software development';

  return `Hi ${firstName}!

I saw your work in ${topSkills} on GitHub — really impressive stuff.

I'm building Orin (orin.app), a platform that turns developer work into verified Proof Cards.

I auto-generated a Proof Card preview for your profile. Want me to share it?

It's free to sign up and takes 2 minutes. Each Proof Card is verified against your actual GitHub data — not self-reported skills.

Would love your feedback! 🙏`;
}

function generateProofCardJSON(profile: GitHubProfile, repos: GitHubRepo[], skills: string[]): string {
  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
  const topLanguages = [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 5);

  return JSON.stringify({
    username: profile.username,
    displayName: profile.name || profile.username,
    headline: generateHeadline(profile, skills),
    avatarUrl: profile.avatarUrl,
    profileUrl: `https://orin.app/${profile.username}`,
    stats: {
      publicRepos: profile.publicRepos,
      followers: profile.followers,
      totalStars,
      topLanguages
    },
    skills,
    topRepos: repos.slice(0, 5).map(r => ({
      name: r.name,
      url: r.url,
      description: r.description,
      stars: r.stars,
      forks: r.forks,
      language: r.language
    })),
    generatedAt: new Date().toISOString(),
    platform: 'Orin',
    platformUrl: 'https://orin.app'
  }, null, 2);
}

async function generateProofCardPreview(username: string): Promise<ProofCardPreview> {
  console.log(`Fetching GitHub profile for: ${username}`);

  const [profile, repos] = await Promise.all([
    fetchGitHubProfile(username),
    fetchGitHubRepos(username, 20)
  ]);

  if (!profile) {
    throw new Error(`GitHub user not found: ${username}`);
  }

  const skills = extractSkillsFromRepos(repos);
  const headline = generateHeadline(profile, skills);
  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
  const topLanguages = [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 5);
  const activeRepos = repos.filter(r => {
    const updated = new Date(r.updatedAt);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return updated > threeMonthsAgo;
  }).length;

  return {
    username: profile.username,
    displayName: profile.name || profile.username,
    headline,
    topSkills: skills,
    topRepos: repos.slice(0, 5),
    stats: {
      totalRepos: profile.publicRepos,
      totalStars,
      topLanguages,
      activeRepos
    },
    proofCardMarkdown: generateProofCardMarkdown(profile, repos, skills),
    emailDraft: generateEmailDraft(profile, skills),
    linkedinMessage: generateLinkedinMessage(profile, skills)
  };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Orin Cold Outreach Tool

Usage:
  npx tsx scripts/cold-outreach.ts <github-username> [--format email|markdown|json|all]
  npx tsx scripts/cold-outreach.ts --file usernames.txt [--format all]

Options:
  --format    Output format: email, markdown, json, or all (default: all)
  --file      File containing GitHub usernames (one per line)
  --help      Show this help message

Environment:
  GITHUB_TOKEN   Optional GitHub API token (increases rate limit to 5000/hr)

Examples:
  npx tsx scripts/cold-outreach.ts torvalds --format email
  npx tsx scripts/cold-outreach.ts --file github-users.txt --format all
`);
    process.exit(0);
  }

  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'all';
  const fileIndex = args.indexOf('--file');

  let usernames: string[] = [];

  if (fileIndex !== -1 && args[fileIndex + 1]) {
    const fs = await import('fs');
    const content = fs.readFileSync(args[fileIndex + 1], 'utf-8');
    usernames = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  } else {
    usernames = args.filter(a => !a.startsWith('--'));
  }

  if (usernames.length === 0) {
    console.error('No usernames provided');
    process.exit(1);
  }

  console.log(`\nGenerating Proof Card previews for ${usernames.length} user(s)...\n`);

  const results: ProofCardPreview[] = [];

  for (const username of usernames) {
    try {
      const preview = await generateProofCardPreview(username);
      results.push(preview);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`USER: ${preview.displayName} (@${preview.username})`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Headline: ${preview.headline}`);
      console.log(`Top Skills: ${preview.topSkills.join(', ')}`);
      console.log(`Stats: ${preview.stats.totalRepos} repos, ${preview.stats.totalStars} stars, ${preview.stats.activeRepos} active`);

      if (format === 'all' || format === 'markdown') {
        console.log(`\n--- PROOF CARD (Markdown) ---\n`);
        console.log(preview.proofCardMarkdown);
      }

      if (format === 'all' || format === 'email') {
        console.log(`\n--- EMAIL DRAFT ---\n`);
        console.log(preview.emailDraft);
      }

      if (format === 'all' || format === 'markdown') {
        console.log(`\n--- LINKEDIN MESSAGE ---\n`);
        console.log(preview.linkedinMessage);
      }

      if (format === 'json') {
        console.log(`\n--- JSON ---\n`);
        console.log(generateProofCardJSON(
          { username: preview.username, name: preview.displayName, bio: null, publicRepos: preview.stats.totalRepos, followers: 0, avatarUrl: '', url: `https://github.com/${preview.username}` },
          preview.topRepos,
          preview.topSkills
        ));
      }

      // Rate limit: wait 1 second between requests
      if (usernames.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`\nError processing ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY: Generated ${results.length} Proof Card preview(s)`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the generated content above`);
  console.log(`2. Personalize the email/LinkedIn messages`);
  console.log(`3. Send outreach to target developers`);
  console.log(`4. Track signups and engagement`);
  console.log(`\nTip: Set GITHUB_TOKEN env var to increase API rate limits`);
}

main().catch(console.error);
