import { Client } from "./Client";

async function onDevice(host: string) {
  const client = new Client(host);
  await client.connect();
  await client.launch();
}

onDevice("192.168.0.11");
