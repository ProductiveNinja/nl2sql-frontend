/**
 * chartHelper.ts
 * 
 * Helper functions for determining chart visualization options.
 * - Analyzes query result data structure
 * - Determines if data can be visualized as a chart
 * - Decides between pie chart vs bar chart based on data
 * - Returns: { canVisualize: boolean, chartType: 'pie' | 'bar' | null }
 * - Checks for: numeric columns, categorical columns, data distribution
 * - Works with dataValidator to validate data types
 * - Transforms data into chart-ready format
 */
export {};