import AboutScene from '../scenes/AboutScene'
import UnifiedStrategyScene from '../scenes/UnifiedStrategyScene'
import DataExplosionSceneV2 from '../scenes/DataExplosionSceneV2'
import SearchChallengeScene, { BEATS as SEARCH_CHALLENGE_BEATS } from '../scenes/SearchChallengeScene'
import SearchContextScene, { BEATS as SEARCH_CONTEXT_BEATS } from '../scenes/SearchContextScene'
import VideoKnowledgeScene, { DEFAULT_BEATS as VIDEO_KNOWLEDGE_BEATS } from '../scenes/VideoKnowledgeScene'

/**
 * Registry of scenes that can be embedded in a tour, keyed by scene id.
 *
 * Each entry has:
 * - `title`: label shown for the page.
 * - `component`: the scene component to render.
 * - `beats`: the embedded scene's own beat list. The tour steps through it and
 *   reuses each beat's `hold`, so page timing never drifts from the scene.
 * - `stepProps`: for a scene with no beats but a one-shot reveal to trigger.
 *   One entry per step, merged into the scene's props.
 * - `hold`: dwell in ms for a page that has neither beats nor stepProps.
 *
 * To make another scene embeddable in a tour, add an entry here.
 */
export const TOUR_PAGE_REGISTRY = {
  about: {
    title: 'About Elastic',
    component: AboutScene,
  },
  'unified-strategy': {
    title: 'Platform Overview',
    component: UnifiedStrategyScene,
    hold: 14000,
  },
  'data-explosion': {
    title: 'Data Explosion',
    component: DataExplosionSceneV2,
    // The verdict panel renders hidden until `verdictSignal` fires, so the page
    // runs as two steps: the chart and counters land, then the verdict.
    stepProps: [{ verdictSignal: 0 }, { verdictSignal: 1 }],
    hold: 7500,
  },
  'search-challenge': {
    title: 'Unstructured Challenge',
    component: SearchChallengeScene,
    beats: SEARCH_CHALLENGE_BEATS,
  },
  'search-context': {
    title: 'Context Layer',
    component: SearchContextScene,
    beats: SEARCH_CONTEXT_BEATS,
  },
  'video-knowledge': {
    title: 'Knowledge From Video',
    component: VideoKnowledgeScene,
    beats: VIDEO_KNOWLEDGE_BEATS,
  },
}

/**
 * The default Scene Tour running order, as scene ids from TOUR_PAGE_REGISTRY.
 */
export const DEFAULT_TOUR_PAGES = [
  'about',
  'unified-strategy',
  'data-explosion',
  'search-challenge',
  'search-context',
  'video-knowledge',
].map((sceneId) => ({ sceneId }))
