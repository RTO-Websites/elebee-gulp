/**
 * @version 0.1.0
 * @author RTO GmbH <info@rto.de>
 * @license MIT
 */
'use strict';

const Gulp = require('gulp');
const Fs = require('fs');
const Jsonfile = require('jsonfile');
const Merge = require('merge-stream');
const Del = require('del');
const Plugins = require('gulp-load-plugins')();

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

    this.pkg = Jsonfile.readFileSync('package.json');

    this.args = Plugins.util.env;

    let src = 'src';
    let dist = '../themes/' + this.pkg.name;

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

    let defaultTaskDependencies = [
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

    this.gulp.task('clean:sprites', () => {return this.taskCleanSprites()});
    this.gulp.task('clean:images', () => {return this.taskCleanImages()});
    this.gulp.task('clean:css:admin', () => {return this.taskCleanCssAdmin()});
    this.gulp.task('clean:css:main', () => {return this.taskCleanCssMain()});
    this.gulp.task('clean:js:main', () => {return this.taskCleanJsMain()});
    this.gulp.task('clean:js:vendor', () => {return this.taskCleanJsVendor()});
    this.gulp.task('clean:copy', () => {return this.taskCleanCopy()});
    this.gulp.task('lint:scss:admin', () => {return this.taskLintScssAdmin()});
    this.gulp.task('lint:scss:main', () => {return this.taskLintScssMain()});
    this.gulp.task('lint:coffee:main', () => {return this.taskLintCoffeeMain()});
    this.gulp.task('sprites', ['clean:sprites'], () => {return this.taskSprites()});
    this.gulp.task('images', ['clean:images', 'sprites'], () => {return this.taskImages()});
    this.gulp.task('compile:scss:admin', ['clean:css:admin', 'lint:scss:admin'], () => {return this.taskCompileScssAdmin()});
    this.gulp.task('compile:scss:main', ['clean:css:main', 'lint:scss:main', 'sprites'], () => {return this.taskCompileScssMain()});
    this.gulp.task('compile:coffee:main', ['clean:js:main', 'lint:coffee:main'], () => {return this.taskCompileCoffeeMain()});
    this.gulp.task('uglify:js:vendor', ['clean:js:vendor'], () => {return this.taskUglifyJsVendor()});
    this.gulp.task('copy', ['clean:copy'], () => {return this.taskCopy()});

    this.gulp.task('watch:compile:scss:admin', ['clean:css:admin', 'lint:scss:admin'], () => {return this.taskCompileScssAdmin()});
    this.gulp.task('watch:compile:scss:main', ['clean:css:main', 'lint:scss:main'], () => {return this.taskCompileScssMain()});
    this.gulp.task('watch:images', ['clean:images'], () => {return this.taskImages()});
    this.gulp.task('watch', [
      'compile:scss:admin',
      'compile:scss:main',
      'compile:coffee:main',
      'uglify:js:vendor',
      'images',
      'copy'
    ], () => {return this.taskWatch()});

    this.gulp.task('reload', ['copy'], () => {ElebeeGulp.reload()});
  };

  /**
   *
   * @returns {*}
   */
  taskCleanCssMain() {
    return ElebeeGulp.taskClean([
      this.paths.dist.css + '/main.*'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanCssAdmin() {
    return ElebeeGulp.taskClean([
      this.paths.dist.css + '/admin.*'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanJsMain() {
    return ElebeeGulp.taskClean([
      this.paths.dist.js + '/main.*'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanJsVendor() {
    return ElebeeGulp.taskClean([
      this.paths.dist.js + '/vendor*.js',
      this.paths.dist.js + '/vendor*.js.map'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanSprites() {
    return ElebeeGulp.taskClean([
      this.paths.dist.sprites
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanImages() {
    return ElebeeGulp.taskClean([
      this.paths.dist.img + '/**/*'
    ]);
  };

  /**
   *
   * @returns {*}
   */
  taskCleanCopy() {
    console.log('taskCleanCopy');
    return ElebeeGulp.taskClean([
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
  static taskClean(files) {
    return Del(files, {
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

    let path = ElebeeGulp.cloneObject(this.paths.src.scss.main);
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
      .pipe(Plugins.stylelint({
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

    let config = {},
      configFiles = this.pkg.coffeelint.extends;

    if(configFiles instanceof Array) {
      for(let i = 0; i < configFiles.length; ++i) {
        try {
          let tmpConfig = Jsonfile.readFileSync(configFiles[i]);
          for(let rule in tmpConfig) {
            config[rule] = tmpConfig[rule];
          }
        }
        catch (error) {}
      }
    }
    else {
      try {
        config = Jsonfile.readFileSync(this.pkg.coffeelint.extends);
      }
      catch (error) {
        config = {};
      }
    }

    return this.gulp.src(this.paths.src.coffee.main)
      .pipe(Plugins.coffeelint(config))
      .pipe(Plugins.coffeelint.reporter('default'));
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
      .pipe(Plugins.sassBulkImport())
      .pipe(Plugins.if(this.args.dev, Plugins.sourcemaps.init(this.sourcemapsConfig)))
      .pipe(Plugins.sass(this.sassConfig)
        .on('error', Plugins.sass.logError))
      .pipe(Plugins.autoprefixer(this.autoprefixerConfig))
      .pipe(Plugins.concat(outFileName))
      .pipe(Plugins.if(this.args.dev, Plugins.sourcemaps.write()))
      .pipe(this.gulp.dest(this.paths.dist.css))
      .pipe(Plugins.notify(this.notifyConfig))
      .pipe(Plugins.livereload());
  };

  /**
   * Minify and copy all JavaScript (except vendor scripts)
   * with sourcemaps all the way down
   *
   * @returns {*}
   */
  taskCompileCoffeeMain() {
    let coffeeStream = this.gulp.src(this.paths.src.coffee.main)
      .pipe(Plugins.plumber(this.errorSilent))
      .pipe(Plugins.if(this.args.dev, Plugins.sourcemaps.init(this.sourcemapsConfig)))
      .pipe(Plugins.coffee());

    let jsStream = this.gulp.src(this.paths.src.js.main)
      .pipe(Plugins.plumber(this.errorSilent))
      .pipe(Plugins.if(this.args.dev, Plugins.sourcemaps.init(this.sourcemapsConfig)))
      .pipe(Plugins.jshint());

    return Merge(coffeeStream, jsStream)
      .pipe(Plugins.uglify())
      .pipe(Plugins.concat('main.min.js'))
      .pipe(Plugins.if(this.args.dev, Plugins.sourcemaps.write()))
      .pipe(this.gulp.dest(this.paths.dist.js))
      .pipe(Plugins.notify(this.notifyConfig))
      .pipe(Plugins.livereload());
  };

  /**
   *
   * @returns {*}
   */
  taskUglifyJsVendor() {
    let files = Fs.readdirSync('src/js');

    let output = null;

    files.forEach((element) => {
      if (element.match(/vendor[a-zA-z0-9_-]*\.js\.json/)) {

        let src = ElebeeGulp.getSrcFromJson('src/js/' + element);
        let stream = this.gulp.src(src)
          .pipe(Plugins.if(this.args.dev, Plugins.sourcemaps.init(this.sourcemapsConfig)))
          .pipe(Plugins.uglify()
            .on('error', Plugins.util.log))
          .pipe(Plugins.concat(element.replace('.js.json', '.min.js')))
          .pipe(Plugins.if(this.args.dev, Plugins.sourcemaps.write()))
          .pipe(this.gulp.dest(this.paths.dist.js))
          .pipe(Plugins.notify(this.notifyConfig))
          .pipe(Plugins.livereload());

        if (output === null) {
          output = stream;
        }
        else {
          output = Merge(output, stream);
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

    let spritesmithMultiOptions = {
      spritesmith: (options) => {
        options.imgPath = '../img/' + options.imgName
      }
    };

    if (this.args.retina) {
      spritesmithMultiOptions.retinaSrcFilter = '*-retina.png';
      // spritesmithMultiOptions.retinaImgName = 'sprite-retina.png';
    }

    return this.gulp.src(this.paths.src.sprites)
      .pipe(Plugins.spritesmithMulti(spritesmithMultiOptions))
      .on('error', Plugins.util.log)
      .pipe(this.gulp.dest(this.paths.dist.sprites))
      /*.pipe(Plugins.notify(notifyConfig))*/;
  };

  /**
   * Copy and optimize all static images
   *
   * @returns {*}
   */
  taskImages() {
    return this.gulp.src(this.paths.src.images, {nodir: true})
    // Pass in options to the task
      .pipe(Plugins.imagemin({optimizationLevel: 5}))
      .pipe(this.gulp.dest(this.paths.dist.img))
      .pipe(Plugins.notify(this.notifyConfig))
      .pipe(Plugins.livereload());
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
    let watcher = [];

    Plugins.livereload.listen();

    watcher.push(this.gulp.watch(this.paths.src.scss.main, ['watch:compile:scss:main']));
    watcher.push(this.gulp.watch(this.paths.src.scss.admin, ['watch:compile:scss:admin']));
    watcher.push(this.gulp.watch(this.paths.src.coffee.main, ['compile:coffee:main']));
    watcher.push(this.gulp.watch(this.paths.src.js.main, ['compile:coffee:main']));
    watcher.push(this.gulp.watch('src/js/vendor*.js.json', ['uglify:js:vendor']));
    watcher.push(this.gulp.watch(this.paths.src.images, ['watch:images']));
    watcher.push(this.gulp.watch(this.paths.src.copy, ['copy', 'reload']));

    watcher.forEach((e, i, a) => {
      e.on('change', (event) => {
        ElebeeGulp.onChangeCallback(event);
      });
    });
  };

  /**
   *
   */
  static reload() {
    Plugins.livereload.reload('index.php');
  };

  /**
   *
   * @param event
   */
  static onChangeCallback(event) {
    let now = new Date(),
      time = now.toTimeString().substr(0, 8);
    console.log('\n[' + Plugins.util.colors.blue(time) + '] ' + event.type + ':\n\t' + event.path + '\n');
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
  static cwd(files, cwd) {
    if (cwd) {
      let i, file;
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
  static getSrcFromJson(jsonSrcFile) {
    let sources = Jsonfile.readFileSync(jsonSrcFile);
    let src = [];

    for (let i = 0; i < sources.length; ++i) {
      src = src.concat(ElebeeGulp.cwd(sources[i].files, sources[i].cwd));
    }

    return src;
  };

  /**
   * Clone an object
   *
   * @param object
   */
  static cloneObject(object) {
    return JSON.parse(JSON.stringify(object));
  };

}

module.exports = ElebeeGulp;
