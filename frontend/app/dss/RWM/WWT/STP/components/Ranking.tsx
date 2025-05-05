'use client'
import React, { useEffect, useRef, useState } from 'react';
// Mock data for demonstration
const mockRankingData = [
  { name: 'Region A', rank: 5 },
  { name: 'Region B', rank: 3 },
  { name: 'Region C', rank: 4 },
  { name: 'Region D', rank: 2 },
  { name: 'Region E', rank: 1 }
];

const RankingChart = () => {
  const [rankingData, setRankingData] = useState(mockRankingData);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Function to generate a random color with specified alpha
  const generateRandomColor = (alpha) => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  // Create or update chart when data changes
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Check if Chart.js is available globally
    if (!window.Chart) {
      console.error('Chart.js is not loaded. Please include Chart.js in your project.');
      return;
    }
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Get canvas context
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Create chart
    chartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: rankingData.map(item => item.name),
        datasets: [
          {
            label: 'Rank',
            data: rankingData.map(item => item.rank),
            backgroundColor: rankingData.map(() => generateRandomColor(0.2)),
            borderColor: rankingData.map(() => generateRandomColor(1)),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Rank',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: 'Location Rankings',
            font: {
              size: 16,
              Influence: 'bold',
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Rank: ${context.raw}`;
              },
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
        },
      },
    });
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [rankingData]);
  
  // Simulate generating rankings
  const generateRankings = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Create new random rankings
      const newRankings = [...rankingData].sort(() => Math.random() - 0.5);
      
      // Reassign ranks (1 is best)
      const updatedRankings = newRankings.map((item, index) => ({
        name: item.name,
        rank: index + 1
      }));
      
      setRankingData(updatedRankings);
      setLoading(false);
    }, 1500);
  };
  
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center text-gray-700">
          <i className="fas fa-chart-bar mr-2"></i>
          Rankings
        </h3>
        
        <button 
          onClick={generateRankings}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {loading ? (
            <span className="flex items-center">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Ranking...
            </span>
          ) : (
            'Generate Rankings'
          )}
        </button>
      </div>
      
      <div className="relative p-4">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-green-600 font-medium">Calculating rankings...</p>
            </div>
          </div>
        )}
        
        <div className="h-80">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 text-sm text-gray-600 rounded-b-lg">
        <div className="flex justify-between items-center">
          <span>Lower rank number indicates higher priority</span>
          <button
            onClick={() => setRankingData(mockRankingData)}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            Reset to default rankings
          </button>
        </div>
      </div>
    </div>
  );
};

export default RankingChart;