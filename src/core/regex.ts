import * as R from "ramda";

type Regex = AlternationRegex;
type AlternationRegex = { operator: "alternation"; operands: ConcatenationRegex[] } | ConcatenationRegex;
type ConcatenationRegex = { operator: "concatenation"; operands: StarRegex[]; } | StarRegex;
type StarRegex = { operator: "star"; operand: TerminalRegex; } | TerminalRegex;
type TerminalRegex = { operator: null; value: string | null } | GroupingRegex;
type GroupingRegex = { operator: "grouping"; operand: Regex; };

export default Regex;

export function convertRegexToString(regex: Regex): string {
  switch (regex.operator) {
    case "star":
      return `${convertRegexToString(regex.operand)}*`;
    case "alternation":
      return R.join("|", R.map((operand) => convertRegexToString(operand), regex.operands));
    case "concatenation":
      return R.join("", R.map((operand) => convertRegexToString(operand), regex.operands));
    case "grouping":
      return `(${convertRegexToString(regex.operand)})`;
    case null:
      return regex.value ?? "ε";
    default:
      return "";
  }
}
