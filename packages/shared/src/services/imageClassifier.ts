import { CategoryId } from '../types';
import { CATEGORIES } from '../constants/categories';

export interface ClassificationSuggestion {
  categoryId: CategoryId;
  confidence: number;
  reasoning: string;
}

export interface ClassificationResult {
  suggestions: ClassificationSuggestion[];
}

export interface ClassifierConfig {
  apiKey: string;
  model?: string;
  maxSuggestions?: number;
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function buildCategoryList(): string {
  return CATEGORIES.map((c) => `- ${c.id}: ${c.title} — ${c.subtitle}`).join('\n');
}

function buildPrompt(): string {
  return `You are analysing a photo of an urban issue in London, UK. Based on the image, identify the most likely issue category from the list below.

Return a JSON array of up to 3 best matches, ordered by confidence (highest first). Each entry must have:
- "categoryId": one of the exact IDs listed below
- "confidence": a number between 0 and 1
- "reasoning": a short sentence explaining why this category matches

Categories:
${buildCategoryList()}

Return ONLY a valid JSON array, no markdown fences or extra text. Example:
[{"categoryId":"potholes","confidence":0.92,"reasoning":"Image shows a large hole in road surface"}]`;
}

const validCategoryIds = new Set<string>(CATEGORIES.map((c) => c.id));

function parseResponse(text: string, maxSuggestions: number): ClassificationSuggestion[] {
  // Strip markdown fences if present
  const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (item: any) =>
        typeof item.categoryId === 'string' &&
        validCategoryIds.has(item.categoryId) &&
        typeof item.confidence === 'number' &&
        typeof item.reasoning === 'string',
    )
    .slice(0, maxSuggestions)
    .map((item: any) => ({
      categoryId: item.categoryId as CategoryId,
      confidence: Math.max(0, Math.min(1, item.confidence)),
      reasoning: String(item.reasoning),
    }));
}

export async function classifyImage(
  base64: string,
  mimeType: string,
  config: ClassifierConfig,
): Promise<ClassificationResult> {
  const model = config.model ?? 'gemini-2.0-flash';
  const maxSuggestions = config.maxSuggestions ?? 3;
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${config.apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildPrompt() },
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      return { suggestions: [] };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { suggestions: [] };

    const suggestions = parseResponse(text, maxSuggestions);
    return { suggestions };
  } catch {
    return { suggestions: [] };
  }
}

export function isClassifierAvailable(apiKey: string | undefined): boolean {
  return typeof apiKey === 'string' && apiKey.length > 0;
}
