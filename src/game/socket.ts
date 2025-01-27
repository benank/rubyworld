import { PartySocket } from "partysocket";
import { isDev } from "../env";
import { ClientPacket, ServerPacket } from "./packets";

const HOST_URL = isDev
  ? "http://localhost:8787"
  : "https://rubyworld-server.benank.com";
const PARTY_NAME = "ruby-world-server";
const ROOM = "ruby-world-main";

class Socket {
  private socket: PartySocket;
  private messageListeners: Array<(packet: ServerPacket) => void> = [];

  constructor() {
    this.socket = new PartySocket({
      host: HOST_URL,
      party: PARTY_NAME,
      room: ROOM,
    });

    this.socket.addEventListener("message", this.onMessage.bind(this));
    this.socket.addEventListener("open", this.onOpen.bind(this));
    this.socket.addEventListener("close", this.onClose.bind(this));
    this.socket.addEventListener("error", this.onError.bind(this));
  }

  private onMessage(event: MessageEvent) {
    this.messageListeners.forEach((listener) => {
      listener(JSON.parse(event.data) as ServerPacket);
    });
  }

  public removeAllListeners() {
    this.messageListeners = [];
  }

  public send(message: ClientPacket) {
    this.sendMessage(JSON.stringify(message));
  }

  public recv(callback: (packet: ServerPacket) => void) {
    this.messageListeners.push(callback);
  }

  private sendMessage(message: string) {
    this.socket.send(message);
  }

  private onOpen() {}

  private onClose() {}

  private onError(error: Event) {
    console.error("Socket error", error);
  }
}

const socket = new Socket();
export default socket;
