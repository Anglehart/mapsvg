var gulp = require("gulp"),
    // uglify = require("gulp-uglify"),
    concat = require("gulp-concat"),
    // (cleanCSS = require("gulp-clean-css")),
    argv = require("yargs").argv,
    zip = require("gulp-zip"),
    // (replace = require("gulp-replace")),
    rename = require("gulp-rename"),
    // (gutil = require("gulp-util")),
    // (gulpif = require("gulp-if")),
    // (prompt = require("gulp-prompt")),
    rsync = require("gulp-rsync"),
    // (exec = require("child_process").exec),
    upload = require("gulp-file-post");
// (bump = require("gulp-bump"));

gulp.task("hbsToHtml", function () {
    return gulp
        .src(["js/mapsvg/FormBuilder/FormElements/**/*.hbs"])
        .pipe(concat("form-builder.html"))
        .pipe(gulp.dest("dist"));
});

gulp.task("mergeCss", function () {
    return gulp.src(["js/mapsvg/**/*.css"]).pipe(concat("mapsvg.css")).pipe(gulp.dest("dist"));
});

gulp.task("mapsvg_zip", function () {
    var version = argv.ver;
    return gulp
        .src(
            [
                "./**",
                "!./clockwork/**",
                "./clockwork",
                "!./{node_modules,node_modules/**}",
                "!./{tests,tests/**}/",
            ],
            { base: "../" }
        )
        .pipe(zip("wp.mapsvg-" + version + ".zip"))
        .pipe(gulp.dest("../"));
});

gulp.task("mapsvg_zip_latest", function () {
    var version = argv.ver;
    return gulp
        .src(["../wp.mapsvg-" + version + ".zip"], { base: "../" })
        .pipe(rename("wp.mapsvg-latest.zip"))
        .pipe(gulp.dest("../"));
});

gulp.task("mapsvg", gulp.series(gulp.parallel("hbsToHtml", "mergeCss")));

gulp.task("mapsvgCompile", gulp.series(gulp.parallel("hbsToHtml", "mergeCss")));

gulp.task("mapsvgCopyFiles", function () {
    return gulp
        .src(
            [
                "./**",
                "!./clockwork/**",
                "./clockwork",
                "!./{node_modules,node_modules/**}",
                "!./{tests,tests/**}/",
            ],
            { base: "./" }
        )
        .pipe(gulp.dest("../production/mapsvg/"));
});

gulp.task("deploy-zip", function () {
    var version = argv.ver;
    return gulp.src("../wp.mapsvg-latest.zip").pipe(
        upload({
            url: "https://mapsvg.com/wp-updates/",
            data: {
                version: version,
            },
            timeout: 1000000,
        })
            .on("error", function (err) {
                console.log("Upload result: " + err);
            })
            .on("end", function (resp) {
                // console.log("Upload result: "+resp);
            })
    );
});

gulp.task("deploy-demo", function () {
    rsyncConf = {
        progress: true,
        incremental: true,
        relative: true,
        emptyDirectories: true,
        recursive: true,
        clean: true,
        exclude: [],
    };

    rsyncConf.hostname = "mapsvg.com"; // hostname
    rsyncConf.username = "root"; // ssh username
    rsyncConf.destination = "/var/www/wp.mapsvg.com/html"; // path where uploaded files go

    return gulp.src(["../mapsvg"]).pipe(rsync(rsyncConf));
});

gulp.task("deploy-docs", function () {
    rsyncConf = {
        progress: true,
        incremental: true,
        relative: true,
        emptyDirectories: true,
        recursive: true,
        clean: true,
        exclude: [],
    };

    rsyncConf.hostname = "mapsvg.com"; // hostname
    rsyncConf.username = "root"; // ssh username
    rsyncConf.destination = "/var/www/mapsvg.com/html"; // path where uploaded files go

    // documentation build ./wp-content/plugins/mapsvg-dev/js/mapsvg/*.js -f html -o ./docs/api --theme ./documentation-theme-light/ --sort-order alpha

    return gulp.src(["../../../docs/api"]).pipe(rsync(rsyncConf));
});

gulp.task("build-docs", function () {
    return exec(
        "documentation build ./js/mapsvg/*.js -f html -o ../../../docs/api --theme ../../../documentation-theme-light/ --sort-order alpha"
    );
});

gulp.task("docs", gulp.series("build-docs", "deploy-docs"));

gulp.task("mapsvg_deploy_css", function () {
    return gulp.src(["./css/**"]).pipe(gulp.dest("../mapsvg/css"));
});
gulp.task("mapsvg_deploy_js", function () {
    return gulp.src(["./js/**"]).pipe(gulp.dest("..  /wp-content/plugins/mapsvg/js"));
});
gulp.task("mapsvg_deploy_dist", function () {
    return gulp
        .src(["./wp-content/plugins/mapsvg-dev/dist/**"])
        .pipe(gulp.dest("./wp-content/plugins/mapsvg/dist"));
});
gulp.task("mapsvg_deploy_maps", function () {
    return gulp
        .src(["./wp-content/plugins/mapsvg-dev/maps/**"])
        .pipe(gulp.dest("./wp-content/plugins/mapsvg/maps"));
});
gulp.task(
    "mapsvg_deploy_php",
    gulp.parallel(
        function () {
            return gulp
                .src(["./wp-content/plugins/mapsvg-dev/plugin-update-checker/**/*"], {
                    base: "./wp-content/plugins/mapsvg-dev",
                })
                .pipe(gulp.dest("./wp-content/plugins/mapsvg/"));
        },
        function () {
            return gulp
                .src(["./wp-content/plugins/mapsvg-dev/fonts/**/*"], {
                    base: "./wp-content/plugins/mapsvg-dev",
                })
                .pipe(gulp.dest("./wp-content/plugins/mapsvg/"));
        },
        function () {
            return gulp
                .src(["./wp-content/plugins/mapsvg-dev/imgs/**/*"], {
                    base: "./wp-content/plugins/mapsvg-dev",
                })
                .pipe(gulp.dest("./wp-content/plugins/mapsvg/"));
        },
        function () {
            return gulp
                .src(["./wp-content/plugins/mapsvg-dev/mapsvg2/**/*"], {
                    base: "./wp-content/plugins/mapsvg-dev",
                })
                .pipe(gulp.dest("./wp-content/plugins/mapsvg/"));
        },
        function () {
            return gulp
                .src(["./wp-content/plugins/mapsvg-dev/markers/**/*"], {
                    base: "./wp-content/plugins/mapsvg-dev",
                })
                .pipe(gulp.dest("./wp-content/plugins/mapsvg/"));
        },
        function () {
            return gulp
                .src([
                    "./wp-content/plugins/mapsvg-dev/blank-template.php",
                    "./wp-content/plugins/mapsvg-dev/shortcodes.php",
                    "./wp-content/plugins/mapsvg-dev/download.php",
                    "./wp-content/plugins/mapsvg-dev/*.inc",
                ])
                .pipe(gulp.dest("./wp-content/plugins/mapsvg/"));
        }
    )
);
gulp.task("mapsvg_deploy_php_main", function () {
    var version = argv.ver;

    return gulp
        .src(["./wp-content/plugins/mapsvg-dev/mapsvg.php"])
        .pipe(replace(/Version: (\d+)\.(\d+)\.(\d+)-dev/g, "Version: " + version))
        .pipe(
            replace(/'MAPSVG_VERSION', \'(\d+)\.(\d+)\.(\d+)-dev/g, "'MAPSVG_VERSION', '" + version)
        )
        .pipe(replace(/'MAPSVG_DEBUG_ROOT', true/g, "'MAPSVG_DEBUG_ROOT', false"))
        .pipe(replace(/error_reporting/g, "//error_reporting"))
        .pipe(gulp.dest("./wp-content/plugins/mapsvg/"));
});

gulp.task(
    "mapsvg_deploy",
    gulp.parallel(
        "mapsvg_deploy_css",
        "mapsvg_deploy_js",
        "mapsvg_deploy_dist",
        "mapsvg_deploy_maps",
        "mapsvg_deploy_php",
        "mapsvg_deploy_php_main"
    )
);

gulp.task("mapsvg_deploy_demo", function () {
    return gulp
        .src(["./wp-content/plugins/mapsvg/**"])
        .pipe(gulp.dest("../mapsvgDEMO/wp-content/plugins/mapsvg/"));
});
gulp.task("mapsvg_deploy_landing", function () {
    return gulp
        .src(["./wp-content/plugins/mapsvg/**"])
        .pipe(gulp.dest("../mapsvg.com/blog/wp-content/plugins/mapsvg5/"));
});

gulp.task("mapsvgdemo", gulp.parallel("mapsvg_deploy_demo", "mapsvg_deploy_landing"));

gulp.task("mapsvg_js_main", function () {
    return (
        gulp
            .src([
                "./wp-content/plugins/mapsvg-dev/js/mapsvg/globals.js",
                "./wp-content/plugins/mapsvg-dev/js/mapsvg/*.js",
            ])
            // .pipe(uglify())
            .pipe(concat("mapsvg-main.js"))
            .pipe(gulp.dest("./wp-content/plugins/mapsvg-dev/js/"))
    );
});
gulp.task("mapsvg_js_front", function () {
    return gulp
        .src([
            "./wp-content/plugins/mapsvg-dev/js/mapsvg-main.js",
            "./wp-content/plugins/mapsvg-dev/js/jquery.mousewheel.min.js",
            "./wp-content/plugins/mapsvg-dev/js/handlebars.js",
            "./wp-content/plugins/mapsvg-dev/js/handlebars-helpers.js",
            "./wp-content/plugins/mapsvg-dev/js/mapsvg-admin/form.mapsvg.js",
            "./wp-content/plugins/mapsvg-dev/js/typeahead.bundle.min.js",
            "./wp-content/plugins/mapsvg-dev/js/jquery.nanoscroller.min.js",
            "./wp-content/plugins/mapsvg-dev/js/select2.full.min.js",
        ])
        .pipe(uglify())
        .pipe(concat("mapsvg-front.min.js"))
        .pipe(gulp.dest("./wp-content/plugins/mapsvg-dev/dist"));
});
gulp.task("mapsvg_css_front", function () {
    return (
        gulp
            .src(["./dist/mapsvg.css"])
            .pipe(cleanCSS())
            // .pipe(minifyCss())
            .pipe(concat("mapsvg.min.css"))
            .pipe(gulp.dest("./dist"))
    );
});
gulp.task("mapsvg_js_admin", function () {
    return gulp
        .src([
            "./wp-content/plugins/mapsvg-dev/js/admin.js",
            "./wp-content/plugins/mapsvg-dev/js/mapsvg-admin/controller.js",
            "./wp-content/plugins/mapsvg-dev/js/mapsvg-admin/*.js",
            "!./wp-content/plugins/mapsvg-dev/js/mapsvg-admin/mapsvg-admin.js",
            "./wp-content/plugins/mapsvg-dev/js/papaparse.min.js",
            "./wp-content/plugins/mapsvg-dev/js/bootstrap.min.js",
            "./wp-content/plugins/mapsvg-dev/js/bootstrap-toggle.min.js",
            "./wp-content/plugins/mapsvg-dev/js/bootstrap-colorpicker.min.js",
            "./wp-content/plugins/mapsvg-dev/js/jquery.growl.js",
            "./wp-content/plugins/mapsvg-dev/js/select2.full.min.js",
            "./wp-content/plugins/mapsvg-dev/js/ion.rangeSlider.min.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.javascript.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.xml.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.css.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.htmlmixed.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.simple.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.multiplex.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.handlebars.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.show-hint.js",
            "./wp-content/plugins/mapsvg-dev/js/codemirror.anyword-hint.js",
            "./wp-content/plugins/mapsvg-dev/js/sortable.min.js",
            "./wp-content/plugins/mapsvg-dev/js/jquery.jscrollpane.min.js",
            "./wp-content/plugins/mapsvg-dev/js/html2canvas.min.js",
            "./wp-content/plugins/mapsvg-dev/js/bootstrap-datepicker.min.js",
            "./wp-content/plugins/mapsvg-dev/js/datepicker-locales/locales.js",
            "./wp-content/plugins/mapsvg-dev/js/path-data-polyfill.js",
        ])
        .pipe(uglify())
        .pipe(concat("mapsvg-admin.min.js"))
        .pipe(gulp.dest("./wp-content/plugins/mapsvg-dev/dist"));
});
gulp.task("mapsvg_css_admin", function () {
    return gulp
        .src([
            "./wp-content/plugins/mapsvg-dev/css/*.css",
            "!./wp-content/plugins/mapsvg-dev/css/mapsvg.css",
            "!./wp-content/plugins/mapsvg-dev/css/mapsvg-admin.min.css",
            "!./wp-content/plugins/mapsvg-dev/css/mapsvg-front.min.css",
            "!./wp-content/plugins/mapsvg-dev/css/bootstrap.css",
            "!./wp-content/plugins/mapsvg-dev/css/select2.min.css",
            "!./wp-content/plugins/mapsvg-dev/css/nanoscroller.css",
        ])
        .pipe(cleanCSS())
        .pipe(concat("mapsvg-admin.min.css"))
        .pipe(gulp.dest("./wp-content/plugins/mapsvg-dev/dist"));
});

gulp.task("deploy", gulp.series("deploy-zip"));

// gulp.task('bump', function(){
//     var version = argv.ver;
//     return gulp.src('./package.json')
//         .pipe(bump({version: version}))
//         .pipe(gulp.dest('./'));
// });

// BUILD & ZIP MAPSVG
gulp.task("build", async function () {
    var version = argv.ver;

    var task1 = gulp
        .src(["./wp-content/plugins/mapsvg-dev/css/**"])
        .pipe(gulp.dest("./wp-content/plugins/mapsvg/css"));
    var task2 = gulp
        .src(["./wp-content/plugins/mapsvg-dev/js/**"])
        .pipe(gulp.dest("./wp-content/plugins/mapsvg/js"));
    var task3 = gulp
        .src(["./wp-content/plugins/mapsvg-dev/dist/**"])
        .pipe(gulp.dest("./wp-content/plugins/mapsvg/dist"));
    var taskMaps = gulp
        .src(["./wp-content/plugins/mapsvg-dev/maps/**"])
        .pipe(gulp.dest("./wp-content/plugins/mapsvg/maps"));
    var task4 = gulp
        .src([
            "./wp-content/plugins/mapsvg-dev/download.php",
            "./wp-content/plugins/mapsvg-dev/*.inc",
        ])
        .pipe(gulp.dest("./wp-content/plugins/mapsvg/"));

    var task5 = gulp
        .src(["./wp-content/plugins/mapsvg-dev/mapsvg.php"])
        .pipe(replace(/Version: \d\.\d\.\d-dev/g, "Version: " + version))
        .pipe(replace(/'MAPSVG_VERSION', '\d\.\d\.\d-dev/g, "'MAPSVG_VERSION', '" + version))
        .pipe(replace(/'MAPSVG_DEBUG_ROOT', true/g, "'MAPSVG_DEBUG_ROOT', false"))
        .pipe(replace(/error_reporting/g, "//error_reporting"))
        .pipe(gulp.dest("./wp-content/plugins/mapsvg/"));

    var zipTask = gulp
        .src(["./wp-content/plugins/mapsvg/**"], { base: "./wp-content/plugins" })
        .pipe(zip("wp.mapsvg-" + version + ".zip"))
        .pipe(gulp.dest("./wp-content/plugins/"));

    var zipTask2 = gulp
        .src(["./wp-content/plugins/wp.mapsvg-" + version + ".zip"], {
            base: "./wp-content/plugins",
        })
        .pipe(zip("wp.mapsvg-latest.zip"))
        .pipe(gulp.dest("./wp-content/plugins/wp.mapsvg-latest.zip"));

    return [task1, task2, task3, taskMaps, task4, task5, zipTask, zipTask2];
});

gulp.task(
    "gallery",
    gulp.series(
        gulp.parallel(
            function () {
                return gulp
                    .src([
                        "./wp-content/plugins/mapsvg-gallery-dev/js/photoswipe.min.js",
                        "./wp-content/plugins/mapsvg-gallery-dev/js/photoswipe-ui-default.min.js",
                        "./wp-content/plugins/mapsvg-gallery-dev/js/mapsvg-gallery.js",
                        "./wp-content/plugins/mapsvg-gallery-dev/js/jquery.justifiedGallery.min.js",
                        "./wp-content/plugins/mapsvg-gallery-dev/js/slick.min.js",
                    ])
                    .pipe(uglify())
                    .pipe(concat("mapsvg-gallery-front.min.js"))
                    .pipe(gulp.dest("./wp-content/plugins/mapsvg-gallery-dev/dist"));
            },
            function () {
                return gulp
                    .src([
                        "./wp-content/plugins/mapsvg-gallery-dev/css/photoswipe.css",
                        "./wp-content/plugins/mapsvg-gallery-dev/css/default-skin/default-skin.css",
                        "./wp-content/plugins/mapsvg-gallery-dev/css/justifiedGallery.min.css",
                        "./wp-content/plugins/mapsvg-gallery-dev/css/slick.css",
                        "./wp-content/plugins/mapsvg-gallery-dev/css/slick-theme.css",
                        "./wp-content/plugins/mapsvg-gallery-dev/css/mapsvg-gallery.css",
                    ])
                    .pipe(cleanCSS())
                    .pipe(concat("mapsvg-gallery-full.min.css"))
                    .pipe(gulp.dest("./wp-content/plugins/mapsvg-gallery-dev/dist"));
            },
            function () {
                return gulp
                    .src([
                        "./wp-content/plugins/mapsvg-gallery-dev/css/default-skin/*",
                        "!./wp-content/plugins/mapsvg-gallery-dev/css/default-skin/*.css",
                    ])
                    .pipe(gulp.dest("./wp-content/plugins/mapsvg-gallery-dev/dist"));
            },
            function () {
                return gulp
                    .src([
                        "./wp-content/plugins/mapsvg-gallery-dev/js/mapsvg-gallery.js",
                        "./wp-content/plugins/mapsvg-gallery-dev/js/gallery-controller.js",
                        "./wp-content/plugins/mapsvg-gallery-dev/js/gallery-list-controller.js",
                    ])
                    .pipe(uglify())
                    .pipe(concat("mapsvg-gallery-admin.min.js"))
                    .pipe(gulp.dest("./wp-content/plugins/mapsvg-gallery-dev/dist"));
            }
        ),
        gulp.parallel(
            function () {
                return gulp
                    .src(["./wp-content/plugins/mapsvg-gallery-dev/css/**"])
                    .pipe(gulp.dest("./wp-content/plugins/mapsvg-gallery/css"));
            },
            function () {
                return gulp
                    .src(["./wp-content/plugins/mapsvg-gallery-dev/js/**"])
                    .pipe(gulp.dest("./wp-content/plugins/mapsvg-gallery/js"));
            },
            function () {
                return gulp
                    .src(["./wp-content/plugins/mapsvg-gallery-dev/dist/**"])
                    .pipe(gulp.dest("./wp-content/plugins/mapsvg-gallery/dist"));
            },
            function () {
                var version = argv.ver;

                return gulp
                    .src(["./wp-content/plugins/mapsvg-gallery-dev/mapsvg-gallery.php"])
                    .pipe(replace(/Version: \d\.\d\.\d-dev/g, "Version: " + version))
                    .pipe(
                        replace(
                            /'MAPSVG_GAL_VERSION', '\d\.\d\.\d-dev/g,
                            "'MAPSVG_GAL_VERSION', '" + version
                        )
                    )
                    .pipe(replace(/'MAPSVG_GAL_DEBUG', true/g, "'MAPSVG_GAL_DEBUG', false"))
                    .pipe(gulp.dest("./wp-content/plugins/mapsvg-gallery/"));
            }
        ),
        function () {
            var version = argv.ver;
            return gulp
                .src(["./wp-content/plugins/mapsvg-gallery/**"], { base: "./wp-content/plugins" })
                .pipe(zip("wp.mapsvg-gallery-" + version + ".zip"))
                .pipe(gulp.dest("./wp-content/plugins/"));
        }
    )
);

gulp.task("test", async function () {
    return gulp
        .src(["./wp-content/plugins/mapsvg/**"], { base: "./wp-content/plugins" })
        .pipe(zip("wp.mapsvg.zip"))
        .pipe(gulp.dest("./wp-content/plugins/"));
});

gulp.task(
    "mapsvg",
    gulp.series(
        // "mapsvg_js_main",
        // gulp.parallel("mapsvg_js_admin", "mapsvg_css_admin", "mapsvg_js_front", "mapsvg_css_front"),
        // "mapsvg_deploy",
        "mapsvg_zip",
        "mapsvg_zip_latest"
        // 'bump'
        // 'deploy-zip'
        // 'deploy-demo'
    )
);
