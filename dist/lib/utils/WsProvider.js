"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var errors = require('web3-core-helpers').errors;
var Ws = null;
var parseURL = null;
var myBtoa = null;
// @ts-ignore: WebSocket
/*
if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
    // @ts-ignore: WebSocket
    Ws = window.WebSocket;
    myBtoa = btoa;
    parseURL = (iurl: any) => {
        return new URL(iurl);
    };
} else {
*/
Ws = require('websocket').w3cwebsocket;
myBtoa = function (str) {
    return new Buffer(str).toString('base64');
};
var url = require('url');
if (url.URL) {
    // Use the new Node 6+ API for parsing URLs that supports username/password
    var newURL_1 = url.URL;
    parseURL = function (iurl) {
        return new newURL_1(iurl);
    };
}
else {
    // Web3 supports Node.js 5, so fall back to the legacy URL API if necessary
    parseURL = require('url').parse;
}
// }
// Default connection ws://localhost:8546
var WsProvider = /** @class */ (function () {
    function WsProvider(url, options) {
        var _this = this;
        this.hits = 0;
        this.requests = [];
        this.cache = {};
        this.usecache = false;
        this.savetocache = false;
        var othis = this;
        this.responseCallbacks = {};
        this.notificationCallbacks = [];
        options = options || {};
        this.customTimeout = options.timeout;
        // The w3cwebsocket implementation does not support Basic Auth
        // username/password in the URL. So generate the basic auth header, and
        // pass through with any additional headers supplied in constructor
        var parsedURL = parseURL(url);
        var headers = options.headers || {};
        var protocol = options.protocol || undefined;
        if (parsedURL.username && parsedURL.password) {
            headers.authorization = 'Basic ' + myBtoa(parsedURL.username + ':' + parsedURL.password);
        }
        this.connection = new Ws(url, protocol, undefined, headers);
        this.addDefaultEvents();
        // LISTEN FOR CONNECTION RESPONSES
        this.connection.onmessage = function (e) {
            /*jshint maxcomplexity: 6 */
            var data = (typeof e.data === 'string') ? e.data : '';
            othis.parseResponse(data).forEach(function (result) {
                var id = null;
                // get the id which matches the returned id
                if (_.isArray(result)) {
                    result.forEach(function (load) {
                        if (othis.responseCallbacks[load.id]) {
                            id = load.id;
                        }
                    });
                }
                else {
                    id = result.id;
                }
                // notification
                if (!id && result.method.indexOf('_subscription') !== -1) {
                    othis.notificationCallbacks.forEach(function (callback) {
                        if (_.isFunction(callback)) {
                            callback(result);
                        }
                    });
                    // fire the callback
                }
                else if (othis.responseCallbacks[id]) {
                    if (_this.usecache === true || _this.savetocache === true) {
                        _this.toCache(othis.responseCallbacks[id].payload, result);
                    }
                    othis.responseCallbacks[id](null, result);
                    delete othis.responseCallbacks[id];
                }
            });
        };
        // make property `connected` which will return the current connection status
        Object.defineProperty(this, 'connected', {
            get: function () {
                return _this.connection && _this.connection.readyState === _this.connection.OPEN;
            },
            enumerable: true,
        });
    }
    /*
        Will add the error and end event to timeout existing calls
        @method addDefaultEvents
    */
    WsProvider.prototype.addDefaultEvents = function () {
        var othis = this;
        this.connection.onerror = function () {
            othis.doTimeout();
        };
        this.connection.onclose = function () {
            othis.doTimeout();
            // reset all requests and callbacks
            othis.reset();
        };
        // this.connection.on('timeout', function(){
        //     _this.doTimeout();
        // });
    };
    /*
     Will parse the response and make an array out of it.
     @method _parseResponse
     @param {String} data
     */
    WsProvider.prototype.parseResponse = function (data) {
        var othis = this;
        var returnValues = [];
        // DE-CHUNKER
        var dechunkedData = data
            .replace(/\}[\n\r]?\{/g, '}|--|{') // }{
            .replace(/\}\][\n\r]?\[\{/g, '}]|--|[{') // }][{
            .replace(/\}[\n\r]?\[\{/g, '}|--|[{') // }[{
            .replace(/\}\][\n\r]?\{/g, '}]|--|{') // }]{
            .split('|--|');
        dechunkedData.forEach(function (idata) {
            // prepend the last chunk
            if (othis.lastChunk) {
                idata = othis.lastChunk + idata;
            }
            var result = null;
            try {
                result = JSON.parse(idata);
            }
            catch (e) {
                othis.lastChunk = idata;
                // start timeout to cancel all requests
                clearTimeout(othis.lastChunkTimeout);
                othis.lastChunkTimeout = setTimeout(function () {
                    othis.doTimeout();
                    throw errors.InvalidResponse(idata);
                }, 1000 * 15);
                return;
            }
            // cancel timeout and set chunk to null
            clearTimeout(othis.lastChunkTimeout);
            othis.lastChunk = null;
            if (result) {
                returnValues.push(result);
            }
        });
        return returnValues;
    };
    /*
        Adds a callback to the responseCallbacks object,
        which will be called if a response matching the response Id will arrive.
        @method _addResponseCallback
     */
    WsProvider.prototype.addResponseCallback = function (payload, callback) {
        var id = payload.id || payload[0].id;
        var method = payload.method || payload[0].method;
        this.responseCallbacks[id] = callback;
        this.responseCallbacks[id].method = method;
        this.responseCallbacks[id].payload = payload;
        var othis = this;
        // schedule triggering the error response if a custom timeout is set
        if (this.customTimeout) {
            setTimeout(function () {
                if (othis.responseCallbacks[id]) {
                    othis.responseCallbacks[id](errors.ConnectionTimeout(othis.customTimeout));
                    delete othis.responseCallbacks[id];
                }
            }, this.customTimeout);
        }
    };
    /*
        Timeout all requests when the end/error event is fired
        @method doTimeout
     */
    WsProvider.prototype.doTimeout = function () {
        for (var key in this.responseCallbacks) {
            if (this.responseCallbacks.hasOwnProperty(key)) {
                this.responseCallbacks[key](errors.InvalidConnection('on WS'));
                delete this.responseCallbacks[key];
            }
        }
    };
    WsProvider.prototype.send = function (payload, callback) {
        this.hits++;
        if (this.usecache === true) {
            var cacheKey = this.getCacheKey(payload);
            if (this.inCacheByKey(cacheKey)) {
                callback(null, this.fromCacheByKey(cacheKey, payload));
                return;
            }
        }
        var othis = this;
        if (this.connection.readyState === this.connection.CONNECTING) {
            setTimeout(function () {
                othis.send(payload, callback);
            }, 10);
            return;
        }
        // try reconnect, when connection is gone
        // if(!this.connection.writable)
        //     this.connection.connect({url: this.url});
        if (this.connection.readyState !== this.connection.OPEN) {
            console.error('connection not open on send()');
            if (typeof this.connection.onerror === 'function') {
                this.connection.onerror(new Error('connection not open'));
            }
            else {
                console.error('no error callback');
            }
            callback(new Error('connection not open'));
            return;
        }
        this.connection.send(JSON.stringify(payload));
        this.addResponseCallback(payload, callback);
    };
    /*
        Subscribes to provider events.provider

        @method on
        @param {String} type    'notifcation', 'connect', 'error', 'end' or 'data'
        @param {Function} callback   the callback to call
    */
    WsProvider.prototype.on = function (type, callback) {
        if (typeof callback !== 'function') {
            throw new Error('The second parameter callback must be a function.');
        }
        switch (type) {
            case 'data':
                this.notificationCallbacks.push(callback);
                break;
            case 'connect':
                this.connection.onopen = callback;
                break;
            case 'end':
                this.connection.onclose = callback;
                break;
            case 'error':
                this.connection.onerror = callback;
                break;
            // default:
            //     this.connection.on(type, callback);
            //     break;
        }
    };
    // TODO add once
    /*
        Removes event listener

        @method removeListener
        @param {String} type    'notifcation', 'connect', 'error', 'end' or 'data'
        @param {Function} callback   the callback to call
    */
    WsProvider.prototype.removeListener = function (type, callback) {
        var othis = this;
        switch (type) {
            case 'data':
                this.notificationCallbacks.forEach(function (cb, index) {
                    if (cb === callback) {
                        othis.notificationCallbacks.splice(index, 1);
                    }
                });
                break;
            // TODO remvoving connect missing
            // default:
            //     this.connection.removeListener(type, callback);
            //     break;
        }
    };
    /*
        Removes all event listeners

        @method removeAllListeners
        @param {String} type    'notifcation', 'connect', 'error', 'end' or 'data'
     */
    WsProvider.prototype.removeAllListeners = function (type) {
        switch (type) {
            case 'data':
                this.notificationCallbacks = [];
                break;
            // TODO remvoving connect properly missing
            case 'connect':
                this.connection.onopen = null;
                break;
            case 'end':
                this.connection.onclose = null;
                break;
            case 'error':
                this.connection.onerror = null;
                break;
            default:
                // this.connection.removeAllListeners(type);
                break;
        }
    };
    /*
        Resets the providers, clears all callbacks

        @method reset
    */
    WsProvider.prototype.reset = function () {
        this.doTimeout();
        this.notificationCallbacks = [];
        // this.connection.removeAllListeners('error');
        // this.connection.removeAllListeners('end');
        // this.connection.removeAllListeners('timeout');
        this.addDefaultEvents();
    };
    WsProvider.prototype.close = function () {
        this.connection.close();
    };
    WsProvider.prototype.saveToCache = function (val) {
        this.savetocache = val;
    };
    WsProvider.prototype.useCache = function (val) {
        this.usecache = val;
    };
    /**
     * Enable request caching
     *
     * @param boolean
     */
    WsProvider.prototype.enableCache = function (setting) {
        this.usecache = setting;
    };
    /**
     * Set caching object reference
     *
     * @param {object}
     */
    WsProvider.prototype.setCache = function (data) {
        this.cache = data;
    };
    /**
     * Retrieve data from cache by payload
     *
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    WsProvider.prototype.fromCache = function (payload) {
        var cacheKey = this.getCacheKey(payload);
        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey],
        };
    };
    /**
     * Retrieve data from cache by cache key
     *
     * @param cache key
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    WsProvider.prototype.fromCacheByKey = function (cacheKey, payload) {
        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey],
        };
    };
    /**
     * Check if payload has a cached result stored
     *
     * @param {payload} object
     * @returns boolean
     */
    WsProvider.prototype.inCache = function (payload) {
        var cacheKey = this.getCacheKey(payload);
        if (this.cache.hasOwnProperty(cacheKey)) {
            return true;
        }
        return false;
    };
    /**
     * Check if cacheKey has a cached result stored
     *
     * @param cache key
     * @returns boolean
     */
    WsProvider.prototype.inCacheByKey = function (cacheKey) {
        if (this.cache.hasOwnProperty(cacheKey)) {
            return true;
        }
        return false;
    };
    /**
     * Save result in cache
     *
     * @param {payload} rpc call
     * @param {result} rpc result
     */
    WsProvider.prototype.toCache = function (payload, result) {
        this.cache[this.getCacheKey(payload)] = result.result;
    };
    /**
     * Get cache key for payload - rpc call
     *
     * @param {payload} rpc call
     * @returns cache key string
     */
    WsProvider.prototype.getCacheKey = function (payload) {
        var key;
        if (payload.length > 1) {
            // key = "batch_" + CryptoJS.MD5(JSON.stringify(payload));
        }
        else {
            if (payload.method === "eth_call") {
                /*
                return crypto_js_1.MD5(
                    payload.params[0].to.toString().toLowerCase()
                    + payload.params[0].data
                ).toString();
                */
                key = payload.params[0].to + "_" + payload.params[0].data;
            }
        }
        return key;
    };
    return WsProvider;
}());
exports.default = WsProvider;
//# sourceMappingURL=WsProvider.js.map