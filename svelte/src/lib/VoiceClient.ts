/**
 * ItanniX Voice Client
 * A minimal WebRTC client for the ItanniX Realtime API
 */

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface VoiceClientOptions {
  workspaceKey: string;
  clientId: string;
  clientSecret: string;
  serverUrl?: string;
}

export interface FunctionCallEvent {
  name: string;
  args: Record<string, unknown>;
  callId: string;
}

export interface AssistantMessageEvent {
  text: string;
  done: boolean;
}

export interface VoiceClientCallbacks {
  onTranscript?: (transcript: string) => void;
  onAssistantMessage?: (text: string, done: boolean) => void;
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId: string) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

interface SessionResponse {
  id: string;
  iceServers?: RTCIceServer[];
}

interface RealtimeMessage {
  type: string;
  transcript?: string;
  delta?: string;
  item?: {
    type: string;
    call_id: string;
    name: string;
    arguments?: string;
  };
}

export class VoiceClient {
  private workspaceKey: string;
  private clientId: string;
  private clientSecret: string;
  private serverUrl: string;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private session: SessionResponse | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;

  public onTranscript: ((transcript: string) => void) | null = null;
  public onAssistantMessage: ((text: string, done: boolean) => void) | null = null;
  public onFunctionCall: ((name: string, args: Record<string, unknown>, callId: string) => void) | null = null;
  public onStatusChange: ((status: ConnectionStatus) => void) | null = null;

  constructor(options: VoiceClientOptions) {
    this.workspaceKey = options.workspaceKey;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.serverUrl = options.serverUrl ?? 'https://api.itannix.com';
  }

  async connect(): Promise<void> {
    this.updateStatus('connecting');

    // 1. Create session
    const sessionResponse = await fetch(`${this.serverUrl}/v1/realtime/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-Key': this.workspaceKey,
        'X-Client-Id': this.clientId,
        'X-Client-Secret': this.clientSecret
      },
      body: JSON.stringify({
        modalities: ['text', 'audio']
      })
    });

    if (!sessionResponse.ok) {
      const error = await this.parseError(sessionResponse, 'Session creation failed');
      throw error;
    }

    this.session = await sessionResponse.json();
    const { iceServers } = this.session!;

    // 2. Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: iceServers ?? [{ urls: 'stun:stun.cloudflare.com:3478' }]
    });

    // 3. Create data channel for messages
    this.dataChannel = this.peerConnection.createDataChannel('messages', {
      ordered: true
    });

    this.dataChannel.onopen = () => {
      this.updateStatus('connected');

      // Enable input audio transcription via session.update
      this.dataChannel?.send(JSON.stringify({
        type: 'session.update',
        session: {
          input_audio_transcription: {
            model: 'gpt-4o-mini-transcribe'
          }
        }
      }));
    };

    this.dataChannel.onclose = () => {
      this.updateStatus('disconnected');
    };

    this.dataChannel.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data) as RealtimeMessage;
      this.handleMessage(message);
    };

    // 4. Get user media (microphone)
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 48000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    this.localStream.getAudioTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    // 5. Handle remote audio
    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      const remoteStream = event.streams[0];
      this.remoteAudio = new Audio();
      this.remoteAudio.srcObject = remoteStream;
      this.remoteAudio.autoplay = true;
      this.remoteAudio.play().catch(() => {});
    };

    // 6. Create and send offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (this.peerConnection!.iceGatheringState === 'complete') {
        resolve();
      } else {
        this.peerConnection!.onicegatheringstatechange = () => {
          if (this.peerConnection!.iceGatheringState === 'complete') {
            resolve();
          }
        };
      }
    });

    // 7. Send SDP to server
    const sdpResponse = await fetch(`${this.serverUrl}/v1/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
        'X-Workspace-Key': this.workspaceKey,
        'X-Client-Id': this.clientId,
        'X-Client-Secret': this.clientSecret
      },
      body: this.peerConnection.localDescription!.sdp
    });

    if (!sdpResponse.ok) {
      const error = await this.parseError(sdpResponse, 'Connection failed');
      throw error;
    }

    // 8. Set remote description
    const answerSdp = await sdpResponse.text();
    await this.peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp
    });
  }

  private handleMessage(message: RealtimeMessage): void {
    // Handle user transcript (completed)
    if (message.type === 'conversation.item.input_audio_transcription.completed') {
      if (this.onTranscript && message.transcript) {
        this.onTranscript(message.transcript);
      }
      return;
    }

    // Handle assistant transcript (streaming)
    if (message.type === 'response.audio_transcript.delta') {
      if (this.onAssistantMessage && message.delta) {
        this.onAssistantMessage(message.delta, false);
      }
      return;
    }

    // Handle assistant transcript (complete)
    if (message.type === 'response.audio_transcript.done') {
      if (this.onAssistantMessage && message.transcript) {
        this.onAssistantMessage(message.transcript, true);
      }
      return;
    }

    // Handle function calls
    if (message.type === 'response.output_item.done' && message.item?.type === 'function_call') {
      const { call_id, name, arguments: args } = message.item;
      const parsedArgs = JSON.parse(args ?? '{}') as Record<string, unknown>;

      // Handle client-side functions
      const result = this.handleLocalFunction(name, parsedArgs);
      if (result !== null) {
        this.sendFunctionResult(call_id, result);
      } else if (this.onFunctionCall) {
        // Let the app handle it
        this.onFunctionCall(name, parsedArgs, call_id);
      }
    }
  }

  private handleLocalFunction(name: string, args: Record<string, unknown>): Record<string, unknown> | null {
    switch (name) {
      case 'set_device_volume':
        if (this.remoteAudio && args.volume_level !== undefined) {
          const level = Math.max(0, Math.min(100, parseInt(String(args.volume_level))));
          this.remoteAudio.volume = level / 100;
          return { success: true, volume: level };
        }
        break;

      case 'adjust_device_volume':
        if (this.remoteAudio && args.action) {
          let newVolume = this.remoteAudio.volume;
          if (args.action === 'increase') {
            newVolume = Math.min(1.0, newVolume + 0.1);
          } else if (args.action === 'decrease') {
            newVolume = Math.max(0.0, newVolume - 0.1);
          }
          this.remoteAudio.volume = newVolume;
          return { success: true, volume: Math.round(newVolume * 100) };
        }
        break;

      case 'quiet_device':
        if (this.remoteAudio) {
          this.remoteAudio.volume = 0;
          return { success: true, volume: 0 };
        }
        break;
    }

    return null;
  }

  sendFunctionResult(callId: string, result: Record<string, unknown>): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }

    this.dataChannel.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(result)
      }
    }));

    // Trigger response generation
    this.dataChannel.send(JSON.stringify({
      type: 'response.create'
    }));
  }

  private async parseError(response: Response, fallbackMessage: string): Promise<Error> {
    let message = `${fallbackMessage} (${response.status})`;
    let hint: string | null = null;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        message = errorData.message;
      }
      if (errorData.hint) {
        hint = errorData.hint;
      }
    } catch {
      // Response wasn't JSON, use status text
      if (response.statusText) {
        message = `${fallbackMessage}: ${response.statusText}`;
      }
    }

    const error = new Error(message) as Error & { status?: number; hint?: string | null };
    error.status = response.status;
    error.hint = hint;
    return error;
  }

  private updateStatus(status: ConnectionStatus): void {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio = null;
    }
    this.updateStatus('disconnected');
  }
}
