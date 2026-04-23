import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  scrollBehavior() {
    return { x: 0, y: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
      meta: {
        pageTitle: 'Home',
        breadcrumb: [
          {
            text: 'Home',
            active: true,
          },
        ],
      },
  },
      {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: {
        layout: 'full',
      },
    },
    {
      path: '/error-404',
      name: 'error-404',
      component: () => import('@/views/error/Error404.vue'),
      meta: {
        layout: 'full',
      },
    },
    {
      path: '*',
      redirect: 'error-404',
    },
    {
    path: 'Dashborad/',      
    name: 'Dashborad',     
    component: () => import('@/views/Dashborad.vue'), 
    },
    {
    path: 'test/',      
    name: 'test',     
    component: () => import('@/views/test.vue'), 
    },
        {
    path: 'Chart/',      
    name: 'Chart',     
    component: () => import('@/views/Chart.vue'), 
    },
    {
    path: 'test/',      
    name: 'test',     
    component: () => import('@/views/test.vue'), 
    },
       {
  path: '/Calculate-stock',
  name: 'Calculate-stock',
  component: () => import('@/views/Calculate-stock.vue'), 
      meta: {
        pageTitle: 'Calculate-stock',
        breadcrumb: [
          {
            text: 'Calculate-stock',
            active: true,
          },
        ],
      },
  },
  
  {
      path: '/Raw-plan',
      name: 'Raw-Plan',
      component: () => import('@/views/Raw-plan.vue'),
      meta: {
        pageTitle: 'Raw-Plan',
        breadcrumb: [
          {
            text: 'Raw-Plan',
            active: true,
          },
        ],
      },
  },
{
      path: '/Check-stock',
      name: 'Check-stock',
      component: () => import('@/views/Check-stock.vue'),
      meta: {
        pageTitle: 'Check-stock',
        breadcrumb: [
          {
            text: 'Check-stock',
            active: true,
          },
        ],
      },
  },
{
    path: 'GameOnlyAdmin/',      
    name: 'GameOnlyAdmin',     
    component: () => import('@/views/GameOnlyAdmin.vue'), 
    },

  {
      path: '/Submit-product',
      name: 'Submit-product',
      component: () => import('@/views/Submit-product.vue'),
      meta: {
        pageTitle: 'Submit-product',
        breadcrumb: [
          {
            text: 'Submit-product',
            active: true,
          },
        ],
      },
  },
  ],
})

// ? For splash screen
// Remove afterEach hook if you are not using splash screen
router.afterEach(() => {
  // Remove initial loading
  const appLoading = document.getElementById('loading-bg')
  if (appLoading) {
    appLoading.style.display = 'none'
  }
})

export default router
