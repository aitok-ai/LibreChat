import { LocalStorageKeys } from 'librechat-data-provider';
import useLocalStorage from '~/hooks/useLocalStorageAlt';

export default function useVideoPinned() {
  const storageKey = `${LocalStorageKeys.LAST_VIDEO_TOGGLE_ ?? 'LAST_VIDEO_TOGGLE_'}pinned`;
  return useLocalStorage<boolean>(storageKey, false);
}
