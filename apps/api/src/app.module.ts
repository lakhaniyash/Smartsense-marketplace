import { join } from 'path'
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { GraphQLModule } from '@nestjs/graphql'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { CommonModule } from './common/common.module'
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
