# LangGraph Examples & Usage Guide

This document provides practical examples and recipes for using and extending the LangGraph workflow in Aura Gram.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Testing Nodes Individually](#testing-nodes-individually)
3. [Modifying Validation Rules](#modifying-validation-rules)
4. [Adding New Nodes](#adding-new-nodes)
5. [Debugging Workflows](#debugging-workflows)
6. [Performance Tuning](#performance-tuning)

---

## Basic Usage

### Invoking the Full Workflow

```typescript
// In your API route or server function
import { workflow } from "@/lib/workflow";

const initialState = {
  imageUrl: "",
  imageBase64: "<your-base64-encoded-image>",  // Base64 encoded image
  description: "",
  caption: "",
  critique: "",
  retryCount: 0,
  currentModel: "",
};

try {
  const result = await workflow.invoke(initialState);
  
  console.log("Image Analysis:", result.description);
  console.log("Generated Caption:", result.caption);
  console.log("Retry Count:", result.retryCount);
  console.log("Models Used:", result.currentModel);
  
  return {
    success: true,
    description: result.description,
    caption: result.caption,
    retries: result.retryCount,
  };
} catch (error) {
  console.error("Workflow failed:", error);
  return { success: false, error: error.message };
}
```

### Using with Image URLs

```typescript
// Convert URL to base64
async function urlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// Use in workflow
const imageBase64 = await urlToBase64("<your-image-url>");
const result = await workflow.invoke({
  imageUrl: "https://example.com/photo.jpg",
  imageBase64,
  description: "",
  caption: "",
  critique: "",
  retryCount: 0,
  currentModel: "",
});
```

---

## Testing Nodes Individually

### Test Vision Node Alone

```typescript
import { visionNode } from "@/lib/nodes";

const testImageBase64 = "<your-base64-encoded-image>";

const visionResult = await visionNode({
  imageUrl: "",
  imageBase64: testImageBase64,
  description: "",
  caption: "",
  critique: "",
  retryCount: 0,
  currentModel: "",
});

console.log("Vision Output:", visionResult.description);
console.log("Model Used:", visionResult.currentModel);
```

### Test Writer Node with Mock Input

```typescript
import { writerNode } from "@/lib/nodes";

const mockDescription = 
  "A golden sunset over a rocky coastline, waves crashing dramatically...";

const writerResult = await writerNode({
  imageUrl: "",
  imageBase64: "",
  description: mockDescription,
  caption: "",
  critique: "",
  retryCount: 0,
  currentModel: "",
});

console.log("Generated Caption:", writerResult.caption);
```

### Test Critic Node with Sample Captions

```typescript
import { criticNode } from "@/lib/nodes";

// Test 1: Valid caption (should pass)
const validCaption = 
  "✨ Golden hour vibes with dramatic cliffs and crashing waves #sunset #ocean #nature #coast #photography #goldenhour";

const critique1 = await criticNode({
  imageUrl: "",
  imageBase64: "",
  description: "",
  caption: validCaption,
  critique: "",
  retryCount: 0,
  currentModel: "",
});
console.log("Valid Caption Result:", critique1);  // { critique: "Approved", retryCount: 0 }

// Test 2: Invalid caption (should fail)
const invalidCaption = "Sunset #nature";  // Only 1 hashtag, < 50 chars

const critique2 = await criticNode({
  imageUrl: "",
  imageBase64: "",
  description: "",
  caption: invalidCaption,
  critique: "",
  retryCount: 0,
  currentModel: "",
});
console.log("Invalid Caption Result:", critique2);  // { critique: "Needs improvement", retryCount: 1 }
```

---

## Modifying Validation Rules

### Make Critic Stricter

**File**: `app/api/generate/route.ts`

```typescript
// Before: Loose validation
const hashtagCount = (state.caption.match(/#\w+/g) || []).length;
const isValid = hashtagCount >= 5 && state.caption.length >= 50;

// After: Stricter validation
const hashtagCount = (state.caption.match(/#\w+/g) || []).length;
const emojiCount = (state.caption.match(/\p{Emoji}/gu) || []).length;
const hasCallToAction = /like|share|comment|follow|tag/i.test(state.caption);

const isValid = 
  hashtagCount >= 8 &&           // More hashtags required
  state.caption.length >= 100 && // Longer minimum
  emojiCount >= 2 &&             // Require emojis
  hasCallToAction;               // Require engagement hook

if (isValid || state.retryCount >= 3) {  // More retries allowed
  return END;
}
```

### Platform-Specific Validation

```typescript
// Customize validation per platform
function validateCaption(
  caption: string,
  platform: string
): { isValid: boolean; reason?: string } {
  const rules: Record<string, { minLength: number; minHashtags: number }> = {
    twitter: { minLength: 20, minHashtags: 1 },      // Twitter: short & simple
    linkedin: { minLength: 100, minHashtags: 3 },    // LinkedIn: longer & professional
    instagram: { minLength: 80, minHashtags: 5 },    // Instagram: moderate
    tiktok: { minLength: 30, minHashtags: 2 },       // TikTok: short & casual
  };
  
  const rule = rules[platform] || rules.instagram;
  const hashtagCount = (caption.match(/#\w+/g) || []).length;
  
  if (caption.length < rule.minLength) {
    return {
      isValid: false,
      reason: `Caption too short (${caption.length}/${rule.minLength})`,
    };
  }
  
  if (hashtagCount < rule.minHashtags) {
    return {
      isValid: false,
      reason: `Not enough hashtags (${hashtagCount}/${rule.minHashtags})`,
    };
  }
  
  return { isValid: true };
}
```

---

## Adding New Nodes

### Example 1: Emoji Optimizer Node

```typescript
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { textModel } from "@/lib/models";

async function emojiOptimizerNode(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const caption = state.caption;
  
  // Check if caption already has emojis
  const hasEmojis = /\p{Emoji}/u.test(caption);
  if (hasEmojis) {
    return {}; // Skip if already has emojis
  }
  
  const messages = [
    new SystemMessage(
      "You are a social media emoji expert. Add 2-3 relevant emojis to make the caption more engaging. Only return the modified caption."
    ),
    new HumanMessage(`Add emojis to this caption: ${caption}`),
  ];
  
  const response = await textModel.invoke(messages);
  
  return {
    caption: String(response.content),
    currentModel: TEXT_MODEL,
  };
}

// Add to workflow
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("visionNode", visionNode)
  .addNode("writerNode", writerNode)
  .addNode("criticNode", criticNode)
  .addNode("emojiOptimizer", emojiOptimizerNode)  // NEW NODE
  .addEdge("__start__", "visionNode")
  .addEdge("visionNode", "writerNode")
  .addEdge("writerNode", "criticNode")
  .addEdge("criticNode", "emojiOptimizer")        // NEW EDGE
  .addEdge("emojiOptimizer", END)                 // NEW EDGE
  .compile();
```

### Example 2: Hashtag Extractor Node

```typescript
async function hashtagExtractorNode(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const caption = state.caption;
  const hashtags = caption.match(/#\w+/g) || [];
  
  // Log hashtags for analytics
  console.log(`Extracted ${hashtags.length} hashtags:`, hashtags);
  
  return {
    hashtags: hashtags,  // Would need to add to state schema
  };
}
```

### Example 3: Multi-Language Caption Generator

```typescript
interface MultiLanguageState extends typeof AgentStateAnnotation.State {
  captions: Record<string, string>;  // { en: "...", es: "...", fr: "..." }
}

async function multiLanguageNode(
  state: MultiLanguageState
): Promise<Partial<MultiLanguageState>> {
  const baseCaption = state.caption;
  const languages = ["es", "fr", "de", "ja"];  // Spanish, French, German, Japanese
  
  const translations: Record<string, string> = {
    en: baseCaption,
  };
  
  for (const lang of languages) {
    const messages = [
      new SystemMessage(
        `Translate this social media caption to ${lang} while keeping hashtags. Only return the translation.`
      ),
      new HumanMessage(baseCaption),
    ];
    
    const response = await textModel.invoke(messages);
    translations[lang] = String(response.content);
  }
  
  return { captions: translations };
}
```

---

## Debugging Workflows

### Enable Logging

```typescript
// Add detailed logging in nodes
async function visionNode(state: typeof AgentStateAnnotation.State) {
  console.time("visionNode");
  console.log("Input:", { imageBase64Length: state.imageBase64?.length });
  
  try {
    const messages = [/* ... */];
    const response = await visionModel.invoke(messages);
    
    const output = String(response.content);
    console.log("Output preview:", output.substring(0, 100) + "...");
    console.timeEnd("visionNode");
    
    return {
      description: output,
      currentModel: VISION_MODEL,
    };
  } catch (error) {
    console.error("Vision node error:", error);
    throw error;
  }
}
```

### Track State Changes

```typescript
// Wrapper function to log state at each step
async function invokeWithLogging(initialState: any) {
  console.log("=== WORKFLOW START ===");
  console.log("Initial state:", JSON.stringify(initialState, null, 2));
  
  let currentState = initialState;
  
  // Manually invoke each node with logging
  console.log("\n[1] Running Vision Node...");
  const visionResult = await visionNode(currentState);
  currentState = { ...currentState, ...visionResult };
  console.log("State after vision:", JSON.stringify(currentState, null, 2));
  
  console.log("\n[2] Running Writer Node...");
  const writerResult = await writerNode(currentState);
  currentState = { ...currentState, ...writerResult };
  console.log("State after writer:", JSON.stringify(currentState, null, 2));
  
  console.log("\n[3] Running Critic Node...");
  const criticResult = await criticNode(currentState);
  currentState = { ...currentState, ...criticResult };
  console.log("State after critic:", JSON.stringify(currentState, null, 2));
  
  console.log("\n=== WORKFLOW END ===");
  return currentState;
}
```

### Test Specific Paths

```typescript
// Test the retry loop
async function testRetryLoop() {
  let state = {
    imageUrl: "",
    imageBase64: "test",
    description: "Test image with golden sunset...",
    caption: "Short", // Deliberately short to fail validation
    critique: "",
    retryCount: 0,
    currentModel: "",
  };
  
  for (let i = 0; i < 3; i++) {
    console.log(`\n=== Retry Attempt ${i + 1} ===`);
    
    const writerOutput = await writerNode(state);
    state = { ...state, ...writerOutput };
    console.log("Caption:", state.caption);
    
    const criticOutput = await criticNode(state);
    state = { ...state, ...criticOutput };
    console.log("Critique:", state.critique);
    console.log("RetryCount:", state.retryCount);
    
    if (state.critique === "Approved") {
      console.log("✓ Caption approved!");
      break;
    }
  }
}
```

---

## Performance Tuning

### Token Optimization

```typescript
// Reduce tokens used in prompts
const briefPrompt = 
  "Analyze image: scene, lighting, mood. Max 2 sentences.";

const longPrompt = 
  "You are a professional photographer. Analyze the image comprehensively including scene composition, lighting conditions, mood and atmosphere, colors, and elements that would make for engaging social media content. Provide detailed observations. Focus on what makes this visually compelling.";

// Shorter prompts = fewer tokens = faster/cheaper
```

### Batch Processing

```typescript
// Process multiple images in parallel
async function batchProcessImages(images: string[]): Promise<any[]> {
  const results = await Promise.all(
    images.map((imageBase64) =>
      workflow.invoke({
        imageUrl: "",
        imageBase64,
        description: "",
        caption: "",
        critique: "",
        retryCount: 0,
        currentModel: "",
      })
    )
  );
  
  return results;
}

// Usage
const imageBase64Array = [/* ... */];
const results = await batchProcessImages(imageBase64Array);
```

### Caching Descriptions

```typescript
import crypto from "crypto";

const descriptionCache = new Map<string, string>();

async function visionNodeWithCache(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  if (!state.imageBase64) {
    throw new Error("No image base64 provided");
  }
  
  // Create hash of image
  const imageHash = crypto
    .createHash("sha256")
    .update(state.imageBase64)
    .digest("hex");
  
  // Check cache
  if (descriptionCache.has(imageHash)) {
    console.log("🔄 Cache hit for image");
    return {
      description: descriptionCache.get(imageHash)!,
      currentModel: VISION_MODEL,
    };
  }
  
  // Cache miss - run vision model
  const messages = [/* ... */];
  const response = await visionModel.invoke(messages);
  const description = String(response.content);
  
  // Store in cache
  descriptionCache.set(imageHash, description);
  
  return {
    description,
    currentModel: VISION_MODEL,
  };
}
```

### Monitor Token Usage

```typescript
// Track tokens per request
interface TokenMetrics {
  visionTokens: number;
  writerTokens: number;
  totalTokens: number;
  costEstimate: number;
}

async function trackTokenUsage(initialState: any): Promise<TokenMetrics> {
  let metrics: TokenMetrics = {
    visionTokens: 0,
    writerTokens: 0,
    totalTokens: 0,
    costEstimate: 0,
  };
  
  // Vision node estimates ~1000 tokens for image
  metrics.visionTokens = 1000;
  
  // Writer node estimates ~300-500 per generation
  // With retries, could be up to 1500
  metrics.writerTokens = 500;
  
  metrics.totalTokens = metrics.visionTokens + metrics.writerTokens;
  metrics.costEstimate = metrics.totalTokens * 0.00001;  // Example pricing
  
  return metrics;
}
```

---

## Production Best Practices

### Rate Limiting per Node

```typescript
import { RateLimiter } from "limiter";

const visionLimiter = new RateLimiter({ tokensPerInterval: 10, interval: "second" });
const writerLimiter = new RateLimiter({ tokensPerInterval: 20, interval: "second" });

async function visionNodeWithRateLimit(state: any) {
  await visionLimiter.removeTokens(1);
  return visionNode(state);
}

async function writerNodeWithRateLimit(state: any) {
  await writerLimiter.removeTokens(1);
  return writerNode(state);
}
```

### Error Recovery

```typescript
async function invokeWithRetry(
  initialState: any,
  maxAttempts: number = 3
): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await workflow.invoke(initialState);
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

---

**For more information**, see [LANGGRAPH_ARCHITECTURE.md](./LANGGRAPH_ARCHITECTURE.md)
