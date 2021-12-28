import React from "react";
import { Graphviz } from "graphviz-react";
import * as R from "ramda";
import Automaton from "../core/automaton";

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
  const edges = R.join("\n\t", R.map((value) => R.map((nextState) => `"${value.currentState}" -> "${nextState}" [label = "${value.symbol ?? "ε"}"];`, value.nextStates), Array.from(automaton.transitionFunction.values())));

  const dot = `digraph finite_state_machine {
\trankdir=LR;
\tsize="8,5"
\tnode [shape = doublecircle]; ${finalStateNodes};
\tnode [shape = circle]; ${nonFinalStateNodes};
\t${edges}
}`;

  return (
    <Graphviz
      dot={dot}
      options={{ width: "100%", height: 300 }}
    />
  );
}
