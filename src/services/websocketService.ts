import { getUserUUID, getStoredToken } from "./postService";
import { authService } from "./authService";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // Match server's 5 second retry
  private messageListeners: ((message: any) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private isConnecting = false;
  private authToken: string | null = null;
  private userId: string | null = null;

  private readonly WS_URL = "wss://whispernet-socket.onrender.com";

  connect = async (): Promise<void> => {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Get authentication credentials
      this.authToken = await getStoredToken();
      const currentUser = await authService.getCurrentUser();
      this.userId = currentUser?.user_id || currentUser?.id;

      if (!this.userId || !this.authToken) {
        this.isConnecting = false;
        return;
      }

      // Use the EXACT format the server expects: ?token=...&userId=...
      const wsUrlWithParams = `${this.WS_URL}?token=${encodeURIComponent(
        this.authToken
      )}&userId=${encodeURIComponent(this.userId)}`;

      this.ws = new WebSocket(wsUrlWithParams);

      this.ws.onopen = () => {
        console.log("✅ Connected to WebSocket server");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.notifyMessageListeners(message);
        } catch (error) {}
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.isConnecting = false;
        this.notifyConnectionListeners(false);

        // Match server's retry logic
        setTimeout(() => {
          this.retryConnection();
        }, this.reconnectInterval);
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        this.notifyConnectionListeners(false);
      };
    } catch (error) {
      this.isConnecting = false;
    }
  };

  private retryConnection = (): void => {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    this.connect();
  };

  disconnect = (): void => {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  };

  sendChatMessage = async (payload: {
    message: string;
    sender: string;
    receiver: string | string[];
    roomId: string;
    messageId: string;
    uuid: string;
    selectedChatType: string;
    media?: any[];
    token?: string;
  }): Promise<void> => {
    if (!this.isConnected()) {
      await this.connect();

      // Wait a bit for connection to establish
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      const userUUID = await getUserUUID();
      const token = await getStoredToken();

      // Ensure receiver is an array with [senderId, receiverId] format
      let receiverArray: number[];
      if (payload.selectedChatType === "group") {
        // For group chats, receiver is just the group members (could be multiple)
        if (Array.isArray(payload.receiver)) {
          receiverArray = payload.receiver.map((r) => parseInt(String(r)));
        } else {
          receiverArray = [parseInt(String(payload.receiver))];
        }
      } else {
        // For individual chats: [senderId, receiverId]
        if (Array.isArray(payload.receiver)) {
          receiverArray = payload.receiver.map((r) => parseInt(String(r)));
        } else {
          receiverArray = [
            parseInt(payload.sender),
            parseInt(String(payload.receiver)),
          ];
        }
      }

      // Create the message in the EXACT format the server expects WITH data wrapper
      const wsMessage = {
        type: "chat",
        data: {
          message: payload.message.trim(),
          sender: parseInt(payload.sender),
          receiver: receiverArray,
          type: "chat",
          roomId: parseInt(payload.roomId),
          timestamp: new Date().getTime(),
          token: token,
          uuid: payload.uuid,
          userUUID: userUUID,
          direction: "sent",
          msgid: parseInt(payload.messageId),
          media: payload.media && payload.media.length > 0,
          msgtype: payload.selectedChatType,
        },
      };

      this.send(wsMessage);
    } catch (error) {}
  };

  private send = (message: any): void => {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  };

  isConnected = (): boolean => {
    return this.ws?.readyState === WebSocket.OPEN;
  };

  // Message listeners
  addMessageListener = (listener: (message: any) => void): void => {
    this.messageListeners.push(listener);
  };

  removeMessageListener = (listener: (message: any) => void): void => {
    this.messageListeners = this.messageListeners.filter((l) => l !== listener);
  };

  private notifyMessageListeners = (message: any): void => {
    this.messageListeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {}
    });
  };

  // Connection listeners
  addConnectionListener = (listener: (connected: boolean) => void): void => {
    this.connectionListeners.push(listener);
  };

  removeConnectionListener = (listener: (connected: boolean) => void): void => {
    this.connectionListeners = this.connectionListeners.filter(
      (l) => l !== listener
    );
  };

  private notifyConnectionListeners = (connected: boolean): void => {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (error) {}
    });
  };
}

// Create singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
