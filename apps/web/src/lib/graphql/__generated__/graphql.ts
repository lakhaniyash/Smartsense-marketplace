/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
  /** Arbitrary-precision decimal (money, percentages), transported as a string to avoid floating-point precision loss. */
  Decimal: { input: string; output: string; }
};

export type AdjustInventoryInput = {
  adjustmentType: InventoryAdjustmentType;
  productVariantId: Scalars['ID']['input'];
  /** Non-negative. Interpreted per adjustmentType. */
  quantity: Scalars['Int']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

/** A node in the global product category taxonomy, owned and maintained by Admin (docs/domain-model.md § Category). Returned as a flat list — clients build the parent/child tree from parentCategoryId. */
export type Category = {
  __typename?: 'Category';
  /** Sort position among sibling categories. */
  displayOrder: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  /** Parent category id, or null for a top-level category. */
  parentCategoryId?: Maybe<Scalars['ID']['output']>;
  slug: Scalars['String']['output'];
};

export type CreateOrderInput = {
  /** Required when the caller is Admin; ignored (overridden by the caller's own customerId) for a Customer-scoped caller. */
  customerId?: InputMaybe<Scalars['ID']['input']>;
  items: Array<CreateOrderItemInput>;
  shippingAddressId?: InputMaybe<Scalars['ID']['input']>;
  /** Defaults to 0. */
  shippingCost?: InputMaybe<Scalars['Decimal']['input']>;
  /** Defaults to 0. */
  tax?: InputMaybe<Scalars['Decimal']['input']>;
};

export type CreateOrderItemInput = {
  productVariantId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
};

export type CreatePaymentInput = {
  amount: Scalars['Decimal']['input'];
  externalTransactionId: Scalars['String']['input'];
  /** Caller-generated UUID; retries must reuse the same value. */
  idempotencyKey: Scalars['ID']['input'];
  invoiceId: Scalars['ID']['input'];
  method: PaymentMethod;
};

export type CreateProductInput = {
  brand?: InputMaybe<Scalars['String']['input']>;
  categoryId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  /** The initial default ProductVariant's price. */
  price: Scalars['Decimal']['input'];
  /** Stored on the Product's initial (default) ProductVariant, unique per Partner. */
  sku: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateProductVariantInput = {
  attributes?: InputMaybe<Array<ProductVariantAttributeInput>>;
  /** Marks this Variant as the Product's default, unsetting any existing default. */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  price: Scalars['Decimal']['input'];
  productId: Scalars['ID']['input'];
  sku: Scalars['String']['input'];
};

/** The authenticated caller, plus their resolved roles and permissions. */
export type CurrentUser = {
  __typename?: 'CurrentUser';
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Permission.key values, e.g. ["catalog:write"] */
  permissions: Array<Scalars['String']['output']>;
  /** Role.name values, e.g. ["Admin"] */
  roles: Array<Scalars['String']['output']>;
};

/** Marketplace-wide summary counts shown on the dashboard overview. */
export type DashboardStats = {
  __typename?: 'DashboardStats';
  /** Total non-deleted Customer count, marketplace-wide. */
  totalCustomers: Scalars['Int']['output'];
  /** Total Order count, marketplace-wide. */
  totalOrders: Scalars['Int']['output'];
  /** Total non-deleted Product count, marketplace-wide. */
  totalProducts: Scalars['Int']['output'];
};

/** Stock levels for a ProductVariant (docs/domain-model.md § Inventory). sellableQuantity = quantityOnHand - quantityReserved, never negative. */
export type Inventory = {
  __typename?: 'Inventory';
  quantityOnHand: Scalars['Int']['output'];
  quantityReserved: Scalars['Int']['output'];
  /** Optional low-stock alert threshold. */
  reorderThreshold?: Maybe<Scalars['Int']['output']>;
  /** Derived: quantityOnHand - quantityReserved. */
  sellableQuantity: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** How AdjustInventoryInput.quantity is applied to the current quantityOnHand. */
export enum InventoryAdjustmentType {
  Decrease = 'DECREASE',
  Increase = 'INCREASE',
  Set = 'SET'
}

/** A per-Order billing document (docs/domain-model.md § Invoice). */
export type Invoice = {
  __typename?: 'Invoice';
  amountDue: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  dueAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  invoiceNumber: Scalars['String']['output'];
  issuedAt?: Maybe<Scalars['DateTime']['output']>;
  orderId: Scalars['ID']['output'];
  partnerId: Scalars['ID']['output'];
  payments: Array<Payment>;
  status: InvoiceStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type InvoiceConnection = {
  __typename?: 'InvoiceConnection';
  edges: Array<InvoiceEdge>;
  pageInfo: PageInfo;
};

export type InvoiceEdge = {
  __typename?: 'InvoiceEdge';
  cursor: Scalars['String']['output'];
  node: Invoice;
};

export type InvoiceFilterInput = {
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<InvoiceStatus>;
};

/** Fields the invoice list can be sorted by. */
export enum InvoiceSortField {
  AmountDue = 'AMOUNT_DUE',
  CreatedAt = 'CREATED_AT',
  DueAt = 'DUE_AT',
  IssuedAt = 'ISSUED_AT'
}

export type InvoiceSortInput = {
  direction: SortDirection;
  field: InvoiceSortField;
};

/** Full lifecycle per docs/domain-model.md § Invoice: DRAFT (generated but not yet sent) → ISSUED → PARTIALLY_PAID → PAID, or ISSUED/DRAFT → VOID. generateInvoiceForOrder creates Invoices directly as ISSUED (docs/domain-model.md § Billing Flow) — DRAFT exists in the schema for a future pre-issuance workflow. */
export enum InvoiceStatus {
  Draft = 'DRAFT',
  Issued = 'ISSUED',
  Paid = 'PAID',
  PartiallyPaid = 'PARTIALLY_PAID',
  Void = 'VOID'
}

export type Mutation = {
  __typename?: 'Mutation';
  /** Adjusts a ProductVariant's stock on hand and returns the updated Variant. */
  adjustInventory: ProductVariant;
  /** Transitions a Product owned by the caller to ARCHIVED status. */
  archiveProduct: Product;
  /** Soft-deletes a ProductVariant. Rejected if it is the Product's default Variant or its only remaining Variant. */
  archiveProductVariant: ProductVariant;
  /** Cancels an Order (caller's own order from DRAFT/CONFIRMED; vendor Partner/Admin only from PROCESSING). Releases any reserved inventory. */
  cancelOrder: Order;
  /** Places a new Order in DRAFT status for the caller (Customer: self; Partner/Admin: on behalf of a specified customerId). No inventory effect yet — reservation happens when the order is confirmed via updateOrderStatus. */
  createOrder: Order;
  /** Creates a Product under the caller's own Partner. */
  createProduct: Product;
  /** Adds a ProductVariant to a Product owned by the caller. */
  createProductVariant: ProductVariant;
  /** Records a Payment against an Invoice (v1 has no live payment gateway — "recorded, not processed", per docs/roadmap.md). Idempotent on input.idempotencyKey: a retry with the same key returns the original Payment rather than creating a duplicate. */
  recordPayment: Payment;
  /** Marks a ProductVariant as its Product's default, unsetting any previous default. */
  setDefaultProductVariant: ProductVariant;
  /** Transitions an Order to a new status per the allowed transition matrix (docs/authorization.md § Orders). Rejects any other requested transition as invalid. */
  updateOrderStatus: Order;
  /** Updates a Product owned by the caller. */
  updateProduct: Product;
  /** Updates a ProductVariant owned by the caller. */
  updateProductVariant: ProductVariant;
  /** Voids a DRAFT/ISSUED Invoice with zero recorded Payments (docs/domain-model.md § Invoice). */
  voidInvoice: Invoice;
};


export type MutationAdjustInventoryArgs = {
  input: AdjustInventoryInput;
};


export type MutationArchiveProductArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveProductVariantArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCancelOrderArgs = {
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateOrderArgs = {
  input: CreateOrderInput;
};


export type MutationCreateProductArgs = {
  input: CreateProductInput;
};


export type MutationCreateProductVariantArgs = {
  input: CreateProductVariantInput;
};


export type MutationRecordPaymentArgs = {
  input: CreatePaymentInput;
};


export type MutationSetDefaultProductVariantArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateOrderStatusArgs = {
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  status: OrderStatus;
};


export type MutationUpdateProductArgs = {
  input: UpdateProductInput;
};


export type MutationUpdateProductVariantArgs = {
  input: UpdateProductVariantInput;
};


export type MutationVoidInvoiceArgs = {
  id: Scalars['ID']['input'];
};

/** A single-Partner order (docs/domain-model.md § Order). */
export type Order = {
  __typename?: 'Order';
  createdAt: Scalars['DateTime']['output'];
  customerId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  items: Array<OrderItem>;
  orderNumber: Scalars['String']['output'];
  partnerId: Scalars['ID']['output'];
  placedAt?: Maybe<Scalars['DateTime']['output']>;
  shippingAddressId?: Maybe<Scalars['ID']['output']>;
  shippingCost: Scalars['Decimal']['output'];
  status: OrderStatus;
  /** Oldest first. */
  statusHistory: Array<OrderStatusHistoryEntry>;
  subtotal: Scalars['Decimal']['output'];
  tax: Scalars['Decimal']['output'];
  total: Scalars['Decimal']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type OrderConnection = {
  __typename?: 'OrderConnection';
  edges: Array<OrderEdge>;
  pageInfo: PageInfo;
};

export type OrderEdge = {
  __typename?: 'OrderEdge';
  cursor: Scalars['String']['output'];
  node: Order;
};

export type OrderFilterInput = {
  createdAfter?: InputMaybe<Scalars['DateTime']['input']>;
  createdBefore?: InputMaybe<Scalars['DateTime']['input']>;
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  customerId?: InputMaybe<Scalars['ID']['input']>;
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<OrderStatus>;
};

/** An immutable line item on an Order (docs/domain-model.md § Order Item). unitPriceSnapshot is captured at order placement and never recalculated from the live ProductVariant.price. */
export type OrderItem = {
  __typename?: 'OrderItem';
  id: Scalars['ID']['output'];
  lineTotal: Scalars['Decimal']['output'];
  productVariant: ProductVariant;
  productVariantId: Scalars['ID']['output'];
  quantity: Scalars['Int']['output'];
  unitPriceSnapshot: Scalars['Decimal']['output'];
};

/** Fields the order list can be sorted by. */
export enum OrderSortField {
  CreatedAt = 'CREATED_AT',
  Total = 'TOTAL'
}

export type OrderSortInput = {
  direction: SortDirection;
  field: OrderSortField;
};

/** Full lifecycle per docs/domain-model.md § Order Lifecycle. M13 implemented transitions among DRAFT/CONFIRMED/PROCESSING/CANCELLED; M14 (Billing) added PROCESSING→SHIPPED→DELIVERED→COMPLETED so invoice generation has a trigger — the remaining values (PENDING_PAYMENT, RETURN_REQUESTED, REFUNDED) exist in the schema for future milestones and are not yet reachable. */
export enum OrderStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Confirmed = 'CONFIRMED',
  Delivered = 'DELIVERED',
  Draft = 'DRAFT',
  PendingPayment = 'PENDING_PAYMENT',
  Processing = 'PROCESSING',
  Refunded = 'REFUNDED',
  ReturnRequested = 'RETURN_REQUESTED',
  Shipped = 'SHIPPED'
}

/** One row of an Order's status timeline (docs/domain-model.md § OrderStatusHistory). */
export type OrderStatusHistoryEntry = {
  __typename?: 'OrderStatusHistoryEntry';
  changedByUserId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Null for the initial creation row. */
  fromStatus?: Maybe<OrderStatus>;
  id: Scalars['ID']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  toStatus: OrderStatus;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** A single payment transaction applied against an Invoice (docs/domain-model.md § Payment). */
export type Payment = {
  __typename?: 'Payment';
  amount: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  externalTransactionId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  invoiceId: Scalars['ID']['output'];
  method: PaymentMethod;
  processedAt?: Maybe<Scalars['DateTime']['output']>;
  status: PaymentStatus;
};

/** How a Payment was settled (docs/domain-model.md § Payment). */
export enum PaymentMethod {
  BankTransfer = 'BANK_TRANSFER',
  Card = 'CARD',
  Other = 'OTHER'
}

/** v1 has no live payment gateway (docs/roadmap.md) — a recorded Payment is created directly as SUCCEEDED. PENDING/FAILED/REFUNDED exist in the schema for a future gateway integration and are not yet reachable through recordPayment. */
export enum PaymentStatus {
  Failed = 'FAILED',
  Pending = 'PENDING',
  Refunded = 'REFUNDED',
  Succeeded = 'SUCCEEDED'
}

/** A Partner catalog listing. Always has at least one ProductVariant (docs/domain-model.md § Product Variant); `sku` is flattened from the default one for convenience, and `variants` carries the full list for management. */
export type Product = {
  __typename?: 'Product';
  brand?: Maybe<Scalars['String']['output']>;
  category: Category;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Flattened from the default ProductVariant. */
  sku: Scalars['String']['output'];
  status: ProductStatus;
  title: Scalars['String']['output'];
  variants: Array<ProductVariant>;
};

export type ProductConnection = {
  __typename?: 'ProductConnection';
  edges: Array<ProductEdge>;
  pageInfo: PageInfo;
};

export type ProductEdge = {
  __typename?: 'ProductEdge';
  cursor: Scalars['String']['output'];
  node: Product;
};

export type ProductFilterInput = {
  categoryId?: InputMaybe<Scalars['ID']['input']>;
  /** Free-text match against the product title and its SKU. */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ProductStatus>;
};

/** Fields the product list can be sorted by. */
export enum ProductSortField {
  CreatedAt = 'CREATED_AT',
  Name = 'NAME'
}

export type ProductSortInput = {
  direction: SortDirection;
  field: ProductSortField;
};

/** Lifecycle state per docs/domain-model.md § Catalog Management. */
export enum ProductStatus {
  Archived = 'ARCHIVED',
  Draft = 'DRAFT',
  PendingReview = 'PENDING_REVIEW',
  Published = 'PUBLISHED'
}

/** The sellable SKU beneath a Product (docs/domain-model.md § Product Variant). */
export type ProductVariant = {
  __typename?: 'ProductVariant';
  attributes: Array<ProductVariantAttribute>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  inventory: Inventory;
  /** Whether this is the Product's default Variant. Exactly one per Product. */
  isDefault: Scalars['Boolean']['output'];
  price: Scalars['Decimal']['output'];
  sku: Scalars['String']['output'];
  status: ProductVariantStatus;
};

export type ProductVariantAttribute = {
  __typename?: 'ProductVariantAttribute';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ProductVariantAttributeInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

/** ACTIVE/OUT_OF_STOCK are derived automatically from Inventory and cannot be set directly. DISCONTINUED is a manual, terminal Partner action (docs/domain-model.md § Product Variant). */
export enum ProductVariantStatus {
  Active = 'ACTIVE',
  Discontinued = 'DISCONTINUED',
  OutOfStock = 'OUT_OF_STOCK'
}

export type Query = {
  __typename?: 'Query';
  /** Auth module status */
  authStatus: Scalars['String']['output'];
  /** Billing module status */
  billingStatus: Scalars['String']['output'];
  /** Catalog module status */
  catalogStatus: Scalars['String']['output'];
  /** Active categories in the global taxonomy, flat. */
  categories: Array<Category>;
  /** Summary statistics for the dashboard overview. */
  dashboardStats: DashboardStats;
  /** Dashboard module status */
  dashboardStatus: Scalars['String']['output'];
  /** A CSV export of the caller's visible invoices, matching the given filter. */
  exportInvoicesCsv: Scalars['String']['output'];
  /** A single invoice by id, scoped to the caller. Throws NOT_FOUND rather than returning null on a missing or out-of-scope id. */
  invoice: Invoice;
  /** A base64-encoded PDF rendering of a single invoice by id. */
  invoicePdf: Scalars['String']['output'];
  /** A page of the caller's visible invoices (Admin: all; Partner: own as vendor). */
  invoices: InvoiceConnection;
  /** The authenticated caller and their resolved roles/permissions. */
  me: CurrentUser;
  /** A single order by id, scoped to the caller. Throws NOT_FOUND rather than returning null on a missing or out-of-scope id. */
  order: Order;
  /** A page of the caller's visible orders (Admin: all; Partner: own as vendor; Customer: own as buyer). */
  orders: OrderConnection;
  /** Orders module status */
  ordersStatus: Scalars['String']['output'];
  /** A single product by id, scoped to the caller (Admin: any; Partner: own). Throws NOT_FOUND rather than returning null on a missing or out-of-scope id. */
  productById: Product;
  /** A page of the caller's visible products (Admin: all; Partner: own). */
  products: ProductConnection;
  /** Users module status */
  usersStatus: Scalars['String']['output'];
};


export type QueryExportInvoicesCsvArgs = {
  filter?: InputMaybe<InvoiceFilterInput>;
};


export type QueryInvoiceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryInvoicePdfArgs = {
  id: Scalars['ID']['input'];
};


export type QueryInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<InvoiceFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<InvoiceSortInput>;
};


export type QueryOrderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<OrderFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<OrderSortInput>;
};


export type QueryProductByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProductFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<ProductSortInput>;
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type UpdateProductInput = {
  brand?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  status?: InputMaybe<ProductStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProductVariantInput = {
  attributes?: InputMaybe<Array<ProductVariantAttributeInput>>;
  id: Scalars['ID']['input'];
  /** Marks this Variant as the Product's default, unsetting any existing default. */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  price?: InputMaybe<Scalars['Decimal']['input']>;
  sku?: InputMaybe<Scalars['String']['input']>;
  /** Only DISCONTINUED may be set directly — ACTIVE/OUT_OF_STOCK are derived from Inventory and rejected by the service if supplied here. */
  status?: InputMaybe<ProductVariantStatus>;
};

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me: { __typename?: 'CurrentUser', id: string, email: string, fullName: string, roles: Array<string>, permissions: Array<string> } };

export type ExportInvoicesCsvQueryVariables = Exact<{
  filter?: InputMaybe<InvoiceFilterInput>;
}>;


export type ExportInvoicesCsvQuery = { __typename?: 'Query', exportInvoicesCsv: string };

export type GetInvoiceByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetInvoiceByIdQuery = { __typename?: 'Query', invoice: { __typename?: 'Invoice', id: string, invoiceNumber: string, orderId: string, partnerId: string, amountDue: string, status: InvoiceStatus, issuedAt?: any | null, dueAt?: any | null, createdAt: any, updatedAt: any, payments: Array<{ __typename?: 'Payment', id: string, amount: string, method: PaymentMethod, externalTransactionId: string, status: PaymentStatus, processedAt?: any | null, createdAt: any }> } };

export type GetInvoicesQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<InvoiceFilterInput>;
  sort?: InputMaybe<InvoiceSortInput>;
}>;


export type GetInvoicesQuery = { __typename?: 'Query', invoices: { __typename?: 'InvoiceConnection', edges: Array<{ __typename?: 'InvoiceEdge', cursor: string, node: { __typename?: 'Invoice', id: string, invoiceNumber: string, partnerId: string, amountDue: string, status: InvoiceStatus, issuedAt?: any | null, dueAt?: any | null, createdAt: any } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type InvoicePdfQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type InvoicePdfQuery = { __typename?: 'Query', invoicePdf: string };

export type RecordPaymentMutationVariables = Exact<{
  input: CreatePaymentInput;
}>;


export type RecordPaymentMutation = { __typename?: 'Mutation', recordPayment: { __typename?: 'Payment', id: string, amount: string, status: PaymentStatus, invoiceId: string, externalTransactionId: string } };

export type VoidInvoiceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type VoidInvoiceMutation = { __typename?: 'Mutation', voidInvoice: { __typename?: 'Invoice', id: string, status: InvoiceStatus } };

export type AdjustInventoryMutationVariables = Exact<{
  input: AdjustInventoryInput;
}>;


export type AdjustInventoryMutation = { __typename?: 'Mutation', adjustInventory: { __typename?: 'ProductVariant', id: string, status: ProductVariantStatus, inventory: { __typename?: 'Inventory', quantityOnHand: number, quantityReserved: number, sellableQuantity: number, reorderThreshold?: number | null, updatedAt: any } } };

export type ArchiveProductMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveProductMutation = { __typename?: 'Mutation', archiveProduct: { __typename?: 'Product', id: string, status: ProductStatus } };

export type ArchiveProductVariantMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveProductVariantMutation = { __typename?: 'Mutation', archiveProductVariant: { __typename?: 'ProductVariant', id: string } };

export type CreateProductMutationVariables = Exact<{
  input: CreateProductInput;
}>;


export type CreateProductMutation = { __typename?: 'Mutation', createProduct: { __typename?: 'Product', id: string, title: string, sku: string, status: ProductStatus, category: { __typename?: 'Category', id: string, name: string } } };

export type CreateProductVariantMutationVariables = Exact<{
  input: CreateProductVariantInput;
}>;


export type CreateProductVariantMutation = { __typename?: 'Mutation', createProductVariant: { __typename?: 'ProductVariant', id: string, sku: string, price: string, status: ProductVariantStatus, isDefault: boolean, createdAt: any, attributes: Array<{ __typename?: 'ProductVariantAttribute', key: string, value: string }>, inventory: { __typename?: 'Inventory', quantityOnHand: number, quantityReserved: number, sellableQuantity: number, reorderThreshold?: number | null, updatedAt: any } } };

export type GetCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCategoriesQuery = { __typename?: 'Query', categories: Array<{ __typename?: 'Category', id: string, name: string, slug: string, parentCategoryId?: string | null, displayOrder: number }> };

export type GetProductByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProductByIdQuery = { __typename?: 'Query', productById: { __typename?: 'Product', id: string, title: string, description?: string | null, brand?: string | null, sku: string, status: ProductStatus, createdAt: any, publishedAt?: any | null, category: { __typename?: 'Category', id: string, name: string, slug: string }, variants: Array<{ __typename?: 'ProductVariant', id: string, sku: string, price: string, status: ProductVariantStatus, isDefault: boolean, createdAt: any, attributes: Array<{ __typename?: 'ProductVariantAttribute', key: string, value: string }>, inventory: { __typename?: 'Inventory', quantityOnHand: number, quantityReserved: number, sellableQuantity: number, reorderThreshold?: number | null, updatedAt: any } }> } };

export type GetProductsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProductFilterInput>;
  sort?: InputMaybe<ProductSortInput>;
}>;


export type GetProductsQuery = { __typename?: 'Query', products: { __typename?: 'ProductConnection', edges: Array<{ __typename?: 'ProductEdge', cursor: string, node: { __typename?: 'Product', id: string, title: string, sku: string, status: ProductStatus, createdAt: any, category: { __typename?: 'Category', id: string, name: string } } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type SetDefaultProductVariantMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SetDefaultProductVariantMutation = { __typename?: 'Mutation', setDefaultProductVariant: { __typename?: 'ProductVariant', id: string, isDefault: boolean } };

export type UpdateProductMutationVariables = Exact<{
  input: UpdateProductInput;
}>;


export type UpdateProductMutation = { __typename?: 'Mutation', updateProduct: { __typename?: 'Product', id: string, title: string, sku: string, status: ProductStatus, category: { __typename?: 'Category', id: string, name: string } } };

export type UpdateProductVariantMutationVariables = Exact<{
  input: UpdateProductVariantInput;
}>;


export type UpdateProductVariantMutation = { __typename?: 'Mutation', updateProductVariant: { __typename?: 'ProductVariant', id: string, sku: string, price: string, status: ProductVariantStatus, isDefault: boolean, createdAt: any, attributes: Array<{ __typename?: 'ProductVariantAttribute', key: string, value: string }>, inventory: { __typename?: 'Inventory', quantityOnHand: number, quantityReserved: number, sellableQuantity: number, reorderThreshold?: number | null, updatedAt: any } } };

export type DashboardStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardStatsQuery = { __typename?: 'Query', dashboardStats: { __typename?: 'DashboardStats', totalProducts: number, totalOrders: number, totalCustomers: number } };

export type CancelOrderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type CancelOrderMutation = { __typename?: 'Mutation', cancelOrder: { __typename?: 'Order', id: string, status: OrderStatus } };

export type CreateOrderMutationVariables = Exact<{
  input: CreateOrderInput;
}>;


export type CreateOrderMutation = { __typename?: 'Mutation', createOrder: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus } };

export type GetOrderByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetOrderByIdQuery = { __typename?: 'Query', order: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, customerId: string, partnerId: string, shippingAddressId?: string | null, subtotal: string, tax: string, shippingCost: string, total: string, placedAt?: any | null, createdAt: any, updatedAt: any, items: Array<{ __typename?: 'OrderItem', id: string, productVariantId: string, quantity: number, unitPriceSnapshot: string, lineTotal: string, productVariant: { __typename?: 'ProductVariant', id: string, sku: string, attributes: Array<{ __typename?: 'ProductVariantAttribute', key: string, value: string }> } }>, statusHistory: Array<{ __typename?: 'OrderStatusHistoryEntry', id: string, fromStatus?: OrderStatus | null, toStatus: OrderStatus, changedByUserId?: string | null, reason?: string | null, createdAt: any }> } };

export type GetOrderableVariantsQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetOrderableVariantsQuery = { __typename?: 'Query', products: { __typename?: 'ProductConnection', edges: Array<{ __typename?: 'ProductEdge', node: { __typename?: 'Product', id: string, title: string, variants: Array<{ __typename?: 'ProductVariant', id: string, sku: string, price: string, status: ProductVariantStatus }> } }> } };

export type GetOrdersQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<OrderFilterInput>;
  sort?: InputMaybe<OrderSortInput>;
}>;


export type GetOrdersQuery = { __typename?: 'Query', orders: { __typename?: 'OrderConnection', edges: Array<{ __typename?: 'OrderEdge', cursor: string, node: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, customerId: string, partnerId: string, subtotal: string, total: string, placedAt?: any | null, createdAt: any } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type UpdateOrderStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: OrderStatus;
}>;


export type UpdateOrderStatusMutation = { __typename?: 'Mutation', updateOrderStatus: { __typename?: 'Order', id: string, status: OrderStatus } };


export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const ExportInvoicesCsvDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportInvoicesCsv"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"InvoiceFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exportInvoicesCsv"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}]}]}}]} as unknown as DocumentNode<ExportInvoicesCsvQuery, ExportInvoicesCsvQueryVariables>;
export const GetInvoiceByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInvoiceById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceNumber"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"amountDue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"payments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"externalTransactionId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"processedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetInvoiceByIdQuery, GetInvoiceByIdQueryVariables>;
export const GetInvoicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInvoices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"InvoiceFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"InvoiceSortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceNumber"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"amountDue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetInvoicesQuery, GetInvoicesQueryVariables>;
export const InvoicePdfDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InvoicePdf"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoicePdf"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<InvoicePdfQuery, InvoicePdfQueryVariables>;
export const RecordPaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecordPayment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePaymentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordPayment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceId"}},{"kind":"Field","name":{"kind":"Name","value":"externalTransactionId"}}]}}]}}]} as unknown as DocumentNode<RecordPaymentMutation, RecordPaymentMutationVariables>;
export const VoidInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VoidInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"voidInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<VoidInvoiceMutation, VoidInvoiceMutationVariables>;
export const AdjustInventoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdjustInventory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdjustInventoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adjustInventory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"inventory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quantityOnHand"}},{"kind":"Field","name":{"kind":"Name","value":"quantityReserved"}},{"kind":"Field","name":{"kind":"Name","value":"sellableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"reorderThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<AdjustInventoryMutation, AdjustInventoryMutationVariables>;
export const ArchiveProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ArchiveProductMutation, ArchiveProductMutationVariables>;
export const ArchiveProductVariantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveProductVariant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveProductVariant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ArchiveProductVariantMutation, ArchiveProductVariantMutationVariables>;
export const CreateProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProductInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateProductMutation, CreateProductMutationVariables>;
export const CreateProductVariantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProductVariant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProductVariantInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProductVariant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inventory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quantityOnHand"}},{"kind":"Field","name":{"kind":"Name","value":"quantityReserved"}},{"kind":"Field","name":{"kind":"Name","value":"sellableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"reorderThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateProductVariantMutation, CreateProductVariantMutationVariables>;
export const GetCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCategories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"parentCategoryId"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}}]}}]} as unknown as DocumentNode<GetCategoriesQuery, GetCategoriesQueryVariables>;
export const GetProductByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProductById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"brand"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"variants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inventory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quantityOnHand"}},{"kind":"Field","name":{"kind":"Name","value":"quantityReserved"}},{"kind":"Field","name":{"kind":"Name","value":"sellableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"reorderThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}}]}}]}}]} as unknown as DocumentNode<GetProductByIdQuery, GetProductByIdQueryVariables>;
export const GetProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductSortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetProductsQuery, GetProductsQueryVariables>;
export const SetDefaultProductVariantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDefaultProductVariant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultProductVariant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<SetDefaultProductVariantMutation, SetDefaultProductVariantMutationVariables>;
export const UpdateProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProductInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateProductMutation, UpdateProductMutationVariables>;
export const UpdateProductVariantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProductVariant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProductVariantInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProductVariant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inventory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quantityOnHand"}},{"kind":"Field","name":{"kind":"Name","value":"quantityReserved"}},{"kind":"Field","name":{"kind":"Name","value":"sellableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"reorderThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<UpdateProductVariantMutation, UpdateProductVariantMutationVariables>;
export const DashboardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalProducts"}},{"kind":"Field","name":{"kind":"Name","value":"totalOrders"}},{"kind":"Field","name":{"kind":"Name","value":"totalCustomers"}}]}}]}}]} as unknown as DocumentNode<DashboardStatsQuery, DashboardStatsQueryVariables>;
export const CancelOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CancelOrderMutation, CancelOrderMutationVariables>;
export const CreateOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrderInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CreateOrderMutation, CreateOrderMutationVariables>;
export const GetOrderByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrderById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"customerId"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"shippingAddressId"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"tax"}},{"kind":"Field","name":{"kind":"Name","value":"shippingCost"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"placedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPriceSnapshot"}},{"kind":"Field","name":{"kind":"Name","value":"lineTotal"}},{"kind":"Field","name":{"kind":"Name","value":"productVariant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"statusHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fromStatus"}},{"kind":"Field","name":{"kind":"Name","value":"toStatus"}},{"kind":"Field","name":{"kind":"Name","value":"changedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrderByIdQuery, GetOrderByIdQueryVariables>;
export const GetOrderableVariantsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrderableVariants"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"50"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"PUBLISHED"}},{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"variants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetOrderableVariantsQuery, GetOrderableVariantsQueryVariables>;
export const GetOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderSortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"customerId"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"placedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrdersQuery, GetOrdersQueryVariables>;
export const UpdateOrderStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrderStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrderStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateOrderStatusMutation, UpdateOrderStatusMutationVariables>;