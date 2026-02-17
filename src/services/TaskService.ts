import apiClient from '../api/client';

export interface Task {
  id: number;
  name: string;
  description?: string;
  frequencyId: number;
  frequencyName: string;
  goalId?: number;
  goalName?: string;
  goalUnit?: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  quantity?: number;
}

export interface CreateTaskDTO {
  name: string;
  description?: string;
  frequencyId: number;
  goalId?: number;
  quantity?: number;
}

const TaskService = {
  getTasks(): Promise<{ data: Task[] }> {
    return apiClient.get('/tasks');
  },

  getTask(id: number): Promise<{ data: Task }> {
    return apiClient.get(`/tasks/${id}`);
  },

  createTask(task: CreateTaskDTO): Promise<{ data: Task }> {
    return apiClient.post('/tasks', task);
  },

  updateTask(id: number, task: Partial<CreateTaskDTO>): Promise<{ data: Task }> {
    return apiClient.put(`/tasks/${id}`, task);
  },

  deleteTask(id: number): Promise<void> {
    return apiClient.delete(`/tasks/${id}`);
  },

  completeTask(id: number): Promise<{ data: Task }> {
    return apiClient.post(`/tasks/${id}/complete`);
  },

  uncompleteTask(id: number): Promise<{ data: Task }> {
    return apiClient.post(`/tasks/${id}/uncomplete`);
  }
};

export default TaskService;
