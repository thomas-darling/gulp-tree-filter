gulp-tree-filter
===============

[![Version](https://img.shields.io/npm/v/gulp-tree-filter.svg)](https://www.npmjs.org/package/gulp-tree-filter)
[![Downloads](https://img.shields.io/npm/dm/gulp-tree-filter.svg)](https://www.npmjs.com/package/gulp-tree-filter)
[![Try on RunKit](https://badge.runkitcdn.com/gulp-tree-filter.svg)](https://runkit.com/npm/gulp-tree-filter)

Gulp plugin that filters the files in the stream using include and exclude globs defined in config files located in the folder tree.

As an example, let's say you have a build process that extracts all the localizable strings from all your HTML files, and uploads them to a translation service.
This is no problem if the product is just being maintained, but if the product is in active development, you will likely have areas of the product that are not yet ready for translation.
The problem then is, how do you selectively include and exclude files from such a string extraction process?

You could solve this with creative use of glob patterns in a gulp task, but that quickly gets out of hand, and if files are moved around in the project, those globs easily get out of sync.
This plugin provides an alternative approach, which is more tightly coupled to the file system and much easier to maintain.

The idea is, that instead of having a huge unmanagable list of glob patterns in a gulp task, we instead allow special config files to be placed in folders within the project.
This plugin then finds all those config files, and uses them to determine whether a given file should be included or not. This way, the config lives directly in the folder itself, so if
the folder is moved or deleted, there is no config to update, as the config file is moved or deleted together with the folder it applies to.

You may also want to look at the plugins:

* [gulp-locale-filter](https://www.npmjs.com/package/gulp-locale-filter) for filtering files based on locale or language codes in the file path.

* [gulp-translate](https://www.npmjs.com/package/gulp-translate) for extracting and injecting localizable content in HTML templates.

* [gulp-replace](https://www.npmjs.com/package/gulp-replace) for replacing text content in files, for example by replacing `{{locale}}` in templates and CSS files with the actual target locale code.

## Config files

To control whether a folder is included or excluded, simple JSON config files should be placed within the project folder tree.
The following is the type to which a well-formed config file must be conform, where `true` includes everything, `false` excludes everything, and an object allows `include` and `exclude`
globs to be specified explicitly. Note that if both an `include` and an `exclude` glob matches, the exclude wins.

```typescript
type IFilterConfig = true|false|
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
```

The config files may be placed at multiple levels of the folder tree, meaning that a file close to the root may exclude certain globs, and then another config file further down may override
this to include those globs within the subtree to which it applies. This allows for very granular control of what is included and excluded, and allows you to easily e.g. exclude files in the
middle of the tree.

Note that the glob pattern used for locating the config files is also configurable - so if we stick to the translation example from before, we might reserve the name `translate.json` for
the config files used to determine what is included in the string extraction.

Also note that if you enable the plugin option `includeByDefault`, you only need to create config files if you wish to exclude something - everything else will then be included by default.

## How to use the plugin

Install the plugin as a dev dependency:

```
npm install gulp-tree-filter --save-dev
```

Use the plugin:

```javascript
// Import the plugin:
const treeFilter = require("gulp-tree-filter");

// Define the plugin config in one place, to ensure all tasks use the same config:
const pluginConfig =
{
    configFileGlob: "**/_filter.json",
    includeByDefault: true
};


// Use one of the commands provided by the plugin in your gulp tasks:
.pipe(treeFilter(pluginConfig).filter())
```

### Plugin config

The following is the interface for the config object, that must be passed to the plugin function.

```typescript
interface IPluginConfig
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
```

## The `filter` command

Example:

```javascript
/**
 * Filters the files being processed, as defined by the config files placed within the folder tree.
 */
gulp.task("filter", function ()
{
    return gulp

        // Get the source files.
        .src(["sources/**/!(_filter.json)"])

        // Determine whether the file should be included.
        .pipe(treeFilter(pluginConfig).filter())

        // Write the destination file.
        .pipe(gulp.dest("artifacts"));
});
```

Enjoy, and please report any issues in the issue tracker :-)