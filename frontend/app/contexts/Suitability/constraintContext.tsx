'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ConstraintFactor {
  id: string;
  name: string;
  description: string;
  selected: boolean;
  category: string;
}

interface ConstraintFactorsContextType {
  factors: ConstraintFactor[];
  loading: boolean;
  updateFactors: (newFactors: ConstraintFactor[]) => void;
}

const ConstraintFactorsContext = createContext<ConstraintFactorsContextType | undefined>(undefined);

export const ConstraintFactorsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [factors, setFactors] = useState<ConstraintFactor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchFactors = async () => {
      setLoading(true);
      try {
        // Replace with actual API call
        // const response = await fetch('/api/constraint-factors');
        // const data = await response.json();
        // setFactors(data);
        setFactors([]);
      } catch (error) {
        console.error('Error fetching constraint factors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFactors();
  }, []);

  const updateFactors = (newFactors: ConstraintFactor[]) => {
    setFactors(newFactors);
  };

  return (
    <ConstraintFactorsContext.Provider value={{ factors, loading, updateFactors }}>
      {children}
    </ConstraintFactorsContext.Provider>
  );
};

export const useConstraintFactors = () => {
  const context = useContext(ConstraintFactorsContext);
  if (!context) {
    throw new Error('useConstraintFactors must be used within a ConstraintFactorsProvider');
  }
  return context;
};