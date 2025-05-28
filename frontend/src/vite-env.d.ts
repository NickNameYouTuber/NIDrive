/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly [key: string]: string | boolean | undefined;
    readonly VITE_API_URL?: string;
  };
}
