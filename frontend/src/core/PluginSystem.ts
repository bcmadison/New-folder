import { EventBus } from './EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';
import { UnifiedConfigManager } from './UnifiedConfig';
import { UnifiedMonitor } from './UnifiedMonitor';


export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies: string[];
  hooks: string[];
  config: Record<string, any>;
}

export interface PluginContext {
  eventBus: EventBus;
  performanceMonitor: PerformanceMonitor;
  monitor: UnifiedMonitor;
  configManager: UnifiedConfigManager;
  metadata: PluginMetadata;
}

export interface Plugin {
  metadata: PluginMetadata;
  initialize(context: PluginContext): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  onEvent?(event: string, data: any): Promise<void>;
  cleanup?(): Promise<void>;
}

export interface PluginHook {
  id: string;
  plugin: string;
  priority: number;
  handler: (data: any, context: PluginContext) => Promise<any>;
}

export class PluginSystem {
  private static instance: PluginSystem;
  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly monitor: UnifiedMonitor;
  private readonly configManager: UnifiedConfigManager;
  private readonly plugins: Map<string, Plugin>;
  private readonly hooks: Map<string, PluginHook[]>;
  private readonly dependencies: Map<string, Set<string>>;
  private isInitialized: boolean = false;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.monitor = UnifiedMonitor.getInstance();
    this.configManager = UnifiedConfigManager.getInstance();
    this.plugins = new Map();
    this.hooks = new Map();
    this.dependencies = new Map();
  }

  public static getInstance(): PluginSystem {
    if (!PluginSystem.instance) {
      PluginSystem.instance = new PluginSystem();
    }
    return PluginSystem.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const traceId = this.performanceMonitor.startTrace('plugin-system-init');
    try {
      const config = await this.configManager.getConfig();
      
      // Load and initialize plugins in dependency order
      const sortedPlugins = this.sortPluginsByDependencies(config.plugins || []);
      for (const pluginMetadata of sortedPlugins) {
        await this.loadPlugin(pluginMetadata);
      }

      this.isInitialized = true;
      this.performanceMonitor.endTrace(traceId);
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  private async loadPlugin(metadata: PluginMetadata): Promise<void> {
    const traceId = this.performanceMonitor.startTrace(`load-plugin-${metadata.id}`);
    try {
      // Create plugin context
      const context: PluginContext = {
        eventBus: this.eventBus,
        performanceMonitor: this.performanceMonitor,
        monitor: this.monitor,
        configManager: this.configManager,
        metadata
      };

      // Load plugin module
      const plugin = await this.importPlugin(metadata.id);
      
      // Initialize plugin
      await plugin.initialize(context);
      
      // Register plugin
      this.plugins.set(metadata.id, plugin);
      
      // Register hooks
      this.registerPluginHooks(metadata, plugin);
      
      // Track dependencies
      this.trackDependencies(metadata);

      this.performanceMonitor.endTrace(traceId);
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  private async importPlugin(pluginId: string): Promise<Plugin> {
    try {
      const module = await import(`../plugins/${pluginId}`);
      return new module.default();
    } catch (error) {
      throw new Error(`Failed to load plugin ${pluginId}: ${error}`);
    }
  }

  private registerPluginHooks(metadata: PluginMetadata, plugin: Plugin): void {
    for (const hookId of metadata.hooks) {
      const hook: PluginHook = {
        id: hookId,
        plugin: metadata.id,
        priority: 0, // Default priority
        handler: async (data: any, context: PluginContext) => {
          if (plugin.onEvent) {
            return plugin.onEvent(hookId, data);
          }
          return data;
        }
      };

      const hooks = this.hooks.get(hookId) || [];
      hooks.push(hook);
      hooks.sort((a, b) => b.priority - a.priority);
      this.hooks.set(hookId, hooks);
    }
  }

  private trackDependencies(metadata: PluginMetadata): void {
    const deps = new Set(metadata.dependencies);
    this.dependencies.set(metadata.id, deps);

    // Validate dependencies
    for (const dep of deps) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin ${metadata.id} depends on missing plugin ${dep}`);
      }
    }
  }

  private sortPluginsByDependencies(plugins: PluginMetadata[]): PluginMetadata[] {
    const sorted: PluginMetadata[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (plugin: PluginMetadata) => {
      if (visited.has(plugin.id)) return;
      if (visiting.has(plugin.id)) {
        throw new Error(`Circular dependency detected in plugins: ${plugin.id}`);
      }

      visiting.add(plugin.id);

      for (const dep of plugin.dependencies) {
        const depPlugin = plugins.find(p => p.id === dep);
        if (!depPlugin) {
          throw new Error(`Missing dependency ${dep} for plugin ${plugin.id}`);
        }
        visit(depPlugin);
      }

      visiting.delete(plugin.id);
      visited.add(plugin.id);
      sorted.push(plugin);
    };

    for (const plugin of plugins) {
      if (!visited.has(plugin.id)) {
        visit(plugin);
      }
    }

    return sorted;
  }

  public async executeHook(hookId: string, data: any): Promise<any> {
    const hooks = this.hooks.get(hookId) || [];
    let result = data;

    for (const hook of hooks) {
      const traceId = this.performanceMonitor.startTrace(`execute-hook-${hookId}-${hook.plugin}`);
      try {
        const context: PluginContext = {
          eventBus: this.eventBus,
          performanceMonitor: this.performanceMonitor,
          monitor: this.monitor,
          configManager: this.configManager,
          metadata: this.plugins.get(hook.plugin)!.metadata
        };

        result = await hook.handler(result, context);
        this.performanceMonitor.endTrace(traceId);
      } catch (error) {
        this.performanceMonitor.endTrace(traceId, error as Error);
        this.monitor.logError('plugin', error as Error, {
          hookId,
          plugin: hook.plugin
        });
      }
    }

    return result;
  }

  public async startPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const traceId = this.performanceMonitor.startTrace(`start-plugin-${pluginId}`);
    try {
      await plugin.start();
      this.performanceMonitor.endTrace(traceId);
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  public async stopPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const traceId = this.performanceMonitor.startTrace(`stop-plugin-${pluginId}`);
    try {
      await plugin.stop();
      if (plugin.cleanup) {
        await plugin.cleanup();
      }
      this.performanceMonitor.endTrace(traceId);
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  public async startAll(): Promise<void> {
    const sortedPlugins = this.sortPluginsByDependencies(Array.from(this.plugins.values()).map(p => p.metadata));
    for (const metadata of sortedPlugins) {
      await this.startPlugin(metadata.id);
    }
  }

  public async stopAll(): Promise<void> {
    const sortedPlugins = this.sortPluginsByDependencies(Array.from(this.plugins.values()).map(p => p.metadata)).reverse();
    for (const metadata of sortedPlugins) {
      await this.stopPlugin(metadata.id);
    }
  }

  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  public getPluginDependencies(pluginId: string): string[] {
    const deps = this.dependencies.get(pluginId);
    return deps ? Array.from(deps) : [];
  }

  public getDependentPlugins(pluginId: string): string[] {
    return Array.from(this.dependencies.entries())
      .filter(([_, deps]) => deps.has(pluginId))
      .map(([id]) => id);
  }
} 