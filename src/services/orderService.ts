import { v4 as uuidv4 } from 'uuid';
import { eventBus, OrderPlacedEvent, StockReservedEvent, OutOfStockEvent, OrderReadyForShippingEvent } from '../shared/eventBus';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  fulfillableItems: OrderItem[];
  unfulfillableItems: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'pending' | 'processing' | 'partial' | 'fulfilled' | 'cancelled';

export class OrderService {
  private orders: Map<string, Order> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    eventBus.subscribe<StockReservedEvent>('StockReserved', this.handleStockReserved.bind(this));
    eventBus.subscribe<OutOfStockEvent>('OutOfStock', this.handleOutOfStock.bind(this));
  }

  public createOrder(items: OrderItem[]): Order {
    const order: Order = {
      id: uuidv4(),
      items,
      status: 'pending',
      fulfillableItems: [],
      unfulfillableItems: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.orders.set(order.id, order);

    const orderPlacedEvent: OrderPlacedEvent = {
      type: 'OrderPlaced',
      data: {
        orderId: order.id,
        items: order.items
      }
    };

    eventBus.publish(orderPlacedEvent);
    this.updateOrderStatus(order.id, 'processing');

    return order;
  }

  private handleStockReserved(event: StockReservedEvent): void {
    const order = this.orders.get(event.data.orderId);
    if (!order) return;

    order.fulfillableItems.push(...event.data.items);
    order.updatedAt = new Date();

    if (this.isOrderComplete(order)) {
      const readyForShippingEvent: OrderReadyForShippingEvent = {
        type: 'OrderReadyForShipping',
        data: {
          orderId: order.id,
          items: order.fulfillableItems
        }
      };

      eventBus.publish(readyForShippingEvent);
      this.updateOrderStatus(order.id, order.unfulfillableItems.length > 0 ? 'partial' : 'fulfilled');
    }
  }

  private handleOutOfStock(event: OutOfStockEvent): void {
    const order = this.orders.get(event.data.orderId);
    if (!order) return;

    const unfulfillableItem: OrderItem = {
      productId: event.data.productId,
      quantity: event.data.requestedQuantity - event.data.availableQuantity
    };

    order.unfulfillableItems.push(unfulfillableItem);
    order.updatedAt = new Date();

    if (event.data.availableQuantity > 0) {
      const partialFulfillableItem: OrderItem = {
        productId: event.data.productId,
        quantity: event.data.availableQuantity
      };
      order.fulfillableItems.push(partialFulfillableItem);
    }

    if (this.isOrderComplete(order)) {
      if (order.fulfillableItems.length > 0) {
        const readyForShippingEvent: OrderReadyForShippingEvent = {
          type: 'OrderReadyForShipping',
          data: {
            orderId: order.id,
            items: order.fulfillableItems
          }
        };
        eventBus.publish(readyForShippingEvent);
      }
      this.updateOrderStatus(order.id, order.fulfillableItems.length > 0 ? 'partial' : 'cancelled');
    }
  }

  private isOrderComplete(order: Order): boolean {
    const totalItemsProcessed = order.fulfillableItems.length + order.unfulfillableItems.length;
    return totalItemsProcessed === order.items.length;
  }

  private updateOrderStatus(orderId: string, status: OrderStatus): void {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
    }
  }

  public getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }
}