'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ConditioningFactor {
  id: string;
  name: string;
  description: string;
  selected: boolean;
  weight: number;
  category: string;
}

interface ConditioningFactorsContextType {
  factors: ConditioningFactor[];
  loading: boolean;
  updateFactors: (newFactors: ConditioningFactor[]) => void;
}

const ConditioningFactorsContext = createContext<ConditioningFactorsContextType | undefined>(undefined);

export const ConditioningFactorsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [factors, setFactors] = useState<ConditioningFactor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchFactors = async () => {
      setLoading(true);
      try {
        // Replace with actual API call
        // const response = await fetch('/api/conditioning-factors');
        // const data = await response.json();
        // setFactors(data);
        setFactors([]);
      } catch (error) {
        console.error('Error fetching conditioning factors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFactors();
  }, []);

  const updateFactors = (newFactors: ConditioningFactor[]) => {
    setFactors(newFactors);
  };

  return (
    <ConditioningFactorsContext.Provider value={{ factors, loading, updateFactors }}>
      {children}
    </ConditioningFactorsContext.Provider>
  );
};

export const useConditioningFactors = () => {
  const context = useContext(ConditioningFactorsContext);
  if (!context) {
    throw new Error('useConditioningFactors must be used within a ConditioningFactorsProvider');
  }
  return context;
};