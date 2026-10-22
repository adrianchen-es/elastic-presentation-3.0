// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import PlatformTourEditor, { currentPages, movePage, setPage, removePage, addPage } from './PlatformTourEditor'
import { PLATFORM_TOUR_PAGES, TOUR_PAGE_REGISTRY } from '../../data/tourPageRegistry'

afterEach(() => {
  cleanup()
})

function renderEditor(sceneMetadata = {}) {
  const onUpdateSceneMetadata = vi.fn()
  render(
    <PlatformTourEditor
      sceneMetadata={{ 'platform-tour': sceneMetadata }}
      onUpdateSceneMetadata={onUpdateSceneMetadata}
      isDark={false}
      inputClass="input"
    />,
  )
  return onUpdateSceneMetadata
}

describe('currentPages', () => {
  it('returns the default list when no pages are configured', () => {
    expect(currentPages({})).toBe(PLATFORM_TOUR_PAGES)
  })

  it('returns configured pages when at least one has a sceneId', () => {
    const pages = [{ sceneId: 'about' }, { sceneId: 'search-context', enabled: false }]
    expect(currentPages({ pages })).toBe(pages)
  })

  it('ignores legacy index-only overrides without a sceneId', () => {
    expect(currentPages({ pages: [{ enabled: false }, { hold: 5000 }] })).toBe(PLATFORM_TOUR_PAGES)
  })
})

describe('list helpers', () => {
  const list = [{ sceneId: 'a' }, { sceneId: 'b' }, { sceneId: 'c' }]

  it('movePage swaps neighbours and returns a new array', () => {
    const next = movePage(list, 1, -1)
    expect(next.map((p) => p.sceneId)).toEqual(['b', 'a', 'c'])
    expect(list.map((p) => p.sceneId)).toEqual(['a', 'b', 'c'])
  })

  it('movePage keeps the order when out of range', () => {
    expect(movePage(list, 0, -1).map((p) => p.sceneId)).toEqual(['a', 'b', 'c'])
    expect(movePage(list, 2, 1).map((p) => p.sceneId)).toEqual(['a', 'b', 'c'])
  })

  it('setPage merges the patch into one entry', () => {
    const next = setPage(list, 1, { title: 'Bee' })
    expect(next[1]).toEqual({ sceneId: 'b', title: 'Bee' })
    expect(next[0]).toBe(list[0])
  })

  it('setPage removes keys patched with undefined', () => {
    const next = setPage([{ sceneId: 'a', hold: 3000 }], 0, { hold: undefined })
    expect(next[0]).toEqual({ sceneId: 'a' })
    expect('hold' in next[0]).toBe(false)
  })

  it('removePage drops the entry at index', () => {
    expect(removePage(list, 1).map((p) => p.sceneId)).toEqual(['a', 'c'])
  })

  it('addPage appends a sceneId', () => {
    expect(addPage([{ sceneId: 'a' }], 'b')).toEqual([{ sceneId: 'a' }, { sceneId: 'b' }])
  })
})

describe('PlatformTourEditor', () => {
  it('renders a card per default page with registry titles', () => {
    renderEditor()
    expect(screen.getByText('About Elastic')).toBeTruthy()
    expect(screen.getByText('Platform Overview')).toBeTruthy()
    expect(screen.getAllByRole('checkbox')).toHaveLength(PLATFORM_TOUR_PAGES.length)
  })

  it('moves the first page down and swaps the first two sceneIds', () => {
    const onUpdate = renderEditor()
    fireEvent.click(screen.getByLabelText('Move down About Elastic'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [id, patch] = onUpdate.mock.calls[0]
    expect(id).toBe('platform-tour')
    expect(patch.pages[0].sceneId).toBe('unified-strategy')
    expect(patch.pages[1].sceneId).toBe('about')
  })

  it('writes enabled: false when a page is unchecked', () => {
    const onUpdate = renderEditor()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    const patch = onUpdate.mock.calls[0][1]
    expect(patch.pages[0]).toEqual({ sceneId: 'about', enabled: false })
  })

  it('writes title when typing into the title input', () => {
    const onUpdate = renderEditor()
    fireEvent.change(screen.getByPlaceholderText(TOUR_PAGE_REGISTRY.about.title), {
      target: { value: 'Intro' },
    })
    expect(onUpdate.mock.calls[0][1].pages[0]).toEqual({ sceneId: 'about', title: 'Intro' })
  })

  it('writes hold in ms for a page without beats', () => {
    const onUpdate = renderEditor()
    const holdInputs = screen.getAllByLabelText('Hold (seconds)')
    expect(holdInputs[0].disabled).toBe(false)
    fireEvent.change(holdInputs[0], { target: { value: '8' } })
    expect(onUpdate.mock.calls[0][1].pages[0].hold).toBe(8000)
  })

  it('disables the hold input for a page with beats', () => {
    renderEditor()
    const searchChallengeIndex = PLATFORM_TOUR_PAGES.findIndex((p) => p.sceneId === 'search-challenge')
    const holdInput = screen.getAllByLabelText('Hold (seconds)')[searchChallengeIndex]
    expect(holdInput.disabled).toBe(true)
    expect(screen.getAllByText("Timing follows the scene's own beats").length).toBeGreaterThan(0)
  })

  it('adds a page picked from the select after one was removed', () => {
    const onUpdate = renderEditor({ pages: [{ sceneId: 'about' }] })
    const select = screen.getByLabelText('Add page')
    fireEvent.change(select, { target: { value: 'search-context' } })
    expect(onUpdate.mock.calls[0][1].pages).toEqual([
      { sceneId: 'about' },
      { sceneId: 'search-context' },
    ])
  })

  it('reset removes pages but keeps eyebrow', () => {
    const onUpdate = renderEditor({ eyebrow: 'Custom', pages: [{ sceneId: 'about' }] })
    fireEvent.click(screen.getByText('Reset to defaults'))
    expect(onUpdate).toHaveBeenCalledWith('platform-tour', { eyebrow: 'Custom' })
  })
})
