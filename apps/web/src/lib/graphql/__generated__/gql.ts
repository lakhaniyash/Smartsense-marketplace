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
    "query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}": typeof types.DashboardStatsDocument,
    "mutation CancelOrder($id: ID!, $reason: String) {\n  cancelOrder(id: $id, reason: $reason) {\n    id\n    status\n  }\n}": typeof types.CancelOrderDocument,
    "mutation CreateOrder($input: CreateOrderInput!) {\n  createOrder(input: $input) {\n    id\n    orderNumber\n    status\n  }\n}": typeof types.CreateOrderDocument,
    "query GetOrderById($id: ID!) {\n  order(id: $id) {\n    id\n    orderNumber\n    status\n    customerId\n    partnerId\n    shippingAddressId\n    subtotal\n    tax\n    shippingCost\n    total\n    placedAt\n    createdAt\n    updatedAt\n    items {\n      id\n      productVariantId\n      quantity\n      unitPriceSnapshot\n      lineTotal\n      productVariant {\n        id\n        sku\n        attributes {\n          key\n          value\n        }\n      }\n    }\n    statusHistory {\n      id\n      fromStatus\n      toStatus\n      changedByUserId\n      reason\n      createdAt\n    }\n  }\n}": typeof types.GetOrderByIdDocument,
    "query GetOrderableVariants($search: String) {\n  products(first: 50, filter: {status: PUBLISHED, search: $search}) {\n    edges {\n      node {\n        id\n        title\n        variants {\n          id\n          sku\n          price\n          status\n        }\n      }\n    }\n  }\n}": typeof types.GetOrderableVariantsDocument,
    "query GetOrders($first: Int, $after: String, $filter: OrderFilterInput, $sort: OrderSortInput) {\n  orders(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        customerId\n        partnerId\n        subtotal\n        total\n        placedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetOrdersDocument,
    "mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}": typeof types.UpdateOrderStatusDocument,
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
    "query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}": types.DashboardStatsDocument,
    "mutation CancelOrder($id: ID!, $reason: String) {\n  cancelOrder(id: $id, reason: $reason) {\n    id\n    status\n  }\n}": types.CancelOrderDocument,
    "mutation CreateOrder($input: CreateOrderInput!) {\n  createOrder(input: $input) {\n    id\n    orderNumber\n    status\n  }\n}": types.CreateOrderDocument,
    "query GetOrderById($id: ID!) {\n  order(id: $id) {\n    id\n    orderNumber\n    status\n    customerId\n    partnerId\n    shippingAddressId\n    subtotal\n    tax\n    shippingCost\n    total\n    placedAt\n    createdAt\n    updatedAt\n    items {\n      id\n      productVariantId\n      quantity\n      unitPriceSnapshot\n      lineTotal\n      productVariant {\n        id\n        sku\n        attributes {\n          key\n          value\n        }\n      }\n    }\n    statusHistory {\n      id\n      fromStatus\n      toStatus\n      changedByUserId\n      reason\n      createdAt\n    }\n  }\n}": types.GetOrderByIdDocument,
    "query GetOrderableVariants($search: String) {\n  products(first: 50, filter: {status: PUBLISHED, search: $search}) {\n    edges {\n      node {\n        id\n        title\n        variants {\n          id\n          sku\n          price\n          status\n        }\n      }\n    }\n  }\n}": types.GetOrderableVariantsDocument,
    "query GetOrders($first: Int, $after: String, $filter: OrderFilterInput, $sort: OrderSortInput) {\n  orders(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        orderNumber\n        status\n        customerId\n        partnerId\n        subtotal\n        total\n        placedAt\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetOrdersDocument,
    "mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}": types.UpdateOrderStatusDocument,
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
export function gql(source: "query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}"): (typeof documents)["query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}"];
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

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;