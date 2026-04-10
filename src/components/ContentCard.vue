<template>
    <div
        ref="cardRef"
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
            @dblclick.self="handleCardDblClick"
        >
            <div class="flex flex-col">
                <input
                    v-model="titleModel"
                    class="font-medium text-gray-900 mb-1 outline-none"
                    :class="{
                        'bg-gray-50': isMarked,
                    }"
                    :readonly="!isEditing || isLockedByOther || isMarked"
                    :tabindex="isEditing ? 0 : -1"
                    ref="titleInput"
                    @dblclick.stop="handleTitleDblClick"
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
                <!-- Markdown preview в режиме просмотра -->
                <div
                    v-if="!isEditing && isViewMode"
                    class="text-sm text-gray-600 markdown-body cursor-pointer"
                    v-html="renderedDescription"
                    @dblclick.stop="handleCardDblClick"
                />
                <!-- Textarea в режиме редактирования -->
                <textarea
                    v-else
                    v-model="descriptionModel"
                    class="text-sm text-gray-600 outline-none resize-none overflow-hidden"
                    :class="{
                        'bg-gray-50': cardStore.getCardById(cardId)?.marked,
                    }"
                    :readonly="
                        !isEditing ||
                        !canEdit ||
                        cardStore.getCardById(cardId)?.marked
                    "
                    :tabindex="isEditing ? 0 : -1"
                    ref="textArea"
                    @input="adjustTextArea"
                    @dblclick.stop="handleTextareaDblClick"
                    @keydown="handleTextareaKeydown"
                />
            </div>

            <!-- Индикатор редактирования при наведении -->
            <div
                class="mt-2 text-xs text-gray-400 opacity-0 transition-opacity"
                :class="{ 'opacity-100': showHint || isEditing }"
            >
                <template v-if="isEditing"
                    >✏️ Редактируется (Enter - сохранить, Shift+Enter - новая
                    строка)</template
                >
                <template v-else-if="isLockedByOther"
                    >🔒 Редактирует {{ lockEditorName }}</template
                >
                <template v-else-if="isViewMode"
                    >👁️ Двойной клик для редактирования</template
                >
                <template v-else>✏️ Редактирование...</template>
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
import { getUserNicknames } from "@/entities/user/user.repository";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
});

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
const isViewMode = ref(true); // По умолчанию режим просмотра Markdown

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
        // При обновлении пропсов возвращаем режим просмотра
        isViewMode.value = true;
    },
);

// Подстраиваем высоту textarea при изменении модели
watch(descriptionModel, () => {
    if (isEditing.value) {
        nextTick(() => {
            adjustTextArea();
        });
    }
});

// Render Markdown to HTML
const renderedDescription = computed(() => {
    if (!props.description && !descriptionModel.value) return "";
    const text = isEditing.value ? descriptionModel.value : props.description;
    return md.render(text || "");
});

// Toggle between edit and view mode
const toggleViewMode = () => {
    isViewMode.value = !isViewMode.value;
};

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
    const userIds = [
        props.createdBy,
        props.updatedBy,
        props.lockedBy || "",
    ].filter((id) => id && id !== props.userId);

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
    isViewMode.value = true; // После отмены - показываем Markdown
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
    // Если в режиме просмотра Markdown - входим в режим редактирования
    if (isViewMode.value) {
        isViewMode.value = false;
    }
    await startEditing(true);
};

const handleCardDblClick = async (event: MouseEvent) => {
    if (isMarked.value) return;
    if (isLockedByOther.value || !props.canStartEdit) return;

    // Определяем, куда именно кликнули по Y координате
    const clickY = event.clientY;

    // Получаем элементы input'ов
    const titleEl = titleInput.value as HTMLInputElement | undefined;
    const titleRect = titleEl?.getBoundingClientRect();
    const titleMiddle = titleRect ? (titleRect.top + titleRect.bottom) / 2 : 50;

    // Если кликнули выше середины title - фокус на title, иначе на textarea
    const focusTitle = clickY < titleMiddle;

    if (isViewMode.value) {
        isViewMode.value = false;
    }

    await startEditing(false);
    await nextTick();

    if (focusTitle) {
        titleInput.value?.focus();
    } else {
        textArea.value?.focus();
    }
};

const startEditing = async (autoFocus = true) => {
    if (
        isEditing.value ||
        isLockedByOther.value ||
        isMarked.value ||
        !props.canStartEdit
    )
        return;

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

    // Синхронизируем models с актуальными props при начале редактирования
    titleModel.value = props.title;
    descriptionModel.value = props.description || "";

    // Очищаем поля если это новая карточка
    if (!props.createdBy) {
        descriptionModel.value = "";
        titleModel.value = "";
    }

    // Автофокус и подстройка высоты textarea
    if (autoFocus) {
        await nextTick();
        setTimeout(() => {
            textArea.value?.focus();
            adjustTextArea();
        }, 50);
    } else {
        // Даже без автофокуса нужно подстроить высоту
        await nextTick();
        adjustTextArea();
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
        isViewMode.value = true; // После сохранения - показываем Markdown

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

// Обработка двойного клика на title input
const handleTitleDblClick = async () => {
    if (isLockedByOther.value || isMarked.value) return;
    // Начинаем редактирование и фокусируем на title
    if (isViewMode.value) {
        isViewMode.value = false;
    }
    await startEditing(false);
    await nextTick();
    titleInput.value?.focus();
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

    // Tab - вставить 4 пробела
    if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const spaces = "    ";

        // Вставляем 4 пробела в позицию курсора
        descriptionModel.value =
            descriptionModel.value.substring(0, start) +
            spaces +
            descriptionModel.value.substring(end);

        // Ставим курсор после пробелов
        nextTick(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 4;
        });
        return;
    }

    // Enter без Shift - сохранить
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        save();
    }
    // Shift+Enter - новая строка (стандартное поведение textarea)
};

// Обработка двойного клика на textarea
const handleTextareaDblClick = async () => {
    if (isLockedByOther.value || isMarked.value) return;
    // Начинаем редактирование и фокусируем на textarea
    if (isViewMode.value) {
        isViewMode.value = false;
    }
    await startEditing(false);
    await nextTick();
    textArea.value?.focus();
};

// Обработка клика вне карточки (сохранение при потере фокуса)
const cardRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
    if (!isEditing.value) return;

    const target = event.target as Node;
    const cardElement = cardRef.value;

    // Если клик был вне карточки - сохраняем
    if (cardElement && !cardElement.contains(target)) {
        save();
    }
};

// Слушаем глобальные горячие клавиши
onMounted(async () => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleClickOutside);
    await loadUserNicknames();
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("click", handleClickOutside);
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

<style scoped>
/* Markdown styles */
.markdown-body {
    line-height: 1.6;
    word-wrap: break-word;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
}

.markdown-body :deep(h1) {
    font-size: 1.5em;
}

.markdown-body :deep(h2) {
    font-size: 1.3em;
}

.markdown-body :deep(h3) {
    font-size: 1.1em;
}

.markdown-body :deep(p) {
    margin-bottom: 0.75em;
}

.markdown-body :deep(code) {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 0.85em;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family:
        ui-monospace,
        SFMono-Regular,
        SF Mono,
        Menlo,
        Consolas,
        Liberation Mono,
        monospace;
}

.markdown-body :deep(pre) {
    padding: 1em;
    overflow: auto;
    font-size: 0.85em;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 6px;
}

.markdown-body :deep(pre code) {
    padding: 0;
    margin: 0;
    font-size: 100%;
    word-break: normal;
    white-space: pre;
    background: transparent;
    border: 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
    padding-left: 2em;
    margin-bottom: 0.75em;
}

.markdown-body :deep(li) {
    margin-bottom: 0.25em;
}

.markdown-body :deep(a) {
    color: #0969da;
    text-decoration: none;
}

.markdown-body :deep(a:hover) {
    text-decoration: underline;
}

.markdown-body :deep(blockquote) {
    padding: 0 1em;
    color: #656d76;
    border-left: 0.25em solid #d0d7de;
    margin: 0.5em 0;
}

.markdown-body :deep(hr) {
    height: 0.25em;
    padding: 0;
    margin: 1em 0;
    background-color: #d0d7de;
    border: 0;
}

.markdown-body :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 0.75em;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
    padding: 6px 13px;
    border: 1px solid #d0d7de;
}

.markdown-body :deep(table tr:nth-child(2n)) {
    background-color: #f6f8fa;
}
</style>
