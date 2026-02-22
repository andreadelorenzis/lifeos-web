import { ref } from 'vue'

interface TaskModalState {
    isOpen: boolean
    goalId?: number
}

// Global state for opening the task creation modal from anywhere
export const useTaskModalStore = () => {
    const state = ref<TaskModalState>({
        isOpen: false,
        goalId: undefined
    })

    const openModal = (goalId?: number) => {
        state.value = {
            isOpen: true,
            goalId
        }
    }

    const closeModal = () => {
        state.value = {
            isOpen: false,
            goalId: undefined
        }
    }

    return {
        state,
        openModal,
        closeModal
    }
}

// Create a singleton instance
export const taskModalStore = useTaskModalStore()
