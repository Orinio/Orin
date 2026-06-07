import type { Tool } from './types.js';
export declare function registerTool(tool: Tool): void;
export declare function registerTools(tools: Tool[]): void;
export declare function getToolByName(name: string): Tool | undefined;
export declare function getToolsByNames(names: string[]): Tool[];
export declare function getToolsByCategory(category: Tool['category']): Tool[];
export declare function getAllTools(): Tool[];
export declare function getToolDescriptions(toolNames?: string[]): string;
//# sourceMappingURL=tool-registry.d.ts.map