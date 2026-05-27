import { defineStore } from "pinia";
import { ref } from "vue";

export interface PeerCursor {
  userId: string;
  nickname: string;
  avatarUrl: string;
  x: number;
  y: number;
  visible: boolean;
  lastUpdate: number;
}

// Время неактивности (мс) до удаления пира
const PEER_TIMEOUT = 5000;
// Интервал heartbeat
const HEARTBEAT_INTERVAL = 2000;

export const useCursorStore = defineStore("cursor", () => {
  // ===== state =====
  const peers = ref<Record<string, PeerCursor>>({});

  // ===== state (private) =====
  let broadcastChannel: ReturnType<typeof supabase.channel> | null = null;
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let cleanupTimer: ReturnType<typeof setInterval> | null = null;
  let myUserId = "";
  let myNickname = "";
  let myAvatarUrl = "";
  let isSubscribed = false;

  // ===== actions =====
  const setPeerCursor = (peer: Omit<PeerCursor, "lastUpdate">) => {
    peers.value[peer.userId] = {
      ...peer,
      lastUpdate: Date.now(),
    };
  };

  const broadcastPresence = (
    userId: string,
    nickname: string,
    avatarUrl: string,
    x: number,
    y: number,
  ) => {
    if (!broadcastChannel || !isSubscribed) return;
    broadcastChannel.send(
      {
        type: "broadcast",
        event: "cursor-move",
        payload: { userId, nickname, avatarUrl, x, y },
      },
      { httpSend: true },
    );
  };

  const broadcastPosition = (
    userId: string,
    nickname: string,
    avatarUrl: string,
    x: number,
    y: number,
  ) => {
    if (!broadcastChannel) return;

    // Throttle ~50ms (20fps)
    if (throttleTimer) return;

    throttleTimer = setTimeout(() => {
      throttleTimer = null;
    }, 50);

    broadcastPresence(userId, nickname, avatarUrl, x, y);
  };

  const joinRoom = (
    roomId: string,
    userId: string,
    nickname: string,
    avatarUrl: string,
  ) => {
    leaveRoom();
    myUserId = userId;
    myNickname = nickname;
    myAvatarUrl = avatarUrl;

    const ch = supabase.channel(`cursors:${roomId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    ch.on("broadcast", { event: "cursor-move" }, (payload) => {
      const data = payload.payload as {
        userId: string;
        nickname: string;
        avatarUrl: string;
        x: number;
        y: number;
      };
      if (data.userId !== userId) {
        setPeerCursor({
          userId: data.userId,
          nickname: data.nickname,
          avatarUrl: data.avatarUrl || "",
          x: data.x,
          y: data.y,
          visible: true,
        });
      }
    });

    broadcastChannel = ch;
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        isSubscribed = true;
        // Сразу отправляем свою позицию
        broadcastPresence(userId, nickname, avatarUrl, 0, 0);
      }
    });

    // Heartbeat — периодически обновляем lastUpdate для stale-очистки
    heartbeatTimer = setInterval(() => {
      if (broadcastChannel && isSubscribed) {
        broadcastPresence(userId, nickname, avatarUrl, -1, -1);
      }
    }, HEARTBEAT_INTERVAL);

    // Cleanup stale peers
    cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [uid, peer] of Object.entries(peers.value)) {
        if (now - peer.lastUpdate > PEER_TIMEOUT) {
          delete peers.value[uid];
        }
      }
    }, 3000);
  };

  const leaveRoom = () => {
    // Уведомляем об уходе
    if (broadcastChannel && isSubscribed && myUserId) {
      broadcastPresence(myUserId, myNickname, "", -1, -1);
    }

    isSubscribed = false;
    peers.value = {};
    myUserId = "";
    myNickname = "";
    myAvatarUrl = "";

    if (broadcastChannel) {
      supabase.removeChannel(broadcastChannel);
      broadcastChannel = null;
    }
    if (throttleTimer) {
      clearTimeout(throttleTimer);
      throttleTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  };

  return {
    peers,
    setPeerCursor,
    removePeer: (userId: string) => delete peers.value[userId],
    broadcastPosition,
    joinRoom,
    leaveRoom,
  };
});
