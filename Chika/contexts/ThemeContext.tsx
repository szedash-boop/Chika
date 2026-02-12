import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    success: string;
    error: string;
  };
  backgroundImage: string | null;
  setBackgroundImage: (uri: string | null) => void;
  textSize: number;
  setTextSize: (size: number) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#4D0C0C',
  border: '#e0e0e0',
  success: '#4CAF50',
  error: '#ff4444',
};

const darkColors = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  primary: '#2F0410',
  border: '#333333',
  success: '#4CAF50',
  error: '#ff4444',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [textSize, setTextSize] = useState<number>(1);

  // Load saved values on mount
  useEffect(() => {
    const loadAll = async () => {
      try {
        // Load theme
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }

        // Load background
        const savedBg = await AsyncStorage.getItem('backgroundImage');
        if (savedBg) setBackgroundImage(savedBg);

        // Load text size
        const savedSize = await AsyncStorage.getItem('textSize');
        if (savedSize) setTextSize(parseFloat(savedSize));
      } catch (error) {
        console.error('Error loading theme data:', error);
      }
    };

    loadAll();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        colors,
        backgroundImage,
        setBackgroundImage,
        textSize,
        setTextSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}