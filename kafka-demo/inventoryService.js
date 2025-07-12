import { createConsumer, TOPICS } from "./kafkaConfig.js";

const consumer = createConsumer("inventory-service-group");

const run = async () => {
  await consumer.connect();
  console.log("Inventory Service connected.");

  await consumer.subscribe({
    topic: TOPICS.ORDERS_VALIDATED,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsedMessage = JSON.parse(message.value.toString());
        const order = parsedMessage.payload;

        console.log(
          `[Inventory] Processing Order ${order.orderId} for item '${order.item}' from Partition ${partition}...`
        );

        // simulate inventory deduction
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

        console.log(
          `[Inventory] Deducted stock for Order ${order.orderId}. Item: ${order.item}`
        );
      } catch (error) {
        console.error(
          `[Inventory] Error processing message from ${topic}:${partition}:`,
          error
        );
      }
    },
  });
};

run().catch(console.error);
