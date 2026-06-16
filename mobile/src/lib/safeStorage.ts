import AsyncStorage from "@react-native-async-storage/async-storage";

const memoryStorage = new Map<string, string>();

async function tryAsyncStorage<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await operation();
  } catch {
    return fallback();
  }
}

export const safeStorage = {
  getItem(key: string): Promise<string | null> {
    return tryAsyncStorage(
      () => AsyncStorage.getItem(key),
      () => memoryStorage.get(key) ?? null,
    );
  },

  setItem(key: string, value: string): Promise<void> {
    return tryAsyncStorage(
      () => AsyncStorage.setItem(key, value),
      () => {
        memoryStorage.set(key, value);
      },
    );
  },

  removeItem(key: string): Promise<void> {
    return tryAsyncStorage(
      () => AsyncStorage.removeItem(key),
      () => {
        memoryStorage.delete(key);
      },
    );
  },
};
