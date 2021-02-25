export default interface Transition {
  id: string;
  currentState: string;
  symbol: string | null;
  nextStates: string[];
}
