
import ByteArray from "bytearray-node";

export default class Zoom {

    public cache: any;
    public calls: {} = {};
    public refcalls: {} = {};
    public binary: any = [];

    constructor() {

    }

    public buildCall( cache: any ) {
        this.cache = cache;
        this.groupCalls();
        this.buildCallReferences();
        this.generateBinaryCalls()
        // console.log(this.binary);
        return this.addZoomHeader( this.getBinaryCall() );
    }

    public addZoomHeader( data: string ): string {

        const bytes = new ByteArray( Buffer.alloc( 2 + 2 + 2 ) );
        // add version
        bytes.writeUnsignedShort( 1 );
        // add call num
        bytes.writeUnsignedShort( this.binary.length );
        // add expected return size
        bytes.writeUnsignedShort( this.getExpectedResultSizeInWords() );
        
        return bytes.toString("hex") + data;
    }

    public getBinaryCall(): string {
        
        // make sure to sort these by type and have type 1 first, as we need to index them
        // in order to use the results for addresses / other things

        let data = "";
        for( let i = 0; i < this.binary.length; i++) {
            data += this.binary[i].toString("hex");
        }
        return data;
    }

    public displayBinaryCalls(): void {
        for( let i = 0; i < this.binary.length; i++) {
            console.log( "call:", i, this.binary[i].toString("hex") );
        }
    }

    public getExpectedResultSizeInWords(): number {
        let len = 0;

        for (const key in this.cache) {
            if (this.cache.hasOwnProperty(key)) {
                len += this.cache[key].replace("0x","").length;
            }
        }
        return Math.ceil( ( len / 2 ) / 32 );
    }

    /*
    0x29e99f07
    0000000000000000000000000000000000000000000000000000000000000064
    0000000000000000000000000000000000000000000000000000000029e99f07

    - 1 byte uint8 call type ( 1 normal / 2 - to address is result of a previous call )
    00
    - 2 bytes uint16 call_data length
    0001 
    - 2 bytes uint16 result_id that holds our call's address
    0001
    - 2 bytes uint16 offset in bytes where the address starts in said result
    0000
    - 20 bytes address / or none if type 2
    0000000000000000000000000000000000000099 
    - 4 bytes method sha
    27285d5d 
    | call data
    0000000000000000000000000000000000000000000000000000000000000060
    00000000000000000000000000000000000000000000000000000000000000a0
    00000000000000000000000000000000000000000000000000000000000000e0
    0000000000000000000000000000000000000000000000000000000000000001
    3100000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000001
    3200000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000001
    3300000000000000000000000000000000000000000000000000000000000000

    */

    public generateBinaryCalls() {

        for (const key in this.refcalls) {
            if (this.refcalls.hasOwnProperty(key)) {
                const call = this.refcalls[key];

                for (let i = 0; i < call.values.length ; i++) {
                    const currentCall = call.values[i];
                    const callData = Buffer.from( this.removeZeroX( currentCall ), "hex" );

                    const packet = {
                        type: 1,
                        data_length: callData.length, 
                        result_id: 0,
                        offset: 0,
                        toAddress: Buffer.from( this.removeZeroX(key), "hex" ) , // key contains to address
                        data: callData,
                    }

                    // referenced calls
                    if( call.reference === true) {
                        packet.type = 2;
                        packet.toAddress = Buffer.from("");
                        packet.result_id = call.number.toString();
                        packet.offset = call.position.toString();
                    }

                    const bytes = new ByteArray( Buffer.alloc(8) );

                    bytes.writeByte(packet.type);
                    bytes.writeUnsignedShort(packet.data_length);
                    bytes.writeUnsignedShort(packet.result_id);
                    bytes.writeUnsignedShort(packet.offset);

                    // 1 empty byte
                    bytes.writeByte(0);

                    bytes.copyBytes(packet.toAddress, 0);
                    bytes.copyBytes(callData, 0);
                    this.binary.push( bytes );
                    console.log( packet );
                }
            }
        }
    }

    public parsePacket( bytes: Buffer ) {

        const packet = {
            type: 0,
            data_length: 0,
            result_id: 0,
            offset: 0,
            toAddress: "", // key contains to address
            data: "",
        }

        let offset = 0;
        packet.type = bytes.readInt8(offset);

        offset += 2;
        packet.data_length = bytes.readInt16BE(offset);

        offset += 2;
        packet.result_id = bytes.readInt16BE(offset);

        offset += 2;
        packet.offset = bytes.readInt16BE(offset);

        offset += 2;
        // packet.toAddress = bytes.readInt16BE(offset);

        

    }

    public removeZeroX(string: string): string {
        return string.replace("0x", "");
    }

    public toPaddedWord( num: string, size: number = 32): string {
        return this.addZeros(num, size);
    }

    public addZeros( num: string, size: number): string {
        let s = num + "";
        while (s.length < size) {
            s += "0";
        }
        return s;
    }


    public groupCalls() {

        for (const key in this.cache) {

            if (this.cache.hasOwnProperty(key)) {
                
                const parts = key.split("_");
                const toAddress = parts[0];
                const toCall = parts[1];
                
                if( !this.calls.hasOwnProperty(toAddress) ) {
                    this.calls[toAddress] = [];
                }

                this.calls[toAddress].push( toCall )
            }
        }

    }

    public buildCallReferences() {
        
        for (const key in this.calls) {
            if (this.calls.hasOwnProperty(key)) {

                const result = this.findToAddressInAResult(key);
                
                if(result.found === true) {
                    this.refcalls[key] = {
                        reference: result.found,
                        number: result.callNum,
                        position: result.bytePosition,
                        values: this.calls[key],
                    }
                } else {
                    this.refcalls[key] = {
                        reference: result.found,
                        values: this.calls[key],
                    }
                }
            }
        }
    }

    public findToAddressInAResult(to: string): any {

        // strip 0x from the address
        to = to.replace("0x","");

        const retval = {
            callNum: 0,
            bytePosition: 0,
            found: false,
        }

        let i = 0;
        for (const key in this.cache) {
            if (this.cache.hasOwnProperty(key)) {
                const value = this.cache[key];

                const position = value.indexOf(to);
                if(position !== -1) {
                    retval.callNum = i;
                    retval.bytePosition = ( position - 2 ) / 2; // adjust for 0x in result
                    retval.found = true;
                    return retval;
                }
                i++;
            }
        }

        return retval;
    }

};