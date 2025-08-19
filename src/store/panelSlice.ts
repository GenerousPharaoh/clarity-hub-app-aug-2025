import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { StateCreator } from 'zustand';
import { AppState } from './index';

// Panel Slice types
export interface PanelState {
  // Panel sizes
  leftPanelWidth: number;
  centerPanelWidth: number;
  rightPanelWidth: number;
  
  // Panel size percentages
  leftPanelPercentage: number;
  centerPanelPercentage: number;
  rightPanelPercentage: number;
  
  // Minimum panel sizes (in pixels)
  minLeftPanelWidth: number;
  minCenterPanelWidth: number;
  minRightPanelWidth: number;
  
  // Panel actions
  setPanelSizes: (left: number, center: number, right: number) => void;
  setPanelPercentages: (left: number, center: number, right: number) => void;
  resetPanelSizes: () => void;
}

const DEFAULT_LEFT_PERCENTAGE = 25;
const DEFAULT_CENTER_PERCENTAGE = 50;
const DEFAULT_RIGHT_PERCENTAGE = 25;

const DEFAULT_MIN_LEFT_WIDTH = 240;
const DEFAULT_MIN_CENTER_WIDTH = 300;
const DEFAULT_MIN_RIGHT_WIDTH = 240;

// Load stored panel state from localStorage with validation
const loadPanelState = () => {
  try {
    const savedState = localStorage.getItem('clarity-hub-panel-state');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      
      // Validate that percentages add up to 100%
      const total = (parsedState.leftPanelPercentage || 0) + 
                   (parsedState.centerPanelPercentage || 0) + 
                   (parsedState.rightPanelPercentage || 0);
      
      // If panel sizes are invalid, use defaults
      if (Math.abs(total - 100) > 1 || 
          parsedState.leftPanelPercentage <= 0 || 
          parsedState.centerPanelPercentage <= 0 ||
          parsedState.rightPanelPercentage <= 0) {
        console.warn('Invalid panel state detected, resetting to defaults');
        return getDefaultPanelState();
      }
      
      return parsedState;
    }
  } catch (error) {
    console.error('Failed to load panel state from localStorage:', error);
  }
  
  return getDefaultPanelState();
};

// Default panel state 
const getDefaultPanelState = () => ({
  leftPanelWidth: 0,
  centerPanelWidth: 0,
  rightPanelWidth: 0,
  leftPanelPercentage: DEFAULT_LEFT_PERCENTAGE,
  centerPanelPercentage: DEFAULT_CENTER_PERCENTAGE,
  rightPanelPercentage: DEFAULT_RIGHT_PERCENTAGE,
  minLeftPanelWidth: DEFAULT_MIN_LEFT_WIDTH,
  minCenterPanelWidth: DEFAULT_MIN_CENTER_WIDTH,
  minRightPanelWidth: DEFAULT_MIN_RIGHT_WIDTH,
});

// Create the isolated panel store
const usePanelStore = create<PanelState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        leftPanelWidth: 0,
        centerPanelWidth: 0,
        rightPanelWidth: 0,
        leftPanelPercentage: DEFAULT_LEFT_PERCENTAGE,
        centerPanelPercentage: DEFAULT_CENTER_PERCENTAGE,
        rightPanelPercentage: DEFAULT_RIGHT_PERCENTAGE,
        minLeftPanelWidth: DEFAULT_MIN_LEFT_WIDTH,
        minCenterPanelWidth: DEFAULT_MIN_CENTER_WIDTH,
        minRightPanelWidth: DEFAULT_MIN_RIGHT_WIDTH,
        
        // Actions
        setPanelSizes: (left: number, center: number, right: number) => {
          const total = left + center + right;
          
          set({
            leftPanelWidth: left,
            centerPanelWidth: center,
            rightPanelWidth: right,
            leftPanelPercentage: (left / total) * 100,
            centerPanelPercentage: (center / total) * 100,
            rightPanelPercentage: (right / total) * 100,
          });
        },
        setPanelPercentages: (left: number, center: number, right: number) => {
          set({
            leftPanelPercentage: left,
            centerPanelPercentage: center,
            rightPanelPercentage: right,
          });
        },
        resetPanelSizes: () => {
          set({
            leftPanelPercentage: DEFAULT_LEFT_PERCENTAGE,
            centerPanelPercentage: DEFAULT_CENTER_PERCENTAGE,
            rightPanelPercentage: DEFAULT_RIGHT_PERCENTAGE,
          });
        },
      }),
      {
        name: 'clarity-hub-panel-state',
        partialize: (state) => ({
          leftPanelWidth: state.leftPanelWidth,
          centerPanelWidth: state.centerPanelWidth,
          rightPanelWidth: state.rightPanelWidth,
          leftPanelPercentage: state.leftPanelPercentage,
          centerPanelPercentage: state.centerPanelPercentage,
          rightPanelPercentage: state.rightPanelPercentage,
          minLeftPanelWidth: state.minLeftPanelWidth,
          minCenterPanelWidth: state.minCenterPanelWidth,
          minRightPanelWidth: state.minRightPanelWidth,
        }),
      }
    )
  )
);

// Create a slice creator for the main store
export const createPanelSlice: StateCreator<
  AppState,
  [],
  [],
  PanelState
> = (set) => ({
  // Panel sizes in pixels
  leftPanelWidth: 0,
  centerPanelWidth: 0, 
  rightPanelWidth: 0,
  
  // Panel size percentages (of total width)
  leftPanelPercentage: DEFAULT_LEFT_PERCENTAGE,
  centerPanelPercentage: DEFAULT_CENTER_PERCENTAGE,
  rightPanelPercentage: DEFAULT_RIGHT_PERCENTAGE,
  
  // Minimum panel widths (in pixels)
  minLeftPanelWidth: DEFAULT_MIN_LEFT_WIDTH,
  minCenterPanelWidth: DEFAULT_MIN_CENTER_WIDTH, 
  minRightPanelWidth: DEFAULT_MIN_RIGHT_WIDTH,
  
  // Set panel sizes in pixels
  setPanelSizes: (left: number, center: number, right: number) => {
    const total = left + center + right;
    
    set({
      leftPanelWidth: left,
      centerPanelWidth: center,
      rightPanelWidth: right,
      leftPanelPercentage: (left / total) * 100,
      centerPanelPercentage: (center / total) * 100,
      rightPanelPercentage: (right / total) * 100,
    });
  },
  
  // Set panel sizes as percentages
  setPanelPercentages: (left: number, center: number, right: number) => {
    set({
      leftPanelPercentage: left,
      centerPanelPercentage: center,
      rightPanelPercentage: right,
    });
  },
  
  // Reset panel sizes to defaults
  resetPanelSizes: () => {
    set({
      leftPanelPercentage: DEFAULT_LEFT_PERCENTAGE,
      centerPanelPercentage: DEFAULT_CENTER_PERCENTAGE,
      rightPanelPercentage: DEFAULT_RIGHT_PERCENTAGE,
    });
  },
});

export default usePanelStore; 