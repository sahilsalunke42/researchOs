export function usePlatform(): { isDesktop: boolean; isWeb: boolean } {
  const isDesktop = typeof window !== 'undefined' && 'electron' in window;
  return { isDesktop, isWeb: !isDesktop };
}
