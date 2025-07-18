import { ReceiverMessage } from "castv2";

type Awaiter<T> = {
  transform: (msg: ReceiverMessage) => T;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
};

export class EventListener {
  private static instance: EventListener;
  private awaiters: Map<number, Awaiter<any>> = new Map();

  private constructor() {}

  private static getInstance(): EventListener {
    if (!EventListener.instance) {
      EventListener.instance = new EventListener();
    }
    return EventListener.instance;
  }

  static onMessage(msg: ReceiverMessage): void {
    const instance = EventListener.getInstance();
    const requestId = (msg as { requestId?: number }).requestId;
    if (requestId === undefined) return;

    const awaiter = instance.awaiters.get(requestId);
    if (!awaiter) return;

    try {
      const result = awaiter.transform(msg);
      awaiter.resolve(result);
    } catch (err) {
      awaiter.reject(err);
    } finally {
      instance.awaiters.delete(requestId);
    }
  }

  static awaitOnMessage<T>(
    requestId: number,
    transform: (msg: ReceiverMessage) => T
  ): Promise<T> {
    const instance = EventListener.getInstance();
    return new Promise<T>((resolve, reject) => {
      instance.awaiters.set(requestId, { transform, resolve, reject });
    });
  }
}
