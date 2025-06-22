// lib/socketBus.ts
"use client";

import mitt from "mitt";               // tiny 400-byte event-bus
type Events = {
  open: void;
  close: void;
  error: Event;
  /* backend payloads */
  game_updated: any;
  game_started: any;
  game_closed: any;
  chat_message: any;
};

const emitter = mitt<Events>();

const WS_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
  "wss://webhooks-production-2e4f.up.railway.app/ws";

let ws: WebSocket | null = null;

function connect() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    emitter.emit("open");
  };

  ws.onmessage = (e) => {
    try {
      const { event, data } = JSON.parse(e.data);
      emitter.emit(event as keyof Events, data);
    } catch { /* ignore malformed */ }
  };

  ws.onclose = () => {
    emitter.emit("close");
    setTimeout(connect, 2_000);          // auto-reconnect
  };

  ws.onerror = (err) => emitter.emit("error", err as unknown as Event);
}

if (typeof window !== "undefined") connect();

/* public surface ------------------------------------------------------ */
export const socketBus = {
  /** listen */
  on: emitter.on,
  off: emitter.off,
  /** send to server */
  send(event: string, data: unknown) {
    ws?.readyState === WebSocket.OPEN &&
      ws.send(JSON.stringify({ event, data }));
  },
};