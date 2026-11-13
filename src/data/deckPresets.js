// Named presentation flows. Applying a preset enables exactly these scenes, in
// this order; every other scene is moved after them and disabled. Per-scene
// durations and content edits are preserved when switching presets.

import { CLUSTER_OPS_PRESET } from './clusterOpsWorkshopPreset'

export const DECK_PRESETS = [
  {
    id: 'no-scenes',
    label: 'No Scenes',
    description: 'A blank slate — only the Hero scene. Build a flow from scratch.',
    sceneIds: ['hero'],
  },
  {
    id: 'all-scenes',
    label: 'All Scenes',
    description: 'Everything enabled, in registration order — the full library.',
    allScenes: true,
    sceneIds: [],
  },
  {
    id: 'new-prospect',
    label: 'New Prospect',
    description: 'Net-new pitch — market context first, no existing-footprint assumptions.',
    sceneIds: [
      'hero',
      'agenda',
      'team',
      'about',
      'data-explosion',
      'problem-patterns',
      'business-value',
      'elastic-exploded',
      'unified-strategy',
      'consolidation',
      'licensing',
      'pricing-rom',
      'customer-architect',
      'services',
      'platform-value',
      'next-steps',
      // Sits after the close on purpose: it runs itself, so it is what you
      // leave on screen while the room empties or fills.
      'scene-tour',
    ],
  },
  {
    id: 'technical',
    label: 'Technical Deep-Dive',
    description: 'Architecture & platform internals for architects and platform teams — from planes to a full reference deployment.',
    sceneIds: [
      'hero',
      'agenda',
      'team',
      'elastic-overview',
      'elastic-exploded',
      'unified-strategy',
      'core-components',
      'node-types',
      'data-tiering',
      'schema',
      'access-control',
      'cross-cluster',
      'data-mesh',
      'esql',
      'platform-operations',
      'enterprise-deployment',
      'platform-value',
      'next-steps',
    ],
  },
  CLUSTER_OPS_PRESET,
  {
    id: 'whiteboard-session',
    label: 'Whiteboard',
    description: 'A live working session — a quick platform grounding and the reference architecture, then draw theirs on the board.',
    sceneIds: [
      'hero',
      'team',
      'elastic-overview',
      'enterprise-deployment',
      'whiteboard',
      'next-steps',
    ],
  },
  {
    id: 'observability',
    label: 'Observability',
    description: 'The Observability story — from efficient datastore to autonomous AI SRE (Nightshift).',
    sceneIds: [
      'hero',
      'agenda',
      'team',
      'unified-strategy',
      'obs-ai-scale',
      'obs-heritage',
      'obs-three-layers',
      'obs-pillars',
      'obs-streams',
      'obs-otel',
      'obs-signals',
      'obs-kubernetes',
      'obs-mcp-app',
      'obs-agentic',
      'obs-discovery',
      'obs-surfaces',
      'nightshift-sre',
      'nightshift-arch',
      'next-steps',
    ],
  },
  {
    id: 'security',
    label: 'Security',
    description: 'The Security story — modern threat landscape to AI-driven SecOps, tool consolidation, and governance.',
    sceneIds: [
      'hero',
      'agenda',
      'team',
      'about',
      'business-value',
      'unified-strategy',
      'security-narrative-visual',
      'security-soc-model',
      'security-capabilities',
      'security',
      'security-use-cases',
      'ai-assistant',
      'consolidation',
      'access-control',
      'licensing',
      'pricing-rom',
      'customer-architect',
      'services',
      'platform-value',
      'next-steps',
    ],
  },
  {
    id: 'search',
    label: 'Search',
    description: 'The Search story — lexical foundations, vector scale, GPU, inference, and context layer through ES|QL.',
    sceneIds: [
      'hero',
      'agenda',
      'team',
      'about',
      'unified-strategy',
      'elastic-exploded',
      'search-catalog',
      'search-challenge',
      'search-vector-scale',
      'search-vector',
      'search-gpu',
      'search-inference',
      'search-context',
      'ai-assistant',
      'esql',
      'licensing',
      'pricing-rom',
      'customer-architect',
      'services',
      'platform-value',
      'next-steps',
    ],
  },
]

export const DEFAULT_PRESET_ID = 'new-prospect'

export const CUSTOM_PRESET_ID = 'custom'

export function getPreset(presetId) {
  return DECK_PRESETS.find((p) => p.id === presetId) || null
}

// Returns { order, enabledIds } for a preset against the full scene list:
// preset scenes first (in preset order, enabled), all other scenes after (disabled).
export function presetConfig(presetId, allSceneIds) {
  const preset = getPreset(presetId)
  if (!preset) return null
  // "All scenes" enables every registered scene in its natural order — no
  // explicit list, so newly added scenes are always included.
  if (preset.allScenes) {
    return { order: [...allSceneIds], enabledIds: [...allSceneIds] }
  }
  const enabledIds = preset.sceneIds.filter((id) => allSceneIds.includes(id))
  const remaining = allSceneIds.filter((id) => !enabledIds.includes(id))
  return { order: [...enabledIds, ...remaining], enabledIds }
}

// Optional content a preset ships with: per-scene durations and metadata (slide
// text, speaker notes). Applied over the user's values for exactly the scenes the
// preset names, so choosing the preset gives the whole deck; other scenes are untouched.
export function presetSeed(presetId) {
  const preset = getPreset(presetId)
  return {
    durations: { ...(preset?.durations || {}) },
    sceneMetadata: { ...(preset?.sceneMetadata || {}) },
  }
}

// Scene copies a preset needs (for example a layout reused for appendix slides).
// Entries look like { id: 'value-by-team~2', sourceId: 'value-by-team', label }.
export function presetDuplicates(presetId) {
  return [...(getPreset(presetId)?.duplicates || [])]
}
