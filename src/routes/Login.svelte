<script lang="ts">
  import { getAuth } from '../lib/auth.svelte';
  import { api } from '../lib/api';
  import { push } from '../lib/router.svelte';
  import { fly } from 'svelte/transition';

  const auth = getAuth();
  let username = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      const token = await api.login(username, password);
      auth.login(token);
      push('/');
    } catch {
      error = 'Usuario o contraseña incorrectos';
    } finally {
      loading = false;
    }
  }
</script>

<div class="page" in:fly={{ y: 20, duration: 400 }}>
  <div class="glow"></div>
  <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop" alt="" class="bg-img" />

  <div class="card">
    <h1 class="logo">Nexus</h1>
    <p class="subtitle">Media Server</p>

    {#if error}
      <div class="err" role="alert">{error}</div>
    {/if}

    <form onsubmit={handleSubmit}>
      <input type="text" placeholder="Usuario" bind:value={username} autofocus required />
      <input type="password" placeholder="Contraseña" bind:value={password} required />
      <button type="submit" class="btn-tactile" disabled={loading}>
        {loading ? 'Verificando...' : 'Iniciar Sesión'}
      </button>
    </form>

    <p class="hint">Usuario: admin · Contraseña: Guarruko</p>
  </div>
</div>

<style>
  .page { min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center; position: relative; background: #0a0a0b; overflow: hidden; }
  .glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(229,9,20,0.25) 0%, transparent 70%); opacity: 0.12; }
  .bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.05; }
  .card { position: relative; z-index: 10; background: #141416; border: 1px solid rgba(255,255,255,0.06); border-radius: 1rem; padding: 2.5rem 2rem; max-width: 24rem; width: calc(100% - 2rem); backdrop-filter: blur(12px); }
  .logo { font-size: 3.5rem; font-weight: 900; text-align: center; background: linear-gradient(135deg, #E50914, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.03em; margin-bottom: 0.25rem; }
  .subtitle { text-align: center; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; margin-bottom: 2rem; }
  .err { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; padding: 0.75rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 500; margin-bottom: 1.25rem; }
  form { display: flex; flex-direction: column; gap: 1rem; }
  input { width: 100%; background: #0a0a0b; border: 1px solid rgba(255,255,255,0.08); border-radius: 0.75rem; padding: 0.875rem 1rem; font-size: 0.875rem; color: #f4f4f5; outline: none; box-sizing: border-box; }
  input::placeholder { color: #71717a; }
  input:focus { border-color: rgba(229,9,20,0.5); box-shadow: 0 0 0 1px rgba(229,9,20,0.2); }
  button { width: 100%; background: #E50914; color: #fff; font-weight: 700; font-size: 0.875rem; padding: 0.875rem; border: none; border-radius: 0.75rem; cursor: pointer; }
  button:hover:not(:disabled) { background: #dc2626; }
  button:disabled { opacity: 0.5; cursor: default; }
  .hint { text-align: center; font-size: 0.625rem; color: #52525b; margin-top: 1.5rem; }
</style>
