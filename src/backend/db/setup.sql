-- SQL Server DDL for Music App (Aligned with data.md)
-- Use this script to initialize the musicdb database schema

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'app_roles')
BEGIN
    CREATE TABLE app_roles (
      id VARCHAR(50) PRIMARY KEY,
      name NVARCHAR(100) NOT NULL,
      max_tracks INT
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
      id VARCHAR(50) PRIMARY KEY,
      username NVARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL, -- e.g. 'active', 'suspended'
      is_email_verified BIT NOT NULL DEFAULT 0,
      display_name NVARCHAR(100),
      created_at DATETIME DEFAULT GETDATE(),
      avatar_url VARCHAR(MAX),
      banner_url VARCHAR(MAX),
      bio NVARCHAR(MAX),
      followers_count INT NOT NULL DEFAULT 0,
      following_count INT NOT NULL DEFAULT 0
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles')
BEGIN
    CREATE TABLE user_roles (
      user_id VARCHAR(50) NOT NULL,
      role_id VARCHAR(50) NOT NULL,
      PRIMARY KEY (user_id, role_id),
      CONSTRAINT FK_UserRoles_Users FOREIGN KEY (user_id) REFERENCES users(id),
      CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (role_id) REFERENCES app_roles(id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'genres')
BEGIN
    CREATE TABLE genres (
      id VARCHAR(50) PRIMARY KEY,
      name NVARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'storage_objects')
BEGIN
    CREATE TABLE storage_objects (
      id VARCHAR(50) PRIMARY KEY,
      owner_user_id VARCHAR(50) NOT NULL,
      object_type VARCHAR(20) NOT NULL,
      path VARCHAR(MAX) NOT NULL,
      mime_type VARCHAR(50),
      size_bytes BIGINT,
      status VARCHAR(20) NOT NULL,
      created_at DATETIME DEFAULT GETDATE(),
      CONSTRAINT FK_Storage_Users FOREIGN KEY (owner_user_id) REFERENCES users(id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tracks')
BEGIN
    CREATE TABLE tracks (
      id VARCHAR(50) PRIMARY KEY,
      uploader_user_id VARCHAR(50) NOT NULL,
      title NVARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description NVARCHAR(MAX),
      genre_id VARCHAR(50),
      main_artist NVARCHAR(255),
      audio_object_id VARCHAR(50) NOT NULL,
      cover_image_object_id VARCHAR(50),
      visibility VARCHAR(20) NOT NULL, -- PUBLIC / PRIVATE
      status VARCHAR(20) NOT NULL, -- PENDING / APPROVED / REJECTED
      likes_count INT NOT NULL DEFAULT 0,
      comments_count INT NOT NULL DEFAULT 0,
      plays_count BIGINT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT GETDATE(),
      reposts_count INT NOT NULL DEFAULT 0,
      lyrics_lrc NVARCHAR(MAX),
      scheduled_at DATETIME,
      release_date DATE,
      CONSTRAINT FK_Tracks_Users FOREIGN KEY (uploader_user_id) REFERENCES users(id),
      CONSTRAINT FK_Tracks_Genres FOREIGN KEY (genre_id) REFERENCES genres(id),
      CONSTRAINT FK_Tracks_Audio FOREIGN KEY (audio_object_id) REFERENCES storage_objects(id),
      CONSTRAINT FK_Tracks_Cover FOREIGN KEY (cover_image_object_id) REFERENCES storage_objects(id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'track_likes')
BEGIN
    CREATE TABLE track_likes (
      track_id VARCHAR(50) NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      created_at DATETIME DEFAULT GETDATE(),
      PRIMARY KEY (track_id, user_id),
      CONSTRAINT FK_Likes_Tracks FOREIGN KEY (track_id) REFERENCES tracks(id),
      CONSTRAINT FK_Likes_Users FOREIGN KEY (user_id) REFERENCES users(id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'playlists')
BEGIN
    CREATE TABLE playlists (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      name NVARCHAR(255) NOT NULL,
      cover_url VARCHAR(MAX),
      visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
      status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
      created_at DATETIME DEFAULT GETDATE(),
      CONSTRAINT FK_Playlists_Users FOREIGN KEY (user_id) REFERENCES users(id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'playlist_tracks')
BEGIN
    CREATE TABLE playlist_tracks (
      playlist_id VARCHAR(50) NOT NULL,
      track_id VARCHAR(50) NOT NULL,
      position INT NOT NULL,
      added_at DATETIME DEFAULT GETDATE(),
      PRIMARY KEY (playlist_id, track_id),
      CONSTRAINT FK_PT_Playlists FOREIGN KEY (playlist_id) REFERENCES playlists(id),
      CONSTRAINT FK_PT_Tracks FOREIGN KEY (track_id) REFERENCES tracks(id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'comments')
BEGIN
    CREATE TABLE comments (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      track_id VARCHAR(50) NOT NULL,
      content NVARCHAR(MAX) NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'APPROVED', -- Moderation Status
      created_at DATETIME DEFAULT GETDATE(),
      CONSTRAINT FK_Comments_Users FOREIGN KEY (user_id) REFERENCES users(id),
      CONSTRAINT FK_Comments_Tracks FOREIGN KEY (track_id) REFERENCES tracks(id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'listening_history')
BEGIN
    CREATE TABLE listening_history (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      track_id VARCHAR(50) NOT NULL,
      played_at DATETIME DEFAULT GETDATE(),
      CONSTRAINT FK_History_Users FOREIGN KEY (user_id) REFERENCES users(id),
      CONSTRAINT FK_History_Tracks FOREIGN KEY (track_id) REFERENCES tracks(id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'follows')
BEGIN
    CREATE TABLE follows (
      follower_id VARCHAR(50) NOT NULL,
      following_id VARCHAR(50) NOT NULL,
      created_at DATETIME DEFAULT GETDATE(),
      PRIMARY KEY (follower_id, following_id),
      CONSTRAINT FK_Follows_Follower FOREIGN KEY (follower_id) REFERENCES users(id),
      CONSTRAINT FK_Follows_Following FOREIGN KEY (following_id) REFERENCES users(id),
      CONSTRAINT CHK_No_Self_Follow CHECK (follower_id <> following_id)
    );
END

-- Seed Roles using names expected by RBAC middleware
IF NOT EXISTS (SELECT 1 FROM app_roles WHERE id = 'role_user')
    INSERT INTO app_roles (id, name, max_tracks) VALUES ('role_user', 'USER', 50);

IF NOT EXISTS (SELECT 1 FROM app_roles WHERE id = 'role_admin')
    INSERT INTO app_roles (id, name, max_tracks) VALUES ('role_admin', 'ADMIN', 0);
