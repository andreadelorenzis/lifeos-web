<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";
import { computed, onMounted, ref } from "vue";
import { BurndownChart, CalendarHeatmap } from "vue-viz";
import TaskService from "@/services/TaskService";
import "vue-viz/style.css";

const { isDark } = useTheme();

const heatmapCalendarData = ref<{ date: string; value: number }[]>([]);

onMounted(async () => {
  try {
    const currentYear = new Date().getFullYear();
    const response = await TaskService.getTaskCompletions(currentYear);
    // map count -> value for the heatmap
    heatmapCalendarData.value = response.data.map((item) => ({
      date: item.date,
      value: item.count,
    }));
  } catch (err) {
    console.error("Failed to load task completions", err);
  }
});

const burndownData = [
  { day: "Day 1", value: 50 },
  { day: "Day 2", value: 42 },
  { day: "Day 3", value: 35 },
  { day: "Day 4", value: 28 },
  { day: "Day 5", value: 20 },
  { day: "Day 6", value: 12 },
  { day: "Day 7", value: 0 },
];

const idealBurndownData = [
  { day: "Day 1", value: 50 },
  { day: "Day 2", value: 40 },
  { day: "Day 3", value: 20 },
  { day: "Day 4", value: 10 },
  { day: "Day 5", value: 5 },
  { day: "Day 6", value: 2 },
  { day: "Day 7", value: 0 },
];

const burndownColors = computed(() => ({
  lineColor: `var(--graph-line)`,
  idealLineColor: `var(--graph-ideal-line)`,
  gridColor: `var(--graph-grid)`,
  backgroundColor: `var(--graph-bg)`,
  textColor: `var(--graph-text)`,
}));

const heatmapColors = computed(() => {
  if (!isDark.value) return {}; // light mode → use default

  return {
    colorScale: [
      "var(--heatmap-color-0)",
      "var(--heatmap-color-1)",
      "var(--heatmap-color-2)",
      "var(--heatmap-color-3)",
      "var(--heatmap-color-4)",
    ],
    textColor: "var(--graph-text)",
    backgroundColor: "var(--graph-bg)",
    hoverColor: "var(--heatmap-hover)",
  };
});
</script>

<template>
  <div class="dashboard space-y-6 p-4">
    <h1 class="text-neutral-900 font-semibold text-xl">Dashboard</h1>
    <div>
      <h2 class="text-neutral-700 font-medium text-lg mb-2">Yearly Activity</h2>
      <CalendarHeatmap
        class="mb-6"
        :data="heatmapCalendarData"
        :year="2026"
        v-bind="heatmapColors"
      />
    </div>
    <div>
      <h2 class="text-neutral-700 font-medium text-lg mb-2">
        Goal Burndown Chart
      </h2>
      <BurndownChart
        :data="burndownData"
        :idealData="idealBurndownData"
        :lineColor="burndownColors.lineColor"
        :idealLineColor="burndownColors.idealLineColor"
        lineStrokeWidth="3"
        idealLineStrokeWidth="2"
        lineStyle="solid"
        idealLineStyle="dotted"
        :backgroundColor="burndownColors.backgroundColor"
        :textColor="burndownColors.textColor"
      />
    </div>
  </div>
</template>

<style>
.dashboard {
  width: 100%;
  max-width: 100%;
  display: inline-block;
}
</style>
