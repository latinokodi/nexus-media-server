<script lang="ts">
  import { api, type ServerSettings } from '../lib/api';
  import { getAuth } from '../lib/auth.svelte';
  import { push } from '../lib/router.svelte';

  const auth = getAuth();
  let skipThreshold = $state(10);
  let mediaFolders: string[] = $state([]);
  let username = $state('');
  let password = $state('');
  let newFolder = $state('');
  let saving = $state(false);
  let pickerOpen = $state(false);
  let pickerPath = $state('');
  let pickerDirs: { name: string; path: string }[] = $state([]);
  let message: { text: string; type: string } | null = $state(null);

  $effect(() => {
    api.getSettings().then(d => {
      skipThreshold = d.skip_threshold_seconds;
      mediaFolders = d.media_folders || [];
      username = d.admin_username || '';
      password = d.admin_password || '';
    });
  });

  function showMsg(text: string, type: string) {
    message = { text, type };
    setTimeout(() => message = null, 3000);
  }

  async function save(updatedFolders?: string[]) {
    saving = true;
    try {
      await api.updateSettings({
        skip_threshold_seconds: skipThreshold,
        media_folders: updatedFolders || mediaFolders,
        admin_username: username || null,
        admin_password: password || null,
      });
      showMsg('Configuración guardada', 'success');
    } catch {
      showMsg('Error: Servidor no disponible', 'error');
    }
    saving = false;
  }

  function addFolder() {
    if (newFolder.trim() && !mediaFolders.includes(newFolder.trim())) {
      mediaFolders = [...mediaFolders, newFolder.trim()];
      newFolder = '';
      save(mediaFolders);
    }
  }

  function removeFolder(f: string) {
    mediaFolders = mediaFolders.filter(x => x !== f);
    save(mediaFolders);
  }

  async function fetchDirs(path: string) {
    try {
      pickerDirs = await api.listDirectories(path);
      pickerPath = path;
    } catch { showMsg('Error al listar directorios', 'error'); }
  }

  function selectFolder() {
    if (pickerPath && !mediaFolders.includes(pickerPath)) {
      mediaFolders = [...mediaFolders, pickerPath];
    }
    pickerOpen = false;
  }
</script>

<div class="page">
  {#if message}
    <div class="toast {message.type}">{message.text}</div>
  {/if}

  {#if pickerOpen}
    <div class="modal-overlay" role="dialog" aria-modal="true" onclick={() => pickerOpen = false} onkeydown={(e) => e.key === 'Escape' && (pickerOpen = false)}>
      <div class="modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
        <h2>Seleccionar Carpeta</h2>
        <div class="picker-nav">
          <button onclick={() => { const p = pickerPath.split(/[\\/]/).filter(Boolean); p.pop(); fetchDirs(p.join('\\')); }} disabled={!pickerPath}>Arriba</button>
          <input type="text" value={pickerPath || 'Raíz'} readonly />
        </div>
        <div class="picker-list">
          {#each pickerDirs as dir}
            <div class="picker-item" role="button" tabindex="0" onclick={() => fetchDirs(dir.path)} onkeydown={(e) => e.key === 'Enter' && fetchDirs(dir.path)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#E50914"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              {dir.name}
            </div>
          {/each}
          {#if pickerDirs.length === 0}<div class="empty-picker">Vacío</div>{/if}
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" onclick={() => pickerOpen = false}>Cancelar</button>
          <button class="btn-primary" onclick={selectFolder} disabled={!pickerPath}>Seleccionar</button>
        </div>
      </div>
    </div>
  {/if}

  <div class="header">
    <div class="header-left">
      <button class="back-btn" onclick={() => push('/')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        Inicio
      </button>
      <h1>Configuración</h1>
    </div>
    <button class="logout-btn" onclick={() => { auth.logout(); push('/login'); }}>Cerrar Sesión</button>
  </div>

  <div class="card">
    <div class="section">
      <label>Segundos de Salto</label>
      <p>Tiempo para avanzar/retroceder en el reproductor.</p>
      <div class="row">
        <input type="number" bind:value={skipThreshold} />
        <button class="btn-ghost" onclick={() => save()}>{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
    <hr />
    <div class="section">
      <label>Carpetas Multimedia</label>
      <p>Rutas absolutas a tus archivos multimedia.</p>
      {#each mediaFolders as folder}
        <div class="folder-row"><span>{folder}</span><button class="btn-danger" onclick={() => removeFolder(folder)}>Eliminar</button></div>
      {/each}
      <div class="row">
        <input type="text" placeholder="Ej: C:\Peliculas" bind:value={newFolder} onkeydown={(e) => e.key === 'Enter' && addFolder()} />
        <button class="btn-ghost" onclick={addFolder}>Añadir</button>
        <button class="btn-primary" onclick={() => { pickerOpen = true; fetchDirs(''); }}>Explorar</button>
      </div>
    </div>
    <hr />
    <div class="section">
      <label>Credenciales de Admin</label>
      <p>Cambia usuario/contraseña. Deja vacío para desactivar autenticación.</p>
      <div class="row">
        <input type="text" placeholder="Usuario" bind:value={username} />
        <input type="password" placeholder="Contraseña" bind:value={password} />
      </div>
      <button class="btn-ghost full" onclick={() => { save(mediaFolders); setTimeout(() => { auth.logout(); push('/login'); }, 500); }}>Actualizar y Re-ingresar</button>
    </div>
  </div>
</div>

<style>
  .page { min-height: 100vh; min-height: 100dvh; background: #141414; padding-top: 8rem; padding-left: 1rem; padding-right: 1rem; padding-bottom: 3rem; position: relative; }
  @media (min-width: 768px) { .page { padding-left: 3rem; padding-right: 3rem; } }
  .toast { position: fixed; top: 1rem; right: 1rem; z-index: 50; padding: 0.75rem 1.5rem; border-radius: 0.5rem; color: #fff; font-weight: 700; }
  .toast.success { background: #16a34a; }
  .toast.error { background: #dc2626; }
  .modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); }
  .modal { background: #18181b; border: 1px solid rgba(255,255,255,0.2); padding: 1.5rem; border-radius: 0.5rem; width: 100%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column; }
  .picker-nav { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
  .picker-nav input { background: #000; border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 0.25rem; padding: 0.25rem 0.75rem; flex: 1; }
  .picker-list { flex: 1; overflow-y: auto; background: #000; border: 1px solid rgba(255,255,255,0.1); border-radius: 0.25rem; padding: 0.5rem; min-height: 300px; }
  .picker-item { padding: 0.5rem 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; border-radius: 0.25rem; }
  .picker-item:hover { background: rgba(255,255,255,0.1); }
  .empty-picker { color: #6b7280; text-align: center; padding: 1rem; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
  .header { display: flex; justify-content: space-between; align-items: center; max-width: 42rem; margin-bottom: 2rem; }
  .header-left { display: flex; align-items: center; gap: 1rem; }
  .header h1 { font-size: 1.875rem; font-weight: 700; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 1rem; }
  .back-btn { display: flex; align-items: center; gap: 0.25rem; background: none; border: none; color: #9ca3af; cursor: pointer; }
  .back-btn:hover { color: #fff; }
  .logout-btn { background: none; border: none; color: #9ca3af; cursor: pointer; }
  .logout-btn:hover { color: #fff; }
  .card { background: #18181b; padding: 2rem; border-radius: 0.5rem; max-width: 42rem; border: 1px solid rgba(255,255,255,0.1); }
  .section { margin-bottom: 2rem; }
  .section label { display: block; font-size: 0.875rem; font-weight: 500; color: #d1d5db; margin-bottom: 0.5rem; }
  .section p { font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem; }
  .row { display: flex; gap: 1rem; }
  .row input { background: #000; border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 0.375rem; padding: 0.5rem 1rem; width: 100%; }
  .row input:focus { border-color: #E50914; outline: none; }
  hr { border-color: rgba(255,255,255,0.1); margin: 2rem 0; }
  .folder-row { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 0.375rem; margin-bottom: 0.5rem; font-size: 0.875rem; }
  .folder-row span { color: #d1d5db; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.5rem; }
  .btn-ghost { background: rgba(255,255,255,0.1); color: #fff; border: none; padding: 0.5rem 1.5rem; border-radius: 0.375rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
  .btn-ghost:disabled { opacity: 0.5; }
  .btn-primary { background: #E50914; color: #fff; border: none; padding: 0.5rem 1.5rem; border-radius: 0.375rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .btn-primary:hover:not(:disabled) { background: #c40710; }
  .btn-primary:disabled { opacity: 0.5; }
  .btn-danger { background: none; border: none; color: #ef4444; font-weight: 700; cursor: pointer; }
  .btn-danger:hover { color: #f87171; }
  .full { width: 100%; }
</style>
