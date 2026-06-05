export { verifyGithubRepoTool, verifyGithubUserTool, verifyCertificateTool, verifyKaggleTool, verifyLinkedInTool } from './verification.tools.js';
export { webSearchTool, fetchWebpageTool, isUrlSafe } from './search.tools.js';
export { analyzeCodeTool, extractSkillsTool, analyzePortfolioTool } from './analysis.tools.js';
export { generateEmbeddingsTool, detectLanguageTool } from './data.tools.js';
export { checkUrlSafetyTool, validateEmailTool } from './safety.tools.js';

import { verifyGithubRepoTool, verifyGithubUserTool, verifyCertificateTool, verifyKaggleTool, verifyLinkedInTool } from './verification.tools.js';
import { webSearchTool, fetchWebpageTool } from './search.tools.js';
import { analyzeCodeTool, extractSkillsTool, analyzePortfolioTool } from './analysis.tools.js';
import { generateEmbeddingsTool, detectLanguageTool } from './data.tools.js';
import { checkUrlSafetyTool, validateEmailTool } from './safety.tools.js';
import { registerTools } from '../core/tool-registry.js';
import type { Tool } from '../core/types.js';

export const allTools: Tool[] = [
  verifyGithubRepoTool, verifyGithubUserTool, verifyCertificateTool,
  verifyKaggleTool, verifyLinkedInTool,
  webSearchTool, fetchWebpageTool,
  analyzeCodeTool, extractSkillsTool, analyzePortfolioTool,
  checkUrlSafetyTool, validateEmailTool,
  generateEmbeddingsTool, detectLanguageTool,
];

export function initTools(): void {
  registerTools(allTools);
}
