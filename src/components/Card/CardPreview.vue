<template>
    <div
        v-if="!isEditing && isViewMode"
        class="text-sm text-gray-600 markdown-body cursor-pointer"
        v-html="renderedDescription"
        @dblclick.stop="$emit('start-edit')"
    />
    <!-- Градиент внизу когда контент обрезается -->
    <div
        v-if="isOverflowing && !isEditing && !isMarked"
        class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"
    ></div>
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
    description: string;
    isEditing: boolean;
    isViewMode: boolean;
    isOverflowing: boolean;
    isMarked: boolean;
}>();

defineEmits<{
    "start-edit": [];
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
.markdown-body :deep(h1) { font-size: 1.5em; }
.markdown-body :deep(h2) { font-size: 1.3em; }
.markdown-body :deep(h3) { font-size: 1.1em; }
.markdown-body :deep(p) { margin-bottom: 0.75em; }
.markdown-body :deep(code) {
    padding: 0.2em 0.4em;
    font-size: 0.85em;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace;
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
    font-size: 100%;
    background: transparent;
    border: 0;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
    padding-left: 2em;
    margin-bottom: 0.75em;
    list-style-type: disc !important;
}
.markdown-body :deep(ol) { list-style-type: decimal !important; }
.markdown-body :deep(li) { margin-bottom: 0.25em; display: list-item !important; }
.markdown-body :deep(a) { color: #0969da; text-decoration: none; }
.markdown-body :deep(a:hover) { text-decoration: underline; }
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
