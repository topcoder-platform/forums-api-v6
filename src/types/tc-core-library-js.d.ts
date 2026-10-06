declare module 'tc-core-library-js' {
  export const auth: {
    m2m: (config: {
      AUTH0_URL?: string;
      AUTH0_AUDIENCE?: string;
      TOKEN_CACHE_TIME?: number;
      AUTH0_PROXY_SERVER_URL?: string;
    }) => {
      getMachineToken: (
        clientId: string,
        clientSecret: string,
      ) => Promise<string>;
    };
  };

  export const middleware: {
    jwtAuthenticator: (config: {
      AUTH_SECRET?: string;
      VALID_ISSUERS?: string;
    }) => (req: unknown, res: unknown, next: (error?: Error) => void) => void;
  };
}
