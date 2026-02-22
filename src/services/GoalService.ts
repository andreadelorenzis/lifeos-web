import apiClient from '../api/client';

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

const GoalService = {
  getGoals(): Promise<{ data: Goal[] }> {
    return apiClient.get('/goals');
  },

  getGoal(id: number): Promise<{ data: Goal }> {
    return apiClient.get(`/goals/${id}`);
  },

  createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'unitName' | 'statusName'>): Promise<{ data: Goal }> {
    return apiClient.post('/goals', goal);
  },

  updateGoal(id: number, goal: Partial<Goal>): Promise<{ data: Goal }> {
    return apiClient.put(`/goals/${id}`, goal);
  },

  deleteGoal(id: number): Promise<void> {
    return apiClient.delete(`/goals/${id}`);
  }

};

export default GoalService;
