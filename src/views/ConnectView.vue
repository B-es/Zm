<template>
  <div class="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
    <router-link to="/main">
      <div class="mt-6 flex flex-col gap-y-5 max-w-md">
        <Input
          id="nickname"
          name="nickname"
          placeholder="Введи свой ник"
          v-model="nicknameModel"
          baseInputClass="min-w-0 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500"
        />
        <Input
          id="room"
          name="room"
          placeholder="Введи название комнаты"
          v-model="roomModel"
          baseInputClass="min-w-0 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500"
        />
        <Button v-on:click="authStore.login(nicknameModel, roomModel)"
          >Соединиться с комнатой</Button
        >
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import Button from "@/components/Button.vue";
import Input from "@/components/Input.vue";
import { ref } from "vue";

import { useAuth } from "@/stores/auth";

const authStore = useAuth();

const nicknameModel = ref("");
const roomModel = ref("");
</script>
