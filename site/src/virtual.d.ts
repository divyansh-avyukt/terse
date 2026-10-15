declare module 'virtual:terse-stats' {
  const stats: ReturnType<typeof import('../stats.ts').stats>
  export default stats
}
