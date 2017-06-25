
/* How to run this example:
 * --------------------------------------------------------------------------------------------------------------------
 * 1. Open a command prompt in this folder.
 * 2. Execute the command: gulp
 *
 * This will execute all the tasks in the correct order, producing output in the 'artifacts' folders.
 * You may optionally specify '--debug' to enable debug logging.
 * --------------------------------------------------------------------------------------------------------------------
 */

const gulp = require("gulp");
const util = require("gulp-util");
const del = require("del");
const treeFilter = require("../lib/index");

// The configuration for the 'gulp-tree-filter' plugin.
const pluginConfig =
{
    configFileGlob: "**/_filter.json",
    includeByDefault: true,
    debug: util.env.debug != null
};

/**
 * Cleans the artifacts folder.
 */
gulp.task("clean", function ()
{
    // Delete the artifacts.
    return del(["./artifacts/*"]);
});

/**
 * Filters the files being processed, as defined by the config
 * files placed within the folder tree.
 */
gulp.task("filter", function ()
{
    return gulp

        // Get the source files.
        .src(["./source/**/!(_filter.json)"])

        // Determine whether the file should be included.
        .pipe(treeFilter(pluginConfig).filter())

        // Write the destination file.
        .pipe(gulp.dest("./artifacts"));
});

/**
 * Runs all the tasks, in sequence.
 */
gulp.task("default", gulp.series("clean", "filter"));
