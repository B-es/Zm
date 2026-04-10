<template>
    <div
        class="border rounded-lg p-4 transition-all duration-200 relative"
        :class="{
            'border-red-600': isEditing,
            'hover:border-cyan-300': isEditing,
            'border-border-color hover:shadow-sm': !isEditing,
            'opacity-75 border-yellow-400': isLockedByOther,
            'bg-gray-50': cardStore.getCardById(cardId)?.marked,
        }"
        v-on:mouseleave="showHint = false"
        v-on:mouseenter="showHint = true"
    >
        <!-- Кнопка маркировки -->
        <button
            v-if="!isLockedByOther"
            class="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-yellow-100 transition-colors shadow-sm"
            @click.stop="emit('mark', cardId)"
            :class="{
                'bg-red-400 border-red-500':
                    cardStore.getCardById(cardId)?.marked,
            }"
        >
            <span class="text-xs">{{
                cardStore.getCardById(cardId)?.marked ? "★" : "☆"
            }}</span>
        </button>

        <!-- Индикатор блокировки -->
        <div
            v-if="isLockedByOther"
            class="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full shadow"
        >
            🔒 {{ lockEditorName }}
        </div>

        <div
            :class="{
                cursorPointer: canEdit && !isMarked,
                'cursor-not-allowed': isLockedByOther || isMarked,
            }"
            @click.self="handleCardClick"
            @dblclick="cancelEditing"
        >
            <div class="flex flex-col">
                <input
                    v-model="titleModel"
                    class="font-medium text-gray-900 mb-1 outline-none"
                    :class="{
                        'cursor-auto': !canEdit || isMarked,
                        'bg-gray-50': isMarked,
                    }"
                    :readonly="!canEdit || isMarked"
                    ref="titleInput"
                    @focus="handleTitleFocus"
                    @keydown="handleTitleKeydown"
                />
                <!-- Live editing draft from other user -->
                <div
                    v-if="isEditingByOther && !isEditing"
                    class="mb-2 p-2 bg-blue-50 rounded text-sm"
                >
                    <p class="text-blue-600 font-medium">
                        ✏️ {{ editingUserName }} редактирует:
                    </p>
                    <p v-if="editingDraftTitle" class="text-blue-500 mt-1">
                        {{ editingDraftTitle }}
                    </p>
                    <p v-if="editingDraftDescription" class="text-blue-400">
                        {{ editingDraftDescription }}
                    </p>
                </div>
                <hr class="p-1" />
                <textarea
                    v-model="descriptionModel"
                    class="text-sm text-gray-600 outline-none resize-none overflow-hidden"
                    :class="{
                        'cursor-auto': !canEdit,
                        'bg-gray-50': cardStore.getCardById(cardId)?.marked,
                    }"
                    :readonly="
                        !canEdit || cardStore.getCardById(cardId)?.marked
                    "
                    ref="textArea"
                    @input="adjustTextArea"
                    @keydown="handleTextareaKeydown"
                    @focus="handleTextareaFocus"
                />
            </div>

            <!-- Индикатор редактирования при наведении -->
            <div
                class="mt-2 text-xs text-gray-400 opacity-0 transition-opacity"
                :class="{ 'opacity-100': showHint || isEditing }"
            >
                <template v-if="isEditing">✏️ Редактируется</template>
                <template v-else-if="isLockedByOther"
                    >🔒 Редактирует {{ lockEditorName }}</template
                >
                <template v-else>✏️ Кликните для редактирования</template>
            </div>

            <!-- Информация об авторе -->
            <div class="mt-1 text-xs text-gray-400 flex gap-2">
                <span v-if="createdByName"
                    >👤 Создано: {{ createdByName }}</span
                >
                <span v-if="updatedByName && updatedByName !== createdByName"
                    >· ✏️ Изменено: {{ updatedByName }}</span
                >
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted, computed, watch, nextTick } from "vue";
import { useCardStore } from "@/entities/card/card.store";
import { getUserNicknames, upsertCurrentUser } from "@/entities/user/user.repository";

interface Props {
    cardId: string;
    title: string;
    description?: string;
    createdBy?: string;
    updatedBy?: string;
    userId?: string;
    lockedBy?: string | null;
    canStartEdit?: boolean;
}

interface Emits {
    (e: "request-edit", cardId: string): void;
    (e: "update", payload: { title: string; description: string }): void;
    (e: "stop-edit", cardId: string): void;
    (
        e: "editing-draft",
        payload: {
            cardId: string;
            title: string;
            description: string;
            isEditing: boolean;
        },
    ): void;
    (e: "mark", cardId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    description: "",
    createdBy: "",
    updatedBy: "",
    userId: "",
    lockedBy: null,
    canStartEdit: true,
});

const emit = defineEmits<Emits>();

// Состояние
const isEditing = ref(false);
const titleModel = ref(props.title);
const descriptionModel = ref(props.description);
const showHint = ref(false);

const textArea = ref();
const titleInput = ref();

const adjustTextArea = () => {
    if (textArea.value) {
        textArea.value.style.height = "auto";
        textArea.value.style.height = `${textArea.value.scrollHeight}px`;
    }
};

// Синхронизация моделей с пропсами
watch(
    () => props.title,
    (val) => {
        titleModel.value = val;
    },
);
watch(
    () => props.description,
    (val) => {
        descriptionModel.value = val;
    },
);

const initTitle = props.title;
const initDescription = props.description;

// Блокировка
const isLockedByOther = computed(() => {
    return props.lockedBy && props.lockedBy !== props.userId;
});

const lockEditorName = computed(() => {
    const userId = props.lockedBy || "";
    if (userId === props.userId) return "Вы";
    return userNicknames.value.get(userId) || userId;
});

const createdByName = computed(() => {
    if (!props.createdBy) return "";
    if (props.createdBy === props.userId) return "Вы";
    return userNicknames.value.get(props.createdBy) || props.createdBy;
});

const updatedByName = computed(() => {
    if (!props.updatedBy) return "";
    if (props.updatedBy === props.userId) return "Вы";
    return userNicknames.value.get(props.updatedBy) || props.updatedBy;
});

const userNicknames = ref<Map<string, string>>(new Map());

// Load user nicknames for this card
const loadUserNicknames = async () => {
    const userIds = [props.createdBy, props.updatedBy, props.lockedBy || ""]
        .filter((id) => id && id !== props.userId);

    if (userIds.length > 0) {
        const nicknames = await getUserNicknames(userIds);
        userNicknames.value = nicknames;
    }
};

const cardStore = useCardStore();

const isMarked = computed(() => {
    return cardStore.getCardById(props.cardId)?.marked || false;
});

const canEdit = computed(() => {
    return !isLockedByOther.value && !isMarked.value;
});

const editingDraft = computed(() => {
    return cardStore.getCardDraft(props.cardId);
});

const editingDraftTitle = computed(() => {
    return editingDraft.value?.title || "";
});

const editingDraftDescription = computed(() => {
    return editingDraft.value?.description || "";
});

const isEditingByOther = computed(() => {
    return editingDraft.value && editingDraft.value.userId !== props.userId;
});

const editingUserName = computed(() => {
    return editingDraft.value?.nickname || "";
});

// Отменить редактирование
const cancel = async () => {
    isEditing.value = false;
    titleModel.value = props.title;
    descriptionModel.value = props.description || "";
    emit("editing-draft", {
        cardId: props.cardId,
        title: props.title,
        description: props.description || "",
        isEditing: false,
    });

    // Снять блокировку и broadcast
    cardStore.stopEditing(props.cardId);
    cardStore.broadcastEditingLock(props.cardId, false);

    emit("stop-edit", props.cardId);

    await nextTick();
};

// Broadcast editing draft as user types
watch(
    [titleModel, descriptionModel, isEditing],
    () => {
        if (isEditing.value) {
            emit("editing-draft", {
                cardId: props.cardId,
                title: titleModel.value,
                description: descriptionModel.value,
                isEditing: true,
            });
        }
    },
    { deep: true },
);

// Если другой пользователь начал редактировать — снимаем фокус
watch(isLockedByOther, async (locked) => {
    if (locked && isEditing.value) {
        // Кто-то другой заблокировал карточку — отменяем редактирование
        await nextTick();
        cancel();
    }
});

// Если карточку маркировали — выходим из режима редактирования
watch(isMarked, async (marked) => {
    if (marked && isEditing.value) {
        await nextTick();
        cancel();
    }
});

const handleCardClick = async () => {
    if (isMarked.value) return;
    await startEditing(true);
};

const startEditing = async (autoFocus = true) => {
    if (isEditing.value || isLockedByOther.value || isMarked.value || !props.canStartEdit) return;

    // Сначала запрашиваем блокировку
    const result = cardStore.startEditing(props.cardId, props.userId || "");
    if (!result.success && result.editor) {
        // Карточка уже заблокирована другим пользователем
        return;
    }

    // Блокировка получена — broadcast другим
    cardStore.broadcastEditingLock(props.cardId, true);

    isEditing.value = true;
    showHint.value = false;

    // Очищаем поля если это новая карточка
    if (descriptionModel.value === initDescription && !props.createdBy) {
        descriptionModel.value = "";
    }
    if (titleModel.value === initTitle && !props.createdBy) {
        titleModel.value = "";
    }

    // Автофокус только при клике на div (не при фокусе на инпутах)
    if (autoFocus) {
        await nextTick();
        setTimeout(() => {
            textArea.value?.focus();
        }, 50);
    }
};

const cancelEditing = () => {
    if (isEditing.value) {
        save();
    }
};

// Сохранить изменения
const save = async () => {
    if (titleModel.value.trim()) {
        emit("update", {
            title: titleModel.value.trim(),
            description: descriptionModel.value.trim(),
        });
        emit("editing-draft", {
            cardId: props.cardId,
            title: titleModel.value.trim(),
            description: descriptionModel.value.trim(),
            isEditing: false,
        });

        // Снять блокировку и broadcast
        cardStore.stopEditing(props.cardId);
        cardStore.broadcastEditingLock(props.cardId, false);

        emit("stop-edit", props.cardId);
        isEditing.value = false;

        // Blur inputs
        await nextTick();
        setTimeout(() => {
            textArea.value?.blur();
            titleInput.value?.blur();
        }, 0);
    }
};

// Горячие клавиши
const handleKeydown = async (e: KeyboardEvent) => {
    if (!isEditing.value) return;

    if (e.key === "Escape") {
        await cancel();
    }
};

// Обработка фокуса на title input
const handleTitleFocus = async () => {
    if (isLockedByOther.value || isMarked.value) {
        titleInput.value?.blur();
        return;
    }
    await startEditing(false);
};

// Обработка клавиш в title input
const handleTitleKeydown = async (e: KeyboardEvent) => {
    if (!isEditing.value) return;

    // Enter - сохранить
    if (e.key === "Enter") {
        e.preventDefault();
        save();
    }
    if (e.key === "Escape") {
        await cancel();
    }
};

// Обработка клавиш в textarea
const handleTextareaKeydown = (e: KeyboardEvent) => {
    if (!isEditing.value) return;

    // Enter без Shift - сохранить
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        save();
    }
    // Shift+Enter - новая строка (стандартное поведение textarea)
};

// Обработка фокуса на textarea
const handleTextareaFocus = async () => {
    if (isLockedByOther.value || isMarked.value) {
        textArea.value?.blur();
        return;
    }
    await startEditing(false);
};

// Слушаем глобальные горячие клавиши
onMounted(async () => {
    window.addEventListener("keydown", handleKeydown);
    await loadUserNicknames();
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
    if (isEditing.value) {
        emit("editing-draft", {
            cardId: props.cardId,
            title: titleModel.value,
            description: descriptionModel.value,
            isEditing: false,
        });
        emit("stop-edit", props.cardId);
    }
});
</script>
