import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuth = defineStore('auth', () => {
  const isAuth = ref(false);
  const nickname = ref('');
  const room = ref('');

  const login = (n: string, r: string) => {
    nickname.value = n
    room.value = r
    isAuth.value = true;
  }

  const logout = () => {
    isAuth.value = false;
  }

  return { isAuth, login, logout, nickname, room }
})
