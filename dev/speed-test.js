//importScripts('vendor/benchmark.js');
/*var n0 = 0,
    n1 = -1,
    n2 = 1,
    n3 = -1e16,
    n4 = 1e16;

dontPause = true;


// bs = bitshift
var bm_bs_neg = new Benchmark('Bit Shift Negative',
        function () {
            n0 >> 31;
            n1 >> 31;
            n2 >> 31;
            n3 >> 31;
            n4 >> 31;
        }),
    //lt = less than
    bm_lt = new Benchmark('Less Than Operator',
        function () {
            n0 < 0;
            n1 < 0;
            n2 < 0;
            n3 < 0;
            n4 < 0;
        }),
    //opp = negated
    bm_bs_pos_opp = new Benchmark('Bit Shift Positive Through Negation',
        function () {
            !(n0 >> 31);
            !(n1 >> 31);
            !(n2 >> 31);
            !(n3 >> 31);
            !(n4 >> 31);
        }),
    //add = addition
    bm_bs_pos_add = new Benchmark('Bit Shift Positive Through Addition',
        function () {
            1 + (n0 >> 31);
            1 + (n1 >> 31);
            1 + (n2 >> 31);
            1 + (n3 >> 31);
            1 + (n4 >> 31);
        }),
    //gt = greater than
    bm_gt = new Benchmark('Greater Than Operator',
        function () {
            n0 > 0;
            n1 > 0;
            n2 > 0;
            n3 > 0;
            n4 > 0;
        });

function debug(Event) {
    console.log(this);
    if (!dontPause) {
        debugger;
    }
}

function postmes(Event) {
    console.log(Event);
    postMessage();
}

function setupSuite(Name) {
    var bm_suite = new Benchmark.Suite(Name);
    bm_suite.on('complete', debug);
    for (var i = 1; i < arguments.length; ++i) {
        arguments[i].on('complete', debug);
        bm_suite.push(arguments[i]);
    }
    return bm_suite;
};
// bm = benchmark
// neg = negative
var bm_neg_suite = setupSuite("Negative Sign Detection",
        bm_bs_neg,
        bm_lt),
    // pos = positive
    bm_pos_suite = setupSuite("Positive Sign Detection",
        bm_bs_pos_opp,
        bm_bs_pos_add,
        bm_gt);


//bm_neg_suite.push(bm_bs_neg, bm_lt);
//bm_pos_suite.push(bm_bs_pos_opp, bm_bs_pos_add, bm_gt);


//bm_neg_suite.on('complete', onComplete);
//bm_pos_suite.on('complete', onComplete);
bm_neg_suite.on('complete', function () {
        bm_pos_suite.run({
            async: true
        });
    });
bm_pos_suite.on('complete', function() {
    console.log('Finished');
});
    bm_neg_suite.run({
        async: true
});*/

var myWorker = new Worker("../workers/test-worker.js"),
    objects = [
               GObject(new THREE.Vector3(0, 0, 0), 20000, new THREE.Vector3(0, 0, 0)),
               GObject(new THREE.Vector3(150, 150, 0), 200, new THREE.Vector3(0.1, 0.1, 0))

            ],
    once = false,
    numbs = [];

function randomArrayBuffer() {

    var len = 32000000,
        arrayBuffer = new ArrayBuffer(len),
        dataView = new DataView(arrayBuffer);
    if (once) {
        for (var i = 0, ni = 0; i < len; i += 4, ++ni) {
            dataView.setUint32(i, numbs[ni]);
        }
    } else {
        for (var i = 0; i < len; i += 4 ) {
            //Random 32-bit uint
            var numb = THREE.Math.randInt(0, 4294967295);
            numbs.push(numb);
            dataView.setUint32(i, numb);
        }
        once = true;
    }
    return arrayBuffer;
}

function test(testData, tryTransfer) {
    var ots, ttsm;
    myWorker.onmessage = function (e) {
        ots = e.data;
        console.dir(ots - ttsm);
    };
    if (!tryTransfer) {
        ttsm = performance.now();
        myWorker.postMessage(testData);
    } else {
        ttsm = performance.now();
        myWorker.postMessage(testData, [testData]);
    }
}
var bench = new Benchmark('Copy Test', function (deferred) {
    myWorker.postMessage(objects);
}, {
    defer: true,
    setup: function (deferred) {
        myWorker.addEventListener('message', deferred.resolve.bind(deferred));
    },
    onComplete: function (e) {
        console.log("Finished!", e);
    }
});