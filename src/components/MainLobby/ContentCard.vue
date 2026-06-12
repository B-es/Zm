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

        <!-- Кнопка разворота (когда контент превышает лимит) -->
        <button
            v-if="isOverflowing && !isEditing && !isLockedByOther"
            @click.stop="isDialogOpen = true"
            class="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-blue-100 transition-colors shadow-sm"
        >
            <span class="text-xs">🔍</span>
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
            <div
                ref="cardContentRef"
                class="flex flex-col max-h-[300px] overflow-hidden relative"
            >
                <input
                    v-model="titleModel"
                    class="font-medium text-gray-900 mb-1 outline-none flex-shrink-0"
                    :class="{
                        'bg-gray-50': isMarked,
                    }"
                    :readonly="!isEditing || isLockedByOther || isMarked"
                    :tabindex="isEditing ? 0 : -1"
                    ref="titleInput"
                    @dblclick.stop="handleTitleDblClick"
                    @keydown="handleTitleKeydown"
                />

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
                    class="text-sm text-gray-600 outline-none resize-none overflow-y-auto"
                    style="max-height: 250px"
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
                <!-- Градиент внизу когда контент обрезается -->
                <div
                    v-if="isOverflowing && !isEditing && !isMarked"
                    class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"
                ></div>
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
                <template v-else-if="isMarked">📌 В архиве</template>
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

            <!-- Баннер с картинкой -->
            <div
                v-if="bannerUrl || isEditingBanner || isEditing"
                class="relative"
                style="
                    margin: 16px calc(-1rem - 1px) calc(-1rem - 1px)
                        calc(-1rem - 1px);
                "
            >
                <!-- Кнопка удаления (в правом нижнем углу баннера) -->
                <button
                    v-if="!isLockedByOther"
                    class="absolute -bottom-2 -right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-red-100 transition-colors shadow-sm"
                    @click.stop="emit('delete', cardId)"
                >
                    <span class="text-xs">🗑️</span>
                </button>

                <!-- Режим просмотра -->
                <div
                    v-if="bannerUrl && !isEditingBanner"
                    class="relative group"
                >
                    <img
                        :src="bannerUrl"
                        alt="Banner"
                        class="w-full h-40 object-cover rounded-b-lg"
                        @error="handleImageError"
                    />
                    <button
                        v-if="!isLockedByOther"
                        @click.stop="isEditingBanner = true"
                        class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-opacity opacity-0 group-hover:opacity-100 shadow-sm"
                    >
                        <span class="text-xs">✏️</span>
                    </button>
                </div>

                <!-- Кнопка добавления баннера (только в режиме редактирования) -->
                <div
                    class="px-4 pb-4"
                    v-if="
                        !bannerUrl &&
                        !isEditingBanner &&
                        !isLockedByOther &&
                        isEditing
                    "
                >
                    <button
                        @click.stop="isEditingBanner = true"
                        class="w-full flex items-center justify-center gap-2 py-4 text-sm text-gray-400 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-500 transition"
                    >
                        <span>🖼️</span>
                        <span>Добавить баннер</span>
                    </button>
                </div>

                <!-- Режим редактирования баннера -->
                <div v-if="isEditingBanner" class="px-4 pb-4 flex gap-2">
                    <input
                        v-model="bannerUrlModel"
                        type="text"
                        placeholder="Вставьте ссылку на картинку..."
                        class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        @keydown.enter="saveBanner"
                        @keydown.escape="cancelBannerEdit"
                    />
                    <button
                        @click.stop="saveBanner"
                        class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        ✓
                    </button>
                    <button
                        @click.stop="cancelBannerEdit"
                        class="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                    >
                        ✕
                    </button>
                </div>

                <!-- Превью картинки при редактировании -->
                <div
                    v-if="isEditingBanner && bannerUrlModel"
                    class="mt-2 px-4 pb-4"
                >
                    <img
                        :src="bannerUrlModel"
                        alt="Preview"
                        class="w-full h-20 object-cover rounded-b-lg"
                        @error="handleImageError"
                    />
                </div>
            </div>
        </div>
    </div>

    <!-- Диалоговое окно для просмотра полной карточки -->
    <Teleport to="body">
        <div
            v-if="isDialogOpen"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            @click="isDialogOpen = false"
        >
            <div
                class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
                @click.stop
            >
                <!-- Баннер в диалоге -->
                <div v-if="bannerUrl" class="mb-4">
                    <img
                        :src="bannerUrl"
                        alt="Banner"
                        class="w-full h-48 object-cover rounded-lg"
                        @error="handleImageError"
                    />
                </div>

                <!-- Заголовок -->
                <div class="flex items-start justify-between mb-4">
                    <h2 class="text-2xl font-bold text-gray-900 flex-1">
                        {{ titleModel }}
                    </h2>
                    <button
                        @click="isDialogOpen = false"
                        class="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <!-- Описание с Markdown -->
                <div
                    class="text-gray-700 markdown-body"
                    v-html="renderedDescription"
                ></div>

                <!-- Информация о карточке -->
                <div class="mt-6 pt-4 border-t border-gray-200">
                    <div class="text-xs text-gray-400 flex gap-4">
                        <span v-if="createdByName"
                            >👤 Создано: {{ createdByName }}</span
                        >
                        <span
                            v-if="
                                updatedByName && updatedByName !== createdByName
                            "
                            >✏️ Изменено: {{ updatedByName }}</span
                        >
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted, computed, watch, nextTick } from "vue";
import { useCardStore } from "@/entities/card/card.store";
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
    createdBy?: number;
    updatedBy?: number;
    userId?: number;
    lockedBy?: number | null;
    canStartEdit?: boolean;
    bannerUrl?: string;
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
    (e: "delete", cardId: string): void;
    (e: "update-banner", payload: { cardId: string; bannerUrl: string }): void;
}

const props = withDefaults(defineProps<Props>(), {
    description: "",
    createdBy: -1,
    updatedBy: -1,
    userId: -1,
    lockedBy: null,
    canStartEdit: true,
    bannerUrl: "",
});

const emit = defineEmits<Emits>();

// Состояние
const isEditing = ref(false);
const titleModel = ref(props.title);
const descriptionModel = ref(props.description);
const showHint = ref(false);
const isViewMode = ref(true); // По умолчанию режим просмотра Markdown
const isOverflowing = ref(false); // Контент превышает 400px
const isDialogOpen = ref(false); // Диалоговое окно открыто
const bannerUrlModel = ref(props.bannerUrl || "");
const isEditingBanner = ref(false);

const textArea = ref();
const titleInput = ref();
const cardContentRef = ref<HTMLElement | null>(null);

// Проверка переполнения контента
const checkOverflow = () => {
    if (cardContentRef.value) {
        isOverflowing.value = cardContentRef.value.scrollHeight > 400;
    }
};

const adjustTextArea = () => {
    if (textArea.value) {
        textArea.value.style.height = "auto";
        const newHeight = Math.min(textArea.value.scrollHeight, 250);
        textArea.value.style.height = `${newHeight}px`;
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
watch(
    () => props.bannerUrl,
    (val) => {
        bannerUrlModel.value = val || "";
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

// Проверяем переполнение при изменении props
watch(
    () => props.description,
    () => {
        nextTick(() => {
            checkOverflow();
        });
    },
    { immediate: true },
);

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
    const userId = props.lockedBy || -1;
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

const userNicknames = ref<Map<number, string>>(new Map());

// Load user nicknames for this card
const loadUserNicknames = async () => {
    const userIds = [
        props.createdBy,
        props.updatedBy,
        props.lockedBy || "",
    ].filter((id) => id && id !== props.userId);

    if (userIds.length > 0) {
        //TODO: Заменить userNicknames
        const nicknames = new Map();
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

    // Блокировка получена — broadcast другим

    isEditing.value = true;
    showHint.value = false;

    // Синхронизируем models с актуальными props при начале редактирования
    titleModel.value = props.title;
    descriptionModel.value = props.description || "";
    bannerUrlModel.value = props.bannerUrl || "";

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

// Обработка ошибки загрузки изображения
const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.style.display = "none";
};

// Сохранить баннер
const saveBanner = () => {
    const newBannerUrl = bannerUrlModel.value.trim();
    emit("update-banner", {
        cardId: props.cardId,
        bannerUrl: newBannerUrl,
    });
    // Обновляем локальную модель сразу для отображения
    isEditingBanner.value = false;
};

// Отменить редактирование баннера
const cancelBannerEdit = () => {
    bannerUrlModel.value = props.bannerUrl || "";
    isEditingBanner.value = false;
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
    list-style-type: disc !important;
}

.markdown-body :deep(ol) {
    list-style-type: decimal !important;
}

.markdown-body :deep(li) {
    margin-bottom: 0.25em;
    display: list-item !important;
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
