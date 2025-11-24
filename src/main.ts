import { createSSRApp } from "vue";
import App from "./App.vue";
import * as Pinia from 'pinia'; // 关键点 1：改用 * as 引入

export function createApp() {
  const app = createSSRApp(App);
  
  // 关键点 2：通过 Pinia 对象来调用 createPinia
  const store = Pinia.createPinia(); 
  app.use(store);
  
  return {
    app,
    // 关键点 3：必须大写 Pinia 并返回 store 实例，这是 UniApp 的硬性要求
    Pinia: store, 
  };
}