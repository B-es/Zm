declare module 'vue3-tabs-component' {
  import type { Component, DefineComponent } from 'vue'
  
  export const Tabs: DefineComponent<{
    id?: string
    options?: {
      useUrlFragment?: boolean
      storageKey?: string
      disableScrollBehavior?: boolean
      defaultTabHash?: string
      cacheLifetime?: number
    }
    'wrapper-class'?: string
    'panels-wrapper-class'?: string
    'nav-class'?: string
    'nav-item-class'?: string
    'nav-item-active-class'?: string
    'nav-item-inactive-class'?: string
    'nav-item-disabled-class'?: string
    'nav-item-link-class'?: string
    'nav-item-link-active-class'?: string
    'nav-item-link-inactive-class'?: string
    'nav-item-link-disabled-class'?: string
    'cache-lifetime'?: number | string
  }, {}, any, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    changed: (tab: any) => void
    clicked: (tab: any) => void
  }, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    id?: string
    options?: {
      useUrlFragment?: boolean
      storageKey?: string
      disableScrollBehavior?: boolean
      defaultTabHash?: string
      cacheLifetime?: number
    }
    'wrapper-class'?: string
    'panels-wrapper-class'?: string
    'nav-class'?: string
    'nav-item-class'?: string
    'nav-item-active-class'?: string
    'nav-item-inactive-class'?: string
    'nav-item-disabled-class'?: string
    'nav-item-link-class'?: string
    'nav-item-link-active-class'?: string
    'nav-item-link-inactive-class'?: string
    'nav-item-link-disabled-class'?: string
    'cache-lifetime'?: number | string
  }>>, {}, {}>
  
  export const Tab: DefineComponent<{
    name: string
    id?: string
    prefix?: string
    suffix?: string
    isDisabled?: boolean
    'panel-class'?: string
    'nav-item-class'?: string
    'nav-item-link-class'?: string
  }>
}