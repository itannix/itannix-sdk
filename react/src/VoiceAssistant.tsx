import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { useVoiceClient, type UseVoiceClientOptions } from './useVoiceClient';
import type { ConnectionStatus } from './VoiceClient';

export interface VoiceAssistantProps {
  workspaceKey: string;
  clientId: string;
  clientSecret: string;
  serverUrl?: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onTranscript?: (transcript: string) => void;
  onAssistantMessage?: (text: string, done: boolean) => void;
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId: string) => void;
  onError?: (error: Error) => void;
}

export interface VoiceAssistantRef {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendFunctionResult: (callId: string, result: Record<string, unknown>) => void;
  status: ConnectionStatus;
}

export const VoiceAssistant = forwardRef<VoiceAssistantRef, VoiceAssistantProps>(
  function VoiceAssistant(props, ref) {
    const {
      workspaceKey,
      clientId,
      clientSecret,
      serverUrl,
      onStatusChange,
      onTranscript,
      onAssistantMessage,
      onFunctionCall,
      onError
    } = props;

    const options: UseVoiceClientOptions = {
      workspaceKey,
      clientId,
      clientSecret,
      serverUrl,
      onTranscript,
      onAssistantMessage,
      onFunctionCall,
      onError
    };

    const { status, connect, disconnect, sendFunctionResult } = useVoiceClient(options);

    // Track previous status to notify on changes
    const prevStatusRef = useRef(status);
    useEffect(() => {
      if (prevStatusRef.current !== status) {
        prevStatusRef.current = status;
        onStatusChange?.(status);
      }
    }, [status, onStatusChange]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      connect,
      disconnect,
      sendFunctionResult,
      status
    }), [connect, disconnect, sendFunctionResult, status]);

    // This is a headless component - no UI
    return null;
  }
);
