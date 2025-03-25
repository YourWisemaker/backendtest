import { eventBus, OrderReadyForShippingEvent, ItemShippedEvent, ItemDeliveredEvent } from '../shared/eventBus';

export interface ShipmentItem {
  orderId: string;
  productId: string;
  quantity: number;
  status: ShipmentStatus;
  updatedAt: Date;
}

export type ShipmentStatus = 'pending' | 'shipped' | 'delivered';

export class ShippingService {
  private shipments: Map<string, ShipmentItem[]> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    eventBus.subscribe<OrderReadyForShippingEvent>('OrderReadyForShipping', this.handleOrderReadyForShipping.bind(this));
  }

  private handleOrderReadyForShipping(event: OrderReadyForShippingEvent): void {
    const { orderId, items } = event.data;
    
    const shipmentItems = items.map(item => ({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      status: 'pending' as ShipmentStatus,
      updatedAt: new Date()
    }));

    this.shipments.set(orderId, shipmentItems);

    // Simulate async shipping process
    shipmentItems.forEach(item => {
      this.processShipment(item);
    });
  }

  private async processShipment(item: ShipmentItem): Promise<void> {
    // Simulate shipping delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000));

    // Update to shipped status
    item.status = 'shipped';
    item.updatedAt = new Date();

    const itemShippedEvent: ItemShippedEvent = {
      type: 'ItemShipped',
      data: {
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity
      }
    };
    eventBus.publish(itemShippedEvent);

    // Simulate delivery delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // Update to delivered status
    item.status = 'delivered';
    item.updatedAt = new Date();

    const itemDeliveredEvent: ItemDeliveredEvent = {
      type: 'ItemDelivered',
      data: {
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity
      }
    };
    eventBus.publish(itemDeliveredEvent);
  }

  public getShipments(orderId: string): ShipmentItem[] | undefined {
    return this.shipments.get(orderId);
  }
}