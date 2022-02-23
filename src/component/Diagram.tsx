import React from "react";
import { Graphviz } from "graphviz-react";
import * as R from "ramda";
import Automaton, { groupTransitionsByCurrentStateAndNextState } from "../core/automaton";

type DiagramProps = {
  automaton: Automaton;
};

export default function Diagram({ automaton }: DiagramProps) {
  // const ref = useRef(null);
  //
  // useEffect(() => {
  //   if (ref.current !== null) {
  //     d3.select(".graph").graphviz().renderDot('digraph  {a -> b}');
  //   }
  // }, []);

  const finalStateNodes = R.join(" ", R.map((stateName) => `"${stateName}"`, automaton.finalStates));
  const nonFinalStateNodes = R.join(" ", R.map((stateName: string) => `"${stateName}"`, R.difference(automaton.states, automaton.finalStates)));

  const edges = groupTransitionsByCurrentStateAndNextState(automaton.transitionFunction, automaton.alphabet);
  const edgeString = R.join("\n\t", R.map((e) => `"${e.currentState}" -> "${e.nextState}" [label = "${R.join(", ", R.map((symbol) => symbol ?? "ε", e.symbols))}"];`, edges));

  const finalStateNodesString = R.isEmpty(finalStateNodes) ? "" : `\tnode [shape = doublecircle]; ${finalStateNodes};`;
  const nonFinalStateNodesString = R.isEmpty(nonFinalStateNodes) ? "" : `\tnode [shape = circle]; ${nonFinalStateNodes};`;

  const dot = `digraph finite_state_machine {
\trankdir=LR;
\tsize="8,5"
${finalStateNodesString}
${nonFinalStateNodesString}
\t${edgeString}
}`;

  return (
    <Graphviz
      dot={dot}
      options={{ width: "100%", height: 300 }}
    />
  );
}
