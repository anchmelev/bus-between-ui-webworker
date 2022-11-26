import { BusUI } from "./BusWorker/BusUI";
import ChartWorker from "worker-loader!./ChartWorker/ChartWorker";
import { ReturnType } from "./BusWorker/BusTypes";

BusUI.instance.registerBusWorkers([{ busType: ChartWorker, useReturnTypes: ReturnType.promise }]);
export const chartWorkerFactory = BusUI.instance.createFactoryService(ChartWorker);
