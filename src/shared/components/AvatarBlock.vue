<template>
    <div
        class="flex items-center gap-3 p-4 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50"
        @click="isModalOpen = true"
    >
        <Avatar
            :avatar-url="avatarUrl"
            :style="{ borderColor: cursorColor }"
        ></Avatar>
        <div>
            <h3 class="font-medium text-gray-900">
                {{ title }}
            </h3>
            <p class="text-sm text-gray-600">
                {{ description }}
            </p>
        </div>
    </div>

    <!-- Модалка смены аватарки -->
    <div
        v-if="isModalOpen"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="isModalOpen = false"
    >
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 class="text-lg font-semibold mb-4">Изменить аватарку</h2>

            <input
                v-model="avatarUrlInput"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                @keydown.enter="saveAvatar"
            />

            <!-- Превью -->
            <div v-if="avatarUrlInput" class="mt-3 flex items-center gap-3">
                <Avatar :avatar-url="avatarUrlInput" />
                <span class="text-xs text-gray-400">Превью</span>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <button
                    @click="isModalOpen = false"
                    class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    Отмена
                </button>
                <button
                    @click="saveAvatar"
                    :disabled="saving"
                    class="px-4 py-2 bg-brand-default text-white rounded-lg disabled:opacity-50"
                >
                    {{ saving ? "Сохранение..." : "Сохранить" }}
                </button>
            </div>

            <p v-if="error" class="mt-2 text-sm text-red-500">{{ error }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import Avatar from "./Avatar.vue";
import { useUserStore } from "@/entities/user/user.store";
import { getPeerColor } from "@/utils/peerColor";

interface Props {
    avatarUrl: string;
    title: string;
    description: string;
}

const props = defineProps<Props>();

const userStore = useUserStore();
const cursorColor = computed(() => {
    const userId = userStore.current?.id || "";
    return getPeerColor(userId);
});
const isModalOpen = ref(false);
const avatarUrlInput = ref("");
const saving = ref(false);
const error = ref("");

watch(isModalOpen, (open) => {
    if (open) {
        avatarUrlInput.value = props.avatarUrl || "";
        error.value = "";
    }
});

async function saveAvatar() {
    if (!avatarUrlInput.value.trim()) {
        error.value = "Введите URL";
        return;
    }

    saving.value = true;
    error.value = "";

    try {
        await userStore.updateAvatar(avatarUrlInput.value.trim());
        isModalOpen.value = false;
    } catch (e: any) {
        error.value = e.message || "Ошибка сохранения";
    } finally {
        saving.value = false;
    }
}
</script>
