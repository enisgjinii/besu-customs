export type AITextureProvider = "google" | "runware" | "meshy";

type AIGenerationMemoryEntry = {
  id: string;
  createdAt: string;
  modelUrl: string | null;
  modelType: string;
  provider: AITextureProvider;
  userPrompt: string;
  finalPrompt: string;
  success: boolean;
  errorMessage?: string | null;
};

export type AIGenerationMemoryContext = {
  guidance: string | null;
  fallbackPrompt: string | null;
  preferredProvider: AITextureProvider | null;
};

const STORAGE_KEY = "besu.ai.texture.memory.v1";
const MAX_ENTRIES = 80;
const MAX_PROMPT_LEN = 360;

const isBrowser = () => typeof window !== "undefined";

const trimPrompt = (value: string): string => {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (cleaned.length <= MAX_PROMPT_LEN) return cleaned;
  return `${cleaned.slice(0, MAX_PROMPT_LEN)}...`;
};

const normalizeModelUrl = (url: string | null): string =>
  (url || "")
    .toLowerCase()
    .replace(/\?.*$/, "")
    .replace(/#.*$/, "");

const safeParseEntries = (raw: string | null): AIGenerationMemoryEntry[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is AIGenerationMemoryEntry => {
        return (
          !!item &&
          typeof item === "object" &&
          typeof (item as AIGenerationMemoryEntry).id === "string" &&
          typeof (item as AIGenerationMemoryEntry).createdAt === "string" &&
          typeof (item as AIGenerationMemoryEntry).modelType === "string" &&
          typeof (item as AIGenerationMemoryEntry).provider === "string" &&
          typeof (item as AIGenerationMemoryEntry).userPrompt === "string" &&
          typeof (item as AIGenerationMemoryEntry).finalPrompt === "string" &&
          typeof (item as AIGenerationMemoryEntry).success === "boolean"
        );
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } catch {
    return [];
  }
};

const loadEntries = (): AIGenerationMemoryEntry[] => {
  if (!isBrowser()) return [];
  return safeParseEntries(window.localStorage.getItem(STORAGE_KEY));
};

const persistEntries = (entries: AIGenerationMemoryEntry[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
};

export const recordAIGenerationMemoryAttempt = (input: {
  modelUrl: string | null;
  modelType: string;
  provider: AITextureProvider;
  userPrompt: string;
  finalPrompt: string;
  success: boolean;
  errorMessage?: string | null;
}) => {
  if (!isBrowser()) return;

  const entry: AIGenerationMemoryEntry = {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    modelUrl: input.modelUrl || null,
    modelType: input.modelType,
    provider: input.provider,
    userPrompt: trimPrompt(input.userPrompt),
    finalPrompt: trimPrompt(input.finalPrompt),
    success: input.success,
    errorMessage: input.errorMessage || null,
  };

  const entries = loadEntries();
  entries.unshift(entry);
  persistEntries(entries);
};

export const getAIGenerationMemoryContext = (
  modelUrl: string | null,
  modelType: string,
): AIGenerationMemoryContext => {
  if (!isBrowser()) {
    return {
      guidance: null,
      fallbackPrompt: null,
      preferredProvider: null,
    };
  }

  const entries = loadEntries().filter((e) => e.success);
  if (entries.length === 0) {
    return {
      guidance: null,
      fallbackPrompt: null,
      preferredProvider: null,
    };
  }

  const normalizedTargetUrl = normalizeModelUrl(modelUrl);

  const byExactModel = normalizedTargetUrl
    ? entries.filter((e) => normalizeModelUrl(e.modelUrl) === normalizedTargetUrl)
    : [];

  const byModelType = entries.filter((e) => e.modelType === modelType);
  const scoped = (byExactModel.length > 0 ? byExactModel : byModelType).slice(0, 8);

  if (scoped.length === 0) {
    return {
      guidance: null,
      fallbackPrompt: null,
      preferredProvider: null,
    };
  }

  const uniquePrompts = Array.from(
    new Set(
      scoped
        .map((e) => e.userPrompt)
        .filter((p) => p.length > 0)
        .map((p) => trimPrompt(p)),
    ),
  ).slice(0, 3);

  const fallbackPrompt = uniquePrompts[0] || null;
  const guidance =
    uniquePrompts.length > 0
      ? `Memory from previous successful generations: ${uniquePrompts.join(" | ")}`
      : null;

  return {
    guidance,
    fallbackPrompt,
    preferredProvider: scoped[0]?.provider ?? null,
  };
};
