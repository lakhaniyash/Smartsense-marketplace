import { registerEnumType } from '@nestjs/graphql'

export enum ReportExportType {
  BILLING_REPORTS = 'BILLING_REPORTS',
  REVENUE = 'REVENUE',
  ORDERS = 'ORDERS',
  INVENTORY = 'INVENTORY',
  PRODUCT_PERFORMANCE = 'PRODUCT_PERFORMANCE',
  NOTIFICATION_ACTIVITY = 'NOTIFICATION_ACTIVITY',
  CUSTOMERS = 'CUSTOMERS',
}

registerEnumType(ReportExportType, {
  name: 'ReportExportType',
  description: 'Which report exportReport should render.',
})
