/**
 * Encrypted Columns Demo Script
 *
 * This script demonstrates the usage of encrypted columns in the Boltic SDK:
 * - Creating tables with encrypted columns (deterministic and non-deterministic)
 * - Verifying new default: show_decrypted=false
 * - Verifying validation: default_value is not allowed for encrypted columns
 * - Inserting records with encrypted fields
 * - Retrieving records with and without decryption
 * - Updating records with decryption option
 * - Filtering on deterministic encrypted columns
 *
 * Prerequisites:
 * - Set BOLTIC_API_KEY environment variable
 */

import * as dotenv from 'dotenv';
import {
    BolticClient,
    isErrorResponse,
    FieldTypeEnum,
} from '../../src';

// Load environment variables
dotenv.config({ path: '../.env' });

// Configuration
const DEMO_CONFIG = {
    debug: true,
    timeout: 30000,
    region: 'asia-south1' as const,
};

class EncryptedColumnsDemo {
    private client: BolticClient;
    private tableName = 'Encrypted Users Demo';
    private tableId: string | null = null;

    constructor() {
        const apiKey = process.env.BOLTIC_API_KEY;
        if (!apiKey) {
            throw new Error('BOLTIC_API_KEY environment variable is required');
        }

        this.client = new BolticClient(apiKey, DEMO_CONFIG);
    }

    async runDemo(): Promise<void> {
        console.log('🚀 Starting Encrypted Columns Demo');
        console.log('='.repeat(80));

        try {
            await this.cleanup(); // Clean up if validation failed previously

            // 1. Create Table
            await this.createTable();

            // 2. Add Encrypted Columns & Verify New Defaults
            await this.addEncryptedColumns();

            // 3. Verify Validation: default_value not allowed
            await this.verifyDefaultValueValidation();

            // 4. Insert Records
            await this.insertRecords();

            // 5. List Records (verify masking by default now!)
            await this.listRecords();

            // 6. Get Record (verify decryption override)
            await this.getRecordWithDecryption();

            // 7. Update Record (with decryption)
            await this.updateRecord();

            // 8. Filter Records (Deterministic)
            await this.filterDeterministic();

            // 9. Filter Records (Non-Deterministic - Should Fail)
            await this.filterNonDeterministic();

            await this.cleanup();
            console.log('\n🎉 Encrypted columns demo completed successfully!');
        } catch (error) {
            console.error('\n❌ Demo failed with error:', error);
            await this.cleanup();
            throw error;
        }
    }

    private async createTable(): Promise<void> {
        console.log('\n1️⃣  Creating Table');
        const result = await this.client.tables.create({
            name: this.tableName,
            description: 'Demo table for encrypted columns',
            fields: [],
        });

        if (isErrorResponse(result)) {
            const errorResult: any = result;
            throw new Error(`Failed to create table: ${errorResult.error.message}`);
        }

        this.tableId = result.data.id;
        console.log(`✅ Table created with ID: ${this.tableId}`);
    }

    private async addEncryptedColumns(): Promise<void> {
        console.log('\n2️⃣  Adding Encrypted Columns & Verifying Defaults');
        if (!this.tableId) return;

        // 1. Created WITHOUT show_decrypted (should default to false now)
        console.log('   Creating ssn column without show_decrypted...');
        const ssnCol = await this.client.columns.create(this.tableName, {
            name: 'ssn',
            type: FieldTypeEnum.ENCRYPTED,
            is_deterministic: false,
        });

        if (isErrorResponse(ssnCol)) {
            throw new Error(`Failed to create ssn column: ${ssnCol.error.message}`);
        }

        // In SDK validation might not have it, but we can check the return if API returns it
        // Actually our processColumnDefaults sets it to false.
        console.log('✅ Created ssn column (expected default show_decrypted: false)');

        // 2. Deterministic encrypted column (Email) - explicitly set to true
        const emailCol = await this.client.columns.create(this.tableName, {
            name: 'email_enc',
            type: FieldTypeEnum.ENCRYPTED,
            show_decrypted: true,
            is_deterministic: true,
        });

        if (isErrorResponse(emailCol)) {
            throw new Error(`Failed to create email_enc column: ${emailCol.error.message}`);
        }
        console.log('✅ Created deterministic encrypted column: email_enc (show_decrypted: true)');

        // 3. Regular text column
        const nameCol = await this.client.columns.create(this.tableName, {
            name: 'full_name',
            type: FieldTypeEnum.TEXT,
        });
        if (isErrorResponse(nameCol)) {
            throw new Error(`Failed to create name column: ${nameCol.error.message}`);
        }
    }

    private async verifyDefaultValueValidation(): Promise<void> {
        console.log('\n3️⃣  Verifying default_value validation');
        if (!this.tableId) return;

        const result = await this.client.columns.create(this.tableName, {
            name: 'invalid_col',
            type: FieldTypeEnum.ENCRYPTED,
            // @ts-ignore
            default_value: 'some default'
        });

        if (isErrorResponse(result)) {
            console.log('✅ Successfully caught validation error:', result.error.message);
            if (result.error.message !== 'Encrypted columns do not accept a default value') {
                console.warn('⚠️  Unexpected error message:', result.error.message);
            }
        } else {
            console.error('❌ Error: Expected default_value to be rejected for encrypted column');
        }
    }

    private async insertRecords(): Promise<void> {
        console.log('\n4️⃣  Inserting Records');
        const record = await this.client.records.insert(this.tableName, {
            full_name: 'John Doe',
            ssn: '123-456-7890',
            email_enc: 'john.doe@example.com',
        });

        if (isErrorResponse(record)) {
            throw new Error(`Failed to insert record: ${record.error.message}`);
        }
        console.log(`✅ Record inserted: ID ${record.data.id}`);

        console.log('   Response ssn:', record.data.ssn); // Should be masked "********" per new default
        console.log('   Response email:', record.data.email_enc); // Should be clear "john.doe@example.com"
    }

    private async listRecords(): Promise<void> {
        console.log('\n5️⃣  Listing Records (Default Behavior - Masked)');

        const result = await this.client.records.findAll(this.tableName);
        if (isErrorResponse(result)) {
            throw new Error(`Failed to list records: ${result.error.message}`);
        }

        const record = result.data[0];
        console.log('   Record ssn:', record.ssn);
        console.log('   Record email:', record.email_enc);

        if (record.ssn === '********') {
            console.log('✅ Verified ssn is masked by default');
        } else {
            console.warn('⚠️  Expected ssn to be masked!');
        }
    }

    private async getRecordWithDecryption(): Promise<void> {
        console.log('\n6️⃣  Get Record with Decryption Override');

        const listResult = await this.client.records.findAll(this.tableName);
        if (isErrorResponse(listResult) || listResult.data.length === 0) return;
        const recordId = listResult.data[0].id;

        console.log('   Fetching with show_decrypted: true...');
        const recordDecrypted = await this.client.records.findOne(this.tableName, recordId, { show_decrypted: true });

        if (isErrorResponse(recordDecrypted)) {
            throw new Error(`Failed to get record with decryption: ${recordDecrypted.error.message}`);
        }

        console.log('   SSN (decrypted):', recordDecrypted.data.ssn);
        if (recordDecrypted.data.ssn === '123-456-7890') {
            console.log('✅ Verified ssn is decrypted via override');
        } else {
            console.error('❌ SSN was not decrypted correctly');
        }
    }

    private async updateRecord(): Promise<void> {
        console.log('\n7️⃣  Update Record with Decryption Override');
        const listResult = await this.client.records.findAll(this.tableName);
        if (isErrorResponse(listResult) || listResult.data.length === 0) return;
        const recordId = listResult.data[0].id;

        const updateResult = await this.client.records.updateById(
            this.tableName,
            recordId,
            { full_name: 'Jane Doe' },
            { show_decrypted: true }
        );

        if (isErrorResponse(updateResult)) {
            throw new Error(`Failed to update record: ${updateResult.error.message}`);
        }

        console.log('   SSN in update response:', updateResult.data.ssn);
        if (updateResult.data.ssn === '123-456-7890') {
            console.log('✅ Verified ssn is decrypted in update response');
        }
    }

    private async filterDeterministic(): Promise<void> {
        console.log('\n8️⃣  Filter by Deterministic Encrypted Column');
        const result = await this.client.records.findAll(this.tableName, {
            filters: [{ field: 'email_enc', operator: '=', values: ['john.doe@example.com'] }]
        });

        if (isErrorResponse(result)) {
            const errorMsg = result.error.message || (result.error.meta && result.error.meta[0]) || 'Unknown error';
            console.error('❌ Failed to filter by email:', errorMsg);
        } else {
            console.log(`✅ Found ${result.data.length} records matching deterministic filter`);
        }
    }

    private async filterNonDeterministic(): Promise<void> {
        console.log('\n9️⃣  Filter by Non-Deterministic Encrypted Column (Should Fail at API)');
        const result = await this.client.records.findAll(this.tableName, {
            filters: [{ field: 'ssn', operator: '=', values: ['123-456-7890'] }]
        });

        if (isErrorResponse(result)) {
            const errorMsg = result.error.message || (result.error.meta && result.error.meta[0]) || 'Unknown error';
            console.log('✅ Expected API error received:', errorMsg);
        } else {
            console.warn('⚠️  Unexpected success filtering by non-deterministic column (API should have rejected)');
        }
    }

    private async cleanup(): Promise<void> {
        if (this.tableId) {
            console.log('\n🧹 Cleaning up table...');
            try {
                await this.client.tables.delete(this.tableName);
                console.log('✅ Table deleted');
            } catch (e) {
                // ignore
            }
            this.tableId = null;
        } else {
            try {
                const tables = await this.client.tables.findAll();
                if (!isErrorResponse(tables)) {
                    // @ts-ignore
                    const table = tables.data.find((t: any) => t.table_name === this.tableName || t.name === this.tableName);
                    if (table) {
                        await this.client.tables.delete(table.name);
                        console.log('✅ Found and deleted existing table');
                    }
                }
            } catch (e) { }
        }
    }
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
    const demo = new EncryptedColumnsDemo();
    demo.runDemo().catch(console.error);
}
