import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["127.0.0.1:9095"],
});

const consumer = kafka.consumer({ groupId: "test-group" });

const run = async () => {
  try {
    await consumer.connect();
    console.log("Consumer connected");

    await consumer.subscribe({ topic: "test-topic", fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          partition,
          offset: message.offset,
          value: message.value.toString(),
        });
      },
    });
  } catch (error) {
    console.error("Error in consumer:", error);
  }
};

run().catch(console.error);
