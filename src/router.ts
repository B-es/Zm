import { useUserStore } from "@/entities/user/user.store";
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./entities/auth/auth.store";

const ConnectView = () => import("@/views/ConnectView.vue");
const MainView = () => import("@/views/MainView.vue");
const AuthView = () => import("@/views/AuthView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");

const routes = [
  {
    path: "/",
    name: "connect",
    component: ConnectView,
    meta: {
      title: "Zm - Соединение",
      requiresAuth: true,
    },
  },
  {
    path: "/main",
    name: "main",
    component: MainView,
    meta: {
      title: "Главная",
      requiresAuth: true,
    },
  },
  {
    path: "/auth",
    name: "auth",
    component: AuthView,
    meta: {
      title: "Аутентиафикация",
      requiresAuth: false,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
    meta: {
      title: "Страница не найдена",
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

// Глобальные хуки навигации
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  console.log(`[Router Guard] ${from.path} → ${to.path}`, {
    query: to.query,
    hash: to.hash,
    isAuth: authStore.isAuth,
  });

  // Установка заголовка страницы
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  // Если есть код авторизации в URL (OAuth callback) или пользователь не авторизован
  // Загружаем сессию и проверяем
  if (!authStore.isAuth) {
    console.log("[Router Guard] Not authenticated yet, loading session...");
    await authStore.loadSession();

    console.log("[Router Guard] Session loaded, isAuth =", authStore.isAuth);

    // После загрузки сессии
    if (authStore.isAuth) {
      // Если пользователь вошёл, редиректим на connect
      console.log("[Router Guard] User authenticated, redirecting to connect");
      next({ name: "connect" });
      return;
    } else if (to.query.code) {
      // Если код был, но сессия не загрузилась - ошибка
      console.error(
        "[Router Guard] OAuth code present but session failed to load",
      );
      next();
      return;
    }
  }

  // Проверка доступа к защищённым маршрутам
  if (to.meta.requiresAuth) {
    if (!authStore.isAuth) {
      console.log("[Router Guard] Not authenticated, redirecting to auth");
      next({ name: "auth" });
      return;
    }
    console.log("[Router Guard] Authenticated, allowing access");
  }

  // Если пользователь на странице авторизации и уже авторизован — редиректим на connect
  if (to.name === "auth" && authStore.isAuth) {
    console.log(
      "[Router Guard] User is on auth page and logged in, redirecting to connect",
    );
    next({ name: "connect" });
    return;
  }

  next();
});

export default router;
