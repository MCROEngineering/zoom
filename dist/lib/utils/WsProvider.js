"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require('underscore');
const errors = require('web3-core-helpers').errors;
let Ws = null;
let parseURL = null;
let myBtoa = null;
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
myBtoa = (str) => {
    return new Buffer(str).toString('base64');
};
const url = require('url');
if (url.URL) {
    // Use the new Node 6+ API for parsing URLs that supports username/password
    const newURL = url.URL;
    parseURL = (iurl) => {
        return new newURL(iurl);
    };
}
else {
    // Web3 supports Node.js 5, so fall back to the legacy URL API if necessary
    parseURL = require('url').parse;
}
// }
// Default connection ws://localhost:8546
class WsProvider {
    constructor(url, options) {
        this.hits = 0;
        this.requests = [];
        this.cache = {};
        this.usecache = false;
        this.savetocache = false;
        const othis = this;
        this.responseCallbacks = {};
        this.notificationCallbacks = [];
        options = options || {};
        this.customTimeout = options.timeout;
        // The w3cwebsocket implementation does not support Basic Auth
        // username/password in the URL. So generate the basic auth header, and
        // pass through with any additional headers supplied in constructor
        const parsedURL = parseURL(url);
        const headers = options.headers || {};
        const protocol = options.protocol || undefined;
        if (parsedURL.username && parsedURL.password) {
            headers.authorization = 'Basic ' + myBtoa(parsedURL.username + ':' + parsedURL.password);
        }
        this.connection = new Ws(url, protocol, undefined, headers);
        this.addDefaultEvents();
        // LISTEN FOR CONNECTION RESPONSES
        this.connection.onmessage = (e) => {
            /*jshint maxcomplexity: 6 */
            const data = (typeof e.data === 'string') ? e.data : '';
            othis.parseResponse(data).forEach((result) => {
                let id = null;
                // get the id which matches the returned id
                if (_.isArray(result)) {
                    result.forEach((load) => {
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
                    othis.notificationCallbacks.forEach((callback) => {
                        if (_.isFunction(callback)) {
                            callback(result);
                        }
                    });
                    // fire the callback
                }
                else if (othis.responseCallbacks[id]) {
                    if (this.usecache === true || this.savetocache === true) {
                        this.toCache(othis.responseCallbacks[id].payload, result);
                    }
                    othis.responseCallbacks[id](null, result);
                    delete othis.responseCallbacks[id];
                }
            });
        };
        // make property `connected` which will return the current connection status
        Object.defineProperty(this, 'connected', {
            get: () => {
                return this.connection && this.connection.readyState === this.connection.OPEN;
            },
            enumerable: true,
        });
    }
    /*
        Will add the error and end event to timeout existing calls
        @method addDefaultEvents
    */
    addDefaultEvents() {
        const othis = this;
        this.connection.onerror = () => {
            othis.doTimeout();
        };
        this.connection.onclose = () => {
            othis.doTimeout();
            // reset all requests and callbacks
            othis.reset();
        };
        // this.connection.on('timeout', function(){
        //     _this.doTimeout();
        // });
    }
    /*
     Will parse the response and make an array out of it.
     @method _parseResponse
     @param {String} data
     */
    parseResponse(data) {
        const othis = this;
        const returnValues = [];
        // DE-CHUNKER
        const dechunkedData = data
            .replace(/\}[\n\r]?\{/g, '}|--|{') // }{
            .replace(/\}\][\n\r]?\[\{/g, '}]|--|[{') // }][{
            .replace(/\}[\n\r]?\[\{/g, '}|--|[{') // }[{
            .replace(/\}\][\n\r]?\{/g, '}]|--|{') // }]{
            .split('|--|');
        dechunkedData.forEach((idata) => {
            // prepend the last chunk
            if (othis.lastChunk) {
                idata = othis.lastChunk + idata;
            }
            let result = null;
            try {
                result = JSON.parse(idata);
            }
            catch (e) {
                othis.lastChunk = idata;
                // start timeout to cancel all requests
                clearTimeout(othis.lastChunkTimeout);
                othis.lastChunkTimeout = setTimeout(() => {
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
    }
    /*
        Adds a callback to the responseCallbacks object,
        which will be called if a response matching the response Id will arrive.
        @method _addResponseCallback
     */
    addResponseCallback(payload, callback) {
        const id = payload.id || payload[0].id;
        const method = payload.method || payload[0].method;
        this.responseCallbacks[id] = callback;
        this.responseCallbacks[id].method = method;
        this.responseCallbacks[id].payload = payload;
        const othis = this;
        // schedule triggering the error response if a custom timeout is set
        if (this.customTimeout) {
            setTimeout(() => {
                if (othis.responseCallbacks[id]) {
                    othis.responseCallbacks[id](errors.ConnectionTimeout(othis.customTimeout));
                    delete othis.responseCallbacks[id];
                }
            }, this.customTimeout);
        }
    }
    /*
        Timeout all requests when the end/error event is fired
        @method doTimeout
     */
    doTimeout() {
        for (const key in this.responseCallbacks) {
            if (this.responseCallbacks.hasOwnProperty(key)) {
                this.responseCallbacks[key](errors.InvalidConnection('on WS'));
                delete this.responseCallbacks[key];
            }
        }
    }
    send(payload, callback) {
        this.hits++;
        if (this.usecache === true) {
            const cacheKey = this.getCacheKey(payload);
            if (this.inCacheByKey(cacheKey)) {
                callback(null, this.fromCacheByKey(cacheKey, payload));
                return;
            }
        }
        const othis = this;
        if (this.connection.readyState === this.connection.CONNECTING) {
            setTimeout(() => {
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
    }
    /*
        Subscribes to provider events.provider

        @method on
        @param {String} type    'notifcation', 'connect', 'error', 'end' or 'data'
        @param {Function} callback   the callback to call
    */
    on(type, callback) {
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
    }
    // TODO add once
    /*
        Removes event listener

        @method removeListener
        @param {String} type    'notifcation', 'connect', 'error', 'end' or 'data'
        @param {Function} callback   the callback to call
    */
    removeListener(type, callback) {
        const othis = this;
        switch (type) {
            case 'data':
                this.notificationCallbacks.forEach((cb, index) => {
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
    }
    /*
        Removes all event listeners

        @method removeAllListeners
        @param {String} type    'notifcation', 'connect', 'error', 'end' or 'data'
     */
    removeAllListeners(type) {
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
    }
    /*
        Resets the providers, clears all callbacks

        @method reset
    */
    reset() {
        this.doTimeout();
        this.notificationCallbacks = [];
        // this.connection.removeAllListeners('error');
        // this.connection.removeAllListeners('end');
        // this.connection.removeAllListeners('timeout');
        this.addDefaultEvents();
    }
    close() {
        this.connection.close();
    }
    saveToCache(val) {
        this.savetocache = val;
    }
    useCache(val) {
        this.usecache = val;
    }
    /**
     * Enable request caching
     *
     * @param boolean
     */
    enableCache(setting) {
        this.usecache = setting;
    }
    /**
     * Set caching object reference
     *
     * @param {object}
     */
    setCache(data) {
        this.cache = data;
    }
    /**
     * Retrieve data from cache by payload
     *
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    fromCache(payload) {
        const cacheKey = this.getCacheKey(payload);
        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey],
        };
    }
    /**
     * Retrieve data from cache by cache key
     *
     * @param cache key
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    fromCacheByKey(cacheKey, payload) {
        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey],
        };
    }
    /**
     * Check if payload has a cached result stored
     *
     * @param {payload} object
     * @returns boolean
     */
    inCache(payload) {
        const cacheKey = this.getCacheKey(payload);
        if (this.cache.hasOwnProperty(cacheKey)) {
            return true;
        }
        return false;
    }
    /**
     * Check if cacheKey has a cached result stored
     *
     * @param cache key
     * @returns boolean
     */
    inCacheByKey(cacheKey) {
        if (this.cache.hasOwnProperty(cacheKey)) {
            return true;
        }
        return false;
    }
    /**
     * Save result in cache
     *
     * @param {payload} rpc call
     * @param {result} rpc result
     */
    toCache(payload, result) {
        this.cache[this.getCacheKey(payload)] = result.result;
    }
    /**
     * Get cache key for payload - rpc call
     *
     * @param {payload} rpc call
     * @returns cache key string
     */
    getCacheKey(payload) {
        let key;
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
    }
}
exports.default = WsProvider;
//# sourceMappingURL=WsProvider.js.map