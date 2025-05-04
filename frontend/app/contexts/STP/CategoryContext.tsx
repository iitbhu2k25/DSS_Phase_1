'use client'
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define types
export interface Category {
  id: number;
  name: string;
  RasterName: string;
  icon: string;
  weight: string;
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
  selectAllCategories: () => void;
  clearAllCategories: () => void;
  isSelected: (RasterName: string) => boolean;
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
    weight: '29.3',
    color: 'text-blue-500'
  },
  {
    id: 2,
    name: 'Population Density',
    RasterName: 'STP_Population_Density_Raster',
    icon: 'users',
    weight: '26.8',
    color: 'text-red-500'
  },
  {
    id: 3,
    name: 'Distance from Drainage Network',
    RasterName: 'STP_Drainage_Network_Raster',
    icon: 'tint',
    weight: '16.6',
    color: 'text-blue-400'
  },
  {
    id: 4,
    name: 'Buffer of the Drain Outlet based on their flow',
    RasterName: 'STP_Drain_Outlet_Raster',
    icon: 'stream',
    weight: '9.4',
    color: 'text-green-500'
  },
  {
    id: 5,
    name: 'Land Availability',
    RasterName: 'STP_Land_Availability_Raster',
    icon: 'mountain',
    weight: '6.8',
    color: 'text-yellow-500'
  },
  {
    id: 6,
    name: 'Ground Quality',
    RasterName: 'STP_Ground_Quality_Raster',
    icon: 'layer-group',
    weight: '5.9',
    color: 'text-blue-500'
  },
  {
    id: 7,
    name: 'GroundWater Depth',
    RasterName: 'STP_GroundWater_Depth_Raster',
    icon: 'tint-slash',
    weight: '5.2',
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
      .map(category => ({
        RasterName: category.RasterName,
        weight: category.weight
      }));
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
        // Add it with weight from the AVAILABLE_CATEGORIES
        const category = AVAILABLE_CATEGORIES.find(cat => cat.RasterName === RasterName);
        if (category) {
          return [...prev, { RasterName, weight: category.weight }];
        }
        return prev;
      }
    });
  };
  
  // Select all categories
  const selectAllCategories = (): void => {
    setSelectedCategoryName(
      AVAILABLE_CATEGORIES.map(category => ({
        RasterName: category.RasterName,
        weight: category.weight
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
    selectAllCategories,
    clearAllCategories,
    isSelected
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