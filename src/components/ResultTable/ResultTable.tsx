import React, { useEffect } from 'react';
import styles from './ResultTable.module.css';

type ResultItem = Record<string, string | number | null>;

type Props = {
  title?: string;
  data: ResultItem[];
  columnOrder?: string[];
  onLoad?: () => void;
};

const ResultTable: React.FC<Props> = ({ data, columnOrder, onLoad }) => {
  if (!data?.length) return <div className={styles.empty_state}>Please send a query to see results</div>;

  console.log('Table data being displayed:', data);
  const headers = columnOrder || Object.keys(data[0]);

  // Call onLoad when table renders
  useEffect(() => {
    if (onLoad) {
      setTimeout(onLoad, 100);
    }
  }, [data, onLoad]);

  return (
    <div className={`${styles.table_container} text-standard`}>
      <table className={styles.data_table}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={i % 2 ? styles.odd_row : styles.even_row}>
              {headers.map((h) => (
                <td key={h}>{row[h] ?? ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultTable;
