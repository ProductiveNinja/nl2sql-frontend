/**
 * dataValidator.ts
 * 
 * Validates and analyzes data types in query results.
 * - Checks each column to determine if it contains numbers or strings
 * - Returns column type information: { columnName: string, type: 'number' | 'string' | 'date' }
 * - Validates data consistency (all rows have same structure)
 * - Detects numeric columns that can be used for charts
 * - Detects categorical columns that can be used as labels
 * - Exports validateData() and getColumnTypes() functions
 */
export {};