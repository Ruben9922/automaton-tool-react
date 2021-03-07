// TODO: Maybe replace this with just a function
export default class TransitionFunctionKey {
  currentState: string;
  symbol: string | null;

  constructor(currentState: string, symbol: string | null) {
    this.currentState = currentState;
    this.symbol = symbol;
  }

  toString() {
    // TODO: Make this string nicer
    return `TransitionFunctionKey(currentStateId=${this.currentState}, symbol=${this.symbol})`;
  }
}
