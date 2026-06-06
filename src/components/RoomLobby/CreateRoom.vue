<template>
    <FormContainer>
        <Input
            label="Название комнаты"
            id="roomName"
            name="roomName"
            placeholder="Придумай название"
            v-model="roomNameModel"
            :error="!!error"
            :errorMessage="error"
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
import { useRoomStore } from "@/entities/room/room.store";
import { useUserStore } from "@/entities/user/user.store";
import { useFormState } from "@/shared/composables/useFormState";

const roomStore = useRoomStore();
const userStore = useUserStore();

const roomNameModel = ref("");
const roomPasswordModel = ref("");
const error = ref("");
const { startLoading, stopLoading, loading } = useFormState();

async function handleCreate() {
    if (!roomNameModel.value || !roomPasswordModel.value) {
        error.value = "Заполни все поля";
        return;
    }

    startLoading();

    await roomStore.createRoom(
        roomNameModel.value,
        roomPasswordModel.value,
        userStore.current?.id || "",
    );

    stopLoading();
}
</script>

<style scoped></style>
