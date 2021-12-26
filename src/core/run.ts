export type Run = { states: string[], symbol: string | null }[];
export type RunTreeNode = { id: string, state: string, symbol: string | null, children: RunTreeNode[] };
export type RunTree = RunTreeNode[];
