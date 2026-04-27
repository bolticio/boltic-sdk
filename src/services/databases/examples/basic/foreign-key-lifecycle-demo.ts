/**
 * Foreign-key lifecycle demo script for databases module.
 *
 * Covers:
 * - Create parent + child tables
 * - Add parent columns for all supported field types
 * - Try creating child foreign-key columns referencing each parent column
 * - Insert parent row
 * - Insert child row using successful foreign-key references
 * - Cleanup tables
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { BolticClient, FieldDefinition, isErrorResponse } from '../../src';
import type { Environment } from '../../../../index';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.BOLTIC_API_KEY) {
  dotenv.config();
}

const DEMO_CONFIG = {
  region: 'asia-south1' as const,
  timeout: 30000,
  debug: true,
  parentTableName: `fk_parent_${Date.now()}`,
  childTableName: `fk_child_${Date.now()}`,
  parentStableRefColumn: 'parent_code',
};

type SupportedReferenceType = Exclude<FieldDefinition['type'], 'foreign-key'>;

type MatrixEntry = {
  type: SupportedReferenceType;
  parentColumnName: string;
  parentField: FieldDefinition;
  parentValue: unknown;
  childFkColumnName: string;
};

type MatrixResult = {
  type: SupportedReferenceType;
  parentColumnName: string;
  childFkColumnName: string;
  renamedChildFkColumnName?: string;
  parentColumnCreated: boolean;
  fkCreated: boolean;
  fkRenamed?: boolean;
  fkDeleted?: boolean;
  note?: string;
};

const EXPECTED_FK_OUTCOME: Record<
  SupportedReferenceType,
  'full-success' | 'fk-create-expected-fail' | 'full-success-with-child-insert-skip'
> = {
  text: 'full-success',
  'long-text': 'full-success',
  number: 'full-success',
  currency: 'full-success',
  checkbox: 'full-success',
  dropdown: 'fk-create-expected-fail',
  email: 'full-success',
  'phone-number': 'full-success',
  link: 'full-success',
  json: 'fk-create-expected-fail',
  'date-time': 'full-success',
  vector: 'fk-create-expected-fail',
  halfvec: 'fk-create-expected-fail',
  sparsevec: 'fk-create-expected-fail',
  encrypted: 'full-success-with-child-insert-skip',
};

class ForeignKeyLifecycleDemo {
  private client: BolticClient;
  private parentTableName = DEMO_CONFIG.parentTableName;
  private childTableName = DEMO_CONFIG.childTableName;
  private matrixEntries: MatrixEntry[] = [];
  private matrixResults: MatrixResult[] = [];
  private parentInsertPayload: Record<string, unknown> = {
    [DEMO_CONFIG.parentStableRefColumn]: `PARENT_${Date.now()}`,
  };
  private childInsertPayload: Record<string, unknown> = {};
  private canonicalParentValuesByColumn: Record<string, unknown> = {};

  private getErrorMessage(result: { error?: { message?: string; meta?: string[]; code?: string } }): string {
    const message = result?.error?.message;
    if (message && String(message).trim().length > 0) {
      return message;
    }
    const meta = result?.error?.meta;
    if (Array.isArray(meta) && meta.length > 0) {
      return meta.join(' | ');
    }
    const code = result?.error?.code;
    return code || 'Unknown backend error';
  }

  constructor() {
    const apiKey = process.env.BOLTIC_API_KEY;
    if (!apiKey) {
      throw new Error('BOLTIC_API_KEY environment variable is required');
    }

    this.client = new BolticClient(apiKey, {
      region: DEMO_CONFIG.region,
      timeout: DEMO_CONFIG.timeout,
      debug: DEMO_CONFIG.debug,
      environment: process.env.BOLTIC_ENVIRONMENT as Environment | undefined,
    });
  }

  async run(): Promise<void> {
    try {
      console.log('🚀 Starting foreign-key lifecycle demo');
      await this.createTables();
      await this.prepareTypeMatrix();
      await this.createParentColumns();
      await this.createChildForeignKeys();
      await this.insertParentRecord();
      this.buildChildPayloadFromCanonicalParentValues();
      await this.insertChildRecord();
      await this.renameForeignKeyColumns();
      await this.insertChildRecordAfterRename();
      await this.deleteForeignKeyColumns();
      await this.insertChildRecordAfterDelete();
      this.printSummary();
      this.assertExpectedOutcomes();
      console.log('✅ Foreign-key lifecycle demo completed');
    } finally {
      await this.cleanup();
    }
  }

  private async createTables(): Promise<void> {
    console.log('\n1️⃣ Create parent and child tables');

    const parentFields: FieldDefinition[] = [
      {
        name: DEMO_CONFIG.parentStableRefColumn,
        type: 'text',
        is_nullable: false,
        is_unique: true,
        is_indexed: true,
      },
    ];

    const childFields: FieldDefinition[] = [
      {
        name: 'child_name',
        type: 'text',
        is_nullable: true,
      },
    ];

    const parentCreate = await this.client.tables.create({
      name: this.parentTableName,
      fields: parentFields,
      description: 'FK demo parent table',
    });
    if ('error' in parentCreate) {
      throw new Error(
        `Failed to create parent table: ${parentCreate.error?.message || 'Unknown error'}`
      );
    }

    const childCreate = await this.client.tables.create({
      name: this.childTableName,
      fields: childFields,
      description: 'FK demo child table',
    });
    if ('error' in childCreate) {
      throw new Error(
        `Failed to create child table: ${childCreate.error?.message || 'Unknown error'}`
      );
    }

    console.log(`   Parent table: ${this.parentTableName}`);
    console.log(`   Child table: ${this.childTableName}`);
  }

  private async prepareTypeMatrix(): Promise<void> {
    console.log('\n2️⃣ Prepare all parent type variants');

    const baseTs = Date.now();
    const entries: MatrixEntry[] = [
      {
        type: 'text',
        parentColumnName: 'ref_text',
        childFkColumnName: 'fk_text',
        parentField: { name: 'ref_text', type: 'text', is_nullable: false, is_unique: true, is_indexed: true },
        parentValue: `text_${baseTs}`,
      },
      {
        type: 'long-text',
        parentColumnName: 'ref_long_text',
        childFkColumnName: 'fk_long_text',
        parentField: { name: 'ref_long_text', type: 'long-text', is_nullable: false, is_unique: true },
        parentValue: `long_text_${baseTs}`,
      },
      {
        type: 'number',
        parentColumnName: 'ref_number',
        childFkColumnName: 'fk_number',
        parentField: { name: 'ref_number', type: 'number', is_nullable: false, is_unique: true },
        parentValue: 101,
      },
      {
        type: 'currency',
        parentColumnName: 'ref_currency',
        childFkColumnName: 'fk_currency',
        parentField: {
          name: 'ref_currency',
          type: 'currency',
          is_nullable: false,
          is_unique: true,
          currency_format: 'INR',
        },
        parentValue: 999.25,
      },
      {
        type: 'checkbox',
        parentColumnName: 'ref_checkbox',
        childFkColumnName: 'fk_checkbox',
        parentField: { name: 'ref_checkbox', type: 'checkbox', is_nullable: false, is_unique: true },
        parentValue: true,
      },
      {
        type: 'dropdown',
        parentColumnName: 'ref_dropdown',
        childFkColumnName: 'fk_dropdown',
        parentField: {
          name: 'ref_dropdown',
          type: 'dropdown',
          is_nullable: false,
          is_unique: true,
          selectable_items: ['RED', 'GREEN', 'BLUE'],
          multiple_selections: false,
        },
        parentValue: 'RED',
      },
      {
        type: 'email',
        parentColumnName: 'ref_email',
        childFkColumnName: 'fk_email',
        parentField: { name: 'ref_email', type: 'email', is_nullable: false, is_unique: true },
        parentValue: `demo_${baseTs}@example.com`,
      },
      {
        type: 'phone-number',
        parentColumnName: 'ref_phone',
        childFkColumnName: 'fk_phone',
        parentField: { name: 'ref_phone', type: 'phone-number', is_nullable: false, is_unique: true },
        parentValue: '+911234567890',
      },
      {
        type: 'link',
        parentColumnName: 'ref_link',
        childFkColumnName: 'fk_link',
        parentField: { name: 'ref_link', type: 'link', is_nullable: false, is_unique: true },
        parentValue: `https://example.com/${baseTs}`,
      },
      {
        type: 'json',
        parentColumnName: 'ref_json',
        childFkColumnName: 'fk_json',
        parentField: { name: 'ref_json', type: 'json', is_nullable: false, is_unique: false },
        parentValue: { tag: `json_${baseTs}` },
      },
      {
        type: 'date-time',
        parentColumnName: 'ref_datetime',
        childFkColumnName: 'fk_datetime',
        parentField: { name: 'ref_datetime', type: 'date-time', is_nullable: false, is_unique: true },
        parentValue: new Date().toISOString(),
      },
      {
        type: 'vector',
        parentColumnName: 'ref_vector',
        childFkColumnName: 'fk_vector',
        parentField: { name: 'ref_vector', type: 'vector', is_nullable: true, vector_dimension: 3, is_unique: false },
        parentValue: '[1,2,3]',
      },
      {
        type: 'halfvec',
        parentColumnName: 'ref_halfvec',
        childFkColumnName: 'fk_halfvec',
        parentField: {
          name: 'ref_halfvec',
          type: 'halfvec',
          is_nullable: true,
          vector_dimension: 3,
          is_unique: false,
        },
        parentValue: '[1,2,3]',
      },
      {
        type: 'sparsevec',
        parentColumnName: 'ref_sparsevec',
        childFkColumnName: 'fk_sparsevec',
        parentField: {
          name: 'ref_sparsevec',
          type: 'sparsevec',
          is_nullable: true,
          vector_dimension: 3,
          is_unique: false,
        },
        parentValue: '{1:1,2:2}/3',
      },
      {
        type: 'encrypted',
        parentColumnName: 'ref_encrypted',
        childFkColumnName: 'fk_encrypted',
        parentField: {
          name: 'ref_encrypted',
          type: 'encrypted',
          is_nullable: false,
          is_unique: true,
          show_decrypted: true,
          is_deterministic: true,
        },
        parentValue: `enc_${baseTs}`,
      },
    ];

    this.matrixEntries = entries;
  }

  private async createParentColumns(): Promise<void> {
    console.log('\n3️⃣ Create parent columns for all supported types');

    for (const entry of this.matrixEntries) {
      const res = await this.client.columns.create(this.parentTableName, entry.parentField);
      if (isErrorResponse(res)) {
        this.matrixResults.push({
          type: entry.type,
          parentColumnName: entry.parentColumnName,
          childFkColumnName: entry.childFkColumnName,
          parentColumnCreated: false,
          fkCreated: false,
          note: `Parent column create failed: ${this.getErrorMessage(res)}`,
        });
        continue;
      }

      this.parentInsertPayload[entry.parentColumnName] = entry.parentValue;
      this.matrixResults.push({
        type: entry.type,
        parentColumnName: entry.parentColumnName,
        childFkColumnName: entry.childFkColumnName,
        parentColumnCreated: true,
        fkCreated: false,
      });
    }
  }

  private async createChildForeignKeys(): Promise<void> {
    console.log('\n4️⃣ Try creating child foreign-key columns for each parent type');

    for (const entry of this.matrixEntries) {
      const resultIdx = this.matrixResults.findIndex(
        (r) => r.type === entry.type && r.parentColumnName === entry.parentColumnName
      );
      if (resultIdx === -1 || !this.matrixResults[resultIdx].parentColumnCreated) {
        continue;
      }

      const fkResult = await this.client.columns.createForeignKey(this.childTableName, {
        name: entry.childFkColumnName,
        type: 'foreign-key',
        reference_table_name: this.parentTableName,
        reference_column_name: entry.parentColumnName,
        fk_on_delete: 'CASCADE',
        fk_on_update: 'CASCADE',
        is_nullable: true,
      });

      if (isErrorResponse(fkResult)) {
        this.matrixResults[resultIdx].fkCreated = false;
        this.matrixResults[resultIdx].note = `FK create failed: ${this.getErrorMessage(fkResult)}`;
      } else {
        this.matrixResults[resultIdx].fkCreated = true;
      }
    }
  }

  private async insertParentRecord(): Promise<void> {
    console.log('\n5️⃣ Insert parent record');
    const parentInsert = await this.client.records.insert(this.parentTableName, this.parentInsertPayload);
    if (isErrorResponse(parentInsert)) {
      throw new Error(`Failed to insert parent record: ${parentInsert.error.message}`);
    }
    const parentRecord = (parentInsert.data || {}) as Record<string, unknown>;
    this.canonicalParentValuesByColumn = parentRecord;
    console.log('   Parent record inserted');
  }

  private buildChildPayloadFromCanonicalParentValues(): void {
    const payload: Record<string, unknown> = {};
    for (const entry of this.matrixEntries) {
      const result = this.matrixResults.find(
        (r) => r.type === entry.type && r.parentColumnName === entry.parentColumnName
      );
      if (!result?.fkCreated) continue;
      if (entry.type === 'encrypted') {
        result.note = `${result.note ? `${result.note}; ` : ''}Child insert skipped for encrypted FK value-encoding mismatch`;
        continue;
      }

      const canonicalValue = this.canonicalParentValuesByColumn[entry.parentColumnName];
      if (canonicalValue !== undefined) {
        payload[entry.childFkColumnName] = canonicalValue;
      }
    }

    this.childInsertPayload = payload;
  }

  private async insertChildRecord(): Promise<void> {
    console.log('\n6️⃣ Insert child record with successful FK references');

    this.childInsertPayload.child_name = 'child_row_1';

    const childInsert = await this.client.records.insert(this.childTableName, this.childInsertPayload);
    if (isErrorResponse(childInsert)) {
      throw new Error(`Failed to insert child record: ${this.getErrorMessage(childInsert)}`);
    }
    console.log('   Child record inserted');
  }

  private async renameForeignKeyColumns(): Promise<void> {
    console.log('\n7️⃣ Rename successful foreign-key columns');
    for (const result of this.matrixResults) {
      if (!result.fkCreated) continue;
      const renamed = `${result.childFkColumnName}_renamed`;
      const renameRes = await this.client.columns.renameForeignKey(
        this.childTableName,
        result.childFkColumnName,
        renamed
      );

      if (isErrorResponse(renameRes)) {
        result.fkRenamed = false;
        result.note = `${result.note ? `${result.note}; ` : ''}FK rename failed: ${this.getErrorMessage(renameRes)}`;
        continue;
      }

      result.renamedChildFkColumnName = renamed;
      result.fkRenamed = true;
    }
  }

  private async insertChildRecordAfterRename(): Promise<void> {
    console.log('\n8️⃣ Insert child record using renamed foreign-key columns');
    const payload: Record<string, unknown> = { child_name: 'child_row_after_rename' };

    for (const entry of this.matrixEntries) {
      const result = this.matrixResults.find(
        (r) => r.type === entry.type && r.parentColumnName === entry.parentColumnName
      );
      if (!result?.fkRenamed || !result.renamedChildFkColumnName) continue;
      if (entry.type === 'encrypted') {
        continue;
      }
      const canonicalValue = this.canonicalParentValuesByColumn[entry.parentColumnName];
      if (canonicalValue !== undefined) {
        payload[result.renamedChildFkColumnName] = canonicalValue;
      }
    }

    const childInsert = await this.client.records.insert(this.childTableName, payload);
    if (isErrorResponse(childInsert)) {
      throw new Error(`Failed to insert child record after FK rename: ${this.getErrorMessage(childInsert)}`);
    }
    console.log('   Child record inserted after FK rename');
  }

  private async deleteForeignKeyColumns(): Promise<void> {
    console.log('\n9️⃣ Delete renamed foreign-key columns');
    for (const result of this.matrixResults) {
      if (!result.fkRenamed || !result.renamedChildFkColumnName) continue;
      let deleteRes = await this.client.columns.deleteForeignKey(
        this.childTableName,
        result.renamedChildFkColumnName
      );

      // Fallback: if backend still resolves FK by original column name, retry delete with original name.
      if (isErrorResponse(deleteRes)) {
        deleteRes = await this.client.columns.deleteForeignKey(
          this.childTableName,
          result.childFkColumnName
        );
      }

      if (isErrorResponse(deleteRes)) {
        result.fkDeleted = false;
        result.note = `${result.note ? `${result.note}; ` : ''}FK delete failed: ${this.getErrorMessage(deleteRes)}`;
        continue;
      }
      result.fkDeleted = true;
    }
  }

  private async insertChildRecordAfterDelete(): Promise<void> {
    console.log('\n🔟 Insert child record after FK deletion (reference columns removed)');
    const payload: Record<string, unknown> = { child_name: 'child_row_after_delete' };
    const childInsert = await this.client.records.insert(this.childTableName, payload);
    if (isErrorResponse(childInsert)) {
      throw new Error(`Failed to insert child record after FK delete: ${this.getErrorMessage(childInsert)}`);
    }
    console.log('   Child record inserted after FK deletion');
  }

  private printSummary(): void {
    console.log('\n📊 FK compatibility summary by parent type');
    for (const result of this.matrixResults) {
      const expected = EXPECTED_FK_OUTCOME[result.type];
      const status =
        result.fkCreated
          ? '✅ FK CREATED'
          : expected === 'fk-create-expected-fail'
            ? '⚠️ EXPECTED FK FAIL'
            : '❌ FK FAILED';
      const parentStatus = result.parentColumnCreated ? 'parent-ok' : 'parent-failed';
      const renameStatus = result.fkCreated ? (result.fkRenamed ? 'rename-ok' : 'rename-fail') : 'rename-skip';
      const deleteStatus = result.fkRenamed ? (result.fkDeleted ? 'delete-ok' : 'delete-fail') : 'delete-skip';
      console.log(
        `   - ${result.type.padEnd(12)} | ${parentStatus.padEnd(13)} | ${status} | ${renameStatus} | ${deleteStatus} | parent_col=${
          result.parentColumnName
        } child_col=${result.childFkColumnName}${
          result.renamedChildFkColumnName ? ` renamed_col=${result.renamedChildFkColumnName}` : ''
        }${result.note ? ` | ${result.note}` : ''}`
      );
    }
  }

  private assertExpectedOutcomes(): void {
    const mismatches: string[] = [];

    for (const result of this.matrixResults) {
      const expected = EXPECTED_FK_OUTCOME[result.type];
      if (!expected) {
        mismatches.push(`No expectation configured for type: ${result.type}`);
        continue;
      }

      if (!result.parentColumnCreated) {
        mismatches.push(
          `${result.type}: parent column creation failed unexpectedly (${result.note || 'no detail'})`
        );
        continue;
      }

      if (expected === 'fk-create-expected-fail') {
        if (result.fkCreated) {
          mismatches.push(`${result.type}: FK creation unexpectedly succeeded`);
        }
        continue;
      }

      // Success-path expectations
      if (!result.fkCreated) {
        mismatches.push(`${result.type}: FK creation failed unexpectedly (${result.note || 'no detail'})`);
        continue;
      }
      if (!result.fkRenamed) {
        mismatches.push(`${result.type}: FK rename failed unexpectedly (${result.note || 'no detail'})`);
      }
      if (!result.fkDeleted) {
        mismatches.push(`${result.type}: FK delete failed unexpectedly (${result.note || 'no detail'})`);
      }

      if (expected === 'full-success-with-child-insert-skip') {
        const note = result.note || '';
        if (!note.includes('Child insert skipped')) {
          mismatches.push(`${result.type}: expected child insert skip note not found`);
        }
      }
    }

    if (mismatches.length > 0) {
      throw new Error(
        `FK lifecycle regression detected:\n- ${mismatches.join('\n- ')}`
      );
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleanup');

    const childDelete = await this.client.tables.delete(this.childTableName);
    if (isErrorResponse(childDelete)) {
      console.log(`   Child table cleanup warning: ${this.getErrorMessage(childDelete)}`);
    } else {
      console.log(`   Deleted child table: ${this.childTableName}`);
    }

    const parentDelete = await this.client.tables.delete(this.parentTableName);
    if (isErrorResponse(parentDelete)) {
      console.log(`   Parent table cleanup warning: ${this.getErrorMessage(parentDelete)}`);
    } else {
      console.log(`   Deleted parent table: ${this.parentTableName}`);
    }
  }
}

async function main(): Promise<void> {
  const demo = new ForeignKeyLifecycleDemo();
  await demo.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Foreign-key lifecycle demo failed:', error);
    process.exit(1);
  });
}

export { ForeignKeyLifecycleDemo };
