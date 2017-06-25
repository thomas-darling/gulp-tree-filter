import * as util from "gulp-util";
import * as path from "path";
import * as through from "through2";

import {IPluginConfig, PluginConfig} from "./plugin-config";

import {FilterCommand} from "./filter/filter-command";

/**
 * Represents the plugin.
 */
export class Plugin
{
    private _config: PluginConfig;

    /**
     * Creates a new instance of the Plugin type.
     * @param config The plugin configuration to use, or undefined to use the default.
     */
    public constructor(config?: IPluginConfig)
    {
        this._config = new PluginConfig(config);
    }

    /**
     * Filters the files being processed, as defined by config files placed within the folder tree.
     */
    public filter(): NodeJS.ReadWriteStream
    {
        const filterCommand = new FilterCommand(this._config);
        return filterCommand.create();
    }
}