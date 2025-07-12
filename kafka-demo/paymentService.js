import { createConsumer, TOPICS } from "./kafkaConfig.js";

const consumer = createConsumer("payment-service-group"); // Consumer Group 3

const run = async () => {
  await consumer.connect();
  console.log("Payment Service connected.");

  await consumer.subscribe({
    topic: TOPICS.ORDERS_VALIDATED,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const order = JSON.parse(message.value.toString());
        console.log(
          `[Payment] Processing payment for Order ${order.orderId}, Amount: $${order.amount} from Partition ${partition}...`
        );

        // simulate payment addition
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 100)
        );

        // simulate 5% failure
        if (Math.random() < 0.05) {
          console.warn(`[Payment] Payment FAILED for Order ${order.orderId}.`);
        } else {
          console.log(`[Payment] Payment SUCCESS for Order ${order.orderId}.`);
        }
      } catch (error) {
        console.error(
          `[Payment] Error processing message from ${topic}:${partition}:`,
          error
        );
      }
    },
  });
};
run().catch(console.error);
