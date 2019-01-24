import Zoom from "./zoom/core";
import ByteArray from "./utils/ByteArray";
import HttpProvider from "./utils/HttpProvider";
import WsProvider from "./utils/WsProvider";
declare global {
    interface Window {
        ZoomMin: any;
    }
}
export { Zoom, ByteArray, HttpProvider, WsProvider };
