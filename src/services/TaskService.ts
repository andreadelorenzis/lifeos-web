import apiClient from "../api/client";

export interface Task {
  id: number;
  name: string;
  description?: string;
  frequencyId: number;
  frequencyName: string;
  goalId?: number;
  goalName?: string;
  goalUnitCode?: string;
  goalUnitName?: string;
  taskOrder: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  quantity?: number;
  progress?: number;
  selectedDays?: number[];
  urgent: boolean;
}

export interface CreateTaskDTO {
  name: string;
  description?: string;
  frequencyId: number;
  goalId?: number;
  quantity?: number;
  progress?: number;
  selectedDays?: number[];
  urgent?: boolean;
}

export interface TaskProgressUpdateDTO {
  quantity: number;
}

const TaskService = {
  getTasks(frequencyId?: number): Promise<{ data: Task[] }> {
    const params = new URLSearchParams();
    if (frequencyId !== undefined) {
      params.append("frequencyId", frequencyId.toString());
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get(`/tasks${queryString}`);
  },

  getTask(id: number): Promise<{ data: Task }> {
    return apiClient.get(`/tasks/${id}`);
  },

  getTasksDueToday(includeOneTimeTasks?: boolean): Promise<{ data: Task[] }> {
    const params = new URLSearchParams();
    if (includeOneTimeTasks !== undefined) {
      params.append("includeOneTimeTasks", includeOneTimeTasks.toString());
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get(`/tasks/due-today${queryString}`);
  },

  createTask(task: CreateTaskDTO): Promise<{ data: Task }> {
    return apiClient.post("/tasks", task);
  },

  updateTask(
    id: number,
    task: Partial<CreateTaskDTO>,
  ): Promise<{ data: Task }> {
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
  },

  addTaskProgress(
    id: number,
    data: TaskProgressUpdateDTO,
  ): Promise<{ data: Task }> {
    return apiClient.post(`/tasks/${id}/progress`, data);
  },

  setTaskUrgency(id: number, urgent: boolean): Promise<{ data: Task }> {
    const params = new URLSearchParams();
    params.append("urgent", urgent.toString());
    return apiClient.patch(`/tasks/${id}/urgent?${params.toString()}`);
  },

  getTaskCompletions(
    year: number,
  ): Promise<{ data: { date: string; count: number }[] }> {
    const params = new URLSearchParams();
    params.append("year", year.toString());
    return apiClient.get(`/tasks/completions?${params.toString()}`);
  },
};

export default TaskService;
