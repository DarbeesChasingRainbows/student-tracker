import { Query } from "./Query.ts";

/**
 * Interface for query handlers in the CQRS pattern
 * Query handlers execute the business logic for a specific query
 */
export interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  /**
   * Executes the query and returns the result
   * @param query The query to execute
   */
  execute(query: TQuery): Promise<TResult>;
}
