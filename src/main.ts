import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./entities/auth/auth.store";

import "./index.css";

const app = createApp(App);

import { Tabs, Tab } from "vue3-tabs-component";
import Button from "./components/Button.vue";
import Input from "./components/Input.vue";

app.component("tabs", Tabs).component("tab", Tab);
app.component("Button", Button).component("Input", Input);

const pinia = createPinia();
app.use(pinia);
app.use(router);

// Подписываемся на изменение auth-состояния (OAuth, signOut и т.д.)
const authStore = useAuthStore();
authStore.initAuthListener();

// Загружаем текущую сессию при старте
await authStore.loadSession();

app.mount("#app");
