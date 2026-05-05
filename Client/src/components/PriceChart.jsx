import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip
);

export default function PriceChart({ prices }) {
  if (!prices || prices.length === 0) return null;

  // Filter out invalid prices
  const validPrices = prices.filter(p => p.price != null);
  if (validPrices.length < 2) return null; // Need at least 2 to compare

  // Find min price to color it differently
  const minPrice = Math.min(...validPrices.map(p => p.price));

  const data = {
    labels: validPrices.map(p => p.site.split('.')[0]), // Capitalized in CSS/UI later
    datasets: [
      {
        data: validPrices.map(p => p.price),
        backgroundColor: validPrices.map(p => 
          p.price === minPrice ? 'rgba(16, 185, 129, 0.8)' : 'rgba(59, 130, 246, 0.4)'
        ),
        hoverBackgroundColor: validPrices.map(p => 
          p.price === minPrice ? 'rgba(16, 185, 129, 1)' : 'rgba(59, 130, 246, 0.6)'
        ),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              // Assume currency from the first valid price
              label += `${validPrices[0].currency} ${context.parsed.y.toLocaleString()}`;
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        display: false, // Hide Y axis entirely for cleaner look
        beginAtZero: false,
        min: minPrice * 0.9, // Start y-axis slightly below the min price to accentuate differences
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          textStrokeColor: 'transparent',
          autoSkip: false,
          maxRotation: 0,
          callback: function(value, index, values) {
             const label = this.getLabelForValue(value);
             return label.charAt(0).toUpperCase() + label.slice(1);
          }
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Price Comparison</h3>
      <div className="h-32 w-full p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
