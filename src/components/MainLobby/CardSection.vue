<template>
    <div class="p-6 max-w-2xl mx-auto">
        <div
            class="flex items-center gap-3 mb-6 group"
            title="Нажмите для действий"
        >
            <button
                class="p-2 rounded-lg transition-all duration-200 relative group/btn"
                @click="toggleArchive"
                :class="{ 'bg-gray-200': isArchive }"
            >
                <!-- Подсказка при наведении -->
                <div
                    class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
                >
                    {{ isArchive ? "Закрыть архив" : "Открыть архив" }}
                </div>

                <img
                    width="32"
                    height="32"
                    :src="archiveIcon"
                    alt="Архив"
                    class="transition-all duration-200 group-hover:sepia group-hover:brightness-200"
                />
            </button>
            <h1 class="text-2xl font-bold">
                {{ title }}
                <span
                    v-if="isArchive"
                    class="text-sm font-normal text-gray-400 ml-2"
                >
                    (Архив)
                </span>
            </h1>
        </div>

        <!-- Индикатор загрузки -->
        <div v-if="cardStore.isLoading" class="text-center py-8 text-gray-400">
            Загрузка...
        </div>

        <!-- Список карточек -->
        <div v-else class="space-y-4">
            <ContentCard
                v-for="card in sectionCards"
                :key="card.id"
                :card-id="card.id"
                :title="card.title"
                :description="card.description"
                :banner-url="card.bannerUrl || ''"
                :created-by="card.createdBy"
                :updated-by="card.updatedBy"
                :user-id="currentUserId"
                :locked-by="cardStore.getCardEditor(card.id)"
                :can-start-edit="canEditCard(card.id)"
                @request-edit="onRequestEdit"
                @update="(data) => onUpdateCard(card.id, data)"
                @stop-edit="onStopEdit(card.id)"
                @editing-draft="(payload) => onEditingDraft(payload)"
                @mark="onMarkCard(card.id)"
                @delete="onDeleteCard(card.id)"
                @update-banner="onUpdateBanner"
            />
        </div>

        <!-- Добавить новую карточку -->
        <button
            @click="onAddCard"
            :disabled="cardStore.isLoading"
            class="mt-6 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition disabled:opacity-50"
        >
            + Добавить новую карточку
        </button>

        <!-- Toast уведомление -->
        <div
            v-if="toastMessage"
            class="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300"
        >
            {{ toastMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import ContentCard from "./ContentCard.vue";
import archiveIcon from "/archive_icon.svg";
import { useCardStore } from "@/entities/card/card.store";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useRoomStore } from "@/entities/room/room.store";
import type { CardSection } from "@/entities/card/card.types";

const props = withDefaults(
    defineProps<{
        title?: string;
        section: CardSection;
    }>(),
    {
        title: "Редактируемые карточки",
    },
);

const cardStore = useCardStore();
const authStore = useAuthStore();
const roomStore = useRoomStore();

const toastMessage = ref<string | null>(null);
const isArchive = ref(false);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const currentUserId = computed(() => authStore.currentUser?.id || "");

const sectionCards = computed(() => {
    return cardStore.getCardsBySection(props.section, isArchive.value);
});

const toggleArchive = () => {
    isArchive.value = !isArchive.value;
};

const showToast = (message: string) => {
    toastMessage.value = message;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastMessage.value = null;
    }, 3000);
};

const canEditCard = (cardId: string) => {
    const editor = cardStore.getCardEditor(cardId);
    return !editor || editor === currentUserId.value;
};

const onRequestEdit = (cardId: string) => {
    const result = cardStore.startEditing(cardId, currentUserId.value);
    if (!result.success && result.editor) {
        showToast(`Карточка редактируется пользователем ${result.editor}`);
    }
};

const onUpdateCard = async (
    cardId: string,
    data: { title: string; description: string },
) => {
    try {
        await cardStore.updateCard(cardId, currentUserId.value, data);
    } catch (e: any) {
        showToast(`Ошибка сохранения: ${e.message}`);
    }
};

const onStopEdit = (cardId: string) => {
    cardStore.stopEditing(cardId);
};

const onEditingDraft = (payload: {
    cardId: string;
    title: string;
    description: string;
    isEditing: boolean;
}) => {
    cardStore.broadcastEditingDraft(
        payload.cardId,
        payload.title,
        payload.description,
        payload.isEditing,
    );
};

const onMarkCard = async (cardId: string) => {
    try {
        await cardStore.markCard(cardId);
    } catch (e: any) {
        showToast(`Ошибка маркировки: ${e.message}`);
    }
};

const onDeleteCard = async (cardId: string) => {
    if (!confirm("Удалить карточку?")) return;
    try {
        await cardStore.deleteCard(cardId);
    } catch (e: any) {
        showToast(`Ошибка удаления: ${e.message}`);
    }
};

const onUpdateBanner = async (payload: {
    cardId: string;
    bannerUrl: string;
}) => {
    try {
        await cardStore.updateCardBanner(payload.cardId, payload.bannerUrl);
    } catch (e: any) {
        showToast(`Ошибка обновления баннера: ${e.message}`);
    }
};

const onAddCard = async () => {
    if (!roomStore.roomId) {
        showToast("Ошибка: комната не выбрана");
        return;
    }
    try {
        await cardStore.addCard(
            roomStore.roomId,
            props.section,
            currentUserId.value,
            "Новая задача",
            "Опишите задачу здесь...",
        );
    } catch (e: any) {
        showToast(`Ошибка создания карточки: ${e.message}`);
    }
};

onMounted(async () => {
    if (!roomStore.roomId) {
        showToast("Ошибка: комната не выбрана");
        return;
    }
    try {
        await cardStore.loadCards(roomStore.roomId);
        cardStore.subscribeToRealtime(roomStore.roomId);

        // Join the editing broadcast channel
        const user = authStore.currentUser;
        if (user) {
            cardStore.joinEditingChannel(
                roomStore.roomId,
                user.id,
                user.nickname,
            );
        }
    } catch (e: any) {
        showToast(`Ошибка загрузки: ${e.message}`);
    }
});

onUnmounted(() => {
    cardStore.unsubscribeFromRealtime();
    cardStore.leaveEditingChannel();
});
</script>
