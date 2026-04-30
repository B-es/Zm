<template>
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-800">404</h1>
            <p class="text-xl text-gray-600 mt-4">Страница не найдена</p>
            <RouterLink to="/main">
                <Button class="mt-6 w-auto">На главную</Button>
            </RouterLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import Button from "@/shared/components/Button.vue";
</script>
