import { DailyLog, MealSchedule, PresetFood, UserProfile, WeightHistory } from "../types";

export interface LocalUserData {
    profile: UserProfile | null;
    logs: DailyLog[];
    weightHistory: WeightHistory[];
    schedule: MealSchedule;
    presetFoods: PresetFood[];
    lastSynced: number; // Timestamp of the last local update
}

// Helper to generate user-specific key
const getLocalKey = (username: string) => `nutrilife_local_v2_${username}`;

export const LocalService = {
    // Save data immediately to device storage
    saveUserData: (username: string, data: LocalUserData): void => {
        try {
            localStorage.setItem(getLocalKey(username), JSON.stringify(data));
        } catch (e) {
            console.error("Local Save Error (Quota exceeded?):", e);
        }
    },

    // Load data immediately from device storage
    getUserData: (username: string): LocalUserData | null => {
        try {
            const raw = localStorage.getItem(getLocalKey(username));
            if (!raw) return null;
            return JSON.parse(raw) as LocalUserData;
        } catch (e) {
            console.error("Local Load Error:", e);
            return null;
        }
    },

    // Clear local data (for logout/cleanup if needed, though usually we keep it for offline cache)
    clearUserData: (username: string) => {
        localStorage.removeItem(getLocalKey(username));
    }
};