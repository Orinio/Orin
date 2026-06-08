"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safetyGuardAgent = exports.portfolioScorerAgent = exports.learningPathAgent = exports.opportunityMatcherAgent = exports.skillAnalysisAgent = exports.chatAgent = exports.coachAgent = exports.verificationAgent = exports.routerAgent = void 0;
exports.getAgent = getAgent;
exports.getAllAgents = getAllAgents;
exports.getAgentIds = getAgentIds;
const verification_agent_js_1 = require("./verification.agent.js");
Object.defineProperty(exports, "verificationAgent", { enumerable: true, get: function () { return verification_agent_js_1.verificationAgent; } });
const coach_agent_js_1 = require("./coach.agent.js");
Object.defineProperty(exports, "coachAgent", { enumerable: true, get: function () { return coach_agent_js_1.coachAgent; } });
const chat_agent_js_1 = require("./chat.agent.js");
Object.defineProperty(exports, "chatAgent", { enumerable: true, get: function () { return chat_agent_js_1.chatAgent; } });
const skill_analysis_agent_js_1 = require("./skill-analysis.agent.js");
Object.defineProperty(exports, "skillAnalysisAgent", { enumerable: true, get: function () { return skill_analysis_agent_js_1.skillAnalysisAgent; } });
const opportunity_matcher_agent_js_1 = require("./opportunity-matcher.agent.js");
Object.defineProperty(exports, "opportunityMatcherAgent", { enumerable: true, get: function () { return opportunity_matcher_agent_js_1.opportunityMatcherAgent; } });
const learning_path_agent_js_1 = require("./learning-path.agent.js");
Object.defineProperty(exports, "learningPathAgent", { enumerable: true, get: function () { return learning_path_agent_js_1.learningPathAgent; } });
const portfolio_scorer_agent_js_1 = require("./portfolio-scorer.agent.js");
Object.defineProperty(exports, "portfolioScorerAgent", { enumerable: true, get: function () { return portfolio_scorer_agent_js_1.portfolioScorerAgent; } });
const safety_guard_agent_js_1 = require("./safety-guard.agent.js");
Object.defineProperty(exports, "safetyGuardAgent", { enumerable: true, get: function () { return safety_guard_agent_js_1.safetyGuardAgent; } });
const router_agent_js_1 = require("./router.agent.js");
Object.defineProperty(exports, "routerAgent", { enumerable: true, get: function () { return router_agent_js_1.routerAgent; } });
const agentRegistry = new Map();
const allAgents = [
    router_agent_js_1.routerAgent,
    verification_agent_js_1.verificationAgent,
    coach_agent_js_1.coachAgent,
    chat_agent_js_1.chatAgent,
    skill_analysis_agent_js_1.skillAnalysisAgent,
    opportunity_matcher_agent_js_1.opportunityMatcherAgent,
    learning_path_agent_js_1.learningPathAgent,
    portfolio_scorer_agent_js_1.portfolioScorerAgent,
    safety_guard_agent_js_1.safetyGuardAgent,
];
for (const agent of allAgents) {
    agentRegistry.set(agent.id, agent);
}
function getAgent(id) {
    return agentRegistry.get(id);
}
function getAllAgents() {
    return Array.from(agentRegistry.values());
}
function getAgentIds() {
    return Array.from(agentRegistry.keys());
}
//# sourceMappingURL=index.js.map