<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import ToastItem from './ToastItem.vue';

interface Props {
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top-right',
});

const { toasts } = useToast();

const positionClasses = {
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
  'top-center': 'top-0 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
};

const flexDirection = props.position.startsWith('top') ? 'flex-col' : 'flex-col-reverse';
</script>

<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 z-50 flex px-4 py-6 sm:p-6"
    :class="[positionClasses[position]]"
  >
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <TransitionGroup
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ToastItem
          v-for="toast in toasts"
          :key="toast.id"
          :id="toast.id"
          :message="toast.message"
          :type="toast.type"
          :duration="toast.duration"
        />
      </TransitionGroup>
    </div>
  </div>
</template>
