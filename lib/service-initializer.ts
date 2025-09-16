/**
 * Service Initializer - Bootstraps the service container with required services
 * This ensures services are available when providers are created
 */
import { serviceContainer } from './service-container';

// Use global to persist across hot reloads in development
declare global {
  var __servicesInitialized: boolean | undefined;
}

export async function initializeServices(): Promise<void> {
  if (global.__servicesInitialized) {
    return; // Silent skip for better performance
  }

  try {
    // Dynamic imports to avoid circular dependencies
    const { messageService, conversationService, contactService } = await import('./services');

    // Register services in container
    serviceContainer.register('messageService', messageService);
    serviceContainer.register('conversationService', conversationService);
    serviceContainer.register('contactService', contactService);

    global.__servicesInitialized = true;
    
  } catch (error: any) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

// Export initialization status for debugging
export const isInitialized = () => global.__servicesInitialized;