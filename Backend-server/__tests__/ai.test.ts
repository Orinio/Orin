import { describe, it, expect } from 'vitest';
import { getAllTools, getToolByName, getToolsByCategory } from '../src/lib/ai/core/tool-registry.js';
import { getAgent, getAllAgents, getAgentIds } from '../src/lib/ai/agents/index.js';
import { initTools } from '../src/lib/ai/tools/index.js';

describe('Tool Registry', () => {
  it('should have all 14 tools registered after initTools', () => {
    initTools();
    const tools = getAllTools();
    expect(tools.length).toBeGreaterThanOrEqual(14);
  });

  it('should return a tool by name', () => {
    initTools();
    const tool = getToolByName('verify_github_repo');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('verify_github_repo');
    expect(tool?.category).toBe('verification');
  });

  it('should return tools by category', () => {
    initTools();
    const verificationTools = getToolsByCategory('verification');
    expect(verificationTools.length).toBeGreaterThanOrEqual(3);
    verificationTools.forEach(tool => {
      expect(tool.category).toBe('verification');
    });
  });

  it('should have required fields on each tool', () => {
    initTools();
    const tools = getAllTools();
    tools.forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.parameters).toBeDefined();
      expect(typeof tool.execute).toBe('function');
    });
  });
});

describe('Agent Registry', () => {
  it('should register and retrieve agents', () => {
    const agent = getAgent('verification');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('verification');
    expect(agent?.name).toBe('Verification Agent');
  });

  it('should return all agents', () => {
    const agents = getAllAgents();
    expect(agents.length).toBeGreaterThanOrEqual(8);
  });

  it('should return agent ids', () => {
    const ids = getAgentIds();
    expect(ids).toContain('verification');
    expect(ids).toContain('chat');
    expect(ids).toContain('coach');
  });

  it('should return undefined for unknown agent', () => {
    const agent = getAgent('nonexistent');
    expect(agent).toBeUndefined();
  });
});
