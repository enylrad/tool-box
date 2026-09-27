import type { C2paInfo } from './c2pa'
import { readCaptureDates } from './basicInfo'
import { getTag, tagText, type MetadataTags } from './tags'

export interface HistoryEntry {
  action?: string
  when?: string
  software?: string
  changed?: string
}

export interface AiSignal {
  /** `generated`: the file says it was made by AI; `edited`: AI was used on a real photo; `hint`: an AI tool is mentioned. */
  strength: 'generated' | 'edited' | 'hint'
  text: string
}

export interface EditSignals {
  software: string[]
  modifiedAfterCapture: boolean
  history: HistoryEntry[]
  ai: AiSignal[]
  /** Generation prompt stored in PNG text chunks (Stable Diffusion, ComfyUI, NovelAI…). */
  prompt?: { source: string; text: string }
}

const AI_TOOLS =
  /\b(dall[-·‐ ]?e|midjourney|stable[- ]?diffusion|sdxl|firefly|imagen|gemini|chatgpt|gpt-4o|openai|novelai|flux(\.1)?|leonardo\.ai|ideogram|bing image creator|image creator|comfyui|automatic1111|invokeai|dreamstudio|nano banana|made with google ai|generative fill|generative expand)\b/i

/** IPTC digital source types: https://cv.iptc.org/newscodes/digitalsourcetype/ */
const SOURCE_TYPES: Record<string, AiSignal> = {
  trainedalgorithmicmedia: { strength: 'generated', text: 'The file declares it was created by generative AI (IPTC Digital Source Type).' },
  algorithmicmedia: { strength: 'generated', text: 'The file declares it was created purely by an algorithm (IPTC Digital Source Type).' },
  compositewithtrainedalgorithmicmedia: {
    strength: 'edited',
    text: 'The file declares it combines real content with generative AI (IPTC Digital Source Type).',
  },
  compositesynthetic: { strength: 'edited', text: 'The file declares it is a composite with synthetic elements (IPTC Digital Source Type).' },
  algorithmicallyenhanced: { strength: 'edited', text: 'The file declares it was algorithmically enhanced (IPTC Digital Source Type).' },
}

const PROMPT_KEYS = ['parameters', 'prompt', 'Dream', 'sd-metadata', 'invokeai_metadata', 'workflow', 'Comment']

function textChunks(tags: MetadataTags) {
  return Object.entries(tags.pngText ?? {}).map(([key, tag]) => ({ key, text: String(tag.description ?? tag.value ?? '') }))
}

function readHistory(tags: MetadataTags): HistoryEntry[] {
  const history = getTag(tags, 'History', ['xmp'])?.value
  if (!Array.isArray(history)) return []
  const field = (item: Record<string, { description?: string }>, name: string) => {
    const value = item[name]?.description
    return typeof value === 'string' && value.trim() ? value.trim() : undefined
  }
  return history
    .filter((item): item is Record<string, { description?: string }> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      action: field(item, 'action'),
      when: field(item, 'when'),
      software: field(item, 'softwareAgent'),
      changed: field(item, 'changed'),
    }))
    .filter((entry) => entry.action || entry.software)
}

export function readEditSignals(tags: MetadataTags, c2pa: C2paInfo): EditSignals {
  const software = [
    tagText(tags, 'Software', ['exif', 'pngText']),
    tagText(tags, 'ProcessingSoftware', ['exif']),
    tagText(tags, 'CreatorTool', ['xmp']),
    tagText(tags, 'Originating Program', ['iptc']),
  ].filter((name): name is string => Boolean(name))
  const history = readHistory(tags)
  for (const entry of history) if (entry.software) software.push(entry.software)

  const dates = readCaptureDates(tags)
  const modifiedAfterCapture = Boolean(dates.captured && dates.modified && dates.modified.slice(0, 19) !== dates.captured.slice(0, 19))

  const ai: AiSignal[] = []
  const sourceType = tagText(tags, 'DigitalSourceType', ['xmp', 'iptc'])
  const sourceKey = sourceType?.split('/').pop()?.toLowerCase()
  if (sourceKey && SOURCE_TYPES[sourceKey]) ai.push(SOURCE_TYPES[sourceKey])

  if (c2pa.declaresAi) ai.push({ strength: 'generated', text: 'The Content Credentials (C2PA) manifest says the image was made with generative AI.' })

  const chunks = textChunks(tags)
  const promptChunk = chunks.find(({ key, text }) => PROMPT_KEYS.includes(key) && looksLikePrompt(key, text))
  if (promptChunk) ai.push({ strength: 'generated', text: `Contains an AI image-generator prompt (PNG “${promptChunk.key}” text).` })

  const mentioned = new Set<string>()
  const searchable = [
    ...software,
    tagText(tags, ['Credit', 'Artist', 'ImageDescription', 'UserComment', 'Make', 'Model'], ['exif', 'xmp', 'iptc']),
    tagText(tags, 'Description', ['xmp']),
    tagText(tags, 'Credit Line', ['iptc']),
    ...c2pa.hints,
    ...chunks.map(({ text }) => text.slice(0, 2000)),
  ]
  for (const text of searchable) {
    const match = text && AI_TOOLS.exec(text)
    if (match) mentioned.add(match[0])
  }
  if (mentioned.size > 0) ai.push({ strength: 'hint', text: `Mentions an AI tool: ${[...mentioned].join(', ')}.` })

  return {
    software: [...new Set(software)],
    modifiedAfterCapture,
    history,
    ai,
    prompt: promptChunk ? { source: promptChunk.key, text: promptChunk.text } : undefined,
  }
}

function looksLikePrompt(key: string, text: string) {
  if (key === 'parameters') return /steps:|sampler:|cfg scale|seed:/i.test(text) || text.length > 20
  if (key === 'prompt' || key === 'workflow') return text.trim().startsWith('{')
  if (key === 'Comment') return /"(prompt|steps|sampler|uc)"/i.test(text)
  return text.length > 0
}

/** The most serious AI verdict, or null when nothing was found. */
export function aiVerdict(signals: AiSignal[]) {
  if (signals.some((signal) => signal.strength === 'generated')) return 'Likely AI-generated'
  if (signals.some((signal) => signal.strength === 'edited')) return 'AI-edited'
  if (signals.length > 0) return 'Possible AI involvement'
  return null
}
