import { routePartykitRequest, Server } from 'partyserver';
import type { Connection, WSMessage } from 'partyserver';
import { ClientPacketType, ServerPacketType } from '../../src/packets';
import type {
	ClientPacket,
	ClientPlayerChatPacket,
	ClientPlayerMovePacket,
	ClientPlayerSpawnPacket,
	ServerInitPacket,
	ServerPacket,
	ServerPlayer,
	ServerPlayerChatPacket,
	ServerPlayerMovePacket,
	ServerPlayerRemovePacket,
	ServerPlayerSpawnPacket,
} from '../../src/packets';

type ThisEnv = Env & Record<string, DurableObjectNamespace>;

// Define your Server
export class RubyWorldServer extends Server {
	private players: Record<string, ServerPlayer> = {};

	static options = {
		hibernate: true,
	};

	onStart(): void | Promise<void> {}

	onClose(connection: Connection, code: number, reason: string, wasClean: boolean): void | Promise<void> {
		console.log('Connection closed', connection.id, code, reason, wasClean);
		this.onPlayerRemove(connection);
	}

	onConnect(connection: Connection) {
		console.log('Connected', connection.id, 'to server', this.name);
		connection.send(
			JSON.stringify({
				type: ServerPacketType.Init,
				players: Object.values(this.players),
			} satisfies ServerInitPacket)
		);
	}

	onRequest(request: Request): Response | Promise<Response> {
		// HTTP requests to the server are routed to this method
		return new Response();
	}

	onMessage(connection: Connection, message: WSMessage) {
		try {
			const packet = JSON.parse(message.toString()) as ClientPacket;
			if (!packet.type) {
				throw new Error('Missing packet type');
			}

			switch (packet.type) {
				case ClientPacketType.PlayerMove:
					this.onPlayerMove(connection, packet);
					break;
				case ClientPacketType.PlayerSpawn:
					this.onPlayerSpawn(connection, packet);
					break;
				case ClientPacketType.PlayerChat:
					this.onPlayerChat(connection, packet);
					break;
			}
		} catch (error) {
			console.error('Error parsing message from', connection.id, error);
		}
	}

	private onPlayerMove(connection: Connection, packet: ClientPlayerMovePacket) {
		if (!this.players[connection.id]) {
			return;
		}

		this.players[connection.id].x = packet.x;
		this.players[connection.id].y = packet.y;
		this.broadcast(
			JSON.stringify({
				type: ServerPacketType.PlayerMove,
				id: connection.id,
				x: packet.x,
				y: packet.y,
			} satisfies ServerPlayerMovePacket),
			[connection.id]
		);
	}

	private onPlayerSpawn(connection: Connection, packet: ClientPlayerSpawnPacket) {
		this.players[connection.id] = {
			...packet,
			id: connection.id,
		};
		this.broadcast(
			JSON.stringify({
				type: ServerPacketType.PlayerSpawn,
				player: this.players[connection.id],
			} satisfies ServerPlayerSpawnPacket),
			[connection.id]
		);
	}

	private onPlayerRemove(connection: Connection) {
		delete this.players[connection.id];
		this.broadcast(
			JSON.stringify({
				type: ServerPacketType.PlayerRemove,
				id: connection.id,
			} satisfies ServerPlayerRemovePacket)
		);
	}

	private onPlayerChat(connection: Connection, packet: ClientPlayerChatPacket) {
		this.broadcast(
			JSON.stringify({
				type: ServerPacketType.PlayerChat,
				id: connection.id,
				message: packet.message,
			} satisfies ServerPlayerChatPacket),
			[connection.id]
		);
	}

	onError(connection: Connection, error: unknown): void | Promise<void> {
		console.error('Error on connection', connection.id, error);
	}
}

export default {
	// Set up your fetch handler to use configured Servers
	async fetch(request: Request, env: ThisEnv): Promise<Response> {
		return (await routePartykitRequest(request, env)) || new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<ThisEnv>;
