import apiClient from '../api/client';

export interface GoalStatus {
    id: number;
    name: string;
}

const GoalStatusService = {
    getGoalStatuses(): Promise<{ data: GoalStatus[] }> {
        return apiClient.get('/goal-statuses');
    }
};

export default GoalStatusService;
