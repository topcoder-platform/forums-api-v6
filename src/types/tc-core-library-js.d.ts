declare module 'tc-core-library-js' {
  export const middleware: {
    jwtAuthenticator: (config: {
      AUTH_SECRET?: string;
      VALID_ISSUERS?: string;
    }) => (req: unknown, res: unknown, next: (error?: Error) => void) => void;
  };
}
