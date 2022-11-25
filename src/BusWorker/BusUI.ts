import { Observable, Subject, Subscription } from "rxjs";
import { generateId } from "./generateId";
import { InitCommand, ReturnCommand, SendMsgCommand, UnsubscribeCommand } from "./BusTypes";

type BusWorkerSettings = {
  instance: Worker | null;
};

interface SubscriptionMeta {
  sub: Subscription;
  command: SendMsgCommand;
}

export class BusUI {
  private readonly busWorkerTypes = new Map<typeof Worker, BusWorkerSettings>();
  private readonly pending = new Map<string, Subject<unknown>>();
  private readonly msgToSubMeta = new Map<string, SubscriptionMeta>();
  private constructor() {}
  static readonly instance = new BusUI();

  registerBusWorkers(busTypes: typeof WebpackWorker[]) {
    for (const busType of busTypes) {
      this.busWorkerTypes.set(busType, {
        instance: null,
      });
    }
  }

  createFactoryService(busType: typeof WebpackWorker) {
    const worker = this.getWorker(busType);
    return <T extends object>(serviceName: string): T => {
      return new Proxy<T>(new (class MockService {})() as T, {
        get: (target, property, receiver) => {
          return (...args: any[]) => this.sendInvokeMessage(serviceName, property, [...args], worker as Worker);
        },
      });
    };
  }

  private sendInvokeMessage(serviceName: string, methodName: string | symbol, args: any[], worker: WebpackWorker) {
    const messageId = generateId();
    const command: SendMsgCommand = {
      type: "SEND_MSG",
      payload: {
        messageId,
        serviceName,
        methodName: methodName as string, // TODO: ....
        args,
      },
    };

    worker.postMessage(command);
    const dataSource = new Subject<unknown>();
    this.pending.set(messageId, dataSource);
    const targetObs$ = dataSource.asObservable();

    const dispose = () => {
      worker.postMessage({ type: "UNSUBSCRIBE", payload: command.payload } as UnsubscribeCommand);
      this.pending.delete(messageId);
      this.msgToSubMeta.delete(messageId);
    };

    return new Observable((observer) => {
      const sub = targetObs$.subscribe({
        next: (v) => observer.next(v),
        error: (e) => {
          dispose();
          observer.error(e);
        },
        complete: () => {
          dataSource.complete();
          dispose();
          observer.complete();
        },
      });
      this.msgToSubMeta.set(messageId, { command, sub });

      return sub;
    });
  }

  private getWorker(busType: typeof WebpackWorker): Worker {
    const typeSettings = this.busWorkerTypes.get(busType);
    if (!typeSettings) {
      throw new Error(
        `Unregister bus type ${busType.name}. Before use createFactoryService, you need invoke registerBusWorkers with your bus type.`
      );
    }

    let worker = typeSettings.instance;
    if (worker == null) {
      worker = new busType();
      worker.postMessage({ type: "INIT" } as InitCommand);
      worker.addEventListener("message", this.handleWorkerMsg);
      this.busWorkerTypes.set(busType, { ...typeSettings, instance: worker });
    }

    return worker;
  }

  private handleWorkerMsg = ({ data }: MessageEvent<ReturnCommand>) => {
    const { messageId } = data.payload;
    const dataSource = this.pending.get(messageId);
    if (!dataSource) return;

    const type = data.type;
    switch (type) {
      case "RETURN_NEXT":
        dataSource.next(data.payload.value);
        break;

      case "RETURN_ERROR":
        dataSource.error(data.payload.errorMsg);
        break;

      case "RETURN_COMPLETE":
        dataSource.complete();
        break;

      default:
        console.error(`unknown command type ${type}`);
        break;
    }
  };
}
