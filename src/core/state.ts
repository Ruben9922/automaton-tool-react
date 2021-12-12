import * as R from "ramda";

export default interface State {
  id: string;
  name: string;
}

export const generatePlaceholderStateName = (index: number): string => `[State ${index + 1}]`;

export const createStateDisplayName = (state: string, index: number): string => (
  state === "" ? generatePlaceholderStateName(index) : state
);

export function stateIdToStateName(stateId: string, states: State[]): string {
  return R.find((state) => state.id === stateId, states)!.name;
}

export function stateNameToStateId(stateName: string, states: State[]): string {
  return R.find((state) => state.name === stateName, states)!.id;
}

export function stateIdToStateIndex(states: State[], id: string): number {
  return R.indexOf(id, R.map((state) => state.id, states));
}
