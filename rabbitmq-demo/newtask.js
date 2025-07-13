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
    const msg = process.argv.slice(2).join(" ") || "Hello World!";

    channel.assertQueue(queue, {
      durable: true,
    });

    channel.sendToQueue(queue, Buffer.from(msg), {
      persistent: true,
    });

    console.log(" [x] Sent %s", msg);

    setTimeout(function () {
      connection.close();
      process.exit(0);
    }, 500);
  });
});
