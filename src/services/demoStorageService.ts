/**
 * Demo Storage Service - Persistent Storage for Demo Mode
 * 
 * Provides persistent storage for demo mode using IndexedDB as fallback
 * and Supabase when possible, ensuring demo data persists across sessions.
 */

interface DemoFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  project_id: string;
  exhibit_id?: string;
  exhibit_title?: string;
  uploaded_at: string;
}

interface DemoProject {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string;
}

interface DemoConversation {
  id: string;
  project_id: string;
  title: string;
  messages: any[];
  created_at: string;
  updated_at: string;
}

class DemoStorageService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ClarityHubDemo';
  private readonly DB_VERSION = 2;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create files store
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('project_id', 'project_id', { unique: false });
        }

        // Create projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
        }

        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationsStore.createIndex('project_id', 'project_id', { unique: false });
        }

        // Create documents store for rich editor content
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', { keyPath: 'id' });
          documentsStore.createIndex('project_id', 'project_id', { unique: false });
        }
      };
    });
  }

  // File Operations
  async saveFile(file: File, projectId: string, exhibitId?: string, exhibitTitle?: string): Promise<DemoFile> {
    if (!this.db) await this.init();

    const fileContent = await file.arrayBuffer();
    const demoFile: DemoFile = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      content: fileContent,
      project_id: projectId,
      exhibit_id: exhibitId,
      exhibit_title: exhibitTitle,
      uploaded_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.add(demoFile);

      request.onsuccess = () => resolve(demoFile);
      request.onerror = () => reject(request.error);
    });
  }

  async getFiles(projectId: string): Promise<DemoFile[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const index = store.index('project_id');
      const request = index.getAll(projectId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getFileBlob(fileId: string): Promise<Blob | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(fileId);

      request.onsuccess = () => {
        const file = request.result;
        if (file) {
          resolve(new Blob([file.content], { type: file.type }));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateFileExhibit(fileId: string, exhibitId: string, exhibitTitle: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      
      store.get(fileId).onsuccess = (event) => {
        const file = (event.target as IDBRequest).result;
        if (file) {
          file.exhibit_id = exhibitId;
          file.exhibit_title = exhibitTitle;
          
          const updateRequest = store.put(file);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('File not found'));
        }
      };
    });
  }

  // Project Operations
  async saveProject(project: DemoProject): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.put(project);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProjects(): Promise<DemoProject[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Conversation Operations
  async saveConversation(conversation: DemoConversation): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const request = store.put(conversation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConversations(projectId: string): Promise<DemoConversation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const index = store.index('project_id');
      const request = index.getAll(projectId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Document Operations (Rich Editor Content)
  async saveDocument(documentId: string, projectId: string, content: string, title: string = 'Untitled Document'): Promise<void> {
    if (!this.db) await this.init();

    const document = {
      id: documentId,
      project_id: projectId,
      title,
      content,
      updated_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.put(document);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDocument(documentId: string): Promise<any | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.get(documentId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getProjectDocuments(projectId: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const index = store.index('project_id');
      const request = index.getAll(projectId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Initialize demo data
  async initializeDemoData(): Promise<void> {
    if (!this.db) await this.init();

    // Check if demo project already exists
    const existingProjects = await this.getProjects();
    if (existingProjects.length > 0) {
      console.log('Demo data already exists, skipping initialization');
      return;
    }

    // Create demo project
    const demoProject: DemoProject = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Acme Corp. v. Widget Industries',
      description: 'Contract dispute regarding manufacturing components - Demo Case',
      created_at: new Date().toISOString(),
      status: 'active'
    };

    await this.saveProject(demoProject);

    // Create demo document
    const welcomeContent = `
      <h1>Welcome to Clarity Hub - Demo Mode</h1>
      <p>This is your persistent demo environment. Any changes you make here will be saved locally and persist across browser sessions.</p>
      
      <h2>Demo Features Available:</h2>
      <ul>
        <li><strong>File Upload & Analysis:</strong> Upload real files and get AI-powered analysis</li>
        <li><strong>Exhibit Management:</strong> Automatic exhibit ID generation and management</li>
        <li><strong>AI Chat Assistant:</strong> Get personalized legal insights and document help</li>
        <li><strong>Document Editing:</strong> Full rich-text editor with auto-save</li>
        <li><strong>Persistent Storage:</strong> All your demo data persists across sessions</li>
      </ul>
      
      <h2>Try These Demo Actions:</h2>
      <ol>
        <li>Upload a PDF or document file using the "Upload Files" tab</li>
        <li>Ask the AI Assistant questions about your case</li>
        <li>Edit this document and see auto-save in action</li>
        <li>Generate exhibit IDs and manage your evidence</li>
      </ol>
      
      <p><em>This demo uses local browser storage, so your data stays private and persists across sessions.</em></p>
    `;

    await this.saveDocument(
      'demo-welcome-doc',
      demoProject.id,
      welcomeContent,
      'Demo Case - Welcome Document'
    );

    console.log('Demo data initialized successfully');
  }

  // Clear all demo data
  async clearDemoData(): Promise<void> {
    if (!this.db) await this.init();

    const stores = ['files', 'projects', 'conversations', 'documents'];
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, 'readwrite');
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === stores.length) resolve();
      };

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = checkComplete;
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Export/Import for backup
  async exportDemoData(): Promise<string> {
    const [projects, files, conversations, documents] = await Promise.all([
      this.getProjects(),
      this.getFiles('11111111-1111-1111-1111-111111111111'),
      this.getConversations('11111111-1111-1111-1111-111111111111'),
      this.getProjectDocuments('11111111-1111-1111-1111-111111111111')
    ]);

    // Convert ArrayBuffers to base64 for JSON serialization
    const serializedFiles = files.map(file => ({
      ...file,
      content: btoa(String.fromCharCode(...new Uint8Array(file.content)))
    }));

    return JSON.stringify({
      projects,
      files: serializedFiles,
      conversations,
      documents,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

export const demoStorage = new DemoStorageService();
export default demoStorage;