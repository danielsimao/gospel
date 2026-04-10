const STORAGE_EVENT = "gospel:storage";

function hasWindow() {
  return typeof window !== "undefined";
}

export function emitStorageChange() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function subscribeToStorage(callback: () => void) {
  if (!hasWindow()) {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(STORAGE_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
