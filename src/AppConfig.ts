/**
 * Сервис конфигурации приложения.
 * Используется для возможности конфигурировать приложения в режиме runtime
 */
export class AppConfig {
  apiUrl = "";

  public getData(): any {
    return JSON.parse(JSON.stringify(Object.assign({}, this)));
  }

  async init() {
    await this.load();
  }

  private async load(): Promise<void> {
    const resp = await fetch(`config.json`);
    const data = await resp.json();
    Object.assign(this, data);
  }
}

export const appConfig = new AppConfig();
appConfig.init();
