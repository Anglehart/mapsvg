import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import sourcemaps from "rollup-plugin-sourcemaps";

import pkg from "./package.json";

export default [
    // browser-friendly UMD build
    {
        external: ["Handlebars", "CodeMirror", "typeahead", "Bloodhound"],
        input: "js/mapsvg/Map/Map.js",
        output: {
            globals: {
                Handlebars: "Handlebars",
                CodeMirror: "CodeMirror",
                Bloodhound: "Bloodhound",
            },
            name: "mapsvg",
            file: pkg.browser,
            format: "umd",
            sourcemap: true,
        },
        plugins: [
            // typescript(),
            sourcemaps(),
            resolve(), // so Rollup can find `ms`
            commonjs({
                namedExports: {
                    // './js/codemirror.js': ['CodeMirror'],
                    // './js/typeahead.jquery.js': ['typeahead'],
                    // './js/bloodhound.js': ['Bloodhound'],
                    "./js/sortable.min.js": ["Sortable"],
                },
            }),
            // typescript({
            // 	typescript: require('typescript')
            // }),
            typescript({
                lib: ["es2016", "dom"],
                target: "es6",
                sourceMap: true,
                include: "./js/mapsvg/**/*.ts",
                inlineSources: true,
            }),
            // so Rollup can convert `ms` to an ES module
        ],
    },

    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    // {
    // 	input: 'src/main.js',
    // 	external: ['ms'],
    // 	output: [
    // 		{ file: pkg.main, format: 'cjs' },
    // 		{ file: pkg.module, format: 'es' }
    // 	]
    // }
];
