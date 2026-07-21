import { GraphQLError, type DocumentNode, type GraphQLSchema } from 'graphql'
import { getComplexity, simpleEstimator } from 'graphql-query-complexity'
import { paginationAwareEstimator } from './pagination-aware-complexity-estimator'

// Deliberately not @apollo/server's own `GraphQLRequest` type — importing it
// here is exactly what drags in the dual cjs/esm `HeaderMap` clash this
// file's other comment explains; a minimal shape covering only the one
// field this plugin actually reads avoids the import entirely.
interface RequestWithVariables {
  variables?: Record<string, unknown>
}

/**
 * Query-shape hardening (v1.0 Release Readiness Audit finding F-C4).
 *
 * NOT wired as a `validationRules` entry (unlike depthLimit, right next to
 * this in app.module.ts) — that was the first attempt, and it broke every
 * query using a required variable. `createComplexityRule` (the
 * validationRules-shaped API graphql-query-complexity also exports) has no
 * access to a specific request's actual variable values — Apollo's
 * `validationRules` are built once, at server construction, with no
 * per-request closure — so it silently defaults to treating every variable
 * as absent and eagerly re-runs graphql-js's own variable-coercion check
 * against that empty object, reporting "$id of required type ID! was not
 * provided" as a validation error on requests that supplied it correctly.
 * That's an execution-time concern being asked at validation-time, and nothing
 * about this schema's config can fix it there.
 *
 * `didResolveOperation` runs after Apollo has already parsed the document
 * and coerced this request's real variables — genuinely available here via
 * `requestContext.request.variables` — which is exactly what `getComplexity`
 * (the same library's lower-level function, not the validationRules-shaped
 * wrapper) is built to take directly, rather than reaching for the closure
 * `createComplexityRule` requires.
 */
// No explicit `ApolloServerPlugin` return-type annotation: this project's
// `moduleResolution: "node"` + `exactOptionalPropertyTypes: true` combine
// with @apollo/server's dual cjs/esm builds to make ts-jest (unlike plain
// tsc, oddly enough) resolve two DIFFERENT physical `HeaderMap` class
// declarations for what is nominally "the same" type depending on which
// import graph reaches it — a dual-package-hazard quirk, not a real type
// error. Returning a structurally-inferred plain object sidesteps it
// entirely; @nestjs/apollo's `ApolloDriverConfig['plugins']` still checks
// this value structurally at the one real usage site (app.module.ts).
export function createQueryComplexityPlugin(maximumComplexity: number) {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation({
          request,
          document,
          schema,
        }: {
          request: RequestWithVariables
          document: DocumentNode
          schema: GraphQLSchema
        }) {
          const complexity = getComplexity({
            schema,
            query: document,
            // `exactOptionalPropertyTypes` treats "key present with value
            // undefined" and "key absent" as different things — the
            // library's own type isn't exactOptionalPropertyTypes-aware, so
            // omit the key entirely rather than pass `undefined` through it.
            ...(request.variables !== undefined && { variables: request.variables }),
            estimators: [paginationAwareEstimator, simpleEstimator({ defaultComplexity: 1 })],
          })

          if (complexity > maximumComplexity) {
            // A plugin-thrown error isn't auto-classified as a client error
            // the way a `validationRules` rejection is — without the
            // `extensions.http.status` override, Apollo Server 5 reports
            // this as a 500 (see errorNormalize.js's own
            // `isPartialHTTPGraphQLHead` check for exactly this mechanism),
            // which would be actively misleading for a well-formed,
            // expected rejection of an oversized request.
            throw new GraphQLError(
              `The query exceeds the maximum complexity of ${maximumComplexity}. Actual complexity is ${complexity}`,
              { extensions: { code: 'GRAPHQL_VALIDATION_FAILED', http: { status: 400 } } },
            )
          }
        },
      }
    },
  }
}
