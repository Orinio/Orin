import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../lib/logger.js';

export const demoRouter = Router();

demoRouter.use(rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many demo scans. Please wait a minute.' } },
}));

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

const LANGUAGE_SKILLS: Record<string, string[]> = {
  TypeScript: ['TypeScript', 'React', 'Node.js'],
  JavaScript: ['JavaScript', 'React', 'Node.js'],
  Python: ['Python', 'Data Analysis', 'Machine Learning'],
  Java: ['Java', 'Spring', 'Backend Development'],
  Go: ['Go', 'Backend Development', 'DevOps'],
  Rust: ['Rust', 'Systems Programming'],
  'C++': ['C++', 'Systems Programming', 'Game Development'],
  'C#': ['C#', '.NET', 'Backend Development'],
  Ruby: ['Ruby', 'Rails', 'Backend Development'],
  PHP: ['PHP', 'Laravel', 'Web Development'],
  Swift: ['Swift', 'iOS Development'],
  Kotlin: ['Kotlin', 'Android Development'],
  Dart: ['Dart', 'Flutter', 'Mobile Development'],
  Shell: ['Bash', 'DevOps', 'Scripting'],
  HTML: ['HTML', 'CSS', 'Frontend Development'],
  CSS: ['CSS', 'Frontend Development', 'Web Design'],
  Jupyter: ['Python', 'Data Science', 'Machine Learning'],
  R: ['R', 'Data Science', 'Statistics'],
};

const SKILL_CATEGORIES: Record<string, string> = {
  React: 'Frontend',
  'Node.js': 'Backend',
  Python: 'Backend',
  TypeScript: 'Frontend',
  JavaScript: 'Frontend',
  'Machine Learning': 'Data & AI',
  'Data Analysis': 'Data & AI',
  'Data Science': 'Data & AI',
  'Backend Development': 'Backend',
  'Frontend Development': 'Frontend',
  'Mobile Development': 'Mobile',
  'iOS Development': 'Mobile',
  'Android Development': 'Mobile',
  'DevOps': 'Infrastructure',
  'Systems Programming': 'Systems',
  'Game Development': 'Game Dev',
  'Web Development': 'Frontend',
  'Web Design': 'Frontend',
  'Scripting': 'Infrastructure',
  '.NET': 'Backend',
  Rails: 'Backend',
  Spring: 'Backend',
  Laravel: 'Backend',
  Flutter: 'Mobile',
  Statistics: 'Data & AI',
};

function computeConfidence(repo: GitHubRepo, index: number): number {
  let score = 65;
  if (repo.stargazers_count > 10) score += 10;
  if (repo.stargazers_count > 50) score += 5;
  if (repo.forks_count > 5) score += 5;
  if (repo.description && repo.description.length > 20) score += 5;
  if (repo.topics && repo.topics.length > 0) score += 5;
  score = Math.min(98, score - index * 3);
  return Math.max(45, score);
}

demoRouter.get('/github/:username', async (req, res) => {
  const { username } = req.params;
  const requestId = req.id;

  if (!username || !/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    res.status(400).json({ error: 'Invalid GitHub username' });
    return;
  }

  try {
    const userResp = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'User-Agent': 'Orin-Demo' },
    });

    if (!userResp.ok) {
      if (userResp.status === 404) {
        res.status(404).json({ error: 'GitHub user not found' });
        return;
      }
      res.status(502).json({ error: 'Failed to fetch GitHub profile' });
      return;
    }

    const user = await userResp.json() as GitHubUser;

    const reposResp = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
      headers: { 'User-Agent': 'Orin-Demo' },
    });

    if (!reposResp.ok) {
      res.status(502).json({ error: 'Failed to fetch GitHub repos' });
      return;
    }

    const repos = await reposResp.json() as GitHubRepo[];

    if (!repos.length) {
      res.json({
        user: {
          login: user.login,
          name: user.name || user.login,
          avatar: user.avatar_url,
          bio: user.bio,
          publicRepos: user.public_repos,
          followers: user.followers,
        },
        proofCards: [],
        skills: [],
        proofScore: 15,
        message: 'No public repos found. Push some code and come back!',
      });
      return;
    }

    const proofCards = repos.slice(0, 6).map((repo, i) => ({
      id: `demo-${username}-${i}`,
      title: repo.name,
      description: repo.description || `A ${repo.language || 'code'} project`,
      source: 'github',
      sourceUrl: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      confidence: computeConfidence(repo, i),
      topics: repo.topics || [],
      updatedAt: repo.updated_at,
    }));

    const skillMap = new Map<string, { name: string; category: string; confidence: number; sources: string[] }>();
    for (const repo of repos) {
      if (repo.language && LANGUAGE_SKILLS[repo.language]) {
        for (const skill of LANGUAGE_SKILLS[repo.language]) {
          const existing = skillMap.get(skill);
          if (existing) {
            existing.confidence = Math.min(98, existing.confidence + 8);
            existing.sources.push(repo.name);
          } else {
            skillMap.set(skill, {
              name: skill,
              category: SKILL_CATEGORIES[skill] || 'Other',
              confidence: 60 + Math.floor(Math.random() * 15),
              sources: [repo.name],
            });
          }
        }
      }
      for (const topic of repo.topics || []) {
        const topicTitle = topic.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        if (!skillMap.has(topicTitle)) {
          skillMap.set(topicTitle, {
            name: topicTitle,
            category: SKILL_CATEGORIES[topicTitle] || 'Other',
            confidence: 55 + Math.floor(Math.random() * 10),
            sources: [repo.name],
          });
        }
      }
    }

    const skills = Array.from(skillMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);

    const repoCount = repos.length;
    const hasStars = repos.some(r => r.stargazers_count > 0);
    const hasMultipleLanguages = new Set(repos.map(r => r.language).filter(Boolean)).size > 2;
    const hasRecentActivity = repos.some(r => {
      const updated = new Date(r.updated_at);
      return Date.now() - updated.getTime() < 90 * 24 * 60 * 60 * 1000;
    });

    let proofScore = 25 + Math.min(repoCount * 5, 25);
    if (hasStars) proofScore += 10;
    if (hasMultipleLanguages) proofScore += 10;
    if (hasRecentActivity) proofScore += 10;
    if (user.followers > 10) proofScore += 5;
    proofScore = Math.min(95, proofScore);

    logger.info({ username, requestId, repoCount, proofScore }, 'Demo scan completed');

    res.json({
      user: {
        login: user.login,
        name: user.name || user.login,
        avatar: user.avatar_url,
        bio: user.bio,
        publicRepos: user.public_repos,
        followers: user.followers,
      },
      proofCards,
      skills,
      proofScore,
      proofScoreMessage: proofScore < 40
        ? 'Good start! Push more projects to boost your proof score.'
        : proofScore < 60
        ? 'Solid foundation. Add deployed projects and certificates to cross 60.'
        : proofScore < 80
        ? 'Strong profile. Add a live deployment and you\'re job-ready.'
        : 'Excellent! Your proof speaks for itself. Time to share it with recruiters.',
      nextStep: proofScore < 50
        ? 'Push at least 3 polished repos to GitHub with proper READMEs'
        : proofScore < 70
        ? 'Deploy one project live (Vercel/Netlify) and link it to your profile'
        : 'Start sharing your Orin profile with recruiters — you\'re ready',
      isDemo: true,
    });
  } catch (err) {
    logger.error({ err, username, requestId }, 'Demo scan failed');
    res.status(500).json({ error: 'Scan failed. Please try again.' });
  }
});
