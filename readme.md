gulp-tree-filter
===============

[![Version](https://img.shields.io/npm/v/gulp-tree-filter.svg)](https://www.npmjs.org/package/gulp-tree-filter)
[![Downloads](https://img.shields.io/npm/dm/gulp-tree-filter.svg)](https://www.npmjs.com/package/gulp-tree-filter)
[![Try on RunKit](https://badge.runkitcdn.com/gulp-tree-filter.svg)](https://runkit.com/npm/gulp-tree-filter)

Gulp plugin that filters the files in the stream using include and exclude globs defined in config files located within the folder tree.

As an example, let's say you have a build process that extracts all the localizable strings from all your HTML files, and uploads them to a translation service.
This is no problem if the product is just being maintained, but if the product is in active development, you will likely have areas of the product that are not yet ready for translation.
The problem then is, how do you selectively include and exclude files from such a string extraction process?

You could solve this with creative use of glob patterns in a gulp task, but that quickly gets out of hand, and if files are moved around in the project, those globs easily get out of sync.
This plugin provides an alternative approach, which is more tightly coupled to the file system and much easier to maintain.

The idea is, that instead of having a huge and unmaintainable list of glob patterns in a gulp task, we instead allow special config files to be placed in the folders of the project itself.
This plugin then finds all those config files, and uses them to determine whether the contents of a folder should be included or not. This way, the config lives in the folder itself, so if
the folder is moved or deleted, nothing needs to be updated, as the config file is moved or deleted together with the folder it applies to.

If the problem you are solving is related to localization, you may also want to look at the plugins:

* [gulp-translate](https://www.npmjs.com/package/gulp-translate) for extracting and injecting localizable content in HTML templates.
Use this to localize the your entire applications, and consider using this plugin to include and exclude files when extracting content for translation.

* [gulp-locale-filter](https://www.npmjs.com/package/gulp-locale-filter) for filtering files based on locale or language codes in the file path.
Use this to e.g. include only the locale config files that are relevant for the target locale when creating a localized build.

* [gulp-replace](https://www.npmjs.com/package/gulp-replace) for replacing text content in files.
Use this to e.g. replace placeholder such as `{{locale}}` in templates and CSS files with the actual target locale code when creating a localized build.

## The config files

To control whether files in a folder is included or excluded, simple JSON config files should be placed within the folder tree of the project.
The following is the type to which a well-formed config file must be conform, where `true` includes everything, `false` excludes everything, and an object allows `include` and `exclude`
globs to be specified explicitly. Note that if both an `include` and an `exclude` glob matches, the exclude wins.

```typescript
type IFilterConfig = true|false|
{
    /**
     * The glob patterns specifying the files to include, where an
     * empty array includes nothing, and undefined has no effect.
     */
    include?: string[]|undefined;

    /**
     * The glob patterns specifying the files to exclude, where an
     * empty array or undefined to exclude nothing.
     */
    exclude?: string[]|undefined;
}
```

The config files may be placed at multiple levels of the folder tree, meaning that a config file close to the root may e.g. exclude certain globs, and then another config file further down may
override this to include those globs within the subtree to which it applies - or the other way around. This allows for very granular control of what is included and excluded, and allows you to
easily e.g. exclude files in the middle of the tree, only include subtrees, or exclude subtrees.

Note that the config files themselves are also located using a configurable glob pattern - so if we stick to the translation example from before, we might reserve the file name `translate.json`
for config files used to determine what should be included in the string extraction.

Also note that if you enable the plugin option `includeByDefault`, you only need to create config files if you wish to exclude something - everything else will then be included by default.

## Examples

The following are a few examples of how the config files in the folder tree of your project may look:

### To exclude everything within a folder, create a JSON file containing:

```json
false
```
or
```json
{
    "include": []
}
```
or
```json
{
    "exclude": ["**"]
}
```

### To include everything within a folder, create a JSON file containing:

```json
true
```
or
```json
{
    "include": ["**"]
}
```

### To include everything within a folder, except a couple of specific files, create a JSON file containing something like:

```json
{
    "include": ["**"],
    "exclude": [
        "unfinished-file.html",
        "work-in-progress.html"
    ]
}
```

Note that you only need the include globs if you haven't enabled the plugin option `includeByDefault`, or if the files are excluded by a config file in a parent folder.

You may of course specify as many glob patterns as you like, and they may be as complex as you like, but given the hierarchical nature of this system, it should be quite simple.

### Example folder structure:

Again, using the translation example, let's say you have the plugin option `includeByDefault` enabled and that your filter config files are named `translate.json`.
Now let's say you wish to extract strings from all templates, except within `feature-3`, because that is still in development and not yet ready for translation.
In this case, you would want your gulp task exporting the strings to glob for sources matching `"sources/**/*.html"` and pipe them through this plugin.
You then just need to add a `translate.json` file containing `false` in the folder you wish to exclude - then everything in that folder, and its subfolders, will be excluded:

```
- sources
  - feature-1
      feature-1.html
  - feature-2
      feature-2.html
  - feature-3 // will not be included
    - sub-feature
        sub-feature.html
      feature-3.html
      translate.json // contains `false`
```

Now let's say you finish that sub-feature under `feature-3` early, and wish to export those strings for translation, so the translators will have less work to do in the end.
In this case, you would simply add a `translate.json` file in the `sub-feature` folder, thus overriding the one in the parent folder:

```
- sources
  - feature-1
      feature-1.html
  - feature-2
      feature-2.html
  - feature-3 // will not be included
    - sub-feature  // but this will be included
        sub-feature.html
        translate.json // contains `true`
      feature-3.html
      translate.json // contains `false`
```

And of course, when you are all done with `feature-3`, you simply search for and delete all `translate.json` files within that folder - and you're done.

## How to use the plugin

Install the plugin as a dev dependency:

```
npm install gulp-tree-filter --save-dev
```

Use the plugin:

```javascript
// Import the plugin:
const treeFilter = require("gulp-tree-filter");

// Define the plugin config in one place, to ensure all tasks
// use the same config:
const pluginConfig =
{
    configFileGlob: "**/translate.json",
    includeByDefault: true
};


// Use the commands provided by the plugin in your gulp tasks:
.pipe(treeFilter(pluginConfig).filter())
```

### Plugin config

The following is the interface for the config object, that must be passed to the plugin function.

```typescript
interface IPluginConfig
{
    /**
     * The glob to use when looking for the config files defining
     * include and exclude globs.
     */
    configFileGlob: string;

    /**
     * True if a path should be included by default, if no includes
     * globs are specified, and no exclude globs matched.
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
 * Filters the files being processed, as defined by the config
 * files placed within the folder tree.
 */
gulp.task("filter", function ()
{
    return gulp

        // Get the source files.
        .src(["sources/**/*.html"])

        // Determine whether the file should be included.
        .pipe(treeFilter(pluginConfig).filter())

        // Write the destination file.
        .pipe(gulp.dest("artifacts"));
});
```

Enjoy, and please report any issues in the issue tracker :-)