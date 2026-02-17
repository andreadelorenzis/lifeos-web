import apiClient from '../api/client';

export interface Frequency {
    id: number;
    name: string;
}

const FrequencyService = {
    getFrequencies(): Promise<{ data: Frequency[] }> {
        return apiClient.get('/frequencies');
    }
};

export default FrequencyService;
