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
  /** Mock total customer count — replaced when Orders (M13) ships. */
  totalCustomers: Scalars['Int']['output'];
  /** Mock total order count — replaced when Orders (M13) ships. */
  totalOrders: Scalars['Int']['output'];
  /** Mock total product count — replaced when Catalog (M12) ships. */
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

export type Mutation = {
  __typename?: 'Mutation';
  /** Adjusts a ProductVariant's stock on hand and returns the updated Variant. */
  adjustInventory: ProductVariant;
  /** Transitions a Product owned by the caller to ARCHIVED status. */
  archiveProduct: Product;
  /** Soft-deletes a ProductVariant. Rejected if it is the Product's default Variant or its only remaining Variant. */
  archiveProductVariant: ProductVariant;
  /** Creates a Product under the caller's own Partner. */
  createProduct: Product;
  /** Adds a ProductVariant to a Product owned by the caller. */
  createProductVariant: ProductVariant;
  /** Marks a ProductVariant as its Product's default, unsetting any previous default. */
  setDefaultProductVariant: ProductVariant;
  /** Updates a Product owned by the caller. */
  updateProduct: Product;
  /** Updates a ProductVariant owned by the caller. */
  updateProductVariant: ProductVariant;
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


export type MutationCreateProductArgs = {
  input: CreateProductInput;
};


export type MutationCreateProductVariantArgs = {
  input: CreateProductVariantInput;
};


export type MutationSetDefaultProductVariantArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateProductArgs = {
  input: UpdateProductInput;
};


export type MutationUpdateProductVariantArgs = {
  input: UpdateProductVariantInput;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
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
  /** The authenticated caller and their resolved roles/permissions. */
  me: CurrentUser;
  /** Orders module status */
  ordersStatus: Scalars['String']['output'];
  /** A single product by id, scoped to the caller (Admin: any; Partner: own). Throws NOT_FOUND rather than returning null on a missing or out-of-scope id. */
  productById: Product;
  /** A page of the caller's visible products (Admin: all; Partner: own). */
  products: ProductConnection;
  /** Users module status */
  usersStatus: Scalars['String']['output'];
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


export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
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