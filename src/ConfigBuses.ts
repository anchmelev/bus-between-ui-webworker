import { BusUI } from "./BusWorker/BusUI";
import ChartWorker from "worker-loader!./ChartWorker/ChartWorker";

BusUI.instance.registerBusWorkers([ChartWorker]);
export const chartWorkerFactory = BusUI.instance.createFactoryService(ChartWorker);
