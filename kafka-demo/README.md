### Architecture Overview: High-Volume Order Processing with Kafka

This demo illustrates an event-driven microservices architecture for handling high-volume order placements, leveraging Apache Kafka as the central nervous system.

---

#### 1. Order Placement Simulator (Producer)

- **Role:** Simulates a high rate of incoming customer orders.
- **Action:**
  - Generates `OrderPlaced` events (representing new orders).
  - Publishes these events to the `orders.raw` Kafka topic.
- **Kafka Concept Highlighted:**
  - **Producers:** Demonstrates high-throughput data ingestion into Kafka.
  - **Message Keys:** Uses `orderId` as the message key. This is crucial to ensure that all events related to a specific order (`OrderPlaced`, `OrderValidated`, `PaymentProcessed`, etc.) are consistently routed to the _same partition_ within the `orders.raw` topic. This guarantees strict ordering of events _per order_.

---

#### 2. Order Validator/Enricher Service (Consumer Group 1)

- **Role:** Processes raw orders, performs initial validation, and adds supplementary information.
- **Action:**
  - Subscribes to the `orders.raw` Kafka topic.
  - Consumes `OrderPlaced` events.
  - Simulates business logic for order validation (e.g., checking customer eligibility, product availability).
  - Enriches the order data (e.g., adds a `status: PENDING`, a processing timestamp, or pulls additional customer details from a lookup service).
  - Publishes the validated/enriched order as a new event to the `orders.validated` Kafka topic.
- **Kafka Concept Highlighted:**
  - **Consumers & Consumer Groups:** Shows how multiple instances of this service can form a consumer group to scale out processing of `orders.raw` events.
  - **Topic-to-Topic Processing:** Demonstrates a common pattern of transforming data from one topic and producing it to another.

---

#### 3. Inventory Service (Consumer Group 2)

- **Role:** Manages product stock based on validated orders.
- **Action:**
  - Subscribes to the `orders.validated` Kafka topic.
  - Consumes validated order events.
  - Simulates the deduction of inventory for the ordered items (e.g., updating a database record for stock levels).
  - (Conceptual: Would typically publish an `InventoryUpdated` event to an `inventory.events` topic to signal changes in stock).
- **Kafka Concept Highlighted:**
  - **Asynchronous Communication:** The Inventory Service reacts to orders without direct, synchronous calls from the Order Placement service, promoting decoupling.
  - **Consumer Groups:** Further demonstrates scaling out processing for a different business domain.

---

#### 4. Payment Service (Consumer Group 3)

- **Role:** Handles the financial transaction for validated orders.
- **Action:**
  - Subscribes to the `orders.validated` Kafka topic.
  - Consumes validated order events.
  - Simulates processing payment with an external payment gateway.
  - (Conceptual: Would typically publish `PaymentProcessed` or `PaymentFailed` events to a `payment.events` topic to communicate transaction outcomes).
- **Kafka Concept Highlighted:**
  - **Decoupling:** The Payment Service operates independently, reacting to order events.
  - **Event-Driven Actions:** Shows how events trigger specific business processes.

---

#### 5. Real-time Analytics Dashboard (Consumer Group 4)

- **Role:** Provides live operational insights into the order placement pipeline.
- **Action:**
  - Subscribes to the `orders.validated` Kafka topic (and potentially `payment.events` or other relevant topics).
  - Consumes order events.
  - Aggregates real-time metrics such as "orders per second" and "total revenue per minute."
  - Prints these real-time statistics to the console (can be extended to push to a web dashboard).
- **Kafka Concept Highlighted:**
  - **Stream Processing/Analytics:** Demonstrates Kafka's capability for real-time data aggregation and analysis.
  - **Multiple Consumers (Read Model):** Shows how multiple independent consumer groups can read from the same topic without affecting each other's progress, enabling different views or analyses of the same data stream.
  - **Replayability:** This service could theoretically re-process all historical `orders.validated` events to build its metrics from scratch if needed.

### Instructions

```bash
nvm 18 # optional

npm install

cp .env.example .env

docker-compose down -v --remove-orphans # Clean up any old containers
docker-compose up -d

node -e "import('./kafkaConfig.js').then(m => m.ensureTopics())"

node producer.js

node validator.js

node inventoryService.js

node paymentService.js

node analytics.js
```

### Bugs

1. continuously encountering this error:
   {"level":"ERROR","timestamp":"2025-07-12T01:24:45.495Z","logger":"kafkajs","message":"[Connection] Connection error: connect ECONNREFUSED 127.0.0.1:9092","broker":"127.0.0.1:9092","clientId":"my-app","stack":"Error: connect ECONNREFUSED 127.0.0.1:9092\n at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)"}

   - initially tried to setup docker via zookeeper
   - issue solved by switching to KRaft
