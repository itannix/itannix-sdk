import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceClient, type ConnectionStatus } from './VoiceClient';

export interface UseVoiceClientOptions {
  workspaceKey: string;
  clientId: string;
  clientSecret: string;
  serverUrl?: string;
  onTranscript?: (transcript: string) => void;
  onAssistantMessage?: (text: string, done: boolean) => void;
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseVoiceClientReturn {
  status: ConnectionStatus;
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

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const clientRef = useRef<VoiceClient | null>(null);

  // Store callbacks in refs to avoid recreating client on callback changes
  const onTranscriptRef = useRef(onTranscript);
  const onAssistantMessageRef = useRef(onAssistantMessage);
  const onFunctionCallRef = useRef(onFunctionCall);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onAssistantMessageRef.current = onAssistantMessage;
  }, [onAssistantMessage]);

  useEffect(() => {
    onFunctionCallRef.current = onFunctionCall;
  }, [onFunctionCall]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Initialize client
  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new VoiceClient({
        workspaceKey,
        clientId,
        clientSecret,
        serverUrl
      });

      clientRef.current.onStatusChange = (newStatus) => {
        setStatus(newStatus);
      };

      clientRef.current.onTranscript = (transcript) => {
        onTranscriptRef.current?.(transcript);
      };

      clientRef.current.onAssistantMessage = (text, done) => {
        onAssistantMessageRef.current?.(text, done);
      };

      clientRef.current.onFunctionCall = (name, args, callId) => {
        onFunctionCallRef.current?.(name, args, callId);
      };
    }
    return clientRef.current;
  }, [workspaceKey, clientId, clientSecret, serverUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      await getClient().connect();
    } catch (err) {
      onErrorRef.current?.(err as Error);
      throw err;
    }
  }, [getClient]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  const sendFunctionResult = useCallback((callId: string, result: Record<string, unknown>) => {
    if (clientRef.current) {
      clientRef.current.sendFunctionResult(callId, result);
    }
  }, []);

  return {
    status,
    connect,
    disconnect,
    sendFunctionResult
  };
}
