import { useEffect, useReducer, useRef } from 'react';
import { isClient } from '@/lib/utils';

const useLocalStorageReducer = (key = '', reducer, initialValue = null) => {
  const [state, dispatch] = useReducer((currentState, action) => {
    if (action?.type === '__LOCAL_STORAGE_INIT__') {
      return action.state;
    }
    return reducer(currentState, action);
  }, initialValue);

  const firstRun = useRef(true);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    try {
      if (isClient) {
        const item = window.localStorage.getItem(key);
        if (item) {
          dispatch({ type: '__LOCAL_STORAGE_INIT__', state: JSON.parse(item) });
        }
      }
    } catch (error) {
      // Ignore storage errors and keep initialValue
    }
  }, [key]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    // Update local storage with new state
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Unable to store new value for ${key} in localStorage.`);
    }
  }, [state]);

  return [state, dispatch];
};

export default useLocalStorageReducer;
