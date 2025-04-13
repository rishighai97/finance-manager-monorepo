
export interface User {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt?: string;
    updatedAt?: string;
}