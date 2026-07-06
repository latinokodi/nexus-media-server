<script lang="ts">
  import { api, type MediaGroup, type MediaItem } from '../lib/api';
  import { push } from '../lib/router.svelte';
  import { getAuth } from '../lib/auth.svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import MediaCarousel from '../components/MediaCarousel.svelte';

  const auth = getAuth();
  let groups: MediaGroup[] = $state([]);
  let favorites: MediaItem[] = $state([]);
  let loading = $state(true);
  let show = $state(false);

  $effect(() => {
    Promise.all([api.getMedia(), api.getFavorites()])
      .then(([m, f]) => { groups = m; favorites = f?.[0]?.items || []; })
      .finally(() => { loading = false; setTimeout(() => show = true, 50); });
  });

  async function removeFav(e: MouseEvent, id: string) { e.stopPropagation(); await api.removeFavorite(id); favorites = favorites.filter(x => x.id !== id); }
</script>

{#if loading}
  <div class="page">
    <div class="spacer"></div>
    <div class="content">
      <div class="skeleton" style="height:16rem;margin-bottom:1.5rem;"></div>
      <div class="grid">
        {#each Array(10) as _}
          <div><div class="skeleton" style="aspect-ratio:16/9;border-radius:0.75rem;"></div><div class="skeleton" style="height:0.75rem;width:75%;margin-top:0.5rem;border-radius:0.5rem;"></div></div>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <div class="page" in:fly={{ y: 20, duration: 400 }}>
    <nav class="navbar">
      <div class="nav-left">
        <button class="brand" onclick={() => push('/')}>Nexus</button>
        <span class="nav-label">Biblioteca</span>
      </div>
      <div class="nav-right">
        <button class="icon-btn" onclick={() => window.dispatchEvent(new CustomEvent('toggle-logs'))} title="Registros">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
        </button>
        <button class="icon-btn" onclick={() => push('/settings')} title="Configuración">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        <button class="icon-btn" onclick={() => { auth.logout(); push('/login'); }} title="Cerrar sesión">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </nav>

    <div class="spacer"></div>

    <div class="content">
      {#if favorites.length > 0}
        <div class="carousel-wrap">
          <MediaCarousel title="Favoritos" items={favorites} onRemoveFavorite={removeFav} />
        </div>
      {/if}

      <div class="section-header" in:fly={{ y: 16, delay: 100, duration: 300 }}>
        <h2>Carpetas Multimedia</h2>
        <span class="count">{groups.length} carpetas</span>
      </div>

      {#if groups.length === 0}
        <div class="empty" in:fade={{ delay: 200 }}>
          <p>Sin carpetas multimedia</p>
          <p>Ve a <a href="#/settings">Configuración</a> para añadir carpetas.</p>
        </div>
      {:else}
        <div class="grid">
          {#each groups as group, i (group.id)}
            {@const cover = group.items[0]}
            <article
              class="card-raised card-item"
              style="animation-delay:{i * 40}ms"
              onclick={() => push(`/folder/${group.id}`)}
              in:fly={{ y: 24, delay: i * 40 + 200, duration: 350, easing: quintOut }}
            >
              <div class="card-img">
                {#if cover}
                  <img src={api.getThumbnailUrl(cover.thumbnail_id || cover.id)} alt="" loading="lazy" onerror={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                {:else}
                  <div class="no-img"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></div>
                {/if}
                <div class="badge"><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>Carpeta</span></div>
                {#if group.scan_progress != null && group.scan_progress < 100}
                  <div class="scan-overlay"><div class="spin"></div><span>Procesando</span><div class="bar"><div style="width:{group.scan_progress}%"></div></div></div>
                {/if}
              </div>
              <h3>{group.folder_path.match(/[^/\\]+(?=[/\\]*$)/)?.[0] || group.folder_path}</h3>
              <span class="meta">{group.video_count} videos · {group.image_count} imágenes</span>
            </article>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .page { min-height: 100vh; min-height: 100dvh; background: #0a0a0b; padding-bottom: 5rem; }
  .navbar { position: fixed; width: 100%; z-index: 50; background: rgba(10,10,11,0.9); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 0.75rem 1rem; padding-top: calc(0.75rem + env(safe-area-inset-top)); display: flex; align-items: center; justify-content: space-between; }
  @media (min-width: 768px) { .navbar { padding: 0.75rem 2rem; } }
  .nav-left { display: flex; align-items: center; gap: 1.5rem; }
  .brand { font-size: 1.75rem; font-weight: 900; cursor: pointer; background: none; border: none; padding: 0; background: linear-gradient(135deg, #E50914, #f43f5e, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em; }
  .nav-label { font-size: 0.625rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.15em; color: #71717a; }
  .nav-right { display: flex; gap: 0.25rem; }
  .icon-btn { background: none; border: none; color: #a1a1aa; cursor: pointer; padding: 0.5rem; border-radius: 0.75rem; }
  .icon-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .spacer { height: 5rem; }
  .content { padding: 1.5rem 1rem; }
  @media (min-width: 768px) { .content { padding: 2rem 2rem; } }
  .carousel-wrap { margin: -1.5rem -1rem 2rem; }
  @media (min-width: 768px) { .carousel-wrap { margin: -2rem -2rem 3rem; } }
  .section-header { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1.5rem; }
  .section-header h2 { font-size: 1.35rem; font-weight: 700; color: #f4f4f5; }
  .count { font-size: 0.675rem; color: #71717a; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
  @media (min-width: 768px) { .grid { grid-template-columns: repeat(5, 1fr); gap: 1.25rem; } }
  .card-item { cursor: pointer; padding: 0.625rem; display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
  .card-img { position: relative; aspect-ratio: 16/9; border-radius: 0.5rem; overflow: hidden; background: #1a1a1d; width: 100%; }
  .card-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.1); }
  .badge { position: absolute; top: 0.375rem; left: 0.375rem; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); border-radius: 0.375rem; padding: 0.125rem 0.375rem; display: flex; align-items: center; gap: 0.25rem; border: 1px solid rgba(255,255,255,0.1); }
  .badge span { font-size: 0.5rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.7); }
  .scan-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .spin { width: 1.5rem; height: 1.5rem; border: 2px solid #E50914; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 0.25rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .scan-overlay span { font-size: 0.625rem; font-weight: 600; margin-bottom: 0.25rem; }
  .bar { width: 70%; background: rgba(255,255,255,0.1); border-radius: 99px; height: 2px; overflow: hidden; }
  .bar div { background: #E50914; height: 100%; transition: width 0.5s; }
  h3 { font-size: 0.8rem; font-weight: 600; color: #d4d4d8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3; }
  .meta { font-size: 0.625rem; color: #71717a; }
  .empty { color: #71717a; text-align: center; padding-top: 5rem; }
  .empty p:first-of-type { font-size: 1.25rem; font-weight: 700; color: #f4f4f5; margin-bottom: 0.5rem; }
  .empty a { color: #E50914; font-weight: 600; text-decoration: none; }
</style>
