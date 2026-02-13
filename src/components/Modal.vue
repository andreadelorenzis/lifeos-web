<script setup lang="ts">
import { ref, computed } from 'vue';
import { X } from 'lucide-vue-next';

interface Props {
  title?: string;
  isOpen: boolean;
}

interface Emits {
  close: [];
}

defineProps<Props>();
defineEmits<Emits>();

const modalRef = ref<HTMLDivElement>();

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === modalRef.value) {
    closeModal();
  }
};

const closeModal = () => {
  // Emit close event - parent component will handle closing
};
</script>

<template>
    <Transition name="modal">
      <div
        v-if="isOpen"
        ref="modalRef"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click="handleBackdropClick"
      >
        <div
          class="relative bg-surface-bg rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-surface-border">
            <h2 v-if="title" class="text-lg font-semibold text-neutral-900">
              {{ title }}
            </h2>
            <button
              @click="$emit('close')"
              class="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <X :size="24" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
}
</style>
