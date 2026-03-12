import { themeManager } from "@/pixi/theme/themeManager";
import { ref, readonly } from "vue";
import { nextTick } from "vue";

const isDark = ref(false);

const toggleDark = async () => {
  isDark.value = !isDark.value;
  await nextTick();
  themeManager.updateTheme();
};

export const useTheme = () => {
  return {
    isDark: readonly(isDark),
    toggleDark,
  };
};
