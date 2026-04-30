<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            @click="$emit('close')"
        >
            <div
                class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
                @click.stop
            >
                <!-- Баннер -->
                <div v-if="bannerUrl" class="mb-4">
                    <img
                        :src="bannerUrl"
                        alt="Banner"
                        class="w-full h-48 object-cover rounded-lg"
                    />
                </div>

                <!-- Заголовок -->
                <div class="flex items-start justify-between mb-4">
                    <h2 class="text-2xl font-bold text-gray-900 flex-1">
                        {{ title }}
                    </h2>
                    <button
                        @click="$emit('close')"
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
import { computed } from "vue";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
});

const props = defineProps<{
    isOpen: boolean;
    title: string;
    description: string;
    bannerUrl?: string;
    createdByName?: string;
    updatedByName?: string;
}>();

defineEmits<{
    close: [];
}>();

const renderedDescription = computed(() => {
    if (!props.description) return "";
    return md.render(props.description);
});
</script>

<style scoped>
.markdown-body {
    line-height: 1.6;
    word-wrap: break-word;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
}
.markdown-body :deep(p) {
    margin-bottom: 0.75em;
}
.markdown-body :deep(code) {
    padding: 0.2em 0.4em;
    font-size: 0.85em;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family:
        ui-monospace,
        SFMono-Regular,
        SF Mono,
        Menlo,
        Consolas,
        monospace;
}
.markdown-body :deep(pre) {
    padding: 1em;
    overflow: auto;
    font-size: 0.85em;
    background-color: #f6f8fa;
    border-radius: 6px;
}
.markdown-body :deep(a) {
    color: #0969da;
    text-decoration: none;
}
.markdown-body :deep(a:hover) {
    text-decoration: underline;
}
</style>
