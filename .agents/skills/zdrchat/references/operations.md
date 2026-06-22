# Common Operations

## Add a new model to the model picker

1. Open `src/lib/api/types.ts`
2. Find the `MODEL_BUCKETS` constant (array of category objects)
3. Add the model object to the appropriate category's `models` array:
   ```ts
   {
     id: 'openai/gpt-4o-mini',
     name: 'GPT-4o Mini',
     provider: 'OpenAI',
     context: 128000,
     pricing: { prompt: 0.15, completion: 0.60 }, // per 1M tokens
     capabilities: ['text', 'vision'],
   }
   ```
4. If a new category is needed, add a new entry to `MODEL_BUCKETS`:
   ```ts
   { category: 'My Models', icon: 'star', models: [...] }
   ```
5. `ModelPicker.svelte` will pick up new categories as tabs automatically
6. No changes needed to the API client — OpenRouter routes model IDs automatically

## Add a new theme

1. Open `src/app.css`
2. Add a new `[data-theme="your-theme"]` block with CSS custom properties:
   ```css
   [data-theme="ocean"] {
     --color-bg: #0f172a;
     --color-surface: #1e293b;
     --color-primary: #38bdf8;
     --color-text: #e2e8f0;
     /* ... copy existing theme structure and override colors */
   }
   ```
3. Open `src/lib/store/settings.ts`
4. Add the theme to the themes array:
   ```ts
   { id: 'ocean', name: 'Ocean', icon: '🌊' }
   ```
5. `App.svelte` applies `data-theme` dynamically — no component changes needed

## Change density mode

Density modes are defined in `src/app.css` as `[data-density="comfortable"]`, `[data-density="compact"]`, `[data-density="cozy"]`.

1. Adjust spacing variables under each density selector
2. Update the density options list in `settings.ts` if adding/removing modes
3. `App.svelte` applies `data-density` dynamically

## Modify PWA / service worker behavior

- PWA config lives in `vite.config.ts` → `VitePWA({...})`
- Configure: app name, icons, offline strategy, cache rules
- Service worker is **auto-generated** by Workbox — do not hand-write `sw.ts`
- To change caching strategy: modify `workbox` options inside `VitePWA()`
- Icon assets live in `public/` — regenerate all sizes with a PWA asset generator when updating the logo

## Change keyboard shortcuts

Keyboard shortcuts are handled in `src/App.svelte` via `onkeydown` event listeners on the document. Look for the `handleKeydown` function or inline `$effect` with keyboard bindings.

Common shortcuts:
- `Ctrl/Cmd + K` — open command palette or model picker
- `Ctrl/Cmd + ,` — open settings
- `Escape` — close panels / stop streaming
- `Enter` — send message (Shift+Enter for newline)

## Add a new store

- For **component-local** state → use Svelte 5 `$state()`
- For **cross-component** state → add to an existing file in `src/lib/store/` or create a new one:
  ```ts
  import { writable } from 'svelte/store';
  export const myStore = writable(initialValue);
  ```
- If the store needs persistence, integrate with Dexie in `src/lib/db/dexie.ts`
- Avoid creating many tiny stores — group related state by feature