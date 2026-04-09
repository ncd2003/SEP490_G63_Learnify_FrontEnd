import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import envConfig from "@/schema/config.schema";

const getWsHttpEndpoint = () => {
  if (envConfig.VITE_WS_URL) {
    return envConfig.VITE_WS_URL.replace(/\/$/, "");
  }

  try {
    const apiUrl = new URL(envConfig.VITE_BASE_API_URL);
    apiUrl.pathname = "/ws";
    apiUrl.search = "";
    apiUrl.hash = "";
    return apiUrl.toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:8080/ws";
  }
};

export const createNotificationSocket = ({
  token,
  onConnected,
  onNotification,
  onAccountStatus,
  onError,
}) => {
  if (!token) {
    return () => {};
  }

  const client = new Client({
    webSocketFactory: () => new SockJS(getWsHttpEndpoint()),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      onConnected?.();

      client.subscribe("/user/queue/notifications", (message) => {
        try {
          const payload = JSON.parse(message.body);
          onNotification?.(payload);
        } catch (error) {
          onError?.(error);
        }
      });

      client.subscribe("/user/queue/account-status", (message) => {
        try {
          const payload = JSON.parse(message.body);
          onAccountStatus?.(payload);
        } catch (error) {
          onError?.(error);
        }
      });
    },
    onStompError: (frame) => {
      onError?.(new Error(frame.headers.message || "WebSocket STOMP error"));
    },
    onWebSocketError: (event) => {
      onError?.(new Error(event?.message || "WebSocket connection error"));
    },
  });

  client.activate();

  return () => {
    client.deactivate();
  };
};
