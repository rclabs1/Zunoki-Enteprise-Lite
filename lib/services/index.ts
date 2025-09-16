// Service Layer Index - Clean abstractions over database operations
// This file provides a unified import point for all service layer components

export { messageService, MessageService } from './message-service';
export type { PlatformMessage, MessageQueryOptions } from './message-service';

export { conversationService, ConversationService } from './conversation-service';
export type { 
  PlatformConversation, 
  ConversationQueryOptions, 
  ConversationWithContact 
} from './conversation-service';

export { contactService, ContactService } from './contact-service';
export type { 
  PlatformContact, 
  ContactQueryOptions, 
  ContactUserInfo 
} from './contact-service';

// Note: Service instances are managed by service-initializer.ts and service-container.ts
// Individual services can be imported directly from their respective modules
// Removed services export to prevent circular dependency issues during webpack compilation