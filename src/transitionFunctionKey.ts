// TODO: Maybe replace this with just a function
export default class TransitionFunctionKey {
  currentStateId: string;
  symbol: string;

  constructor(currentStateId: string, symbol: string) {
    this.currentStateId = currentStateId;
    this.symbol = symbol;
  }

  toString() {
    return `TransitionFunctionKey(currentStateId=${this.currentStateId}, symbol=${this.symbol})`;
  }
}
