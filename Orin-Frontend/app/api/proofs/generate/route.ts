import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const BACKEND_URL = process.env.BACKEND_URL || 'https://orin-server-production.up.railway.app';

async function fetchGitHubRepo(url: string) {
  // Extract owner/repo from GitHub URL
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');

  const [, owner, repo] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;

  const [repoRes, readmeRes] = await Promise.all([
    fetch(apiUrl, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    }),
    fetch(readmeUrl, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    }).catch(() => null),
  ]);

  if (!repoRes.ok) throw new Error('Failed to fetch GitHub repo');

  const repoData = await repoRes.json();
  let readmeContent = '';

  if (readmeRes?.ok) {
    const readmeData = await readmeRes.json();
    if (readmeData.content) {
      readmeContent = atob(readmeData.content.replace(/\n/g, '')).slice(0, 3000);
    }
  }

  return {
    title: repoData.name,
    description: repoData.description || '',
    language: repoData.language,
    topics: repoData.topics || [],
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    readme: readmeContent,
    url: repoData.html_url,
    homepage: repoData.homepage,
    createdAt: repoData.created_at,
    updatedAt: repoData.updated_at,
  };
}

async function generateProofFromGithub(repoData: ReturnType<typeof fetchGitHubRepo> extends Promise<infer T> ? T : never) {
  // Use AI to generate proof card from GitHub data
  try {
    const response = await fetch(`${BACKEND_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a career proof generator. Given a GitHub repository, generate a professional proof card.
Return ONLY a JSON object with these fields:
{
  "title": "Proof card title (max 100 chars)",
  "description": "Detailed description of what this project proves about the developer (2-3 sentences)",
  "skills": ["skill1", "skill2", ...],
  "whatItProves": ["proven capability 1", "proven capability 2"],
  "suggestedType": "github"
}`,
          },
          {
            role: 'user',
            content: `Generate a proof card for this GitHub repository:
Name: ${(repoData as any).title}
Description: ${(repoData as any).description}
Language: ${(repoData as any).language}
Topics: ${(repoData as any).topics?.join(', ')}
Stars: ${(repoData as any).stars}
Forks: ${(repoData as any).forks}
Readme excerpt: ${(repoData as any).readme?.slice(0, 1000)}`,
          },
        ],
        model: 'nvidia/nemotron-3-super-120b-a12b',
      }),
    });

    if (!response.ok) throw new Error('AI generation failed');

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.content;

    // Parse JSON from AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('AI generation failed, using fallback:', e);
  }

  // Fallback: generate from repo data directly
  return {
    title: (repoData as any).title,
    description: (repoData as any).description || `A ${(repoData as any).language} project with ${(repoData as any).stars} stars.`,
    skills: [(repoData as any).language, ...(repoData as any).topics?.slice(0, 4) || []].filter(Boolean),
    whatItProves: [
      `Built and maintained a ${(repoData as any).language} project`,
      ...(repoData as any).stars > 10 ? ['Gained community recognition'] : [],
    ],
    suggestedType: 'github',
  };
}

export async function POST(req: NextRequest) {
  try {
    const { url, userId } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Detect source type
    const isGithub = url.includes('github.com');
    const isKaggle = url.includes('kaggle.com');

    if (!isGithub && !isKaggle) {
      return NextResponse.json({
        error: 'Unsupported URL. Please use a GitHub repository URL.',
      }, { status: 400 });
    }

    if (isGithub) {
      const repoData = await fetchGitHubRepo(url);
      const proofData = await generateProofFromGithub(repoData);

      return NextResponse.json({
        success: true,
        sourceType: 'github',
        sourceUrl: url,
        proof: proofData,
        rawData: {
          language: repoData.language,
          stars: repoData.stars,
          forks: repoData.forks,
          topics: repoData.topics,
        },
      });
    }

    // Kaggle stub
    return NextResponse.json({
      error: 'Kaggle auto-import coming soon. Please create a proof card manually.',
    }, { status: 501 });
  } catch (e) {
    console.error('Proof generation error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate proof' },
      { status: 500 }
    );
  }
}
