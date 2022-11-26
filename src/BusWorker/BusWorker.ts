import { isObservable, Subscription } from "rxjs";
import {
  SendCommand,
  SendMsgPayload,
  ReturnNextCommand,
  ReturnErrorCommand,
  ReturnCompleteCommand,
  InitEventHandler,
  ServiceGetter,
} from "./BusTypes";

type DictionaryFunction = {
  [key: string]: Function;
};

export class BusWorker {
  private constructor() {}
  private static _instance: BusWorker;
  private readonly msgToSubs: Map<string, Subscription> = new Map();
  private getService!: ServiceGetter;
  private initHandler?: InitEventHandler;

  static connectToBus(getService: ServiceGetter, initHandler?: InitEventHandler) {
    if (this._instance) return;
    if (typeof window !== "undefined") throw new Error("Class BusWorker must use only in web worker context!");

    this._instance = new BusWorker();
    self.onmessage = this._instance.messageHandler;
    this._instance.getService = getService;
    this._instance.initHandler = initHandler;
    return;
  }

  private messageHandler = ({ data }: MessageEvent<SendCommand>): void => {
    switch (data.type) {
      case "INIT":
        this.initHandler?.();
        break;
      case "SEND_MSG":
        this.handleSendMsgCommand(data.payload);
        break;

      case "UNSUBSCRIBE":
        this.handleUnsubscribeCommand(data.payload);
        break;
    }
  };

  private handleUnsubscribeCommand({ messageId, serviceName, methodName, args }: SendMsgPayload): void {
    const key = this.getKeyMap(messageId, serviceName, methodName);
    const subs = this.msgToSubs.get(key);
    if (subs == null) {
      console.error("subs == null; " + key);
      return;
    }
    if (!subs.closed) {
      subs.unsubscribe();
    }
    this.msgToSubs.delete(key);
    return;
  }

  private async handleSendMsgCommand({ messageId, serviceName, methodName, args }: SendMsgPayload): Promise<void> {
    if (!this.getService) return;

    const service = this.getService(serviceName);
    const fn = (service as DictionaryFunction)?.[methodName];

    if (!fn || !(fn instanceof Function)) return;

    const key = this.getKeyMap(messageId, serviceName, methodName);
    try {
      const returnValue = (service as DictionaryFunction)?.[methodName](...args);

      if (returnValue instanceof Promise) {
        const value = await returnValue;
        self.postMessage?.({ type: "RETURN_NEXT", payload: { value, messageId } } as ReturnNextCommand);
        return;
      } else if (!isObservable(returnValue)) {
        self.postMessage?.({ type: "RETURN_NEXT", payload: { value: returnValue, messageId } } as ReturnNextCommand);
        return;
      }

      const subs = returnValue.subscribe({
        next: (value) =>
          self.postMessage?.({ type: "RETURN_NEXT", payload: { value, messageId } } as ReturnNextCommand),
        error: (eMsg) => {
          self.postMessage?.({ type: "RETURN_ERROR", payload: { errorMsg: eMsg, messageId } } as ReturnErrorCommand);
        },
        complete: () =>
          self.postMessage?.({ type: "RETURN_COMPLETE", payload: { messageId } } as ReturnCompleteCommand),
      });
      this.msgToSubs.set(key, subs);
    } catch (error) {
      const errorMsg = (error as Error).message;
      self.postMessage?.({ type: "RETURN_ERROR", payload: { errorMsg, messageId } } as ReturnErrorCommand);
    }
  }

  private getKeyMap(messageId: string, serviceName: string, methodName: string): string {
    return `${messageId}-${serviceName}.${methodName}`;
  }
}
