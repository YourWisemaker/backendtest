import { eventBus, OrderPlacedEvent, StockReservedEvent, OutOfStockEvent } from '../shared/eventBus';

export interface InventoryItem {
  productId: string;
  quantity: number;
  reserved: number;
}

export class InventoryService {
  private inventory: Map<string, InventoryItem> = new Map();
  private lockMap: Map<string, boolean> = new Map();

  constructor() {
    this.setupEventHandlers();
    this.initializeInventory();
  }

  private setupEventHandlers(): void {
    eventBus.subscribe<OrderPlacedEvent>('OrderPlaced', this.handleOrderPlaced.bind(this));
  }

  private initializeInventory(): void {
    // Initialize with some sample inventory
    this.addInventory('PROD-1', 10);
    this.addInventory('PROD-2', 5);
    this.addInventory('PROD-3', 15);
  }

  public addInventory(productId: string, quantity: number): void {
    const existingItem = this.inventory.get(productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.inventory.set(productId, {
        productId,
        quantity,
        reserved: 0
      });
    }
  }

  private async handleOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    const { orderId, items } = event.data;
    const reservations: Array<{ productId: string; quantity: number }> = [];

    for (const item of items) {
      // Simulate some processing time to demonstrate concurrency
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

      try {
        const reserved = await this.tryReserveStock(item.productId, item.quantity);
        if (reserved.success) {
          reservations.push({
            productId: item.productId,
            quantity: item.quantity
          });
        } else {
          const outOfStockEvent: OutOfStockEvent = {
            type: 'OutOfStock',
            data: {
              orderId,
              productId: item.productId,
              requestedQuantity: item.quantity,
              availableQuantity: reserved.availableQuantity
            }
          };
          eventBus.publish(outOfStockEvent);
        }
      } catch (error) {
        console.error(`Error reserving stock for ${item.productId}:`, error);
      }
    }

    if (reservations.length > 0) {
      const stockReservedEvent: StockReservedEvent = {
        type: 'StockReserved',
        data: {
          orderId,
          items: reservations
        }
      };
      eventBus.publish(stockReservedEvent);
    }
  }

  private async tryReserveStock(
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; availableQuantity: number }> {
    while (this.lockMap.get(productId)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    try {
      this.lockMap.set(productId, true);
      const item = this.inventory.get(productId);

      if (!item) {
        return { success: false, availableQuantity: 0 };
      }

      const availableQuantity = item.quantity - item.reserved;
      if (availableQuantity >= quantity) {
        item.reserved += quantity;
        return { success: true, availableQuantity };
      }

      return { success: false, availableQuantity };
    } finally {
      this.lockMap.set(productId, false);
    }
  }

  public getInventory(productId: string): InventoryItem | undefined {
    return this.inventory.get(productId);
  }

  public releaseStock(productId: string, quantity: number): void {
    const item = this.inventory.get(productId);
    if (item && item.reserved >= quantity) {
      item.reserved -= quantity;
    }
  }
}