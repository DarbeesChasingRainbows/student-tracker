import { Query } from "./Query.ts";
import { QueryHandler } from "./QueryHandler.ts";

/**
 * Interface for the query dispatcher in the CQRS pattern
 * The query dispatcher routes queries to their respective handlers
 */
export interface QueryDispatcher {
  /**
   * Registers a query handler for a specific query type
   * @param queryType The type of query to register the handler for
   * @param handler The handler to register
   */
  registerHandler<TQuery extends Query<TResult>, TResult>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>
  ): void;

  /**
   * Dispatches a query to its registered handler
   * @param query The query to dispatch
   * @returns The result of the query execution
   */
  dispatch<TQuery extends Query<TResult>, TResult>(
    query: TQuery
  ): Promise<TResult>;
}
