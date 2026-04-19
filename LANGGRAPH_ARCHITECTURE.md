# LangGraph Architecture - Aura Gram

This document describes the **LangGraph-based agentic workflow** powering Aura Gram's AI caption generation pipeline.

## Overview

Aura Gram uses **LangGraph** (a framework for building stateful, multi-actor applications with LLMs) to orchestrate a multi-step caption generation workflow. The graph implements:

- **Image Analysis** (Vision Node) - Analyzes image content
- **Caption Generation** (Writer Node) - Creates platform-specific captions
- **Quality Validation** (Critic Node) - Ensures caption meets quality standards
- **Iterative Refinement** - Automatically regenerates captions that fail validation

## Graph Architecture

### State Schema

```typescript
const AgentStateAnnotation = Annotation.Root({
  imageUrl: Annotation<string>(),              // Input image URL
  imageBase64: Annotation<string | undefined>(), // Base64-encoded image
  description: Annotation<string>(),           // Image analysis output
  caption: Annotation<string>(),               // Generated caption
  critique: Annotation<string>(),              // Validation feedback
  retryCount: Annotation<number>(),            // Retry attempts
  currentModel: Annotation<string>(),          // Model used in node
});
```

### Graph Flow Diagram

```
                            ┌─────────────┐
                            │   START     │
                            └──────┬──────┘
                                   │
                                   ▼
                            ┌─────────────────┐
                            │  Vision Node    │
                            │ (Image Analysis)│
                            └────────┬────────┘
                                     │
                                     ▼
                           ┌──────────────────────┐
                           │  Writer Node        │
                           │ (Caption Generation)│
                           └────────┬─────────────┘
                                    │
                                    ▼
                           ┌──────────────────────┐
                           │  Critic Node        │
                           │(Quality Validation) │
                           └────────┬─────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                    Valid? ✓                 Invalid? ✗
                  (Pass QC)                  (Fail QC)
                        │                       │
                        ▼                       ▼
                    ┌───────┐          ┌──────────────────┐
                    │  END  │          │ Retry Writer?    │
                    └───────┘          │ (< 2 retries)    │
                                       └────────┬─────────┘
                                                │
                            ┌───────────────────┴────────────────┐
                            │                                    │
                     Retry Available              Max Retries Reached
                      (retryCount < 2)            (retryCount >= 2)
                            │                                    │
                            ▼                                    ▼
                        [Writer Node]                        [END - Output]
                        (Regenerate)                         (With Warning)
```

## Node Descriptions

### 1. Vision Node
**Purpose**: Analyze image content and extract visual information

**Input**: 
- `imageBase64`: Base64-encoded image

**Process**:
- Sends image + prompt to configured vision model via NVIDIA NIM
- Extracts aesthetic, lighting, composition, mood details
- Returns detailed scene analysis

**Output**:
```typescript
{
  description: "The golden hour light cascades across...",
  currentModel: "your-vision-model-name"
}
```

**Model**: `VISION_MODEL` (configurable via environment variable)

---

### 2. Writer Node
**Purpose**: Generate platform-specific captions based on image analysis

**Input**:
- `description`: Output from Vision Node
- `platforms`: Array of target platforms (instagram, twitter, etc.)

**Process**:
1. Takes image description from Vision Node
2. For each platform, generates optimized caption using platform-specific system prompt
3. Applies LLM creativity with temperature: 0.8

**Output**:
```typescript
{
  caption: "✨ Golden hour magic... #sunset #nature",
  currentModel: "your-text-model-name"
}
```

**Model**: `TEXT_MODEL` (configurable via environment variable)

---

### 3. Critic Node
**Purpose**: Validate caption quality and determine if retry is needed

**Input**:
- `caption`: Generated caption
- `retryCount`: Number of retries attempted

**Validation Rules**:
1. **Hashtag Count**: Minimum 5 hashtags
2. **Length**: Minimum 50 characters
3. **Retry Limit**: Maximum 2 retry attempts

**Logic**:
```typescript
const hashtagCount = (state.caption.match(/#\w+/g) || []).length;
const isValid = hashtagCount >= 5 && state.caption.length >= 50;

if (isValid || state.retryCount >= 2) {
  return END; // ✓ Pass or max retries reached
}
return "writerNode"; // ✗ Fail, retry generation
```

**Output**:
```typescript
{
  critique: "Approved" | "Max retries reached",
  retryCount: number,  // Incremented on retry
  currentModel: TEXT_MODEL
}
```

---

## Conditional Edges

### Critic → End/Writer (Conditional)
The **most complex routing logic** in the graph:

```typescript
.addConditionalEdges(
  "criticNode",
  (state: typeof AgentStateAnnotation.State) => {
    const hashtagCount = (state.caption.match(/#\w+/g) || []).length;
    const isValid = hashtagCount >= 5 && state.caption.length >= 50;
    
    if (isValid || state.retryCount >= 2) {
      return END;  // Exit graph, return result
    }
    return "writerNode";  // Route back to Writer for retry
  },
  {
    writerNode: "writerNode",
    [END]: END
  }
)
```

**Decision Points**:
1. **Caption Valid** (5+ hashtags AND 50+ chars) → END ✓
2. **Max Retries Reached** (retryCount >= 2) → END (with warning) ⚠️
3. **Invalid & Can Retry** (hashtagCount < 5 OR length < 50) AND (retryCount < 2) → Writer ↩️

---

## Data Flow Example

### Request: Generate Instagram Caption

**Input**:
```json
{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "platforms": ["instagram"],
  "mode": "captions"
}
```

**State Evolution**:

```
Initial State:
{
  imageBase64: "iVBORw0KGgo...",
  description: "",
  caption: "",
  critique: "",
  retryCount: 0,
  currentModel: ""
}
        ↓ [Vision Node]
{
  description: "Golden sunset over ocean waves, dramatic..."
  currentModel: "your-vision-model-name"
}
        ↓ [Writer Node]
{
  caption: "✨ Golden hour vibes #sunset #ocean #nature"
  currentModel: "your-text-model-name"
  (4 hashtags - FAILS validation ✗)
}
        ↓ [Critic Node - INVALID]
{
  retryCount: 1
  critique: "Needs improvement: Make it longer"
}
        ↓ [Writer Node - RETRY]
{
  caption: "✨ Golden hour magic captured! The golden light 
            cascades across ocean waves... #sunset #ocean 
            #nature #photography #goldenhourfoto"
  (5 hashtags, 80+ chars - PASSES ✓)
}
        ↓ [Critic Node - VALID]
{
  critique: "Approved",
  retryCount: 1
}
        ↓ [END]
Output Caption: "✨ Golden hour magic captured!..."
```

---

## Integration Points

### API Endpoint: `/api/generate`

```typescript
// POST request triggers the workflow
const result = await workflow.invoke({
  imageUrl: "",
  imageBase64,
  description: "",
  caption: "",
  critique: "",
  retryCount: 0,
  currentModel: "",
} as typeof AgentStateAnnotation.State);
```

### After Workflow Completes

```typescript
// Generate platform-specific captions
let platformCaptions: Record<string, string> = {};
if (mode === "captions") {
  platformCaptions = await generatePlatformCaptions(
    result.description,  // Use Vision Node output
    platforms
  );
}

// Log metrics
await logApiCall(
  userToken,
  "success",
  `${VISION_MODEL} + ${TEXT_MODEL}`,
  undefined,
  responseTime
);
```

---

## Platform-Specific Prompts

Each platform has a customizable system prompt for caption generation:

```typescript
const PLATFORM_PROMPTS: Record<string, string> = {
  instagram: process.env.DEFAULT_SYSTEM_PROMPT_INSTAGRAM || 
    "You are an expert Instagram caption writer...",
  
  twitter: process.env.DEFAULT_SYSTEM_PROMPT_TWITTER || 
    "You are a Twitter expert...",
  
  facebook: process.env.DEFAULT_SYSTEM_PROMPT_FACEBOOK || 
    "You are a Facebook marketing expert...",
  
  linkedin: process.env.DEFAULT_SYSTEM_PROMPT_LINKEDIN || 
    "You are a LinkedIn professional...",
  
  tiktok: process.env.DEFAULT_SYSTEM_PROMPT_TIKTOK || 
    "You are a TikTok content expert...",
  
  pinterest: process.env.DEFAULT_SYSTEM_PROMPT_PINTEREST || 
    "You are a Pinterest expert...",
  
  threads: process.env.DEFAULT_SYSTEM_PROMPT_THREADS || 
    "You are a Threads expert..."
};
```

---

## Extending the Graph

### Add a New Node

**Example**: Add a "hashtag optimizer" node

```typescript
// Define the node
async function hashtagOptimizerNode(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  // Extract hashtags from caption
  const hashtags = state.caption.match(/#\w+/g) || [];
  
  // Optimize using LLM
  const messages = [
    new SystemMessage("You are a social media hashtag expert..."),
    new HumanMessage(
      `Improve these hashtags for reach: ${hashtags.join(" ")}`
    ),
  ];
  
  const response = await textModel.invoke(messages);
  
  return {
    caption: state.caption.replace(
      hashtags.join(" "),
      String(response.content)
    ),
  };
}

// Add to workflow
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("visionNode", visionNode)
  .addNode("writerNode", writerNode)
  .addNode("criticNode", criticNode)
  .addNode("hashtagOptimizer", hashtagOptimizerNode)  // NEW
  .addEdge("criticNode", "hashtagOptimizer")          // NEW
  .addEdge("hashtagOptimizer", END)                   // NEW
  .compile();
```

### Modify Validation Logic

```typescript
// More strict validation
.addConditionalEdges(
  "criticNode",
  (state: typeof AgentStateAnnotation.State) => {
    const rules = {
      minHashtags: 8,              // Increased from 5
      minLength: 100,              // Increased from 50
      requireEmojis: true,
      maxRetries: 3,               // Increased from 2
    };
    
    const hashtags = (state.caption.match(/#\w+/g) || []).length;
    const hasEmojis = /\p{Emoji}/u.test(state.caption);
    
    const isValid = 
      hashtags >= rules.minHashtags &&
      state.caption.length >= rules.minLength &&
      (!rules.requireEmojis || hasEmojis);
    
    if (isValid || state.retryCount >= rules.maxRetries) {
      return END;
    }
    return "writerNode";
  },
  { writerNode: "writerNode", [END]: END }
)
```

### Add Branching for Multi-Modal Analysis

```typescript
// Example: Image classification before analysis
.addConditionalEdges(
  "visionNode",
  (state: typeof AgentStateAnnotation.State) => {
    // Route to different writer based on image type
    if (state.description.includes("portrait")) {
      return "portraitWriterNode";
    }
    return "writerNode";
  },
  {
    portraitWriterNode: "portraitWriterNode",
    writerNode: "writerNode",
  }
)
```

---

## Performance & Optimization

### Token Usage
- **Vision Node**: ~800-1200 tokens (image analysis)
- **Writer Node**: ~300-500 tokens per retry (caption generation)
- **Critic Node**: ~50-100 tokens (validation)

### Retry Cost
- Each retry adds ~300-500 tokens
- Max 2 retries = worst case ~1800 extra tokens
- **Strategy**: Make critic validation rules strict to minimize retries

### Caching (Optional Enhancement)

```typescript
// Cache similar image descriptions
const descriptionCache = new Map<string, string>();

async function visionNode(state) {
  const imageHash = crypto.createHash("sha256")
    .update(state.imageBase64)
    .digest("hex");
  
  if (descriptionCache.has(imageHash)) {
    return { description: descriptionCache.get(imageHash)! };
  }
  
  const description = await visionModel.invoke(messages);
  descriptionCache.set(imageHash, String(description.content));
  return { description: String(description.content) };
}
```

---

## Error Handling

### In Nodes

```typescript
async function visionNode(state) {
  try {
    if (!state.imageBase64) {
      throw new Error("No image base64 provided");
    }
    // ... rest of logic
  } catch (error) {
    console.error("Vision node error:", error);
    throw error;  // Propagate to API handler
  }
}
```

### In API Route

```typescript
try {
  const result = await workflow.invoke(initialState);
  return NextResponse.json({ success: true, ...result });
} catch (error) {
  await logApiCall(userToken, "error", undefined, String(error), responseTime);
  return NextResponse.json(
    { error: "Failed to process image" },
    { status: 500 }
  );
}
```

---

## Monitoring & Observability

### Metrics Logged

Each API call logs to Supabase:
```sql
INSERT INTO api_calls (user_token, status, model_used, error_message, response_time_ms)
VALUES (?, 'success', 'qwen/... + llama/...', NULL, 2450);
```

### Dashboard Metrics

Available at `/developer`:
- Model usage breakdown
- Response time trends
- Error rate analysis
- Retry rate patterns

---

## Configuration

### Environment Variables

```bash
# Models (configure your preferred models)
VISION_MODEL=your-vision-model-name
TEXT_MODEL=your-text-model-name

# Platform prompts (optional - overrides defaults)
DEFAULT_SYSTEM_PROMPT_INSTAGRAM="..."
DEFAULT_SYSTEM_PROMPT_TWITTER="..."
# ... more platforms

# NVIDIA NIM API
NVIDIA_API_KEY=nvapi-...
```

### Adjust Validation Rules

Edit `app/api/generate/route.ts` criticNode:

```typescript
.addConditionalEdges(
  "criticNode",
  (state) => {
    // Modify these thresholds
    const hashtagCount = (state.caption.match(/#\w+/g) || []).length;
    const isValid = hashtagCount >= 5 && state.caption.length >= 50;
    // ... rest of logic
  },
  // ...
)
```

---

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [NVIDIA NIM API](https://build.nvidia.com/)
- [Agentic AI Patterns](https://docs.langchain.com/docs/guides/agents)

---

**Last Updated**: April 2026  
**Status**: Production Ready
