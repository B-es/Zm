<template>
    <!-- Кнопка маркировки -->
    <button
        v-if="showMark && !isLockedByOther"
        class="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-yellow-100 transition-colors shadow-sm"
        @click.stop="$emit('mark')"
        :class="{ 'bg-red-400 border-red-500': isMarked }"
    >
        <span class="text-xs">{{ isMarked ? "★" : "☆" }}</span>
    </button>

    <!-- Кнопка разворота (когда контент превышает лимит) -->
    <button
        v-if="showExpand && !isLockedByOther && !isEditing"
        @click.stop="$emit('expand')"
        class="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-blue-100 transition-colors shadow-sm"
    >
        <span class="text-xs">🔍</span>
    </button>

    <!-- Кнопка удаления -->
    <button
        v-if="showDelete && !isLockedByOther"
        class="absolute -bottom-2 -right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-red-100 transition-colors shadow-sm"
        @click.stop="$emit('delete')"
    >
        <span class="text-xs">🗑️</span>
    </button>
</template>

<script setup lang="ts">
defineProps<{
    isMarked?: boolean;
    isLockedByOther?: boolean;
    isEditing?: boolean;
    showMark?: boolean;
    showExpand?: boolean;
    showDelete?: boolean;
}>();

defineEmits<{
    mark: [];
    expand: [];
    delete: [];
}>();
</script>
