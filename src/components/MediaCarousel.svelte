<script lang="ts">
  import { api, type MediaItem } from '../lib/api';
  import { push } from '../lib/router.svelte';

  let { title, items, removeFavorite }: {
    title: string;
    items: MediaItem[];
    removeFavorite?: (e: MouseEvent, id: string) => void;
  } = $props();

  let scrollEl: HTMLDivElement;

  function isVideo(title: string) {
    return /\.(mp4|mkv|avi|webm)$/.test(title.toLowerCase());
  }

  function scroll(dir: 'left' | 'right') {
    if (!scrollEl) return;
    const amount = dir === 'left' ? -scrollEl.clientWidth : scrollEl.clientWidth;
    scrollEl.scrollBy({ left: amount, behavior: 'smooth' });
  }
</script>

{#if items.length > 0}
  <div class="carousel">
    <h2>{title}</h2>
    <button class="arrow left" onclick={() => scroll('left')} aria-label="Anterior">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div bind:this={scrollEl} class="track">
      {#each items as item}
        <div class="item" onclick={() => push(item.is_dir ? `/folder/${item.id}` : `/play/${item.id}`)}>
          <div class="thumb">
            <img src={api.getThumbnailUrl(item.thumbnail_id || item.id)} alt="" loading="lazy" onerror={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
            {#if item.is_dir}
              <div class="badge"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>Carpeta</span></div>
            {/if}
            {#if !item.is_dir && isVideo(item.title)}
              <div class="play-overlay"><div class="play-circle"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div></div>
              {#if item.watch_progress != null && item.watch_progress > 0}
                <div class="progress"><div style="width:{item.watch_progress}%"></div></div>
              {/if}
            {/if}
            {#if removeFavorite}
              <button class="fav-btn" onclick={(e) => { e.stopPropagation(); removeFavorite(e, item.id); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#E50914"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </button>
            {/if}
          </div>
          <h3>{item.title}</h3>
        </div>
      {/each}
    </div>
    <button class="arrow right" onclick={() => scroll('right')} aria-label="Siguiente">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </button>
  </div>
{/if}

<style>
  .carousel { position: relative; padding: 0 1rem; }
  @media (min-width: 768px) { .carousel { padding: 0 3rem; } }
  h2 { font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 1rem; }
  .track { display: flex; gap: 1rem; overflow-x: auto; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; scroll-behavior: smooth; padding-bottom: 1rem; scrollbar-width: none; }
  .track::-webkit-scrollbar { display: none; }
  .item { flex: none; width: 60vw; cursor: pointer; display: flex; flex-direction: column; gap: 0.625rem; }
  @media (min-width: 768px) { .item { width: 18rem; } }
  @media (min-width: 1024px) { .item { width: 20rem; } }
  .thumb { position: relative; aspect-ratio: 16/9; background: #18181b; border-radius: 0.75rem; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); transition: border-color 0.3s; width: 100%; }
  .thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.7s; }
  .item:hover .thumb img { transform: scale(1.05); }
  .badge { position: absolute; top: 0.5rem; left: 0.5rem; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); border-radius: 0.375rem; padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 0.375rem; border: 1px solid rgba(255,255,255,0.1); z-index: 10; }
  .badge span { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; z-index: 10; }
  .item:hover .play-overlay { opacity: 1; }
  .play-circle { background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); padding: 0.75rem; border-radius: 9999px; }
  .progress { position: absolute; bottom: 0; left: 0; width: 100%; height: 0.25rem; background: rgba(0,0,0,0.4); z-index: 10; }
  .progress div { background: #dc2626; height: 100%; }
  .fav-btn { position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.5); border: none; border-radius: 9999px; cursor: pointer; opacity: 0; transition: opacity 0.15s; z-index: 50; }
  .item:hover .fav-btn { opacity: 1; }
  .fav-btn:hover { background: rgba(0,0,0,0.8); }
  h3 { font-size: 0.875rem; font-weight: 500; color: rgba(255,255,255,0.9); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 0.25rem; }
  .arrow { position: absolute; top: 0; bottom: 0; z-index: 40; background: rgba(0,0,0,0.6); border: none; color: #fff; width: 3rem; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; cursor: pointer; }
  .carousel:hover .arrow { opacity: 1; }
  .arrow:hover { background: rgba(0,0,0,0.8); }
  .arrow.left { left: 0; } .arrow.right { right: 0; }
</style>
