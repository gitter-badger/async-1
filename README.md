# Primitives for asynchronous execution [![Build Status](https://travis-ci.org/heya/async.png?branch=master)](https://travis-ci.org/heya/async)

Promises and operations over them; useful utility functions.

## How to install

If you plan to use it in your [node.js](http://nodejs.org) project install it
like this:

```
npm install heya-async
```

For your browser-based projects I suggest to use [volo.js](http://volojs.org):

```
volo install heya/async heya-async
```

## Documentation

* [Promise concept and implementation classes](docs/Promise.md)
* Promise algebra: [```all()```](docs/all.md), [```any()```](docs/any.md), [```par()```](docs/par.md), [```one()```](docs/one.md)
* [Timeouts](docs/timeout.md)
* [Adaptor for values and foreign promise implementations](docs/when.md)
* [Wrapper for node.js APIs](docs/promisify.md)

