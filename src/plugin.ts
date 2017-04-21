import * as Core from "sinap-core";
import { PythonProgram } from "./program";

export class PythonPlugin implements Core.Plugin {
    readonly types: Core.PluginTypes;

    constructor(readonly pluginInfo: Core.PluginInfo, types: Core.RawPluginTypes) {
        if (Core.fromRaw(types)) {
            this.types = types;
        }
    }

    validateEdge(src: Core.ElementValue, dst?: Core.ElementValue, like?: Core.ElementValue): boolean {
        src;
        dst;
        like;
        // TODO: implement
        return true;
    }


    makeProgram(model: Core.Model): Core.Program {
        return new PythonProgram(model, this);
    }
}