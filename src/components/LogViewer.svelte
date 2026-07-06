<script lang="ts">
  let logs: { id: string; timestamp: Date; level: string; message: string }[] = $state([]);
  let isOpen = $state(false);
  let initialized = false;

  $effect(() => {
    if (initialized) return;
    initialized = true;

    const clientId = Math.random().toString(36).substring(2, 9);
    const token = localStorage.getItem('media_token');

    const handleToggle = () => { isOpen = !isOpen; };
    window.addEventListener('toggle-logs', handleToggle);

    const fetchLogs = async () => {
      if (!token) return;
      try {
        const res = await fetch(`/api/logs?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          logs = data.map((d: any) => ({
            id: d.id,
            timestamp: new Date(d.timestamp),
            level: d.level,
            message: `[${d.client_id || '?'}] ${d.message}`,
          }));
        }
      } catch {}
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('toggle-logs', handleToggle);
    };
  });

  function clearLogs() { logs = []; }
</script>

{#if isOpen}
  <div class="viewer">
    <div class="header">
      <div class="header-left">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
        <h3>Registros</h3>
        <span class="count">{logs.length} eventos</span>
      </div>
      <div class="header-right">
        <button onclick={clearLogs}>Limpiar</button>
        <button onclick={() => isOpen = false}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    </div>
    <div class="body">
      {#if logs.length === 0}
        <div class="empty">Esperando eventos...</div>
      {:else}
        {#each logs as log (log.id)}
          <div class="entry">
            <span class="time">{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span class="level {log.level}">{log.level}</span>
            <span class="msg">{log.message}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  .viewer {
    position: fixed; bottom: 0; left: 0; right: 0; height: 60vh; height: 60dvh;
    padding-bottom: env(safe-area-inset-bottom);
    background: rgba(0,0,0,0.95); border-top: 1px solid rgba(255,255,255,0.2);
    z-index: 9999; display: flex; flex-direction: column;
    backdrop-filter: blur(16px); font-family: monospace; font-size: 0.875rem;
  }
  .header { display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.5); }
  .header-left { display: flex; align-items: center; gap: 0.5rem; }
  .icon { color: #9ca3af; }
  h3 { color: #fff; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }
  .count { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 10px; }
  .header-right { display: flex; align-items: center; gap: 1rem; }
  .header-right button { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 0.75rem; text-transform: uppercase; }
  .header-right button:hover { color: #fff; }
  .body { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .empty { color: #6b7280; font-style: italic; display: flex; align-items: center; justify-content: center; height: 100%; }
  .entry { display: flex; align-items: flex-start; gap: 1rem; padding: 0.25rem; border-radius: 0.25rem; }
  .entry:hover { background: rgba(255,255,255,0.05); }
  .time { color: #6b7280; font-size: 0.75rem; flex-shrink: 0; white-space: nowrap; }
  .level { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; flex-shrink: 0; width: 3rem; }
  .level.info { color: #60a5fa; } .level.warn { color: #facc15; } .level.error { color: #ef4444; }
  .msg { color: #d1d5db; word-break: break-word; flex: 1; }
</style>
