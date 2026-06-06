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
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useRoomStore } from "@/entities/room/room.store";
import { useUserStore } from "@/entities/user/user.store";
import { useFormState } from "@/shared/composables/useFormState";

const roomStore = useRoomStore();
const userStore = useUserStore();

const roomNameModel = ref("");
const roomPasswordModel = ref("");
const { loading, startLoading, stopLoading } = useFormState();
const error = ref("");

const userId = computed(() => userStore.current?.id || "");

async function handleJoin() {
    if (!roomNameModel.value || !roomPasswordModel.value) {
        error.value = "Заполни все поля";
        return;
    }

    startLoading();

    roomStore.joinRoom(roomNameModel.value, roomPasswordModel.value);

    stopLoading();

    roomStore.trackRoomVisit(userId.value);
}
</script>

<style scoped></style>
