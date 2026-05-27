import { useUserStore } from "@/entities/user/user.store";
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/entities/auth/auth.store";

const RoomView = () => import("@/views/RoomView.vue");
const MainView = () => import("@/views/MainView.vue");
const AuthView = () => import("@/views/AuthView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");

const routes = [
  {
    path: "/",
    name: "connect",
    component: RoomView,
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
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore();
  //return;
  // Установка заголовка страницы
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
  // Проверка доступа к защищённым маршрутам
  if (to.meta.requiresAuth) {
    if (!authStore.isAuth) {
      return { name: "auth" };
    }
  }

  // Если пользователь на странице авторизации и уже авторизован — редиректим на connect
  if (to.name === "auth" && authStore.isAuth) {
    return { name: "connect" };
  }

  return;
});

export default router;
