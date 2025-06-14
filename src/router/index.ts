import { createRouter, createMemoryHistory } from 'vue-router'
import baseLayout from '../layout/baseLayout.vue'

const routes = [
  {
    path: '/',
    component: baseLayout,
    redirect: '/home',
    children: [
      {
        path: '/home',
        component: () => import('../pages/Home/index.vue'),
        meta: {
          title: '首页-使用window.tron'
        }
      },
      {
        path: '/secondary',
        component: () => import('../pages/Secondary/index.vue'),
        meta: {
          title: '基于@tronweb3/tronwallet-adapter-tronlink'
        }
      }
    ]
  }
]

export default createRouter({
  history: createMemoryHistory(),
  routes
})

