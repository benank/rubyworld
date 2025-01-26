import { PartySocket } from "partysocket";
import { isDev } from "./env";

const HOST_URL = isDev
  ? "http://localhost:8787"
  : "https://rubyworld-server.benank.com";
const PARTY_NAME = "ruby-world-server";
const ROOM = "ruby-world-main";

class Socket {
  private socket: PartySocket;

  constructor() {
    this.socket = new PartySocket({
      host: HOST_URL,
      party: PARTY_NAME,
      room: ROOM,
    });

    this.socket.addEventListener("message", this.onMessage);
    this.socket.addEventListener("open", this.onOpen);
    this.socket.addEventListener("close", this.onClose);
    this.socket.addEventListener("error", this.onError);
  }

  send(message: string) {
    this.socket.send(message);
  }

  onOpen() {
    console.log("Socket opened");
  }

  onClose() {
    console.log("Socket closed");
  }

  onError(error: Event) {
    console.error("Socket error", error);
  }

  onMessage(event: MessageEvent) {
    console.log("Message received", event.data);
  }
}

const socket = new Socket();
export default socket;
