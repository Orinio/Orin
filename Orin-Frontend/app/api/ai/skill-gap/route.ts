import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  importance: 'critical' | 'important' | 'nice_to_have';
  estimatedHours: number;
  resources: Array<{ title: string; url: string; type: string; hours: number; free: boolean }>;
}

interface ActionTask {
  title: string;
  skill: string;
  hours: number;
  resource: { title: string; url: string; type: string; free: boolean };
}

interface ActionPlan {
  week: number;
  focus: string;
  totalHours: number;
  tasks: ActionTask[];
}

interface SkillGapAnalysis {
  targetRole: string;
  readinessScore: number;
  estimatedWeeks: number;
  estimatedTotalHours: number;
  gaps: SkillGap[];
  actionPlan: ActionPlan[];
}

const ROLE_REQUIREMENTS: Record<string, {
  critical: Array<{ skill: string; level: number; hours: number }>;
  important: Array<{ skill: string; level: number; hours: number }>;
  nice_to_have: Array<{ skill: string; level: number; hours: number }>;
}> = {
  'frontend developer': {
    critical: [
      { skill: 'JavaScript', level: 80, hours: 40 },
      { skill: 'React', level: 75, hours: 30 },
      { skill: 'HTML', level: 90, hours: 10 },
      { skill: 'CSS', level: 85, hours: 15 },
    ],
    important: [
      { skill: 'TypeScript', level: 70, hours: 25 },
      { skill: 'Next.js', level: 65, hours: 20 },
      { skill: 'Tailwind CSS', level: 70, hours: 10 },
      { skill: 'Git', level: 75, hours: 8 },
    ],
    nice_to_have: [
      { skill: 'Testing', level: 60, hours: 15 },
      { skill: 'GraphQL', level: 50, hours: 12 },
      { skill: 'Performance Optimization', level: 55, hours: 10 },
    ],
  },
  'backend developer': {
    critical: [
      { skill: 'Node.js', level: 80, hours: 35 },
      { skill: 'SQL', level: 75, hours: 20 },
      { skill: 'API Design', level: 70, hours: 15 },
      { skill: 'Git', level: 80, hours: 8 },
    ],
    important: [
      { skill: 'Express', level: 70, hours: 15 },
      { skill: 'PostgreSQL', level: 65, hours: 20 },
      { skill: 'Docker', level: 60, hours: 12 },
      { skill: 'Testing', level: 65, hours: 15 },
    ],
    nice_to_have: [
      { skill: 'Redis', level: 50, hours: 8 },
      { skill: 'GraphQL', level: 55, hours: 12 },
      { skill: 'Kubernetes', level: 40, hours: 20 },
    ],
  },
  'full stack developer': {
    critical: [
      { skill: 'JavaScript', level: 85, hours: 40 },
      { skill: 'React', level: 75, hours: 30 },
      { skill: 'Node.js', level: 70, hours: 25 },
      { skill: 'SQL', level: 70, hours: 15 },
    ],
    important: [
      { skill: 'TypeScript', level: 70, hours: 25 },
      { skill: 'Next.js', level: 65, hours: 20 },
      { skill: 'Express', level: 65, hours: 15 },
      { skill: 'Git', level: 80, hours: 8 },
    ],
    nice_to_have: [
      { skill: 'Docker', level: 55, hours: 12 },
      { skill: 'AWS', level: 50, hours: 20 },
      { skill: 'Testing', level: 60, hours: 15 },
    ],
  },
  'data scientist': {
    critical: [
      { skill: 'Python', level: 85, hours: 40 },
      { skill: 'SQL', level: 75, hours: 15 },
      { skill: 'Machine Learning', level: 70, hours: 50 },
      { skill: 'Statistics', level: 75, hours: 30 },
    ],
    important: [
      { skill: 'Pandas', level: 80, hours: 20 },
      { skill: 'NumPy', level: 75, hours: 15 },
      { skill: 'Scikit-learn', level: 70, hours: 25 },
      { skill: 'Data Visualization', level: 65, hours: 15 },
    ],
    nice_to_have: [
      { skill: 'TensorFlow', level: 55, hours: 30 },
      { skill: 'PyTorch', level: 55, hours: 30 },
      { skill: 'Deep Learning', level: 50, hours: 40 },
    ],
  },
  'devops engineer': {
    critical: [
      { skill: 'Docker', level: 85, hours: 20 },
      { skill: 'Kubernetes', level: 80, hours: 40 },
      { skill: 'Linux', level: 85, hours: 25 },
      { skill: 'CI/CD', level: 80, hours: 15 },
    ],
    important: [
      { skill: 'AWS', level: 75, hours: 30 },
      { skill: 'Terraform', level: 70, hours: 25 },
      { skill: 'Ansible', level: 65, hours: 20 },
      { skill: 'GitHub Actions', level: 75, hours: 10 },
    ],
    nice_to_have: [
      { skill: 'Jenkins', level: 55, hours: 15 },
      { skill: 'Nginx', level: 60, hours: 10 },
      { skill: 'Monitoring', level: 60, hours: 12 },
    ],
  },
  'designer': {
    critical: [
      { skill: 'Figma', level: 85, hours: 25 },
      { skill: 'UI Design', level: 80, hours: 30 },
      { skill: 'UX Research', level: 70, hours: 20 },
      { skill: 'Prototyping', level: 75, hours: 15 },
    ],
    important: [
      { skill: 'Photoshop', level: 65, hours: 20 },
      { skill: 'Illustrator', level: 60, hours: 20 },
      { skill: 'Design Systems', level: 65, hours: 15 },
      { skill: 'User Testing', level: 60, hours: 10 },
    ],
    nice_to_have: [
      { skill: 'Motion Design', level: 50, hours: 20 },
      { skill: 'CSS', level: 55, hours: 15 },
      { skill: 'Accessibility', level: 60, hours: 10 },
    ],
  },
  'product manager': {
    critical: [
      { skill: 'Product Strategy', level: 80, hours: 20 },
      { skill: 'User Research', level: 75, hours: 25 },
      { skill: 'Analytics', level: 70, hours: 15 },
      { skill: 'Roadmapping', level: 80, hours: 10 },
    ],
    important: [
      { skill: 'SQL', level: 60, hours: 15 },
      { skill: 'A/B Testing', level: 65, hours: 12 },
      { skill: 'Agile', level: 75, hours: 10 },
      { skill: 'Wireframing', level: 60, hours: 15 },
    ],
    nice_to_have: [
      { skill: 'Figma', level: 50, hours: 15 },
      { skill: 'Competitive Analysis', level: 60, hours: 8 },
      { skill: 'Financial Modeling', level: 45, hours: 20 },
    ],
  },
};

const LEARNING_RESOURCES: Record<string, Array<{ title: string; url: string; type: string; hours: number; free: boolean }>> = {
  'javascript': [
    { title: 'JavaScript.info', url: 'https://javascript.info/', type: 'tutorial', hours: 40, free: true },
    { title: 'FreeCodeCamp JavaScript', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/', type: 'course', hours: 300, free: true },
  ],
  'react': [
    { title: 'React Official Tutorial', url: 'https://react.dev/learn', type: 'tutorial', hours: 8, free: true },
    { title: 'Scrimba Learn React', url: 'https://scrimba.com/learn/learnreact', type: 'course', hours: 5, free: true },
  ],
  'typescript': [
    { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'documentation', hours: 10, free: true },
  ],
  'node.js': [
    { title: 'Node.js Official Docs', url: 'https://nodejs.org/en/learn', type: 'documentation', hours: 10, free: true },
  ],
  'python': [
    { title: 'Python.org Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'documentation', hours: 15, free: true },
    { title: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com/', type: 'course', hours: 30, free: true },
  ],
  'sql': [
    { title: 'SQLBolt', url: 'https://sqlbolt.com/', type: 'practice', hours: 3, free: true },
  ],
  'docker': [
    { title: 'Docker Getting Started', url: 'https://docs.docker.com/get-started/', type: 'documentation', hours: 4, free: true },
  ],
  'machine learning': [
    { title: 'Google ML Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', hours: 15, free: true },
  ],
};

function calculateSkillLevel(proofCount: number, verifiedCount: number, recentActivity: boolean): number {
  let level = 0;
  if (proofCount >= 5) level += 60;
  else if (proofCount >= 3) level += 45;
  else if (proofCount >= 1) level += 25;
  if (verifiedCount > 0) level += Math.min(20, verifiedCount * 5);
  if (recentActivity) level += 15;
  return Math.min(100, level);
}

function analyzeSkillGaps(
  currentSkills: Array<{ name: string; level: number }>,
  targetRole: string
): SkillGapAnalysis {
  const roleKey = targetRole.toLowerCase();
  const requirements = ROLE_REQUIREMENTS[roleKey] || ROLE_REQUIREMENTS['full stack developer'];
  const currentSkillMap = new Map(currentSkills.map(s => [s.name.toLowerCase(), s.level]));
  const gaps: SkillGap[] = [];

  for (const req of [...requirements.critical, ...requirements.important, ...requirements.nice_to_have]) {
    const currentLevel = currentSkillMap.get(req.skill.toLowerCase()) || 0;
    const gap = req.level - currentLevel;
    if (gap > 0) {
      const importance = requirements.critical.some(r => r.skill === req.skill) ? 'critical'
        : requirements.important.some(r => r.skill === req.skill) ? 'important' : 'nice_to_have';
      gaps.push({
        skill: req.skill,
        currentLevel,
        targetLevel: req.level,
        gap,
        importance,
        estimatedHours: Math.ceil(req.hours * (gap / 100)),
        resources: LEARNING_RESOURCES[req.skill.toLowerCase()] || [],
      });
    }
  }

  gaps.sort((a, b) => {
    const order = { critical: 0, important: 1, nice_to_have: 2 };
    if (order[a.importance] !== order[b.importance]) return order[a.importance] - order[b.importance];
    return b.gap - a.gap;
  });

  const totalPossible = requirements.critical.reduce((s, r) => s + r.level, 0) +
    requirements.important.reduce((s, r) => s + r.level, 0);
  const totalCurrent = requirements.critical.reduce((s, r) => s + (currentSkillMap.get(r.skill.toLowerCase()) || 0), 0) +
    requirements.important.reduce((s, r) => s + (currentSkillMap.get(r.skill.toLowerCase()) || 0), 0);
  const readinessScore = Math.round((totalCurrent / totalPossible) * 100);

  const totalHours = gaps.reduce((s, g) => s + g.estimatedHours, 0);

  const actionPlan: ActionPlan[] = [];
  const priorityGaps = gaps.filter(g => g.importance === 'critical' || g.importance === 'important');
  let currentWeek = 1;
  let weekHours = 0;
  let weekTasks: ActionTask[] = [];

  for (const gap of priorityGaps) {
    if (weekHours + Math.min(gap.estimatedHours, 4) > 10 && weekTasks.length > 0) {
      actionPlan.push({ week: currentWeek, focus: weekTasks.map(t => t.skill).join(', '), tasks: weekTasks, totalHours: weekHours });
      currentWeek++;
      weekHours = 0;
      weekTasks = [];
    }
    if (currentWeek > 2) break;
    const taskHours = Math.min(gap.estimatedHours, 4);
    const resource = gap.resources[0] || { title: `Learn ${gap.skill}`, url: `https://www.google.com/search?q=learn+${gap.skill.toLowerCase()}`, type: 'course', hours: taskHours, free: true };
    weekTasks.push({ title: `Learn ${gap.skill}`, skill: gap.skill, hours: taskHours, resource });
    weekHours += taskHours;
  }
  if (weekTasks.length > 0) {
    actionPlan.push({ week: currentWeek, focus: weekTasks.map(t => t.skill).join(', '), tasks: weekTasks, totalHours: weekHours });
  }

  return {
    targetRole,
    readinessScore: Math.min(100, readinessScore),
    estimatedWeeks: Math.ceil(totalHours / 10),
    estimatedTotalHours: totalHours,
    gaps,
    actionPlan,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId, targetRole } = await req.json();

    if (!userId || !targetRole) {
      return NextResponse.json({ error: 'userId and targetRole are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: proofs } = await supabase
      .from('proof_cards')
      .select('skills_extracted, verification_status, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null);

    const skillMap = new Map<string, { count: number; verifiedCount: number; recent: boolean }>();
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    for (const proof of proofs || []) {
      for (const skill of proof.skills_extracted || []) {
        const existing = skillMap.get(skill) || { count: 0, verifiedCount: 0, recent: false };
        existing.count++;
        if (proof.verification_status === 'verified') existing.verifiedCount++;
        if (proof.created_at && new Date(proof.created_at) > threeMonthsAgo) existing.recent = true;
        skillMap.set(skill, existing);
      }
    }

    const currentSkills = Array.from(skillMap.entries()).map(([name, data]) => ({
      name,
      level: calculateSkillLevel(data.count, data.verifiedCount, data.recent),
    }));

    const analysis = analyzeSkillGaps(currentSkills, targetRole);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('Skill gap analysis error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}
