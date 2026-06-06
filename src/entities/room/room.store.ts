import { defineStore } from "pinia";
import type { Room } from "./room.types";
import { ref, computed } from "vue";
import { di } from "@/di";
import { useErrorHandler } from "@/shared/composables/useErrorHandler";
import router from "@/router";
import { useFormState } from "@/shared/composables/useFormState";

const STORAGE_KEY = "zm_room";

interface RoomState {
  room: Room | null;
}

export const useRoomStore = defineStore("room", () => {
  const roomRepository = di.roomRepository;
  const { withError } = useErrorHandler();
  const {
    loading: loadingOwned,
    startLoading: startLoadingOwned,
    stopLoading: stopLoadingOwned,
  } = useFormState();

  const {
    loading: loadingVisited,
    startLoading: startLoadingVisited,
    stopLoading: stopLoadingVisited,
  } = useFormState();

  function getSavedRoom() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { room: JSON.parse(saved) as Room };
      } catch {
        return { room: null };
      }
    }
    return { room: null };
  }

  const roomState = ref<RoomState>();
  roomState.value = getSavedRoom();

  const ownedRooms = ref<Room[]>([]);
  const visitedRooms = ref<Room[]>([]);

  async function loadOwnedRooms(userId: string) {
    startLoadingOwned();
    await withError(
      async () =>
        (ownedRooms.value = await roomRepository.getRoomsByUser(userId)),
      "loadOwnedRooms",
    );
    stopLoadingOwned();
  }

  async function loadVisitedRoomsExceptOwned(userId: string) {
    startLoadingVisited();
    await withError(async () => {
      const allVisited = await roomRepository.getVisitedRooms(userId);
      const ownedIds = new Set(ownedRooms.value.map((r) => r.id));
      visitedRooms.value = allVisited.filter((r) => !ownedIds.has(r.id));
    }, "loadVisitedRoomsExceptOwned");
    stopLoadingVisited();
  }

  function setRoom(room: Room) {
    roomState.value = { room: room };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
  }

  function clearRoom() {
    roomState.value = { room: null };
    localStorage.removeItem(STORAGE_KEY);
  }

  async function createRoom(
    roomName: string,
    password: string,
    createdBy: string,
  ) {
    await withError(async () => {
      const room = await roomRepository.createRoom(
        roomName,
        password,
        createdBy,
      );

      if (room === null) return;
      setRoom(room);
      router.push("/main");
    }, "Create Room");
  }

  async function joinRoom(roomName: string, password: string) {
    await withError(async () => {
      const room = await roomRepository.joinRoom(roomName, password);

      if (room === null) return;
      setRoom(room);
    }, "joinRoom");
  }

  async function trackRoomVisit(userId: string) {
    await withError(async () => {
      const flag = await roomRepository.trackRoomVisit(
        userId,
        roomState.value?.room?.id ?? "",
      );
      if (!flag) throw new Error("Не смог трекнуть");

      router.push("/main");
    }, "trackRoomVisit");
  }

  function selectRoom(room: Room) {
    setRoom(room);
    router.push("/main");
  }

  const isRoomSet = computed(() => roomState.value?.room !== null);
  const roomId = computed(() => roomState.value?.room?.id ?? "");
  const roomTitle = computed(() => roomState.value?.room?.title ?? "");

  return {
    isRoomSet,
    roomId,
    roomTitle,
    setRoom,
    clearRoom,

    createRoom,
    joinRoom,
    trackRoomVisit,
    selectRoom,

    ownedSet: {
      ownedRooms,
      loadingOwned,
      startLoadingOwned,
      stopLoadingOwned,
      loadOwnedRooms,
    },

    visitedSet: {
      visitedRooms,
      loadingVisited,
      startLoadingVisited,
      stopLoadingVisited,
      loadVisitedRoomsExceptOwned,
    },
  };
});
