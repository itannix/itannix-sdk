<script setup lang="ts">
import { computed, watch } from 'vue';
import { useVoiceClient, type UseVoiceClientOptions } from './useVoiceClient';
import type { ConnectionStatus } from './VoiceClient';

interface Props {
  workspaceKey: string;
  clientId: string;
  clientSecret: string;
  serverUrl?: string;
}

interface Emits {
  (e: 'statusChange', status: ConnectionStatus): void;
  (e: 'transcript', transcript: string): void;
  (e: 'assistantMessage', text: string, done: boolean): void;
  (e: 'functionCall', name: string, args: Record<string, unknown>, callId: string): void;
  (e: 'error', error: Error): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const options: UseVoiceClientOptions = {
  workspaceKey: computed(() => props.workspaceKey),
  clientId: computed(() => props.clientId),
  clientSecret: computed(() => props.clientSecret),
  serverUrl: computed(() => props.serverUrl),
  onTranscript: (transcript) => emit('transcript', transcript),
  onAssistantMessage: (text, done) => emit('assistantMessage', text, done),
  onFunctionCall: (name, args, callId) => emit('functionCall', name, args, callId),
  onError: (error) => emit('error', error)
};

const { status, connect, disconnect, sendFunctionResult } = useVoiceClient(options);

// Watch status changes and emit
watch(status, (newStatus) => {
  emit('statusChange', newStatus);
}, { immediate: true });

// Expose methods for parent component
defineExpose({
  connect,
  disconnect,
  sendFunctionResult,
  status
});
</script>
