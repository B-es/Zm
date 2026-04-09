<template>
    <FormContainer>
        <Input
            label="Название комнаты"
            id="roomName"
            name="roomName"
            placeholder="Введи название комнаты"
            v-model="roomNameModel"
        />
        <Input
            label="Пароль"
            id="roomPassword"
            name="roomPassword"
            type="password"
            placeholder="Введи пароль"
            v-model="roomPasswordModel"
            :error="!!error"
            :errorMessage="error"
        />
        <Button :disabled="loading" @click="handleJoin">
            {{ loading ? "Вход..." : "Войти в комнату" }}
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

const roomStore = useRoomStore();
const roomRepo = useRoomRepository();
const router = useRouter();

const roomNameModel = ref("");
const roomPasswordModel = ref("");
const loading = ref(false);
const error = ref("");

async function handleJoin() {
    if (!roomNameModel.value || !roomPasswordModel.value) {
        error.value = "Заполни все поля";
        return;
    }

    loading.value = true;
    error.value = "";

    const result = await roomRepo.joinRoom(
        roomNameModel.value,
        roomPasswordModel.value,
    );

    loading.value = false;

    if (result.success && result.room) {
        roomStore.setRoom(result.room.title, result.room.password);
        router.push("/main");
    } else {
        error.value = result.error || "Ошибка входа";
    }
}
</script>

<style scoped></style>
