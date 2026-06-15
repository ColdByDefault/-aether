type Bus = { push(type: string, data: unknown): void };

// Bridge to the EventEmitter set up in server.mjs via globalThis.
// No-op when running outside the custom server (tests, standalone Next.js).
export function push(type: string, data: unknown): void {
  (globalThis as { __dataBus?: Bus }).__dataBus?.push(type, data);
}
