import type { Tool } from './types.js';

const toolRegistry = new Map<string, Tool>();

export function registerTool(tool: Tool): void {
  toolRegistry.set(tool.name, tool);
}

export function registerTools(tools: Tool[]): void {
  for (const tool of tools) {
    toolRegistry.set(tool.name, tool);
  }
}

export function getToolByName(name: string): Tool | undefined {
  return toolRegistry.get(name);
}

export function getToolsByNames(names: string[]): Tool[] {
  return names.map(name => toolRegistry.get(name)).filter((t): t is Tool => !!t);
}

export function getToolsByCategory(category: Tool['category']): Tool[] {
  return Array.from(toolRegistry.values()).filter(t => t.category === category);
}

export function getAllTools(): Tool[] {
  return Array.from(toolRegistry.values());
}

export function getToolDescriptions(toolNames?: string[]): string {
  const tools = toolNames
    ? toolNames.map(n => toolRegistry.get(n)).filter((t): t is Tool => !!t)
    : Array.from(toolRegistry.values());

  return tools.map(t =>
    `- ${t.name}(${Object.entries(t.parameters.properties).map(([k, v]) => `${k}: ${v.type}`).join(', ')}): ${t.description}`
  ).join('\n');
}
