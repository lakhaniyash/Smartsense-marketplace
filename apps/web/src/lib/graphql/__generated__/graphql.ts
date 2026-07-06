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

export type Query = {
  __typename?: 'Query';
  /** Auth module status */
  authStatus: Scalars['String']['output'];
  /** Billing module status */
  billingStatus: Scalars['String']['output'];
  /** Catalog module status */
  catalogStatus: Scalars['String']['output'];
  /** Summary statistics for the dashboard overview. */
  dashboardStats: DashboardStats;
  /** Dashboard module status */
  dashboardStatus: Scalars['String']['output'];
  /** The authenticated caller and their resolved roles/permissions. */
  me: CurrentUser;
  /** Orders module status */
  ordersStatus: Scalars['String']['output'];
  /** Users module status */
  usersStatus: Scalars['String']['output'];
};

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me: { __typename?: 'CurrentUser', id: string, email: string, fullName: string, roles: Array<string>, permissions: Array<string> } };

export type DashboardStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardStatsQuery = { __typename?: 'Query', dashboardStats: { __typename?: 'DashboardStats', totalProducts: number, totalOrders: number, totalCustomers: number } };


export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const DashboardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalProducts"}},{"kind":"Field","name":{"kind":"Name","value":"totalOrders"}},{"kind":"Field","name":{"kind":"Name","value":"totalCustomers"}}]}}]}}]} as unknown as DocumentNode<DashboardStatsQuery, DashboardStatsQueryVariables>;