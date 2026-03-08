import apiClient from "../api/client";

export interface Goal {
  id: number;
  name: string;
  description: string;
  unitCode: string;
  unitName?: string;
  targetQuantity: number;
  currentProgress: number;
  idealProgress?: number;
  deadline: Date | string;
  difficulty: number;
  importance: number;
  reason: string;
  reward: string;
  punishment: string;
  statusId: number;
  statusName: string;
  createdAt: Date;
}

export interface BurndownPoint {
  date: string;
  remaining: number;
}

export interface BurndownData {
  idealBurndown: BurndownPoint[];
  realBurndown: BurndownPoint[];
}

const GoalService = {
  getGoals(): Promise<{ data: Goal[] }> {
    return apiClient.get("/goals");
  },

  getGoal(id: number): Promise<{ data: Goal }> {
    return apiClient.get(`/goals/${id}`);
  },

  getGoalsInInterval(
    startDate: string,
    endDate: string,
  ): Promise<{ data: Goal[] }> {
    return apiClient.get("/goals/interval", {
      params: { startDate, endDate },
    });
  },

  createGoal(
    goal: Omit<Goal, "id" | "createdAt" | "unitName" | "statusName">,
  ): Promise<{ data: Goal }> {
    return apiClient.post("/goals", goal);
  },

  updateGoal(id: number, goal: Partial<Goal>): Promise<{ data: Goal }> {
    return apiClient.put(`/goals/${id}`, goal);
  },

  deleteGoal(id: number): Promise<void> {
    return apiClient.delete(`/goals/${id}`);
  },

  getBurndownData(id: number): Promise<{ data: BurndownData }> {
    return apiClient.get(`/goals/${id}/burndown`);
  },
};

export default GoalService;
