<template>
    <FormContainer>
      <Input
        label="Ник"
        id="nickname"
        name="nickname"
        placeholder="Введи свой ник"
        v-model="nicknameModel"
      />
      <Input
        label="Название комнаты"
        id="room"
        name="room"
        placeholder="Введи название комнаты"
        v-model="roomModel"
      />
       <Input
        label="Пароль от комнаты"
        id="roomPassword"
        name="roomPassword"
        placeholder="Введи пароль от комнаты"
        v-model="roomPasswordModel"
      />
      <router-link to="/main">
        <Button v-on:click="authStore.login(nicknameModel, roomModel)"
          >Соединиться с комнатой</Button
        >
      </router-link>
    </FormContainer>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import Button from "@/components/Button.vue";
import Input from "@/components/Input.vue";
import { ref } from "vue";

import { useAuth } from "@/stores/auth";
import FormContainer from "./FormContainer.vue";

const authStore = useAuth();

const nicknameModel = ref("");
const roomModel = ref("");
const roomPasswordModel = ref("")
</script>

<style scoped>

</style>