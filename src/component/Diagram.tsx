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

function createEdges(automaton: Automaton): Edge[] {
  // Idea is to convert from a transition function (transitions grouped by current state and symbol)
  // to edges (transitions grouped by current state and next state)
  return R.pipe(
    // Convert transition function to a list of transitions
    (transitionFunction: TransitionFunction) => Array.from(transitionFunction.values()),

    // Originally each transition contains a current state, symbol and a *list* of next states
    // Convert transitions so that each transition contains a current state, symbol and a *single*
    // next state
    R.chain((transition) => R.map((nextState) => ({
      currentState: transition.currentState,
      symbol: transition.symbol,
      nextState,
    }), transition.nextStates)),

    // Sort transitions by current states and next state so that the grouping works correctly
    // (This is because R.groupWith only groups adjacent items)
    R.sortWith([R.ascend((t) => t.currentState), R.ascend((t) => t.nextState)]),

    // Group transitions by current state and next state
    R.groupWith((t1, t2) => t1.currentState === t2.currentState && t1.nextState === t2.nextState),

    // Convert transitions so that each transition contains a current state, next state and a *list*
    // of symbols
    R.map((group) => ({
      currentState: group[0].currentState,
      symbols: R.sortBy(
        (symbol: string | null) => (symbol === null ? -1 : R.indexOf(symbol, automaton.alphabet)),
        R.map((t) => t.symbol, group),
      ),
      nextState: group[0].nextState,
    })),
  )(automaton.transitionFunction);
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

  const edges = createEdges(automaton);
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
