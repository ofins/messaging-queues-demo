import { createConsumer, TOPICS } from "./kafkaConfig.js";

const consumer = createConsumer("analytics-dashboard-group");

let ordersProcessed = 0;
let totalRevenue = 0;
const startTime = Date.now();

const run = async () => {
  await consumer.connect();
  console.log("Analytics Dashboard connected.");

  await consumer.subscribe({
    topic: TOPICS.ORDERS_VALIDATED,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const order = JSON.parse(message.value.toString());
        ordersProcessed = Number(ordersProcessed) + 1;
        totalRevenue += Number(order.amount);

        if (startTime === null) {
          startTime = Date.now();
        }

        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - startTime) / 1000;

        const ops = ordersProcessed / elapsedSeconds; // Orders Per Second
        const rps = totalRevenue / elapsedSeconds; // Revenue Per Second

        console.log(
          `[Analytics] Order ${order.orderId} processed. Total: ${ordersProcessed} orders, $${totalRevenue} revenue. OPS: ${ops}, RPS: $${rps}`
        );
      } catch (error) {
        console.error(
          `[Analytics] Error processing message from ${topic}:${partition}:`,
          error
        );
      }
    },
  });
};

run().catch(console.error);
