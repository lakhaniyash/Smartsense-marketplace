/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query Me {\n  me {\n    id\n    email\n    fullName\n    roles\n    permissions\n  }\n}": typeof types.MeDocument,
    "query ExportInvoicesCsv($filter: InvoiceFilterInput) {\n  exportInvoicesCsv(filter: $filter)\n}": typeof types.ExportInvoicesCsvDocument,
    "query GetInvoiceById($id: ID!) {\n  invoice(id: $id) {\n    id\n    invoiceNumber\n    orderId\n    partnerId\n    amountDue\n    status\n    issuedAt\n    dueAt\n    createdAt\n    updatedAt\n    payments {\n      id\n      amount\n      method\n      externalTransactionId\n      status\n      processedAt\n      createdAt\n    }\n  }\n}": typeof types.GetInvoiceByIdDocument,
    "query GetInvoices($first: Int, $after: String, $filter: InvoiceFilterInput, $sort: InvoiceSortInput) {\n  invoices(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        invoiceNumber\n        partnerId\n        amountDue\n        status\n        issuedAt\n        dueAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetInvoicesDocument,
    "query InvoicePdf($id: ID!) {\n  invoicePdf(id: $id)\n}": typeof types.InvoicePdfDocument,
    "mutation RecordPayment($input: CreatePaymentInput!) {\n  recordPayment(input: $input) {\n    id\n    amount\n    status\n    invoiceId\n    externalTransactionId\n  }\n}": typeof types.RecordPaymentDocument,
    "mutation VoidInvoice($id: ID!) {\n  voidInvoice(id: $id) {\n    id\n    status\n  }\n}": typeof types.VoidInvoiceDocument,
    "mutation AdjustInventory($input: AdjustInventoryInput!) {\n  adjustInventory(input: $input) {\n    id\n    status\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n  }\n}": typeof types.AdjustInventoryDocument,
    "mutation ArchiveProduct($id: ID!) {\n  archiveProduct(id: $id) {\n    id\n    status\n  }\n}": typeof types.ArchiveProductDocument,
    "mutation ArchiveProductVariant($id: ID!) {\n  archiveProductVariant(id: $id) {\n    id\n  }\n}": typeof types.ArchiveProductVariantDocument,
    "mutation CreateProduct($input: CreateProductInput!) {\n  createProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}": typeof types.CreateProductDocument,
    "mutation CreateProductVariant($input: CreateProductVariantInput!) {\n  createProductVariant(input: $input) {\n    id\n    sku\n    price\n    status\n    isDefault\n    attributes {\n      key\n      value\n    }\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n    createdAt\n  }\n}": typeof types.CreateProductVariantDocument,
    "query GetCategories {\n  categories {\n    id\n    name\n    slug\n    parentCategoryId\n    displayOrder\n  }\n}": typeof types.GetCategoriesDocument,
    "query GetProductById($id: ID!) {\n  productById(id: $id) {\n    id\n    title\n    description\n    brand\n    sku\n    status\n    category {\n      id\n      name\n      slug\n    }\n    variants {\n      id\n      sku\n      price\n      status\n      isDefault\n      attributes {\n        key\n        value\n      }\n      inventory {\n        quantityOnHand\n        quantityReserved\n        sellableQuantity\n        reorderThreshold\n        updatedAt\n      }\n      createdAt\n    }\n    createdAt\n    publishedAt\n  }\n}": typeof types.GetProductByIdDocument,
    "query GetProducts($first: Int, $after: String, $filter: ProductFilterInput, $sort: ProductSortInput) {\n  products(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        title\n        sku\n        status\n        category {\n          id\n          name\n        }\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetProductsDocument,
    "mutation SetDefaultProductVariant($id: ID!) {\n  setDefaultProductVariant(id: $id) {\n    id\n    isDefault\n  }\n}": typeof types.SetDefaultProductVariantDocument,
    "mutation UpdateProduct($input: UpdateProductInput!) {\n  updateProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}": typeof types.UpdateProductDocument,
    "mutation UpdateProductVariant($input: UpdateProductVariantInput!) {\n  updateProductVariant(input: $input) {\n    id\n    sku\n    price\n    status\n    isDefault\n    attributes {\n      key\n      value\n    }\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n    createdAt\n  }\n}": typeof types.UpdateProductVariantDocument,
    "mutation ActivateCustomer($id: ID!) {\n  activateCustomer(id: $id) {\n    id\n    status\n  }\n}": typeof types.ActivateCustomerDocument,
    "mutation AddCustomerAddress($input: AddCustomerAddressInput!) {\n  addCustomerAddress(input: $input) {\n    id\n  }\n}": typeof types.AddCustomerAddressDocument,
    "mutation ArchiveCustomer($id: ID!) {\n  archiveCustomer(id: $id) {\n    id\n    status\n  }\n}": typeof types.ArchiveCustomerDocument,
    "mutation CreateCustomer($input: CreateCustomerInput!) {\n  createCustomer(input: $input) {\n    id\n  }\n}": typeof types.CreateCustomerDocument,
    "mutation DeactivateCustomerAddress($id: ID!) {\n  deactivateCustomerAddress(id: $id) {\n    id\n  }\n}": typeof types.DeactivateCustomerAddressDocument,
    "query ExportCustomersCsv($filter: CustomerFilterInput) {\n  exportCustomersCsv(filter: $filter)\n}": typeof types.ExportCustomersCsvDocument,
    "query GetCustomerAuditLog($customerId: ID!) {\n  customerAuditLog(customerId: $customerId) {\n    id\n    action\n    entityType\n    entityId\n    metadata\n    occurredAt\n    actorId\n    actorName\n    actorEmail\n  }\n}": typeof types.GetCustomerAuditLogDocument,
    "query GetCustomerById($id: ID!) {\n  customerById(id: $id) {\n    id\n    displayName\n    type\n    status\n    billingEmail\n    createdAt\n    updatedAt\n    addresses {\n      id\n      type\n      line1\n      line2\n      city\n      state\n      postalCode\n      country\n      isDefault\n    }\n    assignedUsers {\n      id\n      email\n      fullName\n      status\n    }\n    billingSummary {\n      totalOrders\n      totalInvoiced\n      totalOutstanding\n    }\n  }\n}": typeof types.GetCustomerByIdDocument,
    "query GetCustomerOrders($customerId: ID!, $first: Int, $after: String) {\n  orders(first: $first, after: $after, filter: {customerId: $customerId}) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        total\n        placedAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetCustomerOrdersDocument,
    "query GetCustomers($first: Int, $after: String, $filter: CustomerFilterInput, $sort: CustomerSortInput) {\n  customers(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        displayName\n        type\n        status\n        billingEmail\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetCustomersDocument,
    "mutation UpdateCustomer($input: UpdateCustomerInput!) {\n  updateCustomer(input: $input) {\n    id\n  }\n}": typeof types.UpdateCustomerDocument,
    "mutation UpdateCustomerAddress($input: UpdateCustomerAddressInput!) {\n  updateCustomerAddress(input: $input) {\n    id\n  }\n}": typeof types.UpdateCustomerAddressDocument,
    "query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}": typeof types.DashboardStatsDocument,
    "query GetNotifications($first: Int, $after: String, $filter: NotificationFilterInput) {\n  notifications(first: $first, after: $after, filter: $filter) {\n    edges {\n      cursor\n      node {\n        id\n        type\n        title\n        body\n        entityType\n        entityId\n        status\n        readAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetNotificationsDocument,
    "query GetUnreadNotificationCount {\n  unreadNotificationCount\n}": typeof types.GetUnreadNotificationCountDocument,
    "mutation MarkAllNotificationsRead {\n  markAllNotificationsRead\n}": typeof types.MarkAllNotificationsReadDocument,
    "mutation MarkNotificationRead($id: ID!) {\n  markNotificationRead(id: $id) {\n    id\n    status\n    readAt\n  }\n}": typeof types.MarkNotificationReadDocument,
    "mutation CancelOrder($id: ID!, $reason: String) {\n  cancelOrder(id: $id, reason: $reason) {\n    id\n    status\n  }\n}": typeof types.CancelOrderDocument,
    "mutation CreateOrder($input: CreateOrderInput!) {\n  createOrder(input: $input) {\n    id\n    orderNumber\n    status\n  }\n}": typeof types.CreateOrderDocument,
    "query GetOrderById($id: ID!) {\n  order(id: $id) {\n    id\n    orderNumber\n    status\n    customerId\n    partnerId\n    shippingAddressId\n    subtotal\n    tax\n    shippingCost\n    total\n    placedAt\n    createdAt\n    updatedAt\n    items {\n      id\n      productVariantId\n      quantity\n      unitPriceSnapshot\n      lineTotal\n      productVariant {\n        id\n        sku\n        attributes {\n          key\n          value\n        }\n      }\n    }\n    statusHistory {\n      id\n      fromStatus\n      toStatus\n      changedByUserId\n      reason\n      createdAt\n    }\n  }\n}": typeof types.GetOrderByIdDocument,
    "query GetOrderableVariants($search: String) {\n  products(first: 50, filter: {status: PUBLISHED, search: $search}) {\n    edges {\n      node {\n        id\n        title\n        variants {\n          id\n          sku\n          price\n          status\n        }\n      }\n    }\n  }\n}": typeof types.GetOrderableVariantsDocument,
    "query GetOrders($first: Int, $after: String, $filter: OrderFilterInput, $sort: OrderSortInput) {\n  orders(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        customerId\n        partnerId\n        subtotal\n        total\n        placedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetOrdersDocument,
    "mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}": typeof types.UpdateOrderStatusDocument,
    "query ExportReport($input: ExportReportInput!) {\n  exportReport(input: $input)\n}": typeof types.ExportReportDocument,
    "mutation FinalizeBillingReport($id: ID!) {\n  finalizeBillingReport(id: $id) {\n    id\n    status\n    updatedAt\n  }\n}": typeof types.FinalizeBillingReportDocument,
    "mutation GenerateBillingReport($input: GenerateBillingReportInput!) {\n  generateBillingReport(input: $input) {\n    id\n    partnerId\n    periodStart\n    periodEnd\n    status\n    grossRevenue\n    commissionAmount\n    netPayout\n    generatedAt\n    createdAt\n    updatedAt\n  }\n}": typeof types.GenerateBillingReportDocument,
    "query GetBillingReport($id: ID!) {\n  billingReport(id: $id) {\n    id\n    partnerId\n    periodStart\n    periodEnd\n    status\n    grossRevenue\n    commissionAmount\n    netPayout\n    generatedAt\n    createdAt\n    updatedAt\n  }\n}": typeof types.GetBillingReportDocument,
    "query GetBillingReports($first: Int, $after: String, $filter: BillingReportFilterInput, $sort: BillingReportSortInput) {\n  billingReports(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        partnerId\n        periodStart\n        periodEnd\n        status\n        grossRevenue\n        commissionAmount\n        netPayout\n        generatedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetBillingReportsDocument,
    "query GetCustomersReport($filter: CustomersReportFilterInput) {\n  customersReport(filter: $filter) {\n    totalCustomers\n    statusBreakdown {\n      status\n      count\n    }\n    typeBreakdown {\n      type\n      count\n    }\n  }\n}": typeof types.GetCustomersReportDocument,
    "query GetInventoryReport($first: Int, $after: String, $filter: InventoryReportFilterInput) {\n  inventoryReport(first: $first, after: $after, filter: $filter) {\n    totalVariants\n    totalOnHand\n    totalReserved\n    lowStockCount\n    lowStockItems {\n      edges {\n        cursor\n        node {\n          productVariantId\n          productTitle\n          sku\n          partnerId\n          quantityOnHand\n          quantityReserved\n          reorderThreshold\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n}": typeof types.GetInventoryReportDocument,
    "query GetNotificationActivityReport($filter: NotificationActivityReportFilterInput) {\n  notificationActivityReport(filter: $filter) {\n    totalNotifications\n    readCount\n    unreadCount\n    typeBreakdown {\n      type\n      count\n    }\n  }\n}": typeof types.GetNotificationActivityReportDocument,
    "query GetOrdersReport($filter: OrdersReportFilterInput) {\n  ordersReport(filter: $filter) {\n    totalOrders\n    totalRevenue\n    averageOrderValue\n    statusBreakdown {\n      status\n      count\n    }\n  }\n}": typeof types.GetOrdersReportDocument,
    "query GetProductPerformanceReport($first: Int, $after: String, $filter: ProductPerformanceFilterInput, $sort: ProductPerformanceSortInput) {\n  productPerformanceReport(\n    first: $first\n    after: $after\n    filter: $filter\n    sort: $sort\n  ) {\n    edges {\n      cursor\n      node {\n        productVariantId\n        productTitle\n        sku\n        partnerId\n        unitsSold\n        revenue\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetProductPerformanceReportDocument,
    "query GetReportsDashboard($filter: ReportsDashboardFilterInput) {\n  reportsDashboard(filter: $filter) {\n    grossRevenue\n    ordersRevenue\n    totalOrders\n    lowStockCount\n    revenueTrend {\n      bucketStart\n      bucketEnd\n      grossRevenue\n      invoiceCount\n    }\n  }\n}": typeof types.GetReportsDashboardDocument,
    "query GetRevenueReport($filter: RevenueReportFilterInput) {\n  revenueReport(filter: $filter) {\n    invoiceCount\n    totalCommission\n    totalGrossRevenue\n    totalNetPayout\n    trend {\n      bucketStart\n      bucketEnd\n      grossRevenue\n      invoiceCount\n    }\n  }\n}": typeof types.GetRevenueReportDocument,
    "mutation MarkBillingReportPaidOut($id: ID!) {\n  markBillingReportPaidOut(id: $id) {\n    id\n    status\n    updatedAt\n  }\n}": typeof types.MarkBillingReportPaidOutDocument,
    "query GetUsers($first: Int, $after: String, $filter: UserFilterInput, $sort: UserSortInput) {\n  users(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        fullName\n        email\n        status\n        ownerType\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetUsersDocument,
};
const documents: Documents = {
    "query Me {\n  me {\n    id\n    email\n    fullName\n    roles\n    permissions\n  }\n}": types.MeDocument,
    "query ExportInvoicesCsv($filter: InvoiceFilterInput) {\n  exportInvoicesCsv(filter: $filter)\n}": types.ExportInvoicesCsvDocument,
    "query GetInvoiceById($id: ID!) {\n  invoice(id: $id) {\n    id\n    invoiceNumber\n    orderId\n    partnerId\n    amountDue\n    status\n    issuedAt\n    dueAt\n    createdAt\n    updatedAt\n    payments {\n      id\n      amount\n      method\n      externalTransactionId\n      status\n      processedAt\n      createdAt\n    }\n  }\n}": types.GetInvoiceByIdDocument,
    "query GetInvoices($first: Int, $after: String, $filter: InvoiceFilterInput, $sort: InvoiceSortInput) {\n  invoices(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        invoiceNumber\n        partnerId\n        amountDue\n        status\n        issuedAt\n        dueAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetInvoicesDocument,
    "query InvoicePdf($id: ID!) {\n  invoicePdf(id: $id)\n}": types.InvoicePdfDocument,
    "mutation RecordPayment($input: CreatePaymentInput!) {\n  recordPayment(input: $input) {\n    id\n    amount\n    status\n    invoiceId\n    externalTransactionId\n  }\n}": types.RecordPaymentDocument,
    "mutation VoidInvoice($id: ID!) {\n  voidInvoice(id: $id) {\n    id\n    status\n  }\n}": types.VoidInvoiceDocument,
    "mutation AdjustInventory($input: AdjustInventoryInput!) {\n  adjustInventory(input: $input) {\n    id\n    status\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n  }\n}": types.AdjustInventoryDocument,
    "mutation ArchiveProduct($id: ID!) {\n  archiveProduct(id: $id) {\n    id\n    status\n  }\n}": types.ArchiveProductDocument,
    "mutation ArchiveProductVariant($id: ID!) {\n  archiveProductVariant(id: $id) {\n    id\n  }\n}": types.ArchiveProductVariantDocument,
    "mutation CreateProduct($input: CreateProductInput!) {\n  createProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}": types.CreateProductDocument,
    "mutation CreateProductVariant($input: CreateProductVariantInput!) {\n  createProductVariant(input: $input) {\n    id\n    sku\n    price\n    status\n    isDefault\n    attributes {\n      key\n      value\n    }\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n    createdAt\n  }\n}": types.CreateProductVariantDocument,
    "query GetCategories {\n  categories {\n    id\n    name\n    slug\n    parentCategoryId\n    displayOrder\n  }\n}": types.GetCategoriesDocument,
    "query GetProductById($id: ID!) {\n  productById(id: $id) {\n    id\n    title\n    description\n    brand\n    sku\n    status\n    category {\n      id\n      name\n      slug\n    }\n    variants {\n      id\n      sku\n      price\n      status\n      isDefault\n      attributes {\n        key\n        value\n      }\n      inventory {\n        quantityOnHand\n        quantityReserved\n        sellableQuantity\n        reorderThreshold\n        updatedAt\n      }\n      createdAt\n    }\n    createdAt\n    publishedAt\n  }\n}": types.GetProductByIdDocument,
    "query GetProducts($first: Int, $after: String, $filter: ProductFilterInput, $sort: ProductSortInput) {\n  products(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        title\n        sku\n        status\n        category {\n          id\n          name\n        }\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetProductsDocument,
    "mutation SetDefaultProductVariant($id: ID!) {\n  setDefaultProductVariant(id: $id) {\n    id\n    isDefault\n  }\n}": types.SetDefaultProductVariantDocument,
    "mutation UpdateProduct($input: UpdateProductInput!) {\n  updateProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}": types.UpdateProductDocument,
    "mutation UpdateProductVariant($input: UpdateProductVariantInput!) {\n  updateProductVariant(input: $input) {\n    id\n    sku\n    price\n    status\n    isDefault\n    attributes {\n      key\n      value\n    }\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n    createdAt\n  }\n}": types.UpdateProductVariantDocument,
    "mutation ActivateCustomer($id: ID!) {\n  activateCustomer(id: $id) {\n    id\n    status\n  }\n}": types.ActivateCustomerDocument,
    "mutation AddCustomerAddress($input: AddCustomerAddressInput!) {\n  addCustomerAddress(input: $input) {\n    id\n  }\n}": types.AddCustomerAddressDocument,
    "mutation ArchiveCustomer($id: ID!) {\n  archiveCustomer(id: $id) {\n    id\n    status\n  }\n}": types.ArchiveCustomerDocument,
    "mutation CreateCustomer($input: CreateCustomerInput!) {\n  createCustomer(input: $input) {\n    id\n  }\n}": types.CreateCustomerDocument,
    "mutation DeactivateCustomerAddress($id: ID!) {\n  deactivateCustomerAddress(id: $id) {\n    id\n  }\n}": types.DeactivateCustomerAddressDocument,
    "query ExportCustomersCsv($filter: CustomerFilterInput) {\n  exportCustomersCsv(filter: $filter)\n}": types.ExportCustomersCsvDocument,
    "query GetCustomerAuditLog($customerId: ID!) {\n  customerAuditLog(customerId: $customerId) {\n    id\n    action\n    entityType\n    entityId\n    metadata\n    occurredAt\n    actorId\n    actorName\n    actorEmail\n  }\n}": types.GetCustomerAuditLogDocument,
    "query GetCustomerById($id: ID!) {\n  customerById(id: $id) {\n    id\n    displayName\n    type\n    status\n    billingEmail\n    createdAt\n    updatedAt\n    addresses {\n      id\n      type\n      line1\n      line2\n      city\n      state\n      postalCode\n      country\n      isDefault\n    }\n    assignedUsers {\n      id\n      email\n      fullName\n      status\n    }\n    billingSummary {\n      totalOrders\n      totalInvoiced\n      totalOutstanding\n    }\n  }\n}": types.GetCustomerByIdDocument,
    "query GetCustomerOrders($customerId: ID!, $first: Int, $after: String) {\n  orders(first: $first, after: $after, filter: {customerId: $customerId}) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        total\n        placedAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetCustomerOrdersDocument,
    "query GetCustomers($first: Int, $after: String, $filter: CustomerFilterInput, $sort: CustomerSortInput) {\n  customers(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        displayName\n        type\n        status\n        billingEmail\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetCustomersDocument,
    "mutation UpdateCustomer($input: UpdateCustomerInput!) {\n  updateCustomer(input: $input) {\n    id\n  }\n}": types.UpdateCustomerDocument,
    "mutation UpdateCustomerAddress($input: UpdateCustomerAddressInput!) {\n  updateCustomerAddress(input: $input) {\n    id\n  }\n}": types.UpdateCustomerAddressDocument,
    "query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}": types.DashboardStatsDocument,
    "query GetNotifications($first: Int, $after: String, $filter: NotificationFilterInput) {\n  notifications(first: $first, after: $after, filter: $filter) {\n    edges {\n      cursor\n      node {\n        id\n        type\n        title\n        body\n        entityType\n        entityId\n        status\n        readAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetNotificationsDocument,
    "query GetUnreadNotificationCount {\n  unreadNotificationCount\n}": types.GetUnreadNotificationCountDocument,
    "mutation MarkAllNotificationsRead {\n  markAllNotificationsRead\n}": types.MarkAllNotificationsReadDocument,
    "mutation MarkNotificationRead($id: ID!) {\n  markNotificationRead(id: $id) {\n    id\n    status\n    readAt\n  }\n}": types.MarkNotificationReadDocument,
    "mutation CancelOrder($id: ID!, $reason: String) {\n  cancelOrder(id: $id, reason: $reason) {\n    id\n    status\n  }\n}": types.CancelOrderDocument,
    "mutation CreateOrder($input: CreateOrderInput!) {\n  createOrder(input: $input) {\n    id\n    orderNumber\n    status\n  }\n}": types.CreateOrderDocument,
    "query GetOrderById($id: ID!) {\n  order(id: $id) {\n    id\n    orderNumber\n    status\n    customerId\n    partnerId\n    shippingAddressId\n    subtotal\n    tax\n    shippingCost\n    total\n    placedAt\n    createdAt\n    updatedAt\n    items {\n      id\n      productVariantId\n      quantity\n      unitPriceSnapshot\n      lineTotal\n      productVariant {\n        id\n        sku\n        attributes {\n          key\n          value\n        }\n      }\n    }\n    statusHistory {\n      id\n      fromStatus\n      toStatus\n      changedByUserId\n      reason\n      createdAt\n    }\n  }\n}": types.GetOrderByIdDocument,
    "query GetOrderableVariants($search: String) {\n  products(first: 50, filter: {status: PUBLISHED, search: $search}) {\n    edges {\n      node {\n        id\n        title\n        variants {\n          id\n          sku\n          price\n          status\n        }\n      }\n    }\n  }\n}": types.GetOrderableVariantsDocument,
    "query GetOrders($first: Int, $after: String, $filter: OrderFilterInput, $sort: OrderSortInput) {\n  orders(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        customerId\n        partnerId\n        subtotal\n        total\n        placedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetOrdersDocument,
    "mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}": types.UpdateOrderStatusDocument,
    "query ExportReport($input: ExportReportInput!) {\n  exportReport(input: $input)\n}": types.ExportReportDocument,
    "mutation FinalizeBillingReport($id: ID!) {\n  finalizeBillingReport(id: $id) {\n    id\n    status\n    updatedAt\n  }\n}": types.FinalizeBillingReportDocument,
    "mutation GenerateBillingReport($input: GenerateBillingReportInput!) {\n  generateBillingReport(input: $input) {\n    id\n    partnerId\n    periodStart\n    periodEnd\n    status\n    grossRevenue\n    commissionAmount\n    netPayout\n    generatedAt\n    createdAt\n    updatedAt\n  }\n}": types.GenerateBillingReportDocument,
    "query GetBillingReport($id: ID!) {\n  billingReport(id: $id) {\n    id\n    partnerId\n    periodStart\n    periodEnd\n    status\n    grossRevenue\n    commissionAmount\n    netPayout\n    generatedAt\n    createdAt\n    updatedAt\n  }\n}": types.GetBillingReportDocument,
    "query GetBillingReports($first: Int, $after: String, $filter: BillingReportFilterInput, $sort: BillingReportSortInput) {\n  billingReports(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        partnerId\n        periodStart\n        periodEnd\n        status\n        grossRevenue\n        commissionAmount\n        netPayout\n        generatedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetBillingReportsDocument,
    "query GetCustomersReport($filter: CustomersReportFilterInput) {\n  customersReport(filter: $filter) {\n    totalCustomers\n    statusBreakdown {\n      status\n      count\n    }\n    typeBreakdown {\n      type\n      count\n    }\n  }\n}": types.GetCustomersReportDocument,
    "query GetInventoryReport($first: Int, $after: String, $filter: InventoryReportFilterInput) {\n  inventoryReport(first: $first, after: $after, filter: $filter) {\n    totalVariants\n    totalOnHand\n    totalReserved\n    lowStockCount\n    lowStockItems {\n      edges {\n        cursor\n        node {\n          productVariantId\n          productTitle\n          sku\n          partnerId\n          quantityOnHand\n          quantityReserved\n          reorderThreshold\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n}": types.GetInventoryReportDocument,
    "query GetNotificationActivityReport($filter: NotificationActivityReportFilterInput) {\n  notificationActivityReport(filter: $filter) {\n    totalNotifications\n    readCount\n    unreadCount\n    typeBreakdown {\n      type\n      count\n    }\n  }\n}": types.GetNotificationActivityReportDocument,
    "query GetOrdersReport($filter: OrdersReportFilterInput) {\n  ordersReport(filter: $filter) {\n    totalOrders\n    totalRevenue\n    averageOrderValue\n    statusBreakdown {\n      status\n      count\n    }\n  }\n}": types.GetOrdersReportDocument,
    "query GetProductPerformanceReport($first: Int, $after: String, $filter: ProductPerformanceFilterInput, $sort: ProductPerformanceSortInput) {\n  productPerformanceReport(\n    first: $first\n    after: $after\n    filter: $filter\n    sort: $sort\n  ) {\n    edges {\n      cursor\n      node {\n        productVariantId\n        productTitle\n        sku\n        partnerId\n        unitsSold\n        revenue\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetProductPerformanceReportDocument,
    "query GetReportsDashboard($filter: ReportsDashboardFilterInput) {\n  reportsDashboard(filter: $filter) {\n    grossRevenue\n    ordersRevenue\n    totalOrders\n    lowStockCount\n    revenueTrend {\n      bucketStart\n      bucketEnd\n      grossRevenue\n      invoiceCount\n    }\n  }\n}": types.GetReportsDashboardDocument,
    "query GetRevenueReport($filter: RevenueReportFilterInput) {\n  revenueReport(filter: $filter) {\n    invoiceCount\n    totalCommission\n    totalGrossRevenue\n    totalNetPayout\n    trend {\n      bucketStart\n      bucketEnd\n      grossRevenue\n      invoiceCount\n    }\n  }\n}": types.GetRevenueReportDocument,
    "mutation MarkBillingReportPaidOut($id: ID!) {\n  markBillingReportPaidOut(id: $id) {\n    id\n    status\n    updatedAt\n  }\n}": types.MarkBillingReportPaidOutDocument,
    "query GetUsers($first: Int, $after: String, $filter: UserFilterInput, $sort: UserSortInput) {\n  users(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        fullName\n        email\n        status\n        ownerType\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetUsersDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query Me {\n  me {\n    id\n    email\n    fullName\n    roles\n    permissions\n  }\n}"): (typeof documents)["query Me {\n  me {\n    id\n    email\n    fullName\n    roles\n    permissions\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query ExportInvoicesCsv($filter: InvoiceFilterInput) {\n  exportInvoicesCsv(filter: $filter)\n}"): (typeof documents)["query ExportInvoicesCsv($filter: InvoiceFilterInput) {\n  exportInvoicesCsv(filter: $filter)\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetInvoiceById($id: ID!) {\n  invoice(id: $id) {\n    id\n    invoiceNumber\n    orderId\n    partnerId\n    amountDue\n    status\n    issuedAt\n    dueAt\n    createdAt\n    updatedAt\n    payments {\n      id\n      amount\n      method\n      externalTransactionId\n      status\n      processedAt\n      createdAt\n    }\n  }\n}"): (typeof documents)["query GetInvoiceById($id: ID!) {\n  invoice(id: $id) {\n    id\n    invoiceNumber\n    orderId\n    partnerId\n    amountDue\n    status\n    issuedAt\n    dueAt\n    createdAt\n    updatedAt\n    payments {\n      id\n      amount\n      method\n      externalTransactionId\n      status\n      processedAt\n      createdAt\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetInvoices($first: Int, $after: String, $filter: InvoiceFilterInput, $sort: InvoiceSortInput) {\n  invoices(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        invoiceNumber\n        partnerId\n        amountDue\n        status\n        issuedAt\n        dueAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetInvoices($first: Int, $after: String, $filter: InvoiceFilterInput, $sort: InvoiceSortInput) {\n  invoices(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        invoiceNumber\n        partnerId\n        amountDue\n        status\n        issuedAt\n        dueAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query InvoicePdf($id: ID!) {\n  invoicePdf(id: $id)\n}"): (typeof documents)["query InvoicePdf($id: ID!) {\n  invoicePdf(id: $id)\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation RecordPayment($input: CreatePaymentInput!) {\n  recordPayment(input: $input) {\n    id\n    amount\n    status\n    invoiceId\n    externalTransactionId\n  }\n}"): (typeof documents)["mutation RecordPayment($input: CreatePaymentInput!) {\n  recordPayment(input: $input) {\n    id\n    amount\n    status\n    invoiceId\n    externalTransactionId\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation VoidInvoice($id: ID!) {\n  voidInvoice(id: $id) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation VoidInvoice($id: ID!) {\n  voidInvoice(id: $id) {\n    id\n    status\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation AdjustInventory($input: AdjustInventoryInput!) {\n  adjustInventory(input: $input) {\n    id\n    status\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n  }\n}"): (typeof documents)["mutation AdjustInventory($input: AdjustInventoryInput!) {\n  adjustInventory(input: $input) {\n    id\n    status\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation ArchiveProduct($id: ID!) {\n  archiveProduct(id: $id) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation ArchiveProduct($id: ID!) {\n  archiveProduct(id: $id) {\n    id\n    status\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation ArchiveProductVariant($id: ID!) {\n  archiveProductVariant(id: $id) {\n    id\n  }\n}"): (typeof documents)["mutation ArchiveProductVariant($id: ID!) {\n  archiveProductVariant(id: $id) {\n    id\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation CreateProduct($input: CreateProductInput!) {\n  createProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["mutation CreateProduct($input: CreateProductInput!) {\n  createProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation CreateProductVariant($input: CreateProductVariantInput!) {\n  createProductVariant(input: $input) {\n    id\n    sku\n    price\n    status\n    isDefault\n    attributes {\n      key\n      value\n    }\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n    createdAt\n  }\n}"): (typeof documents)["mutation CreateProductVariant($input: CreateProductVariantInput!) {\n  createProductVariant(input: $input) {\n    id\n    sku\n    price\n    status\n    isDefault\n    attributes {\n      key\n      value\n    }\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n    createdAt\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetCategories {\n  categories {\n    id\n    name\n    slug\n    parentCategoryId\n    displayOrder\n  }\n}"): (typeof documents)["query GetCategories {\n  categories {\n    id\n    name\n    slug\n    parentCategoryId\n    displayOrder\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetProductById($id: ID!) {\n  productById(id: $id) {\n    id\n    title\n    description\n    brand\n    sku\n    status\n    category {\n      id\n      name\n      slug\n    }\n    variants {\n      id\n      sku\n      price\n      status\n      isDefault\n      attributes {\n        key\n        value\n      }\n      inventory {\n        quantityOnHand\n        quantityReserved\n        sellableQuantity\n        reorderThreshold\n        updatedAt\n      }\n      createdAt\n    }\n    createdAt\n    publishedAt\n  }\n}"): (typeof documents)["query GetProductById($id: ID!) {\n  productById(id: $id) {\n    id\n    title\n    description\n    brand\n    sku\n    status\n    category {\n      id\n      name\n      slug\n    }\n    variants {\n      id\n      sku\n      price\n      status\n      isDefault\n      attributes {\n        key\n        value\n      }\n      inventory {\n        quantityOnHand\n        quantityReserved\n        sellableQuantity\n        reorderThreshold\n        updatedAt\n      }\n      createdAt\n    }\n    createdAt\n    publishedAt\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetProducts($first: Int, $after: String, $filter: ProductFilterInput, $sort: ProductSortInput) {\n  products(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        title\n        sku\n        status\n        category {\n          id\n          name\n        }\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetProducts($first: Int, $after: String, $filter: ProductFilterInput, $sort: ProductSortInput) {\n  products(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        title\n        sku\n        status\n        category {\n          id\n          name\n        }\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation SetDefaultProductVariant($id: ID!) {\n  setDefaultProductVariant(id: $id) {\n    id\n    isDefault\n  }\n}"): (typeof documents)["mutation SetDefaultProductVariant($id: ID!) {\n  setDefaultProductVariant(id: $id) {\n    id\n    isDefault\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation UpdateProduct($input: UpdateProductInput!) {\n  updateProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["mutation UpdateProduct($input: UpdateProductInput!) {\n  updateProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation UpdateProductVariant($input: UpdateProductVariantInput!) {\n  updateProductVariant(input: $input) {\n    id\n    sku\n    price\n    status\n    isDefault\n    attributes {\n      key\n      value\n    }\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n    createdAt\n  }\n}"): (typeof documents)["mutation UpdateProductVariant($input: UpdateProductVariantInput!) {\n  updateProductVariant(input: $input) {\n    id\n    sku\n    price\n    status\n    isDefault\n    attributes {\n      key\n      value\n    }\n    inventory {\n      quantityOnHand\n      quantityReserved\n      sellableQuantity\n      reorderThreshold\n      updatedAt\n    }\n    createdAt\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation ActivateCustomer($id: ID!) {\n  activateCustomer(id: $id) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation ActivateCustomer($id: ID!) {\n  activateCustomer(id: $id) {\n    id\n    status\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation AddCustomerAddress($input: AddCustomerAddressInput!) {\n  addCustomerAddress(input: $input) {\n    id\n  }\n}"): (typeof documents)["mutation AddCustomerAddress($input: AddCustomerAddressInput!) {\n  addCustomerAddress(input: $input) {\n    id\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation ArchiveCustomer($id: ID!) {\n  archiveCustomer(id: $id) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation ArchiveCustomer($id: ID!) {\n  archiveCustomer(id: $id) {\n    id\n    status\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation CreateCustomer($input: CreateCustomerInput!) {\n  createCustomer(input: $input) {\n    id\n  }\n}"): (typeof documents)["mutation CreateCustomer($input: CreateCustomerInput!) {\n  createCustomer(input: $input) {\n    id\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation DeactivateCustomerAddress($id: ID!) {\n  deactivateCustomerAddress(id: $id) {\n    id\n  }\n}"): (typeof documents)["mutation DeactivateCustomerAddress($id: ID!) {\n  deactivateCustomerAddress(id: $id) {\n    id\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query ExportCustomersCsv($filter: CustomerFilterInput) {\n  exportCustomersCsv(filter: $filter)\n}"): (typeof documents)["query ExportCustomersCsv($filter: CustomerFilterInput) {\n  exportCustomersCsv(filter: $filter)\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetCustomerAuditLog($customerId: ID!) {\n  customerAuditLog(customerId: $customerId) {\n    id\n    action\n    entityType\n    entityId\n    metadata\n    occurredAt\n    actorId\n    actorName\n    actorEmail\n  }\n}"): (typeof documents)["query GetCustomerAuditLog($customerId: ID!) {\n  customerAuditLog(customerId: $customerId) {\n    id\n    action\n    entityType\n    entityId\n    metadata\n    occurredAt\n    actorId\n    actorName\n    actorEmail\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetCustomerById($id: ID!) {\n  customerById(id: $id) {\n    id\n    displayName\n    type\n    status\n    billingEmail\n    createdAt\n    updatedAt\n    addresses {\n      id\n      type\n      line1\n      line2\n      city\n      state\n      postalCode\n      country\n      isDefault\n    }\n    assignedUsers {\n      id\n      email\n      fullName\n      status\n    }\n    billingSummary {\n      totalOrders\n      totalInvoiced\n      totalOutstanding\n    }\n  }\n}"): (typeof documents)["query GetCustomerById($id: ID!) {\n  customerById(id: $id) {\n    id\n    displayName\n    type\n    status\n    billingEmail\n    createdAt\n    updatedAt\n    addresses {\n      id\n      type\n      line1\n      line2\n      city\n      state\n      postalCode\n      country\n      isDefault\n    }\n    assignedUsers {\n      id\n      email\n      fullName\n      status\n    }\n    billingSummary {\n      totalOrders\n      totalInvoiced\n      totalOutstanding\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetCustomerOrders($customerId: ID!, $first: Int, $after: String) {\n  orders(first: $first, after: $after, filter: {customerId: $customerId}) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        total\n        placedAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetCustomerOrders($customerId: ID!, $first: Int, $after: String) {\n  orders(first: $first, after: $after, filter: {customerId: $customerId}) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        total\n        placedAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetCustomers($first: Int, $after: String, $filter: CustomerFilterInput, $sort: CustomerSortInput) {\n  customers(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        displayName\n        type\n        status\n        billingEmail\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetCustomers($first: Int, $after: String, $filter: CustomerFilterInput, $sort: CustomerSortInput) {\n  customers(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        displayName\n        type\n        status\n        billingEmail\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation UpdateCustomer($input: UpdateCustomerInput!) {\n  updateCustomer(input: $input) {\n    id\n  }\n}"): (typeof documents)["mutation UpdateCustomer($input: UpdateCustomerInput!) {\n  updateCustomer(input: $input) {\n    id\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation UpdateCustomerAddress($input: UpdateCustomerAddressInput!) {\n  updateCustomerAddress(input: $input) {\n    id\n  }\n}"): (typeof documents)["mutation UpdateCustomerAddress($input: UpdateCustomerAddressInput!) {\n  updateCustomerAddress(input: $input) {\n    id\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}"): (typeof documents)["query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetNotifications($first: Int, $after: String, $filter: NotificationFilterInput) {\n  notifications(first: $first, after: $after, filter: $filter) {\n    edges {\n      cursor\n      node {\n        id\n        type\n        title\n        body\n        entityType\n        entityId\n        status\n        readAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetNotifications($first: Int, $after: String, $filter: NotificationFilterInput) {\n  notifications(first: $first, after: $after, filter: $filter) {\n    edges {\n      cursor\n      node {\n        id\n        type\n        title\n        body\n        entityType\n        entityId\n        status\n        readAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetUnreadNotificationCount {\n  unreadNotificationCount\n}"): (typeof documents)["query GetUnreadNotificationCount {\n  unreadNotificationCount\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation MarkAllNotificationsRead {\n  markAllNotificationsRead\n}"): (typeof documents)["mutation MarkAllNotificationsRead {\n  markAllNotificationsRead\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation MarkNotificationRead($id: ID!) {\n  markNotificationRead(id: $id) {\n    id\n    status\n    readAt\n  }\n}"): (typeof documents)["mutation MarkNotificationRead($id: ID!) {\n  markNotificationRead(id: $id) {\n    id\n    status\n    readAt\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation CancelOrder($id: ID!, $reason: String) {\n  cancelOrder(id: $id, reason: $reason) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation CancelOrder($id: ID!, $reason: String) {\n  cancelOrder(id: $id, reason: $reason) {\n    id\n    status\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation CreateOrder($input: CreateOrderInput!) {\n  createOrder(input: $input) {\n    id\n    orderNumber\n    status\n  }\n}"): (typeof documents)["mutation CreateOrder($input: CreateOrderInput!) {\n  createOrder(input: $input) {\n    id\n    orderNumber\n    status\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetOrderById($id: ID!) {\n  order(id: $id) {\n    id\n    orderNumber\n    status\n    customerId\n    partnerId\n    shippingAddressId\n    subtotal\n    tax\n    shippingCost\n    total\n    placedAt\n    createdAt\n    updatedAt\n    items {\n      id\n      productVariantId\n      quantity\n      unitPriceSnapshot\n      lineTotal\n      productVariant {\n        id\n        sku\n        attributes {\n          key\n          value\n        }\n      }\n    }\n    statusHistory {\n      id\n      fromStatus\n      toStatus\n      changedByUserId\n      reason\n      createdAt\n    }\n  }\n}"): (typeof documents)["query GetOrderById($id: ID!) {\n  order(id: $id) {\n    id\n    orderNumber\n    status\n    customerId\n    partnerId\n    shippingAddressId\n    subtotal\n    tax\n    shippingCost\n    total\n    placedAt\n    createdAt\n    updatedAt\n    items {\n      id\n      productVariantId\n      quantity\n      unitPriceSnapshot\n      lineTotal\n      productVariant {\n        id\n        sku\n        attributes {\n          key\n          value\n        }\n      }\n    }\n    statusHistory {\n      id\n      fromStatus\n      toStatus\n      changedByUserId\n      reason\n      createdAt\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetOrderableVariants($search: String) {\n  products(first: 50, filter: {status: PUBLISHED, search: $search}) {\n    edges {\n      node {\n        id\n        title\n        variants {\n          id\n          sku\n          price\n          status\n        }\n      }\n    }\n  }\n}"): (typeof documents)["query GetOrderableVariants($search: String) {\n  products(first: 50, filter: {status: PUBLISHED, search: $search}) {\n    edges {\n      node {\n        id\n        title\n        variants {\n          id\n          sku\n          price\n          status\n        }\n      }\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetOrders($first: Int, $after: String, $filter: OrderFilterInput, $sort: OrderSortInput) {\n  orders(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        customerId\n        partnerId\n        subtotal\n        total\n        placedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetOrders($first: Int, $after: String, $filter: OrderFilterInput, $sort: OrderSortInput) {\n  orders(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        customerId\n        partnerId\n        subtotal\n        total\n        placedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query ExportReport($input: ExportReportInput!) {\n  exportReport(input: $input)\n}"): (typeof documents)["query ExportReport($input: ExportReportInput!) {\n  exportReport(input: $input)\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation FinalizeBillingReport($id: ID!) {\n  finalizeBillingReport(id: $id) {\n    id\n    status\n    updatedAt\n  }\n}"): (typeof documents)["mutation FinalizeBillingReport($id: ID!) {\n  finalizeBillingReport(id: $id) {\n    id\n    status\n    updatedAt\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation GenerateBillingReport($input: GenerateBillingReportInput!) {\n  generateBillingReport(input: $input) {\n    id\n    partnerId\n    periodStart\n    periodEnd\n    status\n    grossRevenue\n    commissionAmount\n    netPayout\n    generatedAt\n    createdAt\n    updatedAt\n  }\n}"): (typeof documents)["mutation GenerateBillingReport($input: GenerateBillingReportInput!) {\n  generateBillingReport(input: $input) {\n    id\n    partnerId\n    periodStart\n    periodEnd\n    status\n    grossRevenue\n    commissionAmount\n    netPayout\n    generatedAt\n    createdAt\n    updatedAt\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetBillingReport($id: ID!) {\n  billingReport(id: $id) {\n    id\n    partnerId\n    periodStart\n    periodEnd\n    status\n    grossRevenue\n    commissionAmount\n    netPayout\n    generatedAt\n    createdAt\n    updatedAt\n  }\n}"): (typeof documents)["query GetBillingReport($id: ID!) {\n  billingReport(id: $id) {\n    id\n    partnerId\n    periodStart\n    periodEnd\n    status\n    grossRevenue\n    commissionAmount\n    netPayout\n    generatedAt\n    createdAt\n    updatedAt\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetBillingReports($first: Int, $after: String, $filter: BillingReportFilterInput, $sort: BillingReportSortInput) {\n  billingReports(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        partnerId\n        periodStart\n        periodEnd\n        status\n        grossRevenue\n        commissionAmount\n        netPayout\n        generatedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetBillingReports($first: Int, $after: String, $filter: BillingReportFilterInput, $sort: BillingReportSortInput) {\n  billingReports(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        partnerId\n        periodStart\n        periodEnd\n        status\n        grossRevenue\n        commissionAmount\n        netPayout\n        generatedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetCustomersReport($filter: CustomersReportFilterInput) {\n  customersReport(filter: $filter) {\n    totalCustomers\n    statusBreakdown {\n      status\n      count\n    }\n    typeBreakdown {\n      type\n      count\n    }\n  }\n}"): (typeof documents)["query GetCustomersReport($filter: CustomersReportFilterInput) {\n  customersReport(filter: $filter) {\n    totalCustomers\n    statusBreakdown {\n      status\n      count\n    }\n    typeBreakdown {\n      type\n      count\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetInventoryReport($first: Int, $after: String, $filter: InventoryReportFilterInput) {\n  inventoryReport(first: $first, after: $after, filter: $filter) {\n    totalVariants\n    totalOnHand\n    totalReserved\n    lowStockCount\n    lowStockItems {\n      edges {\n        cursor\n        node {\n          productVariantId\n          productTitle\n          sku\n          partnerId\n          quantityOnHand\n          quantityReserved\n          reorderThreshold\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n}"): (typeof documents)["query GetInventoryReport($first: Int, $after: String, $filter: InventoryReportFilterInput) {\n  inventoryReport(first: $first, after: $after, filter: $filter) {\n    totalVariants\n    totalOnHand\n    totalReserved\n    lowStockCount\n    lowStockItems {\n      edges {\n        cursor\n        node {\n          productVariantId\n          productTitle\n          sku\n          partnerId\n          quantityOnHand\n          quantityReserved\n          reorderThreshold\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetNotificationActivityReport($filter: NotificationActivityReportFilterInput) {\n  notificationActivityReport(filter: $filter) {\n    totalNotifications\n    readCount\n    unreadCount\n    typeBreakdown {\n      type\n      count\n    }\n  }\n}"): (typeof documents)["query GetNotificationActivityReport($filter: NotificationActivityReportFilterInput) {\n  notificationActivityReport(filter: $filter) {\n    totalNotifications\n    readCount\n    unreadCount\n    typeBreakdown {\n      type\n      count\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetOrdersReport($filter: OrdersReportFilterInput) {\n  ordersReport(filter: $filter) {\n    totalOrders\n    totalRevenue\n    averageOrderValue\n    statusBreakdown {\n      status\n      count\n    }\n  }\n}"): (typeof documents)["query GetOrdersReport($filter: OrdersReportFilterInput) {\n  ordersReport(filter: $filter) {\n    totalOrders\n    totalRevenue\n    averageOrderValue\n    statusBreakdown {\n      status\n      count\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetProductPerformanceReport($first: Int, $after: String, $filter: ProductPerformanceFilterInput, $sort: ProductPerformanceSortInput) {\n  productPerformanceReport(\n    first: $first\n    after: $after\n    filter: $filter\n    sort: $sort\n  ) {\n    edges {\n      cursor\n      node {\n        productVariantId\n        productTitle\n        sku\n        partnerId\n        unitsSold\n        revenue\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetProductPerformanceReport($first: Int, $after: String, $filter: ProductPerformanceFilterInput, $sort: ProductPerformanceSortInput) {\n  productPerformanceReport(\n    first: $first\n    after: $after\n    filter: $filter\n    sort: $sort\n  ) {\n    edges {\n      cursor\n      node {\n        productVariantId\n        productTitle\n        sku\n        partnerId\n        unitsSold\n        revenue\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetReportsDashboard($filter: ReportsDashboardFilterInput) {\n  reportsDashboard(filter: $filter) {\n    grossRevenue\n    ordersRevenue\n    totalOrders\n    lowStockCount\n    revenueTrend {\n      bucketStart\n      bucketEnd\n      grossRevenue\n      invoiceCount\n    }\n  }\n}"): (typeof documents)["query GetReportsDashboard($filter: ReportsDashboardFilterInput) {\n  reportsDashboard(filter: $filter) {\n    grossRevenue\n    ordersRevenue\n    totalOrders\n    lowStockCount\n    revenueTrend {\n      bucketStart\n      bucketEnd\n      grossRevenue\n      invoiceCount\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetRevenueReport($filter: RevenueReportFilterInput) {\n  revenueReport(filter: $filter) {\n    invoiceCount\n    totalCommission\n    totalGrossRevenue\n    totalNetPayout\n    trend {\n      bucketStart\n      bucketEnd\n      grossRevenue\n      invoiceCount\n    }\n  }\n}"): (typeof documents)["query GetRevenueReport($filter: RevenueReportFilterInput) {\n  revenueReport(filter: $filter) {\n    invoiceCount\n    totalCommission\n    totalGrossRevenue\n    totalNetPayout\n    trend {\n      bucketStart\n      bucketEnd\n      grossRevenue\n      invoiceCount\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation MarkBillingReportPaidOut($id: ID!) {\n  markBillingReportPaidOut(id: $id) {\n    id\n    status\n    updatedAt\n  }\n}"): (typeof documents)["mutation MarkBillingReportPaidOut($id: ID!) {\n  markBillingReportPaidOut(id: $id) {\n    id\n    status\n    updatedAt\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetUsers($first: Int, $after: String, $filter: UserFilterInput, $sort: UserSortInput) {\n  users(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        fullName\n        email\n        status\n        ownerType\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetUsers($first: Int, $after: String, $filter: UserFilterInput, $sort: UserSortInput) {\n  users(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        fullName\n        email\n        status\n        ownerType\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;