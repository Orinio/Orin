/**
 * Orin - Skill Gap Engine
 * Calculates skill gaps and generates actionable 1-2 week plans.
 */

export interface SkillGap {
  skill: string;
  currentLevel: number; // 0-100
  targetLevel: number; // 0-100
  gap: number; // targetLevel - currentLevel
  importance: 'critical' | 'important' | 'nice_to_have';
  estimatedHours: number;
  resources: LearningResource[];
}

export interface LearningResource {
  title: string;
  url: string;
  type: 'course' | 'tutorial' | 'practice' | 'project' | 'documentation';
  hours: number;
  free: boolean;
}

export interface ActionPlan {
  week: number;
  focus: string;
  tasks: ActionTask[];
  totalHours: number;
}

export interface ActionTask {
  id: string;
  title: string;
  skill: string;
  hours: number;
  resource: LearningResource;
  completed: boolean;
}

export interface SkillGapAnalysis {
  targetRole: string;
  currentSkills: string[];
  gaps: SkillGap[];
  actionPlan: ActionPlan[];
  estimatedTotalHours: number;
  estimatedWeeks: number;
  readinessScore: number; // 0-100
}

// Role requirements database
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

// Learning resources database
const LEARNING_RESOURCES: Record<string, LearningResource[]> = {
  'javascript': [
    { title: 'JavaScript.info', url: 'https://javascript.info/', type: 'tutorial', hours: 40, free: true },
    { title: 'FreeCodeCamp JavaScript', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/', type: 'course', hours: 300, free: true },
    { title: 'Eloquent JavaScript', url: 'https://eloquentjavascript.net/', type: 'documentation', hours: 20, free: true },
  ],
  'react': [
    { title: 'React Official Tutorial', url: 'https://react.dev/learn', type: 'tutorial', hours: 8, free: true },
    { title: 'FreeCodeCamp React Course', url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/', type: 'course', hours: 300, free: true },
    { title: 'Scrimba Learn React', url: 'https://scrimba.com/learn/learnreact', type: 'course', hours: 5, free: true },
  ],
  'typescript': [
    { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'documentation', hours: 10, free: true },
    { title: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play', type: 'practice', hours: 2, free: true },
  ],
  'node.js': [
    { title: 'Node.js Official Docs', url: 'https://nodejs.org/en/learn', type: 'documentation', hours: 10, free: true },
    { title: 'The Odin Project NodeJS', url: 'https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs', type: 'course', hours: 100, free: true },
  ],
  'python': [
    { title: 'Python.org Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'documentation', hours: 15, free: true },
    { title: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com/', type: 'course', hours: 30, free: true },
  ],
  'sql': [
    { title: 'SQLBolt', url: 'https://sqlbolt.com/', type: 'practice', hours: 3, free: true },
    { title: 'Mode Analytics SQL Tutorial', url: 'https://mode.com/sql-tutorial/', type: 'tutorial', hours: 5, free: true },
  ],
  'docker': [
    { title: 'Docker Getting Started', url: 'https://docs.docker.com/get-started/', type: 'documentation', hours: 4, free: true },
    { title: 'Docker Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', type: 'course', hours: 2, free: true },
  ],
  'git': [
    { title: 'Git Official Documentation', url: 'https://git-scm.com/doc', type: 'documentation', hours: 5, free: true },
    { title: 'Learn Git Branching', url: 'https://learngitbranching.js.org/', type: 'practice', hours: 3, free: true },
  ],
  'aws': [
    { title: 'AWS Cloud Practitioner', url: 'https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials', type: 'course', hours: 6, free: true },
    { title: 'AWS Free Tier', url: 'https://aws.amazon.com/free/', type: 'practice', hours: 0, free: true },
  ],
  'figma': [
    { title: 'Figma Official Tutorials', url: 'https://help.figma.com/hc/en-us/articles/360040313094', type: 'tutorial', hours: 5, free: true },
    { title: 'Figma YouTube Channel', url: 'https://www.youtube.com/@figma', type: 'course', hours: 20, free: true },
  ],
  'machine learning': [
    { title: 'Google ML Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', hours: 15, free: true },
    { title: 'Fast.ai Practical Deep Learning', url: 'https://course.fast.ai/', type: 'course', hours: 30, free: true },
  ],
};

/**
 * Calculate skill level based on proof count and quality
 */
export function calculateSkillLevel(
  _skill: string,
  proofCount: number,
  verifiedCount: number,
  recentActivity: boolean
): number {
  let level = 0;

  // Base level from proof count
  if (proofCount >= 5) level += 60;
  else if (proofCount >= 3) level += 45;
  else if (proofCount >= 1) level += 25;

  // Bonus for verification
  if (verifiedCount > 0) {
    level += Math.min(20, verifiedCount * 5);
  }

  // Bonus for recent activity
  if (recentActivity) {
    level += 15;
  }

  return Math.min(100, level);
}

/**
 * Analyze skill gaps for a target role
 */
export function analyzeSkillGaps(
  currentSkills: Array<{ name: string; level: number }>,
  targetRole: string
): SkillGapAnalysis {
  const roleKey = targetRole.toLowerCase();
  const requirements = ROLE_REQUIREMENTS[roleKey] || ROLE_REQUIREMENTS['full stack developer'];

  const currentSkillMap = new Map(currentSkills.map(s => [s.name.toLowerCase(), s.level]));
  const gaps: SkillGap[] = [];

  // Process critical skills
  for (const req of requirements.critical) {
    const currentLevel = currentSkillMap.get(req.skill.toLowerCase()) || 0;
    const gap = req.level - currentLevel;

    if (gap > 0) {
      gaps.push({
        skill: req.skill,
        currentLevel,
        targetLevel: req.level,
        gap,
        importance: 'critical',
        estimatedHours: Math.ceil(req.hours * (gap / 100)),
        resources: LEARNING_RESOURCES[req.skill.toLowerCase()] || [],
      });
    }
  }

  // Process important skills
  for (const req of requirements.important) {
    const currentLevel = currentSkillMap.get(req.skill.toLowerCase()) || 0;
    const gap = req.level - currentLevel;

    if (gap > 0) {
      gaps.push({
        skill: req.skill,
        currentLevel,
        targetLevel: req.level,
        gap,
        importance: 'important',
        estimatedHours: Math.ceil(req.hours * (gap / 100)),
        resources: LEARNING_RESOURCES[req.skill.toLowerCase()] || [],
      });
    }
  }

  // Process nice-to-have skills
  for (const req of requirements.nice_to_have) {
    const currentLevel = currentSkillMap.get(req.skill.toLowerCase()) || 0;
    const gap = req.level - currentLevel;

    if (gap > 0) {
      gaps.push({
        skill: req.skill,
        currentLevel,
        targetLevel: req.level,
        gap,
        importance: 'nice_to_have',
        estimatedHours: Math.ceil(req.hours * (gap / 100)),
        resources: LEARNING_RESOURCES[req.skill.toLowerCase()] || [],
      });
    }
  }

  // Sort gaps by importance and size
  gaps.sort((a, b) => {
    const importanceOrder = { critical: 0, important: 1, nice_to_have: 2 };
    if (importanceOrder[a.importance] !== importanceOrder[b.importance]) {
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    }
    return b.gap - a.gap;
  });

  // Generate action plan
  const actionPlan = generateActionPlan(gaps);

  // Calculate readiness score
  const totalPossible = requirements.critical.reduce((sum, r) => sum + r.level, 0) +
    requirements.important.reduce((sum, r) => sum + r.level, 0);
  const totalCurrent = requirements.critical.reduce((sum, r) => sum + (currentSkillMap.get(r.skill.toLowerCase()) || 0), 0) +
    requirements.important.reduce((sum, r) => sum + (currentSkillMap.get(r.skill.toLowerCase()) || 0), 0);
  const readinessScore = Math.round((totalCurrent / totalPossible) * 100);

  return {
    targetRole,
    currentSkills: currentSkills.map(s => s.name),
    gaps,
    actionPlan,
    estimatedTotalHours: gaps.reduce((sum, g) => sum + g.estimatedHours, 0),
    estimatedWeeks: Math.ceil(gaps.reduce((sum, g) => sum + g.estimatedHours, 0) / 10),
    readinessScore: Math.min(100, readinessScore),
  };
}

/**
 * Generate 1-2 week action plan
 */
function generateActionPlan(gaps: SkillGap[]): ActionPlan[] {
  const plans: ActionPlan[] = [];
  const hoursPerWeek = 10; // Assume 10 hours per week

  // Focus on critical and important gaps first
  const priorityGaps = gaps.filter(g => g.importance === 'critical' || g.importance === 'important');

  let currentWeek = 1;
  let currentWeekHours = 0;
  let currentTasks: ActionTask[] = [];

  for (const gap of priorityGaps) {
    // If adding this task would exceed weekly hours, start new week
    if (currentWeekHours + Math.min(gap.estimatedHours, 4) > hoursPerWeek && currentTasks.length > 0) {
      plans.push({
        week: currentWeek,
        focus: currentTasks.map(t => t.skill).join(', '),
        tasks: currentTasks,
        totalHours: currentWeekHours,
      });
      currentWeek++;
      currentWeekHours = 0;
      currentTasks = [];
    }

    // Limit to 2 weeks max
    if (currentWeek > 2) break;

    // Create task for this gap
    const taskHours = Math.min(gap.estimatedHours, 4); // Max 4 hours per task
    const resource = gap.resources[0] || {
      title: `Learn ${gap.skill}`,
      url: `https://www.google.com/search?q=learn+${gap.skill.toLowerCase()}`,
      type: 'course' as const,
      hours: taskHours,
      free: true,
    };

    currentTasks.push({
      id: `task-${gap.skill.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Learn ${gap.skill}`,
      skill: gap.skill,
      hours: taskHours,
      resource,
      completed: false,
    });

    currentWeekHours += taskHours;
  }

  // Add final week if has tasks
  if (currentTasks.length > 0) {
    plans.push({
      week: currentWeek,
      focus: currentTasks.map(t => t.skill).join(', '),
      tasks: currentTasks,
      totalHours: currentWeekHours,
    });
  }

  return plans;
}

/**
 * Get available target roles
 */
export function getAvailableRoles(): string[] {
  return Object.keys(ROLE_REQUIREMENTS);
}

/**
 * Get role requirements summary
 */
export function getRoleRequirements(role: string) {
  const roleKey = role.toLowerCase();
  return ROLE_REQUIREMENTS[roleKey] || null;
}
