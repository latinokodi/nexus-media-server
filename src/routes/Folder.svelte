<script lang="ts">
  import { api, type MediaGroup } from '../lib/api';
  import { push, useRoute } from '../lib/router.svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { clickOutside } from '../lib/actions';

  const route = useRoute();
  let id = $derived(route.params.id);
  let group: MediaGroup | null = $state(null);
  let favIds = $state(new Set<string>());
  let loading = $state(true);

  $effect(() => {
    if (!id) return;
    loading = true;
    Promise.all([api.getMedia(id), api.getFavorites()])
      .then(([data, favData]) => {
        group = data.find(g => g.id === id) || null;
        if (favData?.length > 0) favIds = new Set(favData[0].items.map((i: { id: string }) => i.id));
      })
      .finally(() => loading = false);
  });

  async function toggleFav(e: MouseEvent, itemId: string) {
    e.stopPropagation();
    if (favIds.has(itemId)) { await api.removeFavorite(itemId); favIds.delete(itemId); }
    else { await api.addFavorite(itemId); favIds.add(itemId); }
    favIds = favIds;
  }

  const isVideo = (t: string) => /\.(mp4|mkv|avi|webm)$/.test(t.toLowerCase());
</script>

{#if loading}
  <div class="page"><div class="spacer"></div><div class="content grid">{#each Array(10) as _}<div><div class="skeleton" style="aspect-ratio:16/9;border-radius:0.75rem;"></div></div>{/each}</div></div>
{:else if !group}
  <div class="page center"><h2>Carpeta no encontrada</h2><button class="link" onclick={() => push('/')}>Volver al inicio</button></div>
{:else}
  {@const folderName = group.folder_path.match(/[^/\\]+(?=[/\\]*$)/)?.[0] || group.folder_path}
  <main class="page" in:fly={{ y: 16, duration: 350 }}>
    <nav class="navbar">
      <div class="nav-left">
        <button class="icon" onclick={() => group!.parent_id ? push(`/folder/${group!.parent_id}`) : push('/')} title="Volver">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button class="icon home" onclick={() => push('/')} title="Inicio">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>
        <h1 class="title">{folderName}</h1>
      </div>
      {#if group.items.some(i => !i.is_dir)}
        <div class="play-btns">
          <button class="play btn-tactile" onclick={() => push(`/play-folder/${id}`)} title="Reproducir todo">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-sm md:icon-md" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="shuffle btn-tactile" onclick={() => push(`/play-folder/${id}?shuffle=true&recursive=true`)} title="Aleatorio">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-sm md:icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
          </button>
        </div>
      {/if}
    </nav>
    <div class="spacer"></div>
    <div class="content">
      {#if group.items.length === 0}
        <p class="empty-message">Esta carpeta está vacía.</p>
      {:else}
        <div class="grid">
          {#each group.items as item, i (item.id)}
            <article class="card-raised card-item" style="animation-delay:{i*30}ms" onclick={() => push(item.is_dir ? `/folder/${item.id}` : `/play/${item.id}`)} in:fly={{ y: 20, delay: i * 30 + 100, duration: 300, easing: quintOut }}>
              <div class="thumb">
                <img src={api.getThumbnailUrl(item.thumbnail_id || item.id)} alt="" loading="lazy" onerror={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                {#if item.is_dir}
                  <div class="badge"><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>Carpeta</span></div>
                {/if}
                {#if !item.is_dir && isVideo(item.title)}
                  <div class="play-overlay"><div class="play-circle"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div></div>
                  {#if item.watch_progress != null && item.watch_progress > 0}<div class="progress"><div style="width:{item.watch_progress}%"></div></div>{/if}
                {/if}
                <button class="fav-btn" onclick={(e) => toggleFav(e, item.id)} aria-label={favIds.has(item.id) ? 'Quitar' : 'Añadir'}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={favIds.has(item.id) ? '#E50914' : 'none'} stroke={favIds.has(item.id) ? '#E50914' : '#fff'} stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
              </div>
              <h3>{item.title}</h3>
            </article>
          {/each}
        </div>
      {/if}
    </div>
  </main>
{/if}

<style>
  .page { min-height: 100vh; min-height: 100dvh; background: #0a0a0b; padding-bottom: 5rem; }
  .center { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #f4f4f5; }
  .link { color: #E50914; text-decoration: underline; background: none; border: none; cursor: pointer; }
  .navbar { position: fixed; width: 100%; z-index: 50; background: rgba(10,10,11,0.9); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 0.5rem 0.75rem; padding-top: calc(0.5rem + env(safe-area-inset-top)); display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  @media (min-width: 768px) { .navbar { padding: 0.625rem 1.5rem; gap: 1rem; } }
  .nav-left { display: flex; align-items: center; gap: 0.375rem; min-width: 0; flex: 1 1 auto; overflow: hidden; }
  .icon { background: none; border: none; color: #a1a1aa; cursor: pointer; padding: 0.25rem; border-radius: 0.75rem; flex-shrink: 0; }
  .icon:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .home { color: #E50914; }
  .title { font-size: 0.95rem; font-weight: 700; color: #f4f4f5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1 1 0; min-width: 0; }
  @media (min-width: 768px) { .title { font-size: 1.5rem; } }
  .play-btns { display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center; margin-right: 0.5rem; }
  @media (min-width: 768px) { .play-btns { gap: 1rem; margin-right: 1.5rem; } }
  .play { background: #E50914; color: #fff; border: none; padding: 0.5rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(229,9,20,0.4); transition: transform 0.2s; }
  .play:hover { transform: scale(1.1); }
  @media (min-width: 768px) { .play { padding: 0.75rem; } }
  .shuffle { background: #27272a; color: #fff; border: none; padding: 0.5rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: transform 0.2s; }
  .shuffle:hover { transform: scale(1.1); color: #fff; }
  @media (min-width: 768px) { .shuffle { padding: 0.75rem; } }
  .spacer { height: 4.5rem; }
  .content { padding: 1.5rem 0.75rem; }
  @media (min-width: 768px) { .content { padding: 2rem 1.5rem; } }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
  @media (min-width: 768px) { .grid { grid-template-columns: repeat(5, 1fr); gap: 1.125rem; } }
  @media (min-width: 1280px) { .grid { grid-template-columns: repeat(6, 1fr); } }
  .card-item { cursor: pointer; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }
  .thumb { position: relative; aspect-ratio: 16/9; border-radius: 0.5rem; overflow: hidden; background: #1a1a1d; width: 100%; }
  .thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .badge { position: absolute; top: 0.25rem; left: 0.25rem; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); border-radius: 0.375rem; padding: 0.125rem 0.375rem; display: flex; align-items: center; gap: 0.25rem; border: 1px solid rgba(255,255,255,0.1); }
  .badge span { font-size: 0.5rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.7); }
  .play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
  .card-item:hover .play-overlay { opacity: 1; }
  .play-circle { background: rgba(255,255,255,0.2); backdrop-filter: blur(6px); padding: 0.625rem; border-radius: 99px; }
  .progress { position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: rgba(0,0,0,0.5); }
  .progress div { background: #E50914; height: 100%; }
  .fav-btn { position: absolute; top: 0.25rem; right: 0.25rem; opacity: 0; transition: opacity 0.15s; z-index: 20; padding: 0.375rem; background: rgba(0,0,0,0.5); border: none; border-radius: 0.5rem; cursor: pointer; }
  .card-item:hover .fav-btn { opacity: 1; }
  h3 { font-size: 0.75rem; font-weight: 500; color: #d4d4d8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3; }
  .empty-message { color: #71717a; text-align: center; padding: 5rem 0; font-size: 0.875rem; }
  .icon-sm { width: 1.25rem; height: 1.25rem; }
  @media (min-width: 768px) { .icon-md { width: 1.5rem; height: 1.5rem; } }
</style>
