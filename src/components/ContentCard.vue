<template>
  <div
    class="border rounded-lg p-4 transition-all duration-200 hover:border-red-300"
    :class="{
      'border-red-600': isEditing,
      'hover:border-cyan-300': isEditing,
      'border-border-color hover:shadow-sm': !isEditing,
    }"
    v-on:mouseleave="showHint = false"
    v-on:mouseenter="showHint = true"
  >

    <div :class="{'cursorPointer':isEditing}" @click="startEditing" @dblclick="cancelEditing">
      <div class="flex flex-col">
        <input v-model="titleModel"
          class="font-medium text-gray-900 mb-1 outline-none"
          :class="{'cursor-auto': !isEditing}"
          :readonly="!isEditing"
        />
        <hr class="p-1">
        <textarea v-model="descriptionModel"
          class="text-sm text-gray-600 outline-none resize-none overflow-hidden"
          :class="{'cursor-auto': !isEditing}"
          :readonly="!isEditing"
          ref="textArea"
          @input="adjustTextArea"
        />
      </div>

      <!-- Индикатор редактирования при наведении -->
      <div 
        class="mt-2 text-xs text-gray-400 opacity-0 transition-opacity"
        :class="{ 'opacity-100': showHint || isEditing}"
      >
      {{ isEditing ? "✏️ Редактируется" : "✏️ Кликните для редактирования" }}
        
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted, computed } from "vue";

interface Props {
  title: string;
  description?: string;
}

interface Emits {
  (e: "update", payload: { title: string; description: string }): void;
  (e: "delete"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Состояние
const isEditing = ref(false);
const titleModel = ref(props.title);
const descriptionModel = ref(props.description || "");
const showHint = ref(false);

const textArea = ref();

const adjustTextArea = () => {
  textArea.value.style.height = 'auto';
  textArea.value.style.height = `${textArea.value.scrollHeight}px`;
};

const initTitle = props.title
const initDescription = props.description


const startEditing = () => {
  if(isEditing.value) return;

  isEditing.value = true;
  showHint.value = false
  console.log(props, descriptionModel, titleModel)
  descriptionModel.value = descriptionModel.value === initDescription ? "" : descriptionModel.value
  titleModel.value = titleModel.value === initTitle ? "" : titleModel.value
}

const cancelEditing = () => {
  if(isEditing.value){
    save()
    return;
  }
}

// Сохранить изменения
const save = () => {
  if (titleModel.value.trim()) {
    emit("update", {
      title: titleModel.value.trim(),
      description: descriptionModel.value.trim(),
    });
    isEditing.value = false;
  }
};

// Отменить редактирование
const cancel = () => {
  isEditing.value = false;
  titleModel.value = props.title;
  descriptionModel.value = props.description || "";
};

// Горячие клавиши
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
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
});
</script>
