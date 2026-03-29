import { schemas } from '../validation/schemas.js';
import { validate } from '../validation/validator.js';
import { sanitizeImportedJson } from '../../shared/sanitizeImportedJson.js';
import { topLevelFieldsFromValidationErrors } from '../utils/validationFieldHints.js';

const ALLOWED_TYPES = new Set(['process_l2', 'process_l3', 'sop']);

/**
 * Strip markdown code fences and parse JSON from LLM output.
 * @param {string} content
 * @returns {object}
 */
export function extractJsonFromContent(content) {
  const trimmed = String(content).trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Root must be a JSON object');
    }
    return parsed;
  } catch (first) {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) {
      try {
        const inner = fence[1].trim();
        const parsed = JSON.parse(inner);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('Root must be a JSON object');
        }
        return parsed;
      } catch (e) {
        const err = new Error(`Failed to parse JSON from fenced block: ${e.message}`);
        err.raw = trimmed;
        err.statusCode = 422;
        throw err;
      }
    }
    const err = new Error(`Failed to parse JSON: ${first.message}`);
    err.raw = trimmed;
    err.statusCode = 422;
    throw err;
  }
}

function requiredFieldNamesForType(type) {
  const schema = schemas[type];
  if (!schema) return [];
  return Object.entries(schema.fields)
    .filter(([, rule]) => rule.required)
    .map(([name]) => name);
}

/**
 * @param {object} raw
 * @returns {{ insufficient: true, missing_fields: string[], summary: string } | null}
 */
export function parseInsufficientPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const flag = raw._insufficient_source;
  if (flag !== true && flag !== 'true') return null;
  const missing = raw.missing_fields;
  const summary = typeof raw.summary === 'string' ? raw.summary.trim() : '';
  const missing_fields = Array.isArray(missing)
    ? missing.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim())
    : [];
  return {
    insufficient: true,
    missing_fields,
    summary:
      summary ||
      'The source text does not contain enough information to fill all required fields. Add details and try again, or use the manual form.',
  };
}

/**
 * Sanitize and validate LLM JSON (no network). Used by parseTextToProcess and tests.
 * @param {object} parsed
 * @param {'process_l2'|'process_l3'|'sop'} type
 */
export function evaluateParsedProcessJson(parsed, type) {
  const insufficientFromModel = parseInsufficientPayload(parsed);
  if (insufficientFromModel) {
    return {
      ok: false,
      insufficient: true,
      missing_fields: insufficientFromModel.missing_fields,
      summary: insufficientFromModel.summary,
    };
  }

  const sanitized = sanitizeImportedJson(parsed);
  if (typeof sanitized !== 'object' || sanitized === null || Array.isArray(sanitized)) {
    return {
      ok: false,
      insufficient: true,
      missing_fields: [],
      summary: 'The model did not return a valid process object. Try again or use the manual form.',
    };
  }

  const schemaResult = validate(sanitized, type);
  if (!schemaResult.valid) {
    const missingTop = topLevelFieldsFromValidationErrors(schemaResult.errors);
    return {
      ok: false,
      insufficient: true,
      missing_fields: missingTop,
      summary: buildFallbackSummary(missingTop),
    };
  }

  return { ok: true, data: sanitized };
}

function buildFallbackSummary(missingTopLevel) {
  if (missingTopLevel.length === 0) {
    return 'The model output could not be validated. Try again with more detail, or use the manual form.';
  }
  return `Some required fields are missing or empty: ${missingTopLevel.join(', ')}. Add this information to your text and try again, or fill the form manually.`;
}

/**
 * Map free-form text to process JSON using the template for `type` and an OpenAI-compatible chat API.
 *
 * @param {string} text
 * @param {'process_l2'|'process_l3'|'sop'} type
 * @returns {Promise<{ ok: true, data: object } | { ok: false, insufficient: true, missing_fields: string[], summary: string }>}
 */
export async function parseTextToProcess(text, type) {
  if (!ALLOWED_TYPES.has(type)) {
    throw new Error(`type must be one of: ${[...ALLOWED_TYPES].join(', ')}`);
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { templateRepository } = await import('./dataLayer/index.js');
  const template = await templateRepository.getTemplate(type);
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  const requiredNames = requiredFieldNamesForType(type);

  const systemPrompt = `You are a strict assistant that maps free-form process descriptions to a JSON document.

The target JSON MUST use the same keys and nested structure as the TEMPLATE below. Template string values explain what each field means (they may start with ___REQUIRED___ / ___OPTIONAL___ / ___AUTO___ — do not copy those prefixes into output; replace with extracted content).

You MUST respond with exactly ONE JSON object and nothing else — no markdown, no code fences, no commentary.

Two allowed output shapes:

1) COMPLETE DOCUMENT — when the user's SOURCE TEXT contains enough information to fill every required schema field below with non-empty, meaningful content taken from the text (you may paraphrase or condense, but do not invent facts not supported by the source).
   - Set "type" to exactly: ${JSON.stringify(template.type)}.
   - Required fields for this type (must all be present and non-empty where they are strings, and arrays must have at least one string element where required): ${JSON.stringify(requiredNames)}

2) INSUFFICIENT SOURCE — when the source text is too vague, too short, or missing facts needed for any required field above. Do NOT return a process document with empty strings "" or empty arrays [] for required fields. Instead return ONLY this object:
   {"_insufficient_source":true,"missing_fields":["field1","field2",...],"summary":"short explanation in the same language as the source text, listing what is missing or unclear"}

Rules for (1):
- Extract information ONLY from the user's SOURCE TEXT. Do NOT invent names, numbers, or organizational facts not present in the source.
- If you can reasonably infer a role or generic participant from context (e.g. "the team") without inventing a specific person's name, you may use that phrasing.
- For optional fields, use "" or [] when absent.

TEMPLATE:
${JSON.stringify(template, null, 2)}`;

  const userMessage = `SOURCE TEXT:\n\n${String(text).slice(0, 120_000)}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI API error: ${res.status} ${errText.slice(0, 800)}`);
  }

  const body = await res.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('OpenAI returned empty or invalid response');
  }

  let parsed;
  try {
    parsed = extractJsonFromContent(content);
  } catch (e) {
    if (e.statusCode === 422) throw e;
    const err = new Error(e.message || 'Failed to parse LLM output as JSON');
    err.raw = content;
    err.statusCode = 422;
    throw err;
  }

  return evaluateParsedProcessJson(parsed, type);
}
