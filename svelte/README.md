# @itannix/svelte

Svelte SDK for the ItanniX Voice AI platform. Add real-time voice interactions to your Svelte app with a single component.

## Installation

```bash
npm install @itannix/svelte
```

## Quick Start

```svelte
<script>
  import { VoiceAssistant } from '@itannix/svelte';

  let assistant;
  let status = 'disconnected';
  let messages = [];

  function handleConnect() {
    assistant.connect();
  }

  function handleDisconnect() {
    assistant.disconnect();
  }
</script>

<VoiceAssistant
  workspaceKey="your-workspace-key"
  clientId="your-client-id"
  clientSecret="your-client-secret"
  bind:this={assistant}
  on:statusChange={(e) => status = e.detail}
  on:transcript={(e) => messages = [...messages, { role: 'user', text: e.detail }]}
  on:assistantMessage={(e) => {
    if (e.detail.done) {
      messages = [...messages, { role: 'assistant', text: e.detail.text }];
    }
  }}
/>

<p>Status: {status}</p>

<button onclick={handleConnect} disabled={status !== 'disconnected'}>
  Connect
</button>
<button onclick={handleDisconnect} disabled={status === 'disconnected'}>
  Disconnect
</button>

{#each messages as msg}
  <p><strong>{msg.role}:</strong> {msg.text}</p>
{/each}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `workspaceKey` | `string` | required | Your workspace API key from workspace settings |
| `clientId` | `string` | required | Your ItanniX client ID |
| `clientSecret` | `string` | required | Your client secret |
| `serverUrl` | `string` | `'https://api.itannix.com'` | API server URL |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `statusChange` | `string` | Connection status: `'connecting'`, `'connected'`, `'disconnected'` |
| `transcript` | `string` | User's speech transcription |
| `assistantMessage` | `{ text: string, done: boolean }` | Assistant response (streaming) |
| `functionCall` | `{ name: string, args: object, callId: string }` | Function call from assistant |

## Methods

Access via `bind:this`:

```svelte
<VoiceAssistant bind:this={assistant} ... />

<script>
  // Connect to the voice service
  assistant.connect();

  // Disconnect
  assistant.disconnect();

  // Send function call result back to assistant
  assistant.sendFunctionResult(callId, { success: true, data: ... });
</script>
```

## License

MIT
