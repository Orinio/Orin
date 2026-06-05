const NVIDIA_API_KEY = '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

const models = [
  'z-ai/glm-5.1',
  'minimaxai/minimax-m2.7',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.2-3b-instruct',
  'qwen/qwen3.5-122b-a10b',
  'mistralai/mistral-7b-instruct-v0.3',
  'nvidia/llama-3.3-nemotron-super-49b-v1.5',
  'nvidia/llama-3.1-nemotron-51b-instruct',
  'deepseek-ai/deepseek-v4-flash',
  'moonshotai/kimi-k2.6',
  'deepseek-ai/deepseek-v4-pro'
];

const toolPrompt = `You are an AI agent with tool access. ONLY respond with valid JSON.

Tool use format:
{"thinking":"your reasoning","tool_call":{"name":"tool_name","arguments":{"key":"value"}}}

Final answer format:
{"thinking":"your reasoning","answer":"your answer"}

Available tools:
- web_search(query: string) - Search the web
- verify_github(url: string) - Check GitHub repo exists
- verify_certificate(url: string) - Verify certificate URL
- check_kaggle(url: string) - Check Kaggle notebook

User request: Verify if this GitHub repo is real: https://github.com/facebook/react`;

async function test(model) {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  
  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: toolPrompt }],
        temperature: 0.3,
        max_tokens: 400
      }),
    });
    clearTimeout(timeout);
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    let parsed = null;
    try {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch (e) {}
    
    const toolName = parsed?.tool_call?.name || 'none';
    const hasThinking = !!parsed?.thinking;
    const hasAnswer = !!parsed?.answer;
    
    return { 
      model, ok: true, ms: Date.now()-start, 
      tokens: data.usage?.total_tokens||0, 
      parsed, toolName, hasThinking, hasAnswer,
      raw: content.substring(0,150) 
    };
  } catch (e) {
    clearTimeout(timeout);
    return { model, ok: false, ms: Date.now()-start, err: e.name };
  }
}

async function run() {
  console.log('=== NVIDIA NIM Model Comparison for Agentic AI ===\n');
  console.log('Task: Verify GitHub repo using tool calling\n');
  
  const results = [];
  for (const m of models) {
    process.stdout.write(`${m.padEnd(45)}: `);
    const r = await test(m);
    results.push(r);
    if (r.ok) {
      const status = r.parsed ? (r.toolName !== 'none' ? 'TOOL_OK' : 'JSON_OK') : 'NO_JSON';
      console.log(`${String(r.ms).padEnd(6)}ms | ${String(r.tokens).padEnd(4)}t | ${status}`);
      if (r.toolName !== 'none') {
        console.log(`  Tool: ${r.toolName}(${JSON.stringify(r.parsed.tool_call.arguments).substring(0,80)})`);
      }
    } else {
      console.log(`FAIL (${r.err})`);
    }
  }

  console.log('\n=== RANKING ===\n');
  const working = results.filter(r => r.ok && r.parsed && r.toolName !== 'none');
  working.sort((a, b) => a.ms - b.ms);
  
  working.forEach((r, i) => {
    console.log(`${i+1}. ${r.model} - ${r.ms}ms - Tool: ${r.toolName}`);
  });

  console.log('\n=== RECOMMENDED FOR ORIN ===');
  if (working.length > 0) {
    console.log(`Best: ${working[0].model} (${working[0].ms}ms)`);
  }
}

run();
