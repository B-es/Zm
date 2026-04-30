<template>
    <div
        v-if="showBannerSection"
        class="relative"
        style="
            margin: 16px calc(-1rem - 1px) calc(-1rem - 1px) calc(-1rem - 1px);
        "
    >
        <!-- Режим просмотра -->
        <div v-if="bannerUrl && !isEditing" class="relative group">
            <img
                :src="bannerUrl"
                alt="Banner"
                class="w-full h-40 object-cover rounded-b-lg"
                @error="handleImageError"
            />
            <button
                v-if="!isLockedByOther"
                @click.stop="$emit('start-edit')"
                class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-opacity opacity-0 group-hover:opacity-100 shadow-sm"
            >
                <span class="text-xs">✏️</span>
            </button>
        </div>

        <!-- Кнопка добавления баннера -->
        <div
            v-if="!bannerUrl && !isEditing && !isLockedByOther && canEdit"
            class="px-4 pb-4"
        >
            <button
                @click.stop="$emit('start-edit')"
                class="w-full flex items-center justify-center gap-2 py-4 text-sm text-gray-400 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-500 transition"
            >
                <span>🖼️</span>
                <span>Добавить баннер</span>
            </button>
        </div>

        <!-- Режим редактирования -->
        <div v-if="isEditing" class="px-4 pb-4 flex gap-2">
            <input
                v-model="urlInput"
                type="text"
                placeholder="Вставьте ссылку на картинку..."
                class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                @keydown.enter="$emit('save', urlInput.trim())"
                @keydown.escape="$emit('cancel')"
            />
            <button
                @click.stop="$emit('save', urlInput.trim())"
                class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                ✓
            </button>
            <button
                @click.stop="$emit('cancel')"
                class="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
                ✕
            </button>
        </div>

        <!-- Превью -->
        <div v-if="isEditing && urlInput" class="mt-2 px-4 pb-4">
            <img
                :src="urlInput"
                alt="Preview"
                class="w-full h-20 object-cover rounded-b-lg"
                @error="handleImageError"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";

const props = defineProps<{
    bannerUrl: string;
    isLockedByOther?: boolean;
    canEdit?: boolean;
}>();

const emit = defineEmits<{
    "start-edit": [];
    save: [url: string];
    cancel: [];
}>();

const urlInput = ref(props.bannerUrl || "");
const isEditing = ref(false);

const showBannerSection = computed(() => {
    return !!props.bannerUrl || isEditing.value || props.canEdit;
});

watch(
    () => props.bannerUrl,
    (val) => {
        urlInput.value = val || "";
        isEditing.value = false;
    },
);

const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.style.display = "none";
};
</script>
