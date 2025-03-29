import { Query } from "../core/Query.ts";
import { QueryDispatcher } from "../core/QueryDispatcher.ts";
import { QueryHandler } from "../core/QueryHandler.ts";

/**
 * Simple implementation of the QueryDispatcher interface
 */
export class SimpleQueryDispatcher implements QueryDispatcher {
  private handlers = new Map<string, QueryHandler<any, any>>();

  /**
   * Registers a query handler for a specific query type
   * @param queryType The type of query to register the handler for
   * @param handler The handler to register
   */
  registerHandler<TQuery extends Query<TResult>, TResult>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType, handler);
  }

  /**
   * Dispatches a query to its registered handler
   * @param query The query to dispatch
   * @returns The result of the query execution
   * @throws Error if no handler is registered for the query type
   */
  async dispatch<TQuery extends Query<TResult>, TResult>(
    query: TQuery
  ): Promise<TResult> {
    const handler = this.handlers.get(query.queryType);
    
    if (!handler) {
      throw new Error(`No handler registered for query type: ${query.queryType}`);
    }
    
    return handler.execute(query);
  }
}
