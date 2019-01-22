"use strict";
/*

 * source       https://github.com/MCROEngineering/zoom/
 * @name        HttpProvider
 * @package     ZoomDev
 * @author      Micky Socaci <micky@mcro.tech>
 * @license     MIT
 
 based on https://github.com/ethereum/web3.js/blob/develop/lib/web3/httpprovider.js
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_js_1 = __importDefault(require("crypto-js"));
var errors = require('web3-core-helpers').errors;
var XHR2 = require('xhr2-cookies').XMLHttpRequest; // jshint ignore: line
var HttpProvider = /** @class */ (function () {
    function HttpProvider(host, options) {
        this.hits = 0;
        this.requests = [];
        this.connected = false;
        this.usecache = false;
        options = options || {};
        this.host = host || 'http://localhost:8545';
        this.timeout = options.timeout || 0;
        this.headers = options.headers;
        this.cache = {};
    }
    /**
     * Create and return a new XMLHttpRequest
     *
     * @returns {XMLHttpRequest}
     */
    HttpProvider.prototype._prepareRequest = function () {
        var request = new XHR2();
        request.open('POST', this.host, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.timeout = this.timeout && this.timeout !== 1 ? this.timeout : 0;
        request.withCredentials = true;
        if (this.headers) {
            this.headers.forEach(function (header) {
                request.setRequestHeader(header.name, header.value);
            });
        }
        return request;
    };
    /**
     * Should be used to make async request
     *
     * @method send
     * @param {Object} payload
     * @param {Function} callback triggered on end with (err, result)
     */
    HttpProvider.prototype.send = function (payload, callback) {
        var _this = this;
        this.requests.push(JSON.stringify(payload));
        this.hits++;
        if (this.usecache === true) {
            var cacheKey = this.getCacheKey(payload);
            if (this.inCacheByKey(cacheKey)) {
                callback(null, this.fromCacheByKey(cacheKey, payload));
                return;
            }
            else {
                /*
                if (payload[0] === undefined ) {
                    console.log("not in cache:", JSON.stringify(payload));
                }
                */
            }
        }
        var othis = this;
        var request = this._prepareRequest();
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.timeout !== 1) {
                var result = request.responseText;
                var error = null;
                try {
                    result = JSON.parse(result);
                }
                catch (e) {
                    error = errors.InvalidResponse(request.responseText);
                }
                if (_this.usecache === true) {
                    _this.toCache(payload, result);
                }
                othis.connected = true;
                callback(error, result);
            }
        };
        request.ontimeout = function () {
            othis.connected = false;
            callback(errors.ConnectionTimeout(_this.timeout));
        };
        try {
            request.send(JSON.stringify(payload));
        }
        catch (error) {
            this.connected = false;
            callback(errors.InvalidConnection(this.host));
        }
    };
    /**
     * Enable request caching
     *
     * @param boolean
     */
    HttpProvider.prototype.enableCache = function (setting) {
        this.usecache = setting;
    };
    /**
     * Set caching object reference
     *
     * @param {object}
     */
    HttpProvider.prototype.setCache = function (data) {
        this.cache = data;
    };
    /**
     * Retrieve data from cache by payload
     *
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    HttpProvider.prototype.fromCache = function (payload) {
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
    HttpProvider.prototype.fromCacheByKey = function (cacheKey, payload) {
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
    HttpProvider.prototype.inCache = function (payload) {
        var cacheKey = this.getCacheKey(payload);
        console.log("inCache", cacheKey, JSON.stringify(payload));
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
    HttpProvider.prototype.inCacheByKey = function (cacheKey) {
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
    HttpProvider.prototype.toCache = function (payload, result) {
        this.cache[this.getCacheKey(payload)] = result.result;
    };
    /**
     * Get cache key for payload - rpc call
     *
     * @param {payload} rpc call
     * @returns cache key string
     */
    HttpProvider.prototype.getCacheKey = function (payload) {
        var key;
        if (payload.length > 1) {
            key = "batch_" + crypto_js_1.default.MD5(JSON.stringify(payload));
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
    return HttpProvider;
}());
exports.default = HttpProvider;
//# sourceMappingURL=HttpProvider.js.map