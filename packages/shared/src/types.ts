export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  IFRAME = 'IFRAME',
}

export interface ArtPiece {
  id: string;
  title: string;
  description?: string;
  mediaType: MediaType;
  sourceUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  collectionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArtPieceDto {
  title: string;
  description?: string;
  mediaType: MediaType;
  sourceUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  collectionId?: string;
}

export interface UpdateArtPieceDto {
  title?: string;
  description?: string;
  mediaType?: MediaType;
  sourceUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
  collectionId?: string;
}

export interface CreateCollectionDto {
  name: string;
  description?: string;
  coverUrl?: string;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  coverUrl?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
