import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './main.css'
import router from './router'
import VConsole from 'vconsole'
import './global.d.ts'
import { Icon } from 'vant';

new VConsole()

createApp(App).use(router).use(Icon).mount('#app')
