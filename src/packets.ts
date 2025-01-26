// MARK: Client
// Packets that are sent from the client to the server
export enum ClientPacketType {
  PlayerMove = 1,
  PlayerSpawn = 2,
  PlayerRemove = 3,
  PlayerChat = 4,
}

export interface ClientPlayerMovePacket {
  type: ClientPacketType.PlayerMove;
  x: number;
  y: number;
}

export interface ClientPlayerSpawnPacket {
  type: ClientPacketType.PlayerSpawn;
  x: number;
  y: number;
  name: string;
  spriteIndex: number;
}

export interface ClientPlayerChatPacket {
  type: ClientPacketType.PlayerChat;
  message: string;
}

export type ClientPacket =
  | ClientPlayerMovePacket
  | ClientPlayerSpawnPacket
  | ClientPlayerChatPacket;

// MARK: Server
// Packets that are sent from the server to the client
export enum ServerPacketType {
  PlayerMove = 1,
  PlayerSpawn = 2,
  PlayerRemove = 3,
  PlayerChat = 4,
}

export interface ServerPlayerMovePacket {
  type: ServerPacketType.PlayerMove;
  id: number;
  x: number;
  y: number;
}

export interface PlayerSpawnPacket {
  type: ServerPacketType.PlayerSpawn;
  id: number;
  x: number;
  y: number;
  name: string;
  spriteIndex: number;
}

export interface ServerPlayerRemovePacket {
  type: ServerPacketType.PlayerRemove;
  id: number;
}

export interface ServerPlayerChatPacket {
  type: ServerPacketType.PlayerChat;
  id: number;
  message: string;
}

export type ServerPacket =
  | ServerPlayerMovePacket
  | ServerPlayerChatPacket
  | ServerPlayerRemovePacket;
