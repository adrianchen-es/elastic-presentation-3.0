// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { SCENE_REGISTRY } from './sceneRegistry.jsx'
import { presetSeed, getPreset } from './deckPresets'
import { baseSceneId } from '../utils/sceneIdentity'
import { ThemeProvider } from '../context/ThemeContext'
import { SceneMotionProvider } from '../context/SceneMotionContext'

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
if (!globalThis.ResizeObserver) globalThis.ResizeObserver = NoopObserver
if (!globalThis.IntersectionObserver) globalThis.IntersectionObserver = NoopObserver
if (!globalThis.matchMedia) {
  globalThis.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })
}

const seed = presetSeed('cluster-ops-workshop')
const preset = getPreset('cluster-ops-workshop')

// One distinctive string per slide, taken from the seeded content.
const EXPECT_TEXT = {
  hero: 'find the cause, not just the symptom',
  'problem-patterns': 'Where clusters hurt',
  agenda: 'What we will cover',
  'value-by-team': 'Health first',
  'business-value': 'Scatter and gather',
  'platform-value': 'Alert early',
  'node-types': 'Hold cluster state',
  'elastic-value': 'repository_integrity',
  'data-tiering': 'Hot',
  'enterprise-deployment': 'Enterprise Deployment',
  'value-by-team~2': 'Shard strategy',
  'value-by-team~3': 'Ingest backpressure',
}

afterEach(() => cleanup())

describe.each(preset.sceneIds)('cluster ops workshop: %s', (id) => {
  it('renders the seeded content', () => {
    const scene = SCENE_REGISTRY.find((s) => s.id === baseSceneId(id))
    const Component = scene.component
    const { container } = render(
      <ThemeProvider>
        <SceneMotionProvider>
          <Component
            metadata={seed.sceneMetadata[id]}
            scenes={[]}
            sceneMetadata={seed.sceneMetadata}
            customDurations={seed.durations}
            selectedCard={null}
            setSelectedCard={() => {}}
            setShowUnifiedMessage={() => {}}
          />
        </SceneMotionProvider>
      </ThemeProvider>,
    )
    expect(container.textContent).toContain(EXPECT_TEXT[id])
  })
})
