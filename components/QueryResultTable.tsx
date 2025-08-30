
import React, { useState } from 'react';
import Button from './Button';

interface QueryResultTableProps {
  headers: string[];
  rows: any[][];
}

const ROWS_PER_PAGE = 5;

const QueryResultTable: React.FC<QueryResultTableProps> = ({ headers, rows }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);

  const paginatedRows = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );
  
  const handlePrev = () => {
    setCurrentPage(p => Math.max(1, p - 1));
  };

  const handleNext = () => {
    setCurrentPage(p => Math.min(totalPages, p + 1));
  };
  
  if (rows.length === 0) {
      return <p className="p-4 text-center text-gray-500 dark:text-gray-400">Query returned no results.</p>
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header, index) => (
                <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {header.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-2">
                <Button onClick={handlePrev} disabled={currentPage === 1} size="sm" variant="secondary">Previous</Button>
                <Button onClick={handleNext} disabled={currentPage === totalPages} size="sm" variant="secondary">Next</Button>
            </div>
        </div>
      )}
    </div>
  );
};

export default QueryResultTable;