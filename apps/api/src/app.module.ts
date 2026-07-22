import { join } from 'path'
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { GraphQLModule } from '@nestjs/graphql'
// `import depthLimit from 'graphql-depth-limit'` type-checks
// (allowSyntheticDefaultImports via @types/graphql-depth-limit) but throws
// `depthLimit is not a function` at runtime — this tsconfig doesn't set
// esModuleInterop, so a namespace import is what actually compiles to the
// plain `require()` this CJS module needs (identical gotcha, identical fix,
// as invoice-pdf.generator.ts's `import * as PDFDocument from 'pdfkit'`).
import * as depthLimit from 'graphql-depth-limit'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { CommonModule } from './common/common.module'
import { createQueryComplexityPlugin } from './common/graphql/query-complexity.plugin'
import { AppValidationPipe } from './common/pipes/validation.pipe'
import configuration from './config/configuration'
import { validationSchema } from './config/validation.schema'
import { HealthModule } from './health/health.module'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { BillingModule } from './modules/billing/billing.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { CustomersModule } from './modules/customers/customers.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { OrdersModule } from './modules/orders/orders.module'
import { ReportsModule } from './modules/reports/reports.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        playground: config.get<boolean>('graphql.playground') ?? false,
        introspection: config.get<boolean>('graphql.introspection') ?? true,
        debug: config.get<boolean>('graphql.debug') ?? false,
        // NestJS's `debug` above only controls dev-mode schema-build logging — Apollo
        // Server 4+ renamed the actual stacktrace-exposure setting to this field, so it
        // must be wired separately or GRAPHQL_DEBUG=false has no effect on error responses.
        includeStacktraceInErrorResponses: config.get<boolean>('graphql.debug') ?? false,
        // Query-shape hardening (v1.0 Release Readiness Audit finding F-C4,
        // docs/security.md § GraphQL Security's "launch prerequisite," never
        // shipped until now). Depth blocks a maliciously/accidentally deep
        // selection (Order → Items → ProductVariant → Product → Category →
        // parent, docs/graphql.md § 12's own example) as a `validationRules`
        // entry — a purely structural AST check with no need for this
        // request's actual variable values. Complexity blocks a
        // shallow-but-expensive query a depth limit alone can't see (many
        // aliased list fields, or one field with a huge `first` page size),
        // but — unlike depth — genuinely needs those real values (to resolve
        // `first: $someVariable`), which is exactly why it's a `plugins`
        // entry instead of also living in `validationRules`: see
        // query-complexity.plugin.ts's own comment for what went wrong on
        // the first attempt. Both limits configurable via
        // GRAPHQL_MAX_QUERY_DEPTH/GRAPHQL_MAX_QUERY_COMPLEXITY for future
        // production tuning without a code change.
        validationRules: [depthLimit(config.get<number>('graphql.maxQueryDepth') ?? 10)],
        plugins: [
          createQueryComplexityPlugin(config.get<number>('graphql.maxQueryComplexity') ?? 1000),
        ],
      }),
    }),
    // First event-driven machinery in the codebase, introduced by Orders (M13)
    // — domain events (OrderCreated, InventoryReserved, ...). M16
    // Notifications is the real consumer: see
    // modules/notifications/listeners/notification-events.listener.ts, plus
    // modules/orders/events/, modules/catalog/events/, and the 2 new
    // Billing events under modules/billing/events/.
    EventEmitterModule.forRoot(),
    CommonModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    CatalogModule,
    OrdersModule,
    BillingModule,
    NotificationsModule,
    // Registered last per docs/backend-architecture.md — Reports (M15)
    // depends on nothing beyond Prisma/Common and reads across every
    // earlier domain's tables directly (mirrors DashboardModule's own
    // precedent), so it has no ordering requirement of its own; keeping it
    // last documents that it was added most recently.
    ReportsModule,
    // Customer Management (Sprint 2, SM-320/SM-321) — not a
    // docs/milestones.md roadmap milestone. Depends on nothing beyond
    // Prisma/Common, same as Reports; registered after it for the same
    // "most recently added" reason.
    CustomersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: AppValidationPipe,
    },
  ],
})
export class AppModule {}
