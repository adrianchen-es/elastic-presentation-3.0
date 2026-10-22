// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, act } from '@testing-library/react'
import SceneTour from './SceneTour'
import { ThemeProvider } from '../../context/ThemeContext'
import { SceneMotionProvider } from '../../context/SceneMotionContext'

const REGISTRY = {
  a: { title: 'Alpha', component: () => <div>alpha-body</div> },
  b: { title: 'Beta', component: () => <div>beta-body</div> },
  c: { title: 'Gamma', component: () => <div>gamma-body</div> },
}

const DEFAULT_PAGES = [{ sceneId: 'a' }, { sceneId: 'b' }, { sceneId: 'c' }]

function renderTour(props = {}) {
  return render(
    <ThemeProvider>
      <SceneMotionProvider>
        <SceneTour registry={REGISTRY} defaultPages={DEFAULT_PAGES} {...props} />
      </SceneMotionProvider>
    </ThemeProvider>,
  )
}

// One step per call: React flushes the state update at the end of `act`, so the
// next dwell timer is only scheduled once this one has been applied.
const advanceOneStep = (ms) => act(() => vi.advanceTimersByTime(ms))

afterEach(cleanup)

describe('SceneTour engine', () => {
  it('renders the default eyebrow and every pill, and opens on the first page', () => {
    const { container, getByText } = renderTour()

    expect(container.textContent).toContain('Tour')
    expect(getByText('Alpha')).toBeTruthy()
    expect(getByText('Beta')).toBeTruthy()
    expect(getByText('Gamma')).toBeTruthy()
    expect(container.textContent).toContain('alpha-body')
  })

  it('lets metadata.eyebrow override the eyebrow prop', () => {
    const { container } = renderTour({
      eyebrow: 'Prop Eyebrow',
      metadata: { eyebrow: 'Override' },
    })

    expect(container.textContent).toContain('Override')
    expect(container.textContent).not.toContain('Prop Eyebrow')
  })

  it('uses metadata.pages list mode: order, renames, and disabled entries', () => {
    const { container, getByText, queryByText } = renderTour({
      metadata: {
        pages: [{ sceneId: 'c' }, { sceneId: 'a', title: 'Renamed' }, { sceneId: 'b', enabled: false }],
      },
    })

    const pills = Array.from(container.querySelectorAll('button')).map((b) => b.textContent)
    expect(pills).toEqual(['Gamma', 'Renamed'])
    expect(queryByText('Beta')).toBeNull()
    expect(getByText('Renamed')).toBeTruthy()
    expect(container.textContent).toContain('gamma-body')
  })

  it('jumps to a page when its pill is clicked', () => {
    const { container, getByText } = renderTour({
      metadata: {
        pages: [{ sceneId: 'c' }, { sceneId: 'a', title: 'Renamed' }, { sceneId: 'b', enabled: false }],
      },
    })

    fireEvent.click(getByText('Renamed'))
    expect(container.textContent).toContain('alpha-body')
  })

  it('moves to the next page once the pageHold has elapsed', () => {
    vi.useFakeTimers()
    try {
      const { container } = renderTour({ metadata: { pageHold: 6000 } })
      expect(container.textContent).toContain('alpha-body')

      advanceOneStep(6000)
      expect(container.textContent).toContain('beta-body')
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders nothing without throwing when there are no pages', () => {
    const { container } = renderTour({ registry: {}, defaultPages: [] })
    expect(container.textContent).toBe('')
  })

  it('passes a page its per-page metadata, keyed by sceneId', () => {
    const registry = {
      a: {
        title: 'Alpha',
        component: ({ metadata }) => <div>{metadata.label}</div>,
      },
    }
    const { container } = renderTour({
      registry,
      defaultPages: [{ sceneId: 'a' }],
      metadata: { pageMetadata: { a: { label: 'hello-meta' } } },
    })

    expect(container.textContent).toContain('hello-meta')
  })
})
