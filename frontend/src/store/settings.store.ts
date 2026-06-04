import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamiliarityLevel, LearningGoal, PreferredLearningStyle } from '@/types';

interface LearningDefaults {
  weeklyHoursGoal: number;
  familiarityLevel: FamiliarityLevel;
  learningGoal: LearningGoal;
  preferredLearningStyle: PreferredLearningStyle | '';
  priorSkills: string;
  aboutSelf: string;
}

interface NotificationPreferences {
  decayReminders: boolean;
  quizResultNotifications: boolean;
  masteryAchievements: boolean;
}

interface YenetaSettingsState {
  learningDefaults: LearningDefaults;
  notifications: NotificationPreferences;
  setWeeklyHoursGoal: (hours: number) => void;
  setFamiliarityLevel: (level: FamiliarityLevel) => void;
  setLearningGoal: (goal: LearningGoal) => void;
  setPreferredLearningStyle: (style: PreferredLearningStyle | '') => void;
  setPriorSkills: (skills: string) => void;
  setAboutSelf: (about: string) => void;
  setNotificationPreference: (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => void;
}

export const useYenetaSettingsStore = create<YenetaSettingsState>()(
  persist(
    (set) => ({
      learningDefaults: {
        weeklyHoursGoal: 8,
        familiarityLevel: 'beginner',
        learningGoal: 'upskill',
        preferredLearningStyle: '',
        priorSkills: '',
        aboutSelf: '',
      },
      notifications: {
        decayReminders: true,
        quizResultNotifications: true,
        masteryAchievements: true,
      },
      setWeeklyHoursGoal: (hours) =>
        set((state) => ({
          learningDefaults: {
            ...state.learningDefaults,
            weeklyHoursGoal: Math.min(100, Math.max(1, Math.floor(hours || 1))),
          },
        })),
      setFamiliarityLevel: (level) =>
        set((state) => ({
          learningDefaults: { ...state.learningDefaults, familiarityLevel: level },
        })),
      setLearningGoal: (goal) =>
        set((state) => ({
          learningDefaults: { ...state.learningDefaults, learningGoal: goal },
        })),
      setPreferredLearningStyle: (style) =>
        set((state) => ({
          learningDefaults: { ...state.learningDefaults, preferredLearningStyle: style },
        })),
      setPriorSkills: (skills) =>
        set((state) => ({
          learningDefaults: { ...state.learningDefaults, priorSkills: skills },
        })),
      setAboutSelf: (about) =>
        set((state) => ({
          learningDefaults: { ...state.learningDefaults, aboutSelf: about },
        })),
      setNotificationPreference: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),
    }),
    { name: 'Yeneta-settings' },
  ),
);
