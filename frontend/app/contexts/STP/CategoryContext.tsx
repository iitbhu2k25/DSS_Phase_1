'use client'
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define types
export interface Category {
  id: number;
  name: string;
  RasterName: string;
  icon: string;
  defaultWeight: string; // Changed from weight to defaultWeight
  color: string;
}

// Interface for raster layer selection
export interface SelectRasterLayer {
  RasterName: string;
  weight: string;
}

interface CategoryContextType {
  categories: Category[];
  selectedCategoryName: SelectRasterLayer[];
  selectedCategories: SelectRasterLayer[];
  toggleCategory: (RasterName: string) => void;
  updateCategoryWeight: (RasterName: string, weight: number) => void; // New function to update weight
  selectAllCategories: () => void;
  clearAllCategories: () => void;
  isSelected: (RasterName: string) => boolean;
  getCategoryWeight: (RasterName: string) => number; // New function to get current weight
}

interface CategoryProviderProps {
  children: ReactNode;
}

// Create context with default undefined value
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Available categories with their details
const AVAILABLE_CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Proximity to Critical River Stretches',
    RasterName: 'STP_River_Stretches_Raster',
    icon: 'water',
    defaultWeight: '29.3', // Changed from weight to defaultWeight
    color: 'text-blue-500'
  },
  {
    id: 2,
    name: 'Population Density',
    RasterName: 'STP_Population_Density_Raster',
    icon: 'users',
    defaultWeight: '26.8',
    color: 'text-red-500'
  },
  {
    id: 3,
    name: 'Distance from Drainage Network',
    RasterName: 'STP_Drainage_Network_Raster',
    icon: 'tint',
    defaultWeight: '16.6',
    color: 'text-blue-400'
  },
  {
    id: 4,
    name: 'Buffer of the Drain Outlet based on their flow',
    RasterName: 'STP_Drain_Outlet_Raster',
    icon: 'stream',
    defaultWeight: '9.4',
    color: 'text-green-500'
  },
  {
    id: 5,
    name: 'Land Availability',
    RasterName: 'STP_Land_Availability_Raster',
    icon: 'mountain',
    defaultWeight: '6.8',
    color: 'text-yellow-500'
  },
  {
    id: 6,
    name: 'Ground Quality',
    RasterName: 'STP_Ground_Quality_Raster',
    icon: 'layer-group',
    defaultWeight: '5.9',
    color: 'text-blue-500'
  },
  {
    id: 7,
    name: 'GroundWater Depth',
    RasterName: 'STP_GroundWater_Depth_Raster',
    icon: 'tint-slash',
    defaultWeight: '5.2',
    color: 'text-blue-400'
  }
];

// Category provider component
export const CategoryProvider = ({ children }: CategoryProviderProps) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<SelectRasterLayer[]>([]);

  // Get selected category details for API
  const getSelectedCategoryNames = (): SelectRasterLayer[] => {
    return AVAILABLE_CATEGORIES
      .filter(category => selectedCategoryName.some(item => item.RasterName === category.RasterName))
      .map(category => {
        // Find the custom weight if it exists
        const customWeight = selectedCategoryName.find(
          item => item.RasterName === category.RasterName
        )?.weight;
        
        return {
          RasterName: category.RasterName,
          weight: customWeight || category.defaultWeight
        };
      });
  };
  
  // Toggle a category selection
  const toggleCategory = (RasterName: string): void => {
    setSelectedCategoryName(prev => {
      // Find if the RasterName already exists in the selection
      const isSelected = prev.some(item => item.RasterName === RasterName);
      
      if (isSelected) {
        // Remove it if already selected
        return prev.filter(item => item.RasterName !== RasterName);
      } else {
        // Add it with defaultWeight from the AVAILABLE_CATEGORIES
        const category = AVAILABLE_CATEGORIES.find(cat => cat.RasterName === RasterName);
        if (category) {
          return [...prev, { RasterName, weight: category.defaultWeight }];
        }
        return prev;
      }
    });
  };
  
  // Update the weight of a category (for slider)
  const updateCategoryWeight = (RasterName: string, weight: number): void => {
    // Ensure weight is between 0 and 100
    const clampedWeight = Math.min(Math.max(weight, 0), 100);
    
    setSelectedCategoryName(prev => {
      const categoryIndex = prev.findIndex(item => item.RasterName === RasterName);
      
      if (categoryIndex !== -1) {
        // Update existing category weight
        const updatedCategories = [...prev];
        updatedCategories[categoryIndex] = {
          ...updatedCategories[categoryIndex],
          weight: clampedWeight.toString()
        };
        return updatedCategories;
      } else {
        // Add category with custom weight if not already selected
        const category = AVAILABLE_CATEGORIES.find(cat => cat.RasterName === RasterName);
        if (category) {
          return [...prev, { RasterName, weight: clampedWeight.toString() }];
        }
        return prev;
      }
    });
  };
  
  // Get the current weight of a category (for slider value)
  const getCategoryWeight = (RasterName: string): number => {
    const selectedCategory = selectedCategoryName.find(item => item.RasterName === RasterName);
    if (selectedCategory) {
      return parseFloat(selectedCategory.weight);
    }
    
    // Return default weight if category not selected
    const defaultCategory = AVAILABLE_CATEGORIES.find(cat => cat.RasterName === RasterName);
    return defaultCategory ? parseFloat(defaultCategory.defaultWeight) : 0;
  };
  
  // Select all categories
  const selectAllCategories = (): void => {
    setSelectedCategoryName(
      AVAILABLE_CATEGORIES.map(category => ({
        RasterName: category.RasterName,
        weight: category.defaultWeight
      }))
    );
  };
  
  // Clear all selected categories
  const clearAllCategories = (): void => {
    setSelectedCategoryName([]);
  };
  
  // Check if a category is selected
  const isSelected = (RasterName: string): boolean => {
    return selectedCategoryName.some(item => item.RasterName === RasterName);
  };
  
  // Context value
  const contextValue: CategoryContextType = {
    categories: AVAILABLE_CATEGORIES,
    selectedCategoryName,
    selectedCategories: getSelectedCategoryNames(),
    toggleCategory,
    updateCategoryWeight,
    selectAllCategories,
    clearAllCategories,
    isSelected,
    getCategoryWeight
  };
  
  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};

// Custom hook to use the category context
export const useCategory = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};