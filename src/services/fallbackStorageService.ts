/**
 * Fallback Storage Service
 * 
 * This service provides a way to store files locally when Supabase storage is unavailable
 * or experiencing issues. It uses IndexedDB to store the files and their metadata.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { getIndexedDB } from '../utils/storageInit';

interface FileEntry {
  id: string;
  path: string;
  file: Blob;
  contentType: string;
  name: string;
  size: number;
  uploadDate: number;
  projectId: string;
  userId: string;
  metadata: Record<string, any>;
  versions?: FileVersionEntry[];
  synced?: boolean;
  lastModified?: number;
}

interface FileVersionEntry {
  id: string;
  fileId: string;
  blob: Blob;
  createdAt: number;
  size: number;
}

interface LocalStorageDB extends DBSchema {
  files: {
    key: string;
    value: FileEntry;
    indexes: {
      'by-path': string;
      'by-project': string;
      'by-sync-status': boolean;
    };
  };
  versions: {
    key: string;
    value: FileVersionEntry;
    indexes: {
      'by-file-id': string;
    };
  };
}

class FallbackStorageService {
  private dbPromise: Promise<IDBPDatabase<LocalStorageDB>> | null = null;
  private readonly DB_NAME = 'fallback-storage';
  private readonly DB_VERSION = 2; // Increased version for new schema
  
  /**
   * Initialize the IndexedDB database
   */
  public async initDB(): Promise<IDBPDatabase<LocalStorageDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<LocalStorageDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Create or update tables as needed based on the old version
          if (oldVersion < 1) {
            const filesStore = db.createObjectStore('files', { keyPath: 'id' });
            filesStore.createIndex('by-path', 'path', { unique: true });
            filesStore.createIndex('by-project', 'projectId', { unique: false });
          }
          
          // Added in version 2
          if (oldVersion < 2) {
            // Add new index for sync status if upgrading from version 1
            if (oldVersion === 1) {
              const filesStore = transaction.objectStore('files');
              filesStore.createIndex('by-sync-status', 'synced', { unique: false });
            }
            
            // Create versions store
            const versionsStore = db.createObjectStore('versions', { keyPath: 'id' });
            versionsStore.createIndex('by-file-id', 'fileId', { unique: false });
          }
        },
      });
    }
    
    return this.dbPromise;
  }
  
  /**
   * Upload a file to local storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    projectId: string, 
    userId: string,
    metadata: Record<string, any> = {}
  ): Promise<{ path: string; id: string; publicUrl: string }> {
    try {
      const db = await this.initDB();
      const fileId = crypto.randomUUID(); // Use proper UUID format
      const storagePath = `${bucket}/${path}`;
      
      // Get current timestamp
      const now = Date.now();
      
      // Check if file already exists to handle as update
      const existingFile = await this.getFileByPath(storagePath);
      
      // Create the file blob
      const fileBlob = file instanceof File ? file : new Blob([file]);
      
      if (existingFile) {
        console.log('Updating existing file in local storage:', existingFile.path);
        
        // Create a version of the previous state
        await this.createFileVersion(existingFile.id, existingFile.file);
        
        // Update the existing file
        const updatedFile: FileEntry = {
          ...existingFile,
          file: fileBlob,
          contentType: file instanceof File ? file.type : 'application/octet-stream',
          size: file instanceof File ? file.size : file.size,
          lastModified: now,
          metadata: {
            ...existingFile.metadata,
            ...metadata,
            updateTimestamp: now
          },
          synced: false
        };
        
        await db.put('files', updatedFile);
        
        // Create a data URL for the public URL
        const localUrl = URL.createObjectURL(fileBlob);
        
        return {
          path: storagePath,
          id: existingFile.id,
          publicUrl: localUrl
        };
      } else {
        // Create a new file entry
        const fileEntry: FileEntry = {
          id: fileId,
          path: storagePath,
          file: fileBlob,
          contentType: file instanceof File ? file.type : 'application/octet-stream',
          name: file instanceof File ? file.name : path.split('/').pop() || 'file',
          size: file instanceof File ? file.size : file.size,
          uploadDate: now,
          lastModified: now,
          projectId,
          userId,
          metadata: {
            ...metadata,
            originalFileName: file instanceof File ? file.name : path.split('/').pop(),
            uploadTimestamp: now
          },
          synced: false
        };
        
        await db.put('files', fileEntry);
        
        console.log('File stored locally:', fileEntry.path);
        
        // Create a data URL as a fallback for the public URL
        const localUrl = URL.createObjectURL(fileBlob);
        
        return {
          path: storagePath,
          id: fileId,
          publicUrl: localUrl
        };
      }
    } catch (error) {
      console.error('Error storing file locally:', error);
      throw new Error('Failed to store file locally');
    }
  }
  
  /**
   * Create a version of a file
   */
  private async createFileVersion(fileId: string, fileBlob: Blob): Promise<string> {
    try {
      const db = await this.initDB();
      const versionId = crypto.randomUUID();
      
      const versionEntry: FileVersionEntry = {
        id: versionId,
        fileId,
        blob: fileBlob,
        createdAt: Date.now(),
        size: fileBlob.size
      };
      
      await db.put('versions', versionEntry);
      console.log(`Created version ${versionId} for file ${fileId}`);
      
      return versionId;
    } catch (error) {
      console.error('Error creating file version:', error);
      throw new Error('Failed to create file version');
    }
  }
  
  /**
   * Get file versions
   */
  async getFileVersions(fileId: string): Promise<FileVersionEntry[]> {
    try {
      const db = await this.initDB();
      const index = db.transaction('versions').store.index('by-file-id');
      const versions = await index.getAll(fileId);
      
      // Sort by creation date (newest first)
      return versions.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting file versions:', error);
      return [];
    }
  }
  
  /**
   * Restore a previous version of a file
   */
  async restoreFileVersion(versionId: string): Promise<boolean> {
    try {
      const db = await this.initDB();
      
      // Get the version
      const version = await db.get('versions', versionId);
      if (!version) {
        throw new Error('Version not found');
      }
      
      // Get the file
      const file = await db.get('files', version.fileId);
      if (!file) {
        throw new Error('File not found');
      }
      
      // Create a version of the current state before restoring
      await this.createFileVersion(file.id, file.file);
      
      // Update the file with the version content
      const updatedFile: FileEntry = {
        ...file,
        file: version.blob,
        size: version.blob.size,
        lastModified: Date.now(),
        synced: false,
        metadata: {
          ...file.metadata,
          restoredFromVersion: versionId,
          restoredAt: Date.now()
        }
      };
      
      await db.put('files', updatedFile);
      
      return true;
    } catch (error) {
      console.error('Error restoring file version:', error);
      return false;
    }
  }
  
  /**
   * Get a file from local storage
   */
  async getFile(bucket: string, path: string): Promise<Blob | null> {
    try {
      const fileEntry = await this.getFileByPath(`${bucket}/${path}`);
      return fileEntry ? fileEntry.file : null;
    } catch (error) {
      console.error('Error retrieving file from local storage:', error);
      return null;
    }
  }
  
  /**
   * Get a file entry by path
   */
  private async getFileByPath(fullPath: string): Promise<FileEntry | null> {
    try {
      const db = await this.initDB();
      const index = db.transaction('files').store.index('by-path');
      return await index.get(fullPath);
    } catch (error) {
      console.error('Error getting file by path:', error);
      return null;
    }
  }
  
  /**
   * Get a URL for a file in local storage
   */
  async getFileUrl(bucket: string, path: string): Promise<string | null> {
    try {
      const file = await this.getFile(bucket, path);
      
      if (!file) {
        return null;
      }
      
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Error creating URL for local file:', error);
      return null;
    }
  }
  
  /**
   * Delete a file from local storage
   */
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const db = await this.initDB();
      const storagePath = `${bucket}/${path}`;
      
      const index = db.transaction('files', 'readwrite').store.index('by-path');
      const fileEntry = await index.get(storagePath);
      
      if (!fileEntry) {
        return false;
      }
      
      // Delete all versions of this file
      const tx = db.transaction(['files', 'versions'], 'readwrite');
      
      // Get all versions
      const versionsIndex = tx.objectStore('versions').index('by-file-id');
      const versions = await versionsIndex.getAllKeys(fileEntry.id);
      
      // Delete each version
      for (const versionId of versions) {
        await tx.objectStore('versions').delete(versionId);
      }
      
      // Delete the file
      await tx.objectStore('files').delete(fileEntry.id);
      
      await tx.done;
      
      return true;
    } catch (error) {
      console.error('Error deleting file from local storage:', error);
      return false;
    }
  }
  
  /**
   * List all files for a project
   */
  async listProjectFiles(projectId: string): Promise<FileEntry[]> {
    try {
      const db = await this.initDB();
      const index = db.transaction('files').store.index('by-project');
      return await index.getAll(projectId);
    } catch (error) {
      console.error('Error listing project files:', error);
      return [];
    }
  }
  
  /**
   * Get all files that haven't been synced to Supabase
   */
  async getUnsyncedFiles(): Promise<FileEntry[]> {
    try {
      const db = await getIndexedDB();
      
      if (!db) {
        console.error('Failed to get IndexedDB instance');
        return [];
      }
      
      try {
        const tx = db.transaction('unsynced-files', 'readonly');
        const store = tx.objectStore('unsynced-files');
        
        if (!store.indexNames.contains('by-status')) {
          console.warn('Missing by-status index, fallback to get all records');
          return await store.getAll();
        }
        
        const index = store.index('by-status');
        const unsynced = await index.getAll('pending');
        
        await tx.done;
        return unsynced;
      } catch (indexError) {
        console.error('Error getting unsynced files:', indexError);
        
        return [];
      }
    } catch (error) {
      console.error('Error getting unsynced files:', error);
      return [];
    }
  }
  
  /**
   * Mark a file as synced to Supabase
   */
  async markFileSynced(fileId: string): Promise<boolean> {
    try {
      const db = await this.initDB();
      const file = await db.get('files', fileId);
      
      if (!file) {
        return false;
      }
      
      await db.put('files', {
        ...file,
        synced: true
      });
      
      return true;
    } catch (error) {
      console.error('Error marking file as synced:', error);
      return false;
    }
  }
  
  /**
   * Get all files (for sync purposes)
   */
  async getAllFiles(): Promise<FileEntry[]> {
    try {
      const db = await this.initDB();
      return await db.getAll('files');
    } catch (error) {
      console.error('Error getting all files:', error);
      return [];
    }
  }
  
  /**
   * Clear all data (useful for testing or user logout)
   */
  async clearAll(): Promise<boolean> {
    try {
      const db = await this.initDB();
      await db.clear('files');
      await db.clear('versions');
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const fallbackStorage = new FallbackStorageService();

export default fallbackStorage; 