import 'reflect-metadata';
import { Container } from 'inversify';
import { ChartDataService } from "./ChartDataService";
import { TYPES } from "./ServiceTypes";

const container = new Container();
container.bind<ChartDataService>(TYPES.ChartDataService).to(ChartDataService).inSingletonScope();
export { container };
