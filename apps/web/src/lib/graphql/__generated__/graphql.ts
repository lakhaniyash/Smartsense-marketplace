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

export type AddCustomerAddressInput = {
  city: Scalars['String']['input'];
  country: Scalars['String']['input'];
  customerId: Scalars['ID']['input'];
  /** Marks this address as the Customer's default, unsetting any existing default. */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  line1: Scalars['String']['input'];
  line2?: InputMaybe<Scalars['String']['input']>;
  postalCode: Scalars['String']['input'];
  state: Scalars['String']['input'];
  type: AddressType;
};

/** Shipping, Billing, or Registered (docs/domain-model.md § Address). */
export enum AddressType {
  Billing = 'BILLING',
  Registered = 'REGISTERED',
  Shipping = 'SHIPPING'
}

export type AdjustInventoryInput = {
  adjustmentType: InventoryAdjustmentType;
  productVariantId: Scalars['ID']['input'];
  /** Non-negative. Interpreted per adjustmentType. */
  quantity: Scalars['Int']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

/** One AuditLog row (docs/database-schema.md § Audit Log), read-only and scoped to a single entity. Added for the Customer activity timeline; promoted here once Users became its second consumer (CLAUDE.md: "Promote, don't pre-share"). */
export type AuditLogEntry = {
  __typename?: 'AuditLogEntry';
  action: Scalars['String']['output'];
  actorEmail: Scalars['String']['output'];
  actorId: Scalars['ID']['output'];
  actorName: Scalars['String']['output'];
  entityId: Scalars['ID']['output'];
  entityType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** JSON-encoded metadata, if any — transported as a string rather than adding a new GraphQL JSON scalar dependency for this one field. */
  metadata?: Maybe<Scalars['String']['output']>;
  occurredAt: Scalars['DateTime']['output'];
};

/** A periodic per-Partner statement reconciling Invoice/Payment activity for a date range (docs/domain-model.md § Billing Report). The only persisted Reports entity — every other report in this module is computed on read. */
export type BillingReport = {
  __typename?: 'BillingReport';
  /** grossRevenue * (Partner.commissionRate / 100). */
  commissionAmount: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  generatedAt: Scalars['DateTime']['output'];
  /** SUM(Invoice.amountDue) for ISSUED/PARTIALLY_PAID/PAID invoices issued in the period. */
  grossRevenue: Scalars['Decimal']['output'];
  id: Scalars['ID']['output'];
  /** grossRevenue - commissionAmount. */
  netPayout: Scalars['Decimal']['output'];
  partnerId: Scalars['ID']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  status: BillingReportStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type BillingReportConnection = {
  __typename?: 'BillingReportConnection';
  edges: Array<BillingReportEdge>;
  pageInfo: PageInfo;
};

export type BillingReportEdge = {
  __typename?: 'BillingReportEdge';
  cursor: Scalars['String']['output'];
  node: BillingReport;
};

export type BillingReportFilterInput = {
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<BillingReportStatus>;
};

/** Fields the billing report list can be sorted by. */
export enum BillingReportSortField {
  GeneratedAt = 'GENERATED_AT',
  GrossRevenue = 'GROSS_REVENUE',
  PeriodStart = 'PERIOD_START'
}

export type BillingReportSortInput = {
  direction: SortDirection;
  field: BillingReportSortField;
};

/** Lifecycle per docs/domain-model.md § Billing Report: GENERATED (just computed) → FINALIZED (locked, ready for payout) → PAID_OUT (payout completed). */
export enum BillingReportStatus {
  Finalized = 'FINALIZED',
  Generated = 'GENERATED',
  PaidOut = 'PAID_OUT'
}

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

export type CreateCustomerInput = {
  billingEmail: Scalars['String']['input'];
  displayName: Scalars['String']['input'];
  type: CustomerType;
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

export type CreateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  /** Existing seeded Permission keys to grant this Role — a Role must retain at least one (docs/domain-model.md § Role). Creating new Permission definitions is out of v1 scope. */
  permissionKeys: Array<Scalars['String']['input']>;
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

/** A buyer — an individual or organization (docs/domain-model.md § Customer). */
export type Customer = {
  __typename?: 'Customer';
  addresses: Array<CustomerAddress>;
  /** Buyer-contact Users belonging to this Customer (User.customerId) — the "assigned users" tab; not a separate account-manager concept. */
  assignedUsers: Array<CustomerUser>;
  billingEmail: Scalars['String']['output'];
  /** Populated only when fetched via customerById — see that type's own description. */
  billingSummary?: Maybe<CustomerBillingSummary>;
  createdAt: Scalars['DateTime']['output'];
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status: CustomerStatus;
  type: CustomerType;
  updatedAt: Scalars['DateTime']['output'];
};

/** One of a Customer's addresses (docs/domain-model.md § Address). `ownerType`/`customerId` are omitted — implied by the parent Customer this is nested under. */
export type CustomerAddress = {
  __typename?: 'CustomerAddress';
  city: Scalars['String']['output'];
  country: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isDefault: Scalars['Boolean']['output'];
  line1: Scalars['String']['output'];
  line2?: Maybe<Scalars['String']['output']>;
  postalCode: Scalars['String']['output'];
  state: Scalars['String']['output'];
  type: AddressType;
};

/** Aggregated across all of this Customer's Orders/Invoices. Computed only by `customerById` — the `customers` list intentionally omits it (CustomerOutput.billingSummary is null there) to avoid an aggregate query per row. */
export type CustomerBillingSummary = {
  __typename?: 'CustomerBillingSummary';
  totalInvoiced: Scalars['Decimal']['output'];
  totalOrders: Scalars['Int']['output'];
  /** Sum of amountDue on invoices not yet fully settled (ISSUED or PARTIALLY_PAID). */
  totalOutstanding: Scalars['Decimal']['output'];
};

export type CustomerConnection = {
  __typename?: 'CustomerConnection';
  edges: Array<CustomerEdge>;
  pageInfo: PageInfo;
};

export type CustomerEdge = {
  __typename?: 'CustomerEdge';
  cursor: Scalars['String']['output'];
  node: Customer;
};

export type CustomerFilterInput = {
  /** Free-text match against the display name and billing email. */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<CustomerStatus>;
};

/** Fields the customer list can be sorted by. */
export enum CustomerSortField {
  CreatedAt = 'CREATED_AT',
  DisplayName = 'DISPLAY_NAME'
}

export type CustomerSortInput = {
  direction: SortDirection;
  field: CustomerSortField;
};

/** Active or Suspended (docs/domain-model.md § Customer Lifecycle). There is no hard-delete status — Customers are anonymized, never removed, per the same doc. */
export enum CustomerStatus {
  Active = 'ACTIVE',
  Suspended = 'SUSPENDED'
}

/** Individual buyer vs. buyer organization (docs/domain-model.md § Customer). */
export enum CustomerType {
  Individual = 'INDIVIDUAL',
  Organization = 'ORGANIZATION'
}

/** A buyer-contact User belonging to this Customer (the existing `User.customerId` relation) — not a separate account-manager assignment (docs/domain-model.md § User Ownership). */
export type CustomerUser = {
  __typename?: 'CustomerUser';
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status: UserStatus;
};

/** A point-in-time Customer count snapshot for the scoped Partner(s), broken down by status and type. No date range or trend field — SM-330's own ticket flagged "new customers over time"/"top customers by spend" as separate, larger scope than this first slice, which mirrors the Orders/Notification Activity report shape. */
export type CustomersReport = {
  __typename?: 'CustomersReport';
  statusBreakdown: Array<CustomersReportStatusBreakdown>;
  totalCustomers: Scalars['Int']['output'];
  typeBreakdown: Array<CustomersReportTypeBreakdown>;
};

export type CustomersReportFilterInput = {
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
};

/** Customer count for a single CustomerStatus. */
export type CustomersReportStatusBreakdown = {
  __typename?: 'CustomersReportStatusBreakdown';
  count: Scalars['Int']['output'];
  status: CustomerStatus;
};

/** Customer count for a single CustomerType. */
export type CustomersReportTypeBreakdown = {
  __typename?: 'CustomersReportTypeBreakdown';
  count: Scalars['Int']['output'];
  type: CustomerType;
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

/** An inclusive [from, to] date range used to scope a report to a period. */
export type DateRangeInput = {
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
};

export type ExportReportInput = {
  /** Ignored for a BILLING_REPORTS, INVENTORY, or CUSTOMERS export. Omitted = all time. */
  dateRange?: InputMaybe<DateRangeInput>;
  format: ReportExportFormat;
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  reportType: ReportExportType;
};

export type GenerateBillingReportInput = {
  /** Required for an Admin caller (there is no "generate for all partners" bulk operation); ignored for a Partner caller, whose own partnerId always wins. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  periodEnd: Scalars['DateTime']['input'];
  periodStart: Scalars['DateTime']['input'];
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

/** A point-in-time inventory snapshot for the scoped Partner(s) — no date range, unlike every other report, since stock levels aren't a historical ledger. */
export type InventoryReport = {
  __typename?: 'InventoryReport';
  lowStockCount: Scalars['Int']['output'];
  lowStockItems: InventoryReportItemConnection;
  totalOnHand: Scalars['Int']['output'];
  totalReserved: Scalars['Int']['output'];
  totalVariants: Scalars['Int']['output'];
};

export type InventoryReportFilterInput = {
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
};

/** A single low-stock Product Variant: quantityOnHand < reorderThreshold (docs/domain-model.md § Inventory). Variants with no reorderThreshold set never appear here — a data-completeness gap, not a bug (see the plan's Risks section). */
export type InventoryReportItem = {
  __typename?: 'InventoryReportItem';
  partnerId: Scalars['ID']['output'];
  productTitle: Scalars['String']['output'];
  productVariantId: Scalars['ID']['output'];
  quantityOnHand: Scalars['Int']['output'];
  quantityReserved: Scalars['Int']['output'];
  reorderThreshold?: Maybe<Scalars['Int']['output']>;
  sku: Scalars['String']['output'];
};

export type InventoryReportItemConnection = {
  __typename?: 'InventoryReportItemConnection';
  edges: Array<InventoryReportItemEdge>;
  pageInfo: PageInfo;
};

export type InventoryReportItemEdge = {
  __typename?: 'InventoryReportItemEdge';
  cursor: Scalars['String']['output'];
  node: InventoryReportItem;
};

export type InviteUserInput = {
  /** Required when ownerType is CUSTOMER; must be null otherwise. */
  customerId?: InputMaybe<Scalars['ID']['input']>;
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  /** Which organization, if any, this User acts on behalf of. NONE for platform staff; PARTNER/CUSTOMER requires the matching partnerId/customerId (docs/domain-model.md § User). */
  ownerType: UserOwnerType;
  /** Required when ownerType is PARTNER; must be null otherwise. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  /** Roles to grant the invited User — at least one. Granting the Admin role requires the caller to already hold it (docs/authorization.md § User Role Assignment Guardrails). */
  roleIds: Array<Scalars['ID']['input']>;
};

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
  /** Reactivates a suspended Customer within the caller's scope. */
  activateCustomer: Customer;
  /** Adds an address to a Customer within the caller's scope. */
  addCustomerAddress: CustomerAddress;
  /** Adjusts a ProductVariant's stock on hand and returns the updated Variant. */
  adjustInventory: ProductVariant;
  /** Suspends a Customer within the caller's scope (soft archive, reversible via activateCustomer). */
  archiveCustomer: Customer;
  /** Transitions a Product owned by the caller to ARCHIVED status. */
  archiveProduct: Product;
  /** Soft-deletes a ProductVariant. Rejected if it is the Product's default Variant or its only remaining Variant. */
  archiveProductVariant: ProductVariant;
  /** Soft-archives a custom Role (prevents new assignment; does not strip existing grants). Rejected for a system Role (Admin/Partner/Customer). */
  archiveRole: Role;
  /** Grants a Role to a User. A caller can never assign a role to themselves, and granting the Admin role requires the caller to already hold it (docs/authorization.md § User Role Assignment Guardrails). */
  assignUserRole: User;
  /** Cancels an Order (caller's own order from DRAFT/CONFIRMED; vendor Partner/Admin only from PROCESSING). Releases any reserved inventory. */
  cancelOrder: Order;
  /** Creates a new Customer. Admin-only — see CustomersService.createCustomer. */
  createCustomer: Customer;
  /** Places a new Order in DRAFT status for the caller (Customer: self; Partner/Admin: on behalf of a specified customerId). No inventory effect yet — reservation happens when the order is confirmed via updateOrderStatus. */
  createOrder: Order;
  /** Creates a Product under the caller's own Partner. */
  createProduct: Product;
  /** Adds a ProductVariant to a Product owned by the caller. */
  createProductVariant: ProductVariant;
  /** Creates a custom Role granted the given existing Permission keys. Does not create new Permission definitions (out of v1 scope, docs/domain-model.md § Permission). */
  createRole: Role;
  /** Soft-deactivates an address belonging to a Customer within the caller's scope (isActive: false — addresses are never hard-deleted). */
  deactivateCustomerAddress: CustomerAddress;
  /** GENERATED → FINALIZED (docs/domain-model.md § Billing Report lifecycle). */
  finalizeBillingReport: BillingReport;
  /** Generates a BillingReport for a Partner/period, reconciling gross revenue/commission/net payout from the Invoice ledger. Rejects an overlapping period (any Partner-scoped period that intersects an existing one) with CONFLICT. */
  generateBillingReport: BillingReport;
  /** Invites a new User: provisions a Keycloak identity (set-password + verify-email) and creates a local INVITED row with the requested roles. Idempotent on email. Granting the Admin role requires the caller to already hold it (docs/authorization.md § User Role Assignment Guardrails). */
  inviteUser: User;
  /** Marks every UNREAD notification for the caller as READ; returns the count updated. */
  markAllNotificationsRead: Scalars['Int']['output'];
  /** FINALIZED → PAID_OUT (docs/domain-model.md § Billing Report lifecycle). */
  markBillingReportPaidOut: BillingReport;
  /** Marks one of the caller's own notifications READ. Throws NOT_FOUND on a missing or out-of-scope id. Idempotent — already-READ is a no-op. */
  markNotificationRead: Notification;
  /** Reactivates a suspended User. */
  reactivateUser: User;
  /** Records a Payment against an Invoice (v1 has no live payment gateway — "recorded, not processed", per docs/roadmap.md). Idempotent on input.idempotencyKey: a retry with the same key returns the original Payment rather than creating a duplicate. */
  recordPayment: Payment;
  /** Removes a Role from a User. A caller can never remove a role from themselves, and the platform's last remaining Admin can never have that role removed (docs/authorization.md § User Role Assignment Guardrails). */
  removeUserRole: User;
  /** Triggers Keycloak's hosted password-reset email for an active User. The application never sees, stores, or validates a password (docs/security.md); only an ACTIVE user can be reset (INVITED/SUSPENDED are rejected). */
  sendPasswordResetEmail: Scalars['Boolean']['output'];
  /** Marks a ProductVariant as its Product's default, unsetting any previous default. */
  setDefaultProductVariant: ProductVariant;
  /** Suspends a User (soft, reversible via reactivateUser). A caller can never suspend themselves, and the platform's last remaining active Admin can never be suspended (docs/authorization.md § User Role Assignment Guardrails). */
  suspendUser: User;
  /** Updates a Customer within the caller's scope. */
  updateCustomer: Customer;
  /** Updates an address belonging to a Customer within the caller's scope. */
  updateCustomerAddress: CustomerAddress;
  /** Transitions an Order to a new status per the allowed transition matrix (docs/authorization.md § Orders). Rejects any other requested transition as invalid. */
  updateOrderStatus: Order;
  /** Updates a Product owned by the caller. */
  updateProduct: Product;
  /** Updates a ProductVariant owned by the caller. */
  updateProductVariant: ProductVariant;
  /** Replaces a Role's entire granted-Permission set. Rejected for a system Role (Admin/Partner/Customer). */
  updateRolePermissions: Role;
  /** Voids a DRAFT/ISSUED Invoice with zero recorded Payments (docs/domain-model.md § Invoice). */
  voidInvoice: Invoice;
};


export type MutationActivateCustomerArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAddCustomerAddressArgs = {
  input: AddCustomerAddressInput;
};


export type MutationAdjustInventoryArgs = {
  input: AdjustInventoryInput;
};


export type MutationArchiveCustomerArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveProductArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveProductVariantArgs = {
  id: Scalars['ID']['input'];
};


export type MutationArchiveRoleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAssignUserRoleArgs = {
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationCancelOrderArgs = {
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateCustomerArgs = {
  input: CreateCustomerInput;
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


export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};


export type MutationDeactivateCustomerAddressArgs = {
  id: Scalars['ID']['input'];
};


export type MutationFinalizeBillingReportArgs = {
  id: Scalars['ID']['input'];
};


export type MutationGenerateBillingReportArgs = {
  input: GenerateBillingReportInput;
};


export type MutationInviteUserArgs = {
  input: InviteUserInput;
};


export type MutationMarkBillingReportPaidOutArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMarkNotificationReadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationReactivateUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRecordPaymentArgs = {
  input: CreatePaymentInput;
};


export type MutationRemoveUserRoleArgs = {
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationSendPasswordResetEmailArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSetDefaultProductVariantArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSuspendUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateCustomerArgs = {
  input: UpdateCustomerInput;
};


export type MutationUpdateCustomerAddressArgs = {
  input: UpdateCustomerAddressInput;
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


export type MutationUpdateRolePermissionsArgs = {
  input: UpdateRolePermissionsInput;
};


export type MutationVoidInvoiceArgs = {
  id: Scalars['ID']['input'];
};

/** A recipient-owned, event-sourced notification (docs/domain-model.md § Notification). Never written directly by a resolver — only by NotificationEventsListener reacting to Orders/Billing/Customer-Management domain events. */
export type Notification = {
  __typename?: 'Notification';
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  entityId?: Maybe<Scalars['ID']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  readAt?: Maybe<Scalars['DateTime']['output']>;
  status: NotificationStatus;
  title: Scalars['String']['output'];
  type: NotificationType;
  updatedAt: Scalars['DateTime']['output'];
};

/** Historical Notification volume for the scoped Partner's staff recipients, regardless of current recipient status/deletedAt — a report reflects what happened, not who's still active today (unlike NotificationsService.notifyPartnerUsers' fan-out filter). */
export type NotificationActivityReport = {
  __typename?: 'NotificationActivityReport';
  readCount: Scalars['Int']['output'];
  totalNotifications: Scalars['Int']['output'];
  typeBreakdown: Array<NotificationActivityTypeBreakdown>;
  unreadCount: Scalars['Int']['output'];
};

export type NotificationActivityReportFilterInput = {
  /** Scopes to Notification.createdAt within this range. Omitted = all time. */
  dateRange?: InputMaybe<DateRangeInput>;
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
};

/** Notification count for a single NotificationType within the scoped period. */
export type NotificationActivityTypeBreakdown = {
  __typename?: 'NotificationActivityTypeBreakdown';
  count: Scalars['Int']['output'];
  type: NotificationType;
};

export type NotificationConnection = {
  __typename?: 'NotificationConnection';
  edges: Array<NotificationEdge>;
  pageInfo: PageInfo;
};

export type NotificationEdge = {
  __typename?: 'NotificationEdge';
  cursor: Scalars['String']['output'];
  node: Notification;
};

export type NotificationFilterInput = {
  status?: InputMaybe<NotificationStatus>;
};

/** UNREAD until the recipient marks it (or all of theirs) read. */
export enum NotificationStatus {
  Read = 'READ',
  Unread = 'UNREAD'
}

/** The domain event that produced this Notification. */
export enum NotificationType {
  CustomerActivated = 'CUSTOMER_ACTIVATED',
  CustomerArchived = 'CUSTOMER_ARCHIVED',
  InvoiceGenerated = 'INVOICE_GENERATED',
  OrderCancelled = 'ORDER_CANCELLED',
  OrderCompleted = 'ORDER_COMPLETED',
  OrderConfirmed = 'ORDER_CONFIRMED',
  OrderCreated = 'ORDER_CREATED',
  PaymentRecorded = 'PAYMENT_RECORDED',
  UserInvited = 'USER_INVITED',
  UserReactivated = 'USER_REACTIVATED',
  UserSuspended = 'USER_SUSPENDED'
}

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

/** Order-volume summary for the scoped Partner(s)/period. totalRevenue/averageOrderValue exclude CANCELLED orders (a cancelled order was never fulfilled revenue). */
export type OrdersReport = {
  __typename?: 'OrdersReport';
  averageOrderValue: Scalars['Decimal']['output'];
  statusBreakdown: Array<OrdersReportStatusBreakdown>;
  totalOrders: Scalars['Int']['output'];
  totalRevenue: Scalars['Decimal']['output'];
};

export type OrdersReportFilterInput = {
  /** Scopes to Order.createdAt within this range. Omitted = all time. */
  dateRange?: InputMaybe<DateRangeInput>;
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
};

/** Order count for a single OrderStatus within the scoped period. */
export type OrdersReportStatusBreakdown = {
  __typename?: 'OrdersReportStatusBreakdown';
  count: Scalars['Int']['output'];
  status: OrderStatus;
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

/** A single seeded capability key (docs/authorization.md § The Seeded Catalog). Read-only — permissions are seeded/managed by the platform, not created ad hoc through the UI in v1 (docs/domain-model.md § Permission). */
export type Permission = {
  __typename?: 'Permission';
  description?: Maybe<Scalars['String']['output']>;
  domain: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
};

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

/** Units-sold/revenue ranking for a single Product Variant within the scoped period. "Sold" excludes CANCELLED orders (same convention as OrdersReport). */
export type ProductPerformance = {
  __typename?: 'ProductPerformance';
  partnerId: Scalars['ID']['output'];
  productTitle: Scalars['String']['output'];
  productVariantId: Scalars['ID']['output'];
  revenue: Scalars['Decimal']['output'];
  sku: Scalars['String']['output'];
  unitsSold: Scalars['Int']['output'];
};

export type ProductPerformanceConnection = {
  __typename?: 'ProductPerformanceConnection';
  edges: Array<ProductPerformanceEdge>;
  pageInfo: PageInfo;
};

export type ProductPerformanceEdge = {
  __typename?: 'ProductPerformanceEdge';
  cursor: Scalars['String']['output'];
  node: ProductPerformance;
};

export type ProductPerformanceFilterInput = {
  /** Scopes to Order.createdAt within this range. Omitted = all time. */
  dateRange?: InputMaybe<DateRangeInput>;
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
};

/** Fields the product performance ranking can be sorted by. Defaults to REVENUE desc. */
export enum ProductPerformanceSortField {
  Revenue = 'REVENUE',
  UnitsSold = 'UNITS_SOLD'
}

export type ProductPerformanceSortInput = {
  direction: SortDirection;
  field: ProductPerformanceSortField;
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
  /** A single billing report by id, scoped to the caller. Throws NOT_FOUND rather than returning null on a missing or out-of-scope id. */
  billingReport: BillingReport;
  /** A page of the caller's visible billing reports (Admin: all; Partner: own). */
  billingReports: BillingReportConnection;
  /** Billing module status */
  billingStatus: Scalars['String']['output'];
  /** Catalog module status */
  catalogStatus: Scalars['String']['output'];
  /** Active categories in the global taxonomy, flat. */
  categories: Array<Category>;
  /** A Customer's activity timeline, most recent first. */
  customerAuditLog: Array<AuditLogEntry>;
  /** A single customer by id, scoped to the caller, including its billing summary. Throws NOT_FOUND rather than returning null on a missing or out-of-scope id. */
  customerById: Customer;
  /** A page of the caller's visible customers (Admin: all; Partner: only customers with at least one Order placed with that Partner). */
  customers: CustomerConnection;
  /** A point-in-time Customer count snapshot for the scoped Partner(s), by status and type. */
  customersReport: CustomersReport;
  /** Customers module status */
  customersStatus: Scalars['String']['output'];
  /** Summary statistics for the dashboard overview. */
  dashboardStats: DashboardStats;
  /** Dashboard module status */
  dashboardStatus: Scalars['String']['output'];
  /** A CSV export of the caller's visible customers, matching the given filter. */
  exportCustomersCsv: Scalars['String']['output'];
  /** A CSV export of the caller's visible invoices, matching the given filter. */
  exportInvoicesCsv: Scalars['String']['output'];
  /** Renders the requested report as a raw CSV string, matching the given filter. EXCEL format is a not-yet-implemented placeholder (throws BAD_USER_INPUT today). */
  exportReport: Scalars['String']['output'];
  /** A point-in-time inventory snapshot for the scoped Partner(s), including a paginated low-stock item connection. */
  inventoryReport: InventoryReport;
  /** A single invoice by id, scoped to the caller. Throws NOT_FOUND rather than returning null on a missing or out-of-scope id. */
  invoice: Invoice;
  /** A base64-encoded PDF rendering of a single invoice by id. */
  invoicePdf: Scalars['String']['output'];
  /** A page of the caller's visible invoices (Admin: all; Partner: own as vendor). */
  invoices: InvoiceConnection;
  /** The authenticated caller and their resolved roles/permissions. */
  me: CurrentUser;
  /** Historical Notification volume for the scoped Partner's staff recipients, by type/status. */
  notificationActivityReport: NotificationActivityReport;
  /** A page of the caller's own notifications, most recent first. */
  notifications: NotificationConnection;
  /** A single order by id, scoped to the caller. Throws NOT_FOUND rather than returning null on a missing or out-of-scope id. */
  order: Order;
  /** A page of the caller's visible orders (Admin: all; Partner: own as vendor; Customer: own as buyer). */
  orders: OrderConnection;
  /** Order-volume summary + status breakdown for the scoped Partner(s)/period. */
  ordersReport: OrdersReport;
  /** Orders module status */
  ordersStatus: Scalars['String']['output'];
  /** A single product by id, scoped to the caller (Admin: any; Partner: own). Throws NOT_FOUND rather than returning null on a missing or out-of-scope id. */
  productById: Product;
  /** Units-sold/revenue ranking of Product Variants for the scoped Partner(s)/period. Uses an offset-encoded cursor (see ProductPerformanceConnectionOutput's doc comment) since Prisma's groupBy has no cursor support. */
  productPerformanceReport: ProductPerformanceConnection;
  /** A page of the caller's visible products (Admin: all; Partner: own). */
  products: ProductConnection;
  /** KPI + trend summary for the Reports landing page. A dedicated query — never touches dashboardStats (the M11 marketplace-wide overview card). */
  reportsDashboard: ReportsDashboard;
  /** Invoice-ledger-derived revenue summary + trend for the scoped Partner(s)/period. */
  revenueReport: RevenueReport;
  /** Every assignable Role with its granted Permissions. */
  roles: Array<Role>;
  /** The caller's own unread notification count. */
  unreadNotificationCount: Scalars['Int']['output'];
  /** A User's activity timeline, most recent first. */
  userAuditLog: Array<AuditLogEntry>;
  /** A single user by id. Throws NOT_FOUND rather than returning null on a missing id. */
  userById: User;
  /** A page of platform users (Admin-only global resource — no ownership scoping, docs/authorization.md § Users row). */
  users: UserConnection;
  /** Users module status */
  usersStatus: Scalars['String']['output'];
};


export type QueryBillingReportArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBillingReportsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<BillingReportFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<BillingReportSortInput>;
};


export type QueryCustomerAuditLogArgs = {
  customerId: Scalars['ID']['input'];
};


export type QueryCustomerByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCustomersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<CustomerFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<CustomerSortInput>;
};


export type QueryCustomersReportArgs = {
  filter?: InputMaybe<CustomersReportFilterInput>;
};


export type QueryExportCustomersCsvArgs = {
  filter?: InputMaybe<CustomerFilterInput>;
};


export type QueryExportInvoicesCsvArgs = {
  filter?: InputMaybe<InvoiceFilterInput>;
};


export type QueryExportReportArgs = {
  input: ExportReportInput;
};


export type QueryInventoryReportArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<InventoryReportFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
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


export type QueryNotificationActivityReportArgs = {
  filter?: InputMaybe<NotificationActivityReportFilterInput>;
};


export type QueryNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NotificationFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
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


export type QueryOrdersReportArgs = {
  filter?: InputMaybe<OrdersReportFilterInput>;
};


export type QueryProductByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProductPerformanceReportArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProductPerformanceFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<ProductPerformanceSortInput>;
};


export type QueryProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProductFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<ProductSortInput>;
};


export type QueryReportsDashboardArgs = {
  filter?: InputMaybe<ReportsDashboardFilterInput>;
};


export type QueryRevenueReportArgs = {
  filter?: InputMaybe<RevenueReportFilterInput>;
};


export type QueryUserAuditLogArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryUserByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UserFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<UserSortInput>;
};

/** CSV is fully implemented today; EXCEL is a not-yet-implemented placeholder. */
export enum ReportExportFormat {
  Csv = 'CSV',
  Excel = 'EXCEL'
}

/** Which report exportReport should render. */
export enum ReportExportType {
  BillingReports = 'BILLING_REPORTS',
  Customers = 'CUSTOMERS',
  Inventory = 'INVENTORY',
  NotificationActivity = 'NOTIFICATION_ACTIVITY',
  Orders = 'ORDERS',
  ProductPerformance = 'PRODUCT_PERFORMANCE',
  Revenue = 'REVENUE'
}

/** KPI + trend summary for the Reports landing page. A dedicated query — never reuses or touches dashboardStats (the M11 marketplace-wide overview card), which stays untouched. */
export type ReportsDashboard = {
  __typename?: 'ReportsDashboard';
  /** Same formula as RevenueReport.totalGrossRevenue. */
  grossRevenue: Scalars['Decimal']['output'];
  /** Same definition as InventoryReport.lowStockCount. */
  lowStockCount: Scalars['Int']['output'];
  /** Same formula as OrdersReport.totalRevenue. */
  ordersRevenue: Scalars['Decimal']['output'];
  revenueTrend: Array<RevenueReportBucket>;
  totalOrders: Scalars['Int']['output'];
};

export type ReportsDashboardFilterInput = {
  /** Omitted = all time. */
  dateRange?: InputMaybe<DateRangeInput>;
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
};

/** Trend bucket size for revenueReport.trend. Defaults to MONTH. */
export enum RevenueBucketGranularity {
  Day = 'DAY',
  Month = 'MONTH',
  Week = 'WEEK'
}

/** Invoice-ledger-derived revenue summary + trend for the scoped Partner(s)/period (same aggregation formula as BillingReport, computed on read rather than persisted). */
export type RevenueReport = {
  __typename?: 'RevenueReport';
  invoiceCount: Scalars['Int']['output'];
  totalCommission: Scalars['Decimal']['output'];
  totalGrossRevenue: Scalars['Decimal']['output'];
  totalNetPayout: Scalars['Decimal']['output'];
  trend: Array<RevenueReportBucket>;
};

/** One point in the revenue trend series, bucketed by the requested granularity. */
export type RevenueReportBucket = {
  __typename?: 'RevenueReportBucket';
  bucketEnd: Scalars['DateTime']['output'];
  bucketStart: Scalars['DateTime']['output'];
  grossRevenue: Scalars['Decimal']['output'];
  invoiceCount: Scalars['Int']['output'];
};

export type RevenueReportFilterInput = {
  /** Scopes to Invoice.issuedAt within this range. Omitted = all time. */
  dateRange?: InputMaybe<DateRangeInput>;
  /** Defaults to MONTH. */
  granularity?: InputMaybe<RevenueBucketGranularity>;
  /** Narrows within the caller's own scope; only Admin can broaden beyond it. */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
};

/** A named bundle of Permissions a User can be assigned (docs/domain-model.md § Role). System roles (Admin/Partner/Customer) are seeded and protected from rename/delete/permission edits. */
export type Role = {
  __typename?: 'Role';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isSystemRole: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type UpdateCustomerAddressInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  /** Marks this address as the Customer's default, unsetting any existing default. */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  line1?: InputMaybe<Scalars['String']['input']>;
  line2?: InputMaybe<Scalars['String']['input']>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<AddressType>;
};

export type UpdateCustomerInput = {
  billingEmail?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  type?: InputMaybe<CustomerType>;
};

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

export type UpdateRolePermissionsInput = {
  id: Scalars['ID']['input'];
  /** Replaces the Role's entire granted-Permission set — a Role must retain at least one (docs/domain-model.md § Role). Rejected for a system Role (Admin/Partner/Customer). */
  permissionKeys: Array<Scalars['String']['input']>;
};

/** A platform user — Admin, Partner staff, or Customer buyer-contact (docs/domain-model.md § User). Sprint 3 (User Management, Jira Epic SM-331) — not tied to a docs/milestones.md milestone. */
export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  customerId?: Maybe<Scalars['ID']['output']>;
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ownerType: UserOwnerType;
  partnerId?: Maybe<Scalars['ID']['output']>;
  roles: Array<Role>;
  status: UserStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type UserConnection = {
  __typename?: 'UserConnection';
  edges: Array<UserEdge>;
  pageInfo: PageInfo;
};

export type UserEdge = {
  __typename?: 'UserEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type UserFilterInput = {
  ownerType?: InputMaybe<UserOwnerType>;
  /** Free-text match against email and full name. */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<UserStatus>;
};

/** Which organization, if any, this User acts on behalf of (docs/domain-model.md § User). */
export enum UserOwnerType {
  Customer = 'CUSTOMER',
  None = 'NONE',
  Partner = 'PARTNER'
}

/** Fields the user list can be sorted by. */
export enum UserSortField {
  CreatedAt = 'CREATED_AT',
  Email = 'EMAIL',
  FullName = 'FULL_NAME'
}

export type UserSortInput = {
  direction: SortDirection;
  field: UserSortField;
};

/** A User's lifecycle status (docs/domain-model.md § User). First GraphQL exposure of this enum — introduced for the Customer Management "assigned users" tab. */
export enum UserStatus {
  Active = 'ACTIVE',
  Deactivated = 'DEACTIVATED',
  Invited = 'INVITED',
  Suspended = 'SUSPENDED'
}

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

export type ActivateCustomerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ActivateCustomerMutation = { __typename?: 'Mutation', activateCustomer: { __typename?: 'Customer', id: string, status: CustomerStatus } };

export type AddCustomerAddressMutationVariables = Exact<{
  input: AddCustomerAddressInput;
}>;


export type AddCustomerAddressMutation = { __typename?: 'Mutation', addCustomerAddress: { __typename?: 'CustomerAddress', id: string } };

export type ArchiveCustomerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchiveCustomerMutation = { __typename?: 'Mutation', archiveCustomer: { __typename?: 'Customer', id: string, status: CustomerStatus } };

export type CreateCustomerMutationVariables = Exact<{
  input: CreateCustomerInput;
}>;


export type CreateCustomerMutation = { __typename?: 'Mutation', createCustomer: { __typename?: 'Customer', id: string } };

export type DeactivateCustomerAddressMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeactivateCustomerAddressMutation = { __typename?: 'Mutation', deactivateCustomerAddress: { __typename?: 'CustomerAddress', id: string } };

export type ExportCustomersCsvQueryVariables = Exact<{
  filter?: InputMaybe<CustomerFilterInput>;
}>;


export type ExportCustomersCsvQuery = { __typename?: 'Query', exportCustomersCsv: string };

export type GetCustomerAuditLogQueryVariables = Exact<{
  customerId: Scalars['ID']['input'];
}>;


export type GetCustomerAuditLogQuery = { __typename?: 'Query', customerAuditLog: Array<{ __typename?: 'AuditLogEntry', id: string, action: string, entityType: string, entityId: string, metadata?: string | null, occurredAt: any, actorId: string, actorName: string, actorEmail: string }> };

export type GetCustomerByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetCustomerByIdQuery = { __typename?: 'Query', customerById: { __typename?: 'Customer', id: string, displayName: string, type: CustomerType, status: CustomerStatus, billingEmail: string, createdAt: any, updatedAt: any, addresses: Array<{ __typename?: 'CustomerAddress', id: string, type: AddressType, line1: string, line2?: string | null, city: string, state: string, postalCode: string, country: string, isDefault: boolean }>, assignedUsers: Array<{ __typename?: 'CustomerUser', id: string, email: string, fullName: string, status: UserStatus }>, billingSummary?: { __typename?: 'CustomerBillingSummary', totalOrders: number, totalInvoiced: string, totalOutstanding: string } | null } };

export type GetCustomerOrdersQueryVariables = Exact<{
  customerId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetCustomerOrdersQuery = { __typename?: 'Query', orders: { __typename?: 'OrderConnection', edges: Array<{ __typename?: 'OrderEdge', cursor: string, node: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: string, placedAt?: any | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type GetCustomersQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<CustomerFilterInput>;
  sort?: InputMaybe<CustomerSortInput>;
}>;


export type GetCustomersQuery = { __typename?: 'Query', customers: { __typename?: 'CustomerConnection', edges: Array<{ __typename?: 'CustomerEdge', cursor: string, node: { __typename?: 'Customer', id: string, displayName: string, type: CustomerType, status: CustomerStatus, billingEmail: string, createdAt: any } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type UpdateCustomerMutationVariables = Exact<{
  input: UpdateCustomerInput;
}>;


export type UpdateCustomerMutation = { __typename?: 'Mutation', updateCustomer: { __typename?: 'Customer', id: string } };

export type UpdateCustomerAddressMutationVariables = Exact<{
  input: UpdateCustomerAddressInput;
}>;


export type UpdateCustomerAddressMutation = { __typename?: 'Mutation', updateCustomerAddress: { __typename?: 'CustomerAddress', id: string } };

export type DashboardStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardStatsQuery = { __typename?: 'Query', dashboardStats: { __typename?: 'DashboardStats', totalProducts: number, totalOrders: number, totalCustomers: number } };

export type GetNotificationsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NotificationFilterInput>;
}>;


export type GetNotificationsQuery = { __typename?: 'Query', notifications: { __typename?: 'NotificationConnection', edges: Array<{ __typename?: 'NotificationEdge', cursor: string, node: { __typename?: 'Notification', id: string, type: NotificationType, title: string, body: string, entityType?: string | null, entityId?: string | null, status: NotificationStatus, readAt?: any | null, createdAt: any } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type GetUnreadNotificationCountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUnreadNotificationCountQuery = { __typename?: 'Query', unreadNotificationCount: number };

export type MarkAllNotificationsReadMutationVariables = Exact<{ [key: string]: never; }>;


export type MarkAllNotificationsReadMutation = { __typename?: 'Mutation', markAllNotificationsRead: number };

export type MarkNotificationReadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type MarkNotificationReadMutation = { __typename?: 'Mutation', markNotificationRead: { __typename?: 'Notification', id: string, status: NotificationStatus, readAt?: any | null } };

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

export type ExportReportQueryVariables = Exact<{
  input: ExportReportInput;
}>;


export type ExportReportQuery = { __typename?: 'Query', exportReport: string };

export type FinalizeBillingReportMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type FinalizeBillingReportMutation = { __typename?: 'Mutation', finalizeBillingReport: { __typename?: 'BillingReport', id: string, status: BillingReportStatus, updatedAt: any } };

export type GenerateBillingReportMutationVariables = Exact<{
  input: GenerateBillingReportInput;
}>;


export type GenerateBillingReportMutation = { __typename?: 'Mutation', generateBillingReport: { __typename?: 'BillingReport', id: string, partnerId: string, periodStart: any, periodEnd: any, status: BillingReportStatus, grossRevenue: string, commissionAmount: string, netPayout: string, generatedAt: any, createdAt: any, updatedAt: any } };

export type GetBillingReportQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetBillingReportQuery = { __typename?: 'Query', billingReport: { __typename?: 'BillingReport', id: string, partnerId: string, periodStart: any, periodEnd: any, status: BillingReportStatus, grossRevenue: string, commissionAmount: string, netPayout: string, generatedAt: any, createdAt: any, updatedAt: any } };

export type GetBillingReportsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<BillingReportFilterInput>;
  sort?: InputMaybe<BillingReportSortInput>;
}>;


export type GetBillingReportsQuery = { __typename?: 'Query', billingReports: { __typename?: 'BillingReportConnection', edges: Array<{ __typename?: 'BillingReportEdge', cursor: string, node: { __typename?: 'BillingReport', id: string, partnerId: string, periodStart: any, periodEnd: any, status: BillingReportStatus, grossRevenue: string, commissionAmount: string, netPayout: string, generatedAt: any, createdAt: any } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type GetCustomersReportQueryVariables = Exact<{
  filter?: InputMaybe<CustomersReportFilterInput>;
}>;


export type GetCustomersReportQuery = { __typename?: 'Query', customersReport: { __typename?: 'CustomersReport', totalCustomers: number, statusBreakdown: Array<{ __typename?: 'CustomersReportStatusBreakdown', status: CustomerStatus, count: number }>, typeBreakdown: Array<{ __typename?: 'CustomersReportTypeBreakdown', type: CustomerType, count: number }> } };

export type GetInventoryReportQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<InventoryReportFilterInput>;
}>;


export type GetInventoryReportQuery = { __typename?: 'Query', inventoryReport: { __typename?: 'InventoryReport', totalVariants: number, totalOnHand: number, totalReserved: number, lowStockCount: number, lowStockItems: { __typename?: 'InventoryReportItemConnection', edges: Array<{ __typename?: 'InventoryReportItemEdge', cursor: string, node: { __typename?: 'InventoryReportItem', productVariantId: string, productTitle: string, sku: string, partnerId: string, quantityOnHand: number, quantityReserved: number, reorderThreshold?: number | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } } };

export type GetNotificationActivityReportQueryVariables = Exact<{
  filter?: InputMaybe<NotificationActivityReportFilterInput>;
}>;


export type GetNotificationActivityReportQuery = { __typename?: 'Query', notificationActivityReport: { __typename?: 'NotificationActivityReport', totalNotifications: number, readCount: number, unreadCount: number, typeBreakdown: Array<{ __typename?: 'NotificationActivityTypeBreakdown', type: NotificationType, count: number }> } };

export type GetOrdersReportQueryVariables = Exact<{
  filter?: InputMaybe<OrdersReportFilterInput>;
}>;


export type GetOrdersReportQuery = { __typename?: 'Query', ordersReport: { __typename?: 'OrdersReport', totalOrders: number, totalRevenue: string, averageOrderValue: string, statusBreakdown: Array<{ __typename?: 'OrdersReportStatusBreakdown', status: OrderStatus, count: number }> } };

export type GetProductPerformanceReportQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProductPerformanceFilterInput>;
  sort?: InputMaybe<ProductPerformanceSortInput>;
}>;


export type GetProductPerformanceReportQuery = { __typename?: 'Query', productPerformanceReport: { __typename?: 'ProductPerformanceConnection', edges: Array<{ __typename?: 'ProductPerformanceEdge', cursor: string, node: { __typename?: 'ProductPerformance', productVariantId: string, productTitle: string, sku: string, partnerId: string, unitsSold: number, revenue: string } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type GetReportsDashboardQueryVariables = Exact<{
  filter?: InputMaybe<ReportsDashboardFilterInput>;
}>;


export type GetReportsDashboardQuery = { __typename?: 'Query', reportsDashboard: { __typename?: 'ReportsDashboard', grossRevenue: string, ordersRevenue: string, totalOrders: number, lowStockCount: number, revenueTrend: Array<{ __typename?: 'RevenueReportBucket', bucketStart: any, bucketEnd: any, grossRevenue: string, invoiceCount: number }> } };

export type GetRevenueReportQueryVariables = Exact<{
  filter?: InputMaybe<RevenueReportFilterInput>;
}>;


export type GetRevenueReportQuery = { __typename?: 'Query', revenueReport: { __typename?: 'RevenueReport', invoiceCount: number, totalCommission: string, totalGrossRevenue: string, totalNetPayout: string, trend: Array<{ __typename?: 'RevenueReportBucket', bucketStart: any, bucketEnd: any, grossRevenue: string, invoiceCount: number }> } };

export type MarkBillingReportPaidOutMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type MarkBillingReportPaidOutMutation = { __typename?: 'Mutation', markBillingReportPaidOut: { __typename?: 'BillingReport', id: string, status: BillingReportStatus, updatedAt: any } };

export type GetUsersQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UserFilterInput>;
  sort?: InputMaybe<UserSortInput>;
}>;


export type GetUsersQuery = { __typename?: 'Query', users: { __typename?: 'UserConnection', edges: Array<{ __typename?: 'UserEdge', cursor: string, node: { __typename?: 'User', id: string, fullName: string, email: string, status: UserStatus, ownerType: UserOwnerType, createdAt: any } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };


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
export const ActivateCustomerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateCustomer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateCustomer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ActivateCustomerMutation, ActivateCustomerMutationVariables>;
export const AddCustomerAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddCustomerAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddCustomerAddressInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCustomerAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddCustomerAddressMutation, AddCustomerAddressMutationVariables>;
export const ArchiveCustomerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveCustomer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveCustomer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ArchiveCustomerMutation, ArchiveCustomerMutationVariables>;
export const CreateCustomerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCustomer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCustomerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCustomer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateCustomerMutation, CreateCustomerMutationVariables>;
export const DeactivateCustomerAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateCustomerAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateCustomerAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeactivateCustomerAddressMutation, DeactivateCustomerAddressMutationVariables>;
export const ExportCustomersCsvDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportCustomersCsv"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CustomerFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exportCustomersCsv"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}]}]}}]} as unknown as DocumentNode<ExportCustomersCsvQuery, ExportCustomersCsvQueryVariables>;
export const GetCustomerAuditLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCustomerAuditLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customerAuditLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"customerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customerId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"occurredAt"}},{"kind":"Field","name":{"kind":"Name","value":"actorId"}},{"kind":"Field","name":{"kind":"Name","value":"actorName"}},{"kind":"Field","name":{"kind":"Name","value":"actorEmail"}}]}}]}}]} as unknown as DocumentNode<GetCustomerAuditLogQuery, GetCustomerAuditLogQueryVariables>;
export const GetCustomerByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCustomerById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customerById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"billingEmail"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"addresses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"line1"}},{"kind":"Field","name":{"kind":"Name","value":"line2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"billingSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalOrders"}},{"kind":"Field","name":{"kind":"Name","value":"totalInvoiced"}},{"kind":"Field","name":{"kind":"Name","value":"totalOutstanding"}}]}}]}}]}}]} as unknown as DocumentNode<GetCustomerByIdQuery, GetCustomerByIdQueryVariables>;
export const GetCustomerOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCustomerOrders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"customerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customerId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"placedAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetCustomerOrdersQuery, GetCustomerOrdersQueryVariables>;
export const GetCustomersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCustomers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CustomerFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CustomerSortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"billingEmail"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetCustomersQuery, GetCustomersQueryVariables>;
export const UpdateCustomerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCustomer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCustomerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCustomer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateCustomerMutation, UpdateCustomerMutationVariables>;
export const UpdateCustomerAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCustomerAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCustomerAddressInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCustomerAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateCustomerAddressMutation, UpdateCustomerAddressMutationVariables>;
export const DashboardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalProducts"}},{"kind":"Field","name":{"kind":"Name","value":"totalOrders"}},{"kind":"Field","name":{"kind":"Name","value":"totalCustomers"}}]}}]}}]} as unknown as DocumentNode<DashboardStatsQuery, DashboardStatsQueryVariables>;
export const GetNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetNotificationsQuery, GetNotificationsQueryVariables>;
export const GetUnreadNotificationCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUnreadNotificationCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadNotificationCount"}}]}}]} as unknown as DocumentNode<GetUnreadNotificationCountQuery, GetUnreadNotificationCountQueryVariables>;
export const MarkAllNotificationsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllNotificationsRead"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsRead"}}]}}]} as unknown as DocumentNode<MarkAllNotificationsReadMutation, MarkAllNotificationsReadMutationVariables>;
export const MarkNotificationReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNotificationRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNotificationRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]} as unknown as DocumentNode<MarkNotificationReadMutation, MarkNotificationReadMutationVariables>;
export const CancelOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CancelOrderMutation, CancelOrderMutationVariables>;
export const CreateOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrderInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CreateOrderMutation, CreateOrderMutationVariables>;
export const GetOrderByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrderById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"customerId"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"shippingAddressId"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"tax"}},{"kind":"Field","name":{"kind":"Name","value":"shippingCost"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"placedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPriceSnapshot"}},{"kind":"Field","name":{"kind":"Name","value":"lineTotal"}},{"kind":"Field","name":{"kind":"Name","value":"productVariant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"statusHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fromStatus"}},{"kind":"Field","name":{"kind":"Name","value":"toStatus"}},{"kind":"Field","name":{"kind":"Name","value":"changedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrderByIdQuery, GetOrderByIdQueryVariables>;
export const GetOrderableVariantsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrderableVariants"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"50"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"PUBLISHED"}},{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"variants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetOrderableVariantsQuery, GetOrderableVariantsQueryVariables>;
export const GetOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderSortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"customerId"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"placedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrdersQuery, GetOrdersQueryVariables>;
export const UpdateOrderStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrderStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrderStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateOrderStatusMutation, UpdateOrderStatusMutationVariables>;
export const ExportReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExportReportInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exportReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ExportReportQuery, ExportReportQueryVariables>;
export const FinalizeBillingReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FinalizeBillingReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finalizeBillingReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<FinalizeBillingReportMutation, FinalizeBillingReportMutationVariables>;
export const GenerateBillingReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateBillingReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateBillingReportInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateBillingReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"periodStart"}},{"kind":"Field","name":{"kind":"Name","value":"periodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"grossRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"commissionAmount"}},{"kind":"Field","name":{"kind":"Name","value":"netPayout"}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GenerateBillingReportMutation, GenerateBillingReportMutationVariables>;
export const GetBillingReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBillingReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"billingReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"periodStart"}},{"kind":"Field","name":{"kind":"Name","value":"periodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"grossRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"commissionAmount"}},{"kind":"Field","name":{"kind":"Name","value":"netPayout"}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetBillingReportQuery, GetBillingReportQueryVariables>;
export const GetBillingReportsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBillingReports"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BillingReportFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BillingReportSortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"billingReports"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"periodStart"}},{"kind":"Field","name":{"kind":"Name","value":"periodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"grossRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"commissionAmount"}},{"kind":"Field","name":{"kind":"Name","value":"netPayout"}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetBillingReportsQuery, GetBillingReportsQueryVariables>;
export const GetCustomersReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCustomersReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CustomersReportFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customersReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"statusBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"typeBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode<GetCustomersReportQuery, GetCustomersReportQueryVariables>;
export const GetInventoryReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInventoryReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"InventoryReportFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inventoryReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalVariants"}},{"kind":"Field","name":{"kind":"Name","value":"totalOnHand"}},{"kind":"Field","name":{"kind":"Name","value":"totalReserved"}},{"kind":"Field","name":{"kind":"Name","value":"lowStockCount"}},{"kind":"Field","name":{"kind":"Name","value":"lowStockItems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"productTitle"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"quantityOnHand"}},{"kind":"Field","name":{"kind":"Name","value":"quantityReserved"}},{"kind":"Field","name":{"kind":"Name","value":"reorderThreshold"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetInventoryReportQuery, GetInventoryReportQueryVariables>;
export const GetNotificationActivityReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNotificationActivityReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationActivityReportFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationActivityReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalNotifications"}},{"kind":"Field","name":{"kind":"Name","value":"readCount"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"typeBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode<GetNotificationActivityReportQuery, GetNotificationActivityReportQueryVariables>;
export const GetOrdersReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrdersReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrdersReportFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ordersReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalOrders"}},{"kind":"Field","name":{"kind":"Name","value":"totalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"averageOrderValue"}},{"kind":"Field","name":{"kind":"Name","value":"statusBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrdersReportQuery, GetOrdersReportQueryVariables>;
export const GetProductPerformanceReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProductPerformanceReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductPerformanceFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductPerformanceSortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productPerformanceReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"productTitle"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"partnerId"}},{"kind":"Field","name":{"kind":"Name","value":"unitsSold"}},{"kind":"Field","name":{"kind":"Name","value":"revenue"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetProductPerformanceReportQuery, GetProductPerformanceReportQueryVariables>;
export const GetReportsDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetReportsDashboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ReportsDashboardFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reportsDashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"grossRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"ordersRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"totalOrders"}},{"kind":"Field","name":{"kind":"Name","value":"lowStockCount"}},{"kind":"Field","name":{"kind":"Name","value":"revenueTrend"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucketStart"}},{"kind":"Field","name":{"kind":"Name","value":"bucketEnd"}},{"kind":"Field","name":{"kind":"Name","value":"grossRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceCount"}}]}}]}}]}}]} as unknown as DocumentNode<GetReportsDashboardQuery, GetReportsDashboardQueryVariables>;
export const GetRevenueReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRevenueReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RevenueReportFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revenueReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoiceCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalCommission"}},{"kind":"Field","name":{"kind":"Name","value":"totalGrossRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"totalNetPayout"}},{"kind":"Field","name":{"kind":"Name","value":"trend"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucketStart"}},{"kind":"Field","name":{"kind":"Name","value":"bucketEnd"}},{"kind":"Field","name":{"kind":"Name","value":"grossRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceCount"}}]}}]}}]}}]} as unknown as DocumentNode<GetRevenueReportQuery, GetRevenueReportQueryVariables>;
export const MarkBillingReportPaidOutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkBillingReportPaidOut"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markBillingReportPaidOut"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MarkBillingReportPaidOutMutation, MarkBillingReportPaidOutMutationVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserSortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"ownerType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;