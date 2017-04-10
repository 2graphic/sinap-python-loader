# export class DFANode {
#     /** Start State */
#     isStartState: boolean;
#     /** Accept State */
#     isAcceptState: boolean;
#     children: DFAEdge[];
#     label: string;
# }

# export class DFAEdge {
#     /** Symbol */
#     label: string;
#     destination: DFANode;
# }

# export class DFAGraph {
#     nodes: DFANode[];
#     // startState: DFANode;
# }

# export type Nodes = DFANode;
# export type Edges = DFAEdge;
# export type Graph = DFAGraph;

class State:
    def __init__(self, active, inputLeft, message):
        self.active = active
        self.inputLeft = inputLeft
        self.message = message

def start(input, data):
    start = None
    accepts = set()

    for node in input.nodes:
        if node.isStartState:
            if start == None:
                start = node
            else:
                raise Error("Only one start state allowed")

        if node.isAcceptState:
            accepts.add(node)

        if node.children:
            transitions = set()
            for edge in node.children:
                if not edge.label:
                    raise Error("Lambda transition from " + node.label + " to " + edge.destination.label + " is not allowed")

                if len(edge.label) > 1:
                    raise Error("Edge " + edge.label + " must be one symbol")

                if edge.label in transitions:
                    raise Error("Nondeterministic edge " + edge.label + " from node: " + node.label)

                transitions.add(edge.label)

    if not start:
        raise Error("Must have one start state")

    return State(start, data, "starting")

def step(current):
    if current.inputLeft == "":
        return current.active.isAcceptState

    destinations = [edge.destination for edge in current.active.children if edge.label == current.inputLeft[0]]

    if len(destinations) == 1:
        return State(destinations[0], current.inputLeft[1:],
            "transitioning from {} to {}".format(current.active.label, destinations[0].label))
    elif len(destinations)== 0:
        return False
    else:
        raise Error("This is a DFA!")