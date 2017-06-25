import * as glob from "glob";
import * as minimatch from "minimatch";
import * as path from "path";
import * as fs from "fs";
import * as chalk from "chalk";

/**
 * Represents the type to which a well-formed config file must be conform, where
 * true includes everything, false excludes everything, and an object allows
 * include and exclude globs to be specified explicitly. Note that if both an
 * include and an exclude glob matches, the exclude wins.
 */
export type IFilterConfig = true|false|
{
    /**
     * The glob patterns specifying the files to include, where an empty array
     * includes nothing, and undefined has no effect.
     */
    include?: string[]|undefined;

    /**
     * The glob patterns specifying the files to exclude, where an empty array or
     * undefined to exclude nothing.
     */
    exclude?: string[]|undefined;
}

/**
 * Represents a filter that determines whether a specified file path should be included or excluded,
 * as defined by config files placed within the folder tree.
 */
export class TreeFilter
{
    private _filters: Filter[];

    /**
     * Creates a new instance of the TreeFilter type.
     * @param configFileGlob The glob to use when looking for the config files defining include and exclude globs.
     */
    public constructor(configFileGlob: string)
    {
        // Get the config file paths matching the specified glob, ordered by file path.
        const globFilePaths = glob.sync(configFileGlob).sort();

        // Read the config files.
        this._filters = globFilePaths.map(filePath => new Filter(filePath));
    }

    /**
     * Determines whether the specified file path is included or excluded, as defined by the config files from which this filter was created.
     * @param fileOrFolderPath The file or folder path to match agains the globs.
     * @returns True if the file is included, false if the file is excluded,
     * or undefined if no includes globs are specified, and no exclude globs matched.
     */
    public match(fileOrFolderPath: string): FilterResult|undefined
    {
        let result: FilterResult|undefined;

        fileOrFolderPath = fileOrFolderPath.replace(/\\/g, "/");

        for (let filter of this._filters.filter(filter =>
            fileOrFolderPath === filter.folderPath ||
            fileOrFolderPath.startsWith(`${filter.folderPath}/`)))
        {
            result = filter.match(fileOrFolderPath) || result;
        }

        return result;
    }
}

/**
 * Represents the result of matching a file or folder path agains a filter.
 */
export class FilterResult
{
    /**
     * True if the path is included, false if the path is excluded.
     */
    isIncluded: boolean;

    /**
     * The folder path at which the final match occurred.
     */
    folderPath: string;
}

/**
 * Represents a filter created from a config file, defining the include and exclude
 * globs to apply within the folder containing the config file folder. Note that if
 * both an include and an exclude glob matches, the exclude wins.
 */
export class Filter
{
    /**
     * The folder path to which the filter applies.
     */
    public readonly folderPath: string;

    /**
     * The glob patterns specifying the files to include, where an empty array
     * includes nothing, and undefined has no effect.
     */
    public readonly include: string[]|undefined;

    /**
     * The glob patterns specifying the files to exclude, where an empty array or
     * undefined to exclude nothing.
     */
    public readonly exclude: string[]|undefined;

    /**
     * Creates a new instance of the Filter type.
     * @param filePath The file path of the config file.
     */
    public constructor(configFilePath: string)
    {
        try
        {
            this.folderPath = path.dirname(configFilePath).replace(/\\/g, "/");

            const json = JSON.parse(fs.readFileSync(configFilePath).toString()) as IFilterConfig;

            if (typeof json !== "boolean")
            {
                if (json.include != null)
                {
                    this.include = json.include.map(glob => path.posix.join(this.folderPath, glob));
                }

                if (json.exclude != null)
                {
                    this.exclude = json.exclude.map(glob => path.posix.join(this.folderPath, glob));
                }
            }
            else if (json === true)
            {
                this.include = [path.posix.join(this.folderPath, "**")];
            }
            else if (json === false)
            {
                this.include = [];
            }
            else
            {
                throw new Error(`The contents of the file must represent the value ${chalk.cyan("true")}, ${chalk.cyan("false")}, or a valid config object`)
            }
        }
        catch (error)
        {
            throw new Error(`Could not parse the config in ${chalk.magenta(this.folderPath)}:\n${error}`)
        }
    }

    /**
     * Determines whether the specified file path is included or excluded, according to the config file from which this filter was created.
     * @param fileOrFolderPath The file or folder path to match agains the globs.
     * @returns The filter result indicating whether the file is included or excluded,
     * or undefined if no includes globs are specified, and no exclude globs matched.
     */
    public match(fileOrFolderPath: string): FilterResult|undefined
    {
        fileOrFolderPath = fileOrFolderPath.replace(/\\/g, "/");

        if (this.include != null)
        {
            return { folderPath: this.folderPath, isIncluded: this.include.some(glob => minimatch(fileOrFolderPath, glob)) };
        }

        if (this.exclude != null && this.exclude.some(glob => minimatch(fileOrFolderPath, glob)))
        {
            return { folderPath: this.folderPath, isIncluded: false };
        }

        return undefined;
    }
}
