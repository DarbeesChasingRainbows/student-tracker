/**
 * Base domain event interface
 * All domain events should implement this interface
 */
export interface DomainEvent {
  eventId: string;
  eventName: string;
  occurredOn: Date;
  aggregateId: string;
  aggregateType: string;
}

/**
 * Base domain event class that all specific domain events extend
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventName: string;
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly aggregateType: string;

  constructor(
    eventName: string,
    aggregateId: string,
    aggregateType: string,
  ) {
    this.eventId = crypto.randomUUID();
    this.eventName = eventName;
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
  }
}
