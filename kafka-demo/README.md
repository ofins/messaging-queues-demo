### Instructions

```bash
nvm 18 # optional

npm install

cp .env.example .env

docker-compose down -v --remove-orphans # Clean up any old containers
docker-compose up -d

# Create orders schema (will automate this later)
docker exec -it db psql -U admin -d orders_db
CREATE SCHEMA orders;

# Inspect log to make sure connection established before proceeding
docker-compose logs -f connect

# Create Kafka topics
node -e "import('./kafkaConfig.js').then(m => m.ensureTopics())"

# Start services in background (order matters)
node validator.js
node inventoryService.js
node paymentService.js
node analytics.js

# Start producing data
node producer.js

# Create JDBC sink connector
curl -X POST -H "Content-Type: application/json" --data @orders-validated.json http://localhost:8083/connectors

# Delete connector if needed
curl -X DELETE http://localhost:8083/connectors/orders-validated

# Check connector status
curl http://localhost:8083/connectors/orders-validated/status | jq .

# Check connector config
curl http://localhost:8083/connectors/orders-validated/config | jq .

# Connect to Postgres container
docker exec -it db psql -U admin -d orders_db

# List tables in orders schema
\dt orders.*

# query
SELECT * FROM orders.validated LIMIT 10;
```

### Useful debugging

```bash
# access db
docker exec -it db psql -U admin -d orders_db

# check connect logs
docker-compose logs -f connect

# check all service logs
docker-compose logs -f

# List all topics
docker exec -it kafka1 kafka-topics --bootstrap-server kafka1:9094,kafka2:9097 --list

# Check topic details
docker exec -it kafka1 kafka-topics --bootstrap-server kafka1:9094,kafka2:9097 --describe --topic orders.validated

# Check raw orders data
docker exec -it kafka1 kafka-console-consumer --bootstrap-server kafka1:9094,kafka2:9097 --topic orders.raw --from-beginning --max-messages 5

# Check validated orders data
docker exec -it kafka1 kafka-console-consumer --bootstrap-server kafka1:9094,kafka2:9097 --topic orders.validated --from-beginning --max-messages 5

# Check consumer groups
docker exec -it kafka1 kafka-consumer-groups --bootstrap-server kafka1:9094,kafka2:9097 --list

# Check specific consumer group details
docker exec -it kafka1 kafka-consumer-groups --bootstrap-server kafka1:9094,kafka2:9097 --describe --group validator-group

# Check Connect connector status
curl http://localhost:8083/connectors
curl http://localhost:8083/connectors/orders-validated/status

# Check available connector plugins
curl http://localhost:8083/connector-plugins
```

### Bugs Encountered

1. continuously encountering this error:
   {"level":"ERROR","timestamp":"2025-07-12T01:24:45.495Z","logger":"kafkajs","message":"[Connection] Connection error: connect ECONNREFUSED 127.0.0.1:9092","broker":"127.0.0.1:9092","clientId":"my-app","stack":"Error: connect ECONNREFUSED 127.0.0.1:9092\n at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)"}

   - initially tried to setup docker via zookeeper
   - issue solved by switching to KRaft

2. Unable to connect via HTTP via localhost:8083 to connect using JDBC Sink Connector

   - errors:

     ```bash
     connect | Error while getting broker list.
     connect | java.util.concurrent.ExecutionException: org.apache.kafka.common.errors.TimeoutException: Timed out waiting for a node assignment. Call: listNodes
     ...
     connect | Expected 1 brokers but found only 0. Trying to query Kafka for metadata again ...
     connect | Expected 1 brokers but found only 0. Brokers found [].
     connect exited with code 1
     ```

   - solved by changing `CONNECT_BOOTSTRAP_SERVERS: kafka1:9094,kafka2:9097` in `docker-compose.yml`

3. connect has connection, but no relations found in `\dt`

   - fixed `validator.js` was not validating correctly due to Typo. Did not solve the issue.
   - fixed `order-sink-connector.json` to treat keys as string and values as JSON. Now, connectors status is successful, but DB still has no data.
   - after running for a while, status fails again.
   - added order schema to `producer.js` and `validator.js` and now connection to Kafka Connect is stable. But still no data in DB.

4. ERROR: schema "orders" does not exist

- solved by creating schema `orders` before connecting to JDBC Sink
