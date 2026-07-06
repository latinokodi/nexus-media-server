<script lang="ts">
  import { api, type MediaItem } from '../lib/api';
  import { push, useRoute } from '../lib/router.svelte';

  const route = useRoute();
  let folderId = $derived(route.params.id);
  let shuffle = $state(false);
  let recursive = $state(false);

  let playlist: MediaItem[] = $state([]);
  let currentIndex = $state(0);
  let showControls = $state(false);
  let loading = $state('');
  let container: HTMLDivElement;
  let videoEl: HTMLVideoElement;

  $effect(() => {
    const hash = window.location.hash;
    const qs = hash.includes('?') ? hash.split('?')[1] : '';
    const p = new URLSearchParams(qs);
    shuffle = p.get('shuffle') === 'true';
    recursive = p.get('recursive') === 'true';

    const token = localStorage.getItem('media_token');

    async function load() {
      loading = 'Cargando...';

      if (recursive) {
        // Chunked loading: get immediate folder first, then subfolders
        const top = await fetch(`/api/media?parent_id=${folderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());

        let items: MediaItem[] = [];
        const subFolders: string[] = [];

        if (top?.[0]?.items) {
          for (const item of top[0].items) {
            if (item.is_dir) subFolders.push(item.id);
            else items.push(item);
          }
        }

        // Play first video immediately
        playlist = items;
        loading = items.length > 0 ? '' : 'Buscando...';
        if (items.length > 0) {
          requestAnimationFrame(() => { videoEl?.load(); videoEl?.play().catch(() => {}); });
        }

        // Load subfolders progressively
        for (const subId of subFolders) {
          loading = items.length > 0 ? '' : 'Buscando...';
          try {
            const sub = await fetch(`/api/media?parent_id=${subId}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.json());
            if (sub?.[0]?.items) {
              const newItems = sub[0].items.filter((i: MediaItem) => !i.is_dir);
              items.push(...newItems);
            }
          } catch {}
          // Update playlist progressively
          playlist = [...items];
        }
      } else {
        // Non-recursive: single fast request
        const data = await fetch(`/api/media?parent_id=${folderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());

        let items: MediaItem[] = [];
        if (data?.[0]?.items) items = data[0].items.filter((i: MediaItem) => !i.is_dir);
        else if (Array.isArray(data)) data.forEach((g: any) => items.push(...g.items.filter((i: MediaItem) => !i.is_dir)));

        playlist = items;
        if (items.length > 0) {
          requestAnimationFrame(() => { videoEl?.load(); videoEl?.play().catch(() => {}); });
        }
      }

      // Apply shuffle if needed
      if (shuffle) {
        playlist = playlist.sort(() => Math.random() - 0.5);
        currentIndex = 0;
      }

      loading = playlist.length === 0 ? 'Sin archivos' : '';
    }

    load();
  });

  const currentVideo = $derived(playlist[currentIndex]);
  const isImage = $derived(currentVideo ? /\.(jpg|jpeg|png|webp|gif|bmp)$/.test(currentVideo.title.toLowerCase()) : false);

  function next() { if (currentIndex < playlist.length - 1) currentIndex++; }
  function prev() { if (currentIndex > 0) currentIndex--; }
  function toggleFullscreen() {
    if (!document.fullscreenElement) container?.requestFullscreen();
    else document.exitFullscreen();
  }
</script>

<svelte:window onkeydown={(e) => {
  if ((e.key === 'n' || e.key === 'ArrowRight') && currentIndex < playlist.length - 1) currentIndex++;
  if ((e.key === 'p' || e.key === 'ArrowLeft') && currentIndex > 0) currentIndex--;
}} />

<div bind:this={container} class="player" onclick={() => showControls = !showControls} ondblclick={toggleFullscreen}>
  <button class="top-btn left" onclick={(e) => { e.stopPropagation(); history.back(); }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
  </button>
  <button class="top-btn left2" onclick={(e) => { e.stopPropagation(); push('/'); }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </button>

  <div class="counter">
    {#if loading}{loading}
    {:else if playlist.length === 0}Sin archivos
    {:else}{currentIndex + 1} / {playlist.length}
    {/if}
  </div>

  {#if currentVideo}
    {#if isImage}
      <img src={api.getStreamUrl(currentVideo.id)} class="media" alt={currentVideo.title} />
    {:else}
      <video bind:this={videoEl} src={api.getStreamUrl(currentVideo.id)} class="media" autoplay controls disablepictureinpicture onended={() => next()}></video>
    {/if}
  {/if}

  {#if playlist.length > 0}
    <button class="side-btn left" onclick={(e) => { e.stopPropagation(); prev(); }} disabled={currentIndex === 0}>
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <button class="side-btn right" onclick={(e) => { e.stopPropagation(); next(); }} disabled={currentIndex >= playlist.length - 1}>
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </button>
  {/if}
</div>

<style>
  .player { height: 100vh; height: 100dvh; width: 100vw; background: #000; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .media { width: 100%; height: 100%; object-fit: contain; }
  .top-btn { position: absolute; top: calc(2rem + env(safe-area-inset-top)); z-index: 50; color: #fff; background: rgba(0,0,0,0.5); border: none; padding: 0.75rem; border-radius: 9999px; cursor: pointer; }
  .top-btn.left { left: 2rem; }
  .top-btn.left2 { left: 6rem; top: calc(2rem + env(safe-area-inset-top)); position: absolute; z-index: 50; color: #fff; background: rgba(0,0,0,0.5); border: none; padding: 0.75rem; border-radius: 9999px; cursor: pointer; }
  .counter { position: absolute; top: calc(2rem + env(safe-area-inset-top)); right: 2rem; z-index: 50; background: rgba(0,0,0,0.5); color: #fff; padding: 0.5rem 1rem; border-radius: 9999px; backdrop-filter: blur(8px); font-size: 0.8125rem; }
  .side-btn { position: absolute; top: 50%; transform: translateY(-50%); z-index: 50; background: rgba(0,0,0,0.4); color: #fff; border: none; padding: 0.75rem; border-radius: 9999px; cursor: pointer; }
  @media (min-width: 768px) { .side-btn { padding: 1rem; } }
  .side-btn:hover:not(:disabled) { background: rgba(229,9,20,0.8); }
  .side-btn:disabled { opacity: 0; }
  .side-btn.left { left: 0.5rem; } .side-btn.right { right: 0.5rem; }
  @media (min-width: 768px) { .side-btn.left { left: 1.5rem; } .side-btn.right { right: 1.5rem; } }
</style>
