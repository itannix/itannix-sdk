# ItanniX Voice SDK

Official SDKs for the ItanniX Voice AI platform. Add real-time voice interactions to your app with a few lines of code.

## Packages

| Package | Framework | Installation |
|---------|-----------|--------------|
| [@itannix/react](./react) | React | `npm install @itannix/react` |
| [@itannix/svelte](./svelte) | Svelte | `npm install @itannix/svelte` |
| [@itannix/vue](./vue) | Vue 3 | `npm install @itannix/vue` |

## Features

- Real-time voice conversations with AI assistants
- WebRTC-based low-latency audio streaming
- Speech-to-text transcription
- Streaming assistant responses
- Function calling support
- Simple hook/composable and component APIs

## Quick Example

### React

```tsx
import { useVoiceClient } from '@itannix/react';

function App() {
  const { status, connect, disconnect } = useVoiceClient({
    workspaceKey: 'your-workspace-key',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    onTranscript: (text) => console.log('You:', text),
    onAssistantMessage: (text, done) => {
      if (done) console.log('Assistant:', text);
    }
  });

  return (
    <div>
      <button onClick={connect}>Start</button>
      <button onClick={disconnect}>Stop</button>
    </div>
  );
}
```

### Svelte

```svelte
<script>
  import { VoiceAssistant } from '@itannix/svelte';
  let assistant;
</script>

<VoiceAssistant
  workspaceKey="your-workspace-key"
  clientId="your-client-id"
  clientSecret="your-client-secret"
  bind:this={assistant}
  on:transcript={(e) => console.log('You:', e.detail)}
  on:assistantMessage={(e) => {
    if (e.detail.done) console.log('Assistant:', e.detail.text);
  }}
/>

<button onclick={() => assistant.connect()}>Start</button>
<button onclick={() => assistant.disconnect()}>Stop</button>
```

### Vue

```vue
<template>
  <button @click="connect">Start</button>
  <button @click="disconnect">Stop</button>
</template>

<script setup>
import { useVoiceClient } from '@itannix/vue';

const { connect, disconnect } = useVoiceClient({
  workspaceKey: 'your-workspace-key',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  onTranscript: (text) => console.log('You:', text),
  onAssistantMessage: (text, done) => {
    if (done) console.log('Assistant:', text);
  }
});
</script>
```

## Getting Started

1. Sign up at [itannix.com](https://itannix.com) and create a workspace
2. Generate a workspace API key in Settings → Workspace
3. Create a client in the dashboard
4. Install the SDK for your framework
5. Use your workspace key, client ID, and secret to connect

See the [quickstart examples](https://github.com/itannix/itannix-quickstart) for complete working demos.

## Documentation

- [React SDK](./react/README.md)
- [Svelte SDK](./svelte/README.md)
- [Vue SDK](./vue/README.md)

## License

MIT
