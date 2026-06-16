import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  updated_at: string;
  fork: boolean;
  topics: string[];
}

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  public_repos: number;
  followers: number;
}

const HIGH_VALUE_INDICATORS = [
  'react', 'nextjs', 'node', 'python', 'typescript', 'javascript',
  'machine-learning', 'data-science', 'api', 'database', 'docker',
  'aws', 'graphql', 'testing', 'ci-cd', 'web-app', 'mobile',
  'fullstack', 'frontend', 'backend', 'devops', 'ai', 'ml',
];

function calculateProofScore(repos: GitHubRepo[]): number {
  let score = 0;

  for (const repo of repos) {
    if (repo.fork) continue;

    // Stars indicate quality
    if (repo.stargazers_count > 100) score += 15;
    else if (repo.stargazers_count > 50) score += 10;
    else if (repo.stargazers_count > 10) score += 5;
    else if (repo.stargazers_count > 0) score += 2;

    // Language diversity
    if (repo.language) score += 3;

    // Topics indicate intentionality
    if (repo.topics && repo.topics.length > 0) {
      const hasHighValue = repo.topics.some(t => HIGH_VALUE_INDICATORS.includes(t));
      if (hasHighValue) score += 5;
    }

    // Description indicates documentation
    if (repo.description && repo.description.length > 20) score += 3;
  }

  return Math.min(100, score);
}

function isTopProject(repo: GitHubRepo): boolean {
  if (repo.fork) return false;
  if (repo.stargazers_count > 5) return true;
  if (repo.description && repo.description.length > 30) return true;
  if (repo.topics && repo.topics.length > 0) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  // Validate username format
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
    return NextResponse.json(
      { error: 'Invalid GitHub username format' },
      { status: 400 }
    );
  }

  try {
    // Fetch user profile
    const userResponse = await fetch(`${GITHUB_API}/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        return NextResponse.json(
          { error: 'GitHub user not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch GitHub profile' },
        { status: 502 }
      );
    }

    const user: GitHubUser = await userResponse.json();

    // Fetch repositories
    const reposResponse = await fetch(
      `${GITHUB_API}/users/${username}/repos?sort=updated&per_page=30`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
      }
    );

    if (!reposResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch repositories' },
        { status: 502 }
      );
    }

    const repos: GitHubRepo[] = await reposResponse.json();

    // Process repos
    const processedRepos = repos.map(repo => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      updatedAt: repo.updated_at,
      isTopProject: isTopProject(repo),
    }));

    // Calculate top languages
    const languageCounts: Record<string, number> = {};
    for (const repo of repos) {
      if (repo.language && !repo.fork) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    }

    const topLanguages = Object.entries(languageCounts)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate proof score
    const proofScore = calculateProofScore(repos);

    return NextResponse.json({
      username: user.login,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      publicRepos: user.public_repos,
      followers: user.followers,
      repos: processedRepos,
      topLanguages,
      proofScore,
    });
  } catch (error) {
    console.error('Demo scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
