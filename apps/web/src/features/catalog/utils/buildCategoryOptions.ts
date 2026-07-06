import type { SelectOption } from '@shared/components'

interface CategoryNode {
  id: string
  name: string
  parentCategoryId?: string | null
}

// Categories arrive as a flat list (parentCategoryId links children to
// parents, per docs/graphql.md's "design for the client, implement for the
// database") — this walks the tree depth-first so children render indented
// directly beneath their parent, without a nested GraphQL resolver.
export function buildCategoryOptions(categories: CategoryNode[]): SelectOption[] {
  const byParentId = new Map<string | null, CategoryNode[]>()
  for (const category of categories) {
    const parentId = category.parentCategoryId ?? null
    const siblings = byParentId.get(parentId) ?? []
    siblings.push(category)
    byParentId.set(parentId, siblings)
  }

  const options: SelectOption[] = []
  function walk(parentId: string | null, depth: number) {
    for (const category of byParentId.get(parentId) ?? []) {
      options.push({ value: category.id, label: `${'— '.repeat(depth)}${category.name}` })
      walk(category.id, depth + 1)
    }
  }
  walk(null, 0)

  return options
}
