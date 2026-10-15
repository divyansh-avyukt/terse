// Reference from your app: /// <reference types="@terseui/vite-plugin/client" />
declare module '*.terse' {
  import type { ComponentType } from 'react'
  const Component: ComponentType<any>
  export default Component
}
