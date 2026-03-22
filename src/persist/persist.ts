import { AnyAction, Reducer } from "@reduxjs/toolkit";

// ================================
// PERSIST REDUCER
// ================================

interface PersistOptions {
  key: string;
  storage?: Storage;
}

export function persistReducer<S>(
  reducer: Reducer<S, AnyAction>,
  { key, storage = sessionStorage }: PersistOptions
): Reducer<S, AnyAction> {
  // Hydrate state from storage on first run
  let hydrated = false;
  return (state: S | undefined, action: AnyAction): S => {
    if (!hydrated && typeof window !== 'undefined') {
      hydrated = true;
      const persisted = storage.getItem(key);
      if (persisted) {
        try {
          state = JSON.parse(persisted);
        } catch (e) {
          // Ignore parse errors, fallback to default state
        }
      }
    }
    const newState = reducer(state, action);
    try {
      storage.setItem(key, JSON.stringify(newState));
    } catch (e) {
      console.warn("Error saving state:", e);
    }
    return newState;
  };
}

// ================================
// LOAD STATE
// ================================

export function loadState<T>(
  key: string,
  storage: Storage = sessionStorage
): T | undefined {
  try {
    const data = storage.getItem(key);
    return data ? (JSON.parse(data) as T) : undefined;
  } catch (e) {
    console.warn("Error loading state:", e);
    return undefined;
  }
}