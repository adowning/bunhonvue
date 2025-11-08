import { AppRouteRecord } from "@/types/router";
import type { App } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { RouteLocationNormalized, RouteRecordRaw } from "vue-router";

export type AppRouteRecordRaw = RouteRecordRaw & {
  hidden?: boolean;
};

export const staticRoutes: AppRouteRecordRaw[] = [
  // 不需要登录就能访问的路由示例
  // {
  //   path: '/welcome',
  //   name: 'WelcomeStatic',
  //   component: () => import('@views/dashboard/console/index.vue'),
  //   meta: { title: 'menus.dashboard.title' }
  // },
  {
    path: "/auth/login",
    name: "Login",
    component: () => import("@views/auth/login/index.vue"),
    meta: { title: "menus.login.title", isHideTab: true },
  },
  //   {
  //     path: '/auth/register',
  //     name: 'Register',
  //     component: () => import('@views/auth/register/index.vue'),
  //     meta: { title: 'menus.register.title', isHideTab: true }
  //   },
  //   {
  //     path: '/auth/forget-password',
  //     name: 'ForgetPassword',
  //     component: () => import('@views/auth/forget-password/index.vue'),
  //     meta: { title: 'menus.forgetPassword.title', isHideTab: true }
  //   },
  //   {
  //     path: '/403',
  //     name: 'Exception403',
  //     component: () => import('@views/exception/403/index.vue'),
  //     meta: { title: '403', isHideTab: true }
  //   },
  //   {
  //     path: '/:pathMatch(.*)*',
  //     name: 'Exception404',
  //     component: () => import('@views/exception/404/index.vue'),
  //     meta: { title: '404', isHideTab: true }
  //   },
  //   {
  //     path: '/500',
  //     name: 'Exception500',
  //     component: () => import('@views/exception/500/index.vue'),
  //     meta: { title: '500', isHideTab: true }
  //   },
  //   {
  //     path: '/outside',
  //     component: () => import('@views/index/index.vue'),
  //     name: 'Outside',
  //     meta: { title: 'menus.outside.title' },
  //     children: [
  //       // iframe 内嵌页面
  //       {
  //         path: '/outside/iframe/:path',
  //         name: 'Iframe',
  //         component: () => import('@/views/outside/Iframe.vue'),
  //         meta: { title: 'iframe' }
  //       }
  //     ]
  //   }
];

export const dashboardRoutes: AppRouteRecord = {
  name: "Dashboard",
  path: "",
  component: "/console",
  meta: {
    title: "Dashboard",
    icon: "ri:pie-chart-line",
    // roles: ['R_SUPER', 'R_ADMIN']
    roles: ["USER",'user', 'admin', "OPERATOR"],
  },
  // children: [
  //   {
  //     path: 'console',
  //     name: 'Console',
  //     component: '/dashboard/console',
  //     meta: {
  //       title: 'menus.dashboard.console',
  //       keepAlive: false,
  //       fixedTab: true
  //     }
  //   },
  //   {
  //     path: 'analysis',
  //     name: 'Analysis',
  //     component: '/dashboard/analysis',
  //     meta: {
  //       title: 'menus.dashboard.analysis',
  //       keepAlive: false
  //     }
  //   },
  //   {
  //     path: 'ecommerce',
  //     name: 'Ecommerce',
  //     component: '/dashboard/ecommerce',
  //     meta: {
  //       title: 'menus.dashboard.ecommerce',
  //       keepAlive: false
  //     }
  //   }
  // ]
};
export const router = createRouter({
  history: createWebHashHistory(),
  routes: staticRoutes, // 静态路由
});

// 初始化路由
export function initRouter(app: App<Element>): void {
  //   configureNProgress() // 顶部进度条
  //   setupBeforeEachGuard(router) // 路由前置守卫
  //   setupAfterEachGuard(router) // 路由后置守卫
  app.use(router);
}

// 主页路径，默认使用菜单第一个有效路径，配置后使用此路径
export const HOME_PAGE_PATH = "";
