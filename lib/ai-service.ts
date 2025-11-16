import { v4 as uuidv4 } from "uuid";

export type AIImageProvider = "openrouter" | "dalle" | "flux";

type AIGenerationParams = {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_images?: number;
  style_preset?: string;
  seed?: number;
};

type AIGenerationResult = {
  id: string;
  url: string;
  model: string;
  provider: AIImageProvider;
  metadata: Record<string, any>;
  created_at: string;
};

export class AIService {
  private static instance: AIService;
  private apiKey: string | null = null;
  private provider: AIImageProvider = "openrouter";

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public initialize(apiKey: string, provider: AIImageProvider = "openrouter") {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  public async generateImage(
    params: AIGenerationParams,
  ): Promise<AIGenerationResult> {
    if (!this.apiKey) {
      throw new Error("AI Service not initialized. Please provide an API key.");
    }

    const {
      prompt,
      negative_prompt,
      width = 512,
      height = 512,
      num_images = 1,
      style_preset,
    } = params;

    try {
      let response;

      switch (this.provider) {
        case "openrouter":
          response = await this.generateWithOpenRouter({
            prompt,
            negative_prompt,
            width,
            height,
            num_images,
          });
          break;

        case "dalle":
          response = await this.generateWithDALLE({
            prompt,
            n: num_images,
            size: `${width}x${height}`,
          });
          break;

        case "flux":
          response = await this.generateWithFlux({
            prompt,
            negative_prompt,
            width,
            height,
            num_images,
            style_preset,
          });
          break;

        default:
          throw new Error(`Unsupported AI provider: ${this.provider}`);
      }

      return {
        id: uuidv4(),
        url: response.url || URL.createObjectURL(await response.blob()),
        model: response.model || this.provider,
        provider: this.provider,
        metadata: {
          ...params,
          generated_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("AI Image Generation Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to generate image: ${errorMessage}`);
    }
  }

  private async generateWithOpenRouter(params: any) {
    const response = await fetch(
      "https://openrouter.ai/api/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "stability-ai/sd-xl-10",
          ...params,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || "Failed to generate image with OpenRouter",
      );
    }

    return response.json();
  }

  private async generateWithDALLE(params: any) {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          ...params,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || "Failed to generate image with DALL-E",
      );
    }

    const data = await response.json();
    return {
      ...data.data[0],
      model: "dall-e-3",
    };
  }

  private async generateWithFlux(params: any) {
    const response = await fetch("https://api.flux.dev/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || "Failed to generate image with Flux",
      );
    }

    return response.json();
  }
}

export const aiService = AIService.getInstance();
