<template>
  <div class="flex items-center justify-between p-4 border rounded-lg">
    <!-- Контент слева -->
    <RouterLink to="/">
      <Button> Выйти </Button>
    </RouterLink>

    <!-- Аватар справа сверху -->
    <AvatarBlock
      :avatar-url="url"
      :title="authStore.nickname"
      :description="authStore.room"
    ></AvatarBlock>
  </div>
  <div class="flex justify-evenly">
    <CardSection title="Посмотрим"></CardSection>
    <CardSection title="Сходим"></CardSection>
    <CardSection title="Сделаем"></CardSection>
</div>
</template>

<script setup lang="ts">
import AvatarBlock from "@/components/AvatarBlock.vue";
import Button from "@/components/Button.vue";
import CardSection from "@/components/CardSection.vue";
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useAuth } from "@/stores/auth";

const authStore = useAuth()

const url = ref(
  "https://sun9-55.userapi.com/s/v1/ig2/qnw-kgD0Mg7UB0yF4UC055_Snp4BaW9UqxyxED1QyovREDY-uTa_WSxa2NB0p4wnS4eX5iwgfV_lezNcnOg_h0xu.jpg?quality=95&as=32x47,48x71,72x107,108x160,160x237,240x355,360x533,480x710,540x799&from=bu&u=Lxg3jai_vtfNfDROM7ZUU23e4_nXaq3dVpBb8AubRpU&cs=540x0",
);
</script>

<style scoped></style>
