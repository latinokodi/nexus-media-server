export function clickOutside(node: HTMLElement, handler: () => void) {
  const onClick = (e: MouseEvent) => {
    if (!node.contains(e.target as Node)) handler();
  };
  document.addEventListener('click', onClick, true);
  return {
    destroy() { document.removeEventListener('click', onClick, true); }
  };
}
