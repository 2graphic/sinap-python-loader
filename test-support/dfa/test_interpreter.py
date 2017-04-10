class box(object): pass

node2 = box()
node2.label = "q2"
node2.isStartState = False
node2.isAcceptState = True
node2.children = []

edge1 = box()
edge1.label = "1"
edge1.destination = node2

node1 = box()
node1.label = "q1"
node1.isStartState = True
node1.isAcceptState = False
node1.children = [ edge1 ]


graph = box()
graph.nodes = [ node1, node2 ]

from dfa_interpreter import start, step, State

def run(inp):
    state = start(graph, inp)
    while isinstance(state, State):
        state = step(state)
    return state

for x in ['1', '0', '', '11', '10']:
    print("{: <5} -> {}".format(repr(x), run(x)))