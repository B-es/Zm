<template>
    <div
        class="border rounded-lg p-4 transition-all duration-200 relative"
        :class="{
            'border-red-600': isEditing,
            'hover:border-cyan-300': isEditing,
            'border-border-color hover:shadow-sm': !isEditing,
            'opacity-75 border-yellow-400': isLockedByOther,
        }"
        v-on:mouseleave="showHint = false"
        v-on:mouseenter="showHint = true"
    >
        <!-- Индикатор блокировки -->
        <div
            v-if="isLockedByOther"
            class="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full shadow"
        >
            🔒 {{ lockEditorName }}
        </div>

        <div
            :class="{
                cursorPointer: canEdit,
                'cursor-not-allowed': isLockedByOther,
            }"
            @click="startEditing"
            @dblclick="cancelEditing"
        >
            <div class="flex flex-col">
                <input
                    v-model="titleModel"
                    class="font-medium text-gray-900 mb-1 outline-none"
                    :class="{ 'cursor-auto': !canEdit }"
                    :readonly="!canEdit"
                />
                <hr class="p-1" />
                <textarea
                    v-model="descriptionModel"
                    class="text-sm text-gray-600 outline-none resize-none overflow-hidden"
                    :class="{ 'cursor-auto': !canEdit }"
                    :readonly="!canEdit"
                    ref="textArea"
                    @input="adjustTextArea"
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
import { ref, onUnmounted, onMounted, computed, watch } from "vue";

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

const lockEditorName = computed(() => props.lockedBy || "");

const createdByName = computed(() => {
    if (!props.createdBy) return "";
    if (props.createdBy === props.userId) return "Вы";
    return props.createdBy;
});
const updatedByName = computed(() => {
    if (!props.updatedBy) return "";
    if (props.updatedBy === props.userId) return "Вы";
    return props.updatedBy;
});

const canEdit = computed(() => {
    return !isLockedByOther.value;
});

const startEditing = () => {
    if (isEditing.value || isLockedByOther.value || !props.canStartEdit) return;

    emit("request-edit", props.cardId);

    isEditing.value = true;
    showHint.value = false;

    // Очищаем поля если это новая карточка
    if (descriptionModel.value === initDescription && !props.createdBy) {
        descriptionModel.value = "";
    }
    if (titleModel.value === initTitle && !props.createdBy) {
        titleModel.value = "";
    }

    // Автофокус
    setTimeout(() => {
        textArea.value?.focus();
    }, 50);
};

const cancelEditing = () => {
    if (isEditing.value) {
        save();
    }
};

// Сохранить изменения
const save = () => {
    if (titleModel.value.trim()) {
        emit("update", {
            title: titleModel.value.trim(),
            description: descriptionModel.value.trim(),
        });
        emit("stop-edit");
        isEditing.value = false;
    }
};

// Отменить редактирование
const cancel = () => {
    isEditing.value = false;
    titleModel.value = props.title;
    descriptionModel.value = props.description || "";
    emit("stop-edit");
};

// Горячие клавиши
const handleKeydown = (e: KeyboardEvent) => {
    if (!isEditing.value) return;

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        save();
    }
    if (e.key === "Escape") {
        cancel();
    }
};

// Слушаем глобальные горячие клавиши
onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
    if (isEditing.value) {
        emit("stop-edit");
    }
});
</script>
