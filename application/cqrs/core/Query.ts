/**
 * Base interface for all queries in the CQRS pattern
 * Queries represent read operations that don't change the state of the system
 */
export interface Query<TResult> {
  /**
   * Unique identifier for the query type
   * This helps with logging, debugging, and routing
   */
  readonly queryType: string;
}
