import { createConsumer, createProducer, TOPICS } from "./kafkaConfig.js";

const consumer = createConsumer("order-validator-group");
const producer = createProducer();

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
        const rawOrder = JSON.parse(message.value.toString());
        console.log(
          `[Validator] Received Order ${rawOrder.orderId} from Partition ${partition}. Validating...`
        );

        const validateOrder = {
          ...rawOrder,
          status: "VALIDATED",
          validatedAt: new Date().toISOString(),
        };

        await producer.send({
          topic: TOPICS.ORDERS_VALIDATED,
          messages: [
            {
              key: validateOrder.orderId,
              value: JSON.stringify(validateOrder),
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
