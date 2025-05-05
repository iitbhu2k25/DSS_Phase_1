'use client'
import React from 'react';
import { useCategory } from '@/app/contexts/STP/CategoryContext';

export const CategorySlider = () => {
  const { categories, selectedCategories, isSelected, updateCategoryWeight, getCategoryWeight } = useCategory();
  
  // If no categories are selected, show a message
  if (selectedCategories.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select categories to adjust their weights
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <h3 className="text-lg font-medium mb-3 text-gray-800">Category Weights (0-100)</h3>
      
      <div className="space-y-4">
        {categories.map((category) => (
          // Only render sliders for selected categories
          isSelected(category.RasterName) && (
            <div key={category.id} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className={`text-sm font-medium ${category.color}`}>
                  {category.name}
                </span>
                <span className="text-sm font-bold">
                  {getCategoryWeight(category.RasterName)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs">0</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={getCategoryWeight(category.RasterName)}
                  onChange={(e) => updateCategoryWeight(category.RasterName, parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs">100</span>
              </div>
            </div>
          )
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Adjust the sliders to change the importance of each category in the analysis
      </div>
    </div>
  );
};

export default CategorySlider;