'use client'
import React from 'react';
import { useConstraintFactors } from '../../../../../contexts/Suitability/constraintContext';
import { ConstraintFactor } from '../../../../../contexts/Suitability/constraintContext';

interface ConstraintFactorsProps {
  onFactorsChange?: (factors: ConstraintFactor[]) => void;
}

const ConstraintFactors: React.FC<ConstraintFactorsProps> = ({ onFactorsChange }) => {
  const { factors, loading, updateFactors } = useConstraintFactors();

  // Group factors by category
  const factorsByCategory = factors.reduce((acc, factor) => {
    if (!acc[factor.category]) {
      acc[factor.category] = [];
    }
    acc[factor.category].push(factor);
    return acc;
  }, {} as { [key: string]: ConstraintFactor[] });

  const handleFactorToggle = (id: string) => {
    const updatedFactors = factors.map(factor => 
      factor.id === id ? { ...factor, selected: !factor.selected } : factor
    );
    updateFactors(updatedFactors);
    onFactorsChange?.(updatedFactors.filter(f => f.selected));
  };

  const handleSelectAllCategory = (category: string, select: boolean) => {
    const updatedFactors = factors.map(factor => 
      factor.category === category ? { ...factor, selected: select } : factor
    );
    updateFactors(updatedFactors);
    onFactorsChange?.(updatedFactors.filter(f => f.selected));
  };

  return (
    <div className="bg-white rounded-md shadow-md p-6 mt-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">Constraint Factors</h2>
      <p className="text-sm text-gray-600 mb-4">
        Select absolute limitations that exclude areas from consideration
      </p>
      
      {loading ? (
        <div className="py-4 text-center text-gray-500">Loading constraint factors...</div>
      ) : factors.length === 0 ? (
        <div className="py-4 text-center text-gray-500">No constraint factors available. Add API implementation to fetch data.</div>
      ) : (
        Object.entries(factorsByCategory).map(([category, categoryFactors]) => (
          <div key={category} className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-medium text-gray-700">{category}</h3>
              <div className="flex gap-2">
                <button 
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
                  onClick={() => handleSelectAllCategory(category, true)}
                >
                  Select All
                </button>
                <button 
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
                  onClick={() => handleSelectAllCategory(category, false)}
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {categoryFactors.map(factor => (
                <div key={factor.id} className="flex items-start">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={factor.selected}
                      onChange={() => handleFactorToggle(factor.id)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <span className="block text-sm font-medium">{factor.name}</span>
                      <span className="block text-xs text-gray-500">{factor.description}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ConstraintFactors;