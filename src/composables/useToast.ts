import { ref, readonly } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

const toasts = ref<Toast[]>([]);

const remove = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index !== -1) {
        toasts.value.splice(index, 1);
    }
};

const add = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
        id,
        message,
        type,
        duration,
    };

    toasts.value.push(toast);

    /* 
    if (duration > 0) {
        setTimeout(() => {
            remove(id);
        }, duration);
    } */

    return id;
};

export const useToast = () => {
    return {
        toasts: readonly(toasts),
        add,
        remove,
        success: (message: string, duration?: number) => add(message, 'success', duration),
        error: (message: string, duration?: number) => add(message, 'error', duration),
        warning: (message: string, duration?: number) => add(message, 'warning', duration),
        info: (message: string, duration?: number) => add(message, 'info', duration),
    };
};
