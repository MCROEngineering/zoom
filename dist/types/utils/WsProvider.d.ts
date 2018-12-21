export default class WsProvider {
    responseCallbacks: any;
    notificationCallbacks: any;
    customTimeout: any;
    connection: any;
    lastChunk: any;
    lastChunkTimeout: any;
    hits: number;
    requests: any;
    cache: {};
    private usecache;
    private savetocache;
    constructor(url?: any, options?: any);
    addDefaultEvents(): void;
    parseResponse(data: any): any;
    addResponseCallback(payload: any, callback: any): void;
    doTimeout(): void;
    send(payload: any, callback: any): void;
    on(type: any, callback: any): void;
    removeListener(type: any, callback: any): void;
    removeAllListeners(type: any): void;
    reset(): void;
    close(): void;
    saveToCache(val: boolean): void;
    useCache(val: boolean): void;
    /**
     * Enable request caching
     *
     * @param boolean
     */
    enableCache(setting: boolean): void;
    /**
     * Set caching object reference
     *
     * @param {object}
     */
    setCache(data: any): void;
    /**
     * Retrieve data from cache by payload
     *
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    fromCache(payload: any): {};
    /**
     * Retrieve data from cache by cache key
     *
     * @param cache key
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    fromCacheByKey(cacheKey: string, payload: any): {};
    /**
     * Check if payload has a cached result stored
     *
     * @param {payload} object
     * @returns boolean
     */
    inCache(payload: any): boolean;
    /**
     * Check if cacheKey has a cached result stored
     *
     * @param cache key
     * @returns boolean
     */
    inCacheByKey(cacheKey: string): boolean;
    /**
     * Save result in cache
     *
     * @param {payload} rpc call
     * @param {result} rpc result
     */
    toCache(payload: any, result: any): void;
    /**
     * Get cache key for payload - rpc call
     *
     * @param {payload} rpc call
     * @returns cache key string
     */
    getCacheKey(payload: any): string;
}
