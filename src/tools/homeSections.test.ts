import { describe, expect, it } from 'vitest'
import { groupByCategory } from './homeSections'
import { TOOL_CATEGORIES, TOOLS } from './registry'

describe('groupByCategory', () => {
  it('keeps category order and drops empty categories', () => {
    const tools = [
      { id: 'a', category: 'utilities' as const },
      { id: 'b', category: 'images' as const },
      { id: 'c', category: 'images' as const },
    ]
    const sections = groupByCategory(tools, TOOL_CATEGORIES)
    expect(sections.map((section) => section.id)).toEqual(['images', 'utilities'])
    expect(sections[0].tools.map((tool) => tool.id)).toEqual(['b', 'c'])
  })

  it('lists every registered tool exactly once', () => {
    const listed = groupByCategory(TOOLS, TOOL_CATEGORIES).flatMap((section) => section.tools.map((tool) => tool.id))
    expect(listed.sort()).toEqual(TOOLS.map((tool) => tool.id).sort())
  })
})
