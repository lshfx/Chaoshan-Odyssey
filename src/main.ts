import { createSSRApp } from 'vue'
import App from './App.vue'
import * as Pinia from 'pinia'
// 👇 引入刚才定义的常量
import { IMG_HOST } from '@/config/constants'

export function createApp() {
  const app = createSSRApp(App)

  // 👇 使用常量
  app.config.globalProperties.$imgHost = IMG_HOST

  const store = Pinia.createPinia()
  app.use(store)

  return {
    app,
    Pinia: store,
  }
}
