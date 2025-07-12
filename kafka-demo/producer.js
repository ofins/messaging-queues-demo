import { createProducer, ensureTopics, TOPICS } from "./kafkaConfig.js";
import { v4 as uuidv4 } from "uuid";

const producer = createProducer();

const run = async () => {
  await ensureTopics();
  await producer.connect();
  console.log("Order Producer Connected");

  let orderCount = 0;
  setInterval(async () => {
    const orderId = uuidv4();
    const customerId = `customer-${Math.floor(Math.random() * 1000)}`;
    const amount = (Math.random() * 1000 + 10).toFixed(2);
    const item = `item-${Math.floor(Math.random() * 5) + 1}`;

    const order = {
      orderId,
      customerId,
      amount,
      item,
      timestamp: new Date().toISOString(),
      status: "NEW",
    };

    try {
      await producer.send({
        topic: TOPICS.ORDERS_RAW,
        messages: [
          {
            key: orderId,
            value: JSON.stringify(order),
          },
        ],
      });
      orderCount++;
      console.log(
        `[Producer] Sent Order ${orderCount}: ${order.orderId} from ${order.customerId}`
      );
    } catch (error) {
      console.error("[Producer] Error sending message:", error);
    }
  }, 50);
};

run().catch(console.error);
