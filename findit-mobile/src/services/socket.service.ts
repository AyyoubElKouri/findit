import { io, Socket } from 'socket.io-client';
import mitt, { Emitter } from 'mitt';

// Create a type for our events
type SocketEvents = {
  isConnected: boolean;
};

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  public isConnected = false;
  private eventEmitter: Emitter<SocketEvents>;

  private constructor() {
    // Private constructor to prevent direct instantiation
    this.eventEmitter = mitt<SocketEvents>();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public on<Key extends keyof SocketEvents>(type: Key, handler: (event: SocketEvents[Key]) => void) {
    this.eventEmitter.on(type, handler);
  }

  public off<Key extends keyof SocketEvents>(type: Key, handler: (event: SocketEvents[Key]) => void) {
    this.eventEmitter.off(type, handler);
  }

  public connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    // Ensure any old socket is disconnected before creating a new one
    if (this.socket) {
      this.socket.disconnect();
    }

    const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

    this.socket = io(`${API_URL}/chat`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.eventEmitter.emit('isConnected', true);
      console.log('Socket connected!');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.eventEmitter.emit('isConnected', false);
      console.log('Socket disconnected!');
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventEmitter.emit('isConnected', false);
    }
  }

  public joinConversation(conversationId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  public leaveConversation(conversationId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  public sendMessage(conversationId: string, content: string, photoUrl?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        conversationId,
        content,
        photoUrl,
      });
    }
  }

  public markRead(conversationId: string, messageId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', {
        conversationId,
        messageId,
      });
    }
  }

  public registerEventListeners(chatStore: any) {
    if (!this.socket) return;

    this.socket.on('new_message', (message: any) => {
      chatStore.addMessage(message);
    });

    this.socket.on('message_read', (data: any) => {
      chatStore.markConversationRead(data.conversationId, data.messageId);
    });

    this.socket.on('conversation_updated', (conversation: any) => {
      chatStore.updateConversation(conversation);
    });

    this.socket.on('error', async (error: any) => {
      if (error?.code === 'UNAUTHORIZED') {
        // Ici, il faudrait rafraîchir le token (ex: via authStore ou une fonction dédiée)
        // await refreshToken();
        // Puis reconnecter le socket avec le nouveau token
      } else {
        console.error('Socket error:', error);
      }
    });
  }
}

export default SocketService.getInstance();
