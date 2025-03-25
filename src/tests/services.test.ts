import { OrderService } from '../services/orderService';
import { InventoryService } from '../services/inventoryService';
import { ShippingService } from '../services/shippingService';

describe('Order Management System Integration Tests', () => {
  let orderService: OrderService;
  let inventoryService: InventoryService;
  let shippingService: ShippingService;

  beforeEach(() => {
    // Initialize services before each test
    orderService = new OrderService();
    inventoryService = new InventoryService();
    shippingService = new ShippingService();
  });

  describe('Scenario 1: Fully Fulfillable Order', () => {
    it('should successfully process and ship an order when all items are in stock', async () => {
      // Create an order for items that are in stock
      const order = orderService.createOrder([
        { productId: 'PROD-1', quantity: 2 },
        { productId: 'PROD-2', quantity: 1 }
      ]);

      // Wait for all async operations to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify order status
      const processedOrder = orderService.getOrder(order.id);
      expect(processedOrder?.status).toBe('fulfilled');

      // Verify inventory reservations
      const prod1Inventory = inventoryService.getInventory('PROD-1');
      const prod2Inventory = inventoryService.getInventory('PROD-2');
      expect(prod1Inventory?.reserved).toBe(2);
      expect(prod2Inventory?.reserved).toBe(1);

      // Verify shipment status
      const shipments = shippingService.getShipments(order.id);
      expect(shipments).toBeDefined();
      expect(shipments?.length).toBe(2);
      expect(shipments?.every(item => item.status === 'delivered')).toBe(true);
    });
  });

  describe('Scenario 2: Partially Fulfillable Order', () => {
    it('should handle partial fulfillment when some items are out of stock', async () => {
      // Create an order with quantities exceeding available stock
      const order = orderService.createOrder([
        { productId: 'PROD-2', quantity: 7 }, // Only 5 in stock
        { productId: 'PROD-3', quantity: 3 }  // 15 in stock
      ]);

      // Wait for all async operations to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify order status
      const processedOrder = orderService.getOrder(order.id);
      expect(processedOrder?.status).toBe('partial');

      // Verify fulfillable and unfulfillable items
      expect(processedOrder?.fulfillableItems.length).toBe(2);
      expect(processedOrder?.unfulfillableItems.length).toBe(1);

      // Verify inventory reservations
      const prod2Inventory = inventoryService.getInventory('PROD-2');
      const prod3Inventory = inventoryService.getInventory('PROD-3');
      expect(prod2Inventory?.reserved).toBe(5); // Maximum available
      expect(prod3Inventory?.reserved).toBe(3);

      // Verify shipment status
      const shipments = shippingService.getShipments(order.id);
      expect(shipments).toBeDefined();
      expect(shipments?.length).toBe(2);
    });
  });

  describe('Scenario 3: Concurrent Orders', () => {
    it('should handle concurrent orders without overselling', async () => {
      // Create two concurrent orders for the same product
      const order1Promise = Promise.resolve(orderService.createOrder([
        { productId: 'PROD-1', quantity: 7 } // Requesting 7 of 10 available
      ]));

      const order2Promise = Promise.resolve(orderService.createOrder([
        { productId: 'PROD-1', quantity: 5 } // Requesting 5 of 10 available
      ]));

      // Process orders concurrently
      const [order1, order2] = await Promise.all([order1Promise, order2Promise]);

      // Wait for all async operations to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify final inventory state
      const finalInventory = inventoryService.getInventory('PROD-1');
      expect(finalInventory?.reserved).toBeLessThanOrEqual(10); // Total reserved should not exceed available

      // Verify order statuses
      const processedOrder1 = orderService.getOrder(order1.id);
      const processedOrder2 = orderService.getOrder(order2.id);

      // At least one order should be partial or unfulfilled
      expect(
        processedOrder1?.status === 'partial' || 
        processedOrder2?.status === 'partial' ||
        processedOrder1?.status === 'cancelled' ||
        processedOrder2?.status === 'cancelled'
      ).toBe(true);

      // Verify total fulfilled quantities
      const totalFulfilled = (
        (processedOrder1?.fulfillableItems.reduce((sum, item) => sum + item.quantity, 0) || 0) +
        (processedOrder2?.fulfillableItems.reduce((sum, item) => sum + item.quantity, 0) || 0)
      );
      expect(totalFulfilled).toBeLessThanOrEqual(10); // Total fulfilled should not exceed available
    });
  });
});