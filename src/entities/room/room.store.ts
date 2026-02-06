import { ref } from "vue";
import type { Room } from "./room.types";
import { useRoomRepository } from "./room.repository";

const room = ref<Room | null>(null);

export function useRoomStore(){

  const roomRepo = useRoomRepository()
    function setRoom(roomName:string, roomPassword: string){
        room.value = {id: roomName, title: roomName, password: roomPassword}
        roomRepo.update(room.value)
    }

    function isExist(roomId:string){
        return roomRepo.isExist(roomId)
    }

    return {
        room,
        setRoom,
        isExist
    }
}