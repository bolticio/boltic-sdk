# Documentation Agent Instructions

## Agent Role and Responsibility

You are the **Documentation Agent** responsible for implementing comprehensive documentation infrastructure for the Boltic Tables SDK. Your mission is to create user-friendly documentation, API reference materials, tutorials, examples, guides, automated documentation generation, and ensure the SDK is accessible to developers of all skill levels with excellent documentation coverage.

## Prerequisites

Before starting, you MUST:

1. **Verify Dependencies**: Ensure Testing Infrastructure Agent has completed ALL tasks
2. **Consult Documentation**: Read `/Docs/Implementation.md` for documentation requirements
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known documentation issues
5. **Review All Agents**: Study all previous agent implementations for complete understanding

## Dependencies

This agent depends on ALL previous agents completion. Verify these exist:

- Complete SDK client infrastructure and functionality
- All resource classes with full API implementations
- Comprehensive testing infrastructure and examples
- API integration layer with real endpoint mappings
- Performance benchmarks and optimization data

## Primary Tasks

### Task 1: Documentation Infrastructure Setup

**Duration**: 2-3 days
**Priority**: Critical

#### 1.1 Documentation Site Configuration

Create `docs/config/vitepress.config.ts`:

```typescript
import { defineConfig } from 'vitepress';
import { SearchPlugin } from 'vitepress-plugin-search';
import { generateApiReference } from './api-reference-generator';

export default defineConfig({
  title: 'Boltic Tables SDK',
  description: 'Comprehensive JavaScript SDK for Boltic Tables infrastructure',
  base: '/boltic-sdk/',

  themeConfig: {
    logo: '/boltic-logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Migration', link: '/migration/' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/contributing' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Client & Authentication', link: '/guide/concepts/client' },
            { text: 'Database Context', link: '/guide/concepts/database' },
            { text: 'API Methods', link: '/guide/concepts/api-methods' },
            { text: 'Error Handling', link: '/guide/concepts/error-handling' },
            { text: 'Caching', link: '/guide/concepts/caching' },
          ],
        },
        {
          text: 'Working with Data',
          items: [
            { text: 'Database Operations', link: '/guide/database/' },
            { text: 'Table Management', link: '/guide/tables/' },
            { text: 'Schema & Columns', link: '/guide/columns/' },
            { text: 'Record Operations', link: '/guide/records/' },
            { text: 'SQL Queries', link: '/guide/sql/' },
          ],
        },
        {
          text: 'Advanced Features',
          items: [
            { text: 'Vector Search', link: '/guide/advanced/vector-search' },
            { text: 'Aggregations', link: '/guide/advanced/aggregations' },
            {
              text: 'Bulk Operations',
              link: '/guide/advanced/bulk-operations',
            },
            {
              text: 'Performance Optimization',
              link: '/guide/advanced/performance',
            },
            { text: 'Real-time Updates', link: '/guide/advanced/realtime' },
          ],
        },
        {
          text: 'Best Practices',
          items: [
            { text: 'Security', link: '/guide/best-practices/security' },
            { text: 'Performance', link: '/guide/best-practices/performance' },
            {
              text: 'Error Handling',
              link: '/guide/best-practices/error-handling',
            },
            { text: 'Testing', link: '/guide/best-practices/testing' },
            {
              text: 'Production Deployment',
              link: '/guide/best-practices/production',
            },
          ],
        },
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Client', link: '/api/client' },
            { text: 'Database', link: '/api/database' },
            { text: 'Table', link: '/api/table' },
            { text: 'Column', link: '/api/column' },
            { text: 'Record', link: '/api/record' },
            { text: 'SQL', link: '/api/sql' },
            { text: 'Types', link: '/api/types' },
            { text: 'Errors', link: '/api/errors' },
          ],
        },
      ],

      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Basic CRUD', link: '/examples/basic-crud' },
            { text: 'E-commerce Store', link: '/examples/ecommerce' },
            { text: 'Blog Platform', link: '/examples/blog' },
            { text: 'Analytics Dashboard', link: '/examples/analytics' },
            { text: 'Real-time Chat', link: '/examples/chat' },
            { text: 'Data Migration', link: '/examples/migration' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            { text: 'React', link: '/examples/react' },
            { text: 'Vue.js', link: '/examples/vue' },
            { text: 'Next.js', link: '/examples/nextjs' },
            { text: 'Express.js', link: '/examples/express' },
            { text: 'Serverless', link: '/examples/serverless' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/boltic/database-js' },
      { icon: 'discord', link: 'https://discord.gg/boltic' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Boltic Technologies',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/boltic/database-js/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    lineNumbers: true,
    config: (md) => {
      // Add custom markdown plugins
      md.use(require('markdown-it-container'), 'tip');
      md.use(require('markdown-it-container'), 'warning');
      md.use(require('markdown-it-container'), 'danger');
    },
  },

  vite: {
    plugins: [
      SearchPlugin({
        previewLength: 62,
        buttonLabel: 'Search',
        placeholder: 'Search docs',
      }),
    ],
  },
});
```

#### 1.2 TypeDoc Configuration for API Reference

Create `typedoc.config.js`:

```javascript
module.exports = {
  entryPoints: ['./src/index.ts'],
  out: './docs/api-reference',
  theme: 'default',
  plugin: ['typedoc-plugin-markdown', 'typedoc-vitepress-theme'],

  // Output options
  readme: 'none',
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,

  // Markdown options
  hideBreadcrumbs: true,
  hideInPageTOC: true,
  disableSources: false,

  // VitePress integration
  outputFileStrategy: 'modules',
  flattenOutputFiles: false,

  // Custom options
  categorizeByGroup: true,
  categoryOrder: [
    'Client',
    'Database',
    'Table',
    'Column',
    'Record',
    'SQL',
    'Types',
    'Errors',
    'Utilities',
  ],

  // Navigation
  navigation: {
    includeCategories: true,
    includeGroups: true,
  },

  // Validation
  validation: {
    notExported: true,
    invalidLink: true,
    notDocumented: false,
  },
};
```

#### 1.3 Documentation Build Scripts

Update `package.json`:

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "npm run docs:api && vitepress build docs",
    "docs:preview": "vitepress preview docs",
    "docs:api": "typedoc && node scripts/process-api-docs.js",
    "docs:examples": "node scripts/generate-examples.js",
    "docs:test": "node scripts/test-examples.js",
    "docs:lint": "markdownlint docs/**/*.md",
    "docs:deploy": "npm run docs:build && node scripts/deploy-docs.js"
  },
  "devDependencies": {
    "vitepress": "^1.0.0",
    "typedoc": "^0.25.0",
    "typedoc-plugin-markdown": "^3.17.0",
    "typedoc-vitepress-theme": "^1.0.0",
    "markdownlint-cli": "^0.37.0",
    "vitepress-plugin-search": "^1.0.0"
  }
}
```

### Task 2: API Reference Documentation

**Duration**: 3-4 days
**Priority**: Critical

#### 2.1 Automated API Documentation Generator

Create `scripts/process-api-docs.js`:

````javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ApiDocumentationProcessor {
  constructor() {
    this.apiDocsPath = path.join(__dirname, '../docs/api-reference');
    this.outputPath = path.join(__dirname, '../docs/api');
  }

  async processApiDocs() {
    console.log('Processing API documentation...');

    // Generate TypeDoc documentation
    await this.generateTypedocDocs();

    // Process and enhance the generated docs
    await this.enhanceApiDocs();

    // Generate navigation and index files
    await this.generateNavigation();

    console.log('API documentation processing complete!');
  }

  async generateTypedocDocs() {
    try {
      execSync('typedoc', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to generate TypeDoc documentation:', error);
      throw error;
    }
  }

  async enhanceApiDocs() {
    const files = this.getAllMarkdownFiles(this.apiDocsPath);

    for (const file of files) {
      await this.enhanceMarkdownFile(file);
    }
  }

  async enhanceMarkdownFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add code example links
    content = this.addCodeExamples(content);

    // Add related documentation links
    content = this.addRelatedLinks(content);

    // Improve formatting
    content = this.improveFormatting(content);

    // Add frontmatter for VitePress
    content = this.addFrontmatter(content, filePath);

    fs.writeFileSync(filePath, content);
  }

  addCodeExamples(content) {
    // Add live code examples for API methods
    return content.replace(
      /## (\w+)\n\n(.*?)\n\n/gs,
      (match, methodName, description) => {
        const exampleCode = this.generateExampleCode(methodName);
        return `## ${methodName}\n\n${description}\n\n### Example\n\n\`\`\`typescript\n${exampleCode}\n\`\`\`\n\n`;
      }
    );
  }

  generateExampleCode(methodName) {
    const examples = {
      create: `
const result = await client.database.create({
  name: 'my_database',
  slug: 'my-database',
  description: 'My awesome database'
});

console.log('Created database:', result.data.id);`,

      findAll: `
const databases = await client.database.findAll({
  where: { created_by: 'user@example.com' },
  limit: 10,
  sort: [{ field: 'created_at', order: 'desc' }]
});

console.log('Found databases:', databases.data.length);`,

      insert: `
const record = await db.record.insert('products', {
  title: 'MacBook Pro',
  price: 2499.99,
  category_id: 1,
  metadata: { color: 'silver', storage: '512GB' }
});

console.log('Created record:', record.data.id);`,
    };

    return examples[methodName] || `// Example usage for ${methodName}`;
  }

  addRelatedLinks(content) {
    // Add links to related guides and examples
    const relatedLinks = {
      Database: '/guide/database/',
      Table: '/guide/tables/',
      Record: '/guide/records/',
      SQL: '/guide/sql/',
    };

    let enhanced = content;
    Object.entries(relatedLinks).forEach(([term, link]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'g');
      enhanced = enhanced.replace(regex, `[${term}](${link})`);
    });

    return enhanced;
  }

  improveFormatting(content) {
    // Improve code block formatting
    content = content.replace(/```typescript\n/g, '```typescript\n');

    // Add proper spacing
    content = content.replace(/\n\n\n+/g, '\n\n');

    // Format parameter tables
    content = content.replace(
      /\| Parameter \| Type \| Description \|/g,
      '| Parameter | Type | Description |\n|-----------|------|-------------|'
    );

    return content;
  }

  addFrontmatter(content, filePath) {
    const filename = path.basename(filePath, '.md');
    const title = filename.charAt(0).toUpperCase() + filename.slice(1);

    const frontmatter = `---
title: ${title}
description: API reference for ${title}
---

`;

    return frontmatter + content;
  }

  getAllMarkdownFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        files.push(...this.getAllMarkdownFiles(itemPath));
      } else if (item.endsWith('.md')) {
        files.push(itemPath);
      }
    }

    return files;
  }

  async generateNavigation() {
    // Generate API navigation based on the processed files
    const navigation = this.buildNavigationStructure();

    const indexContent = `---
title: API Reference
description: Complete API reference for Boltic Tables SDK
---

# API Reference

${navigation}

## Quick Start

\`\`\`typescript
import { createClient } from '@boltic/database-js';

const client = createClient('your-api-key', {
  environment: 'prod'
});

const db = client.useDatabase('database-id');
\`\`\`

## Core Classes

- [**Client**](./client) - Main SDK client for authentication and configuration
- [**Database**](./database) - Database management operations
- [**Table**](./table) - Table schema and management
- [**Column**](./column) - Column/field operations
- [**Record**](./record) - Data CRUD operations
- [**SQL**](./sql) - Direct SQL query execution

## Type Definitions

- [**Types**](./types) - TypeScript type definitions
- [**Errors**](./errors) - Error classes and handling
`;

    fs.writeFileSync(path.join(this.outputPath, 'index.md'), indexContent);
  }

  buildNavigationStructure() {
    // Build navigation based on the actual file structure
    return `
## Navigation

- [Client](./client) - SDK initialization and configuration
- [Database Operations](./database) - Database management
- [Table Operations](./table) - Table schema and management  
- [Column Operations](./column) - Field management
- [Record Operations](./record) - Data CRUD operations
- [SQL Operations](./sql) - Direct SQL queries
- [Type Definitions](./types) - TypeScript types
- [Error Handling](./errors) - Error classes
`;
  }
}

// Execute if run directly
if (require.main === module) {
  const processor = new ApiDocumentationProcessor();
  processor.processApiDocs().catch(console.error);
}

module.exports = { ApiDocumentationProcessor };
````

#### 2.2 Manual API Documentation Enhancement

Create comprehensive API documentation files:

Create `docs/api/client.md`:

````markdown
---
title: Client
description: Main SDK client for authentication and configuration
---

# Client

The main Boltic Tables SDK client provides authentication, configuration, and database context management.

## createClient

Creates a new Boltic Tables client instance.

```typescript
function createClient(apiKey: string, options?: ClientOptions): BolticClient;
```
````

### Parameters

| Parameter | Type            | Description                |
| --------- | --------------- | -------------------------- |
| `apiKey`  | `string`        | Your Boltic Tables API key |
| `options` | `ClientOptions` | Optional configuration     |

### Options

```typescript
interface ClientOptions {
  environment?: 'local' | 'sit' | 'uat' | 'prod';
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  cacheEnabled?: boolean;
  debug?: boolean;
  headers?: Record<string, string>;
}
```

### Example

```typescript
import { createClient } from '@boltic/database-js';

// Basic client
const client = createClient('your-api-key');

// Client with options
const client = createClient('your-api-key', {
  environment: 'prod',
  timeout: 30000,
  retryAttempts: 3,
  cacheEnabled: true,
  debug: false,
});
```

## BolticClient

The main client class that provides access to all SDK functionality.

### Properties

| Property      | Type               | Description         |
| ------------- | ------------------ | ------------------- |
| `database`    | `DatabaseResource` | Database operations |
| `environment` | `Environment`      | Current environment |

### Methods

#### useDatabase

Sets the database context for subsequent operations.

```typescript
useDatabase(databaseId: string): DatabaseClient
```

**Example:**

```typescript
const db = client.useDatabase('database-123');
```

#### updateApiKey

Updates the API key for authentication.

```typescript
updateApiKey(apiKey: string): void
```

**Example:**

```typescript
client.updateApiKey('new-api-key');
```

### Database Context

When you call `useDatabase()`, you get a database-scoped client:

```typescript
const db = client.useDatabase('my-database-id');

// All operations now use this database context
const tables = await db.table.findAll();
const records = await db.record.findAll('products');
```

## Error Handling

All client methods return results in a consistent format:

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Example:**

```typescript
const result = await client.database.create(dbData);

if (result.error) {
  console.error('Error:', result.error.message);
} else {
  console.log('Success:', result.data);
}
```

## Related Guides

- [Getting Started](/guide/getting-started)
- [Configuration](/guide/configuration)
- [Authentication](/guide/concepts/client)
- [Error Handling](/guide/concepts/error-handling)

````

### Task 3: User Guides and Tutorials
**Duration**: 4-5 days
**Priority**: Critical

#### 3.1 Getting Started Guide
Create `docs/guide/getting-started.md`:
```markdown
---
title: Getting Started
description: Quick start guide for Boltic Tables SDK
---

# Getting Started

Welcome to the Boltic Tables SDK! This guide will help you get up and running quickly with the JavaScript SDK for Boltic Tables.

## What is Boltic Tables SDK?

The Boltic Tables SDK (`@boltic/database-js`) is a lightweight, environment-aware JavaScript library that provides an ORM-like interface for interacting with Boltic Tables infrastructure. It supports both browser and Node.js environments.

## Key Features

- **Dual API Styles** - Direct methods and fluent interface
- **TypeScript Support** - Full type safety and IntelliSense
- **Environment Aware** - Works in browsers, Node.js, and serverless
- **Intelligent Caching** - Built-in performance optimizations
- **Error Handling** - Comprehensive error management
- **Vector Search** - Advanced similarity search capabilities
- **SQL Support** - Direct SQL query execution

## Installation

::: code-group

```bash [npm]
npm install @boltic/database-js
````

```bash [yarn]
yarn add @boltic/database-js
```

```bash [pnpm]
pnpm add @boltic/database-js
```

:::

## Quick Start

### 1. Initialize the Client

```typescript
import { createClient } from '@boltic/database-js';

const client = createClient('your-api-key', {
  environment: 'prod', // 'local', 'sit', 'uat', or 'prod'
});
```

### 2. Create a Database

```typescript
const { data: database, error } = await client.database.create({
  name: 'my_awesome_database',
  slug: 'my-awesome-database',
  description: 'My first Boltic database',
});

if (error) {
  console.error('Error creating database:', error.message);
} else {
  console.log('Database created:', database.id);
}
```

### 3. Set Database Context

```typescript
const db = client.useDatabase(database.id);
```

### 4. Create a Table

```typescript
const { data: table } = await db.table.create({
  table_name: 'products',
  schema: [
    {
      name: 'title',
      type: 'text',
      is_nullable: false,
    },
    {
      name: 'price',
      type: 'currency',
      is_nullable: false,
      currency_format: 'USD',
    },
    {
      name: 'category_id',
      type: 'number',
      is_nullable: false,
    },
  ],
  description: 'Product catalog',
});
```

### 5. Insert Records

::: code-group

```typescript [Method 1: Direct API]
const { data: record } = await db.record.insert('products', {
  title: 'MacBook Pro',
  price: 2499.99,
  category_id: 1,
});
```

```typescript [Method 2: Fluent API]
const { data: record } = await db.from('products').insert({
  title: 'MacBook Pro',
  price: 2499.99,
  category_id: 1,
});
```

:::

### 6. Query Records

::: code-group

```typescript [Method 1: Direct API]
const { data: products } = await db.record.findAll('products', {
  where: {
    category_id: 1,
    price: { $gt: 1000 },
  },
  sort: [{ field: 'price', order: 'desc' }],
  limit: 10,
});
```

```typescript [Method 2: Fluent API]
const { data: products } = await db
  .from('products')
  .where('category_id', '=', 1)
  .where('price', '>', 1000)
  .orderBy('price', 'desc')
  .limit(10)
  .findAll();
```

:::

## Environment Configuration

The SDK supports multiple environments:

| Environment | Description                | Base URL                      |
| ----------- | -------------------------- | ----------------------------- |
| `local`     | Local development          | `http://localhost:8000`       |
| `sit`       | System Integration Testing | Boltic SIT environment        |
| `uat`       | User Acceptance Testing    | Boltic UAT environment        |
| `prod`      | Production                 | Boltic production environment |

```typescript
const client = createClient('your-api-key', {
  environment: 'prod',
  timeout: 30000,
  retryAttempts: 3,
  cacheEnabled: true,
});
```

## Authentication

All requests require a valid API key. You can obtain your API key from the Boltic dashboard.

::: tip
Store your API key securely and never expose it in client-side code. Use environment variables:

```typescript
const client = createClient(process.env.BOLTIC_API_KEY);
```

:::

## Error Handling

The SDK uses a consistent error handling pattern:

```typescript
const result = await db.record.insert('products', data);

if (result.error) {
  switch (result.error.code) {
    case 'VALIDATION_ERROR':
      console.error('Validation failed:', result.error.details);
      break;
    case 'UNAUTHORIZED':
      console.error('Invalid API key');
      break;
    default:
      console.error('Unknown error:', result.error.message);
  }
} else {
  console.log('Success:', result.data);
}
```

## TypeScript Support

The SDK is built with TypeScript and provides full type safety:

```typescript
import {
  createClient,
  DatabaseWithId,
  RecordWithId,
} from '@boltic/database-js';

interface Product extends RecordWithId {
  title: string;
  price: number;
  category_id: number;
}

const products = await db.record.findAll<Product>('products', {
  where: { category_id: 1 },
});

// products.data is now typed as Product[]
```

## Next Steps

Now that you have the basics down, explore these guides:

- [Database Operations](/guide/database/) - Learn about database management
- [Table Management](/guide/tables/) - Working with table schemas
- [Record Operations](/guide/records/) - CRUD operations and querying
- [SQL Queries](/guide/sql/) - Direct SQL execution
- [Vector Search](/guide/advanced/vector-search) - Similarity search
- [Performance](/guide/best-practices/performance) - Optimization tips

## Examples

Check out our comprehensive examples:

- [E-commerce Store](/examples/ecommerce) - Complete online store
- [Blog Platform](/examples/blog) - Content management system
- [Analytics Dashboard](/examples/analytics) - Real-time analytics
- [React Integration](/examples/react) - Frontend integration

## Need Help?

- [API Reference](/api/) - Complete API documentation
- [GitHub Issues](https://github.com/boltic/database-js/issues) - Bug reports and feature requests
- [Discord Community](https://discord.gg/boltic) - Community support
- [Documentation](mailto:docs@boltic.io) - Documentation feedback

````

#### 3.2 Complete User Guide Series
Create comprehensive guides for each major feature:

Create `docs/guide/database/index.md`:
```markdown
---
title: Database Operations
description: Complete guide to database management in Boltic Tables SDK
---

# Database Operations

Learn how to manage databases with the Boltic Tables SDK. This guide covers creating, listing, updating, and deleting databases.

## Overview

Databases in Boltic Tables serve as containers for your tables and data. Each database is isolated and can contain multiple tables with their own schemas and records.

## Creating Databases

### Basic Database Creation

::: code-group

```typescript [Method 1: Direct API]
const { data: database, error } = await client.database.create({
  name: 'ecommerce_store',
  slug: 'ecommerce-store',
  description: 'E-commerce application database'
});
````

```typescript [Method 2: Fluent API]
const { data: database, error } = await client.database().create({
  name: 'ecommerce_store',
  slug: 'ecommerce-store',
  description: 'E-commerce application database',
});
```

:::

### Database Configuration Options

```typescript
interface DatabaseCreateRequest {
  name: string; // Internal database name
  slug: string; // URL-friendly identifier
  description?: string; // Optional description
  resource_id?: string; // Optional connector resource ID
}
```

**Field Requirements:**

- `name`: Must be alphanumeric with underscores (e.g., `my_database`)
- `slug`: Must be lowercase with hyphens (e.g., `my-database`)
- `description`: Optional human-readable description

### Example: Creating Multiple Databases

```typescript
const databases = [
  {
    name: 'user_management',
    slug: 'user-management',
    description: 'User accounts and profiles',
  },
  {
    name: 'product_catalog',
    slug: 'product-catalog',
    description: 'Product inventory and details',
  },
  {
    name: 'order_processing',
    slug: 'order-processing',
    description: 'Orders and transactions',
  },
];

const results = await Promise.all(
  databases.map((db) => client.database.create(db))
);

console.log(
  'Created databases:',
  results.map((r) => r.data?.id)
);
```

## Listing Databases

### Basic Listing

::: code-group

```typescript [Method 1: Direct API]
const { data: databases } = await client.database.findAll();
```

```typescript [Method 2: Fluent API]
const { data: databases } = await client.database().findAll();
```

:::

### Filtered Listing

::: code-group

```typescript [Method 1: Direct API]
const { data: databases } = await client.database.findAll({
  where: {
    created_by: 'user@example.com',
    is_public: true,
  },
  fields: ['id', 'name', 'description', 'created_at'],
  sort: [{ field: 'created_at', order: 'desc' }],
  limit: 10,
});
```

```typescript [Method 2: Fluent API]
const { data: databases } = await client
  .database()
  .where({
    created_by: 'user@example.com',
    is_public: true,
  })
  .select(['id', 'name', 'description', 'created_at'])
  .orderBy('created_at', 'desc')
  .limit(10)
  .findAll();
```

:::

### Pagination

```typescript
let offset = 0;
const limit = 20;
let allDatabases = [];

while (true) {
  const { data: batch } = await client.database.findAll({
    limit,
    offset,
    sort: [{ field: 'name', order: 'asc' }],
  });

  if (!batch || batch.length === 0) break;

  allDatabases.push(...batch);
  offset += limit;
}

console.log('Total databases:', allDatabases.length);
```

## Finding Specific Databases

### Find by ID

```typescript
const { data: database } = await client.database.findOne({
  where: { id: 'database-uuid' },
});
```

### Find by Slug

```typescript
const { data: database } = await client.database.findOne({
  where: { slug: 'ecommerce-store' },
});
```

### Find by Name

```typescript
const { data: database } = await client.database.findOne({
  where: { name: 'ecommerce_store' },
});
```

## Database Context

Once you have a database, set it as the context for subsequent operations:

```typescript
// Get database first
const { data: database } = await client.database.findOne({
  where: { slug: 'ecommerce-store' },
});

// Set database context
const db = client.useDatabase(database.id);

// Now all operations use this database
const tables = await db.table.findAll();
const records = await db.record.findAll('products');
```

## Updating Databases

::: code-group

```typescript [Method 1: Direct API]
const { data: updated } = await client.database.update(
  { id: 'database-uuid' },
  {
    description: 'Updated description',
    is_public: false,
  }
);
```

```typescript [Method 2: Fluent API]
const { data: updated } = await client
  .database()
  .where({ id: 'database-uuid' })
  .set({
    description: 'Updated description',
    is_public: false,
  })
  .update();
```

:::

### Updatable Fields

You can update these database properties:

- `description` - Database description
- `is_public` - Public access flag
- `resource_id` - Connector resource ID

## Deleting Databases

::: warning
Deleting a database will permanently remove all tables and data within it. This action cannot be undone.
:::

::: code-group

```typescript [Method 1: Direct API]
await client.database.delete({
  where: { id: 'database-uuid' },
});
```

```typescript [Method 2: Fluent API]
await client.database().where({ id: 'database-uuid' }).delete();
```

:::

### Safe Deletion Pattern

```typescript
// Confirm before deletion
const { data: database } = await client.database.findOne({
  where: { id: 'database-uuid' },
});

if (database) {
  console.log(`About to delete database: ${database.name}`);
  console.log(`Tables will be lost: ${database.table_count}`);

  // Add confirmation logic here
  const confirmed = confirm('Are you sure?');

  if (confirmed) {
    await client.database.delete({
      where: { id: 'database-uuid' },
    });
    console.log('Database deleted successfully');
  }
}
```

## Error Handling

Common database operation errors:

```typescript
try {
  const result = await client.database.create(databaseData);

  if (result.error) {
    switch (result.error.code) {
      case 'VALIDATION_ERROR':
        console.error('Invalid database data:', result.error.details);
        break;
      case 'DUPLICATE_NAME':
        console.error('Database name already exists');
        break;
      case 'UNAUTHORIZED':
        console.error('Invalid API key or permissions');
        break;
      default:
        console.error('Unexpected error:', result.error.message);
    }
  }
} catch (error) {
  console.error('Network or system error:', error);
}
```

## Best Practices

### Naming Conventions

```typescript
// Good naming
const dbConfig = {
  name: 'user_management_prod', // Clear, descriptive
  slug: 'user-management-prod', // URL-friendly
  description: 'Production user management database',
};

// Avoid
const badConfig = {
  name: 'db1', // Too generic
  slug: 'DB_1', // Invalid characters
  description: '', // Empty description
};
```

### Environment-Specific Databases

```typescript
const environment = process.env.NODE_ENV || 'development';

const dbConfig = {
  name: `ecommerce_${environment}`,
  slug: `ecommerce-${environment}`,
  description: `E-commerce database for ${environment}`,
};

const { data: database } = await client.database.create(dbConfig);
```

### Database Inventory Management

```typescript
class DatabaseManager {
  constructor(client) {
    this.client = client;
    this.cache = new Map();
  }

  async getOrCreateDatabase(slug) {
    // Check cache first
    if (this.cache.has(slug)) {
      return this.cache.get(slug);
    }

    // Try to find existing database
    let { data: database } = await this.client.database.findOne({
      where: { slug },
    });

    // Create if doesn't exist
    if (!database) {
      const result = await this.client.database.create({
        name: slug.replace('-', '_'),
        slug,
        description: `Auto-created database for ${slug}`,
      });
      database = result.data;
    }

    // Cache for future use
    this.cache.set(slug, database);
    return database;
  }
}
```

## Related Topics

- [Table Management](/guide/tables/) - Working with table schemas
- [Configuration](/guide/configuration) - Client configuration options
- [Error Handling](/guide/concepts/error-handling) - Comprehensive error handling
- [Best Practices](/guide/best-practices/performance) - Performance optimization

## Examples

- [Multi-tenant Application](/examples/multi-tenant) - Database per tenant
- [Environment Management](/examples/environments) - Dev/staging/prod databases
- [Database Migration](/examples/migration) - Moving data between databases

````

### Task 4: Example Applications and Code Samples
**Duration**: 3-4 days
**Priority**: High

#### 4.1 Complete Example Applications
Create `docs/examples/ecommerce.md`:
```markdown
---
title: E-commerce Store
description: Complete e-commerce application example using Boltic Tables SDK
---

# E-commerce Store Example

This example demonstrates building a complete e-commerce store using the Boltic Tables SDK. We'll cover product catalog, user management, shopping cart, and order processing.

## Project Structure

````

ecommerce-store/
├── src/
│ ├── models/
│ │ ├── database.js
│ │ ├── products.js
│ │ ├── users.js
│ │ ├── orders.js
│ │ └── cart.js
│ ├── services/
│ │ ├── auth.js
│ │ ├── catalog.js
│ │ ├── checkout.js
│ │ └── search.js
│ └── app.js
├── package.json
└── README.md

````

## Database Setup

First, let's set up our database and tables:

```javascript
// src/models/database.js
import { createClient } from '@boltic/database-js';

const client = createClient(process.env.BOLTIC_API_KEY, {
  environment: process.env.NODE_ENV === 'production' ? 'prod' : 'uat'
});

export class DatabaseManager {
  constructor() {
    this.client = client;
    this.db = null;
  }

  async initialize() {
    // Create or get the ecommerce database
    let { data: database } = await this.client.database.findOne({
      where: { slug: 'ecommerce-store' }
    });

    if (!database) {
      const result = await this.client.database.create({
        name: 'ecommerce_store',
        slug: 'ecommerce-store',
        description: 'E-commerce application database'
      });
      database = result.data;
    }

    this.db = this.client.useDatabase(database.id);
    await this.createTables();
    return this.db;
  }

  async createTables() {
    const tables = [
      {
        name: 'users',
        schema: this.getUserSchema()
      },
      {
        name: 'categories',
        schema: this.getCategorySchema()
      },
      {
        name: 'products',
        schema: this.getProductSchema()
      },
      {
        name: 'cart_items',
        schema: this.getCartSchema()
      },
      {
        name: 'orders',
        schema: this.getOrderSchema()
      },
      {
        name: 'order_items',
        schema: this.getOrderItemSchema()
      }
    ];

    for (const table of tables) {
      await this.createTableIfNotExists(table.name, table.schema);
    }
  }

  async createTableIfNotExists(tableName, schema) {
    const { data: existingTable } = await this.db.table.findOne({
      where: { table_name: tableName }
    });

    if (!existingTable) {
      await this.db.table.create({
        table_name: tableName,
        schema,
        description: `${tableName} table for e-commerce store`
      });
      console.log(`Created table: ${tableName}`);
    }
  }

  getUserSchema() {
    return [
      { name: 'email', type: 'email', is_nullable: false, is_unique: true },
      { name: 'password_hash', type: 'text', is_nullable: false },
      { name: 'first_name', type: 'text', is_nullable: false },
      { name: 'last_name', type: 'text', is_nullable: false },
      { name: 'phone', type: 'phone-number', is_nullable: true },
      { name: 'address', type: 'json', is_nullable: true },
      { name: 'is_active', type: 'checkbox', is_nullable: false },
      { name: 'email_verified', type: 'checkbox', is_nullable: false },
      { name: 'last_login', type: 'date-time', is_nullable: true }
    ];
  }

  getCategorySchema() {
    return [
      { name: 'name', type: 'text', is_nullable: false, is_unique: true },
      { name: 'slug', type: 'text', is_nullable: false, is_unique: true },
      { name: 'description', type: 'long-text', is_nullable: true },
      { name: 'parent_id', type: 'text', is_nullable: true },
      { name: 'sort_order', type: 'number', is_nullable: false },
      { name: 'is_active', type: 'checkbox', is_nullable: false }
    ];
  }

  getProductSchema() {
    return [
      { name: 'title', type: 'text', is_nullable: false },
      { name: 'slug', type: 'text', is_nullable: false, is_unique: true },
      { name: 'description', type: 'long-text', is_nullable: true },
      { name: 'price', type: 'currency', is_nullable: false, currency_format: 'USD' },
      { name: 'sale_price', type: 'currency', is_nullable: true, currency_format: 'USD' },
      { name: 'sku', type: 'text', is_nullable: false, is_unique: true },
      { name: 'category_id', type: 'text', is_nullable: false },
      { name: 'inventory_count', type: 'number', is_nullable: false },
      { name: 'images', type: 'json', is_nullable: true },
      { name: 'specifications', type: 'json', is_nullable: true },
      { name: 'tags', type: 'json', is_nullable: true },
      { name: 'is_featured', type: 'checkbox', is_nullable: false },
      { name: 'is_active', type: 'checkbox', is_nullable: false },
      { name: 'weight', type: 'number', is_nullable: true },
      { name: 'dimensions', type: 'json', is_nullable: true }
    ];
  }

  getCartSchema() {
    return [
      { name: 'user_id', type: 'text', is_nullable: false },
      { name: 'product_id', type: 'text', is_nullable: false },
      { name: 'quantity', type: 'number', is_nullable: false },
      { name: 'price_at_time', type: 'currency', is_nullable: false, currency_format: 'USD' },
      { name: 'session_id', type: 'text', is_nullable: true }
    ];
  }

  getOrderSchema() {
    return [
      { name: 'user_id', type: 'text', is_nullable: false },
      { name: 'order_number', type: 'text', is_nullable: false, is_unique: true },
      { name: 'status', type: 'dropdown', selectable_items: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
      { name: 'total_amount', type: 'currency', is_nullable: false, currency_format: 'USD' },
      { name: 'shipping_amount', type: 'currency', is_nullable: false, currency_format: 'USD' },
      { name: 'tax_amount', type: 'currency', is_nullable: false, currency_format: 'USD' },
      { name: 'shipping_address', type: 'json', is_nullable: false },
      { name: 'billing_address', type: 'json', is_nullable: false },
      { name: 'payment_method', type: 'text', is_nullable: false },
      { name: 'payment_status', type: 'dropdown', selectable_items: ['pending', 'paid', 'failed', 'refunded'] },
      { name: 'tracking_number', type: 'text', is_nullable: true },
      { name: 'notes', type: 'long-text', is_nullable: true }
    ];
  }

  getOrderItemSchema() {
    return [
      { name: 'order_id', type: 'text', is_nullable: false },
      { name: 'product_id', type: 'text', is_nullable: false },
      { name: 'quantity', type: 'number', is_nullable: false },
      { name: 'unit_price', type: 'currency', is_nullable: false, currency_format: 'USD' },
      { name: 'total_price', type: 'currency', is_nullable: false, currency_format: 'USD' },
      { name: 'product_snapshot', type: 'json', is_nullable: false }
    ];
  }
}

export default DatabaseManager;
````

## Product Catalog Service

```javascript
// src/services/catalog.js
export class CatalogService {
  constructor(db) {
    this.db = db;
  }

  async createCategory(categoryData) {
    return await this.db.record.insert('categories', {
      ...categoryData,
      slug: this.generateSlug(categoryData.name),
      is_active: true,
      sort_order: categoryData.sort_order || 0,
    });
  }

  async getCategories() {
    return await this.db.record.findAll('categories', {
      where: { is_active: true },
      sort: [{ field: 'sort_order', order: 'asc' }],
    });
  }

  async createProduct(productData) {
    const { data: product } = await this.db.record.insert('products', {
      ...productData,
      slug: this.generateSlug(productData.title),
      is_active: true,
      is_featured: productData.is_featured || false,
    });

    return product;
  }

  async getProducts(options = {}) {
    const queryOptions = {
      where: { is_active: true },
      sort: [{ field: 'created_at', order: 'desc' }],
      limit: options.limit || 20,
      offset: options.offset || 0,
    };

    // Add category filter
    if (options.categoryId) {
      queryOptions.where.category_id = options.categoryId;
    }

    // Add price range filter
    if (options.minPrice || options.maxPrice) {
      queryOptions.where.price = {};
      if (options.minPrice) queryOptions.where.price.$gte = options.minPrice;
      if (options.maxPrice) queryOptions.where.price.$lte = options.maxPrice;
    }

    // Add featured filter
    if (options.featured) {
      queryOptions.where.is_featured = true;
    }

    return await this.db.record.findAll('products', queryOptions);
  }

  async searchProducts(searchTerm, options = {}) {
    return await this.db.record.findAll('products', {
      where: {
        $or: [
          { title: { $ilike: `%${searchTerm}%` } },
          { description: { $ilike: `%${searchTerm}%` } },
          { tags: { $like: `%${searchTerm}%` } },
        ],
        is_active: true,
      },
      sort: [{ field: 'title', order: 'asc' }],
      limit: options.limit || 20,
    });
  }

  async getProductBySlug(slug) {
    return await this.db.record.findOne('products', {
      where: { slug, is_active: true },
    });
  }

  async getFeaturedProducts(limit = 10) {
    return await this.db.record.findAll('products', {
      where: { is_featured: true, is_active: true },
      sort: [{ field: 'created_at', order: 'desc' }],
      limit,
    });
  }

  async updateInventory(productId, quantity) {
    const { data: product } = await this.db.record.findOne('products', {
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const newCount = product.inventory_count + quantity;
    if (newCount < 0) {
      throw new Error('Insufficient inventory');
    }

    return await this.db.record.update('products', {
      set: { inventory_count: newCount },
      where: { id: productId },
    });
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
```

## Shopping Cart Service

```javascript
// src/services/cart.js
export class CartService {
  constructor(db) {
    this.db = db;
  }

  async addToCart(userId, productId, quantity = 1) {
    // Get product details
    const { data: product } = await this.db.record.findOne('products', {
      where: { id: productId, is_active: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.inventory_count < quantity) {
      throw new Error('Insufficient inventory');
    }

    // Check if item already in cart
    const { data: existingItem } = await this.db.record.findOne('cart_items', {
      where: { user_id: userId, product_id: productId },
    });

    if (existingItem) {
      // Update quantity
      return await this.db.record.update('cart_items', {
        set: { quantity: existingItem.quantity + quantity },
        where: { id: existingItem.id },
      });
    } else {
      // Add new item
      return await this.db.record.insert('cart_items', {
        user_id: userId,
        product_id: productId,
        quantity,
        price_at_time: product.sale_price || product.price,
      });
    }
  }

  async getCartItems(userId) {
    // Get cart items with product details using SQL join
    return await this.db.sql.execute({
      query: `
        SELECT 
          ci.*,
          p.title,
          p.slug,
          p.price,
          p.sale_price,
          p.images,
          p.inventory_count,
          (ci.quantity * ci.price_at_time) as line_total
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = $1 AND p.is_active = true
        ORDER BY ci.created_at DESC
      `,
      params: [userId],
    });
  }

  async updateCartItem(userId, itemId, quantity) {
    if (quantity <= 0) {
      return await this.removeFromCart(userId, itemId);
    }

    return await this.db.record.update('cart_items', {
      set: { quantity },
      where: { id: itemId, user_id: userId },
    });
  }

  async removeFromCart(userId, itemId) {
    return await this.db.record.delete('cart_items', {
      where: { id: itemId, user_id: userId },
    });
  }

  async clearCart(userId) {
    return await this.db.record.delete('cart_items', {
      where: { user_id: userId },
    });
  }

  async getCartTotal(userId) {
    const { data: result } = await this.db.sql.execute({
      query: `
        SELECT 
          COUNT(*) as item_count,
          SUM(ci.quantity * ci.price_at_time) as total_amount
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = $1 AND p.is_active = true
      `,
      params: [userId],
    });

    return result.rows[0];
  }
}
```

## Order Processing Service

```javascript
// src/services/checkout.js
export class CheckoutService {
  constructor(db) {
    this.db = db;
    this.cartService = new CartService(db);
  }

  async createOrder(userId, orderData) {
    // Get cart items
    const { data: cartResult } = await this.cartService.getCartItems(userId);
    const cartItems = cartResult.rows;

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate inventory
    for (const item of cartItems) {
      if (item.inventory_count < item.quantity) {
        throw new Error(`Insufficient inventory for ${item.title}`);
      }
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.line_total, 0);
    const shippingAmount = this.calculateShipping(
      subtotal,
      orderData.shipping_address
    );
    const taxAmount = this.calculateTax(subtotal, orderData.billing_address);
    const totalAmount = subtotal + shippingAmount + taxAmount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const { data: order } = await this.db.record.insert('orders', {
      user_id: userId,
      order_number: orderNumber,
      status: 'pending',
      total_amount: totalAmount,
      shipping_amount: shippingAmount,
      tax_amount: taxAmount,
      shipping_address: orderData.shipping_address,
      billing_address: orderData.billing_address,
      payment_method: orderData.payment_method,
      payment_status: 'pending',
      notes: orderData.notes,
    });

    // Create order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price_at_time,
      total_price: item.line_total,
      product_snapshot: {
        title: item.title,
        slug: item.slug,
        images: item.images,
      },
    }));

    await this.db.record.bulkInsert('order_items', { data: orderItems });

    // Update inventory
    for (const item of cartItems) {
      await this.db.record.update('products', {
        set: { inventory_count: item.inventory_count - item.quantity },
        where: { id: item.product_id },
      });
    }

    // Clear cart
    await this.cartService.clearCart(userId);

    return order;
  }

  async getOrder(orderId, userId) {
    const { data: order } = await this.db.record.findOne('orders', {
      where: { id: orderId, user_id: userId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get order items
    const { data: items } = await this.db.record.findAll('order_items', {
      where: { order_id: orderId },
    });

    return { ...order, items };
  }

  async getUserOrders(userId, options = {}) {
    return await this.db.record.findAll('orders', {
      where: { user_id: userId },
      sort: [{ field: 'created_at', order: 'desc' }],
      limit: options.limit || 20,
      offset: options.offset || 0,
    });
  }

  async updateOrderStatus(orderId, status, trackingNumber = null) {
    const updateData = { status };
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    return await this.db.record.update('orders', {
      set: updateData,
      where: { id: orderId },
    });
  }

  calculateShipping(subtotal, address) {
    // Simple shipping calculation
    if (subtotal > 100) return 0; // Free shipping over $100
    if (address.country !== 'US') return 25; // International shipping
    return 10; // Domestic shipping
  }

  calculateTax(subtotal, address) {
    // Simple tax calculation (varies by state)
    const taxRates = {
      CA: 0.0875, // California
      NY: 0.08, // New York
      TX: 0.0625, // Texas
      // Add more states as needed
    };

    const rate = taxRates[address.state] || 0.05; // Default 5%
    return subtotal * rate;
  }

  async generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}
```

## Usage Example

```javascript
// src/app.js
import DatabaseManager from './models/database.js';
import { CatalogService } from './services/catalog.js';
import { CartService } from './services/cart.js';
import { CheckoutService } from './services/checkout.js';

async function setupEcommerceStore() {
  // Initialize database
  const dbManager = new DatabaseManager();
  const db = await dbManager.initialize();

  // Initialize services
  const catalog = new CatalogService(db);
  const cart = new CartService(db);
  const checkout = new CheckoutService(db);

  // Create sample categories
  const electronics = await catalog.createCategory({
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    sort_order: 1,
  });

  const computers = await catalog.createCategory({
    name: 'Computers',
    description: 'Laptops, desktops, and accessories',
    parent_id: electronics.data.id,
    sort_order: 1,
  });

  // Create sample products
  const products = [
    {
      title: 'MacBook Pro 16"',
      description: 'Powerful laptop for professionals',
      price: 2499.99,
      sku: 'MBP-16-2024',
      category_id: computers.data.id,
      inventory_count: 50,
      is_featured: true,
      specifications: {
        processor: 'M3 Pro',
        memory: '16GB',
        storage: '512GB SSD',
        display: '16-inch Liquid Retina XDR',
      },
    },
    {
      title: 'iPhone 15 Pro',
      description: 'Latest iPhone with Pro features',
      price: 999.99,
      sale_price: 899.99,
      sku: 'IP15-PRO-2024',
      category_id: electronics.data.id,
      inventory_count: 100,
      is_featured: true,
    },
  ];

  for (const productData of products) {
    await catalog.createProduct(productData);
  }

  console.log('E-commerce store setup complete!');

  // Example usage
  await demonstrateUsage(catalog, cart, checkout);
}

async function demonstrateUsage(catalog, cart, checkout) {
  const userId = 'user-123';

  // Browse products
  const { data: featuredProducts } = await catalog.getFeaturedProducts();
  console.log('Featured products:', featuredProducts.length);

  // Add to cart
  const product = featuredProducts[0];
  await cart.addToCart(userId, product.id, 1);

  // View cart
  const { data: cartItems } = await cart.getCartItems(userId);
  console.log('Cart items:', cartItems.rows.length);

  // Create order
  const orderData = {
    shipping_address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'US',
    },
    billing_address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'US',
    },
    payment_method: 'credit_card',
  };

  const order = await checkout.createOrder(userId, orderData);
  console.log('Order created:', order.order_number);
}

// Run the setup
setupEcommerceStore().catch(console.error);
```

## Key Features Demonstrated

1. **Database Schema Design** - Comprehensive e-commerce schema
2. **Product Catalog** - Category management and product search
3. **Shopping Cart** - Add/remove items with inventory validation
4. **Order Processing** - Complete checkout workflow
5. **Inventory Management** - Real-time inventory updates
6. **SQL Queries** - Complex joins and calculations
7. **Error Handling** - Comprehensive error management
8. **Data Validation** - Input validation and constraints

## Running the Example

1. **Install Dependencies**

```bash
npm install @boltic/database-js
```

2. **Set Environment Variables**

```bash
export BOLTIC_API_KEY="your-api-key"
export NODE_ENV="development"
```

3. **Run the Setup**

```bash
node src/app.js
```

## Next Steps

- Add user authentication
- Implement payment processing
- Add email notifications
- Create admin dashboard
- Add product reviews and ratings
- Implement wishlist functionality

## Related Examples

- [React E-commerce Frontend](/examples/react-ecommerce)
- [Order Analytics Dashboard](/examples/analytics)
- [Inventory Management System](/examples/inventory)

````

### Task 5: Migration and Upgrade Guides
**Duration**: 1-2 days
**Priority**: Medium

#### 5.1 Migration Guide
Create `docs/migration/index.md`:
```markdown
---
title: Migration Guide
description: Guide for migrating from direct API usage to Boltic Tables SDK
---

# Migration Guide

This guide helps you migrate from direct Boltic Tables API usage to the new JavaScript SDK.

## Why Migrate?

The Boltic Tables SDK provides:

- **Type Safety** - Full TypeScript support
- **Simplified API** - Intuitive method names and parameters
- **Error Handling** - Structured error responses
- **Performance** - Built-in caching and optimization
- **Developer Experience** - Better debugging and documentation

## Migration Overview

### Before (Direct API)

```javascript
// Direct HTTP requests
const response = await fetch('https://api.boltic.io/v1/tables/databases', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-boltic-token': 'your-api-key'
  },
  body: JSON.stringify({
    name: 'my_database',
    slug: 'my-database'
  })
});

const result = await response.json();
if (!result.success) {
  throw new Error(result.error.message);
}
````

### After (SDK)

```javascript
import { createClient } from '@boltic/database-js';

const client = createClient('your-api-key');

const { data: database, error } = await client.database.create({
  name: 'my_database',
  slug: 'my-database',
});

if (error) {
  console.error('Error:', error.message);
}
```

## Step-by-Step Migration

### Step 1: Install the SDK

```bash
npm install @boltic/database-js
```

### Step 2: Replace HTTP Client

Replace your HTTP client setup:

```javascript
// Before
const API_BASE_URL = 'https://api.boltic.io/service/panel/boltic-tables';
const API_KEY = process.env.BOLTIC_API_KEY;

async function makeRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-boltic-token': API_KEY,
      ...options.headers,
    },
  });

  return await response.json();
}

// After
import { createClient } from '@boltic/database-js';

const client = createClient(process.env.BOLTIC_API_KEY, {
  environment: 'prod',
});
```

### Step 3: Update Database Operations

#### Creating Databases

```javascript
// Before
const database = await makeRequest('/v1/tables/databases', {
  method: 'POST',
  body: JSON.stringify({
    name: 'my_database',
    slug: 'my-database',
    description: 'My database',
  }),
});

// After
const { data: database, error } = await client.database.create({
  name: 'my_database',
  slug: 'my-database',
  description: 'My database',
});
```

#### Listing Databases

```javascript
// Before
const databases = await makeRequest('/v1/tables/databases');

// After
const { data: databases } = await client.database.findAll();
```

### Step 4: Update Table Operations

#### Creating Tables

```javascript
// Before
const table = await makeRequest('/v1/tables', {
  method: 'POST',
  body: JSON.stringify({
    table_name: 'products',
    schema: [
      { name: 'title', type: 'text', is_nullable: false },
      { name: 'price', type: 'currency', currency_format: 'USD' },
    ],
  }),
});

// After
const db = client.useDatabase('database-id');

const { data: table } = await db.table.create({
  table_name: 'products',
  schema: [
    { name: 'title', type: 'text', is_nullable: false },
    { name: 'price', type: 'currency', currency_format: 'USD' },
  ],
});
```

### Step 5: Update Record Operations

#### Creating Records

```javascript
// Before
const record = await makeRequest(`/v1/tables/${tableId}/records`, {
  method: 'POST',
  body: JSON.stringify({
    data: {
      title: 'MacBook Pro',
      price: 2499.99,
    },
  }),
});

// After
const { data: record } = await db.record.insert('products', {
  title: 'MacBook Pro',
  price: 2499.99,
});
```

#### Querying Records

```javascript
// Before
const products = await makeRequest(
  `/v1/tables/${tableId}/records?where=${encodeURIComponent(
    JSON.stringify({ price: { gt: 1000 } })
  )}&limit=10`
);

// After
const { data: products } = await db.record.findAll('products', {
  where: { price: { $gt: 1000 } },
  limit: 10,
});
```

### Step 6: Update Error Handling

```javascript
// Before
try {
  const response = await makeRequest(endpoint, options);
  if (!response.success) {
    throw new Error(response.error.message);
  }
  return response.data;
} catch (error) {
  console.error('API Error:', error.message);
  throw error;
}

// After
const result = await client.database.create(data);

if (result.error) {
  switch (result.error.code) {
    case 'VALIDATION_ERROR':
      console.error('Validation failed:', result.error.details);
      break;
    case 'UNAUTHORIZED':
      console.error('Invalid API key');
      break;
    default:
      console.error('Error:', result.error.message);
  }
} else {
  console.log('Success:', result.data);
}
```

## Migration Checklist

### Environment Setup

- [ ] Install `@boltic/database-js` package
- [ ] Replace HTTP client with SDK client
- [ ] Update environment configuration
- [ ] Test API key and connectivity

### Database Operations

- [ ] Replace database creation calls
- [ ] Replace database listing calls
- [ ] Replace database update calls
- [ ] Replace database deletion calls

### Table Operations

- [ ] Replace table creation with schema
- [ ] Replace table listing and filtering
- [ ] Replace table updates and renaming
- [ ] Replace table deletion

### Record Operations

- [ ] Replace record insertion (single and bulk)
- [ ] Replace record querying and filtering
- [ ] Replace record updates
- [ ] Replace record deletion

### Advanced Features

- [ ] Replace SQL query execution
- [ ] Replace aggregation queries
- [ ] Add vector search (if needed)
- [ ] Update caching strategy

### Error Handling

- [ ] Replace error handling patterns
- [ ] Update error logging
- [ ] Add retry logic
- [ ] Test error scenarios

### Testing

- [ ] Update unit tests
- [ ] Update integration tests
- [ ] Test all migrated functionality
- [ ] Verify performance improvements

## Common Migration Issues

### Issue 1: Different Response Format

**Problem**: SDK returns `{ data, error }` format vs direct API response.

**Solution**: Update response handling:

```javascript
// Before
const response = await makeRequest(endpoint);
const data = response.data;

// After
const { data, error } = await client.database.findAll();
if (error) {
  // Handle error
} else {
  // Use data
}
```

### Issue 2: Query Parameter Format

**Problem**: SDK uses different query operators.

**Solution**: Update query operators:

```javascript
// Before
const where = { price: { gt: 100 } };

// After
const where = { price: { $gt: 100 } };
```

### Issue 3: Authentication Headers

**Problem**: Manual header management no longer needed.

**Solution**: Remove manual header setup:

```javascript
// Before
headers: {
  'x-boltic-token': apiKey,
  'x-boltic-database': databaseId
}

// After
// Headers managed automatically by SDK
const db = client.useDatabase(databaseId);
```

## Performance Considerations

### Caching

The SDK includes built-in caching. Remove manual caching:

```javascript
// Before (manual caching)
const cacheKey = `databases:${userId}`;
let databases = cache.get(cacheKey);
if (!databases) {
  databases = await makeRequest('/v1/tables/databases');
  cache.set(cacheKey, databases, 300);
}

// After (automatic caching)
const { data: databases } = await client.database.findAll();
// Caching handled automatically
```

### Connection Pooling

The SDK handles connection pooling automatically:

```javascript
// Before (manual connection management)
const httpAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});

// After (automatic connection pooling)
// No manual configuration needed
```

## Testing Migration

### Unit Tests

Update your test mocks:

```javascript
// Before
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// After
import { createClient } from '@boltic/database-js';
jest.mock('@boltic/database-js');
const mockClient = createClient as jest.MockedFunction<typeof createClient>;
```

### Integration Tests

Update integration test setup:

```javascript
// Before
const testClient = new HttpClient(TEST_API_KEY);

// After
const testClient = createClient(TEST_API_KEY, {
  environment: 'sit',
});
```

## Gradual Migration Strategy

### Phase 1: Setup and Infrastructure

1. Install SDK alongside existing code
2. Create SDK client instance
3. Test basic connectivity
4. Update configuration management

### Phase 2: Core Operations

1. Migrate database operations
2. Migrate table operations
3. Test thoroughly after each operation type

### Phase 3: Data Operations

1. Migrate record CRUD operations
2. Migrate query operations
3. Migrate bulk operations

### Phase 4: Advanced Features

1. Migrate SQL queries
2. Add vector search (if applicable)
3. Optimize caching strategy

### Phase 5: Testing and Cleanup

1. Update all tests
2. Remove old HTTP client code
3. Update documentation
4. Performance testing

## Rollback Plan

Keep the old implementation alongside the new one during migration:

```javascript
const USE_SDK = process.env.USE_BOLTIC_SDK === 'true';

if (USE_SDK) {
  // Use SDK
  const { data } = await client.database.findAll();
  return data;
} else {
  // Use direct API
  const response = await makeRequest('/v1/tables/databases');
  return response.data;
}
```

## Migration Tools

### Automated Migration Script

```javascript
// migration-helper.js
const fs = require('fs');
const path = require('path');

class MigrationHelper {
  static replaceAPICallsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace common patterns
    content = content.replace(
      /makeRequest\('\/v1\/tables\/databases'\)/g,
      'client.database.findAll()'
    );

    content = content.replace(
      /makeRequest\('\/v1\/tables\/databases', \{[^}]+\}\)/g,
      'client.database.create(data)'
    );

    fs.writeFileSync(filePath, content);
  }
}
```

## Post-Migration Validation

### Functionality Testing

1. Test all CRUD operations
2. Verify error handling works correctly
3. Check performance improvements
4. Validate caching behavior

### Performance Testing

1. Compare response times
2. Check memory usage
3. Verify caching effectiveness
4. Test concurrent operations

### Monitoring

1. Set up error tracking
2. Monitor API usage patterns
3. Track performance metrics
4. Monitor cache hit rates

## Support

If you encounter issues during migration:

- [GitHub Issues](https://github.com/boltic/database-js/issues) - Report migration issues
- [Discord](https://discord.gg/boltic) - Get community help
- [Migration FAQ](/migration/faq) - Common questions and answers
- [Support](mailto:support@boltic.io) - Direct support for complex migrations

````

### Task 6: Documentation Testing and Validation
**Duration**: 1-2 days
**Priority**: High

#### 6.1 Documentation Testing Script
Create `scripts/test-examples.js`:
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentationTester {
  constructor() {
    this.docsPath = path.join(__dirname, '../docs');
    this.tempPath = path.join(__dirname, '../temp-docs-test');
    this.errors = [];
  }

  async testAllDocumentation() {
    console.log('Testing documentation examples...');

    try {
      await this.setupTestEnvironment();
      await this.extractAndTestCodeBlocks();
      await this.validateLinks();
      await this.checkTypescriptExamples();
      await this.cleanup();

      if (this.errors.length === 0) {
        console.log('✅ All documentation tests passed!');
      } else {
        console.error('❌ Documentation test failures:');
        this.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('Documentation testing failed:', error);
      process.exit(1);
    }
  }

  async setupTestEnvironment() {
    // Create temp directory
    if (fs.existsSync(this.tempPath)) {
      fs.rmSync(this.tempPath, { recursive: true });
    }
    fs.mkdirSync(this.tempPath, { recursive: true });

    // Copy package.json for dependencies
    const packageJson = {
      name: 'docs-test',
      version: '1.0.0',
      type: 'module',
      dependencies: {
        '@boltic/database-js': 'file:../',
        '@types/node': '^20.0.0',
        'typescript': '^5.0.0'
      }
    };

    fs.writeFileSync(
      path.join(this.tempPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Install dependencies
    execSync('npm install', {
      cwd: this.tempPath,
      stdio: 'inherit'
    });
  }

  async extractAndTestCodeBlocks() {
    const markdownFiles = this.getAllMarkdownFiles(this.docsPath);

    for (const file of markdownFiles) {
      await this.testCodeBlocksInFile(file);
    }
  }

  async testCodeBlocksInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.docsPath, filePath);

    // Extract TypeScript/JavaScript code blocks
    const codeBlocks = this.extractCodeBlocks(content);

    for (let i = 0; i < codeBlocks.length; i++) {
      const block = codeBlocks[i];
      if (block.language === 'typescript' || block.language === 'javascript') {
        await this.testCodeBlock(block, `${relativePath}:block-${i + 1}`);
      }
    }
  }

  extractCodeBlocks(content) {
    const blocks = [];
    const regex = /```(\w+)\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      blocks.push({
        language: match[1],
        code: match[2],
        fullMatch: match[0]
      });
    }

    return blocks;
  }

  async testCodeBlock(block, location) {
    try {
      // Skip certain patterns that aren't meant to be executed
      if (this.shouldSkipBlock(block.code)) {
        return;
      }

      // Create test file
      const testFileName = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.ts`;
      const testFilePath = path.join(this.tempPath, testFileName);

      // Wrap code in async function if it contains await
      let testCode = block.code;
      if (testCode.includes('await') && !testCode.includes('async function')) {
        testCode = `
import { createClient } from '@boltic/database-js';

async function testExample() {
  const client = createClient('test-api-key', { environment: 'local' });
  const db = client.useDatabase('test-db-123');

  try {
    ${testCode}
  } catch (error) {
    console.log('Expected error in example:', error.message);
  }
}

testExample().catch(console.error);
`;
      }

      fs.writeFileSync(testFilePath, testCode);

      // Compile TypeScript
      execSync(`npx tsc --noEmit --target es2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports ${testFileName}`, {
        cwd: this.tempPath,
        stdio: 'pipe'
      });

      // Clean up
      fs.unlinkSync(testFilePath);

      console.log(`✅ ${location}: Code block validated`);
    } catch (error) {
      this.errors.push(`${location}: ${error.message}`);
    }
  }

  shouldSkipBlock(code) {
    const skipPatterns = [
      /\/\/ Before/,           // Migration examples
      /\/\/ After/,            // Migration examples
      /console\.log/,          // Simple console examples
      /package\.json/,         // JSON examples
      /npm install/,           // Shell commands
      /yarn add/,              // Shell commands
      /export NODE_ENV/,       // Environment setup
      /^import.*from ['"]@boltic\/database-js['"];?\s*$/m, // Simple imports
    ];

    return skipPatterns.some(pattern => pattern.test(code));
  }

  async validateLinks() {
    console.log('Validating internal links...');

    const markdownFiles = this.getAllMarkdownFiles(this.docsPath);

    for (const file of markdownFiles) {
      await this.validateLinksInFile(file);
    }
  }

  async validateLinksInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.docsPath, filePath);

    // Find markdown links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1];
      const linkPath = match[2];

      // Skip external links and anchors
      if (linkPath.startsWith('http') || linkPath.startsWith('#') || linkPath.startsWith('mailto:')) {
        continue;
      }

      // Resolve relative path
      const resolvedPath = path.resolve(path.dirname(filePath), linkPath.replace(/\.md$/, ''));
      const possiblePaths = [
        resolvedPath + '.md',
        resolvedPath + '/index.md',
        path.join(resolvedPath, 'README.md')
      ];

      const exists = possiblePaths.some(p => fs.existsSync(p));

      if (!exists) {
        this.errors.push(`${relativePath}: Broken link "${linkPath}"`);
      }
    }
  }

  async checkTypescriptExamples() {
    console.log('Checking TypeScript examples compilation...');

    // Find all TypeScript example files
    const exampleFiles = this.findFiles(this.docsPath, '.ts');

    for (const file of exampleFiles) {
      try {
        execSync(`npx tsc --noEmit --target es2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports "${file}"`, {
          cwd: this.tempPath,
          stdio: 'pipe'
        });

        console.log(`✅ ${path.relative(this.docsPath, file)}: TypeScript compilation successful`);
      } catch (error) {
        this.errors.push(`${path.relative(this.docsPath, file)}: TypeScript compilation failed`);
      }
    }
  }

  getAllMarkdownFiles(dir) {
    return this.findFiles(dir, '.md');
  }

  findFiles(dir, extension) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        files.push(...this.findFiles(itemPath, extension));
      } else if (item.endsWith(extension)) {
        files.push(itemPath);
      }
    }

    return files;
  }

  async cleanup() {
    if (fs.existsSync(this.tempPath)) {
      fs.rmSync(this.tempPath, { recursive: true });
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const tester = new DocumentationTester();
  tester.testAllDocumentation().catch(console.error);
}

module.exports = { DocumentationTester };
````

### Task 7: Documentation Deployment and Automation

**Duration**: 1 day
**Priority**: Medium

#### 7.1 GitHub Actions for Documentation

Create `.github/workflows/docs.yml`:

```yaml
name: Documentation

on:
  push:
    branches: [main, develop]
    paths: ['docs/**', 'src/**/*.ts', 'typedoc.config.js']
  pull_request:
    branches: [main]
    paths: ['docs/**', 'src/**/*.ts']

jobs:
  test-docs:
    name: Test Documentation
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Test documentation examples
        run: npm run docs:test

      - name: Lint documentation
        run: npm run docs:lint

  build-docs:
    name: Build Documentation
    runs-on: ubuntu-latest
    needs: test-docs

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate API documentation
        run: npm run docs:api

      - name: Build documentation site
        run: npm run docs:build

      - name: Upload documentation artifacts
        uses: actions/upload-artifact@v3
        with:
          name: documentation
          path: docs/.vitepress/dist/

  deploy-docs:
    name: Deploy Documentation
    runs-on: ubuntu-latest
    needs: build-docs
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Download documentation artifacts
        uses: actions/download-artifact@v3
        with:
          name: documentation
          path: ./dist

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          cname: docs.boltic.io

  validate-links:
    name: Validate Documentation Links
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Check links
        uses: lycheeverse/lychee-action@v1
        with:
          args: 'docs/**/*.md --exclude-all-private --exclude-mail'
          fail: true
```

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Documentation Infrastructure

- [ ] VitePress documentation site with full configuration
- [ ] TypeDoc API reference generation with automation
- [ ] Search functionality and navigation
- [ ] Responsive design and accessibility features
- [ ] Documentation testing and validation scripts

### ✅ API Reference Documentation

- [ ] Complete auto-generated API documentation
- [ ] Enhanced API docs with examples and links
- [ ] Manual API documentation for complex features
- [ ] Type definitions documentation
- [ ] Error handling reference

### ✅ User Guides and Tutorials

- [ ] Comprehensive getting started guide
- [ ] Complete feature guides for all major functionalities
- [ ] Best practices documentation
- [ ] Troubleshooting guides
- [ ] Performance optimization guides

### ✅ Example Applications

- [ ] Complete e-commerce application example
- [ ] Framework integration examples (React, Vue, Express)
- [ ] Real-world use case demonstrations
- [ ] Code samples for all major features
- [ ] Runnable example projects

### ✅ Migration Documentation

- [ ] Comprehensive migration guide from direct API
- [ ] Step-by-step migration process
- [ ] Common issues and solutions
- [ ] Migration tools and automation
- [ ] Rollback strategies

### ✅ Documentation Quality

- [ ] All code examples tested and validated
- [ ] Internal links verified and working
- [ ] TypeScript compilation validation
- [ ] Accessibility compliance
- [ ] SEO optimization

### ✅ Automation and Deployment

- [ ] Automated documentation generation
- [ ] CI/CD pipeline for documentation
- [ ] GitHub Pages deployment
- [ ] Link validation automation
- [ ] Documentation versioning

### ✅ Developer Experience

- [ ] Clear navigation and search
- [ ] Code syntax highlighting
- [ ] Copy-to-clipboard functionality
- [ ] Mobile-responsive design
- [ ] Dark/light theme support

## Error Handling Protocol

If you encounter any issues:

1. **FIRST**: Check `/Docs/Bug_tracking.md` for similar issues
2. **Log the issue** using the template in Bug_tracking.md
3. **Include**: Documentation errors, broken links, example failures
4. **Document the solution** once resolved

## Dependencies for Next Agents

After completion, the following agents can begin work:

- **Performance Optimization Agent** (can reference performance documentation)
- **Release Management Agent** (can use documentation for release notes)

## Critical Notes

- **ENSURE** all code examples are tested and functional
- **VALIDATE** all internal links and references work correctly
- **TEST** documentation across different devices and browsers
- **IMPLEMENT** comprehensive search and navigation
- **AUTOMATE** documentation generation and deployment

Remember: Excellent documentation is critical for developer adoption and success. This comprehensive documentation system will make the SDK accessible to developers of all skill levels and provide the foundation for long-term success.
