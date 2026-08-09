const getStorage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export const storageGet = (key: string): string | null => {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const storageSet = (key: string, value: string): boolean => {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const storageRemove = (key: string): void => {
  try {
    getStorage()?.removeItem(key);
  } catch {
    // Persistence is optional; the UI still works without it.
  }
};
