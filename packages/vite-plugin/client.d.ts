// Reference from your app: /// <reference types="@terse/vite-plugin/client" />
declare module '*.terse' {
  import type { ComponentType } from 'react'
  const Component: ComponentType<any>
  export default Component
}
