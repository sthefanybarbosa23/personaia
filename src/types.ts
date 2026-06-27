export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  joinedDate: string;
}

export interface UserPersona {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
}

export interface Character {
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  systemPrompt: string;
  initialMessage: string;
  category: string;
  creatorId?: string;
  isCustom: boolean;
  chatsCount: number;
  rating: number;
  bannerUrl?: string;
  isPublic?: boolean;
  tags?: string;
}

export interface Message {
  id: string;
  characterId: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
  image?: string; // support image attach
  userPersonaId?: string; // associate with a user persona
}

export interface ChatSession {
  characterId: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned?: boolean; // pin chats
}

