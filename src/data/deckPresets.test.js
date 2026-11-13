// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { DECK_PRESETS, presetConfig, presetSeed } from './deckPresets'
import { ICON_BY_NAME } from './iconOptions'
import { SCENE_REGISTRY } from './sceneRegistry.jsx'

const allSceneIds = SCENE_REGISTRY.map((s) => s.id)

describe('deck presets', () => {
  it('names only scenes that are actually registered', () => {
    for (const preset of DECK_PRESETS) {
      const unknown = preset.sceneIds.filter((id) => !allSceneIds.includes(id))
      expect(unknown, `preset "${preset.id}" points at unregistered scenes`).toEqual([])
    }
  })

  it('enables exactly the preset scenes and pushes the rest behind them', () => {
    for (const preset of DECK_PRESETS.filter((p) => !p.allScenes)) {
      const { order, enabledIds } = presetConfig(preset.id, allSceneIds)
      expect(enabledIds).toEqual(preset.sceneIds)
      expect(order.slice(0, preset.sceneIds.length)).toEqual(preset.sceneIds)
      expect(order).toHaveLength(allSceneIds.length)
    }
  })

  describe('cluster operations workshop preset', () => {
    const preset = DECK_PRESETS.find((p) => p.id === 'cluster-ops-workshop')
    const seed = presetSeed('cluster-ops-workshop')

    it('is registered', () => {
      expect(preset).toBeTruthy()
    })

    it('seeds content only for scenes it names, each with speaker notes', () => {
      for (const id of Object.keys(seed.sceneMetadata)) expect(preset.sceneIds).toContain(id)
      for (const id of preset.sceneIds) expect(seed.sceneMetadata[id]?.speakerNotes, id).toBeTruthy()
    })

    it('times the deck at 30 minutes, with the demo the largest block', () => {
      const mins = preset.sceneIds.map((id) => parseInt(seed.durations[id], 10))
      expect(mins.reduce((a, b) => a + b, 0)).toBe(30)
      expect(Math.max(...mins)).toBe(parseInt(seed.durations['value-by-team'], 10))
    })

    it('covers all eight topics across the demo stops', () => {
      const tags = seed.sceneMetadata['value-by-team'].teams.map((t) => t.tag).join(' ')
      for (const n of ['1', '2', '3', '4', '5', '6', '7', '8']) expect(tags).toMatch(new RegExp(`\\b${n}\\b`))
    })

    it('uses only icons the scenes can resolve', () => {
      const names = []
      const meta = seed.sceneMetadata
      meta['problem-patterns'].categories.forEach((c) => names.push(c.icon))
      meta['value-by-team'].teams.forEach((t) => names.push(t.icon))
      names.push(meta['value-by-team'].impactIcon)
      meta['business-value'].cards.forEach((c) => names.push(c.icon))
      meta['platform-value'].values.forEach((v) => names.push(v.icon))
      for (const name of names) expect(ICON_BY_NAME[name], `icon "${name}"`).toBeTruthy()
    })

    it('presetSeed is empty for presets that ship no content', () => {
      expect(presetSeed('new-prospect')).toEqual({ durations: {}, sceneMetadata: {} })
    })
  })
})
