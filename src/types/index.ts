// Appwrite user type
export type User = {
    id: string;                   // Required
    $createdAt: string;           // Required
    $updatedAt: string;           // Required
    name: string | null;          // Optional
    email: string | null;         // Optional
    phone: string | null;         // Optional
    emailVerification: boolean;   // Required
    phoneVerification: boolean;   // Required
    status: boolean;              // Required
    passwordUpdate: string;       // Required
    registration: string;         // Required
    accessedAt: string;          // Required
    prefs: Record<string, any>;   // Required but can be empty
    mfa: boolean;                 // Required
    labels: string[];             // Required but can be empty
    targets: Target[];
}

// Targets
export type Target = {
    id: string;
    $createdAt: string;
    $updatedAt: string;
    identifier: string;
    providerId: string | null;
    providerType: string;
    userId: string;
    name: string | null;
    expired: boolean;
}

// Profile type
export type Profile = {
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string | null;
    fullName: string | null;
    username: string | null;
    avatar_url: string | null;
    website: string | null;
}

// Entry type
export type Entry = {
    id: string;
    userId: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    voicenotes: VoiceNote[] | []; // Array of voice note IDs
    isDraft: boolean;
}

// Voice type
export type VoiceNote = {
    id: string;
    userId: string;
    fileId: string;
    createdAt: string;
    duration: number;
    transcript: string | null;
    entryId: string | null;
}

// Auth response type
export type AuthResponse = {
    success: boolean;
    error: string | null;
}

// Conversation type
export type Conversation = {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    context: string | null;
    contextType: string | null;
    contextReference: string | null;
    provider: string | null;
    model: string | null;
    isArchived: boolean;
    messages: Message[] | []; 
}

// Chat message type
export type Message = {
    id: string;
    author: string;
    prompt: string;
    content: string;
    isLiked: boolean;
    conversationId: string;
    metadata: JSON | null;
}





// Refresh options for user data refresh with optional routing
export interface RefreshOptions {
    routePath?: any; // Flexible type for router paths
    shouldRoute?: boolean;
}

// Chat message type
export type ChatMessage = {
    id: string;
    userId: string;
    prompt: string;
    response: string;
    timestamp: string;
}

export interface UserCredentials {
    email: string;
    password: string;
  }
  
  export interface UserData {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
    updatedAt: string;
    // Add other user properties as needed
  }
