import amqp from "amqplib/callback_api.js";

amqp.connect("amqp://user:password@localhost:5672", (error0, connection) => {
  if (error0) {
    throw error0;
  }

  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    const queue = "new_task";

    channel.assertQueue(queue, {
      durable: true,
    });

    // do not consume more messages until current event has been processed
    channel.prefetch(1);

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(
      queue,
      (msg) => {
        const secs = msg.content.toString().split(".").length - 1;

        console.log(" [x] Received %s", msg.content.toString());

        setTimeout(() => {
          console.log("[X] Done");
          channel.ack(msg);
        }, secs * 1000);
      },
      {
        noAck: false,
      }
    );
  });
});
