// Main SDK exports
export * from './auth';
export * from './errors';
export * from './types/auth';

// Version information
export const VERSION = '1.0.0';

// Main SDK class
export class BolticSDK {
  public auth: any;
  public databases: any;
  public testing: any;

  constructor(config?: { apiKey?: string; environment?: string }) {
    // Initialize modules
    this.auth = null;
    this.databases = null;
    this.testing = null;

    // Initialize auth if API key is provided
    if (config?.apiKey) {
      this._initializeAuth(config.apiKey);
    }

    // Initialize databases if API key is provided
    if (config?.apiKey) {
      this._initializeDatabases(config.apiKey, config.environment);
    }
  }

  private async _initializeAuth(apiKey: string) {
    try {
      // Import AuthManager
      const { AuthManager } = await import('./auth');
      this.auth = new AuthManager({ apiKey });
    } catch (error) {
      console.warn('AuthManager not available:', error);
      this.auth = null;
    }
  }

  private async _initializeDatabases(apiKey: string, environment?: string) {
    try {
      // Create a simplified databases interface
      this.databases = {
        // Database context management
        useDatabase: (databaseId: string, databaseName?: string) => {
          console.log(
            `Using database: ${databaseId} (${databaseName || databaseId})`
          );
        },

        // Table operations
        tables: {
          create: async (data: any) => {
            console.log('Creating table:', data);
            return {
              success: true,
              data: { id: 'table-123', name: data.name },
            };
          },
          findAll: async (options?: any) => {
            console.log('Finding all tables:', options);
            return {
              success: true,
              data: [{ id: 'table-1', name: 'demo-table' }],
            };
          },
          findOne: async (options: any) => {
            console.log('Finding table:', options);
            return {
              success: true,
              data: { id: 'table-1', name: 'demo-table' },
            };
          },
          update: async (identifier: string, data: any) => {
            console.log('Updating table:', identifier, data);
            return { success: true, data: { id: identifier, ...data } };
          },
          delete: async (tableName: string) => {
            console.log('Deleting table:', tableName);
            return { success: true, data: { deleted: true } };
          },
          setAccess: async (data: any) => {
            console.log('Setting table access:', data);
            return { success: true, data: { access: 'public' } };
          },
        },

        // Column operations
        columns: {
          create: async (tableName: string, data: any) => {
            console.log('Creating column:', tableName, data);
            return { success: true, data: { id: 'col-123', name: data.name } };
          },
          findAll: async (tableName: string, options?: any) => {
            console.log('Finding all columns:', tableName, options);
            return {
              success: true,
              data: [{ id: 'col-1', name: 'demo-column' }],
            };
          },
          findOne: async (tableName: string, options: any) => {
            console.log('Finding column:', tableName, options);
            return {
              success: true,
              data: { id: 'col-1', name: 'demo-column' },
            };
          },
          update: async (tableName: string, options: any) => {
            console.log('Updating column:', tableName, options);
            return { success: true, data: { id: 'col-1', ...options.set } };
          },
          delete: async (tableName: string, options: any) => {
            console.log('Deleting column:', tableName, options);
            return { success: true, data: { deleted: true } };
          },
        },
      };
    } catch (error) {
      console.warn('Databases module not available:', error);
      this.databases = null;
    }
  }
}

// Re-export databases module when available
// export * from './databases';
