import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';

type ResultItem = { [key: string]: string | number | null };
type ChartComponentProps = {
  data: ResultItem[];
  chartType: 'bargraph' | 'linegraph' | 'pie';
  columnOrder?: string[];
  onRender?: () => void;
};

type ChartDataPoint = {
  x: string | number;
  y: number;
};

type ChartConfig = {
  type: string;
  data: {
    labels?: string[];
    datasets: Array<{
      label: string;
      data: number[] | ChartDataPoint[];
      backgroundColor: string | string[];
      borderColor: string | string[];
      borderWidth?: number;
      tension?: number;
      fill?: boolean;
    }>;
  };
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    parsing?: boolean;
    scales?: {
      x?: {
        type: string;
        title: { display: boolean; text: string };
      };
      y?: {
        title: { display: boolean; text: string };
        beginAtZero: boolean;
        stacked?: boolean;
        min?: number;
        max?: number;
        suggestedMax?: number;
      };
    };
    plugins?: {
      legend?: { position: string };
      tooltip?: {
        callbacks: {
          label: (ctx: { parsed: number; label: string; dataset: { data: number[] } }) => string;
        };
      };
    };
  };
};

const SWISSCOM_COLORS = [
  '#0eaba9', // Teal
  '#1781e3', // Blue
  '#5944c6', // Purple
  '#a63297', // Magenta
  '#e61e64', // Pink
  '#ff8800', // Orange
  '#06bf7f', // Green
  '#5e35b1', // Deep Purple
  '#d81b60', // Dark Pink
  '#1e88e5', // Light Blue
  '#00acc1', // Cyan
  '#43a047', // Light Green
];

const toRGBA = (hex: string, alpha = 0.2) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ensureNumber = (value: string | number | null | undefined): number => {
  if (value == null) return 0;
  if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
  if (typeof value === 'object') return Number(String(value));
  return Number(value);
};

// Helper to determine if a string looks like a column name for numeric values
const isNumericColumnName = (name: string): boolean => {
  return /count|sum|total|amount|number|avg|rentals|quantity|price|sales|revenue|profit/i.test(name);
};

// Helper to determine if a string looks like a name/category column
const isNameColumnName = (name: string): boolean => {
  return /name|customer|client|person|user|category|type|description/i.test(name);
};

// Detect if a field contains mostly numeric values
const isNumericField = (data: ResultItem[], key: string): boolean => {
  if (!data.length) return false;

  // If column name suggests numeric content, prioritize that
  if (isNumericColumnName(key)) return true;

  const numericCount = data.filter((item) => {
    const val = item[key];
    return typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val.replace(/,/g, ''))));
  }).length;

  return numericCount / data.length > 0.8; // 80% of values should be numeric
};

// Detect if a field contains text that looks like names
const isNameField = (data: ResultItem[], key: string): boolean => {
  if (!data.length) return false;

  // Check if field name contains common name-related terms
  if (isNameColumnName(key)) return true;

  // Check if values look like names (contain uppercase letters and spaces)
  const namePatternCount = data.filter((item) => {
    const val = String(item[key] || '');
    return /[A-Z]/.test(val) && /\s/.test(val) && !/^\d+$/.test(val);
  }).length;

  return namePatternCount / data.length > 0.5;
};

// Detect if a field looks like a date or year field
const isDateOrYearField = (data: ResultItem[], key: string): boolean => {
  if (!data.length) return false;

  // Check if column name suggests date or year
  if (/date|year|month|day|week|quarter/i.test(key)) return true;

  // Check if values look like years
  const yearPatternCount = data.filter((item) => {
    const val = String(item[key] || '');
    return (
      /^(19|20)\d{2}$/.test(val) || // Year format: 1900-2099
      /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(val)
    ); // Date format: MM/DD/YYYY or similar
  }).length;

  return yearPatternCount / data.length > 0.5;
};

// Calculate appropriate y-axis range
const calculateYAxisRange = (values: number[]): { min: number; max: number } => {
  if (!values.length) return { min: 0, max: 100 };

  const min = 0; // Usually start at 0 for counts/metrics
  const maxValue = Math.max(...values);

  // Add 10% padding to the top
  const max = Math.ceil(maxValue * 1.1);

  return { min, max };
};

// Determine the best axis configuration for the data
const determineAxisConfig = (data: ResultItem[], columns: string[]): { xKey: string; yKey: string } => {
  // First, check if we have a 'Year' column - it should always be the x-axis
  const yearColumnIndex = columns.findIndex((col) => col === 'Year');
  if (yearColumnIndex !== -1) {
    // Find the best metric column for y-axis
    const metricColumns = columns.filter((col) => col !== 'Year' && isNumericField(data, col));
    if (metricColumns.length > 0) {
      return { xKey: 'Year', yKey: metricColumns[0] };
    }
  }

  // Next, check if we have explicit column patterns
  const metricColumns = columns.filter((col) => isNumericColumnName(col));
  const categoryColumns = columns.filter((col) => isNameColumnName(col));
  const dateColumns = columns.filter((col) => isDateOrYearField(data, col));

  // If we have a clear category and metric, use those
  if (categoryColumns.length === 1 && metricColumns.length === 1) {
    return { xKey: categoryColumns[0], yKey: metricColumns[0] };
  }

  // If we have a date/year column and a metric, prioritize that (time series)
  if (dateColumns.length === 1 && metricColumns.length === 1) {
    return { xKey: dateColumns[0], yKey: metricColumns[0] };
  }

  // Otherwise, detect numerics more generically
  const numericColumns = columns.filter((col) => isNumericField(data, col));
  const nonNumericColumns = columns.filter((col) => !isNumericField(data, col));

  if (numericColumns.length === 1 && nonNumericColumns.length === 1) {
    return { xKey: nonNumericColumns[0], yKey: numericColumns[0] };
  }

  if (numericColumns.length >= 1 && nonNumericColumns.length >= 1) {
    // When multiple options, prioritize more likely category/name columns for x-axis
    const bestCategory = nonNumericColumns.sort((a, b) => {
      const aIsName = isNameField(data, a) ? 1 : 0;
      const bIsName = isNameField(data, b) ? 1 : 0;
      return bIsName - aIsName; // Higher score for name fields
    })[0];

    // For y-axis, prioritize metrics that sound like aggregates
    const bestMetric = numericColumns.sort((a, b) => {
      const aIsMetric = isNumericColumnName(a) ? 1 : 0;
      const bIsMetric = isNumericColumnName(b) ? 1 : 0;
      return bIsMetric - aIsMetric; // Higher score for metric names
    })[0];

    return { xKey: bestCategory, yKey: bestMetric };
  }

  // Fallback: just use the first two columns
  return { xKey: columns[0], yKey: columns[1] };
};

// For debugging
const logDataSample = (data: ResultItem[], xKey: string, yKey: string): void => {
  if (!data.length) return;
  console.log('Sample data point:');
  console.log('Row:', data[0]);
  console.log(`X-axis (${xKey})`, data[0][xKey]);
  console.log(`Y-axis (${yKey})`, data[0][yKey]);
  console.log(
    'X values:',
    data.map((d) => d[xKey]),
  );
  console.log(
    'Y values:',
    data.map((d) => d[yKey]),
  );
};

// Dynamic import for Chart.js to fix hydration issues
const ChartComponent: React.FC<ChartComponentProps> = ({ data, chartType, columnOrder, onRender }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    console.log('Chart data being displayed:', data, 'Chart type:', chartType);

    chartInstance.current?.destroy();

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Use column order from props if available, otherwise use Object.keys
    const columns = columnOrder || Object.keys(data[0]);
    console.log('Column order:', columns);

    // Determine best axis configuration based on data patterns
    const { xKey, yKey } = determineAxisConfig(data, columns);

    // Log data examples for debugging
    logDataSample(data, xKey, yKey);

    const seriesKey = columns.length > 2 ? columns[2] : null; // Third column is series/category if available

    console.log(`Using ${yKey} as Y-axis (numeric), ${xKey} as X-axis (categorical)`);

    // Always use the actual column name for display
    const xAxisLabel = columns.includes(xKey) ? xKey : columns.length >= 2 ? columns[1] : xKey;
    const yAxisLabel = columns.includes(yKey) ? yKey : columns.length >= 1 ? columns[0] : yKey;

    console.log(`Display labels: X = ${xAxisLabel}, Y = ${yAxisLabel}`);

    const config: ChartConfig = {
      type: 'bar',
      data: { datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed;
                return `${ctx.label}: ${value}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: xAxisLabel,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: yAxisLabel,
            },
          },
        },
      },
    };

    const color = SWISSCOM_COLORS[0];

    switch (chartType) {
      case 'bargraph':
        config.type = 'bar';

        // Special case for Year + Category data structure (from SQL query)
        if (xKey === 'Year' && columns.includes('Category')) {
          const seriesKey = 'Category';

          // Group data by series (Category)
          const seriesGroups = new Map<string, { x: string; y: number }[]>();
          // Sort years numerically
          const allYears = [...new Set(data.map((d) => String(d[xKey])))].sort((a, b) => Number(a) - Number(b));

          data.forEach((d) => {
            const seriesValue = String(d[seriesKey] || 'Unknown');
            if (!seriesGroups.has(seriesValue)) {
              seriesGroups.set(seriesValue, []);
            }
            seriesGroups.get(seriesValue)!.push({
              x: String(d[xKey]),
              y: ensureNumber(d[yKey]),
            });
          });

          // Create datasets for each category
          let colorIndex = 0;
          const categoryEntries = Array.from(seriesGroups.entries());
          // Sort categories alphabetically for consistent coloring
          categoryEntries.sort((a, b) => a[0].localeCompare(b[0]));

          categoryEntries.forEach(([series, points]) => {
            const seriesColor = SWISSCOM_COLORS[colorIndex % SWISSCOM_COLORS.length];
            colorIndex++;

            // Create a dataset for this category
            // Ensure we have data points for all years by creating a map
            const yearToValue = new Map(points.map((p) => [p.x, p.y]));
            const orderedData = allYears.map((year) => yearToValue.get(year) || 0);

            config.data.datasets.push({
              label: series,
              data: orderedData,
              backgroundColor: toRGBA(seriesColor, 0.7),
              borderColor: seriesColor,
              borderWidth: 1,
            });
          });

          // Use years as labels, sorted chronologically
          config.data.labels = allYears;
        } else if (seriesKey && columns.length > 2) {
          // Group data by series
          const seriesGroups = new Map<string, { x: string; y: number }[]>();

          data.forEach((d) => {
            const seriesValue = String(d[seriesKey] || 'Unknown');
            if (!seriesGroups.has(seriesValue)) {
              seriesGroups.set(seriesValue, []);
            }
            seriesGroups.get(seriesValue)!.push({
              x: String(d[xKey]),
              y: ensureNumber(d[yKey]),
            });
          });

          // Create datasets for each series
          let colorIndex = 0;
          seriesGroups.forEach((points, series) => {
            const seriesColor = SWISSCOM_COLORS[colorIndex % SWISSCOM_COLORS.length];
            colorIndex++;
            config.data.datasets.push({
              label: series,
              data: points.map((p) => p.y),
              backgroundColor: toRGBA(seriesColor, 0.7),
              borderColor: seriesColor,
              borderWidth: 1,
            });
          });

          // Use first series x values as labels
          const firstSeries = Array.from(seriesGroups.values())[0];
          config.data.labels = firstSeries.map((point) => point.x);
        } else {
          // Simple bar chart with single dataset
          const categories = data.map((d) => String(d[xKey]));
          const values = data.map((d) => ensureNumber(d[yKey]));
          const { max } = calculateYAxisRange(values);

          config.data = {
            labels: categories,
            datasets: [
              {
                label: yKey,
                data: values,
                backgroundColor: categories.map((_, i) => toRGBA(SWISSCOM_COLORS[i % SWISSCOM_COLORS.length], 0.7)),
                borderColor: categories.map((_, i) => SWISSCOM_COLORS[i % SWISSCOM_COLORS.length]),
                borderWidth: 1,
              },
            ],
          };

          config.options.scales = {
            y: {
              beginAtZero: true,
              min: 0,
              max,
              title: {
                display: true,
                text: yKey,
              },
            },
            x: {
              type: 'category',
              title: {
                display: true,
                text: xKey,
              },
            },
          };
        }
        break;

      case 'linegraph':
        config.type = 'line';

        // Check if we have series data for multiple lines
        if (seriesKey && columns.length > 2) {
          // Group data by series
          const seriesGroups = new Map<string, { x: string; y: number }[]>();
          const allXValues = new Set<string>();

          data.forEach((d) => {
            const seriesValue = String(d[seriesKey] || 'Unknown');
            const xValue = String(d[xKey]);
            if (!seriesGroups.has(seriesValue)) {
              seriesGroups.set(seriesValue, []);
            }
            seriesGroups.get(seriesValue)!.push({
              x: xValue,
              y: ensureNumber(d[yKey]),
            });
            allXValues.add(xValue);
          });

          // Create a dataset for each series
          const datasets = Array.from(seriesGroups.entries()).map(([series, points], index) => {
            const seriesColor = SWISSCOM_COLORS[index % SWISSCOM_COLORS.length];
            return {
              label: series,
              data: points.map((p) => p.y),
              backgroundColor: toRGBA(seriesColor, 0.2),
              borderColor: seriesColor,
              borderWidth: 2,
              tension: 0.3,
            };
          });

          config.data = {
            // Use x values from the first series as labels
            labels: Array.from(seriesGroups.values())[0].map((p) => p.x),
            datasets,
          };
        } else {
          // For line charts with categories on x-axis
          const lineCategories = data.map((d) => String(d[xKey]));
          const lineValues = data.map((d) => ensureNumber(d[yKey]));
          const lineRange = calculateYAxisRange(lineValues);

          config.data = {
            labels: lineCategories,
            datasets: [
              {
                label: yKey,
                data: lineValues,
                backgroundColor: toRGBA(color, 0.2),
                borderColor: color,
                borderWidth: 2,
                tension: 0.3,
              },
            ],
          };

          config.options.scales = {
            y: {
              beginAtZero: true,
              min: 0,
              max: lineRange.max,
              title: {
                display: true,
                text: yKey,
              },
            },
            x: {
              type: 'category',
              title: {
                display: true,
                text: xKey,
              },
            },
          };
        }
        break;

      case 'pie':
        const pieLabels = data.map((d) => String(d[xKey]));
        const pieValues = data.map((d) => ensureNumber(d[yKey]));

        config.type = 'pie';
        config.data = {
          labels: pieLabels,
          datasets: [
            {
              label: yKey,
              data: pieValues,
              backgroundColor: pieLabels.map((_, i) => SWISSCOM_COLORS[i % SWISSCOM_COLORS.length]),
              borderColor: 'white',
              borderWidth: 1,
            },
          ],
        };

        config.options.plugins = {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed;
                const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const pct = Math.round((value / total) * 100);
                return `${ctx.label}: ${value} (${pct}%)`;
              },
            },
          },
        };
        break;
    }

    // Handle Chart.js type casting - suppress TypeScript errors
    // @ts-expect-error - Chart.js typing is complex, but this works at runtime
    chartInstance.current = new Chart(ctx, config);

    // Call onRender callback after chart is created
    if (onRender) {
      setTimeout(onRender, 200);
    }

    return () => chartInstance.current?.destroy();
  }, [data, chartType, columnOrder, onRender]);

  useEffect(() => {
    // After chart is created and rendered
    if (chartInstance.current) {
      console.log('Chart options:', chartInstance.current.options);
      // Debug chart configuration
      console.log('Chart scales:', chartInstance.current.options.scales);

      // Force update to ensure labels are shown
      chartInstance.current.update();

      // Call onRender callback when chart is updated
      if (onRender) {
        setTimeout(onRender, 100);
      }
    }
  }, [chartInstance.current, onRender]);

  return (
    <div style={{ width: '100%', height: '450px', position: 'relative' }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default ChartComponent;
