import apiClient from '../api/client';

export interface DecompositionRequest {
    goalId: number;
    frequencyId: number;
    quantity?: number;
}

export interface DecompositionResponse {
    requiredQuantity: number;
    feasible: boolean | null;
    suggestedDeadline: string | null;
    valueShortfall: number | null;
}

const DecompositionService = {
    decompose(data: DecompositionRequest) {
        return apiClient.post('/goals/decompose', data);
    }
};

export default DecompositionService;
