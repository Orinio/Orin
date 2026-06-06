const NVIDIA_API_KEY = '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// Test categories and models
const TEST_MODELS = {
  "Text Generation - Light": [
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.2-3b-instruct",
    "google/gemma-2-9b-it",
    "mistralai/mistral-7b-instruct-v0.3",
    "nvidia/llama-3.1-nemotron-nano-8b-v1",
    "microsoft/phi-4-mini-instruct"
  ],
  "Text Generation - Medium": [
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.3-70b-instruct",
    "mistralai/mistral-large-2-instruct",
    "deepseek-ai/deepseek-v4-flash",
    "qwen/qwen3.5-122b-a10b",
    "nvidia/llama-3.3-nemotron-super-49b-v1"
  ],
  "Text Generation - Heavy": [
    "moonshotai/kimi-k2.6",
    "deepseek-ai/deepseek-v4-pro",
    "minimaxai/minimax-m2.7",
    "z-ai/glm-5.1",
    "mistralai/mistral-large-3-675b-instruct-2512",
    "qwen/qwen3-coder-480b-a35b-instruct",
    "qwen/qwen3.5-397b-a17b",
    "nvidia/llama-3.1-nemotron-ultra-253b-v1"
  ],
  "Code Generation": [
    "mistralai/codestral-22b-instruct-v0.1",
    "bigcode/starcoder2-15b",
    "deepseek-ai/deepseek-coder-6.7b-instruct",
    "google/codegemma-1.1-7b",
    "ibm/granite-34b-code-instruct",
    "meta/codellama-70b"
  ],
  "Embeddings": [
    "nvidia/nv-embed-v1",
    "nvidia/nv-embedqa-e5-v5",
    "nvidia/nv-embedqa-mistral-7b-v2",
    "nvidia/llama-3.2-nv-embedqa-1b-v1",
    "baai/bge-m3",
    "snowflake/arctic-embed-l",
    "nvidia/embed-qa-4"
  ],
  "Vision": [
    "meta/llama-3.2-90b-vision-instruct",
    "meta/llama-3.2-11b-vision-instruct",
    "microsoft/phi-4-multimodal-instruct",
    "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
    "nvidia/neva-22b"
  ],
  "Safety": [
    "nvidia/llama-3.1-nemoguard-8b-content-safety",
    "nvidia/llama-3.1-nemoguard-8b-topic-control",
    "nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
    "nvidia/gliner-pii"
  ]
};

// Test prompts for different scenarios
const TEST_PROMPTS = {
  "career_advice": {
    system: "You are Orin AI, a career advisor for developers. Be concise and actionable.",
    user: "I know React and JavaScript. What should I learn next to get a frontend developer job?",
    criteria: ["relevance", "conciseness", "actionability"]
  },
  "skill_analysis": {
    system: "You are a skill extraction AI. Extract skills from text and return JSON.",
    user: "I built a full-stack app with React, Node.js, PostgreSQL, and deployed it on AWS using Docker.",
    criteria: ["accuracy", "completeness", "json_format"]
  },
  "portfolio_scoring": {
    system: "Score developer portfolios from 0-100. Return JSON with score and breakdown.",
    user: "Portfolio: 5 GitHub projects, 3 certificates, skills: React, Python, ML. Active last month.",
    criteria: ["scoring_accuracy", "breakdown_quality", "json_format"]
  },
  "learning_path": {
    system: "Create personalized learning paths. Be specific with resources and time estimates.",
    user: "I want to transition from frontend to full-stack. I know React and want to learn Node.js and databases.",
    criteria: ["specificity", "resource_quality", "time_estimates"]
  },
  "opportunity_matching": {
    system: "Match developer skills to job opportunities. Provide match score and reasoning.",
    user: "Candidate skills: React, TypeScript, Node.js, PostgreSQL. Job requires: React, TypeScript, AWS, Docker.",
    criteria: ["match_accuracy", "reasoning_quality", "json_format"]
  }
};

// Tool calling test prompt
const TOOL_CALL_TEST = {
  system: `You are a career advisor with access to tools. When you need to verify something, use the appropriate tool.

Available tools:
- verify_github_repo(url: string): Check if a GitHub repository exists
- extract_skills(text: string): Extract technical skills from text
- web_search(query: string): Search the web for information

Always respond with valid JSON: {"thinking":"...","tool_call":{"name":"tool_name","arguments":{...}}} or {"thinking":"...","answer":"..."}`,
  user: "Verify this GitHub repo and extract skills from it: https://github.com/facebook/react",
  criteria: ["tool_selection", "argument_accuracy", "json_format"]
};

async function testTextModel(model, prompt, timeout = 30000) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(timeout)
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        model,
        success: false,
        error: `${response.status}: ${errorText.substring(0, 100)}`,
        duration,
        tokensPerSecond: 0
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;
    const tokensPerSecond = tokensUsed > 0 ? (tokensUsed / (duration / 1000)).toFixed(1) : 0;

    return {
      model,
      success: true,
      content,
      duration,
      tokensUsed,
      tokensPerSecond: parseFloat(tokensPerSecond),
      finishReason: data.choices?.[0]?.finish_reason
    };
  } catch (error) {
    return {
      model,
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
      tokensPerSecond: 0
    };
  }
}

async function testEmbeddingModel(model, texts) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: texts
      }),
      signal: AbortSignal.timeout(30000)
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        model,
        success: false,
        error: `${response.status}: ${errorText.substring(0, 100)}`,
        duration,
        dimensions: 0
      };
    }

    const data = await response.json();
    const embeddings = data.data || [];
    const dimensions = embeddings[0]?.embedding?.length || 0;

    return {
      model,
      success: true,
      duration,
      dimensions,
      embeddingCount: embeddings.length,
      tokensUsed: data.usage?.total_tokens || 0
    };
  } catch (error) {
    return {
      model,
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
      dimensions: 0
    };
  }
}

async function testToolCalling(model) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: TOOL_CALL_TEST.system },
          { role: 'user', content: TOOL_CALL_TEST.user }
        ],
        temperature: 0.1,
        max_tokens: 300
      }),
      signal: AbortSignal.timeout(30000)
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        model,
        success: false,
        error: `${response.status}`,
        duration,
        toolCallCorrect: false
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON and check for tool call
    let parsed = null;
    let hasToolCall = false;
    let toolName = null;
    
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
      hasToolCall = !!parsed.tool_call;
      toolName = parsed.tool_call?.name;
    } catch (e) {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          hasToolCall = !!parsed.tool_call;
          toolName = parsed.tool_call?.name;
        } catch (e2) {}
      }
    }

    return {
      model,
      success: true,
      duration,
      content,
      hasToolCall,
      toolName,
      toolCallCorrect: hasToolCall && (toolName === 'verify_github_repo' || toolName === 'extract_skills'),
      parsedSuccessfully: parsed !== null
    };
  } catch (error) {
    return {
      model,
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
      toolCallCorrect: false
    };
  }
}

function evaluateResponse(response, criteria) {
  let score = 0;
  const maxScore = criteria.length * 10;
  
  for (const criterion of criteria) {
    switch (criterion) {
      case "relevance":
        if (response.content && response.content.length > 50) score += 8;
        else if (response.content) score += 5;
        break;
      case "conciseness":
        if (response.content && response.content.length < 500) score += 9;
        else if (response.content && response.content.length < 1000) score += 6;
        break;
      case "actionability":
        if (response.content && (response.content.includes('learn') || response.content.includes('build') || response.content.includes('practice'))) score += 9;
        else if (response.content) score += 5;
        break;
      case "accuracy":
        if (response.content && response.content.length > 30) score += 8;
        break;
      case "completeness":
        if (response.content && response.content.length > 100) score += 8;
        break;
      case "json_format":
        try {
          const jsonMatch = response.content?.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response.content];
          JSON.parse(jsonMatch[1]?.trim() || '{}');
          score += 10;
        } catch {
          if (response.content?.includes('{')) score += 4;
        }
        break;
      case "scoring_accuracy":
        if (response.content && response.content.match(/\d+/)) score += 8;
        break;
      case "breakdown_quality":
        if (response.content && response.content.includes('proofCount')) score += 9;
        else if (response.content) score += 5;
        break;
      case "specificity":
        if (response.content && response.content.length > 150) score += 8;
        break;
      case "resource_quality":
        if (response.content && (response.content.includes('http') || response.content.includes('course'))) score += 8;
        break;
      case "time_estimates":
        if (response.content && response.content.match(/\d+\s*(hour|week|month|day)/i)) score += 9;
        break;
      case "match_accuracy":
        if (response.content && response.content.match(/\d+/)) score += 8;
        break;
      case "reasoning_quality":
        if (response.content && response.content.length > 100) score += 8;
        break;
      default:
        score += 5;
    }
  }
  
  return Math.round((score / maxScore) * 100);
}

async function runTests() {
  console.log('=== NVIDIA NIM Model Testing Competition ===\n');
  
  const results = {
    textGenerationLight: [],
    textGenerationMedium: [],
    textGenerationHeavy: [],
    codeGeneration: [],
    embeddings: [],
    vision: [],
    safety: [],
    toolCalling: []
  };

  // Test 1: Light Text Generation Models
  console.log('📝 Testing Light Text Generation Models...');
  for (const model of TEST_MODELS["Text Generation - Light"]) {
    console.log(`  Testing ${model}...`);
    const response = await testTextModel(model, TEST_PROMPTS.career_advice, 20000);
    if (response.success) {
      response.score = evaluateResponse(response, TEST_PROMPTS.career_advice.criteria);
    }
    results.textGenerationLight.push(response);
    console.log(`    ${response.success ? '✅' : '❌'} ${response.duration}ms | Score: ${response.score || 0}/100`);
  }

  // Test 2: Medium Text Generation Models
  console.log('\n📝 Testing Medium Text Generation Models...');
  for (const model of TEST_MODELS["Text Generation - Medium"]) {
    console.log(`  Testing ${model}...`);
    const response = await testTextModel(model, TEST_PROMPTS.career_advice, 25000);
    if (response.success) {
      response.score = evaluateResponse(response, TEST_PROMPTS.career_advice.criteria);
    }
    results.textGenerationMedium.push(response);
    console.log(`    ${response.success ? '✅' : '❌'} ${response.duration}ms | Score: ${response.score || 0}/100`);
  }

  // Test 3: Heavy Text Generation Models
  console.log('\n📝 Testing Heavy Text Generation Models...');
  for (const model of TEST_MODELS["Text Generation - Heavy"]) {
    console.log(`  Testing ${model}...`);
    const response = await testTextModel(model, TEST_PROMPTS.career_advice, 45000);
    if (response.success) {
      response.score = evaluateResponse(response, TEST_PROMPTS.career_advice.criteria);
    }
    results.textGenerationHeavy.push(response);
    console.log(`    ${response.success ? '✅' : '❌'} ${response.duration}ms | Score: ${response.score || 0}/100`);
  }

  // Test 4: Code Generation Models
  console.log('\n💻 Testing Code Generation Models...');
  for (const model of TEST_MODELS["Code Generation"]) {
    console.log(`  Testing ${model}...`);
    const response = await testTextModel(model, {
      system: "You are a code analyst. Analyze code and provide insights.",
      user: "What are the best practices for a React component? Show an example.",
      criteria: ["accuracy", "code_quality"]
    }, 25000);
    if (response.success) {
      response.score = evaluateResponse(response, ["accuracy", "code_quality"]);
    }
    results.codeGeneration.push(response);
    console.log(`    ${response.success ? '✅' : '❌'} ${response.duration}ms | Score: ${response.score || 0}/100`);
  }

  // Test 5: Embedding Models
  console.log('\n🔢 Testing Embedding Models...');
  const embeddingTexts = [
    "React JavaScript TypeScript frontend development",
    "Python machine learning data science",
    "AWS cloud deployment Docker containers"
  ];
  for (const model of TEST_MODELS["Embeddings"]) {
    console.log(`  Testing ${model}...`);
    const response = await testEmbeddingModel(model, embeddingTexts);
    results.embeddings.push(response);
    console.log(`    ${response.success ? '✅' : '❌'} ${response.duration}ms | Dimensions: ${response.dimensions}`);
  }

  // Test 6: Vision Models (text-only test since we can't send images in this script)
  console.log('\n👁️ Testing Vision Models (text capability)...');
  for (const model of TEST_MODELS["Vision"]) {
    console.log(`  Testing ${model}...`);
    const response = await testTextModel(model, {
      system: "You are a visual assistant. Describe what you see.",
      user: "I have a certificate image. What information should I extract from it?",
      criteria: ["relevance", "completeness"]
    }, 25000);
    if (response.success) {
      response.score = evaluateResponse(response, ["relevance", "completeness"]);
    }
    results.vision.push(response);
    console.log(`    ${response.success ? '✅' : '❌'} ${response.duration}ms | Score: ${response.score || 0}/100`);
  }

  // Test 7: Safety Models
  console.log('\n🛡️ Testing Safety Models...');
  for (const model of TEST_MODELS["Safety"]) {
    console.log(`  Testing ${model}...`);
    const response = await testTextModel(model, {
      system: "You are a content safety classifier. Classify if the content is safe.",
      user: "I need help with my career. What skills should I learn?",
      criteria: ["accuracy", "safety"]
    }, 20000);
    if (response.success) {
      response.score = evaluateResponse(response, ["accuracy", "safety"]);
    }
    results.safety.push(response);
    console.log(`    ${response.success ? '✅' : '❌'} ${response.duration}ms | Score: ${response.score || 0}/100`);
  }

  // Test 8: Tool Calling (top models only)
  console.log('\n🔧 Testing Tool Calling Capability...');
  const toolCallingModels = [
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.1-70b-instruct",
    "mistralai/mistral-large-2-instruct",
    "nvidia/llama-3.3-nemotron-super-49b-v1",
    "moonshotai/kimi-k2.6",
    "deepseek-ai/deepseek-v4-pro",
    "minimaxai/minimax-m2.7",
    "z-ai/glm-5.1",
    "qwen/qwen3.5-397b-a17b"
  ];
  
  for (const model of toolCallingModels) {
    console.log(`  Testing ${model}...`);
    const response = await testToolCalling(model);
    results.toolCalling.push(response);
    console.log(`    ${response.success ? '✅' : '❌'} ${response.duration}ms | Tool Call: ${response.toolCallCorrect ? '✅' : '❌'}`);
  }

  return results;
}

function selectWinners(results) {
  const winners = {
    "Best Overall": null,
    "Best for Speed": null,
    "Best for Quality": null,
    "Best for Tool Calling": null,
    "Best Embedding": null,
    "Best Code Generation": null,
    "Best Vision": null,
    "Best Safety": null,
    "Best Value (Speed + Quality)": null,
    "Runner Up Overall": null
  };

  // Find best embedding model
  const successfulEmbeddings = results.embeddings.filter(e => e.success);
  if (successfulEmbeddings.length > 0) {
    winners["Best Embedding"] = successfulEmbeddings.reduce((best, curr) => 
      curr.duration < best.duration ? curr : best
    );
  }

  // Find best code generation
  const successfulCode = results.codeGeneration.filter(e => e.success);
  if (successfulCode.length > 0) {
    winners["Best Code Generation"] = successfulCode.reduce((best, curr) => 
      (curr.score || 0) > (best.score || 0) ? curr : best
    );
  }

  // Find best vision
  const successfulVision = results.vision.filter(e => e.success);
  if (successfulVision.length > 0) {
    winners["Best Vision"] = successfulVision.reduce((best, curr) => 
      (curr.score || 0) > (best.score || 0) ? curr : best
    );
  }

  // Find best safety
  const successfulSafety = results.safety.filter(e => e.success);
  if (successfulSafety.length > 0) {
    winners["Best Safety"] = successfulSafety.reduce((best, curr) => 
      (curr.score || 0) > (best.score || 0) ? curr : best
    );
  }

  // Find best tool calling
  const successfulToolCalling = results.toolCalling.filter(e => e.success && e.toolCallCorrect);
  if (successfulToolCalling.length > 0) {
    winners["Best for Tool Calling"] = successfulToolCalling.reduce((best, curr) => 
      curr.duration < best.duration ? curr : best
    );
  }

  // Combine all text generation results
  const allTextModels = [
    ...results.textGenerationLight,
    ...results.textGenerationMedium,
    ...results.textGenerationHeavy
  ].filter(e => e.success);

  if (allTextModels.length > 0) {
    // Best for speed
    winners["Best for Speed"] = allTextModels.reduce((best, curr) => 
      curr.duration < best.duration ? curr : best
    );

    // Best for quality
    winners["Best for Quality"] = allTextModels.reduce((best, curr) => 
      (curr.score || 0) > (best.score || 0) ? curr : best
    );

    // Best value (speed + quality combined)
    const valueScore = (m) => {
      const speedScore = Math.max(0, 100 - (m.duration / 100));
      const qualityScore = m.score || 0;
      return (speedScore * 0.4 + qualityScore * 0.6);
    };
    
    const sortedByValue = [...allTextModels].sort((a, b) => valueScore(b) - valueScore(a));
    winners["Best Value (Speed + Quality)"] = sortedByValue[0];
    winners["Runner Up Overall"] = sortedByValue[1];

    // Best overall (highest score with reasonable speed)
    const overallScore = (m) => {
      const speedPenalty = m.duration > 20000 ? (m.duration - 20000) / 1000 : 0;
      return (m.score || 0) - speedPenalty;
    };
    
    winners["Best Overall"] = allTextModels.reduce((best, curr) => 
      overallScore(curr) > overallScore(best) ? curr : best
    );
  }

  return winners;
}

async function main() {
  try {
    console.log('Starting NVIDIA NIM Model Competition...\n');
    console.log('This will test multiple categories of models.\n');
    console.log('Estimated time: 5-10 minutes\n');
    
    const results = await runTests();
    const winners = selectWinners(results);
    
    console.log('\n\n🏆 === COMPETITION RESULTS === 🏆\n');
    
    for (const [category, winner] of Object.entries(winners)) {
      if (winner) {
        console.log(`\n${category}:`);
        console.log(`  Model: ${winner.model}`);
        console.log(`  Duration: ${winner.duration}ms`);
        console.log(`  Score: ${winner.score || 'N/A'}/100`);
        if (winner.tokensPerSecond) console.log(`  Tokens/sec: ${winner.tokensPerSecond}`);
        if (winner.dimensions) console.log(`  Dimensions: ${winner.dimensions}`);
        if (winner.toolCallCorrect !== undefined) console.log(`  Tool Call: ${winner.toolCallCorrect ? 'Correct' : 'Incorrect'}`);
      }
    }
    
    // Save results to JSON
    const fs = require('fs');
    const path = require('path');
    
    const outputData = {
      timestamp: new Date().toISOString(),
      results,
      winners: Object.fromEntries(
        Object.entries(winners).map(([k, v]) => [k, v ? {
          model: v.model,
          duration: v.duration,
          score: v.score,
          tokensPerSecond: v.tokensPerSecond,
          dimensions: v.dimensions,
          toolCallCorrect: v.toolCallCorrect
        } : null])
      )
    };
    
    const outputPath = path.join(__dirname, '__tests__', 'model-test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\n\nResults saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
