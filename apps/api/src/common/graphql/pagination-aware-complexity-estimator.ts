import type { ComplexityEstimator } from 'graphql-query-complexity'

/**
 * graphql-query-complexity's `simpleEstimator` charges a flat cost per
 * field regardless of how many rows a connection field's `first` argument
 * actually requests — a query requesting `first: 20` and one requesting
 * `first: 200000` on the exact same field cost the same under it, which
 * defeats the point of a complexity ceiling for this schema's dominant
 * list-query shape (every list is `first`/`after` cursor pagination, per
 * docs/graphql.md § 5 and § 13). This estimator charges `childComplexity *
 * first` for any field with a `first` argument, so a maliciously large
 * page size is reflected in the score the ceiling actually enforces,
 * instead of being invisible to it. Falls through (returns `undefined`) for
 * every other field, letting `simpleEstimator` charge its flat per-field
 * cost as usual — this is a supplement, not a replacement.
 */
export const paginationAwareEstimator: ComplexityEstimator = ({ args, childComplexity }) => {
  const first = (args as { first?: unknown } | undefined)?.first
  if (typeof first === 'number' && first > 0) {
    return childComplexity * first + 1
  }
  return undefined
}
