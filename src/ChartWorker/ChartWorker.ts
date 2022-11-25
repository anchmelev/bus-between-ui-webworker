import { appConfig } from "../AppConfig";
import { InitEventHandler, ServiceGetter } from "../BusWorker/BusTypes";
import { BusWorker } from "../BusWorker/BusWorker";
import { container } from "./InversifyСonfig";
import { Configurable, TYPES } from "./ServiceTypes";

const initHandler: InitEventHandler = () =>
  Object.values(TYPES).forEach((serviceName) => {
    const service = container.get(serviceName) as Configurable;
    if (service.init && service.init instanceof Function) {
      service.init(appConfig);
    }
  });

const serviceGetter: ServiceGetter = (serviceName) => container.get(serviceName);

BusWorker.connectToBus(serviceGetter, initHandler);
