import * as chalk from "chalk";

// Define the name of the plugin.
export const pluginName = "gulp-tree-filter";

/**
 * Represents the plugin configuration.
 */
export interface IPluginConfig
{
    /**
     * The glob to use when looking for the config files defining include and exclude globs.
     */
    configFileGlob: string;

    /**
     * True if a path should be included by default, if no includes globs are specified,
     * and no exclude globs matched.
     * Default is false.
     */
    includeByDefault?: boolean;

    /**
     * True to enable debug logging, otherwise false.
     * Default is false.
     */
    debug?: boolean;
}

/**
 * Represents the plugin configuration.
 */
export class PluginConfig
{
    /**
     * Creates a new instance of the PluginConfig type.
     * @param config The config object from which the instance should be created.
     */
    public constructor(config?: IPluginConfig)
    {
        if (config == null)
        {
            throw new Error(`The plugin options are required.`);
        }

        if (config.configFileGlob == null)
        {
            throw new Error(`The '${chalk.cyan("configFileGlob")}' option is required.`);
        }

        this.configFileGlob = config.configFileGlob;

        if (config.includeByDefault != null)
            this.includeByDefault = config.includeByDefault;

        if (config.debug != null)
            this.debug = config.debug;
    }

    /**
     * The glob to use when looking for the config files defining include and exclude globs.
     */
    public configFileGlob: string;

    /**
     * True if a path should be included by default, if no includes globs are specified,
     * and no exclude globs matched.
     */
    public includeByDefault?: boolean = false;

    /**
     * True to enable debug logging, otherwise false.
     */
    public debug: boolean = false;
}
