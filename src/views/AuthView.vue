<template>
    <div class="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
        <tabs
            wrapper-class="bg-white rounded-lg shadow-lg overflow-hidden"
            nav-class="flex border-b border-gray-200"
            nav-item-class="flex-1"
            nav-item-active-class="bg-brand-default"
            nav-item-inactive-class="hover:bg-gray-50"
            nav-item-link-class="block text-center py-4 px-6 transition-colors duration-200"
            nav-item-link-active-class="text-white font-semibold border-b-2 border-red-600"
            nav-item-link-inactive-class="text-gray-600"
            panels-wrapper-class="p-6 min-h-[540px] flex flex-col h-full justify-end"
        >
            <tab name="Войти">
                <div class="flex-1">
                    <LoginForm />
                </div>
                <OAuth2Section />
            </tab>
            <tab name="Регистрация">
                <div class="flex-1">
                    <RegisterForm />
                </div>
                <OAuth2Section />
            </tab>
        </tabs>
    </div>
</template>

<script setup lang="ts">
import LoginForm from "@/components/LoginForm.vue";
import RegisterForm from "@/components/RegisterForm.vue";
import OAuth2Section from "@/components/OAuth2Section.vue";
</script>
