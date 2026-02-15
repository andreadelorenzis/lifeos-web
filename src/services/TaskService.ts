import apiClient from '../api/client';

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  createdAt: Date;
}

const TaskService = {
  getTasks(): Promise<{ data: Task[] }> {
    return apiClient.get('/tasks');
  },
  
  getTask(id: number): Promise<{ data: Task }> {
    return apiClient.get(`/tasks/${id}`);
  },
  
  createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<{ data: Task }> {
    return apiClient.post('/tasks', task);
  },
  
  updateTask(id: number, task: Partial<Task>): Promise<{ data: Task }> {
    return apiClient.put(`/tasks/${id}`, task);
  },
  
  deleteTask(id: number): Promise<void> {
    return apiClient.delete(`/tasks/${id}`);
  }
};

export default TaskService;
