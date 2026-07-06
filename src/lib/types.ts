export interface MediaItem {
  id: string;
  title: string;
  path: string;
  is_dir?: boolean;
  thumbnail_id?: string | null;
  watch_progress?: number | null;
}

export interface MediaGroup {
  id: string;
  folder_path: string;
  parent_id?: string | null;
  items: MediaItem[];
  folder_count: number;
  video_count: number;
  image_count: number;
  scan_progress: number | null;
}

export interface MediaContext {
  prev_id?: string | null;
  next_id?: string | null;
  current_title?: string | null;
  parent_id?: string | null;
}

export interface ServerSettings {
  skip_threshold_seconds: number;
  media_folders: string[];
  admin_username: string | null;
  admin_password: string | null;
}
