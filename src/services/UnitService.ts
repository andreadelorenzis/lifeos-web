import apiClient from '../api/client';

export interface Unit {
    id: number;
    code: string;
    name: string;
    description: string;
}

const UnitService = {
    getUnits(): Promise<{ data: Unit[] }> {
        return apiClient.get('/units');
    }
};

export default UnitService;
