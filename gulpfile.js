var gulp = require('gulp');
var sass = require('gulp-sass');
var uglifyJs = require('gulp-uglifyjs');
var BS = require('browser-sync');
var del = require('del');
var concat = require('gulp-concat');
var UseRef = require('gulp-useref');


var config = {
    app: './app',
    dist: './dist'
};

gulp.task('test', function () {
    console.log('Gulp works');
});

/* ========= ТАСК "CLEAN" ========= */
gulp.task('clean', function () {
    return del.sync(config.dist); // Удаляем папку "distrib" перед сборкой
});

/**
 * HTML
 */

gulp.task('html', function () {
    gulp.src(config.app + '/*.html')
        .pipe(gulp.dest(config.dist))
        .pipe(BS.reload({stream: true}));
    gulp.src(config.app + '/img/*')
        .pipe(gulp.dest(config.dist + "/img"))
        .pipe(BS.reload({stream: true}));
    gulp.src(config.app + '/api/*')
        .pipe(gulp.dest(config.dist + "/api"))
        .pipe(BS.reload({stream: true}));
});

/**
 * CSS - для готовых css
 */

gulp.task('css', function () {
    gulp.src(config.app + '/css/**/*.css')
        .pipe(gulp.dest(config.dist + '/css'))
        .pipe(BS.reload({stream: true}))
});

/**
 * SASS
 */
gulp.task('sass', function () {
    gulp.src(config.app + '/css/**/*.sass')
        .pipe(sass())
        .pipe(gulp.dest(config.dist + '/css'))
        .pipe(BS.reload({stream: true}));

});

/**
 * JS
 */


gulp.task('js', function () {
    gulp.src(config.app + '/js/**/*.js')
    //.pipe(uglifyJs())
        .pipe(gulp.dest(config.dist + '/js'))
        .pipe(BS.reload({stream: true}))
});

/* ======== ТАСК "JS" ======== */
//gulp.task('js', function() {
//    return gulp.src(config.app + '/js/**/*.js') // Берём все необходимые скрипты
//        .pipe(concat('main.js')) // Собираем их в один файл
//        .pipe(gulp.dest(config.dist + '/js')) // Выгружаем
//        .pipe(BS.reload({stream: true}));
//});

/* ======== ТАСК "JS - init.js" ======== */
gulp.task('js', function () {
    return gulp.src(config.app + '/js/**/init.js') // Берём все необходимые скрипты
        .pipe(gulp.dest(config.dist + '/js')) // Выгружаем
        .pipe(BS.reload({stream: true}));
});

/*
    ОБЪЕДИНЯЕТ JS в один с заменой ссылок в html. итоговый файл конфигурируется в HTML
 */
gulp.task('useref', function () {
    return gulp.src(config.app + '/*.html')
        .pipe(UseRef())
        .pipe(gulp.dest(config.dist + '/'))
});


/**
 * Watch - наблюдает за папками и при изменении выполняет задачи
 */

gulp.task('watch', function () {
    gulp.task('clean');
    gulp.watch(config.app + '/css/**/*.css', ['css']);
    gulp.watch(config.app + '/css/**/*.sass', ['sass']);
    gulp.watch(config.app + '/js/**/*.js', ['useref']);
    gulp.watch(config.app + '/*.html', ['html']);
});

/**
 * Server
 */

gulp.task('server', function () {
    BS({
        server: {
            baseDir: config.dist
        }
    });
});

/**
 * Default
 */

gulp.task('default', ['test', 'clean', 'html', 'css', 'sass', 'js', 'useref' /*, 'watch', 'server'*/], function () {
    console.log('Default task');
});