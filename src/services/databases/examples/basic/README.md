# Column Operations Demo

This demo showcases all column operations functionality in the Boltic Tables SDK.

## Prerequisites

1. **Install Dependencies**

   ```bash
   cd databases
   npm install
   ```

2. **Set up Environment**

   ```bash
   # Copy the example environment file
   cp examples/env.example examples/.env

   # Edit the .env file and add your API key
   # BOLTIC_API_KEY=your-actual-api-key-here
   ```

3. **Build the SDK**
   ```bash
   npm run build
   ```

## Running the Demo

### Method 1: Direct Execution

```bash
# Run the demo directly
npx ts-node examples/basic/column-operations-demo.ts
```

### Method 2: Using npm script

Add this to your `package.json`:

```json
{
  "scripts": {
    "demo:columns": "ts-node examples/basic/column-operations-demo.ts"
  }
}
```

Then run:

```bash
npm run demo:columns
```

### Method 3: Development Mode

```bash
# Run with nodemon for development
npx nodemon --exec ts-node examples/basic/column-operations-demo.ts
```

## Configuration

The demo automatically loads configuration from the `.env` file:

```bash
# Required: Your Boltic API key
BOLTIC_API_KEY=your-actual-api-key-here

# Optional: Enable debug mode to see API calls
DEBUG=true

# Optional: Custom database (defaults to comprehensive-demo-db)
# DATABASE_ID=your-database-id
# DATABASE_NAME=your-database-name
```

The demo uses the default database: `comprehensive-demo-db` with name `Comprehensive Demo Database`.

## Expected Output

The demo will output something like this:

```
=== Column Operations Demo ===

1. Creating columns using direct API...
✅ Columns created successfully: 6 columns

2. Finding columns using fluent API...
✅ Found columns: 6 columns
Pagination: { total: 6, page: 1, limit: 10, pages: 1 }

3. Finding specific column...
✅ Found column: price

4. Updating column...
✅ Column updated successfully: price

5. Updating date-time column with user-friendly formats...
✅ Date-time column updated successfully

6. Updating phone format...
✅ Phone format updated successfully

7. Deleting column...
✅ Column deleted successfully

8. Using helper utilities...
Can convert text to email: true
Column definition with defaults: { name: 'test_column', type: 'number', ... }
Is valid column name: true
Column type display name: Currency

9. Available date formats: ['MMDDYY', 'MMDDYYYY', 'MM_DD_YYYY', ...]
Available time formats: ['HH_mm_ss', 'HH_mm_ssZ', 'HH_mm_ss_SSS', ...]

=== Demo completed successfully! ===
```

## Validation Checklist

### ✅ Type Safety Validation

- [ ] All decimal values use `DecimalType` (e.g., `'0.00' as DecimalType`)
- [ ] All phone formats use `PhoneFormatType` (e.g., `'+91 123 456 7890' as PhoneFormatType`)
- [ ] All date formats use `DateFormatEnum` keys (e.g., `'YYYY_MM_DD' as keyof typeof DateFormatEnum`)
- [ ] All time formats use `TimeFormatEnum` keys (e.g., `'HH_mm_ss' as keyof typeof TimeFormatEnum`)

### ✅ API Operations Validation

- [ ] Column creation works with proper types
- [ ] Column finding works with filtering and sorting
- [ ] Column updates work with type transformations
- [ ] Column deletion works correctly
- [ ] Error handling works for invalid operations

### ✅ Helper Utilities Validation

- [ ] Type conversion safety checks work
- [ ] Column definition creation with defaults works
- [ ] Column name validation works
- [ ] Column type display names work

### ✅ Type Transformations Validation

- [ ] User-friendly date formats are transformed to API formats
- [ ] User-friendly time formats are transformed to API formats
- [ ] Default values are applied correctly
- [ ] Type-specific validations work

## Troubleshooting

### Common Issues

1. **TypeScript Compilation Errors**

   ```bash
   # Ensure types are properly imported
   import { DecimalType, PhoneFormatType, DateFormatEnum, TimeFormatEnum } from '../../src/types/api/column';
   ```

2. **API Key Issues**

   ```bash
   # Check your API key is valid
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.boltic.com/v1/auth/validate
   ```

3. **Database Context Issues**

   ```bash
   # Ensure database exists and is accessible
   # Check database ID and name are correct
   ```

4. **Network Issues**
   ```bash
   # Check internet connection
   # Verify API endpoints are accessible
   ```

### Debug Mode

Enable debug mode to see detailed API calls:

```typescript
const client = new BolticClient('your-api-key-here', {
  debug: true, // Enable debug mode
});
```

## Testing Individual Operations

You can test individual operations by commenting out sections in the demo:

```typescript
async function demonstrateColumnOperations() {
  try {
    console.log('=== Column Operations Demo ===\n');

    // Test only creation
    console.log('1. Creating columns using direct API...');
    // ... creation code ...

    // Comment out other operations for focused testing
    /*
    console.log('\n2. Finding columns using fluent API...');
    // ... finding code ...
    */
  } catch (error) {
    console.error('Demo failed:', error);
  }
}
```

## Performance Testing

To test performance with larger datasets:

```typescript
// Test with multiple columns
const manyColumns = Array.from({ length: 50 }, (_, i) => ({
  name: `column_${i}`,
  type: 'text' as const,
  description: `Column ${i}`,
  is_nullable: true,
  is_unique: false,
  is_indexed: false,
  is_primary_key: false,
  field_order: i + 1,
}));

const createResult = await client.columns.create('test_table', {
  columns: manyColumns,
});
```

## Integration Testing

To test integration with other SDK features:

```typescript
// Test with table operations
const tableResult = await client.tables.create({
  name: 'test_table_for_columns',
  description: 'Test table for column operations',
});

if (tableResult.data) {
  // Now test column operations on this table
  const columnResult = await client.columns.create('test_table_for_columns', {
    columns: [
      /* your columns */
    ],
  });
}
```

## Validation Script

Create a validation script to automatically test all operations:

```typescript
// validation-script.ts
import { BolticClient } from '../../src/client/boltic-client';

async function validateColumnOperations() {
  const client = new BolticClient('your-api-key-here');
  client.useDatabase('your-database-id', 'your-database-name');

  const testTable = 'validation_test_table';

  try {
    // Test 1: Create columns
    const createResult = await client.columns.create(testTable, {
      columns: [
        /* test columns */
      ],
    });
    console.log('✅ Create test passed');

    // Test 2: Find columns
    const findResult = await client.columns.findAll(testTable);
    console.log('✅ Find test passed');

    // Test 3: Update columns
    const updateResult = await client.columns.update(testTable, {
      set: { description: 'Updated' },
      where: { name: 'test_column' },
    });
    console.log('✅ Update test passed');

    // Test 4: Delete columns
    const deleteResult = await client.columns.delete(testTable, {
      where: { name: 'test_column' },
    });
    console.log('✅ Delete test passed');

    console.log('🎉 All validation tests passed!');
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

validateColumnOperations();
```

Run the validation script:

```bash
npx ts-node examples/basic/validation-script.ts
```
