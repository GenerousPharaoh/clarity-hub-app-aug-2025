import { useRef, useEffect } from 'react';

// Performance metric types
export enum MetricType {
  NAVIGATION = 'navigation',
  RESOURCE = 'resource',
  PAINT = 'paint',
  COMPONENT = 'component', 
  API = 'api',
  INTERACTION = 'interaction',
  MEMORY = 'memory'
}

// Interface for performance metrics
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Performance budget thresholds
export const PERFORMANCE_THRESHOLDS = {
  // Time to first paint (ms)
  FP: 1000,
  // Time to first contentful paint (ms)
  FCP: 1500,
  // Time to interactive (ms)
  TTI: 3000,
  // Time to largest contentful paint (ms)
  LCP: 2500,
  // Cumulative layout shift (unitless)
  CLS: 0.1,
  // First input delay (ms)
  FID: 100,
  // Component render time (ms)
  COMPONENT_RENDER: 50,
  // API response time (ms)
  API_RESPONSE: 1000,
  // Memory usage (MB)
  MEMORY_USAGE: 50,
  // Slow component threshold (ms)
  SLOW_COMPONENT: 100
};

// Store for collected metrics
class MetricsStore {
  private metrics: PerformanceMetric[] = [];
  private observers: Array<(metric: PerformanceMetric) => void> = [];
  private maxEntries = 1000;
  private isPerformanceSupported: boolean;
  private isMemorySupported: boolean;
  
  constructor() {
    // Check browser support
    this.isPerformanceSupported = typeof window !== 'undefined' && 
      typeof window.performance !== 'undefined';
    
    this.isMemorySupported = this.isPerformanceSupported && 
      'memory' in window.performance;
    
    // Initialize performance observer if supported
    if (this.isPerformanceSupported && typeof PerformanceObserver !== 'undefined') {
      try {
        // Paint metrics (FP, FCP)
        const paintObserver = new PerformanceObserver((entries) => {
          entries.getEntries().forEach(entry => {
            this.addMetric({
              name: entry.name,
              type: MetricType.PAINT,
              value: entry.startTime,
              timestamp: Date.now()
            });
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        
        // Navigation metrics
        const navigationObserver = new PerformanceObserver((entries) => {
          entries.getEntries().forEach(entry => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              
              // DOM metrics
              this.addMetric({
                name: 'DOMContentLoaded',
                type: MetricType.NAVIGATION,
                value: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                timestamp: Date.now()
              });
              
              this.addMetric({
                name: 'Load',
                type: MetricType.NAVIGATION, 
                value: navEntry.loadEventEnd - navEntry.fetchStart,
                timestamp: Date.now()
              });
              
              // Request metrics
              this.addMetric({
                name: 'TTFB',
                type: MetricType.NAVIGATION,
                value: navEntry.responseStart - navEntry.requestStart,
                timestamp: Date.now()
              });
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        
        // Resource metrics (images, scripts, etc.)
        const resourceObserver = new PerformanceObserver((entries) => {
          entries.getEntries().forEach(entry => {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              
              // Skip tracking small resources
              if (resourceEntry.duration < 100) return;
              
              this.addMetric({
                name: resourceEntry.name.split('/').pop() || resourceEntry.name,
                type: MetricType.RESOURCE,
                value: resourceEntry.duration,
                timestamp: Date.now(),
                metadata: {
                  size: resourceEntry.transferSize,
                  initiatorType: resourceEntry.initiatorType,
                  url: resourceEntry.name
                }
              });
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        
        // Largest contentful paint
        const lcpObserver = new PerformanceObserver((entries) => {
          const lastEntry = entries.getEntries().pop();
          if (lastEntry) {
            this.addMetric({
              name: 'LCP',
              type: MetricType.PAINT,
              value: lastEntry.startTime,
              timestamp: Date.now()
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First input delay
        const fidObserver = new PerformanceObserver((entries) => {
          entries.getEntries().forEach(entry => {
            if (entry.entryType === 'first-input') {
              const fidEntry = entry as any; // Type definitions may vary
              this.addMetric({
                name: 'FID',
                type: MetricType.INTERACTION,
                value: fidEntry.processingStart - fidEntry.startTime,
                timestamp: Date.now()
              });
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // Layout shifts
        let cumulativeLayoutShift = 0;
        const clsObserver = new PerformanceObserver((entries) => {
          entries.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) {
              const clsEntry = entry as any; // Type definitions may vary
              cumulativeLayoutShift += clsEntry.value;
              
              this.addMetric({
                name: 'CLS',
                type: MetricType.INTERACTION,
                value: cumulativeLayoutShift,
                timestamp: Date.now()
              });
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
      } catch (e) {
        console.error('Error setting up performance observers:', e);
      }
    }
    
    // Track memory usage periodically if supported
    if (this.isMemorySupported) {
      this.trackMemoryUsage();
    }
  }
  
  // Collect memory usage metrics
  private trackMemoryUsage() {
    const collectMemoryMetrics = () => {
      // TypeScript doesn't recognize memory property by default
      const memory = (window.performance as any).memory;
      
      if (memory) {
        this.addMetric({
          name: 'JSHeapSize',
          type: MetricType.MEMORY,
          value: memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
          timestamp: Date.now(),
          metadata: {
            totalHeapSize: memory.totalJSHeapSize / (1024 * 1024),
            heapLimit: memory.jsHeapSizeLimit / (1024 * 1024)
          }
        });
      }
    };
    
    // Collect immediately and then periodically
    collectMemoryMetrics();
    setInterval(collectMemoryMetrics, 30000); // Every 30 seconds
  }
  
  // Add a new metric
  addMetric(metric: PerformanceMetric) {
    // Add timestamp if not provided
    if (!metric.timestamp) {
      metric.timestamp = Date.now();
    }
    
    // Check if we should be concerned about this metric
    const isSlowMetric = this.isConcerningMetric(metric);
    
    // For slow metrics, add a flag in metadata
    if (isSlowMetric) {
      metric.metadata = {
        ...metric.metadata,
        isSlow: true,
        threshold: this.getThresholdForMetric(metric)
      };
      
      // Log to console for development feedback
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Slow performance detected: ${metric.name} (${metric.value.toFixed(2)} ms)`);
      }
    }
    
    // Add to metrics store
    this.metrics.push(metric);
    
    // Trim if necessary
    if (this.metrics.length > this.maxEntries) {
      this.metrics.shift();
    }
    
    // Notify observers
    this.notifyObservers(metric);
  }
  
  // Check if metric exceeds threshold
  private isConcerningMetric(metric: PerformanceMetric): boolean {
    const threshold = this.getThresholdForMetric(metric);
    if (!threshold) return false;
    
    return metric.value > threshold;
  }
  
  // Get threshold for a given metric
  private getThresholdForMetric(metric: PerformanceMetric): number | null {
    switch (metric.name) {
      case 'FP':
        return PERFORMANCE_THRESHOLDS.FP;
      case 'FCP':
        return PERFORMANCE_THRESHOLDS.FCP;
      case 'LCP':
        return PERFORMANCE_THRESHOLDS.LCP;
      case 'CLS':
        return PERFORMANCE_THRESHOLDS.CLS;
      case 'FID':
        return PERFORMANCE_THRESHOLDS.FID;
      case 'JSHeapSize':
        return PERFORMANCE_THRESHOLDS.MEMORY_USAGE;
      default:
        if (metric.type === MetricType.COMPONENT) {
          return PERFORMANCE_THRESHOLDS.COMPONENT_RENDER;
        } else if (metric.type === MetricType.API) {
          return PERFORMANCE_THRESHOLDS.API_RESPONSE;
        }
        return null;
    }
  }
  
  // Get all collected metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  // Get metrics by type
  getMetricsByType(type: MetricType): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }
  
  // Get metrics by name
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }
  
  // Get the latest metric by name
  getLatestMetric(name: string): PerformanceMetric | undefined {
    const metrics = this.getMetricsByName(name);
    return metrics.length ? metrics[metrics.length - 1] : undefined;
  }
  
  // Clear all metrics
  clearMetrics() {
    this.metrics = [];
  }
  
  // Subscribe to new metrics
  subscribe(callback: (metric: PerformanceMetric) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }
  
  // Notify all observers of a new metric
  private notifyObservers(metric: PerformanceMetric) {
    this.observers.forEach(observer => {
      try {
        observer(metric);
      } catch (error) {
        console.error('Error in performance metric observer:', error);
      }
    });
  }
  
  // Get performance summary
  getSummary() {
    const summary = {
      navigation: {
        domContentLoaded: this.getLatestMetric('DOMContentLoaded')?.value,
        load: this.getLatestMetric('Load')?.value,
        ttfb: this.getLatestMetric('TTFB')?.value
      },
      paint: {
        firstPaint: this.getLatestMetric('first-paint')?.value,
        firstContentfulPaint: this.getLatestMetric('first-contentful-paint')?.value,
        largestContentfulPaint: this.getLatestMetric('LCP')?.value
      },
      interaction: {
        firstInputDelay: this.getLatestMetric('FID')?.value,
        cumulativeLayoutShift: this.getLatestMetric('CLS')?.value
      },
      memory: {
        jsHeapSize: this.getLatestMetric('JSHeapSize')?.value
      },
      components: {
        slowComponents: this.metrics
          .filter(m => m.type === MetricType.COMPONENT && m.metadata?.isSlow)
          .map(m => ({
            name: m.name,
            value: m.value,
            timestamp: new Date(m.timestamp).toISOString()
          }))
      },
      api: {
        slowRequests: this.metrics
          .filter(m => m.type === MetricType.API && m.metadata?.isSlow)
          .map(m => ({
            name: m.name,
            value: m.value,
            timestamp: new Date(m.timestamp).toISOString(),
            endpoint: m.metadata?.endpoint
          }))
      }
    };
    
    return summary;
  }
  
  // Check if the API is supported
  isSupported() {
    return this.isPerformanceSupported;
  }
}

// Create singleton instance
export const metricsStore = new MetricsStore();

// React hook for measuring component render time
export const useComponentTimer = (componentName: string) => {
  const startTime = useRef<number | null>(null);
  
  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current !== null) {
        const endTime = performance.now();
        const duration = endTime - startTime.current;
        
        metricsStore.addMetric({
          name: componentName,
          type: MetricType.COMPONENT,
          value: duration,
          timestamp: Date.now()
        });
      }
    };
  }, [componentName]);
};

// Measure API call performance
export const measureApiCall = async <T>(
  name: string, 
  endpoint: string, 
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    metricsStore.addMetric({
      name,
      type: MetricType.API,
      value: duration,
      timestamp: Date.now(),
      metadata: { endpoint }
    });
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    metricsStore.addMetric({
      name: `${name} (Error)`,
      type: MetricType.API,
      value: duration,
      timestamp: Date.now(),
      metadata: { endpoint, error }
    });
    
    throw error;
  }
};

// Get a formatted performance report
export const getPerformanceReport = (): string => {
  const summary = metricsStore.getSummary();
  
  return `
Performance Report:
------------------
Navigation:
  DOM Content Loaded: ${summary.navigation.domContentLoaded?.toFixed(0) || 'N/A'} ms
  Page Load: ${summary.navigation.load?.toFixed(0) || 'N/A'} ms
  Time to First Byte: ${summary.navigation.ttfb?.toFixed(0) || 'N/A'} ms

Rendering:
  First Paint: ${summary.paint.firstPaint?.toFixed(0) || 'N/A'} ms
  First Contentful Paint: ${summary.paint.firstContentfulPaint?.toFixed(0) || 'N/A'} ms
  Largest Contentful Paint: ${summary.paint.largestContentfulPaint?.toFixed(0) || 'N/A'} ms

User Experience:
  First Input Delay: ${summary.interaction.firstInputDelay?.toFixed(0) || 'N/A'} ms
  Cumulative Layout Shift: ${summary.interaction.cumulativeLayoutShift?.toFixed(3) || 'N/A'}

Memory:
  JS Heap Size: ${summary.memory.jsHeapSize?.toFixed(1) || 'N/A'} MB

Slow Components (>100ms): ${summary.components.slowComponents.length}
${summary.components.slowComponents.map(c => `  - ${c.name}: ${c.value.toFixed(0)} ms`).join('\n')}

Slow API Calls (>1000ms): ${summary.api.slowRequests.length}
${summary.api.slowRequests.map(r => `  - ${r.name}: ${r.value.toFixed(0)} ms (${r.endpoint})`).join('\n')}
`;
};

export default metricsStore; 