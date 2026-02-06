<template>
  <div class="flex items-center justify-between p-4 border rounded-lg">
    <!-- Контент слева -->
    <RouterLink to="/">
      <Button> Выйти </Button>
    </RouterLink>

    <div class="flex items-center gap-8">
      <ConnectedUser :avatar-url="url" title="Title1"></ConnectedUser>
      <!-- Аватар справа сверху -->
      <AvatarBlock
        :avatar-url="url"
        :title="authStore.nickname"
        :description="authStore.room"
      ></AvatarBlock>
    </div>
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
import { onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useUserStore } from "@/entities/user/user.store";
import ConnectedUser from "@/components/ConnectedUser.vue";

const authStore = useUserStore();

const url = ref(
  "https://sun9-55.userapi.com/s/v1/ig2/qnw-kgD0Mg7UB0yF4UC055_Snp4BaW9UqxyxED1QyovREDY-uTa_WSxa2NB0p4wnS4eX5iwgfV_lezNcnOg_h0xu.jpg?quality=95&as=32x47,48x71,72x107,108x160,160x237,240x355,360x533,480x710,540x799&from=bu&u=Lxg3jai_vtfNfDROM7ZUU23e4_nXaq3dVpBb8AubRpU&cs=540x0",
);

import { useCardRepository } from '@/entities/card/card.repository'
import { useCardStore } from '@/entities/card/card.store'

const repo = useCardRepository()
const store = useCardStore()

onMounted(async () => {
  // 1. загрузка карточек
  store.setCards(await repo.fetchAll(roomId))

  // 2. подписка на realtime
  const unsubscribe = repo.subscribe(roomId, userId, store.applyRealtime)

  onUnmounted(unsubscribe)
})
</script>

<style scoped></style>
