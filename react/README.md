# @itannix/react

React SDK for the ItanniX Voice AI platform. Add real-time voice interactions to your React app with a simple hook or component.

## Installation

```bash
npm install @itannix/react
```

## Quick Start (Hook)

```tsx
import { useVoiceClient } from '@itannix/react';

function App() {
  const [messages, setMessages] = useState([]);

  const { status, connect, disconnect, sendFunctionResult } = useVoiceClient({
    workspaceKey: 'your-workspace-key',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    onTranscript: (text) => {
      setMessages(prev => [...prev, { role: 'user', text }]);
    },
    onAssistantMessage: (text, done) => {
      if (done) {
        setMessages(prev => [...prev, { role: 'assistant', text }]);
      }
    },
    onFunctionCall: (name, args, callId) => {
      // Handle function call
      sendFunctionResult(callId, { success: true });
    },
    onError: (error) => {
      console.error('Connection error:', error);
    }
  });

  return (
    <div>
      <p>Status: {status}</p>
      <button onClick={connect} disabled={status !== 'disconnected'}>
        Connect
      </button>
      <button onClick={disconnect} disabled={status === 'disconnected'}>
        Disconnect
      </button>
      {messages.map((msg, i) => (
        <p key={i}><strong>{msg.role}:</strong> {msg.text}</p>
      ))}
    </div>
  );
}
```

## Quick Start (Component)

```tsx
import { useRef } from 'react';
import { VoiceAssistant, VoiceAssistantRef } from '@itannix/react';

function App() {
  const assistantRef = useRef<VoiceAssistantRef>(null);
  const [status, setStatus] = useState('disconnected');

  return (
    <div>
      <VoiceAssistant
        ref={assistantRef}
        workspaceKey="your-workspace-key"
        clientId="your-client-id"
        clientSecret="your-client-secret"
        onStatusChange={setStatus}
        onTranscript={(text) => console.log('You:', text)}
        onAssistantMessage={(text, done) => {
          if (done) console.log('Assistant:', text);
        }}
      />
      <p>Status: {status}</p>
      <button onClick={() => assistantRef.current?.connect()}>
        Connect
      </button>
      <button onClick={() => assistantRef.current?.disconnect()}>
        Disconnect
      </button>
    </div>
  );
}
```

## Hook Options

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

## Hook Return Value

| Property | Type | Description |
|----------|------|-------------|
| `status` | `ConnectionStatus` | Current connection status: `'disconnected'`, `'connecting'`, `'connected'` |
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
| `onStatusChange` | `(status) => void` | No | Called when connection status changes |
| `onTranscript` | `(text) => void` | No | Called when user speech is transcribed |
| `onAssistantMessage` | `(text, done) => void` | No | Called with assistant response |
| `onFunctionCall` | `(name, args, callId) => void` | No | Called when assistant invokes a function |
| `onError` | `(error) => void` | No | Called on errors |

## Component Ref Methods

Access via `useRef`:

```tsx
const ref = useRef<VoiceAssistantRef>(null);

// Connect to voice service
ref.current?.connect();

// Disconnect
ref.current?.disconnect();

// Send function result
ref.current?.sendFunctionResult(callId, { success: true });

// Get current status
console.log(ref.current?.status);
```

## License

MIT
