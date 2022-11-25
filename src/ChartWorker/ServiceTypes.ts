import { AppConfig } from "../AppConfig";

export const TYPES = {
  ChartDataService: "ChartDataService",
};

export interface Configurable {
  init(appConfig: AppConfig): void;
}
