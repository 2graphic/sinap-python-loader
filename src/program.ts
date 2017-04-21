import * as Core from "sinap-core";
import { PythonPlugin } from "./plugin";
import { Value, Type } from "sinap-types";
import { Model } from "sinap-core";
import { spawn } from "child_process";
import { createInterface } from "readline";

function makePrimitive(env: Value.Environment, p: number | string | boolean) {
    return new Value.Primitive(new Type.Primitive((typeof p) as Type.PrimitiveName), env, p);
}

function runPython(plugin: PythonPlugin, model: Model, args: Value.Value[]) {
    const subprocess = spawn("python", [plugin.pluginInfo.packageJson.sinap['plugin-file']], {
        cwd: plugin.pluginInfo.interpreterInfo.directory,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    const lines = createInterface({ input: subprocess.stdout });
    subprocess.stdin.write(JSON.stringify(model.serialize()) + "\n");
    subprocess.stdin.write(JSON.stringify(args.map(a => a.serialRepresentation)) + "\n");

    return new Promise<{ steps: Value.CustomObject[], result?: Value.Value, error?: Value.Primitive }>((resolve, reject) => {
        const fromSerial: any[] = [];
        lines.on("line", (data) => {
            fromSerial.push(JSON.parse(data));
        });

        subprocess.on("close", () => {
            try {
                const stepsRaw = fromSerial.slice(0, fromSerial.length - 1);
                const resultRaw = fromSerial[fromSerial.length - 1];

                const result = makePrimitive(model.environment, resultRaw);
                const steps = stepsRaw.map(s => {
                    const state = new Value.CustomObject(plugin.types.state, model.environment);

                    for (const key in s) {
                        const value = s[key];
                        if (typeof (value) === "object") {
                            if (value.kind === "value-reference") {
                                state.set(key, model.environment.fromReference(value));
                            } else {
                                throw new Error("only object references allowed");
                            }
                        } else {
                            state.set(key, makePrimitive(model.environment, value));
                        }
                    }

                    return state;
                });
                resolve({ steps: steps, result: result });
            } catch (err) {
                reject(err);
            }
        });
    });
}

export class PythonProgram implements Core.Program {
    readonly model: Model;
    readonly toValue: (a: any) => Value.Value;

    constructor(modelIn: Model, public plugin: PythonPlugin) {
        this.model = Model.fromSerial(modelIn.serialize(), plugin);
        const nodes = new Value.ArrayObject(new Value.ArrayType(plugin.types.nodes), this.model.environment);
        const edges = new Value.ArrayObject(new Value.ArrayType(plugin.types.edges), this.model.environment);

        for (const node of this.model.nodes) {
            nodes.push(node);
            node.set("children", new Value.ArrayObject(node.type.members.get("children") as Value.ArrayType, this.model.environment));
            node.set("parents", new Value.ArrayObject(node.type.members.get("parents") as Value.ArrayType, this.model.environment));
        }

        for (const edge of this.model.edges) {
            edges.push(edge);
            const sourceBox = edge.get("source") as Value.Union;
            const source = sourceBox.value as Value.CustomObject;
            const sourceChildren = source.get("children") as Value.ArrayObject;
            sourceChildren.push(edge);

            const destinationBox = edge.get("destination") as Value.Union;
            const destination = destinationBox.value as Value.CustomObject;
            const destinationParents = destination.get("parents") as Value.ArrayObject;
            destinationParents.push(edge);
        }

        this.model.graph.set("nodes", nodes);
        this.model.graph.set("edges", edges);
    };

    async run(a: Value.Value[]) {
        const result = await runPython(this.plugin, this.model, a);
        return result;
    }

    validate() {
        return null;
    }
}