from __future__ import print_function
import dfa_interpreter
import json
from collections import defaultdict
from operator import setitem
from functools import partial

class SinapObject: pass

def objectify(obj):
    if isinstance(obj, dict):
        ret = SinapObject()
        for k, v in obj.items():
            setattr(ret, k, v)
        return ret
    else:
        return obj

class SinapEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, "_uuid"):
            return {"kind": "value-reference", "uuid": obj._uuid}
        if hasattr(obj, "__dict__"):
            return obj.__dict__
        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)


class Box(object):
    def __init__(self):
        self.targets = []

def is_reference(value):
    return hasattr(value, "kind") and value.kind == "value-reference"

def box_references(raw_obj, objs):
    if isinstance(raw_obj, SinapObject):
        for key, value in raw_obj.__dict__.items():
            if is_reference(value):
                objs[value.uuid].targets.append(partial(setattr, raw_obj, key))
            else:
                box_references(value, objs)
    elif isinstance(raw_obj, list):
        for key, value in enumerate(raw_obj):
            if is_reference(value):
                objs[value.uuid].targets.append(partial(setitem, raw_obj, key))
            else:
                box_references(value, objs)


def main():
    objs = defaultdict(Box)
    serialGraph = json.loads(raw_input(""), object_hook=objectify)
    serialArgs = json.loads(raw_input(""), object_hook=objectify)

    raw_objects = dict()
    raw_objects.update(serialGraph.graph.__dict__)
    raw_objects.update(serialGraph.edges.__dict__)
    raw_objects.update(serialGraph.nodes.__dict__)
    raw_objects.update(serialGraph.others.__dict__)

    for uuid, raw_value in raw_objects.items():
        if is_reference(raw_value.rep):
            objs[uuid].redirect = raw_value.rep.uuid
        else:
            box_references(raw_value.rep, objs)
            objs[uuid].true_value = raw_value.rep

    true_targets = defaultdict(list)
    for uuid, value in objs.items():
        targets = value.targets
        while hasattr(value, "redirect"):
            uuid = value.redirect
            value = objs[uuid]
        true_targets[uuid].extend(targets)
    
    for uuid, targets in true_targets.items():
        for target in targets:
            if (isinstance(objs[uuid].true_value, SinapObject)):
                objs[uuid].true_value._uuid = uuid
            target(objs[uuid].true_value)

    graph = list(serialGraph.graph.__dict__.values())[0].rep
    step = dfa_interpreter.start(graph, *serialArgs)
    
    while isinstance(step, dfa_interpreter.State):
        print(json.dumps(step, cls=SinapEncoder))
        step = dfa_interpreter.step(step)

    print(json.dumps(step, cls=SinapEncoder))

if __name__ == "__main__":
    main()