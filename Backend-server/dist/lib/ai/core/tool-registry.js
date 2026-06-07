"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTool = registerTool;
exports.registerTools = registerTools;
exports.getToolByName = getToolByName;
exports.getToolsByNames = getToolsByNames;
exports.getToolsByCategory = getToolsByCategory;
exports.getAllTools = getAllTools;
exports.getToolDescriptions = getToolDescriptions;
const toolRegistry = new Map();
function registerTool(tool) {
    toolRegistry.set(tool.name, tool);
}
function registerTools(tools) {
    for (const tool of tools) {
        toolRegistry.set(tool.name, tool);
    }
}
function getToolByName(name) {
    return toolRegistry.get(name);
}
function getToolsByNames(names) {
    return names.map(name => toolRegistry.get(name)).filter((t) => !!t);
}
function getToolsByCategory(category) {
    return Array.from(toolRegistry.values()).filter(t => t.category === category);
}
function getAllTools() {
    return Array.from(toolRegistry.values());
}
function getToolDescriptions(toolNames) {
    const tools = toolNames
        ? toolNames.map(n => toolRegistry.get(n)).filter((t) => !!t)
        : Array.from(toolRegistry.values());
    return tools.map(t => `- ${t.name}(${Object.entries(t.parameters.properties).map(([k, v]) => `${k}: ${v.type}`).join(', ')}): ${t.description}`).join('\n');
}
//# sourceMappingURL=tool-registry.js.map