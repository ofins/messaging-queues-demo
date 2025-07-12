import { createConsumer, createProducer, TOPICS } from "./kafkaConfig.js";

const consumer = createConsumer("order-validator-group");
const producer = createProducer();

const ORDER_SCHEMA_VALIDATED = {
  type: "struct",
  fields: [
    { field: "orderId", type: "string" },
    { field: "customerId", type: "string" },
    { field: "amount", type: "double" },
    { field: "item", type: "string" },
    { field: "timestamp", type: "string" },
    { field: "status", type: "string" },
    { field: "validatedAt", type: "string", optional: true }, // Add optional for enrichment
  ],
  optional: false,
  name: "OrderValidated",
};

const run = async () => {
  await producer.connect();
  await consumer.connect();
  console.log("Order Validator connected.");

  await consumer.subscribe({
    topic: TOPICS.ORDERS_RAW,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsedMessage = JSON.parse(message.value.toString());
        const rawOrder = parsedMessage.payload;

        console.log(
          `[Validator] Received Order ${rawOrder.orderId} from Partition ${partition}. Validating...`
        );

        const validateOrder = {
          ...rawOrder,
          status: "VALIDATED",
          validatedAt: new Date().toISOString(),
        };

        const messageValue = {
          schema: ORDER_SCHEMA_VALIDATED,
          payload: validateOrder,
        };

        await producer.send({
          topic: TOPICS.ORDERS_VALIDATED,
          messages: [
            {
              key: validateOrder.orderId,
              value: JSON.stringify(messageValue),
            },
          ],
        });
        console.log(
          `[Validator] Validated & Sent Order ${validateOrder.orderId} to ${TOPICS.ORDERS_VALIDATED}`
        );
      } catch (error) {
        console.error(
          `[Validator] Error processing message from ${topic}:${partition}:`,
          error
        );
      }
    },
  });
};

run().catch(console.error);
