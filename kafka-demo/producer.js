import { createProducer, ensureTopics, TOPICS } from "./kafkaConfig.js";
import { v4 as uuidv4 } from "uuid";

const producer = createProducer();

const ORDER_SCHEMA = {
  type: "struct",
  fields: [
    { field: "orderId", type: "string" },
    { field: "customerId", type: "string" },
    { field: "amount", type: "double" },
    { field: "item", type: "string" },
    { field: "timestamp", type: "string" },
    { field: "status", type: "string" },
  ],
  optional: false,
  name: "OrderValidated", // Name your schema
};

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

    const messageValue = {
      schema: ORDER_SCHEMA,
      payload: order,
    };

    try {
      await producer.send({
        topic: TOPICS.ORDERS_RAW,
        messages: [
          {
            key: orderId,
            value: JSON.stringify(messageValue),
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
