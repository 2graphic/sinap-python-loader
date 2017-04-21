(function () {
    const stringType = new Type.Primitive("string");
    const booleanType = new Type.Primitive("boolean");

    const Node = new Type.CustomObject("DFANode", null, new Map([
        ["label", stringType],
        ["isStartState", booleanType],
        ["isAcceptState", booleanType],
    ]));

    const Edge = new Type.CustomObject("DFAEdge", null, new Map([
        ["label", stringType],
        ["destination", Node],
    ]));

    Node.members.set("children", new Value.ArrayType(Edge));

    const Graph = new Type.CustomObject("DFAGraph", null, new Map([
    ]));

    const State = new Type.CustomObject("DFAState", null, new Map([
        ["active", Node],
        ["inputLeft", stringType],
        ["message", stringType]
    ]));

    return {Graph: Graph, Nodes: [Node], Edges: [Edge], State: State, arguments: [stringType], result: booleanType};
})();