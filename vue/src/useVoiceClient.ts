import { ref, onUnmounted, type Ref, computed, type MaybeRefOrGetter } from 'vue';
import { VoiceClient, type ConnectionStatus } from './VoiceClient';
import { toValue } from 'vue';

export interface UseVoiceClientOptions {
  workspaceKey: MaybeRefOrGetter<string>;
  clientId: MaybeRefOrGetter<string>;
  clientSecret: MaybeRefOrGetter<string>;
  serverUrl?: MaybeRefOrGetter<string | undefined>;
  onTranscript?: (transcript: string) => void;
  onAssistantMessage?: (text: string, done: boolean) => void;
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseVoiceClientReturn {
  status: Ref<ConnectionStatus>;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendFunctionResult: (callId: string, result: Record<string, unknown>) => void;
}

export function useVoiceClient(options: UseVoiceClientOptions): UseVoiceClientReturn {
  const {
    workspaceKey,
    clientId,
    clientSecret,
    serverUrl,
    onTranscript,
    onAssistantMessage,
    onFunctionCall,
    onError
  } = options;

  const status = ref<ConnectionStatus>('disconnected');
  let client: VoiceClient | null = null;

  const getClient = (): VoiceClient => {
    // Always create new client to use latest values
    if (client) {
      client.disconnect();
      client = null;
    }

    client = new VoiceClient({
      workspaceKey: toValue(workspaceKey),
      clientId: toValue(clientId),
      clientSecret: toValue(clientSecret),
      serverUrl: toValue(serverUrl)
    });

    client.onStatusChange = (newStatus) => {
      status.value = newStatus;
    };

    client.onTranscript = (transcript) => {
      onTranscript?.(transcript);
    };

    client.onAssistantMessage = (text, done) => {
      onAssistantMessage?.(text, done);
    };

    client.onFunctionCall = (name, args, callId) => {
      onFunctionCall?.(name, args, callId);
    };

    return client;
  };

  const connect = async (): Promise<void> => {
    try {
      await getClient().connect();
    } catch (err) {
      onError?.(err as Error);
      throw err;
    }
  };

  const disconnect = (): void => {
    if (client) {
      client.disconnect();
      client = null;
    }
  };

  const sendFunctionResult = (callId: string, result: Record<string, unknown>): void => {
    if (client) {
      client.sendFunctionResult(callId, result);
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    if (client) {
      client.disconnect();
      client = null;
    }
  });

  return {
    status,
    connect,
    disconnect,
    sendFunctionResult
  };
}
