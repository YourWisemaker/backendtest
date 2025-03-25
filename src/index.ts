import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { OrderService } from './services/orderService';
import { InventoryService } from './services/inventoryService';
import { ShippingService } from './services/shippingService';

// Initialize services
const orderService = new OrderService();
const inventoryService = new InventoryService();
const shippingService = new ShippingService();

// Initialize Express app
const app = express();
app.use(express.json());

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Management System API',
      version: '1.0.0',
      description: 'API documentation for the Order Management System microservices',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/index.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           description: The product ID
 *         quantity:
 *           type: integer
 *           description: The quantity of the product
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The order ID
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         status:
 *           type: string
 *           enum: [pending, processing, fulfilled, partial, cancelled]
 *           description: The order status
 *         fulfillableItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         unfulfillableItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
app.post('/orders', (req, res) => {
  try {
    const { items } = req.body;
    const order = orderService.createOrder(items);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create order' });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
app.get('/orders/:id', (req, res) => {
  const order = orderService.getOrder(req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

/**
 * @swagger
 * /inventory/{productId}:
 *   get:
 *     summary: Get inventory for a product
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Inventory details
 *       404:
 *         description: Product not found
 */
app.get('/inventory/:productId', (req, res) => {
  const inventory = inventoryService.getInventory(req.params.productId);
  if (inventory) {
    res.json(inventory);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

/**
 * @swagger
 * /shipments/{orderId}:
 *   get:
 *     summary: Get shipments for an order
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Shipment details
 *       404:
 *         description: Shipments not found
 */
app.get('/shipments/:orderId', (req, res) => {
  const shipments = shippingService.getShipments(req.params.orderId);
  if (shipments) {
    res.json(shipments);
  } else {
    res.status(404).json({ error: 'Shipments not found' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});