<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-vue-next';
import { useToast, type ToastType } from '@/composables/useToast';

const props = defineProps<{
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}>();

const { remove } = useToast();
let timer: ReturnType<typeof setTimeout> | null = null;
const remainingTime = ref(props.duration || 3000);
const startTime = ref(Date.now());

const pauseTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    remainingTime.value -= Date.now() - startTime.value;
  }
};

const resumeTimer = () => {
  if (remainingTime.value > 0) {
    startTime.value = Date.now();
    timer = setTimeout(() => {
      close();
    }, remainingTime.value);
  }
};

const close = () => {
  remove(props.id);
};

onMounted(() => {
  if (props.duration && props.duration > 0) {
    resumeTimer();
  }
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});

const icons = {
  success: CheckCircle,
  error: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};
</script>

<template>
  <div
    class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg ring-1 ring-black ring-opacity-5"
    :class="colors[type]"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
  >
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <component :is="icons[type]" class="h-5 w-5" aria-hidden="true" />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium">{{ message }}</p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button
            type="button"
            class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="colors[type]"
            @click="close"
          >
            <span class="sr-only">Close</span>
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
