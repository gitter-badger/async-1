/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["module", "heya-unit", "../FastDeferred-ext", "../when", "../whilst", "../timeout"],
function(module, unit, FastDeferred, genericWhen, genericWhilst, timeout){
	"use strict";

	var all = FastDeferred.all,
		par = FastDeferred.par,
		any = FastDeferred.any,
		one = FastDeferred.one,
		seq = FastDeferred.seq,
		when    = function(value){ return genericWhen(value, FastDeferred); },
		whilst  = function(pred, body){ return genericWhilst(pred, body, FastDeferred); };

	timeout = timeout(FastDeferred);

	unit.add(module, [
		{
			timeout: 500,
			test: function test_timeout_seq(t){
				var x = t.startAsync("async");
				t.info("starting");
				timeout.resolve(100).then(function(v){
					t.info("callback 1: " + v);
					return timeout.resolve(v + 100);
				}).done(function(v){
					t.info("callback 2: " + v);
					x.done();
				});
			},
			logs: [
				"starting",
				"callback 1: 100",
				"callback 2: 200"
			]
		},
		{
			timeout: 500,
			test: function test_timeout_all(t){
				var x = t.startAsync("async");
				all(timeout.resolve(300), timeout.resolve(100), timeout.resolve(200)).
					done(function(v){
						eval(t.TEST("t.unify(v, [300, 100, 200])"));
						x.done();
					});
			}
		},
		{
			timeout: 500,
			test: function test_timeout_all_fail(t){
				var x = t.startAsync("async");
				all(timeout.resolve(300), timeout.resolve(100), timeout.reject(200)).
					done(function(v){
							try{
								t.error("Should not be here");
							}finally{
								x.done();
							}
						},
						function(v){
							eval(t.TEST("v.timeout === 200"));
							x.done();
							return false;
						});
			}
		},
		{
			timeout: 500,
			test: function test_timeout_par(t){
				var x = t.startAsync("async");
				par(timeout.reject(300, true), timeout.resolve(100), timeout.reject(200, true)).
					done(function(v){
						eval(t.TEST("t.unify(v, [ { timeout: 300 }, 100, { timeout: 200 } ])"));
						x.done();
					});
			}
		},
		{
			timeout: 500,
			test: function test_timeout_any(t){
				var x = t.startAsync("async");
				any(timeout.resolve(300), timeout.resolve(100), timeout.resolve(200)).
					done(function(v){
						eval(t.TEST("v === 100"));
						x.done();
					});
			}
		},
		{
			test: function test_adapter_resolve(t){
				var x = new FastDeferred(),
					a = when(x);
				a.done(function(v){ t.info("callback: " + v); return v; });
				t.info("resolving x");
				x.resolve("value");
			},
			logs: [
				"resolving x",
				"callback: value"
			]
		},
		{
			test: function test_adapter_reject(t){
				var x = new FastDeferred(),
					a = when(x);
				a.done(null, function(v){ t.info("errback: " + v); return v; });
				t.info("rejecting x");
				x.reject("value");
			},
			logs: [
				"rejecting x",
				"errback: value"
			]
		},
		function test_promisify(t){
			if(typeof define != "function"){
				// node.js in our case
				var promisify = require("../promisify"),
					x = t.startAsync("file-access"),
					fs = require("fs"),
					deferred = promisify(fs.stat, null, false, FastDeferred)("FastDeferred.js");
				deferred.done(
					function(stats){
						//t.info("fs.stat for FastDeferred.js: " + JSON.stringify(stats));
						x.done();
					},
					function(error){
						try{
							t.error("fs.stat for FastDeferred.js has failed");
						}finally{
							x.done();
						}
						return false;
					});
			}
		},
		{
			test: function test_when_value(t) {
				when("value").
					then(function(v){ t.info("callback 1: " + v); return v; }).
					done(function(v){ t.info("callback 2: " + v); });
			},
			logs: [
				"callback 1: value",
				"callback 2: value"
			]
		},
		{
			test: function test_when_promise(t) {
				var a = new FastDeferred();
				when(a).
					then(function(v){ t.info("callback 1: " + v); return v; }).
					done(function(v){ t.info("callback 2: " + v); });
				t.info("resolving a");
				a.resolve("value");
			},
			logs: [
				"resolving a",
				"callback 1: value",
				"callback 2: value"
			]
		},
		{
			test: function test_all_sync_success(t) {
				all(when("value"), undefined).
					done(function(v) { t.info( "callback: " + v.join(',') ); });
			},
			logs: [
				"callback: value,"
			]
		},
		{
			test: function test_all_success(t) {
				var a = new FastDeferred(),
					b = new FastDeferred();
				all(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v.join(',') ); });
				t.info( "resolving b" );
				b.resolve( "b" );
				t.info( "resolving a" );
				a.resolve( "a" );
			},
			logs: [
				"resolving b",
				"resolving a",
				"callback: a,b"
			]
		},
		{
			test: function test_all_failure1(t) {
				var a = new FastDeferred(function(v){ t.info( "cancelled a: " + v ); }),
					b = new FastDeferred();
				all(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v.join(',') ); },
						function(err) { t.info( "errback: " + err ); return err; });
				t.info( "rejecting b" );
				b.reject( "b" );
			},
			logs: [
				"rejecting b",
				"cancelled a: b",
				"errback: b"
			]
		},
		{
			test: function test_all_failure2(t) {
				var a = new FastDeferred(),
					b = new FastDeferred();
				all(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v.join(',') ); },
						function(err) { t.info( "errback: " + err ); return err; });
				t.info( "resolving a" );
				a.resolve( "a" );
				t.info( "rejecting b" );
				b.reject( "b" );
			},
			logs: [
				"resolving a",
				"rejecting b",
				"errback: b"
			]
		},
		{
			test: function test_all_cancel(t) {
				var a = new FastDeferred(function(v){ t.info( "cancelled a: " + v ); }),
					b = new FastDeferred(function(v){ t.info( "cancelled b: " + v ); }),
					c = all(a.promise, b.promise);

				c.done(function(v) { t.info( "callback: " + v.join(',') ); },
					function(err) { t.info( "errback: " + err ); return err; });

				t.info("resolving a");
				a.resolve("a");
				t.info("cancelling c");
				c.cancel( "c" );
			},
			logs: [
				"resolving a",
				"cancelling c",
				"cancelled b: c",
				"errback: c"
			]
		},
		{
			test: function test_all_inclusive(t) {
				var a = new FastDeferred(),
					b = new FastDeferred();
				par(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v.join(',') ); });
				t.info("rejecting a");
				a.reject("a");
				t.info("resolving b");
				b.resolve("b");
			},
			logs: [
				"rejecting a",
				"resolving b",
				"callback: a,b"
			]
		},
		{
			test: function test_all_inclusive_failure(t) {
				var a = new FastDeferred(),
					b = new FastDeferred();
				par(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v.join(',') ); },
						function(v) { t.info( "errback: " + v ); return v; });
				t.info("rejecting a");
				a.reject("a");
				t.info("rejecting b");
				b.reject("b");
			},
			logs: [
				"rejecting a",
				"rejecting b",
				"callback: a,b"
			]
		},
		{
			test: function test_any_sync_success(t) {
				any(when("value"), undefined).
					done(function(v) { t.info( "callback: " + v ); });
			},
			logs: [
				"callback: value"
			]
		},
		{
			test: function test_any_success(t) {
				var a = new FastDeferred(),
					b = new FastDeferred(function(v){ t.info( "cancelling b: " + v ); });
				any(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v ); });
				t.info("resolving a");
				a.resolve("a");
			},
			logs: [
				"resolving a",
				"callback: a",
				"cancelling b: [Error: not required]"
			]
		},
		{
			test: function test_any_failure1(t) {
				var a = new FastDeferred(),
					b = new FastDeferred();
				any(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v ); },
						function(err) { t.info( "errback: " + err ); return err; });
				t.info("rejecting b");
				b.reject("b");
				t.info("resolving a");
				a.resolve("a");
			},
			logs: [
				"rejecting b",
				"resolving a",
				"callback: a"
			]
		},
		{
			test: function test_any_failure2(t) {
				var a = new FastDeferred(),
					b = new FastDeferred();
				any(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v ); },
						function(err) { t.info( "errback: " + err ); return err; });
				t.info("rejecting a");
				a.reject("a");
				t.info("rejecting b");
				b.reject("b");
			},
			logs: [
				"rejecting a",
				"rejecting b",
				"errback: b"
			]
		},
		{
			test: function test_any_cancel(t) {
				var a = new FastDeferred(function(v){ t.info( "cancelled a: " + v ); }),
					b = new FastDeferred(function(v){ t.info( "cancelled b: " + v ); }),
					c = any(a.promise, b.promise);

				c.done(function(v) { t.info( "callback: " + v ); },
					function(err) { t.info( "errback: " + err ); return err; });

				t.info("rejecting a");
				a.reject("a");
				t.info("cancelling c");
				c.cancel("c");
			},
			logs: [
				"rejecting a",
				"cancelling c",
				"cancelled b: c",
				"errback: c"
			]
		},
		{
			test: function test_one_sync_success(t) {
				one(when("value"), undefined).
					done(function(v) { t.info( "callback: " + v ); });
			},
			logs: [
				"callback: value"
			]
		},
		{
			test: function test_one_success(t) {
				var a = new FastDeferred(),
					b = new FastDeferred( function(v){ t.info( "cancelling b: " + v ); } );
				one(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v ); });
				t.info("resolving a");
				a.resolve("a");
			},
			logs: [
				"resolving a",
				"callback: a",
				"cancelling b: [Error: not required]"
			]
		},
		{
			test: function test_one_failure1(t) {
				var a = new FastDeferred(function(v){ t.info( "cancelling a: " + v ); }),
					b = new FastDeferred();
				one(a.promise, b.promise).
					done(function(v) { t.info( "callback: " + v ); },
						function(err) { t.info( "errback: " + err ); return err; });
				t.info("rejecting b");
				b.reject("b");
			},
			logs: [
				"rejecting b",
				"cancelling a: b",
				"errback: b"
			]
		},
		{
			test: function test_one_failure2(t) {
				var a = new FastDeferred(function(v){ t.info( "cancelled a: " + v ); }),
					b = new FastDeferred(function(v){ t.info( "cancelled b: " + v ); }),
					c = one(a.promise, b.promise);

				c.done(function(v) { t.info( "callback: " + v ); },
					function(err) { t.info( "errback: " + err ); return err; });

				t.info("rejecting a");
				a.reject("a");
			},
			logs: [
				"rejecting a",
				"cancelled b: a",
				"errback: a"
			]
		},
		{
			test: function test_seq_resolve_ab(t){
				var a = seq([
						function(v){ t.info("callback 1: " + v); return b; },
						function(v){ t.info("callback 2: " + v); return v; }
					]),
					b = new FastDeferred();
				t.info("resolving a");
				a("value 1").done(function(v){ t.info("callback 3: " + v); });
				t.info("resolving b");
				b.resolve("value 2");
			},
			logs: [
				"resolving a",
				"callback 1: value 1",
				"resolving b",
				"callback 2: value 2",
				"callback 3: value 2"
			]
		},
		{
			test: function test_seq_resolve_ba(t){
				var a = seq([
						function(v){ t.info("callback 1: " + v); return b; },
						function(v){ t.info("callback 2: " + v); return v; }
					]),
					b = new FastDeferred();
				t.info("resolving b");
				b.resolve("value 2");
				t.info("resolving a");
				a("value 1").done(function(v){ t.info("callback 3: " + v); });
			},
			logs: [
				"resolving b",
				"resolving a",
				"callback 1: value 1",
				"callback 2: value 2",
				"callback 3: value 2"
			]
		},
		{
			timeout: 500,
			test: function test_whilst(t){
				var x = t.startAsync("async");
				whilst(
					function(i){ return FastDeferred.resolve(i < 5); },
					function(i){
						t.info("body: " + i);
						return FastDeferred.resolve(i + 1);
					}
				)(0).then(function(i){
					t.info("finish: " + i);
					x.done();
				});
			},
			logs: [
				"body: 0",
				"body: 1",
				"body: 2",
				"body: 3",
				"body: 4",
				"finish: 5"
			]
		},
		{
			timeout: 500,
			test: function test_whilst_no_body(t){
				var x = t.startAsync("async"), i = 0;
				whilst(
					function(){
						t.info("pred: " + i);
						++i;
						return FastDeferred.resolve(i < 5);
					}
				)(0).then(function(){
					t.info("finish");
					x.done();
				});
			},
			logs: [
				"pred: 0",
				"pred: 1",
				"pred: 2",
				"pred: 3",
				"pred: 4",
				"finish"
			]
		}
	]);

	return {};
});
