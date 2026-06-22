<template>
    <FormContainer>
        <Input
            label="Nickname"
            id="nickname"
            name="nickname"
            type="text"
            placeholder="Введи никнейм"
            v-model="nicknameModel"
            :error="!!authStore.authError"
            :errorMessage="authStore.authError || ''"
        />
        <Input
            label="Пароль"
            id="password"
            name="password"
            type="password"
            placeholder="Введи пароль"
            v-model="passwordModel"
            :error="!!authStore.authError"
            :errorMessage="authStore.authError || ''"
        />
        <Button :disabled="authStore.isLoading" @click="handleLogin">
            {{ authStore.isLoading ? "Вход..." : "Войти" }}
        </Button>
    </FormContainer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/entities/auth/auth.store";
import FormContainer from "@/shared/components/FormContainer.vue";
import Button from "@/shared/components/Button.vue";
import Input from "@/shared/components/Input.vue";

const authStore = useAuthStore();

const nicknameModel = ref("");
const passwordModel = ref("");

async function handleLogin() {
    await authStore.signIn(nicknameModel.value, passwordModel.value);
}
</script>

<style scoped></style>
