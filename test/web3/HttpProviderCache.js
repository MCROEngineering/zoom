"use strict";
exports.__esModule = true;
// import { HttpProvider } from "../node_modules/web3/types";
var crypto_js_1 = require("crypto-js");
var errors = require('web3-core-helpers').errors;
var XHR2 = require('xhr2-cookies').XMLHttpRequest; // jshint ignore: line
var HttpProviderCache = /** @class */ (function () {
    function HttpProviderCache(host, options) {
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
    HttpProviderCache.prototype.useCache = function (val) {
        this.usecache = val;
    };
    HttpProviderCache.prototype.setCache = function (data) {
        this.cache = data;
    };
    HttpProviderCache.prototype._prepareRequest = function () {
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
    HttpProviderCache.prototype.send = function (payload, callback) {
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
    HttpProviderCache.prototype.fromCache = function (payload) {
        var cacheKey = this.getCacheKey(payload);
        console.log("fromCache", cacheKey, JSON.stringify(payload), JSON.stringify(this.cache[cacheKey]));
        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey]
        };
    };
    HttpProviderCache.prototype.fromCacheByKey = function (cacheKey, payload) {
        console.log("fromCacheByKey", cacheKey, JSON.stringify(payload), JSON.stringify(this.cache[cacheKey]));
        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey]
        };
    };
    HttpProviderCache.prototype.inCache = function (payload) {
        var cacheKey = this.getCacheKey(payload);
        console.log("inCache", cacheKey, JSON.stringify(payload));
        if (this.cache.hasOwnProperty(cacheKey)) {
            return true;
        }
        return false;
    };
    HttpProviderCache.prototype.inCacheByKey = function (cacheKey) {
        if (this.cache.hasOwnProperty(cacheKey)) {
            return true;
        }
        return false;
    };
    HttpProviderCache.prototype.toCache = function (payload, result) {
        var cacheKey = this.getCacheKey(payload);
        console.log("toCache", cacheKey, JSON.stringify(payload), JSON.stringify(result));
        this.cache[cacheKey] = result.result;
    };
    HttpProviderCache.prototype.getCacheKey = function (payload) {
        if (payload.length > 1) {
            var key = "batch_" + crypto_js_1["default"].MD5(JSON.stringify(payload));
            return key;
        }
        else {
            return crypto_js_1["default"].MD5(payload.params[0].to.toString().toLowerCase() + payload.params[0].data).toString();
        }
    };
    return HttpProviderCache;
}());
exports["default"] = HttpProviderCache;
