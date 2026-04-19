import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { getOrCreateUserId } from "@/lib/auth";
import { checkRateLimit, logApiCall } from "@/lib/rateLimiter";

// Define the state schema using Annotation
const AgentStateAnnotation = Annotation.Root({
  imageUrl: Annotation<string>(),
  imageBase64: Annotation<string | undefined>(),
  description: Annotation<string>(),
  caption: Annotation<string>(),
  critique: Annotation<string>(),
  retryCount: Annotation<number>(),
  currentModel: Annotation<string>(),
});

// Read models from environment variables
const VISION_MODEL = process.env.VISION_MODEL || "qwen/qwen3.5-122b-a10b";
const TEXT_MODEL = process.env.TEXT_MODEL || "meta/llama-4-maverick-17b-128e-instruct";

// Platform-specific system prompts from env or defaults
const PLATFORM_PROMPTS: Record<string, string> = {
  instagram: process.env.DEFAULT_SYSTEM_PROMPT_INSTAGRAM || "You are an expert Instagram caption writer. Create engaging, trendy captions that include relevant hashtags and emojis. Keep them concise but impactful.",
  twitter: process.env.DEFAULT_SYSTEM_PROMPT_TWITTER || "You are a Twitter expert. Create punchy, witty captions in 280 characters or less. Make them shareable and engaging.",
  facebook: process.env.DEFAULT_SYSTEM_PROMPT_FACEBOOK || "You are a Facebook marketing expert. Create friendly, conversational captions that encourage engagement.",
  linkedin: process.env.DEFAULT_SYSTEM_PROMPT_LINKEDIN || "You are a LinkedIn professional. Create thoughtful, value-driven captions that showcase expertise.",
  tiktok: process.env.DEFAULT_SYSTEM_PROMPT_TIKTOK || "You are a TikTok content expert. Create trendy, Gen Z-friendly captions that are fun and relatable.",
  pinterest: process.env.DEFAULT_SYSTEM_PROMPT_PINTEREST || "You are a Pinterest expert. Create inspirational, descriptive captions that encourage saves.",
  threads: process.env.DEFAULT_SYSTEM_PROMPT_THREADS || "You are a Threads expert. Create casual, conversational captions that feel authentic.",
};

// Initialize the vision model - via NVIDIA NIM
const visionModel = new ChatOpenAI(
  {
    model: VISION_MODEL,
    temperature: 0.7,
    maxTokens: 1024,
    apiKey: process.env.NVIDIA_API_KEY,
  },
  {
    baseURL: "https://integrate.api.nvidia.com/v1",
  }
);

// Initialize the text model - via NVIDIA NIM
const textModel = new ChatOpenAI(
  {
    model: TEXT_MODEL,
    temperature: 0.8,
    maxTokens: 1024,
    apiKey: process.env.NVIDIA_API_KEY,
  },
  {
    baseURL: "https://integrate.api.nvidia.com/v1",
  }
);

// Vision Node - Analyze the image
async function visionNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const imageBase64 = state.imageBase64;
  
  if (!imageBase64) {
    throw new Error("No image base64 provided");
  }
  
  const messages = [
    new SystemMessage(
      "You are a professional photographer. Analyze the image and describe the scene, lighting, composition, and vibe in vivid detail. Focus on elements that would make for an engaging social media post."
    ),
    new HumanMessage({
      content: [
        { type: "text", text: "Describe the aesthetic and lighting of this image." },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ] as any
    }),
  ];

  const response = await visionModel.invoke(messages);
  
  return {
    description: String(response.content),
    currentModel: VISION_MODEL,
  };
}

// Writer Node - Generate the caption
async function writerNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const description = state.description;
  
  const messages = [
    new SystemMessage(
      "You are a creative social media writer. Write an engaging social media caption based on the image description. Include relevant hashtags. Make it catchy and authentic."
    ),
    new HumanMessage(
      `Based on this image description, write a creative social media caption with relevant hashtags:\n\n${description}`
    ),
  ];

  const response = await textModel.invoke(messages);
  
  return {
    caption: String(response.content),
    currentModel: TEXT_MODEL,
  };
}

// Function to generate platform-specific captions
async function generatePlatformCaptions(
  description: string,
  platforms: string[]
): Promise<Record<string, string>> {
  const captions: Record<string, string> = {};

  for (const platform of platforms) {
    const prompt = PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.instagram;
    
    const messages = [
      new SystemMessage(prompt),
      new HumanMessage(
        `Based on this image, create a caption for ${platform}:\n\n${description}`
      ),
    ];

    try {
      const response = await textModel.invoke(messages);
      captions[platform] = String(response.content);
    } catch (error) {
      console.error(`Error generating caption for ${platform}:`, error);
      captions[platform] = "Unable to generate caption";
    }
  }

  return captions;
}

// Critic Node - Review the caption
async function criticNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const caption = state.caption;
  const retryCount = state.retryCount;
  
  // Check if caption meets criteria
  const isValid = caption.length >= 20; // Basic validation
  
  if (isValid || retryCount >= 2) {
    return {
      critique: isValid ? "Approved" : "Max retries reached",
      currentModel: TEXT_MODEL,
    };
  }
  
  return {
    critique: "Needs improvement: Make it longer",
    retryCount: retryCount + 1,
    currentModel: TEXT_MODEL,
  };
}

// Create the workflow
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("visionNode", visionNode)
  .addNode("writerNode", writerNode)
  .addNode("criticNode", criticNode)
  .addEdge("__start__", "visionNode")
  .addEdge("visionNode", "writerNode")
  .addEdge("writerNode", "criticNode")
  .addConditionalEdges(
    "criticNode",
    (state: typeof AgentStateAnnotation.State) => {
      const hashtagCount = (state.caption.match(/#\w+/g) || []).length;
      const isValid = hashtagCount >= 5 && state.caption.length >= 50;
      
      if (isValid || state.retryCount >= 2) {
        return END;
      }
      return "writerNode";
    },
    {
      writerNode: "writerNode",
      [END]: END,
    }
  )
  .compile();

// Helper to convert file to base64
function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper to fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch image from URL");
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return base64;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  let userToken: string | null = null;
  
  try {
    // Get or create user token
    userToken = await getOrCreateUserId();

    // Check rate limit
    const rateLimitInfo = await checkRateLimit(userToken);
    
    if (!rateLimitInfo.allowed) {
      // Log the rate-limited request
      await logApiCall(userToken, "rate_limited");
      
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          remaining: rateLimitInfo.remaining,
          resetAt: rateLimitInfo.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": rateLimitInfo.remaining.toString(),
            "X-RateLimit-Reset": rateLimitInfo.resetAt.toISOString(),
            "Retry-After": (rateLimitInfo.retryAfter || 3600).toString(),
          },
        }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    
    let imageBase64: string | undefined;
    let platforms: string[] = [];
    let mode: string = "captions"; // "captions" or "analysis"
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      const platformsStr = formData.get("platforms") as string;
      const modeStr = formData.get("mode") as string;
      
      if (!file) {
        return NextResponse.json(
          { error: "Image file is required" },
          { status: 400 }
        );
      }
      
      imageBase64 = await convertToBase64(file);
      platforms = platformsStr ? JSON.parse(platformsStr) : ["instagram"];
      mode = modeStr || "captions";
    } else {
      // JSON body with base64 image or imageUrl
      const body = await request.json();
      imageBase64 = body.imageBase64;
      platforms = body.platforms || ["instagram"];
      mode = body.mode || "captions";
      
      // If imageBase64 is not provided, try imageUrl
      if (!imageBase64 && body.imageUrl) {
        try {
          imageBase64 = await fetchImageAsBase64(body.imageUrl);
        } catch (err) {
          return NextResponse.json(
            { error: "Failed to fetch or convert image from URL" },
            { status: 400 }
          );
        }
      }
      if (!imageBase64) {
        return NextResponse.json(
          { error: "Image base64 or imageUrl is required" },
          { status: 400 }
        );
      }
    }

    // Run the workflow
    const result = await workflow.invoke({
      imageUrl: "",
      imageBase64,
      description: "",
      caption: "",
      critique: "",
      retryCount: 0,
      currentModel: "",
    } as typeof AgentStateAnnotation.State);

    // Generate platform-specific captions for captions mode
    let platformCaptions: Record<string, string> = {};
    if (mode === "captions") {
      platformCaptions = await generatePlatformCaptions(result.description, platforms);
    }

    // Log successful API call with both models used
    const responseTime = Date.now() - startTime;
    const modelsUsed = `${VISION_MODEL} + ${TEXT_MODEL}`;
    await logApiCall(
      userToken,
      "success",
      modelsUsed,
      undefined,
      responseTime
    );

    // Prepare response based on mode
    let responseBody: any = {
      description: result.description,
      retries: result.retryCount,
    };

    if (mode === "analysis") {
      // Analysis mode: return only description
      responseBody.analysis = result.description;
    } else {
      // Captions mode: return captions for all selected platforms
      responseBody.caption = result.caption;
      responseBody.captions = platformCaptions;
    }

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": Math.max(
          0,
          rateLimitInfo.remaining - 1
        ).toString(),
        "X-RateLimit-Reset": rateLimitInfo.resetAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Log failed API call
    if (userToken) {
      await logApiCall(
        userToken,
        "error",
        undefined,
        String(error),
        Date.now() - startTime
      );
    }
    
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}