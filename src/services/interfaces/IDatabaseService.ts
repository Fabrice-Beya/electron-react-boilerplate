export interface QueryOptions {
  collection: string;
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DocumentData {
  id: string;
  [key: string]: any;
}

export interface IDatabaseService {
  listDocuments(
    databaseId: string,
    collectionId: string,
    queries: any[]
  ): Promise<any>;
  
  getDocument(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<any>;
  
  createDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: any
  ): Promise<any>;
  
  updateDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: any
  ): Promise<any>;
  
  deleteDocument(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<any>;
} 