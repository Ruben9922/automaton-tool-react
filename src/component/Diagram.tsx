import React from "react";
import { Graphviz } from "graphviz-react";
import * as R from "ramda";
import Automaton from "../core/automaton";
import TransitionFunction from "../core/transitionFunction";

type DiagramProps = {
  automaton: Automaton;
};

interface Edge {
  currentState: string;
  symbols: (string | null)[];
  nextState: string;
}

function createEdges(transitionFunction: TransitionFunction): Edge[] {
  const transitions = Array.from(transitionFunction.values());
  const singleTransitions = R.chain((transition) => R.map((nextState) => ({
    currentState: transition.currentState,
    symbol: transition.symbol,
    nextState,
  }), transition.nextStates), transitions);
  const groupedTransitions = R.groupWith(
    (t1, t2) => t1.currentState === t2.currentState && t1.nextState === t2.nextState,
    singleTransitions,
  );
  const edges = R.map((group) => ({
    currentState: group[0].currentState,
    symbols: R.map((t) => t.symbol, group),
    nextState: group[0].nextState,
  }), groupedTransitions);

  return edges;
}

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

  const edges = createEdges(automaton.transitionFunction);
  const edgeString = R.join("\n\t", R.map((e) => `"${e.currentState}" -> "${e.nextState}" [label = "${R.join(", ", R.map((symbol) => symbol ?? "ε", e.symbols))}"];`, edges));

  const dot = `digraph finite_state_machine {
\trankdir=LR;
\tsize="8,5"
\tnode [shape = doublecircle]; ${finalStateNodes};
\tnode [shape = circle]; ${nonFinalStateNodes};
\t${edgeString}
}`;

  return (
    <Graphviz
      dot={dot}
      options={{ width: "100%", height: 300 }}
    />
  );
}
