# Documentation Agent Instructions

## Agent Role and Responsibility

You are the **Documentation Agent** responsible for implementing comprehensive documentation infrastructure for the Boltic Tables SDK (`boltic-sdk`). Your mission is to create user-friendly documentation using **Docusaurus**, following the **Supabase documentation structure**, covering all SDK functionality including client initialization, table operations, column/field management, and record operations with complete API reference materials, tutorials, examples, and guides.

## Prerequisites

Before starting, you MUST:

1. **Verify Dependencies**: Ensure all previous agents (Core Infrastructure, API Integration, Table Operations, Column Operations, Record Operations, Testing Infrastructure) have completed ALL tasks
2. **Consult Documentation**: Read `/Docs/Implementation.md` for current status and documentation requirements
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known documentation issues
5. **Review Implementation**: Study the actual SDK implementation in `/src` to document real functionality

## Current SDK Implementation Overview

Based on the implemented codebase, the SDK provides:

### Core Components:

- **BolticClient** - Main client class with `createClient()` function
- **Table Operations** - Complete CRUD operations for tables with schema management
- **Column Operations** - Full CRUD operations for columns/fields with all field types
- **Record Operations** - Complete CRUD operations for records with advanced querying
- **TypeScript Support** - Full type definitions and generics
- **Error Handling** - Structured error responses with proper error types

### Key Features Implemented:

- Comprehensive field types (text, number, currency, date-time, vector, etc.)
- Advanced filtering and querying with operators
- Pagination and sorting
- Authentication with API keys
- HTTP adapters (axios/fetch)

## Primary Tasks

### Task 1: Docusaurus Documentation Site Setup

**Duration**: 2-3 days
**Priority**: Critical

#### 1.1 Docusaurus Configuration

Create `docs/docusaurus.config.js`:

```javascript
const { themes } = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Boltic Tables SDK',
  tagline: 'TypeScript SDK for Boltic Tables infrastructure',
  favicon: 'img/favicon.ico',

  url: 'https://docs.boltic.io',
  baseUrl: '/database-js/',

  organizationName: 'bolticio',
  projectName: 'boltic-sdk',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/bolticio/boltic-sdk/tree/main/docs/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: 'G-XXXXXXXXXX',
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/boltic-social-card.jpg',
      navbar: {
        title: 'Boltic Tables SDK',
        logo: {
          alt: 'Boltic Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://github.com/bolticio/boltic-sdk',
            label: 'GitHub',
            position: 'right',
          },
          {
            type: 'docsVersionDropdown',
            position: 'right',
            dropdownActiveClassDisabled: true,
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/introduction',
              },
              {
                label: 'API Reference',
                to: '/reference/javascript/createclient',
              },
              {
                label: 'Examples',
                to: '/examples',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/boltic',
              },
              {
                label: 'GitHub Discussions',
                href: 'https://github.com/bolticio/boltic-sdk/discussions',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/bolticio/boltic-sdk',
              },
              {
                label: 'Changelog',
                to: '/changelog',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Boltic Technologies. Built with Docusaurus.`,
      },
      prism: {
        theme: lightTheme,
        darkTheme: darkTheme,
        additionalLanguages: ['typescript', 'javascript', 'json', 'bash'],
      },
      algolia: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'boltic-sdk',
        contextualSearch: true,
        searchParameters: {},
        searchPagePath: 'search',
      },
      announcementBar: {
        id: 'support_us',
        content:
          '⭐️ If you like Boltic Tables SDK, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/bolticio/boltic-sdk">GitHub</a>! ⭐️',
        backgroundColor: '#fafbfc',
        textColor: '#091E42',
        isCloseable: false,
      },
    }),

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: ['../src/index.ts'],
        tsconfig: '../tsconfig.json',
        out: 'reference/typescript',
        sidebar: {
          categoryLabel: 'TypeScript API',
          position: 2,
          fullNames: true,
        },
      },
    ],
  ],
};

module.exports = config;
```

#### 1.2 Sidebar Configuration

Create `docs/sidebars.js`:

```javascript
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'introduction',
      label: 'Introduction',
    },
    {
      type: 'doc',
      id: 'installing',
      label: 'Installing',
    },
    {
      type: 'doc',
      id: 'initializing',
      label: 'Initializing',
    },
    {
      type: 'doc',
      id: 'typescript-support',
      label: 'TypeScript Support',
    },
    {
      type: 'category',
      label: 'Client',
      collapsed: false,
      items: [
        'client/createclient',
        'client/configuration',
        'client/environment',
        'client/error-handling',
      ],
    },
    {
      type: 'category',
      label: 'Tables',
      collapsed: false,
      items: [
        'tables/overview',
        'tables/create-table',
        'tables/list-tables',
        'tables/get-table',
        'tables/update-table',
        'tables/delete-table',
        'tables/rename-table',
        'tables/table-access',
      ],
    },
    {
      type: 'category',
      label: 'Columns',
      collapsed: false,
      items: [
        'columns/overview',
        'columns/field-types',
        'columns/create-column',
        'columns/list-columns',
        'columns/get-column',
        'columns/update-column',
        'columns/delete-column',
        'columns/column-properties',
      ],
    },
    {
      type: 'category',
      label: 'Records',
      collapsed: false,
      items: [
        'records/overview',
        'records/insert-data',
        'records/fetch-data',
        'records/update-data',
        'records/delete-data',
        'records/using-filters',
        'records/using-modifiers',
        'records/pagination',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsed: true,
      items: [
        'advanced/vector-search',
        'advanced/bulk-operations',
        'advanced/sql-queries',
        'advanced/error-handling',
        'advanced/performance',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: [
        'examples/overview',
        'examples/basic-crud',
        'examples/ecommerce-app',
        'examples/blog-platform',
        'examples/analytics-dashboard',
        'examples/react-integration',
        'examples/vue-integration',
        'examples/nextjs-integration',
      ],
    },
    {
      type: 'category',
      label: 'Migration',
      collapsed: true,
      items: [
        'migration/overview',
        'migration/from-api',
        'migration/changelog',
      ],
    },
  ],

  referenceSidebar: [
    {
      type: 'category',
      label: 'JavaScript Reference',
      collapsed: false,
      items: [
        'reference/javascript/introduction',
        'reference/javascript/createclient',
        'reference/javascript/client',
        'reference/javascript/tables',
        'reference/javascript/columns',
        'reference/javascript/records',
        'reference/javascript/types',
        'reference/javascript/errors',
      ],
    },
  ],
};

module.exports = sidebars;
```

#### 1.3 Package Configuration

Update `package.json` scripts:

```json
{
  "scripts": {
    "docs:start": "docusaurus start",
    "docs:build": "docusaurus build",
    "docs:swizzle": "docusaurus swizzle",
    "docs:deploy": "docusaurus deploy",
    "docs:clear": "docusaurus clear",
    "docs:serve": "docusaurus serve",
    "docs:write-translations": "docusaurus write-translations",
    "docs:write-heading-ids": "docusaurus write-heading-ids",
    "docs:typecheck": "tsc"
  },
  "devDependencies": {
    "@docusaurus/core": "3.0.0",
    "@docusaurus/preset-classic": "3.0.0",
    "@docusaurus/module-type-aliases": "3.0.0",
    "@docusaurus/tsconfig": "3.0.0",
    "@docusaurus/types": "3.0.0",
    "docusaurus-plugin-typedoc": "^0.21.0",
    "typedoc": "^0.25.0",
    "typedoc-plugin-markdown": "^3.17.0"
  }
}
```

### Task 2: Core Documentation Pages (Following Supabase Structure)

**Duration**: 3-4 days
**Priority**: Critical

#### 2.1 Introduction Page

Create `docs/introduction.md`:

````markdown
---
id: introduction
title: Introduction
description: TypeScript SDK for Boltic Tables infrastructure
---

# Introduction

This reference documents every object and method available in Boltic Tables's TypeScript SDK, `boltic-sdk`. You can use the SDK to interact with your Boltic Tables databases, manage table schemas, handle column definitions, and perform record operations with full TypeScript support.

## What is Boltic Tables SDK?

The Boltic Tables SDK (`boltic-sdk`) is a lightweight JavaScript library that provides an ORM-like interface for interacting with Boltic Tables infrastructure. It supports both browser and Node.js environments.

## Key Features

- **🔥 Direct API** - Simple method-based interface
- **📘 TypeScript Support** - Full type safety and IntelliSense
- **🌍 Universal** - Works in browsers, Node.js, and serverless
- **⚡ Optimized Performance** - Smart request handling and efficient operations
- **🛡️ Error Handling** - Comprehensive error management
- **🔍 Vector Search** - Advanced similarity search capabilities
- **💾 SQL Support** - Direct SQL query execution
- **🏗️ Schema Management** - Complete table and column operations

## Quick Start

```typescript
import { createClient } from 'boltic-sdk';

// Create client
const client = createClient('your-api-key');

// Create a table
const { data: table, error } = await client.tables.create({
  name: 'products',
  schema: [
    { name: 'title', type: 'text', is_nullable: false },
    { name: 'price', type: 'currency', currency_format: 'USD' },
  ],
});

// Insert a record
const { data: record } = await client.records.insert('products', {
  title: 'MacBook Pro',
  price: 2499.99,
});

// Query records
const { data: products } = await client.records.findAll('products', {
  where: { price: { $gt: 1000 } },
  limit: 10,
});
```
````

## API Patterns

The SDK provides direct method calls for all operations:

```typescript
// Table operations
await client.tables.create(tableData);
await client.tables.list();
await client.tables.update('products', updateData);

// Column operations
await client.columns.create('products', columnDefinition);
await client.columns.list('products');

// Record operations
await client.records.insert('products', recordData);
await client.records.findAll('products', queryOptions);
```

## Field Types

The SDK supports all Boltic Tables field types:

- **Text Types**: `text`, `long-text`, `email`, `phone-number`, `link`
- **Number Types**: `number`, `currency`
- **Date Types**: `date-time`
- **Boolean**: `checkbox`
- **Selection**: `dropdown`
- **Structured**: `json`
- **Vector Types**: `vector`, `halfvec`, `sparsevec`

## Next Steps

- [Installing](/installing) - Install the SDK
- [Initializing](/initializing) - Set up your client
- [Tables](/tables/overview) - Manage table schemas
- [Columns](/columns/overview) - Handle column definitions
- [Records](/records/overview) - Perform data operations

````

#### 2.2 Installing Page

Create `docs/installing.md`:

```markdown
---
id: installing
title: Installing
description: Install the Boltic Tables SDK
---

# Installing

Install the SDK using your preferred package manager:

## npm

```bash
npm install boltic-sdk
```

## yarn

```bash
yarn add boltic-sdk
```

## pnpm

```bash
pnpm add boltic-sdk
```

## CDN

For direct browser usage:

```html
<script type="module">
  import { createClient } from 'https://cdn.skypack.dev/boltic-sdk';

  const client = createClient('your-api-key');
</script>
```

## TypeScript

The SDK is written in TypeScript and includes comprehensive type definitions. No additional `@types` package is needed.

## Peer Dependencies

The SDK optionally uses axios for HTTP requests. If you don't have axios installed, the SDK will fall back to the fetch API:

```bash
npm install axios  # Optional but recommended
```

## Browser Support

The SDK supports all modern browsers with ES2020 support:

- Chrome 80+
- Firefox 72+
- Safari 13.1+
- Edge 80+

For older browser support, use a transpiler like Babel.

## Node.js Support

Requires Node.js 18.0.0 or higher.

## Import Styles

### ES Modules

```typescript
import { createClient } from 'boltic-sdk';

// Or import specific types
import {
  createClient,
  type BolticClient,
  type TableCreateRequest,
  type RecordData,
} from 'boltic-sdk';
```

### CommonJS

```javascript
const { createClient } = require('boltic-sdk');
```

### Testing Utilities

```typescript
import {
  createTestClient,
  mockApiResponses,
} from 'boltic-sdk/testing';
```

## Verification

Verify the installation by creating a simple client:

```typescript
import { createClient } from 'boltic-sdk';

const client = createClient('test-key');
console.log('SDK installed successfully!');
```

````

#### 2.3 Client Reference Pages

Create `docs/client/createclient.md`:

````markdown
---
id: createclient
title: createClient
description: Create a new Boltic Tables client
---

# createClient

Creates a new Boltic Tables client instance with the specified API key and configuration options.

```typescript
function createClient(apiKey: string, options?: ClientOptions): BolticClient;
```
````

## Parameters

| Parameter | Type            | Required | Description                  |
| --------- | --------------- | -------- | ---------------------------- |
| `apiKey`  | `string`        | ✅       | Your Boltic Tables API key   |
| `options` | `ClientOptions` | ❌       | Client configuration options |

## ClientOptions

```typescript
interface ClientOptions {
  region?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  debug?: boolean;
}
```

### Options Details

| Option          | Type      | Default       | Description                                  |
| --------------- | --------- | ------------- | -------------------------------------------- |
| `timeout`       | `number`  | `30000`       | Request timeout in milliseconds              |
| `region`        | `string`  | `asia-south1` | Region to use for database creation          |
| `retryAttempts` | `number`  | `3`           | Number of retry attempts for failed requests |
| `retryDelay`    | `number`  | `1000`        | Delay between retries in milliseconds        |
| `debug`         | `boolean` | `false`       | Enable debug logging                         |

## Examples

### Basic Client

```typescript
import { createClient } from 'boltic-sdk';

const client = createClient('your-api-key');
```

### Client with Options

```typescript
const client = createClient('your-api-key', {
  timeout: 30000,
  retryAttempts: 3,
});
```

### Development Client

```typescript
const client = createClient('your-api-key', {
  debug: true,
  timeout: 10000,
});
```

## Return Value

Returns a [`BolticClient`](/reference/javascript/client) instance with the following properties:

- `tables` - Table management operations
- `columns` - Column/field operations
- `records` - Record CRUD operations

## Error Handling

```typescript
try {
  const client = createClient('invalid-key');

  // Test the connection
  const result = await client.tables.list();

  if (result.error) {
    console.error('Authentication failed:', result.error.message);
  }
} catch (error) {
  console.error('Client creation failed:', error);
}
```

## Environment Variables

For security, store your API key in environment variables:

```typescript
const client = createClient(process.env.BOLTIC_API_KEY!);
```

## Related

- [Client Configuration](/client/configuration)
- [Error Handling](/client/error-handling)
- [Tables Overview](/tables/overview)

````

### Task 3: API Reference Documentation (Following Supabase Pattern)

**Duration**: 4-5 days
**Priority**: Critical

#### 3.1 Tables Reference

Create `docs/reference/javascript/tables.md`:

```markdown
---
id: tables
title: Tables
description: Table management operations
---

# Tables

Manage table schemas, creation, updates, and deletion with the Boltic Tables SDK.

## create

Create a new table with the specified schema.

```typescript
client.tables.create(data: TableCreateRequest): Promise<ApiResponse<TableCreateResponse>>
````

### Parameters

```typescript
interface TableCreateRequest {
  name: string;
  schema: FieldDefinition[];
  description?: string;
  is_public?: boolean;
}
```

### Example

```typescript
const { data: table, error } = await client.tables.create({
  name: 'products',
  schema: [
    {
      name: 'title',
      type: 'text',
      is_nullable: false,
      is_unique: false,
    },
    {
      name: 'price',
      type: 'currency',
      currency_format: 'USD',
      is_nullable: false,
    },
    {
      name: 'category_id',
      type: 'number',
      is_nullable: false,
    },
  ],
  description: 'Product catalog table',
});

if (error) {
  console.error('Error creating table:', error.message);
} else {
  console.log('Table created:', table.id);
}
```

## list

Retrieve all tables with optional filtering and pagination.

```typescript
client.tables.list(options?: TableQueryOptions): Promise<ApiResponse<TableRecord[]>>
```

### Parameters

```typescript
interface TableQueryOptions {
  where?: Record<string, unknown>;
  fields?: string[];
  sort?: SortOption[];
  limit?: number;
  offset?: number;
}
```

### Example

```typescript
// List all tables
const { data: tables } = await client.tables.list();

// List with filtering
const { data: publicTables } = await client.tables.list({
  where: { is_public: true },
  sort: [{ field: 'created_at', direction: 'desc' }],
  limit: 10,
});
```

## get

Get a specific table by ID or name.

```typescript
client.tables.get(identifier: string): Promise<ApiResponse<TableRecord>>
```

### Example

```typescript
// Get by table name
const { data: table } = await client.tables.get('products');

// Get by table ID
const { data: table } = await client.tables.get('tbl_123456');
```

## update

Update an existing table's properties.

```typescript
client.tables.update(tableName: string, data: TableUpdateRequest): Promise<ApiResponse<TableRecord>>
```

### Parameters

```typescript
interface TableUpdateRequest {
  description?: string;
  is_public?: boolean;
}
```

### Example

```typescript
const { data: updatedTable } = await client.tables.update('products', {
  description: 'Updated product catalog',
  is_public: false,
});
```

## delete

Delete a table and all its data.

```typescript
client.tables.delete(tableName: string): Promise<ApiResponse<{ deletedCount: number }>>
```

:::danger
This action is irreversible and will delete all data in the table.
:::

### Example

```typescript
const { data: result, error } = await client.tables.delete('old_products');

if (error) {
  console.error('Error deleting table:', error.message);
} else {
  console.log('Table deleted successfully');
}
```

## rename

Rename an existing table.

```typescript
client.tables.rename(currentName: string, newName: string): Promise<ApiResponse<TableRecord>>
```

### Example

```typescript
const { data: renamedTable } = await client.tables.rename(
  'products',
  'product_catalog'
);
```

## changeAccess

Change the access level of a table.

```typescript
client.tables.changeAccess(tableName: string, accessData: TableAccessRequest): Promise<ApiResponse<TableRecord>>
```

### Parameters

```typescript
interface TableAccessRequest {
  is_public: boolean;
}
```

### Example

```typescript
// Make table public
const { data: table } = await client.tables.changeAccess('products', {
  is_public: true,
});

// Make table private
const { data: table } = await client.tables.changeAccess('products', {
  is_public: false,
});
```

## Related

- [Columns Reference](/reference/javascript/columns)
- [Records Reference](/reference/javascript/records)
- [Field Types](/columns/field-types)
- [Table Examples](/examples/basic-crud)

````

### Task 4: Comprehensive Examples and Guides

**Duration**: 3-4 days
**Priority**: High

#### 4.1 Complete E-commerce Example

Create `docs/examples/ecommerce-app.md`:

```markdown
---
id: ecommerce-app
title: E-commerce Application
description: Build a complete e-commerce application with Boltic Tables SDK
---

# E-commerce Application

This comprehensive example demonstrates building a complete e-commerce application using the Boltic Tables SDK. We'll create product catalogs, user management, shopping cart, and order processing.

## Project Setup

### Installation

```bash
npm install boltic-sdk dotenv
````

### Client Configuration

```typescript
// config.ts
import { createClient } from 'boltic-sdk';

export const client = createClient(process.env.BOLTIC_API_KEY!, {
  debug: process.env.NODE_ENV !== 'production',
});
```

## Database Schema Design

### 1. Users Table

```typescript
const usersSchema = [
  { name: 'email', type: 'email', is_nullable: false, is_unique: true },
  { name: 'password_hash', type: 'text', is_nullable: false },
  { name: 'first_name', type: 'text', is_nullable: false },
  { name: 'last_name', type: 'text', is_nullable: false },
  { name: 'phone', type: 'phone-number', is_nullable: true },
  { name: 'address', type: 'json', is_nullable: true },
  { name: 'is_active', type: 'checkbox', is_nullable: false },
  { name: 'email_verified', type: 'checkbox', is_nullable: false },
  { name: 'last_login', type: 'date-time', is_nullable: true },
];
```

### 2. Categories Table

```typescript
const categoriesSchema = [
  { name: 'name', type: 'text', is_nullable: false, is_unique: true },
  { name: 'slug', type: 'text', is_nullable: false, is_unique: true },
  { name: 'description', type: 'long-text', is_nullable: true },
  { name: 'parent_id', type: 'text', is_nullable: true },
  { name: 'sort_order', type: 'number', is_nullable: false },
  { name: 'is_active', type: 'checkbox', is_nullable: false },
];
```

### 3. Products Table

```typescript
const productsSchema = [
  { name: 'title', type: 'text', is_nullable: false },
  { name: 'slug', type: 'text', is_nullable: false, is_unique: true },
  { name: 'description', type: 'long-text', is_nullable: true },
  {
    name: 'price',
    type: 'currency',
    is_nullable: false,
    currency_format: 'USD',
  },
  {
    name: 'sale_price',
    type: 'currency',
    is_nullable: true,
    currency_format: 'USD',
  },
  { name: 'sku', type: 'text', is_nullable: false, is_unique: true },
  { name: 'category_id', type: 'text', is_nullable: false },
  { name: 'inventory_count', type: 'number', is_nullable: false },
  { name: 'images', type: 'json', is_nullable: true },
  { name: 'specifications', type: 'json', is_nullable: true },
  { name: 'tags', type: 'json', is_nullable: true },
  { name: 'is_featured', type: 'checkbox', is_nullable: false },
  { name: 'is_active', type: 'checkbox', is_nullable: false },
  { name: 'weight', type: 'number', is_nullable: true },
  { name: 'dimensions', type: 'json', is_nullable: true },
];
```

## Implementation

### 1. Database Setup Service

```typescript
// services/database.ts
export class DatabaseSetup {
  private client: BolticClient;

  constructor(client: BolticClient) {
    this.client = client;
  }

  async initializeDatabase() {
    console.log('Setting up e-commerce database...');

    // Create all tables
    await this.createUsersTable();
    await this.createCategoriesTable();
    await this.createProductsTable();
    await this.createCartTable();
    await this.createOrdersTable();

    console.log('Database setup complete!');
  }

  private async createUsersTable() {
    const { data, error } = await this.client.tables.create({
      name: 'users',
      schema: usersSchema,
      description: 'User accounts and profiles',
    });

    if (error) {
      console.error('Error creating users table:', error.message);
    } else {
      console.log('✅ Users table created:', data.id);
    }
  }

  private async createProductsTable() {
    const { data, error } = await this.client.tables.create({
      name: 'products',
      schema: productsSchema,
      description: 'Product catalog',
    });

    if (error) {
      console.error('Error creating products table:', error.message);
    } else {
      console.log('✅ Products table created:', data.id);
    }
  }

  // ... additional table creation methods
}
```

### 2. Product Catalog Service

```typescript
// services/catalog.ts
export class CatalogService {
  private client: BolticClient;

  constructor(client: BolticClient) {
    this.client = client;
  }

  async createCategory(categoryData: Partial<CategoryData>) {
    return await this.client.records.insert('categories', {
      ...categoryData,
      slug: this.generateSlug(categoryData.name!),
      is_active: true,
      sort_order: categoryData.sort_order || 0,
    });
  }

  async getCategories() {
    return await this.client.records.findAll('categories', {
      where: { is_active: true },
      sort: [{ field: 'sort_order', direction: 'asc' }],
    });
  }

  async createProduct(productData: Partial<ProductData>) {
    return await this.client.records.insert('products', {
      ...productData,
      slug: this.generateSlug(productData.title!),
      is_active: true,
      is_featured: productData.is_featured || false,
    });
  }

  async getProducts(options: ProductQueryOptions = {}) {
    const queryOptions = {
      where: { is_active: true },
      sort: [{ field: 'created_at', direction: 'desc' }],
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

    return await this.client.records.findAll('products', queryOptions);
  }

  async searchProducts(searchTerm: string, options: SearchOptions = {}) {
    return await this.client.records.findAll('products', {
      where: {
        $or: [
          { title: { $ilike: `%${searchTerm}%` } },
          { description: { $ilike: `%${searchTerm}%` } },
          { tags: { $like: `%${searchTerm}%` } },
        ],
        is_active: true,
      },
      sort: [{ field: 'title', direction: 'asc' }],
      limit: options.limit || 20,
    });
  }

  async getFeaturedProducts(limit = 10) {
    return await this.client.records.findAll('products', {
      where: { is_featured: true, is_active: true },
      sort: [{ field: 'created_at', direction: 'desc' }],
      limit,
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
```

### 3. Shopping Cart Service

```typescript
// services/cart.ts
export class CartService {
  private client: BolticClient;

  constructor(client: BolticClient) {
    this.client = client;
  }

  async addToCart(userId: string, productId: string, quantity = 1) {
    // Check if item already in cart
    const { data: existingItem } = await this.client.records.findAll(
      'cart_items',
      {
        where: { user_id: userId, product_id: productId },
        limit: 1,
      }
    );

    if (existingItem && existingItem.length > 0) {
      // Update quantity
      return await this.client.records.updateById(
        'cart_items',
        existingItem[0].id,
        { quantity: existingItem[0].quantity + quantity }
      );
    } else {
      // Add new item
      return await this.client.records.insert('cart_items', {
        user_id: userId,
        product_id: productId,
        quantity,
      });
    }
  }

  async getCartItems(userId: string) {
    return await this.client.records.findAll('cart_items', {
      where: { user_id: userId },
      sort: [{ field: 'created_at', direction: 'desc' }],
    });
  }

  async updateCartItem(userId: string, itemId: string, quantity: number) {
    if (quantity <= 0) {
      return await this.removeFromCart(userId, itemId);
    }

    return await this.client.records.update('cart_items', {
      set: { quantity },
      where: { id: itemId, user_id: userId },
    });
  }

  async removeFromCart(userId: string, itemId: string) {
    return await this.client.records.deleteById('cart_items', itemId);
  }

  async clearCart(userId: string) {
    const { data: cartItems } = await this.getCartItems(userId);

    if (cartItems && cartItems.length > 0) {
      const itemIds = cartItems.map((item) => item.id);
      return await this.client.records.deleteByIds('cart_items', {
        ids: itemIds,
      });
    }
  }
}
```

## Usage Examples

### Setting Up the Application

```typescript
// app.ts
import { client } from './config';
import { DatabaseSetup } from './services/database';
import { CatalogService } from './services/catalog';
import { CartService } from './services/cart';

async function setupEcommerceApp() {
  // Initialize database
  const dbSetup = new DatabaseSetup(client);
  await dbSetup.initializeDatabase();

  // Initialize services
  const catalog = new CatalogService(client);
  const cart = new CartService(client);

  // Create sample data
  await createSampleData(catalog);

  return { catalog, cart };
}

async function createSampleData(catalog: CatalogService) {
  // Create categories
  const { data: electronics } = await catalog.createCategory({
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
  });

  // Create products
  const products = [
    {
      title: 'MacBook Pro 16"',
      description: 'Powerful laptop for professionals',
      price: 2499.99,
      sku: 'MBP-16-2024',
      category_id: electronics.id,
      inventory_count: 50,
      is_featured: true,
      specifications: {
        processor: 'M3 Pro',
        memory: '16GB',
        storage: '512GB SSD',
      },
    },
    {
      title: 'iPhone 15 Pro',
      description: 'Latest iPhone with Pro features',
      price: 999.99,
      sale_price: 899.99,
      sku: 'IP15-PRO-2024',
      category_id: electronics.id,
      inventory_count: 100,
      is_featured: true,
    },
  ];

  for (const product of products) {
    await catalog.createProduct(product);
  }
}

// Usage
setupEcommerceApp()
  .then(({ catalog, cart }) => {
    console.log('E-commerce app setup complete!');

    // Example: Browse featured products
    return catalog.getFeaturedProducts();
  })
  .then(({ data: products }) => {
    console.log('Featured products:', products?.length);
  })
  .catch(console.error);
```

## Key Features Demonstrated

1. **Schema Design** - Complete e-commerce table structure
2. **Service Architecture** - Modular service classes
3. **CRUD Operations** - All database operations
4. **Error Handling** - Comprehensive error management
5. **Type Safety** - Full TypeScript integration
6. **Real-world Patterns** - Shopping cart, inventory management

## Related Examples

- [React Integration](/examples/react-integration)
- [Basic CRUD Operations](/examples/basic-crud)
- [Advanced Filtering](/records/using-filters)

````

### Task 5: Testing and Documentation Validation

**Duration**: 2 days
**Priority**: High

#### 5.1 Documentation Testing Script

Create `scripts/test-docs.js`:

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
    console.log('🧪 Testing documentation examples...');

    try {
      await this.setupTestEnvironment();
      await this.extractAndTestCodeBlocks();
      await this.validateInternalLinks();
      await this.validateTypeScriptExamples();
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
    // Create temp directory for testing
    if (fs.existsSync(this.tempPath)) {
      fs.rmSync(this.tempPath, { recursive: true });
    }
    fs.mkdirSync(this.tempPath, { recursive: true });

    // Create package.json for dependencies
    const packageJson = {
      name: 'docs-test',
      version: '1.0.0',
      type: 'module',
      dependencies: {
        'boltic-sdk': 'file:../',
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
      // Skip certain patterns
      if (this.shouldSkipBlock(block.code)) {
        return;
      }

      // Create test file
      const testFileName = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.ts`;
      const testFilePath = path.join(this.tempPath, testFileName);

      // Wrap code for testing
      let testCode = this.wrapCodeForTesting(block.code);

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

  wrapCodeForTesting(code) {
    // Add imports and wrapper function
    return `
import { createClient } from 'boltic-sdk';

async function testExample() {
  const client = createClient('test-api-key');

  try {
    ${code}
  } catch (error) {
    console.log('Expected error in example:', error.message);
  }
}

testExample().catch(console.error);
`;
  }

  shouldSkipBlock(code) {
    const skipPatterns = [
      /npm install/,
      /yarn add/,
      /pnpm add/,
      /export NODE_ENV/,
      /console\.log/,
      /package\.json/,
    ];

    return skipPatterns.some(pattern => pattern.test(code));
  }

  getAllMarkdownFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        files.push(...this.getAllMarkdownFiles(itemPath));
      } else if (item.endsWith('.md')) {
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

// Execute
if (require.main === module) {
  const tester = new DocumentationTester();
  tester.testAllDocumentation().catch(console.error);
}

module.exports = { DocumentationTester };
````

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Documentation Infrastructure

- [ ] Docusaurus documentation site with complete configuration
- [ ] TypeDoc integration for automated API reference generation
- [ ] Search functionality and navigation following Supabase structure
- [ ] Responsive design and accessibility features
- [ ] Documentation testing and validation scripts

### ✅ API Reference Documentation

- [ ] Complete API documentation for all implemented features:
  - [ ] Client (`createClient`, configuration)
  - [ ] Tables (create, list, get, update, delete, rename, access)
  - [ ] Columns (create, list, get, update, delete, all field types)
  - [ ] Records (insert, findAll, findOne, update, delete)
- [ ] Type definitions documentation
- [ ] Error handling reference with all error types
- [ ] Examples for every API method

### ✅ User Guides and Tutorials

- [ ] Complete getting started guide
- [ ] Installation and setup instructions
- [ ] TypeScript support documentation
- [ ] Best practices and patterns
- [ ] Migration guide from direct API usage

### ✅ Comprehensive Examples

- [ ] Complete e-commerce application example
- [ ] Basic CRUD operations example
- [ ] Framework integration examples (React, Vue, Next.js)
- [ ] Real-world use case demonstrations
- [ ] All examples tested and verified working

### ✅ Documentation Quality

- [ ] All code examples tested and validated
- [ ] Internal links verified and working
- [ ] TypeScript compilation validation
- [ ] Consistent styling following Supabase patterns
- [ ] SEO optimization and meta tags

### ✅ Automation and Deployment

- [ ] Automated documentation generation
- [ ] CI/CD pipeline for documentation builds
- [ ] GitHub Pages or Vercel deployment
- [ ] Link validation automation
- [ ] Documentation versioning support

## Error Handling Protocol

If you encounter any issues:

1. **FIRST**: Check `/Docs/Bug_tracking.md` for similar issues
2. **Log the issue** using the template in Bug_tracking.md
3. **Include**: Documentation errors, broken links, example failures
4. **Document the solution** once resolved

## Critical Notes

- **FOLLOW** Supabase documentation structure exactly
- **TEST** all code examples against actual implementation
- **VALIDATE** TypeScript compilation for all examples
- **ENSURE** responsive design and accessibility
- **IMPLEMENT** comprehensive search and navigation
- **AUTOMATE** documentation generation and deployment

The documentation should serve as the definitive guide for developers using the Boltic Tables SDK, providing clear, tested examples and comprehensive API coverage following proven patterns from Supabase's excellent documentation.
