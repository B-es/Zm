<template>
  <Transition name="toast">
    <div
      v-if="toastMessage"
      class="fixed top-4 right-4 z-50 max-w-sm rounded-lg px-4 py-3 shadow-lg"
      :class="toastClasses"
    >
      <div class="flex items-center gap-2">
        <span class="text-lg">{{ toastIcon }}</span>
        <p class="text-sm font-medium">{{ toastMessage }}</p>
        <button class="ml-auto opacity-70 hover:opacity-100" @click="hideToast">
          ✕
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useErrorHandler } from "@/shared/composables/useErrorHandler";

const { toastMessage, toastType, hideToast } = useErrorHandler();

const toastClasses = computed(() => ({
  "bg-red-500 text-white": toastType.value === "error",
  "bg-green-500 text-white": toastType.value === "success",
  "bg-blue-500 text-white": toastType.value === "info",
}));

const toastIcon = computed(() => ({
  error: "⚠️",
  success: "✅",
  info: "ℹ️",
}[toastType.value]));
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
