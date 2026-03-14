<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";
import { computed, onMounted, ref, watch } from "vue";
import { BurndownChart, CalendarHeatmap, FrappeGantt } from "vue-viz";
import TaskService from "@/services/TaskService";
import GoalService from "@/services/GoalService";
import { useQuery } from "@tanstack/vue-query";
import { useToast } from "@/composables/useToast";
import "vue-viz/style.css";

const { error: toastError } = useToast();

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

const selectedGoalId = ref<number | undefined>(undefined);

const { data: goals } = useQuery({
  queryKey: ["goals"],
  queryFn: async () => {
    const { data } = await GoalService.getGoals();
    if (data && data.length > 0 && !selectedGoalId.value) {
      const firstGoal = data[0];
      if (firstGoal) {
        selectedGoalId.value = firstGoal.id;
      }
    }
    return data;
  },
});

const {
  data: burndownDataResponse,
  isError: isBurndownError,
  isPending: isBurndownPending,
} = useQuery({
  queryKey: ["burndown", selectedGoalId],
  queryFn: async () => {
    const id = selectedGoalId.value;
    if (!id) return null;
    const { data } = await GoalService.getBurndownData(id);
    return data;
  },
  enabled: computed(() => !!selectedGoalId.value),
});

watch(isBurndownError, (hasError) => {
  if (hasError) toastError("Failed to fetch burndown data");
});

const burndownData = computed(() => {
  if (!burndownDataResponse.value?.realBurndown) return [];
  return burndownDataResponse.value.realBurndown;
});

const idealBurndownData = computed(() => {
  if (!burndownDataResponse.value?.idealBurndown) return [];
  return burndownDataResponse.value.idealBurndown;
});

const burndownColors = computed(() => ({
  lineColor: `var(--graph-line)`,
  idealLineColor: `var(--graph-ideal-line)`,
  gridColor: `var(--graph-grid)`,
  backgroundColor: isDark.value ? "var(--heatmap-color-0)" : undefined,
  textColor: `var(--graph-text)`,
  border: "1px solid var(--color-surface-border)",
}));

const heatmapColors = computed(() => {
  return {
    colorScale: [
      "var(--heatmap-color-0)",
      "var(--heatmap-color-1)",
      "var(--heatmap-color-2)",
      "var(--heatmap-color-3)",
      "var(--heatmap-color-4)",
    ],
    textColor: "var(--graph-text)",
    backgroundColor: "var(--color-surface-bg)",
    hoverColor: "var(--heatmap-hover)",
    border: "1px solid var(--color-surface-border)",
  };
});

const ganttStartDate = new Date(
  new Date().setFullYear(new Date().getFullYear() - 5),
).toISOString();
const ganttEndDate = new Date(
  new Date().setFullYear(new Date().getFullYear() + 5),
).toISOString();

const { data: ganttGoals } = useQuery({
  queryKey: ["ganttGoals"],
  queryFn: async () => {
    const { data } = await GoalService.getGoalsInInterval(
      ganttStartDate,
      ganttEndDate,
    );
    return data;
  },
});

const ganttTasks = computed(() => {
  if (!ganttGoals.value) return [];
  return ganttGoals.value;
});

const tasks = computed(() => {
  if (!ganttGoals.value) return [];
  return ganttGoals.value.map((goal) => {
    const start = goal.start;
    const end = goal.end;
    return {
      id: String(goal.id),
      name: goal.name,
      start,
      end,
      progress: goal.progress,
    };
  });
});

const handleDateChange = (task: any, start: Date, end: Date) => {
  console.log("Date changed for task: ", task);
  console.log("New range:", start, end);
};

const handleProgressChange = (task: any, progress: number) => {
  console.log("Progress changed for task", task);
  console.log("new progress: ", progress);
};

const handleViewChange = (mode: any) => {
  console.log("View changed: ", mode);
};

const handleClick = (task: any) => {
  console.log("Clicked task: ", task);
};
</script>

<template>
  <div class="dashboard space-y-6 p-4">
    <h1 class="text-neutral-900 font-semibold text-xl">Dashboard</h1>
    <div>
      <h2 class="text-neutral-700 font-medium text-lg mb-2">Goal Gantt</h2>
      <FrappeGantt
        v-if="ganttTasks.length > 0"
        :tasks="tasks"
        :options="{ view_mode: 'Month' }"
        @taskClick="handleClick"
        @dateChange="handleDateChange"
        @progressChange="handleProgressChange"
        @viewChange="handleViewChange"
      />
      <div v-else class="text-center py-12 text-neutral-400 italic">
        No goals scheduled in this period.
      </div>
    </div>
    <div>
      <h2 class="text-neutral-700 font-medium text-lg mb-2">Yearly Activity</h2>
      <CalendarHeatmap
        class="mb-6"
        :data="heatmapCalendarData"
        :year="2026"
        v-bind="heatmapColors"
      />
    </div>
    <div v-if="goals && goals.length > 0">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-neutral-700 font-medium text-lg">
          Goal Burndown Chart
        </h2>
        <select
          v-model="selectedGoalId"
          class="border border-surface-border rounded-md px-3 py-1.5 text-sm bg-surface-bg text-primary-text outline-none focus:ring-2 focus:ring-primary-bg"
        >
          <option v-for="goal in goals" :key="goal.id" :value="goal.id">
            {{ goal.name }}
          </option>
        </select>
      </div>

      <div v-if="isBurndownPending" class="text-center py-12 text-neutral-500">
        Loading burndown chart...
      </div>
      <BurndownChart
        v-else-if="burndownData.length > 0"
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
        :border="burndownColors.border"
      />
      <div v-else class="text-center py-12 text-neutral-400 italic">
        No burndown data available for this goal.
      </div>
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
