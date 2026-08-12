import type { components, operations } from '../generated/schema.js';

export type KlixComponents = components;
export type KlixOperationId = keyof operations;

type JsonContent<T> = T extends { content: { 'application/json': infer Value } } ? Value : never;
type OperationDefinition<T extends KlixOperationId> = operations[T];

export type OperationRequestBody<T extends KlixOperationId> =
  OperationDefinition<T> extends { requestBody: infer RequestBody }
    ? JsonContent<RequestBody>
    : OperationDefinition<T> extends { requestBody?: infer RequestBody }
      ? JsonContent<Exclude<RequestBody, undefined>>
      : never;

export type OperationQuery<T extends KlixOperationId> =
  OperationDefinition<T>['parameters'] extends { query?: infer Query }
    ? Exclude<Query, undefined>
    : never;

export type OperationPath<T extends KlixOperationId> =
  OperationDefinition<T>['parameters'] extends { path?: infer Path }
    ? Exclude<Path, undefined>
    : never;

type OperationResponses<T extends KlixOperationId> = OperationDefinition<T>['responses'];

type ExtractSuccessResponse<T> =
  T extends { 200: infer Success } ? JsonContent<Success> :
  T extends { 201: infer Success } ? JsonContent<Success> :
  T extends { 204: unknown } ? undefined :
  undefined;

export type OperationResponse<T extends KlixOperationId> = ExtractSuccessResponse<OperationResponses<T>>;

export type KlixPage<T> = {
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export type PageItem<TPage> = TPage extends { results?: Array<infer Item> } ? Item : never;
