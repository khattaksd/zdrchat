import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update — poll every 30s for changes
registerSW({
  onRegistered(registration) {
    if (registration) {
      setInterval(() => {
        registration.update()
      }, 30_000)
    }
  },
  onOfflineReady() {
    console.log('App ready for offline use')
  },
})

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
