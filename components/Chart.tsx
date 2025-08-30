
import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { ChatMessageContent } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartProps {
  suggestion: NonNullable<ChatMessageContent['chartSuggestion']>;
  results: NonNullable<ChatMessageContent['results']>;
}

const Chart: React.FC<ChartProps> = ({ suggestion, results }) => {
  const { chartType, labelsColumn, dataColumn } = suggestion;
  const { headers, rows } = results;

  const labelsIndex = headers.indexOf(labelsColumn);
  const dataIndex = headers.indexOf(dataColumn);

  if (labelsIndex === -1 || dataIndex === -1) {
    return <p className="text-red-500">Chart error: Could not find specified data columns.</p>;
  }

  const labels = rows.map(row => row[labelsIndex]);
  const dataPoints = rows.map(row => row[dataIndex]);

  const chartData = {
    labels,
    datasets: [
      {
        label: `${dataColumn.replace(/_/g, ' ')}`,
        data: dataPoints,
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(139, 92, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
            color: document.body.classList.contains('dark') ? '#E5E7EB' : '#4B5563',
        }
      },
      title: {
        display: true,
        text: `${dataColumn.replace(/_/g, ' ')} by ${labelsColumn.replace(/_/g, ' ')}`,
        color: document.body.classList.contains('dark') ? '#F9FAFB' : '#1F2937',
        font: {
            size: 16
        }
      },
    },
    scales: chartType === 'bar' ? {
        y: {
            beginAtZero: true,
            ticks: { color: document.body.classList.contains('dark') ? '#9CA3AF' : '#6B7280' },
            grid: { color: document.body.classList.contains('dark') ? '#374151' : '#E5E7EB' }
        },
        x: {
            ticks: { color: document.body.classList.contains('dark') ? '#9CA3AF' : '#6B7280' },
            grid: { color: document.body.classList.contains('dark') ? '#374151' : '#E5E7EB' }
        }
    } : undefined
  };

  const pieOptions = {...options, scales: undefined };


  return (
    <div className="h-96">
      {chartType === 'bar' ? <Bar options={options} data={chartData} /> : null}
      {chartType === 'pie' ? <Pie options={pieOptions} data={chartData} /> : null}
    </div>
  );
};

export default Chart;
