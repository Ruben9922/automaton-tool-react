// TODO: Maybe replace this with just a function
export default class TransitionFunctionKey {
  currentState: string;
  symbol: string;

  constructor(currentState: string, symbol: string) {
    this.currentState = currentState;
    this.symbol = symbol;
  }

  toString() {
    return `TransitionFunctionKey(currentStateId=${this.currentState}, symbol=${this.symbol})`;
  }
}
