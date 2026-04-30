<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="$emit('close')"
        @keydown.escape="$emit('close')"
    >
        <div
            class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            role="dialog"
            aria-modal="true"
            aria-label="Изменить аватарку"
        >
            <h2 class="text-lg font-semibold mb-4">Изменить аватарку</h2>

            <Input
                v-model="avatarUrlInput"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                :error="!!error"
                :error-message="error || ''"
                @enter="saveAvatar"
            />

            <!-- Превью -->
            <div v-if="avatarUrlInput" class="mt-3 flex items-center gap-3">
                <Avatar :avatar-url="avatarUrlInput" />
                <span class="text-xs text-gray-400">Превью</span>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <Button variant="secondary" @click="$emit('close')">
                    Отмена
                </Button>
                <Button :disabled="saving" @click="saveAvatar">
                    {{ saving ? "Сохранение..." : "Сохранить" }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Avatar from "./Avatar.vue";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useFormState } from "@/shared/composables/useFormState";

const props = defineProps<{
    isOpen: boolean;
    currentAvatarUrl: string;
}>();

const emit = defineEmits<{
    close: [];
}>();

const authStore = useAuthStore();
const avatarUrlInput = ref("");

const {
    startLoading: startSaving,
    stopLoading: stopSaving,
    setError,
    loading: saving,
    error,
} = useFormState();

watch(
    () => props.isOpen,
    (open) => {
        if (open) {
            avatarUrlInput.value = props.currentAvatarUrl || "";
            setError("");
        }
    },
);

async function saveAvatar() {
    if (!avatarUrlInput.value.trim()) {
        setError("Введите URL");
        return;
    }

    startSaving();

    try {
        await authStore.updateAvatar(avatarUrlInput.value.trim());
        emit("close");
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Ошибка сохранения";
        setError(message);
    } finally {
        stopSaving();
    }
}
</script>
