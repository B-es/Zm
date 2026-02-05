import { useAuth } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'

const ConnectView = () => import('@/views/ConnectView.vue')
const MainView = () => import('@/views/MainView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

const routes = [
  {
    path: '/',
    name: 'connect',
    component: ConnectView,
    meta: {
      title: 'Zm - Соединение',
      requiresAuth: false
    }
  },
  {
    path: '/main',
    name: 'main',
    component: MainView,
    meta: {
      title: 'Главная',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: 'Страница не найдена'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

// Глобальные хуки навигации
router.beforeEach((to, from, next) => {
  // Установка заголовка страницы
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  //Проверка доступа к комнате
  if (to.meta.requiresAuth) {
    const authStore = useAuth()

    if (!authStore.isAuth) {
      // Если не в комнате, перенаправляем на домашнюю
     next({name: '/'})
      return
    }
  }
  
  next()
})

export default router
