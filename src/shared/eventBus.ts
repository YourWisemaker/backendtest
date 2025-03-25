import { EventEmitter } from 'events';

export interface Event<T = any> {
  type: string;
  data: T;
}

export interface OrderPlacedEvent extends Event {
  type: 'OrderPlaced';
  data: {
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  };
}

export interface StockReservedEvent extends Event {
  type: 'StockReserved';
  data: {
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  };
}

export interface OutOfStockEvent extends Event {
  type: 'OutOfStock';
  data: {
    orderId: string;
    productId: string;
    requestedQuantity: number;
    availableQuantity: number;
  };
}

export interface OrderReadyForShippingEvent extends Event {
  type: 'OrderReadyForShipping';
  data: {
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  };
}

export interface ItemShippedEvent extends Event {
  type: 'ItemShipped';
  data: {
    orderId: string;
    productId: string;
    quantity: number;
  };
}

export interface ItemDeliveredEvent extends Event {
  type: 'ItemDelivered';
  data: {
    orderId: string;
    productId: string;
    quantity: number;
  };
}

export type EventTypes =
  | OrderPlacedEvent
  | StockReservedEvent
  | OutOfStockEvent
  | OrderReadyForShippingEvent
  | ItemShippedEvent
  | ItemDeliveredEvent;

class EventBus {
  private static instance: EventBus;
  private eventEmitter: EventEmitter;

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public publish<T extends EventTypes>(event: T): void {
    this.eventEmitter.emit(event.type, event);
  }

  public subscribe<T extends EventTypes>(
    eventType: T['type'],
    handler: (event: T) => void
  ): void {
    this.eventEmitter.on(eventType, handler);
  }

  public unsubscribe<T extends EventTypes>(
    eventType: T['type'],
    handler: (event: T) => void
  ): void {
    this.eventEmitter.off(eventType, handler);
  }
}

export const eventBus = EventBus.getInstance();