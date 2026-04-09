<template>
    <FormContainer>
        <Input
            label="Название комнаты"
            id="roomName"
            name="roomName"
            placeholder="Придумай название"
            v-model="roomNameModel"
        />
        <Input
            label="Пароль"
            id="roomPassword"
            name="roomPassword"
            type="password"
            placeholder="Придумай пароль"
            v-model="roomPasswordModel"
            :error="!!error"
            :errorMessage="error"
        />
        <Button :disabled="loading" @click="handleCreate">
            {{ loading ? "Создание..." : "Создать комнату" }}
        </Button>
    </FormContainer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useRoomStore } from "@/entities/room/room.store";
import { useRoomRepository } from "@/entities/room/room.repository";
import FormContainer from "./FormContainer.vue";
import Button from "./Button.vue";
import Input from "./Input.vue";

import { useAuthStore } from "@/entities/auth/auth.store";

const roomStore = useRoomStore();
const roomRepo = useRoomRepository();
const authStore = useAuthStore();
const router = useRouter();

const roomNameModel = ref("");
const roomPasswordModel = ref("");
const loading = ref(false);
const error = ref("");

async function handleCreate() {
    if (!roomNameModel.value || !roomPasswordModel.value) {
        error.value = "Заполни все поля";
        return;
    }

    loading.value = true;
    error.value = "";

    const result = await roomRepo.createRoom(
        roomNameModel.value,
        roomPasswordModel.value,
        authStore.currentUser?.id || "",
    );

    loading.value = false;

    if (result.success && result.room) {
        roomStore.setRoom(result.room.title, result.room.password);
        router.push("/main");
    } else {
        error.value = result.error || "Неизвестная ошибка";
    }
}
</script>

<style scoped></style>
