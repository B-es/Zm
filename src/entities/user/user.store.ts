import { ref, type Ref } from 'vue';
import type { User } from './user.types';
import { useRoomStore } from '../room/room.store';

const currentUser = ref<User | null>(null);
const peerUser = ref<User | null>(null);

export function useUserStore() {
   function setUser(nickname: string, userRef: Ref<User | null>){
    userRef.value = {id: nickname, nickname}
   }

  const roomStore = useRoomStore()

  function logIn(nickname: string, room: string, roomPassword: string){
    setUser(nickname, currentUser)
    roomStore.setRoom(room, roomPassword)
  }

  const setPeer = (nickname: string) => setUser(nickname, peerUser);
 

  return {
    currentUser,
    peerUser,
    logIn,
    setPeer,
  };
}