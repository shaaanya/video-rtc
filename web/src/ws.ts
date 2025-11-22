export type Message = {
  t: "join" | "offer" | "answer" | "ice" | "peer-join" | "leave" | "error";
  d?: any;
};

export class SignalingClient {
  private ws: WebSocket | null = null;
  private url: string;

  constructor(roomID: string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws?room=${roomID}`;
  }

  connect(onMessage: (msg: Message) => void, onOpen: () => void) {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      console.log("WS connected");
      onOpen();
    };
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        onMessage(msg);
      } catch (e) {
        console.error("Failed to parse message", e);
      }
    };
    this.ws.onerror = (e) => console.error("WS error", e);
    this.ws.onclose = () => console.log("WS closed");
  }

  send(msg: Message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  close() {
    this.ws?.close();
  }
}
