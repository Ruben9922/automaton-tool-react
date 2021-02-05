export default interface Transition {
  id: string;
  currentState: string;
  symbol: string;
  nextStates: string[];
}
