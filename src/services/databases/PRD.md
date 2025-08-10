# Boltic Tables SDK - Product Requirements Document (PRD)

## 1. Executive Summary

### 1.1 Project Overview

The Boltic Tables SDK (`@boltic/database-js`) is a lightweight, environment-aware JavaScript SDK that provides an ORM-like interface for interacting with Boltic Tables infrastructure. It enables both frontend and backend developers to manage databases, tables, columns, and rows through a unified API.

### 1.2 Business Objectives

- **Developer Experience**: Provide a simple, intuitive API that abstracts away complex HTTP requests
- **Cross-Platform Support**: Enable seamless usage in browsers, Node.js, and serverless environments
- **Performance**: Implement intelligent caching and query optimization
- **Security**: Handle authentication and data encryption transparently
- **Scalability**: Support high-performance operations for enterprise use cases

### 1.3 Success Metrics

- Developer adoption rate and feedback scores
- API response times and error rates
- SDK bundle size optimization
- Documentation completeness and usage analytics

## 2. Product Context

### 2.1 Current Architecture Analysis

Based on the existing Boltic Tables backend service (`athena`), the current API provides:

**Core Endpoints:**

- `/v1/tables/databases` - Database management operations
- `/v1/tables` - Table management operations
- `/v1/tables/:table_id/fields` - Field/column management
- `/v1/tables/:table_id/records` - Record CRUD operations
- `/v1/tables/query` - SQL query execution
- `/v1/tables/transfer` - Bulk data operations

**Authentication:**

- Header-based authentication using `x-boltic-token`
- Account-level database isolation (`bt_{account_id}`)

**Field Types Supported:**

- `text`, `long-text`, `number`, `currency`, `checkbox`
- `dropdown`, `email`, `phone-number`, `link`, `json`
- `date-time`, `vector`, `halfvec`, `sparsevec`

### 2.2 Gap Analysis

**Current Pain Points:**

1. Raw HTTP API requires extensive boilerplate code
2. No client-side validation or type safety
3. Manual pagination and query building
4. No built-in error handling patterns
5. Limited offline capabilities

## 3. Target Users & Use Cases

### 3.1 Primary Users

- **Frontend Developers**: Building React, Angular, Vue.js applications
- **Backend Developers**: Creating Node.js APIs, Express.js services
- **Full-Stack Developers**: Working on Next.js, serverless applications
- **Data Engineers**: Building ETL pipelines and data processing workflows

### 3.2 Use Cases

#### 3.2.1 Frontend Applications

```javascript
// E-commerce product catalog
const products = await db.record.findAll('products', {
  where: { category: 'electronics', price: { $lt: 1000 } },
  sort: [{ field: 'created_at', order: 'desc' }],
  limit: 20,
});

// Real-time dashboard
const metrics = await db.sql({
  query:
    'SELECT COUNT(*) as total_orders, SUM(amount) as revenue FROM orders WHERE created_at > $1',
  params: [new Date('2024-01-01')],
});
```

#### 3.2.2 Backend Services

```javascript
// API endpoint for user management
app.post('/api/users', async (req, res) => {
  const user = await db.record.insert('users', {
    email: req.body.email,
    name: req.body.name,
    role: 'customer',
  });
  res.json(user);
});

// Batch data processing
// await db.record.bulkInsert("analytics_events", eventsBatch);
```

#### 3.2.3 Data Migration & ETL

```javascript
// Migrate data between environments
const sourceData = await sourceDb.record.findAll('legacy_table');
await targetDb.record.bulkInsert('new_table', sourceData);

// Data transformation pipeline
const transformed = sourceData.map((record) => ({
  ...record,
  processed_at: new Date(),
  status: 'migrated',
}));
```

## 4. Functional Requirements

### 4.1 Core SDK Architecture

#### 4.1.1 Client Initialization

```javascript
import { createClient } from '@boltic/database-js';

const boltic = createClient('your-api-key', {
  environment: 'prod' | 'sit' | 'uat', // Default: 'prod'
  debug: false,
  timeout: 30000,
  retryAttempts: 3,
  cacheEnabled: true,
});
```

#### 4.1.2 Database Context Management

```javascript
// Option 1: Explicit database selection
const db = boltic.useDatabase('analytics-db');

// Option 2: Default database (implicit)
const defaultDb = boltic; // Uses preconfigured default DB

// Option 3: Multi-database operations
const userDb = boltic.useDatabase('users');
const analyticsDb = boltic.useDatabase('analytics');
```

### 4.2 Database Operations

#### 4.2.1 Database Management

```javascript
// Create database
**Method 1**
const { data: database, error } = await boltic.database.create({
  name: "my_database",
  slug: "my-database",
  resource_id: "connector_123", // Optional
  description: "Analytics database",
});

**Method 2**
const { data: database, error } = await boltic
  .database()
  .create({
    name: "my_database",
    slug: "my-database",
    resource_id: "connector_123", // Optional
    description: "Analytics database",
  });

// List databases with filtering
**Method 1**
const { data: databases } = await boltic.database.findAll({
  where: { created_by: "user@example.com" },
  fields: ["id", "name", "created_at"],
  sort: [{ field: "created_at", order: "desc" }],
  limit: 20,
  offset: 0,
});

**Method 2**
const { data: databases } = await boltic
  .database()
  .where({ created_by: "user@example.com" })
  .fields(["id", "name", "created_at"])
  .sort([{ field: "created_at", order: "desc" }])
  .limit(20)
  .offset(0)
  .findAll();

// Get database metadata
**Method 1**
const { data: db } = await boltic.database.findOne({
  where: { db_name: "my-database" },
});

**Method 2**
const { data: db } = await boltic
  .database()
  .where({ db_name: "my-database" })
  .findOne();

// Delete database
**Method 1**
await boltic.database.delete({
  where: { name: "database_internal_name" },
});

**Method 2**
await boltic
  .database()
  .where({ name: "database_internal_name" })
  .delete();
```

#### 4.2.2 Table Operations

```javascript
// Create table with schema
**Method 1**
const { data: table } = await db.table.create({
  table_name: "products",
  schema: [
    {
      name: "title",
      type: "text",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      field_order: 1,
      alignment: null,
      timezone: null,
      date_format: null,
      time_format: null,
      decimals: null,
      currency_format: null,
      selection_source: null,
      selectable_items: null,
      multiple_selections: false,
      phone_format: null,
      button_type: null,
      button_label: null,
      button_additional_labels: null,
      button_state: null,
      disable_on_click: null,
    },
    {
      name: "description",
      type: "long-text",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      field_order: 1,
      alignment: null,
      timezone: null,
      date_format: null,
      time_format: null,
      decimals: null,
      currency_format: null,
      selection_source: null,
      selectable_items: null,
      multiple_selections: false,
      phone_format: null,
      button_type: null,
      button_label: null,
      button_additional_labels: null,
      button_state: null,
      disable_on_click: null,
    },
    {
      name: "price",
      type: "currency",
      is_nullable: false,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      field_order: 1,
      alignment: null,
      timezone: null,
      date_format: null,
      time_format: null,
      decimals: "0.00",
      currency_format: "USD",
      selection_source: null,
      selectable_items: null,
      multiple_selections: false,
      phone_format: null,
      button_type: null,
      button_label: null,
      button_additional_labels: null,
      button_state: null,
      disable_on_click: null,
      vector_dimension: null,
    },
    {
      name: "category_id",
      type: "number",
      is_nullable: false,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      field_order: 1,
      alignment: null,
      timezone: null,
      date_format: null,
      time_format: null,
      decimals: "0.00",
      currency_format: null,
      selection_source: null,
      selectable_items: null,
      multiple_selections: false,
      phone_format: null,
      button_type: null,
      button_label: null,
      button_additional_labels: null,
      button_state: null,
      disable_on_click: null,
      vector_dimension: null,
    },
    {
      name: "metadata",
      type: "json",
      is_nullable: false,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      field_order: 1,
      alignment: null,
      timezone: null,
      date_format: null,
      time_format: null,
      decimals: null,
      currency_format: null,
      selection_source: null,
      selectable_items: null,
      multiple_selections: false,
      phone_format: null,
      button_type: null,
      button_label: null,
      button_additional_labels: null,
      button_state: null,
      disable_on_click: null,
      vector_dimension: null,
    },
    {
      name: "embedding",
      type: "vector",
      is_nullable: false,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      field_order: 1,
      alignment: null,
      timezone: null,
      date_format: null,
      time_format: null,
      decimals: null,
      currency_format: null,
      selection_source: null,
      selectable_items: null,
      multiple_selections: false,
      phone_format: null,
      button_type: null,
      button_label: null,
      button_additional_labels: null,
      button_state: null,
      disable_on_click: null,
      vector_dimension: 1536,
    },
  ],
  description: "Product catalog table",
});

**Method 2**
const { data: table } = await db
  .table()
  .create({
    table_name: "products",
    schema: [
      {
        name: "title",
        type: "text",
        is_nullable: true,
        is_primary_key: false,
        is_unique: false,
        is_visible: true,
        is_readonly: false,
        field_order: 1,
        alignment: null,
        timezone: null,
        date_format: null,
        time_format: null,
        decimals: null,
        currency_format: null,
        selection_source: null,
        selectable_items: null,
        multiple_selections: false,
        phone_format: null,
        button_type: null,
        button_label: null,
        button_additional_labels: null,
        button_state: null,
        disable_on_click: null,
      },
      {
        name: "description",
        type: "long-text",
        is_nullable: true,
        is_primary_key: false,
        is_unique: false,
        is_visible: true,
        is_readonly: false,
        field_order: 1,
        alignment: null,
        timezone: null,
        date_format: null,
        time_format: null,
        decimals: null,
        currency_format: null,
        selection_source: null,
        selectable_items: null,
        multiple_selections: false,
        phone_format: null,
        button_type: null,
        button_label: null,
        button_additional_labels: null,
        button_state: null,
        disable_on_click: null,
      },
      {
        name: "price",
        type: "currency",
        is_nullable: false,
        is_primary_key: false,
        is_unique: false,
        is_visible: true,
        is_readonly: false,
        field_order: 1,
        alignment: null,
        timezone: null,
        date_format: null,
        time_format: null,
        decimals: "0.00",
        currency_format: "USD",
        selection_source: null,
        selectable_items: null,
        multiple_selections: false,
        phone_format: null,
        button_type: null,
        button_label: null,
        button_additional_labels: null,
        button_state: null,
        disable_on_click: null,
        vector_dimension: null,
      },
      {
        name: "category_id",
        type: "number",
        is_nullable: false,
        is_primary_key: false,
        is_unique: false,
        is_visible: true,
        is_readonly: false,
        field_order: 1,
        alignment: null,
        timezone: null,
        date_format: null,
        time_format: null,
        decimals: "0.00",
        currency_format: null,
        selection_source: null,
        selectable_items: null,
        multiple_selections: false,
        phone_format: null,
        button_type: null,
        button_label: null,
        button_additional_labels: null,
        button_state: null,
        disable_on_click: null,
        vector_dimension: null,
      },
      {
        name: "metadata",
        type: "json",
        is_nullable: false,
        is_primary_key: false,
        is_unique: false,
        is_visible: true,
        is_readonly: false,
        field_order: 1,
        alignment: null,
        timezone: null,
        date_format: null,
        time_format: null,
        decimals: null,
        currency_format: null,
        selection_source: null,
        selectable_items: null,
        multiple_selections: false,
        phone_format: null,
        button_type: null,
        button_label: null,
        button_additional_labels: null,
        button_state: null,
        disable_on_click: null,
        vector_dimension: null,
      },
      {
        name: "embedding",
        type: "vector",
        is_nullable: false,
        is_primary_key: false,
        is_unique: false,
        is_visible: true,
        is_readonly: false,
        field_order: 1,
        alignment: null,
        timezone: null,
        date_format: null,
        time_format: null,
        decimals: null,
        currency_format: null,
        selection_source: null,
        selectable_items: null,
        multiple_selections: false,
        phone_format: null,
        button_type: null,
        button_label: null,
        button_additional_labels: null,
        button_state: null,
        disable_on_click: null,
        vector_dimension: 1536,
      },
    ],
    description: "Product catalog table",
  });

// List tables with advanced filtering
**Method 1**
const { data: tables, pagination } = await db.table.findAll({
  where: {
    is_public: true,
    created_at: { $gte: "2024-01-01" },
  },
  fields: ["id", "name", "record_count", "created_at"],
  sort: [{ field: "name", order: "asc" }],
  limit: 50,
  offset: 0,
});

**Method 2**
const { data: tables, pagination } = await db
  .table()
  .where({
    is_public: true,
    created_at: { $gte: "2024-01-01" },
  })
  .fields(["id", "name", "record_count", "created_at"])
  .sort([{ field: "name", order: "asc" }])
  .limit(50)
  .offset(0)
  .findAll();

// Get table metadata
**Method 1**
const { data: tableMetadata } = await db.table.findOne({
  where: { name: "table_name" },
});

**Method 2**
const { data: tableMetadata } = await db
  .table()
  .where({ name: "table_name" })
  .findOne();

// Update table properties
**Method 1**
const { data: updatedTable } = await db.table.update("old_table_name", {
  name: "new_table_name",
  description: "Updated description",
  is_public: false,
});

**Method 2**
const { data: updatedTable } = await db
  .table("old_table_name")
  .set({
    name: "new_table_name",
    description: "Updated description",
    is_public: false,
  })
  .update();

// Rename table
**Method 1**
await db.table.rename("old_table_name", "new_table_name");

**Method 2**
await db
  .table("old_table_name")
  .set({ name: "new_table_name" })
  .rename();

// Set table access permissions
**Method 1**
await db.table.setAccess({
  table_name: "table_name",
  is_public: true,
});

**Method 2**
await db
  .table("table_name")
  .set({ is_public: true })
  .setAccess();

// Delete table
**Method 1**
await db.table.delete("table_name");

**Method 2**
await db
  .table()
  .where({ name: "table_name" })
  .delete();
```

#### 4.2.3 Column/Field Operations

```javascript
// Add columns to existing table
**Method 1**
await db.column.create("products", {
  columns: [
    {
      name: "discount_percentage",
      type: "number",
      decimals: 2,
      default_value: 0,
      is_nullable: false,
    },
    {
      name: "tags",
      type: "json",
      description: "Product tags array",
    },
  ],
});

**Method 2**
await db
  .from("products")
  .column()
  .create({
    columns: [
      {
        name: "discount_percentage",
        type: "number",
        decimals: 2,
        default_value: 0,
        is_nullable: false,
      },
      {
        name: "tags",
        type: "json",
        description: "Product tags array",
      },
    ],
  });

// Find a column
**Method 1**
const { data: column } = await db.column.findOne("products", {
  where: { name: "discount_percentage" },
});

**Method 2**
const { data: column } = await db
  .from("products")
  .column()
  .where({ name: "discount_percentage" })
  .findOne();

// Update column properties
**Method 1**
await db.column.update("products", {
  set: {
    name: "new_column_name",
    description: "Updated description",
    is_indexed: true,
    is_unique: true,
  },
  where: {
    name: "discount_percentage",
  },
});

**Method 2**
await db
  .from("products")
  .column()
  .where({ name: "discount_percentage" })
  .set({
    name: "new_column_name",
    description: "Updated description",
    is_indexed: true,
    is_unique: true,
  })
  .update();

// List table columns
**Method 1**
const { data: columns } = await db.column.findAll("products", {
  where: { is_visible: true },
  sort: [{ field: "field_order", order: "asc" }],
});

**Method 2**
const { data: columns } = await db
  .from("products")
  .column()
  .where({ is_visible: true })
  .sort([{ field: "field_order", order: "asc" }])
  .findAll();

// Remove column
**Method 1**
await db.column.delete("products", {
  where: {
    name: "discount_percentage",
  },
});

**Method 2**
await db
  .from("products")
  .column()
  .where({ name: "discount_percentage" })
  .delete();
```

### 4.3 Record Operations

#### 4.3.1 CRUD Operations

```javascript

// Insert single record
**Method 1**
const { data: record } = await db.record.insert("products", {
  title: "MacBook Pro",
  price: 2499.99,
  category_id: 1,
  metadata: { color: "silver", storage: "512GB" },
});

**Method 2**
const { data: record } = await db
  .from("products")
  .insert({
  title: "MacBook Pro",
  price: 2499.99,
  category_id: 1,
  metadata: { color: "silver", storage: "512GB" },
})


// Find records with complex queries
**Method 1**
const { data: products, pagination } = await db.record.findAll("products", {
  where: {
    price: { $between: [500, 2000] },
    category_id: { $in: [1, 2, 3] },
    title: { $like: "%MacBook%" },
  },
  fields: ["id", "title", "price", "created_at"],
  sort: [
    { field: "price", order: "desc" },
    { field: "created_at", order: "asc" },
  ],
  limit: 10,
  offset: 5,
});

**Method 2**
const { data: products, pagination } = await db
  .from("products")
  .where({
    price: { $between: [500, 2000] },
    category_id: { $in: [1, 2, 3] },
    title: { $like: "%MacBook%" },
  })
  .fields(["id", "title", "price", "created_at"])
  .sort([
    { field: "price", order: "desc" },
    { field: "created_at", order: "asc" },
  ])
  .limit(10)
  .offset(5)
  .findAll();

// Find single record
**Method 1**
const { data: product } = await db.record.findOne("products", {
  where: { id: "record_uuid" },
});

**Method 2**
const { data: product } = await db
  .from("products")
  .where({ id: "record_uuid" })
  .findOne();

// Update records
**Method 1**
await db.record.update("products", {
  set: { price: 2299.99, updated_at: new Date() },
  where: { id: "record_uuid" },
});

**Method 2**
await db
  .from("products")
  .where({ id: "record_uuid" })
  .set({ price: 2299.99, updated_at: new Date() })
  .update();

// Delete records
**Method 1**
await db.record.delete("products", {
  where: { id: "record_uuid" },
});

**Method 2**
await db
  .from("products")
  .where({ id: "record_uuid" })
  .delete();
```

#### 4.3.2 Advanced Query Features

```javascript
// Aggregation queries
**Method 1**
const { data: stats } = await db.record.aggregate("orders", {
  groupBy: ["status"],
  aggregates: {
    total_amount: { $sum: "amount" },
    avg_amount: { $avg: "amount" },
    order_count: { $count: "*" },
  },
  where: { created_at: { $gte: "2024-01-01" } },
});

**Method 2**
const { data: stats } = await db
  .from("orders")
  .where({ created_at: { $gte: "2024-01-01" } })
  .groupBy(["status"])
  .aggregate({
    total_amount: { $sum: "amount" },
    avg_amount: { $avg: "amount" },
    order_count: { $count: "*" },
  });

// Vector similarity search
**Method 1**
const { data: similarProducts } = await db.record.findAll("recommendations", {
  where: {
    vector_field: "embedding",
    query_vector: "[0.1, 0.2, 0.3, ...]", // 1536-dimensional vector
  },
  limit: 10,
});

**Method 2**
const { data: similarProducts } = await db
  .from("recommendations")
  .vector("embedding", "[0.1, 0.2, 0.3, ...]")
  .limit(10)
  .findAll();


// Advanced fluent query examples
**Method 2 - Additional Examples**
// Complex where conditions with fluent chaining
const { data: products } = await db
  .from("products")
  .where("price", ">", 100)
  .where("category_id", "in", [1, 2, 3])
  .orWhere("featured", "=", true)
  .orderBy("price", "desc")
  .orderBy("created_at", "asc")
  .limit(20)
  .offset(10)
  .findAll();

// Joins with fluent syntax
const { data: ordersWithProducts } = await db
  .from("orders")
  .join("products", "orders.product_id", "products.id")
  .where("orders.status", "=", "completed")
  .select(["orders.*", "products.title", "products.price"])
  .orderBy("orders.created_at", "desc")
  .limit(50)
  .findAll();
```

### 4.4 SQL Query Interface

#### 4.4.1 Direct SQL Execution

```javascript
// Simple query
**Method 1**
const { data: results } = await db.sql({
  db_id: "database_uuid", // Optional if using default DB
  query: "SELECT * FROM products WHERE price > $1",
  params: [1000],
});

**Method 2**
const { data: results } = await db
  .sql()
  .query("SELECT * FROM products WHERE price > $1")
  .params([1000])
  .execute();

// Complex analytical query
**Method 1**
const { data: analytics } = await db.sql({
  query: `
    SELECT
      DATE_TRUNC('month', created_at) as month,
      category_id,
      COUNT(*) as product_count,
      AVG(price) as avg_price
    FROM products
    WHERE created_at >= $1
    GROUP BY month, category_id
    ORDER BY month DESC, avg_price DESC
  `,
  params: ["2024-01-01"],
});

**Method 2**
const { data: analytics } = await db
  .sql()
  .query(`
    SELECT
      DATE_TRUNC('month', created_at) as month,
      category_id,
      COUNT(*) as product_count,
      AVG(price) as avg_price
    FROM products
    WHERE created_at >= $1
    GROUP BY month, category_id
    ORDER BY month DESC, avg_price DESC
  `)
  .params(["2024-01-01"])
  .execute();

// Parameterized queries with named parameters
**Method 1**
const { data: userOrders } = await db.sql({
  query: `
    SELECT o.*, p.title as product_title
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = :userId
      AND o.status = :status
      AND o.created_at >= :startDate
  `,
  params: {
    userId: "user123",
    status: "completed",
    startDate: "2024-01-01",
  },
});

**Method 2**
const { data: userOrders } = await db
  .sql()
  .query(`
    SELECT o.*, p.title as product_title
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = :userId
      AND o.status = :status
      AND o.created_at >= :startDate
  `)
  .params({
    userId: "user123",
    status: "completed",
    startDate: "2024-01-01",
  })
  .execute();
```

## 5. Technical Requirements

### 5.1 Environment Support

#### 5.1.1 Runtime Compatibility

- **Node.js**: v16+ (LTS versions)
- **Browsers**: Modern browsers with ES2018+ support
- **Bundlers**: Webpack 5+, Vite, Rollup, esbuild
- **Frameworks**: React, Vue.js, Angular, Next.js, Nuxt.js
- **Serverless**: AWS Lambda, Vercel Functions, Netlify Functions

#### 5.1.2 Package Distribution

```json
{
  "name": "@boltic/database-js",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist/"],
  "sideEffects": false
}
```

### 5.2 Configuration Management

#### 5.2.1 Environment-Based Endpoints

```javascript
const ENV_CONFIGS = {
  local: {
    baseURL: 'http://localhost:8000',
    timeout: 30000,
  },
  sit: {
    baseURL: 'https://asia-south1.api.fcz0.de/service/panel/boltic-tables',
    timeout: 15000,
  },
  uat: {
    baseURL: 'https://asia-south1.api.uat.fcz0.de/service/panel/boltic-tables',
    timeout: 15000,
  },
  prod: {
    baseURL: 'https://asia-south1.api.boltic.io/service/panel/boltic-tables',
    timeout: 10000,
  },
};
```

#### 5.2.2 Advanced Configuration Options

```javascript
const boltic = createClient('api-key', {
  environment: 'prod',

  // Network settings
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,

  // Caching
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  cacheMaxSize: 100, // MB

  // Debugging
  debug: false,
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'

  // Custom headers
  headers: {
    'X-Client-Version': '1.0.0',
    'X-Source': 'sdk',
  },

  // Interceptors
  beforeRequest: (config) => {
    console.log('Making request:', config);
    return config;
  },

  afterResponse: (response) => {
    console.log('Received response:', response);
    return response;
  },
});
```

### 5.3 Authentication & Security

#### 5.3.1 API Key Management

```javascript
// Environment variable support
const boltic = createClient(process.env.BOLTIC_API_KEY);

// Dynamic key rotation
boltic.updateApiKey('new-api-key');

// Key validation
const isValid = await boltic.validateApiKey();
```

#### 5.3.2 Request Security

- Automatic HTTPS enforcement
- Request signing for sensitive operations
- Rate limiting with exponential backoff
- Request/response payload encryption for PII data

### 5.4 Performance & Optimization

#### 5.4.1 Caching Strategy

```javascript
// Multi-level caching
const cacheConfig = {
  // Memory cache for frequently accessed data
  memory: {
    enabled: true,
    maxSize: 50, // MB
    ttl: 300000, // 5 minutes
  },

  // Browser localStorage for session persistence
  localStorage: {
    enabled: true,
    prefix: 'boltic_cache_',
    ttl: 3600000, // 1 hour
  },

  // Redis cache for server-side applications
  redis: {
    enabled: false,
    url: 'redis://localhost:6379',
    keyPrefix: 'boltic:',
  },
};
```

#### 5.4.2 Query Optimization

- Automatic query result pagination
- Field projection to minimize payload size
- Connection pooling for Node.js environments
- Request deduplication for identical queries
- Lazy loading for related data

#### 5.4.3 Bundle Size Optimization

- Tree-shaking support for unused features
- Separate builds for browser/Node.js
- Optional modules for advanced features
- Compression and minification

```javascript
// Modular imports to reduce bundle size
import { createTableClient } from '@boltic/database-js/table';
import { createRecordClient } from '@boltic/database-js/record';

// Full SDK import
import { createClient } from '@boltic/database-js';
```

### 5.5 Error Handling & Resilience

#### 5.5.1 Error Classification

```javascript
try {
  await db.record.insert('table_uuid', invalidData);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof AuthorizationError) {
    // Handle authorization errors
  } else {
    // Handle other errors
  }
}
```

#### 5.5.2 Resilience Features

- Automatic retry with exponential backoff
- Circuit breaker pattern for failing endpoints
- Graceful degradation for non-critical features
- Offline mode with local caching
- Request queuing for network failures

### 5.6 TypeScript Support

#### 5.6.1 Type Definitions

```typescript
interface TableSchema {
  table_name: string;
  schema?: FieldDefinition[];
  description?: string;
}

interface FieldDefinition {
  name: string;
  type: FieldType;
  is_nullable?: boolean;
  is_unique?: boolean;
  is_indexed?: boolean;
  default_value?: any;
  // Type-specific properties
  vector_dimension?: number;
  currency_format?: string;
  selectable_items?: string[];
}

type FieldType =
  | "text" | "long-text" | "number" | "currency"
  | "checkbox" | "dropdown" | "email" | "phone-number"
  | "link" | "json" | "date-time" | "vector"
  | "halfvec" | "sparsevec";

interface QueryOptions<T = any> {
  where?: WhereCondition<T>;
  fields?: (keyof T)[];
  sort?: SortOption<T>[];
  limit?: number;
  offset?: number;
}

interface WhereCondition<T> {
  [K in keyof T]?: T[K] | QueryOperator<T[K]>;
}

interface QueryOperator<T> {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $like?: string;
  $ilike?: string;
  $between?: [T, T];
  $null?: boolean;
}
```

#### 5.6.2 Generic Type Support

```typescript
interface Product {
  id: string;
  title: string;
  price: number;
  category_id: number;
  metadata: Record<string, any>;
  created_at: Date;
}

// Type-safe operations
const products = await db.record.findAll<Product>('table_uuid', {
  where: {
    price: { $gt: 100 },
    category_id: { $in: [1, 2, 3] },
  },
  fields: ['id', 'title', 'price'], // TypeScript ensures these are valid keys
  sort: [{ field: 'price', order: 'desc' }],
});

// Inferred return type: Product[]
```

## 6. Non-Functional Requirements

### 6.1 Performance Targets

- **API Response Time**: < 200ms for simple queries (P95)
- **Bundle Size**: < 50KB gzipped for browser builds
- **Memory Usage**: < 10MB for typical usage patterns
- **Cache Hit Rate**: > 80% for repeated queries
- **Throughput**: Support 1000+ concurrent operations

### 6.2 Reliability & Availability

- **Uptime**: 99.9% availability target
- **Error Rate**: < 0.1% for successful API calls
- **Data Consistency**: ACID compliance for critical operations
- **Backup & Recovery**: Automatic failover to backup endpoints

### 6.3 Security Requirements

- **Data Encryption**: TLS 1.3 for all communications
- **API Security**: Rate limiting, request signing
- **Access Control**: Role-based permissions support
- **Audit Logging**: Comprehensive operation logging
- **Compliance**: GDPR, SOC 2 compliance ready

### 6.4 Scalability

- **Horizontal Scaling**: Support multi-region deployments
- **Load Balancing**: Automatic endpoint selection
- **Resource Optimization**: Efficient memory and CPU usage
- **Concurrent Operations**: Thread-safe operations

## 7. User Experience & Developer Experience

### 7.1 API Design Principles

- **Consistency**: Uniform naming conventions and response formats
- **Predictability**: Intuitive method signatures and behavior
- **Flexibility**: Support for both simple and complex use cases
- **Discoverability**: Clear method organization and documentation

### 7.2 Documentation Requirements

- **Getting Started Guide**: Quick setup and basic usage examples
- **API Reference**: Comprehensive method documentation
- **Tutorials**: Step-by-step guides for common scenarios
- **Migration Guide**: Help for existing API users
- **Best Practices**: Performance and security guidelines

### 7.3 Developer Tools

```javascript
// Built-in debugging utilities
boltic.debug.enableQueryLogging();
boltic.debug.enablePerformanceMetrics();
boltic.debug.exportCacheStats();

// Development helpers
if (process.env.NODE_ENV === 'development') {
  boltic.dev.validateTableSchema('products');
  boltic.dev.suggestIndexes('products');
  boltic.dev.analyzeQueryPerformance();
}
```

### 7.4 Testing Support

```javascript
// Mock client for testing
import { createMockClient } from '@boltic/database-js/testing';

const mockBoltic = createMockClient({
  tables: {
    products: [{ id: '1', title: 'Test Product', price: 99.99 }],
  },
});

// Test utilities
import { fixtures } from '@boltic/database-js/testing';
const testData = fixtures.generateProducts(100);
```

## 8. Migration & Adoption Strategy

### 8.1 Backward Compatibility

- Support for existing HTTP API patterns
- Gradual migration path from direct API usage
- Deprecation warnings for outdated patterns
- Version compatibility matrix

### 8.2 Adoption Incentives

- Performance improvements over direct API usage
- Enhanced developer experience with TypeScript
- Built-in best practices and optimizations
- Comprehensive examples and templates

## 9. Success Metrics & KPIs

### 9.1 Adoption Metrics

- **Downloads**: NPM package download counts
- **Active Users**: Weekly/monthly active developers
- **Integration Adoption**: Number of applications using the SDK
- **Community Engagement**: GitHub stars, issues, contributions

### 9.2 Performance Metrics

- **API Latency**: P50, P95, P99 response times
- **Error Rates**: SDK vs. direct API error comparison
- **Cache Efficiency**: Hit rates and performance improvements
- **Resource Usage**: Memory and CPU optimization tracking

### 9.3 Developer Experience Metrics

- **Time to First Success**: How quickly developers can implement basic functionality
- **Documentation Quality**: Search success rates and feedback scores
- **Support Tickets**: Reduction in API-related support requests
- **Developer Satisfaction**: Survey scores and feedback analysis

## 10. Implementation Phases

### 10.1 Phase 1: Core Foundation (4-6 weeks)

- Basic client initialization and configuration
- Database and table operations
- Simple row CRUD operations
- TypeScript definitions
- Unit testing framework

### 10.2 Phase 2: Advanced Features (6-8 weeks)

- Complex query operations and filtering
- SQL query interface
- Caching implementation
- Error handling and resilience
- Performance optimizations

### 10.3 Phase 3: Developer Experience (4-6 weeks)

- Comprehensive documentation
- Code examples and tutorials
- Testing utilities and mocks
- Migration tools
- Developer debugging tools

### 10.4 Phase 4: Production Ready (2-4 weeks)

- Security audit and hardening
- Performance testing and optimization
- Browser compatibility testing
- Production deployment and monitoring
- Community feedback integration

## 11. Technical Risks & Mitigation

### 11.1 Identified Risks

1. **Bundle Size Growth**: Feature additions increasing package size
2. **Breaking Changes**: Backend API evolution affecting SDK compatibility
3. **Performance Regression**: Abstraction layer overhead
4. **Security Vulnerabilities**: Third-party dependencies and API exposure
