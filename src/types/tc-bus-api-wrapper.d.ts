declare module 'tc-bus-api-wrapper' {
  export interface TcBusApiWrapperOptions {
    AUTH0_URL?: string;
    AUTH0_AUDIENCE?: string;
    TOKEN_CACHE_TIME?: number;
    AUTH0_CLIENT_ID?: string;
    AUTH0_CLIENT_SECRET?: string;
    BUSAPI_URL?: string;
    KAFKA_ERROR_TOPIC?: string;
    AUTH0_PROXY_SERVER_URL?: string;
  }

  export interface TcBusApiMessage<T> {
    topic: string;
    originator: string;
    timestamp: string;
    'mime-type': string;
    payload: T;
  }

  export interface TcBusApiClient {
    postEvent: <T>(message: TcBusApiMessage<T>) => Promise<void>;
  }

  function busApi(options: TcBusApiWrapperOptions): TcBusApiClient;

  export = busApi;
}
