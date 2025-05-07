'use client'
import React, { useState, useEffect } from 'react';
import { ConditioningFactor } from './conditioningFactors';

interface WeightAdjustmentProps {
  selectedFactors: ConditioningFactor[];
  onWeightsChange: (factors: ConditioningFactor[]) => void;
}

const WeightAdjustment: React.FC<WeightAdjustmentProps> = ({ 
  selectedFactors, 
  onWeightsChange 
}) => {
  const [factors, setFactors] = useState<ConditioningFactor[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  
  useEffect(() => {
    setFactors(selectedFactors);
    calculateTotalWeight(selectedFactors);
  }, [selectedFactors]);
  
  const calculateTotalWeight = (factors: ConditioningFactor[]) => {
    const total = factors.reduce((sum, factor) => sum + factor.weight, 0);
    setTotalWeight(total);
  };
  
  const handleWeightChange = (id: string, newWeight: number) => {
    // Ensure weight is between 1 and 10
    const adjustedWeight = Math.max(1, Math.min(10, newWeight));
    
    const updatedFactors = factors.map(factor => 
      factor.id === id 
        ? { ...factor, weight: adjustedWeight } 
        : factor
    );
    
    setFactors(updatedFactors);
    calculateTotalWeight(updatedFactors);
    onWeightsChange(updatedFactors);
  };
  
  const normalizedWeight = (weight: number) => {
    return totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0.0';
  };
  
  if (factors.length === 0) {
    return (
      <div className="bg-white rounded-md shadow-md p-6 mt-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Weight Adjustment</h2>
        <p className="text-sm text-gray-600">
          Please select conditioning factors to adjust their weights.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-md shadow-md p-6 mt-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">Weight Adjustment</h2>
      <p className="text-sm text-gray-600 mb-4">
        Adjust the importance of each selected conditioning factor
      </p>
      
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-4 font-medium text-sm text-gray-700 mb-2 pb-2 border-b">
          <div>Factor</div>
          <div>Weight (1-10)</div>
          <div>Normalized (%)</div>
        </div>
        
        {factors.map(factor => (
          <div key={factor.id} className="grid grid-cols-3 gap-4 py-2 text-sm border-b border-gray-100">
            <div>{factor.name}</div>
            <div className="flex items-center">
              <button 
                className="w-6 h-6 bg-gray-200 rounded-full font-bold text-gray-700 hover:bg-gray-300 transition-colors"
                onClick={() => handleWeightChange(factor.id, factor.weight - 1)}
                disabled={factor.weight <= 1}
              >
                -
              </button>
              <span className="mx-3">{factor.weight}</span>
              <button 
                className="w-6 h-6 bg-gray-200 rounded-full font-bold text-gray-700 hover:bg-gray-300 transition-colors"
                onClick={() => handleWeightChange(factor.id, factor.weight + 1)}
                disabled={factor.weight >= 10}
              >
                +
              </button>
            </div>
            <div>{normalizedWeight(factor.weight)}%</div>
          </div>
        ))}
        
        <div className="grid grid-cols-3 gap-4 py-2 text-sm font-medium mt-2">
          <div>Total</div>
          <div>{totalWeight}</div>
          <div>100.0%</div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-2">Weight Guidelines</h3>
        <ul className="text-xs text-gray-600 space-y-1 mb-2">
          <li>1-3: Low importance</li>
          <li>4-7: Medium importance</li>
          <li>8-10: High importance</li>
        </ul>
        <p className="text-xs text-gray-600">
          The normalized percentage shows the relative influence of each factor in the final analysis.
        </p>
      </div>
    </div>
  );
};

export default WeightAdjustment;