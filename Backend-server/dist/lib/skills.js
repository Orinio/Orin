"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSkillsFromProofs = extractSkillsFromProofs;
exports.getSkillFrequencyMap = getSkillFrequencyMap;
exports.calculateSkillDepth = calculateSkillDepth;
exports.getSkillTrend = getSkillTrend;
exports.getSkillsByCategory = getSkillsByCategory;
exports.identifySkillGaps = identifySkillGaps;
exports.analyzeSkills = analyzeSkills;
exports.getSkillRecommendations = getSkillRecommendations;
function extractSkillsFromProofs(proofs) {
    const allSkills = proofs.flatMap((proof) => [
        ...(proof.skillsExtracted || []),
        ...(proof.skillsUserAdded || []),
    ]);
    const uniqueSkills = [...new Set(allSkills.map((s) => s.toLowerCase().trim()))];
    return uniqueSkills;
}
function getSkillFrequencyMap(proofs) {
    const frequencyMap = new Map();
    proofs.forEach((proof) => {
        const allSkills = [...(proof.skillsExtracted || []), ...(proof.skillsUserAdded || [])];
        allSkills.forEach((skill) => {
            const normalized = skill.toLowerCase().trim();
            frequencyMap.set(normalized, (frequencyMap.get(normalized) || 0) + 1);
        });
    });
    return frequencyMap;
}
function calculateSkillDepth(proofCount) {
    if (proofCount <= 1)
        return 'surface';
    if (proofCount <= 3)
        return 'moderate';
    return 'deep';
}
function getSkillTrend(proofs, skill) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentProofs = proofs.filter((p) => new Date(p.createdAt) >= thirtyDaysAgo &&
        [...(p.skillsExtracted || []), ...(p.skillsUserAdded || [])].some((s) => s.toLowerCase().trim() === skill));
    const olderProofs = proofs.filter((p) => new Date(p.createdAt) >= sixtyDaysAgo &&
        new Date(p.createdAt) < thirtyDaysAgo &&
        [...(p.skillsExtracted || []), ...(p.skillsUserAdded || [])].some((s) => s.toLowerCase().trim() === skill));
    if (recentProofs.length > olderProofs.length)
        return 'improving';
    if (recentProofs.length < olderProofs.length)
        return 'declining';
    return 'stable';
}
function getSkillsByCategory(proofs) {
    const categories = new Map();
    const categoryMap = {
        'Programming Languages': [
            'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
            'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql',
        ],
        'Web Development': [
            'html', 'css', 'react', 'next.js', 'node.js', 'express', 'vue', 'angular',
            'svelte', 'tailwind', 'bootstrap', 'sass', 'graphql', 'rest api', 'ajax',
        ],
        'Data Science': [
            'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
            'matplotlib', 'seaborn', 'jupyter', 'data analysis', 'machine learning',
            'deep learning', 'nlp', 'computer vision', 'statistics',
        ],
        'Cloud & DevOps': [
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'github actions',
            'terraform', 'ansible', 'linux', 'nginx', 'jenkins',
        ],
        'Databases': [
            'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'firebase',
            'supabase', 'prisma', 'sequelize', 'mongoose',
        ],
        'Tools & Frameworks': [
            'git', 'github', 'vs code', 'figma', 'postman', 'jira', 'confluence',
            'notion', 'slack', 'docker', 'webpack', 'vite',
        ],
        'Soft Skills': [
            'leadership', 'communication', 'teamwork', 'problem solving',
            'project management', 'agile', 'scrum', 'presentation',
        ],
    };
    const allSkills = extractSkillsFromProofs(proofs);
    allSkills.forEach((skill) => {
        for (const [category, keywords] of Object.entries(categoryMap)) {
            if (keywords.some((kw) => skill.includes(kw) || kw.includes(skill))) {
                const existing = categories.get(category) || [];
                if (!existing.includes(skill)) {
                    categories.set(category, [...existing, skill]);
                }
                break;
            }
        }
    });
    return categories;
}
function identifySkillGaps(currentSkills, targetRole) {
    const roleRequirements = {
        'frontend developer': {
            critical: ['javascript', 'react', 'html', 'css'],
            important: ['typescript', 'next.js', 'tailwind', 'git'],
            nice_to_have: ['vue', 'angular', 'svelte', 'testing'],
        },
        'backend developer': {
            critical: ['javascript', 'node.js', 'sql', 'api'],
            important: ['express', 'postgresql', 'mongodb', 'docker'],
            nice_to_have: ['graphql', 'redis', 'kubernetes', 'aws'],
        },
        'data scientist': {
            critical: ['python', 'pandas', 'numpy', 'machine learning'],
            important: ['sql', 'tensorflow', 'pytorch', 'scikit-learn'],
            nice_to_have: ['deep learning', 'nlp', 'computer vision', 'statistics'],
        },
        'full stack developer': {
            critical: ['javascript', 'react', 'node.js', 'sql'],
            important: ['typescript', 'next.js', 'express', 'git'],
            nice_to_have: ['docker', 'aws', 'graphql', 'testing'],
        },
        'devops engineer': {
            critical: ['docker', 'kubernetes', 'linux', 'ci/cd'],
            important: ['aws', 'terraform', 'ansible', 'github actions'],
            nice_to_have: ['jenkins', 'nginx', 'monitoring', 'logging'],
        },
    };
    const role = targetRole?.toLowerCase() || 'full stack developer';
    const requirements = roleRequirements[role] || roleRequirements['full stack developer'];
    const normalizedCurrent = currentSkills.map((s) => s.toLowerCase().trim());
    const gaps = [];
    requirements.critical.forEach((skill) => {
        if (!normalizedCurrent.some((s) => s.includes(skill) || skill.includes(s))) {
            gaps.push({
                skill,
                importance: 'critical',
                currentLevel: 0,
                targetLevel: 3,
            });
        }
    });
    requirements.important.forEach((skill) => {
        if (!normalizedCurrent.some((s) => s.includes(skill) || skill.includes(s))) {
            gaps.push({
                skill,
                importance: 'important',
                currentLevel: 0,
                targetLevel: 2,
            });
        }
    });
    requirements.nice_to_have.forEach((skill) => {
        if (!normalizedCurrent.some((s) => s.includes(skill) || skill.includes(s))) {
            gaps.push({
                skill,
                importance: 'nice_to_have',
                currentLevel: 0,
                targetLevel: 1,
            });
        }
    });
    return gaps;
}
function analyzeSkills(proofs, targetRole) {
    const frequencyMap = getSkillFrequencyMap(proofs);
    const allSkills = extractSkillsFromProofs(proofs);
    const skills = Array.from(frequencyMap.entries()).map(([name, count]) => ({
        name,
        count,
        depth: calculateSkillDepth(count),
        sources: [...new Set(proofs
                .filter((p) => [...(p.skillsExtracted || []), ...(p.skillsUserAdded || [])].some((s) => s.toLowerCase().trim() === name))
                .map((p) => p.sourceType))],
        lastUsed: new Date(Math.max(...proofs
            .filter((p) => [...(p.skillsExtracted || []), ...(p.skillsUserAdded || [])].some((s) => s.toLowerCase().trim() === name))
            .map((p) => new Date(p.createdAt).getTime()))),
        trend: getSkillTrend(proofs, name),
    }));
    skills.sort((a, b) => b.count - a.count);
    const verifiedProofs = proofs.filter((p) => p.verificationStatus === 'verified');
    const proofTypeDistribution = proofs.reduce((acc, proof) => {
        acc[proof.sourceType] = (acc[proof.sourceType] || 0) + 1;
        return acc;
    }, {});
    return {
        totalSkills: allSkills.length,
        uniqueSkills: frequencyMap.size,
        skills,
        topSkills: skills.slice(0, 10),
        skillGaps: identifySkillGaps(allSkills, targetRole),
        proofTypeDistribution,
        averageProofsPerSkill: allSkills.length / Math.max(frequencyMap.size, 1),
        verificationRate: proofs.length > 0 ? verifiedProofs.length / proofs.length : 0,
    };
}
function getSkillRecommendations(analysis) {
    const recommendations = [];
    analysis.skillGaps.forEach((gap) => {
        const priority = gap.importance === 'critical' ? 3 : gap.importance === 'important' ? 2 : 1;
        const reason = gap.importance === 'critical'
            ? `Essential skill for your target role`
            : gap.importance === 'important'
                ? `Highly valued in your field`
                : `Would strengthen your profile`;
        recommendations.push({
            skill: gap.skill,
            reason,
            priority,
        });
    });
    analysis.skills
        .filter((s) => s.trend === 'declining')
        .forEach((skill) => {
        recommendations.push({
            skill: skill.name,
            reason: `You haven't used this skill recently. Consider refreshing it.`,
            priority: 1,
        });
    });
    return recommendations.sort((a, b) => b.priority - a.priority);
}
//# sourceMappingURL=skills.js.map