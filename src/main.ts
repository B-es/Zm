import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './index.css'

const app = createApp(App)

import {Tabs, Tab} from 'vue3-tabs-component';

app.component('tabs', Tabs).component('tab', Tab)

app.use(createPinia())
app.use(router)

app.mount('#app')
