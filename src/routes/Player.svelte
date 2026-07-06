<script lang="ts">
  import { api, type MediaContext } from '../lib/api';
  import { push, useRoute } from '../lib/router.svelte';

  const route = useRoute();
  let propId = $derived(route.params.id);
  let activeId = $state(propId);
  let container: HTMLDivElement;
  let videoEl: HTMLVideoElement;
  let initialProgress = $state(0);
  let showControls = $state(false);
  let ctx: MediaContext = $state({});
  let showInfo = $state(false);
  let stats = $state({ resolution: '', droppedFrames: 0, totalFrames: 0, bitrate: 'N/A' });

  // Poll video stats when info panel is open (matches original Next.js behavior)
  $effect(() => {
    if (!showInfo || !videoEl) return;
    const interval = setInterval(() => {
      const v = videoEl;
      if (!v) return;
      const q = (v as any).getVideoPlaybackQuality?.();
      stats = {
        resolution: `${v.videoWidth}x${v.videoHeight}`,
        droppedFrames: q?.droppedVideoFrames ?? 0,
        totalFrames: q?.totalVideoFrames ?? 0,
        bitrate: (v as any).webkitVideoDecodedByteCount
          ? `${Math.round(((v as any).webkitVideoDecodedByteCount * 8) / Math.max(v.currentTime, 1) / 1000)} kbps`
          : 'N/A',
      };
    }, 500);
    return () => clearInterval(interval);
  });
  let skipThreshold = $state(10);

  let touchStartX: number | null = $state(null);
  let touchEndX: number | null = $state(null);

  const titleLower = $derived(ctx.current_title?.toLowerCase() || '');
  const isImage = $derived(/\.(jpg|jpeg|png|webp|gif|bmp)$/.test(titleLower));
  const streamUrl = $derived(api.getStreamUrl(activeId));

  $effect(() => {
    api.getSettings().then(d => skipThreshold = d.skip_threshold_seconds);
    api.getMediaContext(activeId).then(setCtx);
    api.getProgress(activeId).then(d => initialProgress = d.progress || 0);
  });

  // Periodic progress save
  $effect(() => {
    const interval = setInterval(() => {
      if (videoEl && !videoEl.paused && videoEl.currentTime > 0) {
        api.updateProgress(activeId, videoEl.currentTime, videoEl.duration);
      }
    }, 10000);
    return () => clearInterval(interval);
  });

  function navigateTo(newId: string) {
    activeId = newId;
    initialProgress = 0;
    window.history.replaceState(null, '', `#/play/${newId}`);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) container?.requestFullscreen();
    else document.exitFullscreen();
  }

  function onTouchStart(e: TouchEvent) { touchStartX = e.targetTouches[0].clientX; touchEndX = null; }
  function onTouchMove(e: TouchEvent) { touchEndX = e.targetTouches[0].clientX; }
  function onTouchEnd() {
    if (touchStartX == null || touchEndX == null) return;
    const dist = touchStartX - touchEndX;
    if (Math.abs(dist) < 50) return;
    if (dist > 0 && ctx.next_id) navigateTo(ctx.next_id);
    if (dist < 0 && ctx.prev_id) navigateTo(ctx.prev_id);
  }
</script>

<svelte:window onkeydown={(e) => {
  if ((e.key === 'n' || (e.key === 'ArrowRight' && e.shiftKey)) && ctx.next_id) navigateTo(ctx.next_id);
  if ((e.key === 'p' || (e.key === 'ArrowLeft' && e.shiftKey)) && ctx.prev_id) navigateTo(ctx.prev_id);
}} />

<div
  bind:this={container}
  class="player"
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
  onclick={() => showControls = !showControls}
>
  <button class="top-btn left" onclick={() => ctx.parent_id ? push(`/folder/${ctx.parent_id}`) : push('/')}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
  </button>
  <button class="top-btn left2" onclick={() => push('/')}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </button>
  {#if !isImage}
    <button class="top-btn right" onclick={(e) => { e.stopPropagation(); showInfo = !showInfo; }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    </button>
  {/if}

  {#if showInfo && !isImage}
    <div class="info-panel">
      <h3>Estadísticas</h3>
      <div class="info-grid">
        <span>Resolución:</span><span>{stats.resolution}</span>
        <span>Bitrate:</span><span>{stats.bitrate}</span>
        <span>Perdidos:</span><span>{stats.droppedFrames}</span>
        <span>Total:</span><span>{stats.totalFrames}</span>
      </div>
    </div>
  {/if}

  {#if isImage}
    <img src={streamUrl} class="media" alt={ctx.current_title || ''} ondblclick={toggleFullscreen} />
  {:else}
    <video
      bind:this={videoEl}
      src={streamUrl}
      class="media"
      autoplay
      controls
      disablepictureinpicture
      onloadedmetadata={(e) => {
        if (initialProgress > 0 && e.currentTarget.duration > initialProgress)
          e.currentTarget.currentTime = initialProgress;
        e.currentTarget.play();
      }}
      ondblclick={toggleFullscreen}
      onended={() => ctx.next_id && navigateTo(ctx.next_id)}
    ></video>
  {/if}

  {#if ctx.prev_id}
    <button class="side-btn left" onclick={(e) => { e.stopPropagation(); navigateTo(ctx.prev_id!); }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
  {/if}
  {#if ctx.next_id}
    <button class="side-btn right" onclick={(e) => { e.stopPropagation(); navigateTo(ctx.next_id!); }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </button>
  {/if}
</div>

<style>
  .player {
    height: 100vh; height: 100dvh; width: 100vw; background: #000; position: relative;
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .media { width: 100%; height: 100%; object-fit: contain; cursor: pointer; }
  .top-btn {
    position: absolute; top: calc(2rem + env(safe-area-inset-top)); z-index: 50; color: #fff;
    background: rgba(0,0,0,0.5); border: none; padding: 0.75rem;
    border-radius: 9999px; cursor: pointer; transition: opacity 0.15s;
  }
  .top-btn:hover { background: rgba(255,255,255,0.2); }
  .top-btn.left { left: 2rem; }
  .top-btn.left2 { left: 6rem; top: calc(2rem + env(safe-area-inset-top)); position: absolute; z-index: 50; color: #fff; background: rgba(0,0,0,0.5); border: none; padding: 0.75rem; border-radius: 9999px; cursor: pointer; }
  .top-btn.right { right: 2rem; }
  .info-panel {
    position: absolute; top: calc(6rem + env(safe-area-inset-top)); right: 2rem; max-width: calc(100vw - 4rem);
    background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.15); padding: 1rem 1.25rem;
    border-radius: 0.75rem; z-index: 50; color: #fff; font-size: 0.8125rem; font-family: monospace;
  }
  .info-panel h3 { color: #E50914; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; font-size: 0.75rem; }
  .info-grid { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.5rem; }
  .info-grid span:first-child { color: #9ca3af; }
  .info-grid span:last-child { text-align: right; }
  .side-btn {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 50;
    background: rgba(0,0,0,0.4); color: #fff; border: none; padding: 0.75rem;
    border-radius: 9999px; cursor: pointer;
  }
  @media (min-width: 768px) { .side-btn { padding: 1rem; } }
  .side-btn:hover { background: rgba(229,9,20,0.8); }
  .side-btn.left { left: 0.5rem; }
  .side-btn.right { right: 0.5rem; }
  @media (min-width: 768px) { .side-btn.left { left: 1.5rem; } .side-btn.right { right: 1.5rem; } }
</style>
