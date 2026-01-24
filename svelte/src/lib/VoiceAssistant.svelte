<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { VoiceClient, type ConnectionStatus } from './VoiceClient.js';

	// Props
	export let clientId: string;
	export let clientSecret: string;
	export let serverUrl: string = 'https://api.itannix.com';

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		statusChange: ConnectionStatus;
		transcript: string;
		assistantMessage: { text: string; done: boolean };
		functionCall: { name: string; args: Record<string, unknown>; callId: string };
		error: Error;
	}>();

	// Internal client instance
	let client: VoiceClient | null = null;

	// Initialize client when props are available
	function getClient(): VoiceClient {
		if (!client) {
			client = new VoiceClient({ clientId, clientSecret, serverUrl });

			client.onStatusChange = (status) => {
				dispatch('statusChange', status);
			};

			client.onTranscript = (transcript) => {
				dispatch('transcript', transcript);
			};

			client.onAssistantMessage = (text, done) => {
				dispatch('assistantMessage', { text, done });
			};

			client.onFunctionCall = (name, args, callId) => {
				dispatch('functionCall', { name, args, callId });
			};
		}
		return client;
	}

	// Public methods exposed via bind:this
	export async function connect(): Promise<void> {
		try {
			await getClient().connect();
		} catch (err) {
			dispatch('error', err as Error);
			throw err;
		}
	}

	export function disconnect(): void {
		if (client) {
			client.disconnect();
		}
	}

	export function sendFunctionResult(callId: string, result: Record<string, unknown>): void {
		if (client) {
			client.sendFunctionResult(callId, result);
		}
	}

	// Cleanup on component destroy
	onDestroy(() => {
		if (client) {
			client.disconnect();
			client = null;
		}
	});
</script>
