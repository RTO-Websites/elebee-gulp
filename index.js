/**
 * @version 0.1.0
 * @author RTO GmbH <info@rto.de>
 * @license MIT
 */
'use strict';

const Gulp = require('gulp');

/**
 * Abstract class representing the gulptfile.
 * Provides methods to customize gulp tasks.
 *
 * @since 0.1.0
 * @class
 */
class ElebeeGulp {

  /**
   *
   * @param gulp
   * @constructor
   */
  constructor(_gulp) {

    this.gulp = _gulp;

    this.fs = require('fs');
    this.path = require('path');
    this.jsonFile = require('jsonfile');
    this.plugins = require('gulp-load-plugins')();
    this.merge = require('merge-stream');
    this.del = require('del');

    this.pkg = this.jsonFile.readFileSync('package.json');

    this.args = this.plugins.util.env;

    var src = 'src';
    var dist = '../themes/' + this.pkg.name;

    this.paths = {
      src: {
        copy: [
          src + '/**/**/*',
          '!' + src + '/.sprites-cache',
          '!' + src + '/css/**/*',
          '!' + src + '/js/**/*',
          '!' + src + '/img/**/*',
          '!' + src + '/composer.{json,lock}'
        ],
        scss: {
          main: [
            src + '/.sprites-cache/**/*.css',
            src + '/css/**/*.scss',
            '!' + src + '/css/admin.scss',
            '!' + src + '/css/admin/**/*.scss'
          ],
          admin: [
            src + '/css/admin.scss',
            src + '/css/admin/**/*.scss'
          ]
        },
        coffee: {
          main: [
            src + '/js/**/*.coffee',
            '!' + src + '/js/vendor/**/*'
          ]
        },
        js: {
          main: [
            src + '/js/**/*.js',
            '!' + src + '/js/vendor/**/*'
          ]
        },
        images: [
          src + '/img/**/*',
          src + '/.sprites-cache/*.png',
          '!' + src + '/img/sprites/**/*'
        ],
        sprites: [
          src + '/img/sprites/**/*.png',
          '!' + src + '/img/sprites/**/*-retina.png'
        ],
        spritesRetina: [
          src + '/img/sprites/**/*-retina.png'
        ]
      },
      dist: {
        root: dist,
        css: dist + '/css',
        js: dist + '/js',
        img: dist + '/img',
        sprites: src + '/.sprites-cache'
      }
    };

    this.includePaths = [
      'bower_components',
      'bower_components/foundation-sites/scss',
      require('node-neat').includePaths,
      require('node-bourbon').includePaths
    ];

    this.sassConfig = {
      outputStyle: 'compressed',
      includePaths: this.includePaths
    };

    this.sourcemapsConfig = {
      loadMaps: true
    };

    this.autoprefixerConfig = {
      browsers: ['> 5%', 'IE 9']
    };

    this.notifyConfig = {
      title: 'Created',
      message: '<%= file.path %>'
    };
  }

  /**
   *
   */
  registerTaks() {

    var defaultTaskDependencies = [
      'compile:scss:admin',
      'compile:scss:main',
      'compile:coffee:main',
      'uglify:js:vendor',
      'images',
      'copy'
    ];

    if (this.args.watch) {
      defaultTaskDependencies.push('watch');
    }

    this.gulp.task('default', defaultTaskDependencies);

    this.gulp.task('clean:sprites', () => {this.taskCleanSprites()});
    this.gulp.task('clean:images', () => {this.taskCleanImages()});
    this.gulp.task('clean:css:admin', () => {this.taskCleanCssAdmin()});
    this.gulp.task('clean:css:main', () => {this.taskCleanCssMain()});
    this.gulp.task('clean:js:main', () => {this.taskCleanJsMain()});
    this.gulp.task('clean:js:vendor', () => {this.taskCleanJsVendor()});
    this.gulp.task('clean:copy', () => {this.taskCleanCopy()});
    this.gulp.task('lint:scss:admin', () => {this.taskLintScssAdmin()});
    this.gulp.task('lint:scss:main', () => {this.taskLintScssMain()});
    this.gulp.task('lint:coffee:main', () => {this.taskLintCoffeeMain()});
    this.gulp.task('sprites', ['clean:sprites'], () => {this.taskSprites()});
    this.gulp.task('images', ['clean:images', 'sprites'], () => {this.taskImages()});
    this.gulp.task('compile:scss:admin', ['clean:css:admin', 'lint:scss:admin'], () => {this.taskCompileScssAdmin()});
    this.gulp.task('compile:scss:main', ['clean:css:main', 'lint:scss:main', 'sprites'], () => {this.taskCompileScssMain()});
    this.gulp.task('compile:coffee:main', ['clean:js:main', 'lint:coffee:main'], () => {this.taskCompileCoffeeMain()});
    this.gulp.task('uglify:js:vendor', ['clean:js:vendor'], () => {this.taskUglifyJsVendor()});
    this.gulp.task('copy', ['clean:copy'], () => {this.taskCopy()});

    this.gulp.task('watch:compile:scss:admin', ['clean:css:admin', 'lint:scss:admin'], () => {this.taskCompileScssAdmin()});
    this.gulp.task('watch:compile:scss:main', ['clean:css:main', 'lint:scss:main'], () => {this.taskCompileScssMain()});
    this.gulp.task('watch:images', ['clean:images'], () => {this.taskImages()});
    this.gulp.task('watch', [
      'compile:scss:main',
      'compile:coffee:main',
      'uglify:js:vendor',
      'images',
      'copy'
    ], () => {this.taskWatch()});

    this.gulp.task('reload', ['copy'], () => {this.reload()});
  };

  /**
   *
   * @returns {*}
   */
  taskCleanCssMain() {
    return this.taskClean([
      this.paths.dist.css + '/main.*'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanCssAdmin() {
    return this.taskClean([
      this.paths.dist.css + '/admin.*'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanJsMain() {
    return this.taskClean([
      this.paths.dist.js + '/main.*'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanJsVendor() {
    return this.taskClean([
      this.paths.dist.js + '/vendor*.js',
      this.paths.dist.js + '/vendor*.js.map'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanSprites() {
    return this.taskClean([
      this.paths.dist.sprites
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanImages() {
    return this.taskClean([
      this.paths.dist.img + '/**/*'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanCopy() {
    return this.taskClean([
      this.paths.dist.root + '/**/*',
      '!' + this.paths.dist.css,
      '!' + this.paths.dist.css + '/**/*',
      '!' + this.paths.dist.js,
      '!' + this.paths.dist.js + '/**/*',
      '!' + this.paths.dist.img,
      '!' + this.paths.dist.img + '/**/*'
    ]);
  };

  /**
   *
   * @param files
   * @returns {*}
   */
  taskClean(files) {
    return this.del(files, {
      force: true
    });
  };

  /**
   *
   * @returns {*}
   */
  taskLintScssAdmin() {

    return this.taskLintScss(this.paths.src.scss.admin);

  }

  /**
   *
   * @returns {*}
   */
  taskLintScssMain() {

    var path = this.cloneObject(this.paths.src.scss.main);
    path.push('!src/css/vendor/**/*.scss');
    path.push('!src/.sprites-cache/**/*.css');

    return this.taskLintScss(path)

  };

  /**
   *
   * @param path
   * @returns {*}
   */
  taskLintScss(path) {

    return this.gulp.src(path)
      .pipe(this.plugins.stylelint({
        failAfterError: false,
        reporters: [
          {
            formatter: 'verbose', console: true
          }
        ]
      }));

  }

  /**
   *
   * @returns {*}
   */
  taskLintCoffeeMain() {

    var config = {},
      configFiles = this.pkg.coffeelint.extends;

    if(configFiles instanceof Array) {
      for(var i = 0; i < configFiles.length; ++i) {
        try {
          var tmpConfig = this.jsonFile.readFileSync(configFiles[i]);
          for(var rule in tmpConfig) {
            config[rule] = tmpConfig[rule];
          }
        }
        catch (error) {}
      }
    }
    else {
      try {
        config = this.jsonFile.readFileSync(this.pkg.coffeelint.extends);
      }
      catch (error) {
        config = {};
      }
    }

    return this.gulp.src(this.paths.src.coffee.main)
      .pipe(this.plugins.coffeelint(config))
      .pipe(this.plugins.coffeelint.reporter('default'));
    //.pipe(_plugins.coffeelint.reporter('coffeelint-stylish'));
  };

  /**
   *
   * @returns {*}
   */
  taskCompileScssMain() {
    return this.taskCompileScss(this.paths.src.scss.main, 'main.min.css');
  };

  /**
   *
   * @returns {*}
   */
  taskCompileScssAdmin() {
    return this.taskCompileScss(this.paths.src.scss.admin, 'admin.min.css');
  };

  /**
   *
   * @param src
   * @param outFileName
   * @returns {*}
   */
  taskCompileScss(src, outFileName) {
    return this.gulp.src(src)
      .pipe(this.plugins.sassBulkImport())
      .pipe(this.plugins.if(this.args.dev, this.plugins.sourcemaps.init(this.sourcemapsConfig)))
      .pipe(this.plugins.sass(this.sassConfig)
        .on('error', this.plugins.sass.logError))
      .pipe(this.plugins.autoprefixer(this.autoprefixerConfig))
      .pipe(this.plugins.concat(outFileName))
      .pipe(this.plugins.if(this.args.dev, this.plugins.sourcemaps.write()))
      .pipe(this.gulp.dest(this.paths.dist.css))
      .pipe(this.plugins.notify(this.notifyConfig))
      .pipe(this.plugins.livereload());
  };

  /**
   * Minify and copy all JavaScript (except vendor scripts)
   * with sourcemaps all the way down
   *
   * @returns {*}
   */
  taskCompileCoffeeMain() {
    var coffeeStream = this.gulp.src(this.paths.src.coffee.main)
      .pipe(this.plugins.plumber(this.errorSilent))
      .pipe(this.plugins.if(this.args.dev, this.plugins.sourcemaps.init(this.sourcemapsConfig)))
      .pipe(this.plugins.coffee());

    var jsStream = this.gulp.src(this.paths.src.js.main)
      .pipe(this.plugins.plumber(this.errorSilent))
      .pipe(this.plugins.if(this.args.dev, this.plugins.sourcemaps.init(this.sourcemapsConfig)))
      .pipe(this.plugins.jshint());

    return this.merge(coffeeStream, jsStream)
      .pipe(this.plugins.uglify())
      .pipe(this.plugins.concat('main.min.js'))
      .pipe(this.plugins.if(this.args.dev, this.plugins.sourcemaps.write()))
      .pipe(this.gulp.dest(this.paths.dist.js))
      .pipe(this.plugins.notify(this.notifyConfig))
      .pipe(this.plugins.livereload());
  };

  /**
   *
   * @returns {*}
   */
  taskUglifyJsVendor() {
    var files = this.fs.readdirSync('src/js');

    var output = null;

    files.forEach((element) => {
      if (element.match(/vendor[a-zA-z0-9_-]*\.js\.json/)) {

        var src = this.getSrcFromJson('src/js/' + element);
        var stream = this.gulp.src(src)
          .pipe(this.plugins.if(this.args.dev, this.plugins.sourcemaps.init(this.sourcemapsConfig)))
          .pipe(this.plugins.uglify()
            .on('error', this.plugins.util.log))
          .pipe(this.plugins.concat(element.replace('.js.json', '.min.js')))
          .pipe(this.plugins.if(this.args.dev, this.plugins.sourcemaps.write()))
          .pipe(this.gulp.dest(this.paths.dist.js))
          .pipe(this.plugins.notify(this.notifyConfig))
          .pipe(this.plugins.livereload());

        if (output === null) {
          output = stream;
        }
        else {
          output = this.merge(output, stream);
        }
      }
    });

    return output;
  };

  /**
   *
   * @returns {*}
   */
  taskSprites() {

    var spritesmithMultiOptions = {
      spritesmith: (options) => {
        options.imgPath = '../img/' + options.imgName
      }
    };

    if (this.args.retina) {
      spritesmithMultiOptions.retinaSrcFilter = '*-retina.png';
      // spritesmithMultiOptions.retinaImgName = 'sprite-retina.png';
    }

    return this.gulp.src(this.paths.src.sprites)
      .pipe(this.plugins.spritesmithMulti(spritesmithMultiOptions))
      .on('error', this.plugins.util.log)
      .pipe(this.gulp.dest(this.paths.dist.sprites))
      /*.pipe(this.plugins.notify(notifyConfig))*/;
  };

  /**
   * Copy and optimize all static images
   *
   * @returns {*}
   */
  taskImages() {
    return this.gulp.src(this.paths.src.images, {nodir: true})
    // Pass in options to the task
      .pipe(this.plugins.imagemin({optimizationLevel: 5}))
      .pipe(this.gulp.dest(this.paths.dist.img))
      .pipe(this.plugins.notify(this.notifyConfig))
      .pipe(this.plugins.livereload());
  };

  /**
   *
   * @returns {*}
   */
  taskCopy() {
    return this.gulp.src(this.paths.src.copy, {nodir: true})
      .pipe(this.gulp.dest(this.paths.dist.root));
  };

  /**
   * Rerun the task when a file changes
   */
  taskWatch() {
    var watcher = [];

    this.plugins.livereload.listen();

    watcher.push(this.gulp.watch(this.paths.src.scss.main, ['watch:compile:scss:main']));
    watcher.push(this.gulp.watch(this.paths.src.scss.admin, ['watch:compile:scss:admin']));
    watcher.push(this.gulp.watch(this.paths.src.coffee.main, ['compile:coffee:main']));
    watcher.push(this.gulp.watch(this.paths.src.js.main, ['compile:coffee:main']));
    watcher.push(this.gulp.watch('src/js/vendor*.js.json', ['uglify:js:vendor']));
    watcher.push(this.gulp.watch(this.paths.src.images, ['watch:images']));
    watcher.push(this.gulp.watch(this.paths.src.copy, ['copy', 'reload']));

    watcher.forEach((e, i, a) => {
      e.on('change', () => {
        this.onChangeCallback
      });
    });
  };

  reload() {
    this.plugins.livereload.reload('index.php');
  };

  onChangeCallback(event) {
    var now = new Date(),
      time = now.toTimeString().substr(0, 8);
    console.log('\n[' + this.plugins.util.colors.blue(time) + '] ' + event.type + ':\n\t' + event.path + '\n');
  };

  /**
   *
   */
  errorSilent() {
  };

  /**
   * Add cwd to file paths.
   *
   * @since 1.0.0
   * @param {string[]} files
   * @param {string} cwd
   * @return {string[]}
   */
  cwd(files, cwd) {
    if (cwd) {
      var i, file;
      for (i = 0; i < files.length; i++) {
        file = files[i];
        file = cwd + file;
        files[i] = file;
      }
    }
    return files;
  };

  /**
   *
   * @param jsonSrcFile
   * @returns {Array}
   */
  getSrcFromJson(jsonSrcFile) {
    var sources = this.jsonFile.readFileSync(jsonSrcFile);
    var src = [];

    for (var i = 0; i < sources.length; ++i) {
      src = src.concat(this.cwd(sources[i].files, sources[i].cwd));
    }

    return src;
  };

  /**
   * Clone an object
   *
   * @param object
   */
  cloneObject(object) {
    return JSON.parse(JSON.stringify(object));
  };

}

module.exports = ElebeeGulp;
