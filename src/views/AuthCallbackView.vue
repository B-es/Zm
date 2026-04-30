<template>
    <div class="auth-callback-container">
        <div class="loading-spinner" v-if="!error">
            <div class="spinner"></div>
            <p>{{ statusMessage }}</p>
        </div>
        <div class="error-message" v-else>
            <h2>Ошибка авторизации</h2>
            <p>{{ error }}</p>
            <button @click="goToLogin" class="btn-primary">
                Вернуться на страницу входа
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/entities/auth/auth.store";

const router = useRouter();
const statusMessage = ref("Завершение авторизации...");
const error = ref<string | null>(null);

const goToLogin = () => {
    router.push("/auth");
};

const authStore = useAuthStore();

onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    console.log("Sobral");
    console.log(code);
    // await authStore.loadSessionWithCode(code || "");
    // await authStore.loadSession();
});
</script>

<style scoped>
.auth-callback-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-spinner,
.error-message {
    text-align: center;
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    min-width: 300px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.error-message h2 {
    color: #dc2626;
    margin-bottom: 1rem;
}

.error-message p {
    color: #666;
    margin-bottom: 1.5rem;
}

.btn-primary {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
}

.btn-primary:hover {
    background: #5a67d8;
}
</style>
