'use client'
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define types
export interface Category {
  id: number;
  name: string;
  RasterName: string;
  icon: string;
  defaultInfluence: string;
  color: string;
}

// Interface for raster layer selection with added weight field
export interface SelectRasterLayer {
  RasterName: string;
  Influence: string;
  weight?: string; // New field for weight calculation
}

interface CategoryContextType {
  categories: Category[];
  selectedCategoryName: SelectRasterLayer[];
  selectedCategories: SelectRasterLayer[];
  toggleCategory: (RasterName: string) => void;
  updateCategoryInfluence: (RasterName: string, Influence: number) => void;
  selectAllCategories: () => void;
  clearAllCategories: () => void;
  isSelected: (RasterName: string) => boolean;
  getCategoryInfluence: (RasterName: string) => number;
  getCategoryWeight: (RasterName: string) => number; // New function to get weight
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
    defaultInfluence: '2.93',
    color: 'text-blue-500'
  },
  {
    id: 2,
    name: 'Population Density',
    RasterName: 'STP_Population_Density_Raster',
    icon: 'users',
    defaultInfluence: '2.68',
    color: 'text-red-500'
  },
  {
    id: 3,
    name: 'Distance from Drainage Network',
    RasterName: 'STP_Drainage_Network_Raster',
    icon: 'tint',
    defaultInfluence: '1.66',
    color: 'text-blue-400'
  },
  {
    id: 4,
    name: 'Buffer of the Drain Outlet based on their flow',
    RasterName: 'STP_Drain_Outlet_Raster',
    icon: 'stream',
    defaultInfluence: '0.94',
    color: 'text-green-500'
  },
  {
    id: 5,
    name: 'Land Availability',
    RasterName: 'STP_Land_Availability_Raster',
    icon: 'mountain',
    defaultInfluence: '0.68',
    color: 'text-yellow-500'
  },
  {
    id: 6,
    name: 'Ground Quality',
    RasterName: 'STP_Ground_Quality_Raster',
    icon: 'layer-group',
    defaultInfluence: '0.59',
    color: 'text-blue-500'
  },
  {
    id: 7,
    name: 'GroundWater Depth',
    RasterName: 'STP_GroundWater_Depth_Raster',
    icon: 'tint-slash',
    defaultInfluence: '0.52',
    color: 'text-blue-400'
  }
];

// Category provider component
export const CategoryProvider = ({ children }: CategoryProviderProps) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<SelectRasterLayer[]>([]);

  // Calculate weights for all selected categories
  const calculateWeights = (categories: SelectRasterLayer[]): SelectRasterLayer[] => {
    if (categories.length === 0) return [];
    
    // Calculate sum of all influences
    const totalInfluence = categories.reduce((sum, category) => {
      return sum + parseFloat(category.Influence);
    }, 0);
    
    // If sum is 0, assign equal weights
    if (totalInfluence === 0) {
      const equalWeight = (1 / categories.length).toFixed(4);
      return categories.map(category => ({
        ...category,
        weight: equalWeight
      }));
    }
    
    // Calculate weight for each category
    return categories.map(category => {
      const weight = (parseFloat(category.Influence) / totalInfluence).toFixed(4);
      return {
        ...category,
        weight
      };
    });
  };

  // Get selected category details for API with weights
  const getSelectedCategoryNames = (): SelectRasterLayer[] => {
    const selectedCategories = AVAILABLE_CATEGORIES
      .filter(category => selectedCategoryName.some(item => item.RasterName === category.RasterName))
      .map(category => {
        // Find the custom Influence if it exists
        const customInfluence = selectedCategoryName.find(
          item => item.RasterName === category.RasterName
        )?.Influence;
        
        return {
          RasterName: category.RasterName,
          Influence: customInfluence || category.defaultInfluence
        };
      });
    
    // Calculate and add weights
    return calculateWeights(selectedCategories);
  };
  
  // Toggle a category selection
  const toggleCategory = (RasterName: string): void => {
    setSelectedCategoryName(prev => {
      // Find if the RasterName already exists in the selection
      const isSelected = prev.some(item => item.RasterName === RasterName);
      
      let newSelection;
      if (isSelected) {
        // Remove it if already selected
        newSelection = prev.filter(item => item.RasterName !== RasterName);
      } else {
        // Add it with defaultInfluence from the AVAILABLE_CATEGORIES
        const category = AVAILABLE_CATEGORIES.find(cat => cat.RasterName === RasterName);
        if (category) {
          newSelection = [...prev, { RasterName, Influence: category.defaultInfluence }];
        } else {
          newSelection = prev;
        }
      }
      
      // Recalculate weights after changing selection
      return calculateWeights(newSelection);
    });
  };
  
  // Update the Influence of a category (for slider)
  const updateCategoryInfluence = (RasterName: string, Influence: number): void => {
    // Ensure Influence is between 0 and 100
    const clampedInfluence = Math.min(Math.max(Influence, 0), 100);
    
    setSelectedCategoryName(prev => {
      let updatedCategories;
      const categoryIndex = prev.findIndex(item => item.RasterName === RasterName);
      
      if (categoryIndex !== -1) {
        // Update existing category Influence
        updatedCategories = [...prev];
        updatedCategories[categoryIndex] = {
          ...updatedCategories[categoryIndex],
          Influence: clampedInfluence.toString()
        };
      } else {
        // Add category with custom Influence if not already selected
        const category = AVAILABLE_CATEGORIES.find(cat => cat.RasterName === RasterName);
        if (category) {
          updatedCategories = [...prev, { RasterName, Influence: clampedInfluence.toString() }];
        } else {
          updatedCategories = prev;
        }
      }
      
      // Recalculate weights after updating influence
      return calculateWeights(updatedCategories);
    });
  };
  
  // Get the current Influence of a category (for slider value)
  const getCategoryInfluence = (RasterName: string): number => {
    const selectedCategory = selectedCategoryName.find(item => item.RasterName === RasterName);
    if (selectedCategory) {
      return parseFloat(selectedCategory.Influence);
    }
    
    // Return default Influence if category not selected
    const defaultCategory = AVAILABLE_CATEGORIES.find(cat => cat.RasterName === RasterName);
    return defaultCategory ? parseFloat(defaultCategory.defaultInfluence) : 0;
  };
  
  // Get the current weight of a category
  const getCategoryWeight = (RasterName: string): number => {
    const selectedCategory = selectedCategoryName.find(item => item.RasterName === RasterName);
    if (selectedCategory && selectedCategory.weight) {
      return parseFloat(selectedCategory.weight);
    }
    return 0;
  };
  
  // Select all categories
  const selectAllCategories = (): void => {
    const allCategories = AVAILABLE_CATEGORIES.map(category => ({
      RasterName: category.RasterName,
      Influence: category.defaultInfluence
    }));
    
    // Calculate weights and update state
    setSelectedCategoryName(calculateWeights(allCategories));
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
    updateCategoryInfluence,
    selectAllCategories,
    clearAllCategories,
    isSelected,
    getCategoryInfluence,
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