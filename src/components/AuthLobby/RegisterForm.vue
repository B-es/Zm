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
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="Введи email"
            v-model="emailModel"
            :error="!!authStore.authError"
            :errorMessage="authStore.authError || ''"
        />
        <Input
            label="Пароль"
            id="password"
            name="password"
            type="password"
            placeholder="Введи пароль (мин. 6 символов)"
            v-model="passwordModel"
            :error="!!authStore.authError"
            :errorMessage="authStore.authError || ''"
        />
        <Button :disabled="authStore.loading" @click="handleRegister">
            {{ authStore.loading ? "Регистрация..." : "Зарегистрироваться" }}
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
const router = useRouter();

const nicknameModel = ref("");
const emailModel = ref("");
const passwordModel = ref("");

async function handleRegister() {
    if (passwordModel.value.length < 6) {
        alert("Пароль должен содержать минимум 6 символов");
        return;
    }

    const result = await authStore.signUp(
        emailModel.value,
        passwordModel.value,
        nicknameModel.value,
    );
    if (result.success) {
        router.push("/");
    }
}
</script>

<style scoped></style>
