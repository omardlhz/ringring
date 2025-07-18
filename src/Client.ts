import {
  Client as CastV2Client,
  Channel,
  ClientOptions,
  ReceiverMessage,
  ReceiverStatusMessage,
} from "castv2";

import { APP_ID, NAMESPACE } from "./constants";
import { EventListener } from "./EventListener";

export class Client {
  private readonly SENDER_ID = "sender-0";
  private readonly RECEIVER_ID = "receiver-0";
  private readonly HEARTBEAT_INTERVAL = 5000;

  private client: CastV2Client;
  private options: ClientOptions | string;
  private appId: string;

  private connection?: Channel;
  private heartbeat?: Channel;
  private receiver?: Channel;
  private requestId = 1;

  constructor(options: ClientOptions | string, appId: string = APP_ID) {
    this.client = new CastV2Client();
    this.options = options;
    this.appId = appId;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.connect(this.options, () => {
        try {
          this.connection = this.createChannel(NAMESPACE.CONNECTION);
          this.heartbeat = this.createChannel(NAMESPACE.HEARTBEAT);
          this.receiver = this.createChannel(NAMESPACE.RECEIVER);

          if (!this.connection || !this.heartbeat || !this.receiver) {
            return reject(new Error("Failed to create required channels"));
          }

          this.connection.send({ type: "CONNECT" });
          this.receiver.on("message", EventListener.onMessage);

          setInterval(
            () => this.heartbeat!.send({ type: "PING" }),
            this.HEARTBEAT_INTERVAL
          );

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      this.client.on("error", (err) => reject(err));
    });
  }

  async launch(): Promise<void> {
    if (!this.receiver) {
      throw new Error("Receiver channel is not initialized");
    }

    const requestId = this.requestId++;
    this.receiver!.send({ type: "LAUNCH", appId: this.appId, requestId });
    const transportId: string = await EventListener.awaitOnMessage(
      requestId,
      (msg) => {
        const app = (msg as ReceiverStatusMessage).status.applications?.find(
          (a) => a.appId === this.appId && a.transportId
        );
        if (!app?.transportId) throw new Error("No transportId found");
        return app.transportId;
      }
    );

    const appChannel = this.createChannel(NAMESPACE.CUSTOM_IMAGE, transportId);
    appChannel.send({
      type: "SET_IMAGE",
      url: " http://192.168.0.104:11080/endpoint/@scrypted/webhook/public/35/d9b7cb1eb6526969",
    });
  }

  /**
   * Creates a channel for the specified namespace.
   * @param namespace the namespace to create the channel for.
   * @param destinationId the destination ID for the channel, defaults to RECEIVER_ID.
   * @returns a new Channel instance.
   */
  private createChannel(
    namespace: string,
    destinationId: string = this.RECEIVER_ID
  ): Channel {
    return this.client.createChannel(
      this.SENDER_ID,
      destinationId,
      namespace,
      "JSON"
    );
  }
}
