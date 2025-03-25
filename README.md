# Order Management System

## Running the Project

1. Install dependencies:
```bash
pnpm install
```

2. Start the API server:
```bash
pnpm run dev
```

The server will start on port 3000. You can access the Swagger API documentation at:
```
http://localhost:3000/api-docs
```

3. Run tests:
```bash
pnpm test
```

## API Endpoints

The following API endpoints are available:

- **POST /orders** - Create a new order
- **GET /orders/:id** - Get order details by ID
- **GET /inventory/:productId** - Get inventory details for a product
- **GET /shipments/:orderId** - Get shipments for an order

## Architectural Overview

This project implements an event-driven microservices architecture for an order management system. The system consists of three main services:

- **Order Service**: Handles order creation and status management
- **Inventory Service**: Manages product stock and reservations
- **Shipping Service**: Processes shipments and delivery updates

### Event-Driven Architecture

The services communicate through an in-memory event bus implementation that enables loose coupling and asynchronous operations. Each service:

1. Publishes domain events when significant state changes occur
2. Subscribes to relevant events from other services
3. Maintains its own data store (using in-memory Maps for this implementation)

The event bus pattern allows services to evolve independently while maintaining consistency through event propagation.

### Concurrency Strategy

The system implements several strategies to handle concurrent operations:

1. **Inventory Locking**: Uses a lock-based mechanism to prevent race conditions during stock reservations
2. **Optimistic Concurrency**: Each service maintains its own state and updates it based on events
3. **Async Processing**: Services process events asynchronously to improve throughput

## Design Choices and Edge Cases

### Partial Fulfillment

The system handles partial order fulfillment through:

1. Splitting orders into fulfillable and unfulfillable items
2. Creating shipments for available items while tracking unfulfilled quantities
3. Updating order status to reflect partial fulfillment

### Error Handling

1. **Out of Stock**: Generates OutOfStock events with available quantities
2. **Service Failures**: Each service handles errors independently
3. **Event Processing**: Services are resilient to event processing failures

### Concurrency Handling

1. **Stock Reservations**: Uses a lock mechanism to prevent overselling
2. **Event Processing**: Handles concurrent events through async processing
3. **State Updates**: Maintains consistency through event-driven updates

## Technical Decisions

1. **TypeScript**: Provides type safety and better developer experience
2. **Event-Driven**: Enables service isolation and scalability
3. **In-Memory Storage**: Simplifies the implementation while demonstrating architectural patterns
4. **Jest Testing**: Comprehensive integration tests for key scenarios

The codebase demonstrates clean architecture principles, separation of concerns, and robust handling of concurrent operations in a distributed system.