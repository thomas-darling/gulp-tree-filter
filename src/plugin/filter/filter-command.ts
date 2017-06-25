import * as util from "gulp-util";
import * as path from "path";
import * as fs from "fs";
import * as through from "through2";
import * as chalk from "chalk";
import {PluginConfig, pluginName} from "../plugin-config";
import {TreeFilter} from "../../core/tree-filter/tree-filter";

/**
 * Represents the command.
 */
export class FilterCommand
{
    private _config: PluginConfig;

    /**
     * Creates a new instance of the FilterCommand type.
     * @param config The plugin configuration to use.
     */
    public constructor(config: PluginConfig)
    {
        this._config = config;
    }

    /**
     * Creates the stream transform.
     * @returns The stream transform.
     */
    public create(): NodeJS.ReadWriteStream
    {
        const _this = this;

        const treeFilter = new TreeFilter(this._config.configFileGlob);

        // Return the stream transform.
        return through.obj(function (file: util.File, encoding: string, callback: (err?: any, data?: any) => void)
        {
            let relativeFilePath = path.relative(process.cwd(), file.path).replace(/\\/g, "/");

            try
            {
                // Drop null-files from the stream, as they would otherwise cause empty directories to be created.
                if (file.isNull())
                {
                    // Notify stream engine that we are done with this file.
                    callback();
                    return;
                }

                if (_this._config.debug)
                {
                    console.log(`\nProcessing ${chalk.magenta("./" + relativeFilePath)}`);
                }

                // Determine whether the file is included, according to the tree filter.
                const result = treeFilter.match(relativeFilePath);

                // Only keep the file in the stream if it should be included.
                if (result != null)
                {
                    if (result.isIncluded)
                    {
                        if (_this._config.debug)
                        {
                            console.log(chalk.green(`Included by ${chalk.magenta("./" + result.folderPath)}`));
                        }

                        // Push the file back into the stream.
                        this.push(file);
                    }
                    else if (_this._config.debug)
                    {
                        console.log(chalk.red(`Excluded by ${chalk.magenta("./" + result.folderPath)}`));
                    }
                }
                else
                {
                    if (_this._config.includeByDefault)
                    {
                        if (_this._config.debug)
                        {
                            console.log(chalk.green("Included by default"));
                        }

                        // Push the file back into the stream.
                        this.push(file);
                    }
                    else if (_this._config.debug)
                    {
                        console.log(chalk.red("Excluded by default"));
                    }
                }

                // Notify stream engine that we are done with this file.
                callback();
            }
            catch (error)
            {
                // Notify stream engine that an error occurred.
                callback(new util.PluginError(pluginName, `Error while processing file ${"./" + chalk.magenta(relativeFilePath)}:\n${error.message}`));
            }
        },
        function (callback: () => void)
        {
            if (_this._config.debug)
            {
                console.log("");
            }

            // Notify stream engine that we are all done.
            callback();
        });
    }
}
