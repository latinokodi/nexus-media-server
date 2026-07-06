<script lang="ts">
  import { fly } from 'svelte/transition';
  import { getAuth } from './lib/auth.svelte';
  import { useRoute } from './lib/router.svelte';
  import Login from './routes/Login.svelte';
  import Home from './routes/Home.svelte';
  import Settings from './routes/Settings.svelte';
  import Folder from './routes/Folder.svelte';
  import Player from './routes/Player.svelte';
  import PlaylistPlayer from './routes/PlaylistPlayer.svelte';
  import LogViewer from './components/LogViewer.svelte';

  const auth = getAuth();
  const route = useRoute();

  // Only render protected routes if authenticated
  function getComponent(): any {
    const p = route.path;

    if (p === '/login' || p.startsWith('/login')) return Login;

    if (!auth.isAuthenticated) {
      window.location.hash = '#/login';
      return Login;
    }

    if (p === '/' || p === '') return Home;
    if (p === '/settings') return Settings;
    if (p.startsWith('/folder/')) return Folder;
    if (p.startsWith('/play-folder/')) return PlaylistPlayer;
    if (p.startsWith('/play/')) return Player;

    return Home;
  }

  const Component = $derived(getComponent());
</script>

<main class="app" in:fly={{ y: 12, duration: 300 }}>
  <Component />
  <LogViewer />
</main>

<style>
  :global(body) {
    margin: 0; padding: 0;
    padding-bottom: env(safe-area-inset-bottom);
    background: #0a0a0b;
    color: #f4f4f5;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -webkit-overflow-scrolling: touch;
  }
  :global(::-webkit-scrollbar) { width: 6px; }
  :global(::-webkit-scrollbar-track) { background: transparent; }
  :global(::-webkit-scrollbar-thumb) { background: rgba(255,255,255,0.1); border-radius: 3px; }
  :global(.hide-scrollbar::-webkit-scrollbar) { display: none; }
  :global(.hide-scrollbar) { scrollbar-width: none; }
  :global(.btn-tactile) { transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1); }
  :global(.btn-tactile:active) { transform: scale(0.96); }
  :global(.card-raised) {
    background: #141416; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 0.75rem;
    transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
  }
  :global(.card-raised:hover) {
    border-color: rgba(255,255,255,0.1);
    box-shadow: 0 0 30px rgba(229,9,20,0.1);
    transform: translateY(-2px);
  }
  @keyframes shimmer {
    0% { background-position: -300% 0; }
    100% { background-position: 300% 0; }
  }
  :global(.skeleton) {
    background: linear-gradient(105deg, #1a1a1d 25%, #252528 40%, #1a1a1d 55%);
    background-size: 300% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    border-radius: 0.75rem;
  }
</style>
