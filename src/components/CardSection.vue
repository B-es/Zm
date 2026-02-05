<template>
  <div class="p-6 max-w-2xl mx-auto">
    <div
      class="flex items-center gap-3 mb-6 group"
      title="Нажмите для действий"
    >
      <button
        class="p-2 rounded-lg transition-all duration-200 relative group/btn"
      >
        <!-- Подсказка при наведении -->
        <div
          class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
        >
          Открыть архив
        </div>

        <img
          width="32"
          height="32"
          :src="archiveIcon"
          alt="Архив"
          class="transition-all duration-200 group-hover:sepia group-hover:brightness-200"
        />
      </button>
      <h1 class="text-2xl font-bold">{{ title }}</h1>
    </div>

    <!-- Список карточек -->
    <div class="space-y-4">
      <ContentCard
        v-for="(card, index) in cards"
        :key="card.id"
        :title="card.title"
        :description="card.description"
        @update="(data) => updateCard(index, card.id, data)"
        @delete="deleteCard(index)"
      />
    </div>

    <!-- Добавить новую карточку -->
    <button
      @click="addCard"
      class="mt-6 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition"
    >
      + Добавить новую карточку
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ContentCard from "@/components/ContentCard.vue";
import archiveIcon from "/archive_icon.svg";

const props = withDefaults(
  defineProps<{
    title?: string;
  }>(),
  {
    title: "Редактируемые карточки", // только для необязательных props
  },
);

interface Card {
  id: number;
  title: string;
  description: string;
}

const cards = ref<Card[]>([]);

const updateCard = (
  index: number,
  id: number,
  data: { title: string; description: string },
) => {
  cards.value[index] = { id, ...data };
};

const deleteCard = (index: number) => {
  cards.value.splice(index, 1);
};

const addCard = () => {
  const newId =
    cards.value.length > 0 ? Math.max(...cards.value.map((c) => c.id)) + 1 : 1;

  cards.value.push({
    id: newId,
    title: "Новая задача",
    description: "Опишите задачу здесь...",
  });
};
</script>
