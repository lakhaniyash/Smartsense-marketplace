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
    "mutation ArchiveProduct($id: ID!) {\n  archiveProduct(id: $id) {\n    id\n    status\n  }\n}": typeof types.ArchiveProductDocument,
    "mutation CreateProduct($input: CreateProductInput!) {\n  createProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}": typeof types.CreateProductDocument,
    "query GetCategories {\n  categories {\n    id\n    name\n    slug\n    parentCategoryId\n    displayOrder\n  }\n}": typeof types.GetCategoriesDocument,
    "query GetProductById($id: ID!) {\n  productById(id: $id) {\n    id\n    title\n    description\n    brand\n    sku\n    status\n    category {\n      id\n      name\n      slug\n    }\n    createdAt\n    publishedAt\n  }\n}": typeof types.GetProductByIdDocument,
    "query GetProducts($first: Int, $after: String, $filter: ProductFilterInput, $sort: ProductSortInput) {\n  products(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        title\n        sku\n        status\n        category {\n          id\n          name\n        }\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": typeof types.GetProductsDocument,
    "mutation UpdateProduct($input: UpdateProductInput!) {\n  updateProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}": typeof types.UpdateProductDocument,
    "query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}": typeof types.DashboardStatsDocument,
};
const documents: Documents = {
    "query Me {\n  me {\n    id\n    email\n    fullName\n    roles\n    permissions\n  }\n}": types.MeDocument,
    "mutation ArchiveProduct($id: ID!) {\n  archiveProduct(id: $id) {\n    id\n    status\n  }\n}": types.ArchiveProductDocument,
    "mutation CreateProduct($input: CreateProductInput!) {\n  createProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}": types.CreateProductDocument,
    "query GetCategories {\n  categories {\n    id\n    name\n    slug\n    parentCategoryId\n    displayOrder\n  }\n}": types.GetCategoriesDocument,
    "query GetProductById($id: ID!) {\n  productById(id: $id) {\n    id\n    title\n    description\n    brand\n    sku\n    status\n    category {\n      id\n      name\n      slug\n    }\n    createdAt\n    publishedAt\n  }\n}": types.GetProductByIdDocument,
    "query GetProducts($first: Int, $after: String, $filter: ProductFilterInput, $sort: ProductSortInput) {\n  products(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        title\n        sku\n        status\n        category {\n          id\n          name\n        }\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}": types.GetProductsDocument,
    "mutation UpdateProduct($input: UpdateProductInput!) {\n  updateProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}": types.UpdateProductDocument,
    "query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}": types.DashboardStatsDocument,
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
export function gql(source: "mutation ArchiveProduct($id: ID!) {\n  archiveProduct(id: $id) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation ArchiveProduct($id: ID!) {\n  archiveProduct(id: $id) {\n    id\n    status\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation CreateProduct($input: CreateProductInput!) {\n  createProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["mutation CreateProduct($input: CreateProductInput!) {\n  createProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetCategories {\n  categories {\n    id\n    name\n    slug\n    parentCategoryId\n    displayOrder\n  }\n}"): (typeof documents)["query GetCategories {\n  categories {\n    id\n    name\n    slug\n    parentCategoryId\n    displayOrder\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetProductById($id: ID!) {\n  productById(id: $id) {\n    id\n    title\n    description\n    brand\n    sku\n    status\n    category {\n      id\n      name\n      slug\n    }\n    createdAt\n    publishedAt\n  }\n}"): (typeof documents)["query GetProductById($id: ID!) {\n  productById(id: $id) {\n    id\n    title\n    description\n    brand\n    sku\n    status\n    category {\n      id\n      name\n      slug\n    }\n    createdAt\n    publishedAt\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetProducts($first: Int, $after: String, $filter: ProductFilterInput, $sort: ProductSortInput) {\n  products(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        title\n        sku\n        status\n        category {\n          id\n          name\n        }\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"): (typeof documents)["query GetProducts($first: Int, $after: String, $filter: ProductFilterInput, $sort: ProductSortInput) {\n  products(first: $first, after: $after, filter: $filter, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        title\n        sku\n        status\n        category {\n          id\n          name\n        }\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation UpdateProduct($input: UpdateProductInput!) {\n  updateProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["mutation UpdateProduct($input: UpdateProductInput!) {\n  updateProduct(input: $input) {\n    id\n    title\n    sku\n    status\n    category {\n      id\n      name\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}"): (typeof documents)["query DashboardStats {\n  dashboardStats {\n    totalProducts\n    totalOrders\n    totalCustomers\n  }\n}"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;