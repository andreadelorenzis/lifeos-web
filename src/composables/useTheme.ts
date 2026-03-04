import { ref, readonly } from "vue";

const isDark = ref(false);

const toggleDark = () => {
  isDark.value = !isDark.value;
};

export const useTheme = () => {
  return {
    isDark: readonly(isDark),
    toggleDark,
  };
};
