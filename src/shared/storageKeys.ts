/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  DOCTORS: '@PetSlot:doctors',
  APPOINTMENTS: '@PetSlot:appointments',
  APP_INITIALIZED: '@PetSlot:initialized',
  USER_PREFERENCES: '@PetSlot:preferences',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];