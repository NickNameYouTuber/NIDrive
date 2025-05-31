// Типы данных для новой системы файлов на основе MongoDB/GridFS

export interface FileMetadata {
  id: string;
  filename: string;
  user_id: string;
  content_type: string;
  size: number;
  is_public: boolean;
  folder?: string | null;
  created_at: string;
  access_token?: string | null;
}

export interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
}

export interface FileUploadResponse {
  success: boolean;
  file?: FileMetadata;
  error?: string;
}

export interface FileAccessResponse {
  file_url: string;
  access_token: string;
  expires_at?: string;
}
