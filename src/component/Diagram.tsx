import React from "react";
import {Graphviz} from "graphviz-react";
import Automaton from "../core/automaton";
import * as R from "ramda";

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

  const dot = `digraph finite_state_machine {
\trankdir=LR;
\tsize="8,5"
\tnode [shape = doublecircle]; ${R.join(" ", automaton.finalStates)};
\tnode [shape = circle]; ${R.join(" ", R.difference(automaton.states, automaton.finalStates))};
\t${R.join("\n\t", R.map((value) => R.map((nextState) => `${value.currentState} -> ${nextState} [label = "${value.symbol ?? "ε"}"];`, value.nextStates), Array.from(automaton.transitionFunction.values())))}
}`;

  return (
    <Graphviz
      dot={dot}
      options={{ width: "100%", height: 300 }}
    />
  );
}
