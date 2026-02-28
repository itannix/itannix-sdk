# @itannix/vue

Vue SDK for the ItanniX Voice AI platform. Add real-time voice interactions to your Vue app with a simple composable or component.

## Installation

```bash
npm install @itannix/vue
```

## Quick Start (Composable)

```vue
<template>
  <div>
    <p>Status: {{ status }}</p>
    <button @click="connect" :disabled="status !== 'disconnected'">
      Connect
    </button>
    <button @click="disconnect" :disabled="status === 'disconnected'">
      Disconnect
    </button>
    <div v-for="(msg, i) in messages" :key="i">
      <p><strong>{{ msg.role }}:</strong> {{ msg.text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useVoiceClient } from '@itannix/vue';

const messages = ref<Array<{ role: string; text: string }>>([]);

const { status, connect, disconnect, sendFunctionResult } = useVoiceClient({
  workspaceKey: 'your-workspace-key',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  onTranscript: (text) => {
    messages.value.push({ role: 'user', text });
  },
  onAssistantMessage: (text, done) => {
    if (done) {
      messages.value.push({ role: 'assistant', text });
    }
  },
  onFunctionCall: (name, args, callId) => {
    sendFunctionResult(callId, { success: true });
  },
  onError: (error) => {
    console.error('Connection error:', error);
  }
});
</script>
```

## Quick Start (Component)

```vue
<template>
  <div>
    <VoiceAssistant
      ref="assistantRef"
      workspace-key="your-workspace-key"
      client-id="your-client-id"
      client-secret="your-client-secret"
      @status-change="handleStatusChange"
      @transcript="handleTranscript"
      @assistant-message="handleAssistantMessage"
    />
    <p>Status: {{ status }}</p>
    <button @click="assistantRef?.connect()">Connect</button>
    <button @click="assistantRef?.disconnect()">Disconnect</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VoiceAssistant } from '@itannix/vue';
import type { ConnectionStatus } from '@itannix/vue';

const assistantRef = ref<InstanceType<typeof VoiceAssistant> | null>(null);
const status = ref<ConnectionStatus>('disconnected');

function handleStatusChange(newStatus: ConnectionStatus) {
  status.value = newStatus;
}

function handleTranscript(text: string) {
  console.log('You:', text);
}

function handleAssistantMessage(text: string, done: boolean) {
  if (done) console.log('Assistant:', text);
}
</script>
```

## Composable Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `workspaceKey` | `string` | Yes | Your workspace API key from workspace settings |
| `clientId` | `string` | Yes | Your ItanniX client ID |
| `clientSecret` | `string` | Yes | Your client secret |
| `serverUrl` | `string` | No | API server URL (default: `https://api.itannix.com`) |
| `onTranscript` | `(text: string) => void` | No | Called when user speech is transcribed |
| `onAssistantMessage` | `(text: string, done: boolean) => void` | No | Called with assistant response (streaming) |
| `onFunctionCall` | `(name, args, callId) => void` | No | Called when assistant invokes a function |
| `onError` | `(error: Error) => void` | No | Called on connection errors |

## Composable Return Value

| Property | Type | Description |
|----------|------|-------------|
| `status` | `Ref<ConnectionStatus>` | Current connection status (reactive) |
| `connect` | `() => Promise<void>` | Start voice connection |
| `disconnect` | `() => void` | End voice connection |
| `sendFunctionResult` | `(callId, result) => void` | Send function call result back to assistant |

## Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `workspaceKey` | `string` | Yes | Your workspace API key from workspace settings |
| `clientId` | `string` | Yes | Your ItanniX client ID |
| `clientSecret` | `string` | Yes | Your client secret |
| `serverUrl` | `string` | No | API server URL |

## Component Events

| Event | Payload | Description |
|-------|---------|-------------|
| `statusChange` | `ConnectionStatus` | Connection status changed |
| `transcript` | `string` | User speech transcribed |
| `assistantMessage` | `{ text: string, done: boolean }` | Assistant response (streaming) |
| `functionCall` | `{ name: string, args: object, callId: string }` | Function call from assistant |
| `error` | `Error` | Connection or runtime error |

## Component Methods

Access via template ref:

```vue
<VoiceAssistant ref="assistantRef" ... />

<script setup>
const assistantRef = ref();

// Connect
assistantRef.value?.connect();

// Disconnect
assistantRef.value?.disconnect();

// Send function result
assistantRef.value?.sendFunctionResult(callId, { success: true });

// Get status
console.log(assistantRef.value?.status);
</script>
```

## License

MIT
