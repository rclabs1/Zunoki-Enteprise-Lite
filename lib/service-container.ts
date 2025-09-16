/**
 * Service Container - Industry standard dependency injection pattern
 * Used by Respond.io, Crisp.chat, and other messaging platforms
 */
export class ServiceContainer {
  private services = new Map<string, any>();
  private static instance: ServiceContainer;

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
    console.log(`🔧 Service registered: ${name}`);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      const availableServices = Array.from(this.services.keys()).join(', ');
      throw new Error(`Service not found: ${name}. Available services: ${availableServices}`);
    }
    return service;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  list(): string[] {
    return Array.from(this.services.keys());
  }
}

export const serviceContainer = ServiceContainer.getInstance();

/**
 * Provider Factory - Creates providers with injected dependencies
 */
class ProviderFactory {
  async getGmailProvider() {
    try {
      console.log('🔧 Creating Gmail provider with dependency injection...');
      
      // Dynamic import to avoid circular dependencies
      const { GmailProviderProduction } = await import('@/lib/providers/gmail/production-ready');
      
      // Check if services are available
      if (!serviceContainer.has('messageService')) {
        console.warn('⚠️ messageService not available in service container');
        return new GmailProviderProduction();
      }

      // Inject services
      const services = {
        messageService: serviceContainer.get('messageService'),
        contactService: serviceContainer.get('contactService'),
        conversationService: serviceContainer.get('conversationService'),
      };

      console.log('✅ Gmail provider created with injected services');
      return new GmailProviderProduction(services);
      
    } catch (error: any) {
      console.error('❌ Gmail provider creation failed:', error.message);
      throw new Error(`Gmail provider initialization failed: ${error.message}`);
    }
  }
}

export const providerFactory = new ProviderFactory();