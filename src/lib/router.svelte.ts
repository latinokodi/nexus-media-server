// Simple Svelte 5 hash router — no dependencies
let current = $state(window.location.hash.slice(1) || '/');

window.addEventListener('hashchange', () => {
  current = window.location.hash.slice(1) || '/';
});

export function push(path: string) {
  window.location.hash = '#' + path;
}

export function useRoute() {
  return {
    get path() { return current; },
    get params() {
      const parts = current.split('/').filter(Boolean);
      return { id: parts[parts.length - 1] || '' };
    }
  };
}
