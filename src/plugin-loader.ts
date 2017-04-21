import { Plugin, PluginLoader, RawPluginTypes, PluginInfo } from "sinap-core";
import { PythonPlugin } from "./plugin";
import { Value as ValueM, Type as TypeM } from "sinap-types";
import * as fs from "fs";

class NodePromise<T> {
    readonly promise: Promise<T>;
    readonly cb: (err: any, obj: T) => void;
    private _resolve: (res: T) => void;
    private _reject: (err: any) => void;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });

        this.cb = (err, obj) => {
            if (err) this._reject(err);
            else this._resolve(obj);
        };
    }
}

function readFile(file: string): Promise<string> {
    const result = new NodePromise<string>();
    fs.readFile(file, "utf8", result.cb);
    return result.promise;
}

function evalTypes(file: string): RawPluginTypes {
    const Value = ValueM;
    const Type = TypeM;
    Value; Type;

    // tslint:disable-next-line:no-eval
    const result = eval(file);

    function check(key: string) {
        if (!result[key]) {
            throw new Error(`types must define a "${key}"`);
        }
    }
    ["Graph", "Nodes", "Edges", "State", "arguments", "result"].map(check);

    result.rawGraph = result.Graph;
    result.rawNodes = result.Nodes;
    result.rawEdges = result.Edges;
    result.state = result.State;
    delete result.Graph;
    delete result.Nodes;
    delete result.Edges;
    delete result.State;

    return result;
}

export class PythonPluginLoader implements PluginLoader {
    get name(): string {
        return "python";
    }

    async load(pluginInfo: PluginInfo): Promise<Plugin> {
        const typesFileName = pluginInfo.interpreterInfo.directory + "/" + "types.js";

        const typesFile = await readFile(typesFileName);

        return new PythonPlugin(pluginInfo, evalTypes(typesFile));
    }
}