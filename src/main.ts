import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update
registerSW({
  onOfflineReady() {
    console.log('ZDR Chat ready for offline use');
  },
})

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
