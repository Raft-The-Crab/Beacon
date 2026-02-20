// Auto-detect device specs and optimize performance
class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private isLowSpec: boolean = false
  private settings = {
    animations: true,
    shadows: true,
    blur: true,
    particles: true,
    highQualityImages: true,
    autoplay: true,
    maxMessages: 100
  }

  private constructor() {
    this.detectSpecs()
    this.applyOptimizations()
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  private detectSpecs() {
    // Check RAM
    const memory = (navigator as any).deviceMemory || 4
    
    // Check CPU cores
    const cores = navigator.hardwareConcurrency || 4
    
    // Check if mobile
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
    
    // Check connection
    const connection = (navigator as any).connection
    const slowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g'
    
    // Determine if low-spec
    this.isLowSpec = memory < 4 || cores < 4 || slowConnection || (isMobile && memory < 3)
    
    console.log(`[Performance] Device: ${this.isLowSpec ? 'Low-spec' : 'High-spec'}`)
    console.log(`[Performance] RAM: ${memory}GB, Cores: ${cores}, Mobile: ${isMobile}`)
  }

  private applyOptimizations() {
    if (this.isLowSpec) {
      this.settings = {
        animations: false,
        shadows: false,
        blur: false,
        particles: false,
        highQualityImages: false,
        autoplay: false,
        maxMessages: 50
      }
      
      // Apply CSS optimizations
      document.documentElement.classList.add('low-spec-mode')
      
      // Disable expensive CSS features
      const style = document.createElement('style')
      style.textContent = `
        .low-spec-mode * {
          animation: none !important;
          transition: none !important;
          backdrop-filter: none !important;
          box-shadow: none !important;
        }
        .low-spec-mode img {
          image-rendering: auto;
        }
      `
      document.head.appendChild(style)
      
      console.log('[Performance] Low-spec optimizations applied')
    }
  }

  getSettings() {
    return this.settings
  }

  isLowSpecDevice() {
    return this.isLowSpec
  }

  // Lazy load images
  lazyLoadImage(img: HTMLImageElement) {
    if (this.isLowSpec) {
      img.loading = 'lazy'
      img.decoding = 'async'
    }
  }

  // Throttle animations
  shouldAnimate() {
    return !this.isLowSpec && this.settings.animations
  }

  // Limit message history
  getMaxMessages() {
    return this.settings.maxMessages
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance()

// Auto-initialize on app load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    performanceOptimizer.getInstance()
  })
}
