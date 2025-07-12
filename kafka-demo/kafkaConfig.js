// kafkaConfig.js
import { Kafka, Partitioners } from "kafkajs";

const BROKERS = ["127.0.0.1:9092", "127.0.0.1:9095"];

export const kafka = new Kafka({
  clientId: "order-system-app",
  brokers: BROKERS,
});

export const createProducer = () =>
  kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner, // Silence warning
  });

export const createConsumer = (groupId) => kafka.consumer({ groupId });

export const createAdmin = () => kafka.admin();

export const TOPICS = {
  ORDERS_RAW: "orders.raw",
  ORDERS_VALIDATED: "orders.validated",
  INVENTORY_EVENTS: "inventory.events",
  PAYMENT_EVENTS: "payment.events",
  ORDER_ANALYTICS: "order.analytics",
};

// Function to ensure topics exist (run once before starting services)
export const ensureTopics = async () => {
  const admin = createAdmin();
  await admin.connect();
  console.log("Admin connected to create topics...");

  const existingTopics = await admin.listTopics();
  const topicsToCreate = Object.values(TOPICS)
    .map((topicName) => ({
      topic: topicName,
      numPartitions: 3, // Use multiple partitions to show parallelism
      replicationFactor: 2, // For 2 brokers, this provides redundancy
    }))
    .filter((topic) => !existingTopics.includes(topic.topic));

  if (topicsToCreate.length > 0) {
    await admin.createTopics({
      topics: topicsToCreate,
      waitForLeaders: true,
    });
    console.log(
      `Created topics: ${topicsToCreate.map((t) => t.topic).join(", ")}`
    );
  } else {
    console.log("All required topics already exist.");
  }
  await admin.disconnect();
  console.log("Admin disconnected.");
};
