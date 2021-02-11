export default interface State {
  id: string;
  name: string;
}

const generatePlaceholderStateName = (index: number): string => `[State ${index + 1}]`;

export const createStateDisplayName = (state: State, index: number): string => (
  state.name === "" ? generatePlaceholderStateName(index) : state.name
);
