import { routePartykitRequest, Server } from 'partyserver';
import type { Connection, WSMessage } from 'partyserver';

type ThisEnv = Env & Record<string, DurableObjectNamespace>;

// Define your Server
export class RubyWorldServer extends Server {
	static options = {
		hibernate: true,
	};

	onStart(): void | Promise<void> {
		console.log('Server started');
	}

	onClose(connection: Connection, code: number, reason: string, wasClean: boolean): void | Promise<void> {
		console.log('Connection closed', connection.id, code, reason, wasClean);
	}

	onConnect(connection: Connection) {
		console.log('Connected', connection.id, 'to server', this.name);
	}

	onRequest(request: Request): Response | Promise<Response> {
		// HTTP requests to the server are routed to this method
		return new Response();
	}

	onMessage(connection: Connection, message: WSMessage) {
		console.log('Message from', connection.id, ':', message);
		// Send the message to every other connection
		this.broadcast(message, [connection.id]);
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
