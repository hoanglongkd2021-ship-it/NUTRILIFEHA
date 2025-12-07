
import { DailyLog, MealSchedule, PresetFood, UserProfile, WeightHistory } from "../types";

// --- SIMULATED CLOUD DATABASE ---
// In a real application, this would be a MongoDB/SQL database accessed via REST/GraphQL API.
// We simulate the "Server" storage using a separate LocalStorage key that acts as the remote DB.
const CLOUD_DB_KEY = 'nutrilife_cloud_database_v1';

export interface UserData {
    profile: UserProfile | null;
    logs: DailyLog[];
    weightHistory: WeightHistory[];
    schedule: MealSchedule;
    presetFoods: PresetFood[];
    lastSynced: number;
}

// Helper to simulate network delay (Reduced for faster perceived sync)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- DATA OPTIMIZATION HELPERS ---
const optimizeLogs = (logs: DailyLog[]): DailyLog[] => {
    // 1. Filter: Keep only the last 365 days of logs
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    
    // 2. Image Retention Policy: Only keep images for the last 7 days to save massive space
    const imageRetentionCutoff = new Date();
    imageRetentionCutoff.setDate(imageRetentionCutoff.getDate() - 7);

    return logs
        .filter(log => new Date(log.date) >= cutoffDate)
        .map(log => {
            const isRecent = new Date(log.date) >= imageRetentionCutoff;
            
            return {
                ...log,
                // Round total calories to integer to save bytes
                totalCalories: Math.round(log.totalCalories), 
                meals: log.meals.map(meal => ({
                    ...meal,
                    // Strip image if older than 7 days
                    imageUrl: isRecent ? meal.imageUrl : undefined,
                    // Trim manual notes
                    manualNotes: meal.manualNotes ? meal.manualNotes.trim() : undefined,
                    // Round analysis numbers to save JSON space
                    analysis: meal.analysis ? {
                        ...meal.analysis,
                        calories: Math.round(meal.analysis.calories),
                        protein: Math.round(meal.analysis.protein),
                        carbs: Math.round(meal.analysis.carbs),
                        fat: Math.round(meal.analysis.fat),
                        // Remove confidence score from storage as it's not needed for history
                        confidence: 0 
                    } : undefined
                }))
            };
        });
};

export const CloudService = {
    // PULL: Get data from "Server" when user logs in on a new device
    getUserData: async (username: string): Promise<UserData | null> => {
        await delay(500); // Fast network simulation

        try {
            const rawDb = localStorage.getItem(CLOUD_DB_KEY);
            if (!rawDb) return null;

            const db = JSON.parse(rawDb);
            const userData = db[username];

            if (!userData) return null;

            return userData as UserData;
        } catch (e) {
            console.error("Cloud Sync Error (Pull):", e);
            return null;
        }
    },

    // PUSH: Save data to "Server" (Real-time sync)
    saveUserData: async (username: string, data: Omit<UserData, 'lastSynced'>): Promise<boolean> => {
        // Very short delay to simulate an API call but feel "instant"
        await delay(100); 

        try {
            // 1. Read current Cloud DB
            const rawDb = localStorage.getItem(CLOUD_DB_KEY) || '{}';
            const db = JSON.parse(rawDb);

            // 2. Optimize Payload for Hosting Storage (Aggressive)
            // This ensures we don't hit localStorage quotas or hosting limits easily
            const optimizedData: UserData = {
                profile: data.profile,
                logs: optimizeLogs(data.logs), 
                weightHistory: data.weightHistory,
                schedule: data.schedule,
                presetFoods: data.presetFoods,
                lastSynced: Date.now() // Critical for conflict resolution
            };

            // 3. Update specific user data
            db[username] = optimizedData;

            // 4. Save back to "Server"
            localStorage.setItem(CLOUD_DB_KEY, JSON.stringify(db));
            
            // Log for debugging storage size
            const sizeInBytes = new Blob([JSON.stringify(db)]).size;
            console.log(`[Cloud Sync] Saved Instant. DB Size: ${(sizeInBytes/1024).toFixed(2)} KB`);
            
            return true;
        } catch (e) {
            console.error("Cloud Sync Error (Push):", e);
            return false;
        }
    }
};
