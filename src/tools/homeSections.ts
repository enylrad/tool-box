import type { ToolCategory } from './registry'

interface Categorized {
  category: ToolCategory
}

/** Groups tools under their category, in category order, leaving out empty categories. */
export function groupByCategory<T extends Categorized>(
  tools: readonly T[],
  categories: readonly { id: ToolCategory; name: string }[],
): { id: ToolCategory; name: string; tools: T[] }[] {
  return categories
    .map((category) => ({ ...category, tools: tools.filter((tool) => tool.category === category.id) }))
    .filter((section) => section.tools.length > 0)
}
