export const generatePlaceholderStateName = (index: number): string => `[State ${index + 1}]`;

export const createStateDisplayName = (state: string, index: number): string => (
  state === "" ? generatePlaceholderStateName(index) : state
);
