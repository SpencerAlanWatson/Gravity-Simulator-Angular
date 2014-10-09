require.config({
    baseUrl: "js",
    paths: {
        'vendor': 'vendor',
        'angular': '//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular',
        'angularAMD': 'vendor/angularAMD',
        'three': 'vendor/three',
        'underscore': 'vendor/underscore',
        'async': 'vendor/async'
    },
    shim: {
        'angularAMD': ['angular'],
    },    
    deps: ['app', 'controller']
});
