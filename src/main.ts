import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './main.css'
import router from './router'
import VConsole from 'vconsole'

new VConsole()

createApp(App).use(router).mount('#app')
