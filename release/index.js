"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * NES模拟器.
 */
var ANesEmu = /** @class */ (function () {
    /**
     * [二进制文件] 图像.
     */
    //[Embed(source = "../ui.swf", mimeType = "application/octet-stream")]
    //public static UiBin: Class;
    /**
     * 外观.
     */
    //public static ui: UI;
    /**
     * 属性.
    public static output: TextField = new TextField;
    private binLoader: URLLoader;
    private tracker: Loader;
    private romUrl: String;
     */
    /**
     * Constructor.
     */
    function ANesEmu() {
        /**
         * Stats.
         */
        this._stats = null;
        /**
         * TV.
         */
        this.TV = null;
        /**
         * the image data bind of TV
         */
        this.TVD = null;
        /**
         * Virtual Machine
         */
        this.vm = null;
        this.showPerformance();
        this.loadRomFromUrl('index.rom', this.onLoadROM.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        window.requestAnimationFrame(this.onFrame.bind(this));
        document.onpointerdown = function () {
            if (this._ctxAudio == null) {
                this._ctxAudio = new window.AudioContext();
                var asp = this._ctxAudio.createScriptProcessor(2048, 0, 2);
                asp.onaudioprocess = this.onSample.bind(this);
                asp.connect(this._ctxAudio.destination);
            }
        }.bind(this);
        /*
        // 3.加载ROM
        romUrl = this.loaderInfo.parameters.romUrl || 'default.txt';
        binLoader = new URLLoader;
        binLoader.dataFormat = URLLoaderDataFormat.BINARY;
        binLoader.addEventListener(Event.COMPLETE, onCompleteBin);
        binLoader.addEventListener(ProgressEvent.PROGRESS, onLoadingBin);
        binLoader.addEventListener(IOErrorEvent.IO_ERROR, onErrorBin);
        binLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onErrorBin);
        binLoader.load(new URLRequest(romUrl));
        // 4.加载UI
        uiLoader: Loader = new Loader;
        uiLoader.loadBytes(new UiBin);
        uiLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, onCompleteUI);
        addChild(uiLoader);
        */
    }
    /**
     * Load ROM from url.
     */
    ANesEmu.prototype.loadRomFromUrl = function (url, onload) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    onload(xhr.response);
                }
                else {
                    console.log(xhr.responseText);
                    alert('[LOAD ROM FAIL] ' + xhr.responseText);
                }
            }
        };
        xhr.send();
    };
    ;
    /**
     * @private
     */
    ANesEmu.prototype.onLoadROM = function (bytes) {
        this._rom = bytes;
        // init TV
        var canvas = document.getElementById('myCanvas');
        this._ctxGraph = canvas.getContext('2d');
        this.TV = canvas;
        this.TVD = this._ctxGraph.createImageData(canvas.width, canvas.height);
        // replay game
        this.replay();
    };
    /**
     * Replay.
     */
    ANesEmu.prototype.replay = function () {
        if (this.vm) {
            this.vm.shut();
        }
        // 1.create VM
        this.vm = new anes.VM();
        // 2.connect TV
        this.vm.connect(this.TVD);
        // 3.insert cartridge
        this.vm.insertCartridge(this._rom);
        // 连接手柄
        this.vm.insertJoypay();
    };
    /**
     * @private
     */
    ANesEmu.prototype.onFrame = function () {
        if (this._stats != null) {
            this._stats.begin();
        }
        if (this.TV != null && this.TVD != null) {
            this._ctxGraph.putImageData(this.TVD, 0, 0);
        }
        if (this.vm != null) {
            this.vm.renderFrame();
        }
        if (this._stats != null) {
            this._stats.end();
        }
        window.requestAnimationFrame(this.onFrame.bind(this));
    };
    /**
     * @private
     */
    ANesEmu.prototype.onSample = function (e) {
        if (this.vm != null) {
            this.vm.renderSample(e.outputBuffer);
        }
    };
    /**
     * Show performance.
     */
    ANesEmu.prototype.showPerformance = function () {
        if (!window.Stats) {
            return;
        }
        this._stats = new Stats();
        this._stats.showPanel(0); /* 0: fps, 1: ms, 2: mb, 3+: custom */
        document.body.appendChild(this._stats.dom);
    };
    /**
     * @private
     */
    ANesEmu.prototype.onKeyDown = function (e) {
        if (this.vm != null) {
            this.vm.onKeyDown(e.keyCode);
        }
    };
    /**
     * @private
     */
    ANesEmu.prototype.onKeyUp = function (e) {
        if (this.vm != null) {
            this.vm.onKeyUp(e.keyCode);
        }
    };
    return ANesEmu;
}());
//debugger;
var ANewEmu = new ANesEmu();
var anes;
(function (anes) {
    /**
     * Node.
     */
    var Node = /** @class */ (function () {
        function Node() {
        }
        return Node;
    }());
    anes.Node = Node;
})(anes || (anes = {}));
/// <reference path="Node.ts" />
var anes;
(function (anes) {
    /**
     * APU.
     */
    var APU = /** @class */ (function (_super) {
        __extends(APU, _super);
        /**
         * Constructor.
         */
        function APU(bus) {
            var _this = _super.call(this) || this;
            /**
             * Sample.
             */
            _this.samples = new Array();
            _this.sampleBuffer = new Float32Array(2048 * 128);
            _this.sampleReadPos = 0;
            _this.sampleWritePos = 0;
            _this.chR = [new RECTANGLE(), new RECTANGLE()];
            _this.chT = new TRIANGLE();
            _this.chN = new NOISE();
            _this.chD = new DPCM();
            _this.vblLength = new Int32Array([5, 127, 10, 1, 19, 2, 40, 3, 80, 4, 30, 5, 7, 6, 13, 7, 6, 8, 12, 9, 24, 10, 48, 11, 96, 12, 36, 13, 8, 14, 16, 15]);
            _this.freqLimit = new Int32Array([0x03FF, 0x0555, 0x0666, 0x071C, 0x0787, 0x07C1, 0x07E0, 0x07F0]);
            _this.dutyLut = new Int32Array([2, 4, 8, 12]);
            _this.noiseFreq = new Int32Array([4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068]);
            _this.dpcmCycles = new Int32Array([428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 85, 72, 54]);
            _this.reg4015 = 0;
            _this.sync_reg4015 = 0;
            _this.elapsedTime = 0;
            _this.frameCycles = 0;
            _this.samplingRate = 22050;
            _this.bus = bus;
            _this.bus = bus;
            _this.cycleRate = (anes.CPU.frequency * 65536 / _this.samplingRate);
            return _this;
        }
        /**
         * Reset.
         */
        APU.prototype.reset = function () {
        };
        /**
         * Read data.
         */
        APU.prototype.r = function (addr) {
            var data = 0;
            if (addr == 0x4017) {
                data |= (1 << 6);
            }
            return data;
        };
        /**
         * Write data.
         */
        APU.prototype.w = function (addr, data) {
            if (addr >= 0x4000 && addr <= 0x401F) {
                this.virtualWrite(addr, data);
                // add samples
                var s = new SAMPLE;
                s.time = this.bus.cpu.execedCC;
                s.addr = addr;
                s.data = data;
                this.samples.push(s);
            }
        };
        /**
         * Shift sample.
         */
        APU.prototype.shiftSample = function (writetime) {
            if (this.samples.length == 0) {
                return null;
            }
            var q = this.samples[0];
            if (q.time <= writetime) {
                this.samples.shift();
                return q;
            }
            return null;
        };
        /**
         * Push samples to output.
         */
        APU.prototype.pushSamplesTo = function (output) {
            var onceSamples = 2048;
            var bodySize = this.sampleWritePos;
            var availableSize = bodySize - this.sampleReadPos;
            if (availableSize < onceSamples) {
                // fill empty
                for (var ch = 0; ch < output.numberOfChannels; ch++) {
                    var outputData = output.getChannelData(ch);
                    for (var i = 0; i < onceSamples; i++) {
                        outputData[i] = 0;
                    }
                    return;
                }
            }
            // 1.gen samples
            var outputSamples = new Float32Array(this.sampleBuffer.buffer, this.sampleReadPos * 4, onceSamples);
            for (var ch = 0; ch < output.numberOfChannels; ch++) {
                var outputData = output.getChannelData(ch);
                outputData.set(outputSamples);
            }
            // 2.update offset
            this.sampleReadPos += onceSamples;
            // 3.clear buffer
            if (bodySize >= 2048 * 128 / 2) {
                var sliceLen = bodySize - this.sampleReadPos;
                this.sampleBuffer.copyWithin(0, this.sampleReadPos, bodySize);
                this.sampleReadPos = 0;
                this.sampleWritePos = sliceLen;
            }
        };
        /**
         * Render samples.
         */
        APU.prototype.renderSamples = function (size) {
            var output;
            var writeTime = 0;
            var s;
            var addr;
            var data;
            var vol = new Uint32Array(24);
            vol[0] = 0x0F0;
            vol[1] = 0x0F0;
            vol[2] = 0x130;
            vol[3] = 0x0C0;
            vol[4] = 0x0F0;
            // flush all samples
            if (this.elapsedTime > this.bus.cpu.execedCC) {
                while (this.samples.length) {
                    s = this.samples.shift();
                    // write data
                    addr = s.addr;
                    data = s.data;
                    if (addr >= 0x4000 && addr <= 0x401F) {
                        this.realWrite(addr, data);
                    }
                }
            }
            // flush each sample
            while (size--) {
                writeTime = this.elapsedTime;
                for (;;) {
                    s = this.shiftSample(writeTime);
                    if (s == null) {
                        break;
                    }
                    // write data
                    addr = s.addr;
                    data = s.data;
                    if (addr >= 0x4000 && addr <= 0x401F) {
                        this.realWrite(addr, data);
                    }
                }
                // merge rendering results
                output = 0;
                output += this.renderRectangle(this.chR[0]) * vol[0];
                output += this.renderRectangle(this.chR[1]) * vol[1];
                output += this.renderTriangle() * vol[2];
                output += this.renderNoise() * vol[3];
                output += this.renderDPCM() * vol[4];
                output >>= 8;
                if (output > 0x7FFF) {
                    output = 0x7FFF;
                }
                else if (output < -0x8000) {
                    output = -0x8000;
                }
                output /= 2;
                // write sample to buffer
                var multiplier = 1 / 32768;
                var sample = output * multiplier * 5;
                this.sampleBuffer[this.sampleWritePos] = sample;
                this.sampleWritePos++;
                this.sampleWritePos %= 2048 * 128;
                // sum time
                //elapsedTime += 6.764063492063492;
                this.elapsedTime += 81.168820;
            }
            // sync time
            this.elapsedTime = this.bus.cpu.execedCC;
        };
        /**
         * Real write data.
         */
        APU.prototype.realWrite = function (addr, data) {
            var no;
            var ch;
            if (addr >= 0x4000 && addr <= 0x401F) {
                switch (addr) {
                    case 0x4000:
                    case 0x4001:
                    case 0x4002:
                    case 0x4003:
                    case 0x4004:
                    case 0x4005:
                    case 0x4006:
                    case 0x4007:
                        // WriteRectangle
                        no = (addr < 0x4004) ? 0 : 1;
                        ch = this.chR[no];
                        ch.reg[addr & 3] = data;
                        switch (addr & 3) {
                            case 0:
                                ch.holdnote = data & 0x20;
                                ch.volume = data & 0x0F;
                                ch.env_fixed = data & 0x10;
                                ch.env_decay = (data & 0x0F) + 1;
                                ch.duty = this.dutyLut[data >> 6];
                                break;
                            case 1:
                                ch.swp_on = data & 0x80;
                                ch.swp_inc = data & 0x08;
                                ch.swp_shift = data & 0x07;
                                ch.swp_decay = ((data >> 4) & 0x07) + 1;
                                ch.freqlimit = this.freqLimit[data & 0x07];
                                break;
                            case 2:
                                ch.freq = (ch.freq & (~0xFF)) + data;
                                break;
                            case 3:
                                ch.freq = ((data & 0x07) << 8) + (ch.freq & 0xFF);
                                ch.len_count = this.vblLength[data >> 3] * 2;
                                ch.env_vol = 0x0F;
                                ch.env_count = ch.env_decay + 1;
                                ch.adder = 0;
                                if (this.reg4015 & (1 << no)) {
                                    ch.enable = 0xFF;
                                }
                                break;
                        }
                        break;
                    case 0x4008:
                    case 0x4009:
                    case 0x400A:
                    case 0x400B:
                        // WriteTriangle
                        this.chT.reg[addr & 3] = data;
                        switch (addr & 3) {
                            case 0:
                                this.chT.holdnote = data & 0x80;
                                break;
                            case 1:
                                break;
                            case 2:
                                this.chT.freq = ((((this.chT.reg[3] & 0x07) << 8) + data + 1)) << 16;
                                break;
                            case 3:
                                this.chT.freq = ((((data & 0x07) << 8) + this.chT.reg[2] + 1)) << 16;
                                this.chT.len_count = this.vblLength[data >> 3] * 2;
                                this.chT.counter_start = 0x80;
                                if (this.reg4015 & (1 << 2)) {
                                    this.chT.enable = 0xFF;
                                }
                                break;
                        }
                        break;
                    case 0x400C:
                    case 0x400D:
                    case 0x400E:
                    case 0x400F:
                        // WriteNoise
                        this.chN.reg[addr & 3] = data;
                        switch (addr & 3) {
                            case 0:
                                this.chN.holdnote = data & 0x20;
                                this.chN.volume = data & 0x0F;
                                this.chN.env_fixed = data & 0x10;
                                this.chN.env_decay = (data & 0x0F) + 1;
                                break;
                            case 1:
                                break;
                            case 2:
                                this.chN.freq = (this.noiseFreq[data & 0x0F]) << 16;
                                this.chN.xor_tap = (data & 0x80) ? 0x40 : 0x02;
                                break;
                            case 3:
                                this.chN.len_count = this.vblLength[data >> 3] * 2;
                                this.chN.env_vol = 0x0F;
                                this.chN.env_count = this.chN.env_decay + 1;
                                if (this.reg4015 & (1 << 3)) {
                                    this.chN.enable = 0xFF;
                                }
                                break;
                        }
                        break;
                    case 0x4010:
                    case 0x4011:
                    case 0x4012:
                    case 0x4013:
                        // WriteDPCM
                        this.chD.reg[addr & 3] = data;
                        switch (addr & 3) {
                            case 0:
                                this.chD.freq = (this.dpcmCycles[data & 0x0F]) << 16;
                                this.chD.looping = data & 0x40;
                                break;
                            case 1:
                                this.chD.dpcm_value = (data & 0x7F) >> 1;
                                break;
                            case 2:
                                this.chD.cache_addr = 0xC000 + (data << 6);
                                break;
                            case 3:
                                this.chD.cache_dmalength = ((data << 4) + 1) << 3;
                                break;
                        }
                        break;
                    case 0x4015:
                        this.reg4015 = data;
                        if (!(data & (1 << 0))) {
                            this.chR[0].enable = 0;
                            this.chR[0].len_count = 0;
                        }
                        if (!(data & (1 << 1))) {
                            this.chR[1].enable = 0;
                            this.chR[1].len_count = 0;
                        }
                        if (!(data & (1 << 2))) {
                            this.chT.enable = 0;
                            this.chT.len_count = 0;
                            this.chT.lin_count = 0;
                            this.chT.counter_start = 0;
                        }
                        if (!(data & (1 << 3))) {
                            this.chN.enable = 0;
                            this.chN.len_count = 0;
                        }
                        if (!(data & (1 << 4))) {
                            this.chD.enable = 0;
                            this.chD.dmalength = 0;
                        }
                        else {
                            this.chD.enable = 0xFF;
                            if (!this.chD.dmalength) {
                                this.chD.address = this.chD.cache_addr;
                                this.chD.dmalength = this.chD.cache_dmalength;
                                this.chD.phaseacc = 0;
                            }
                        }
                        break;
                    case 0x4018:
                        // updateRectangle
                        for (var i = 0; i < 2; i++) {
                            ch = this.chR[i];
                            if (ch.enable && ch.len_count > 0) {
                                if (!(data & 1)) {
                                    if (ch.len_count && !ch.holdnote) {
                                        if (ch.len_count) {
                                            ch.len_count--;
                                        }
                                    }
                                    if (ch.swp_on && ch.swp_shift) {
                                        if (ch.swp_count) {
                                            ch.swp_count--;
                                        }
                                        if (ch.swp_count == 0) {
                                            ch.swp_count = ch.swp_decay;
                                            if (ch.swp_inc) {
                                                if (!ch.complement) {
                                                    ch.freq += ~(ch.freq >> ch.swp_shift); // CH 0
                                                }
                                                else {
                                                    ch.freq -= (ch.freq >> ch.swp_shift); // CH 1
                                                }
                                            }
                                            else {
                                                ch.freq += (ch.freq >> ch.swp_shift);
                                            }
                                        }
                                    }
                                }
                                if (ch.env_count) {
                                    ch.env_count--;
                                }
                                if (ch.env_count == 0) {
                                    ch.env_count = ch.env_decay;
                                    if (ch.holdnote) {
                                        ch.env_vol = (ch.env_vol - 1) & 0x0F;
                                    }
                                    else if (ch.env_vol) {
                                        ch.env_vol--;
                                    }
                                }
                                if (!ch.env_fixed) {
                                    ch.nowvolume = ch.env_vol << 8;
                                }
                            }
                        }
                        // updateTriangle
                        if (this.chT.enable) {
                            if (!(data & 1) && !this.chT.holdnote) {
                                if (this.chT.len_count) {
                                    this.chT.len_count--;
                                }
                            }
                            if (this.chT.counter_start) {
                                this.chT.lin_count = this.chT.reg[0] & 0x7F;
                            }
                            else if (this.chT.lin_count) {
                                this.chT.lin_count--;
                            }
                            if (!this.chT.holdnote && this.chT.lin_count) {
                                this.chT.counter_start = 0;
                            }
                        }
                        // updateNoise
                        if (this.chN.enable && this.chN.len_count > 0) {
                            if (!this.chN.holdnote) {
                                if (!(data & 1) && this.chN.len_count) {
                                    this.chN.len_count--;
                                }
                            }
                            if (this.chN.env_count) {
                                this.chN.env_count--;
                            }
                            if (this.chN.env_count == 0) {
                                this.chN.env_count = this.chN.env_decay;
                                if (this.chN.holdnote) {
                                    this.chN.env_vol = (this.chN.env_vol - 1) & 0x0F;
                                }
                                else if (this.chN.env_vol) {
                                    this.chN.env_vol--;
                                }
                            }
                            if (!this.chN.env_fixed) {
                                this.chN.nowvolume = this.chN.env_vol << 8;
                            }
                        }
                        break;
                }
            }
        };
        /**
         * Virtual Write Data.
         */
        APU.prototype.virtualWrite = function (addr, data) {
            var no;
            var ch;
            switch (addr) {
                case 0x4000:
                case 0x4001:
                case 0x4002:
                case 0x4003:
                case 0x4004:
                case 0x4005:
                case 0x4006:
                case 0x4007:
                    no = (addr < 0x4004) ? 0 : 1;
                    ch = this.chR[no];
                    ch.sync_reg[addr & 3] = data;
                    switch (addr & 3) {
                        case 0:
                            ch.sync_holdnote = data & 0x20;
                            break;
                        case 1:
                        case 2:
                            break;
                        case 3:
                            ch.sync_len_count = this.vblLength[data >> 3] * 2;
                            if (this.sync_reg4015 & (1 << no)) {
                                ch.sync_enable = 0xFF;
                            }
                            break;
                    }
                    break;
                case 0x4008:
                case 0x4009:
                case 0x400A:
                case 0x400B:
                    // syncWriteTriangle
                    this.chT.sync_reg[addr & 3] = data;
                    switch (addr & 3) {
                        case 0:
                            this.chT.sync_holdnote = data & 0x80;
                            break;
                        case 1:
                            break;
                        case 2:
                            break;
                        case 3:
                            this.chT.sync_len_count = this.vblLength[this.chT.sync_reg[3] >> 3] * 2;
                            this.chT.sync_counter_start = 0x80;
                            if (this.sync_reg4015 & (1 << 2)) {
                                this.chT.sync_enable = 0xFF;
                            }
                            break;
                    }
                    break;
                case 0x400C:
                case 0x400D:
                case 0x400E:
                case 0x400F:
                    // syncWriteNoise
                    this.chN.sync_reg[addr & 3] = data;
                    switch (addr & 3) {
                        case 0:
                            this.chN.sync_holdnote = data & 0x20;
                            break;
                        case 1:
                            break;
                        case 2:
                            break;
                        case 3:
                            this.chN.sync_len_count = this.vblLength[data >> 3] * 2;
                            if (this.sync_reg4015 & (1 << 3)) {
                                this.chN.sync_enable = 0xFF;
                            }
                            break;
                    }
                    break;
                case 0x4010:
                case 0x4011:
                case 0x4012:
                case 0x4013:
                    // syncWriteDPCM
                    this.chD.reg[addr & 3] = data;
                    switch (addr & 3) {
                        case 0:
                            this.chD.sync_cache_cycles = this.dpcmCycles[data & 0x0F] * 8;
                            this.chD.sync_looping = data & 0x40;
                            this.chD.sync_irq_gen = data & 0x80;
                            if (!this.chD.sync_irq_gen) {
                                this.chD.sync_irq_enable = 0;
                            }
                            break;
                        case 1:
                            break;
                        case 2:
                            break;
                        case 3:
                            this.chD.sync_cache_dmalength = (data << 4) + 1;
                            break;
                    }
                    break;
                case 0x4015:
                    this.sync_reg4015 = data;
                    if (!(data & (1 << 0))) {
                        this.chR[0].sync_enable = 0;
                        this.chR[0].sync_len_count = 0;
                    }
                    if (!(data & (1 << 1))) {
                        this.chR[1].sync_enable = 0;
                        this.chR[1].sync_len_count = 0;
                    }
                    if (!(data & (1 << 2))) {
                        this.chT.sync_enable = 0;
                        this.chT.sync_len_count = 0;
                        this.chT.sync_lin_count = 0;
                        this.chT.sync_counter_start = 0;
                    }
                    if (!(data & (1 << 3))) {
                        this.chN.sync_enable = 0;
                        this.chN.sync_len_count = 0;
                    }
                    if (!(data & (1 << 4))) {
                        this.chD.sync_enable = 0;
                        this.chD.sync_dmalength = 0;
                        this.chD.sync_irq_enable = 0;
                    }
                    else {
                        this.chD.sync_enable = 0xFF;
                        if (!this.chD.sync_dmalength) {
                            this.chD.sync_dmalength = this.chD.sync_cache_dmalength;
                            this.chD.sync_cycles = 0;
                        }
                    }
                    break;
                case 0x4017:
                    this.frameCycles = 0;
                    if (data & 0x80) {
                        this.updateFrame();
                    }
                ///FrameCount = 1;
                case 0x4018:
                    // syncUpdateRectangle
                    for (var i = 0; i < 2; i++) {
                        ch = this.chR[i];
                        if (ch.sync_enable && ch.sync_len_count > 0) {
                            if (ch.sync_len_count && !ch.sync_holdnote) {
                                if (!(data & 1) && ch.sync_len_count) {
                                    ch.sync_len_count--;
                                }
                            }
                        }
                    }
                    // syncUpdateTriangle
                    if (this.chT.sync_enable) {
                        if (!(data & 1) && !this.chT.sync_holdnote) {
                            if (this.chT.sync_len_count) {
                                this.chT.sync_len_count--;
                            }
                        }
                        if (this.chT.sync_counter_start) {
                            this.chT.sync_lin_count = this.chT.sync_reg[0] & 0x7F;
                        }
                        else if (this.chT.sync_lin_count) {
                            this.chT.sync_lin_count--;
                        }
                        if (!this.chT.sync_holdnote && this.chT.sync_lin_count) {
                            this.chT.sync_counter_start = 0;
                        }
                    }
                    // syncUpdateNoise(data);
                    if (this.chN.sync_enable && this.chN.sync_len_count > 0) {
                        if (this.chN.sync_len_count && !this.chN.sync_holdnote) {
                            if (!(data & 1) && this.chN.sync_len_count) {
                                this.chN.sync_len_count--;
                            }
                        }
                    }
                    break;
            }
        };
        /**
         * Update Frame.
         */
        APU.prototype.updateFrame = function () {
            this.bus.cpu.w(0x4018, 0);
        };
        /**
         * Render Rectangle Wave.
         */
        APU.prototype.renderRectangle = function (ch) {
            if (!ch.enable || ch.len_count <= 0) {
                return 0;
            }
            if ((ch.freq < 8) || (!ch.swp_inc && ch.freq > ch.freqlimit)) {
                return 0;
            }
            if (ch.env_fixed) {
                ch.nowvolume = ch.volume << 8;
            }
            var volume = ch.nowvolume;
            var total;
            var sample_weight = ch.phaseacc;
            if (sample_weight > this.cycleRate) {
                sample_weight = this.cycleRate;
            }
            total = (ch.adder < ch.duty) ? sample_weight : -sample_weight;
            var freq = (ch.freq + 1) << 16;
            ch.phaseacc -= this.cycleRate;
            while (ch.phaseacc < 0) {
                ch.phaseacc += freq;
                ch.adder = (ch.adder + 1) & 0x0F;
                sample_weight = freq;
                if (ch.phaseacc > 0) {
                    sample_weight -= ch.phaseacc;
                }
                total += (ch.adder < ch.duty) ? sample_weight : -sample_weight;
            }
            return Math.floor(volume * total / this.cycleRate + 0.5);
        };
        /**
         * Render Triangle Wave.
         */
        APU.prototype.renderTriangle = function () {
            var vol;
            var vol = 256 - ((this.chD.reg[1] & 0x01) + this.chD.dpcm_value * 2);
            if (!this.chT.enable || (this.chT.len_count <= 0) || (this.chT.lin_count <= 0)) {
                return this.chT.nowvolume * vol / 256;
            }
            if (this.chT.freq < (8 << 16)) {
                return this.chT.nowvolume * vol / 256;
            }
            this.chT.phaseacc -= this.cycleRate;
            if (this.chT.phaseacc >= 0) {
                return this.chT.nowvolume * vol / 256;
            }
            if (this.chT.freq > this.cycleRate) {
                this.chT.phaseacc += this.chT.freq;
                this.chT.adder = (this.chT.adder + 1) & 0x1F;
                if (this.chT.adder < 0x10) {
                    this.chT.nowvolume = (this.chT.adder & 0x0F) << 9;
                }
                else {
                    this.chT.nowvolume = (0x0F - (this.chT.adder & 0x0F)) << 9;
                }
                return this.chT.nowvolume * vol / 256;
            }
            var num_times;
            var total;
            num_times = total = 0;
            while (this.chT.phaseacc < 0) {
                this.chT.phaseacc += this.chT.freq;
                this.chT.adder = (this.chT.adder + 1) & 0x1F;
                if (this.chT.adder < 0x10) {
                    this.chT.nowvolume = (this.chT.adder & 0x0F) << 9;
                }
                else {
                    this.chT.nowvolume = (0x0F - (this.chT.adder & 0x0F)) << 9;
                }
                total += this.chT.nowvolume;
                num_times++;
            }
            return (total / num_times) * vol / 256;
        };
        /**
         * Render Noise Wave.
         */
        APU.prototype.renderNoise = function () {
            if (!this.chN.enable || this.chN.len_count <= 0) {
                return 0;
            }
            if (this.chN.env_fixed) {
                this.chN.nowvolume = this.chN.volume << 8;
            }
            var vol = 256 - ((this.chD.reg[1] & 0x01) + this.chD.dpcm_value * 2);
            this.chN.phaseacc -= this.cycleRate;
            if (this.chN.phaseacc >= 0) {
                return this.chN.output * vol / 256;
            }
            if (this.chN.freq > this.cycleRate) {
                this.chN.phaseacc += this.chN.freq;
                if (this.noiseShiftreg(this.chN.xor_tap)) {
                    this.chN.output = this.chN.nowvolume;
                }
                else {
                    this.chN.output = -this.chN.nowvolume;
                }
                return this.chN.output * vol / 256;
            }
            var num_times;
            var total;
            num_times = total = 0;
            while (this.chN.phaseacc < 0) {
                if (this.chN.freq == 0) {
                    break;
                }
                this.chN.phaseacc += this.chN.freq;
                if (this.noiseShiftreg(this.chN.xor_tap)) {
                    this.chN.output = this.chN.nowvolume;
                }
                else {
                    this.chN.output = -this.chN.nowvolume;
                }
                total += this.chN.output;
                num_times++;
            }
            return (total / num_times) * vol / 256;
        };
        /**
         * Render DPCM.
         */
        APU.prototype.renderDPCM = function () {
            if (this.chD.dmalength) {
                this.chD.phaseacc -= this.cycleRate;
                while (this.chD.phaseacc < 0) {
                    this.chD.phaseacc += this.chD.freq;
                    if (!(this.chD.dmalength & 7)) {
                        this.chD.cur_byte = this.bus.cpu.r(this.chD.address);
                        if (0xFFFF == this.chD.address) {
                            this.chD.address = 0x8000;
                        }
                        else {
                            this.chD.address++;
                        }
                    }
                    if (!(--this.chD.dmalength)) {
                        if (this.chD.looping) {
                            this.chD.address = this.chD.cache_addr;
                            this.chD.dmalength = this.chD.cache_dmalength;
                        }
                        else {
                            this.chD.enable = 0;
                            break;
                        }
                    }
                    if (this.chD.cur_byte & (1 << ((this.chD.dmalength & 7) ^ 7))) {
                        if (this.chD.dpcm_value < 0x3F) {
                            this.chD.dpcm_value += 1;
                        }
                    }
                    else {
                        if (this.chD.dpcm_value > 1) {
                            this.chD.dpcm_value -= 1;
                        }
                    }
                }
            }
            return this.chD.output;
        };
        /**
         * Update Virtaul DPCM.
         */
        APU.prototype.virtualUpdateDPCM = function (cycles) {
            this.frameCycles += cycles;
            if (this.frameCycles >= 7458) {
                this.frameCycles -= 7458;
                this.bus.cpu.w(0x4018, 0); // 写入4018
            }
            if (this.chD.sync_enable) {
                this.chD.sync_cycles -= cycles;
                while (this.chD.sync_cycles < 0) {
                    if (this.chD.sync_cache_cycles == 0) {
                        break;
                    }
                    this.chD.sync_cycles += this.chD.sync_cache_cycles;
                    if (this.chD.sync_dmalength) {
                        if (!(--this.chD.sync_dmalength)) {
                            if (this.chD.sync_looping) {
                                this.chD.sync_dmalength = this.chD.sync_cache_dmalength;
                            }
                            else {
                                this.chD.sync_dmalength = 0;
                                if (this.chD.sync_irq_gen) {
                                    this.chD.sync_irq_enable = 0xFF;
                                }
                            }
                        }
                    }
                }
            }
        };
        /**
         * @private
         */
        APU.prototype.noiseShiftreg = function (xor_tap) {
            var bit0;
            var bit14;
            bit0 = this.chN.shift_reg & 1;
            if (this.chN.shift_reg & xor_tap) {
                bit14 = bit0 ^ 1;
            }
            else {
                bit14 = bit0 ^ 0;
            }
            this.chN.shift_reg >>= 1;
            this.chN.shift_reg |= (bit14 << 14);
            return (bit0 ^ 1);
        };
        /**
         * Defines.
         */
        APU.MAX_BUF_SAMPLES = 2048 * 128;
        return APU;
    }(anes.Node));
    anes.APU = APU;
    /**
     * Sample.
     */
    var SAMPLE = /** @class */ (function () {
        function SAMPLE() {
            this.time = 0;
            this.addr = 0;
            this.data = 0;
        }
        return SAMPLE;
    }());
    /**
     * Rectangle Wave.
     */
    var RECTANGLE = /** @class */ (function () {
        function RECTANGLE() {
            this.reg = new Float64Array(4);
            this.enable = 0;
            this.holdnote = 0;
            this.volume = 0;
            this.complement = 0;
            this.phaseacc = 0;
            this.freq = 0;
            this.freqlimit = 0;
            this.adder = 0;
            this.duty = 0;
            this.len_count = 0;
            this.nowvolume = 0;
            this.env_fixed = 0;
            this.env_decay = 0;
            this.env_count = 0;
            this.dummy0 = 0;
            this.env_vol = 0;
            this.swp_on = 0;
            this.swp_inc = 0;
            this.swp_shift = 0;
            this.swp_decay = 0;
            this.swp_count = 0;
            this.dummy1 = new Float64Array(3);
            this.sync_reg = new Float64Array(4);
            this.sync_output_enable = 0;
            this.sync_enable = 0;
            this.sync_holdnote = 0;
            this.dummy2 = 0;
            this.sync_len_count = 0;
        }
        return RECTANGLE;
    }());
    /**
     * Triangle Wave.
     */
    var TRIANGLE = /** @class */ (function () {
        function TRIANGLE() {
            this.reg = new Float64Array(4);
            this.enable = 0;
            this.holdnote = 0;
            this.counter_start = 0;
            this.dummy0 = 0;
            this.phaseacc = 0;
            this.freq = 0;
            this.len_count = 0;
            this.lin_count = 0;
            this.adder = 0;
            this.nowvolume = 0;
            this.sync_reg = new Float64Array(4);
            this.sync_enable = 0;
            this.sync_holdnote = 0;
            this.sync_counter_start = 0;
            this.sync_len_count = 0;
            this.sync_lin_count = 0;
        }
        return TRIANGLE;
    }());
    /**
    * Noise Wave.
     */
    var NOISE = /** @class */ (function () {
        function NOISE() {
            this.reg = new Float64Array(4);
            this.enable = 0;
            this.holdnote = 0;
            this.volume = 0;
            this.xor_tap = 0;
            this.shift_reg = 0;
            this.phaseacc = 0;
            this.freq = 0;
            this.len_count = 0;
            this.nowvolume = 0;
            this.output = 0;
            this.env_fixed = 0;
            this.env_decay = 0;
            this.env_count = 0;
            this.dummy0 = 0;
            this.env_vol = 0;
            this.sync_reg = new Float64Array(4);
            this.sync_output_enable = 0;
            this.sync_enable = 0;
            this.sync_holdnote = 0;
            this.dummy1 = 0;
            this.sync_len_count = 0;
        }
        return NOISE;
    }());
    /**
     * DPCM.
     */
    var DPCM = /** @class */ (function () {
        function DPCM() {
            this.reg = new Float64Array(4);
            this.enable = 0;
            this.looping = 0;
            this.cur_byte = 0;
            this.dpcm_value = 0;
            this.freq = 0;
            this.phaseacc = 0;
            this.output = 0;
            this.address = 0;
            this.cache_addr = 0;
            this.dmalength = 0;
            this.cache_dmalength = 0;
            this.dpcm_output_real = 0;
            this.dpcm_output_fake = 0;
            this.dpcm_output_old = 0;
            this.dpcm_output_offset = 0;
            this.sync_reg = new Float64Array(4);
            this.sync_enable = 0;
            this.sync_looping = 0;
            this.sync_irq_gen = 0;
            this.sync_irq_enable = 0;
            this.sync_cycles = 0;
            this.sync_cache_cycles = 0;
            this.sync_dmalength = 0;
            this.sync_cache_dmalength = 0;
        }
        return DPCM;
    }());
})(anes || (anes = {}));
var anes;
(function (anes) {
    /**
     * Bus.
     */
    var Bus = /** @class */ (function () {
        /**
         * Constructor.
         */
        function Bus() {
            this.mapperNo = 0; // Curreent Mapper Number
            this.numPRom8K = 0; // Program 8K Rom Number
            this.numPRom16K = 0; // Program 16K Rom Number
            this.numPRom32K = 0; // Program 32K Rom Number
            this.numVRom1K = 0; // Video 1K Rom Number,someone call 'Character Rom(CHR)'
            this.numVRom2K = 0; // Video 2K Rom Number,someone call 'Character Rom(CHR)'
            this.numVRom4K = 0; // Video 4K Rom Number,someone call 'Character Rom(CHR)'
            this.numVRom8K = 0; // Video 8K Rom Number,someone call 'Character Rom(CHR)'
            this.mirrorV = false; // Vertical Mirror Flag
            this.mirrorF = false; // Four Screen Mirror Flag
            this.mirrorS = false; // Single Screen Mirror Flag
            this.battery = false; // Battery Flag [not uesd]
            this.trainer = false; // Trainer Flag
            this.cpu = new anes.CPU(this);
            this.ppu = new anes.PPU(this);
            this.apu = new anes.APU(this);
            this.joypad = new anes.Joypad();
            this.mapper0 = new anes.Mapper0(this);
            this.mapper1 = new anes.Mapper1(this);
            this.mapper2 = new anes.Mapper2(this);
            this.mapper3 = new anes.Mapper3(this);
            //this.mapper4 = new Mapper4(this);
            this.mappersW = new Array(0x100);
            this.mappersW[0] = this.mapper0.write.bind(this.mapper0);
            this.mappersW[1] = this.mapper1.write.bind(this.mapper1);
            this.mappersW[2] = this.mapper2.write.bind(this.mapper2);
            this.mappersW[3] = this.mapper3.write.bind(this.mapper3);
            this.mappersR = new Array(0x100);
            this.mappersR[0] = this.mapper0.reset.bind(this.mapper0);
            this.mappersR[1] = this.mapper1.reset.bind(this.mapper1);
            this.mappersR[2] = this.mapper2.reset.bind(this.mapper2);
            this.mappersR[3] = this.mapper3.reset.bind(this.mapper3);
        }
        return Bus;
    }());
    anes.Bus = Bus;
})(anes || (anes = {}));
/// <reference path="Node.ts" />
var anes;
(function (anes) {
    /**
     * CPU(6502).
     */
    var CPU = /** @class */ (function (_super) {
        __extends(CPU, _super);
        /**
         * Constructor.
         */
        function CPU(bus) {
            var _this = _super.call(this) || this;
            _this.onceExecedCC = 0; // clock cycles of executed in once exec
            _this.execedCC = 0; // clock cycles of executed
            _this._ii = 0;
            _this.bus = bus;
            // initialize registers
            _this.A = _this.X = _this.Y = _this.P = _this.PC16 = 0;
            _this.S = 0xFF;
            _this.NF = _this.VF = _this.BF = _this.DF = _this.IF = _this.ZF = _this.CF = false;
            _this.RF = true;
            // initalize variables
            _this.memory = new Int32Array(0x10000); // 64KB
            _this.cycleList = new Int32Array([7, 6, 0, 0, 0, 3, 5, 0, 3, 2, 2, 0, 0, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 6, 2, 0, 0, 3, 3, 5, 0, 4, 2, 2, 0, 4, 4, 6, 0, 2, 2, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 6, 6, 0, 0, 0, 3, 5, 0, 3, 2, 2, 0, 3, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 6, 6, 0, 0, 0, 3, 5, 0, 4, 2, 2, 0, 5, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 0, 6, 0, 0, 3, 3, 3, 0, 2, 0, 2, 0, 4, 4, 4, 0, 2, 6, 0, 0, 4, 4, 4, 0, 2, 5, 2, 0, 0, 5, 0, 0, 2, 6, 2, 0, 3, 3, 3, 0, 2, 2, 2, 0, 4, 4, 4, 0, 2, 5, 0, 0, 4, 4, 4, 0, 2, 4, 2, 0, 4, 4, 4, 0, 2, 6, 0, 0, 3, 3, 5, 0, 2, 2, 2, 0, 4, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 2, 6, 0, 0, 3, 3, 5, 0, 2, 2, 2, 0, 4, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0]);
            return _this;
        }
        /**
         * Reset.
         */
        CPU.prototype.reset = function () {
            this.PC16 = this.memory[0xFFFD] << 8 | this.memory[0xFFFC];
        };
        /**
         * Non-Maskable Interrupt.
         */
        CPU.prototype.NMI = function () {
            this.memory[0x0100 + this.S] = this.PC16 >> 8;
            this.S -= 1;
            this.S &= 0xFF; // [fixed]
            this.memory[0x0100 + this.S] = this.PC16 & 0xFF;
            this.S -= 1;
            this.S &= 0xFF; // [fixed]
            this.BF = false;
            this.P = (+this.NF) << 7 | (+this.VF) << 6 | (+this.RF) << 5 | (+this.BF) << 4 | (+this.DF) << 3 | (+this.IF) << 2 | (+this.ZF) << 1 | (+this.CF);
            this.memory[0x0100 + this.S] = this.P;
            this.S -= 1;
            this.S &= 0xFF; // [fixed]
            this.IF = true;
            this.PC16 = this.memory[0xFFFB] << 8 | this.memory[0xFFFA];
        };
        /**
         * Interrupt Request.
         */
        CPU.prototype.IRQ = function () {
            this.memory[0x0100 + this.S] = this.PC16 >> 8;
            this.S -= 1;
            this.S &= 0xFF; // [fixed]
            this.memory[0x0100 + this.S] = this.PC16 & 0xFF;
            this.S -= 1;
            this.S &= 0xFF; // [fixed]
            this.BF = false;
            this.P = (+this.NF) << 7 | (+this.VF) << 6 | (+this.RF) << 5 | (+this.BF) << 4 | (+this.DF) << 3 | (+this.IF) << 2 | (+this.ZF) << 1 | (+this.CF);
            this.memory[0x0100 + this.S] = this.P;
            this.S -= 1;
            this.S &= 0xFF; // [fixed]
            this.IF = true;
            this.PC16 = this.memory[0xFFFF] << 8 | this.memory[0xFFFE];
        };
        /**
         * Read data.
         */
        CPU.prototype.r = function (addr) {
            // get addr segment
            var seg = addr >> 13;
            if (seg == 0x00) {
                /* $0000-$1FFF(RAM) */
                return this.memory[addr & 0x07FF];
            }
            else if (seg == 0x01) {
                /* $2000-$3FFF(PPU) */
                return this.bus.ppu.r(addr & 0xE007);
            }
            else if (seg == 0x02) {
                /* $4000-$5FFF(Registers) */
                if (addr < 0x4100) {
                    if (addr <= 0x4013 || addr == 0x4015) {
                        // APU
                        return this.bus.apu.r(addr);
                    }
                    else if (addr == 0x4016) {
                        // Joypad 1
                        return this.bus.joypad.r(0);
                    }
                    else if (addr == 0x4017) {
                        // Joypad 2
                        return this.bus.joypad.r(1) | this.bus.apu.r(addr);
                    }
                    else {
                        console.log('uncope read register');
                        return this.memory[addr];
                    }
                }
                else {
                    console.log('read mapper lower - 1');
                }
            }
            else if (seg == 0x03) {
                /* $6000-$7FFF(Mapper Lower) */
                console.log('read mapper lower - 2');
                return 0;
            }
            else {
                return this.memory[addr];
            }
            return 0;
        };
        /**
         * Write data.
         */
        CPU.prototype.w = function (addr, value) {
            // get addr segment
            var seg = addr >> 13;
            if (seg == 0x00) {
                /* $0000-$1FFF(RAM) */
                this.memory[addr & 0x07FF] = value;
            }
            else if (seg == 0x01) {
                /* $2000-$3FFF(PPU) */
                this.bus.ppu.w(addr & 0xE007, value);
            }
            else if (seg == 0x02) {
                /* $4000-$5FFF(Registers) */
                if (addr < 0x4100) {
                    if (addr <= 0x4013 || addr == 0x4015 || addr == 0x4017 || addr == 0x4018) {
                        // APU
                        this.bus.apu.w(addr, value);
                    }
                    else if (addr == 0x4014) {
                        // DMA
                        var point = 0x0100 * value;
                        for (var i = 0; i < 256; i += 1) {
                            this.bus.ppu.SRAM[i] = this.memory[point + i];
                        }
                        this.onceExecedCC += 512;
                    }
                    else if (addr == 0x4016) {
                        // Joypad
                        this.bus.joypad.w(value);
                    }
                    else {
                        console.log('uncope write register', addr.toString(16));
                    }
                }
                else {
                    console.log('write mapper lower - 1');
                }
            }
            else if (seg == 0x03) {
                /* $6000-$7FFF(Mapper Lower) */
                console.log('write mapper lower - 2');
            }
            else {
                /* $6000-$FFFF(P-ROM) */
                this.bus.mapperW(addr, value);
            }
        };
        /**
         * execution instruction(execute instruction
         */
        CPU.prototype.exec = function (requiredCC) {
            for (;;) {
                this.oc = this.memory[this.PC16];
                /*
                if (this._ii >= 100000 && this._ii <= 10000000)
                {
                    if (this._ii % 100000 == 0)
                    {
                        console.log(this._ii, this.oc, this.Y, this.X, this.A);
                    }
                }
                if (this._ii == 305821)
                {
                    debugger;
                }
                this._ii++;
                */
                this.lastPC = this.PC16;
                this.PC16 += 1;
                if (this.oc >= 0xC0) {
                    // 240-255
                    if (this.oc >= 0xF0) {
                        if (this.oc >= 0xFC) {
                            if (this.oc == 0xFF) {
                            }
                            /* INC 16bit,X */
                            else if (this.oc == 0xFE) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16) + 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* SBC 16bit,X */
                            else if (this.oc == 0xFD) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A - this.srcV & 0xFFF) - (+!this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & (this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            else {
                                /*0xFC*/
                            }
                        }
                        else if (this.oc >= 0xF8) {
                            if (this.oc == 0xFB) {
                            }
                            else if (this.oc == 0xFA) {
                            }
                            /* SBC 16bit,Y */
                            else if (this.oc == 0xF9) {
                                // 1.Absolute Y Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A - this.srcV & 0xFFF) - (+!this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & (this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* SED */
                            else /*0xF8*/ {
                                // 2.execute instruction
                                this.DF = true;
                            }
                        }
                        else if (this.oc >= 0xF4) {
                            if (this.oc == 0xF7) {
                            }
                            /* INC 8bit,X */
                            else if (this.oc == 0xF6) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16] + 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* SBC 8bit,X */
                            else if (this.oc == 0xF5) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.dstV = (this.A - this.srcV & 0xFFF) - (+!this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & (this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else {
                                /*0xF4*/
                            }
                        }
                        else {
                            if (this.oc == 0xF3) {
                            }
                            else if (this.oc == 0xF2) {
                            }
                            /* SBC (8bit),Y */
                            else if (this.oc == 0xF1) {
                                // 1.Zero Page Indirect Indexed with Y
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.memory[this.l_op + 1 & 0xFF] << 8 | this.memory[this.l_op];
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A - this.srcV & 0xFFF) - (+!this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & (this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* BEQ #8bit */
                            else /*0xF0*/ {
                                // 1.Relative Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                if (this.ZF) {
                                    this.base16 = this.PC16;
                                    this.addr16 = this.PC16 + ((this.l_op << 24) >> 24) & 0xFFFF;
                                    this.PC16 = this.addr16;
                                    // 9.sum clock cycles
                                    this.onceExecedCC += 1;
                                    this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                                }
                            }
                        }
                    }
                    // 224-239
                    else if (this.oc >= 0xE0) {
                        if (this.oc >= 0xEC) {
                            if (this.oc == 0xEF) {
                            }
                            /* INC 16bit */
                            else if (this.oc == 0xEE) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16) + 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* SBC 16bit */
                            else if (this.oc == 0xED) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A - this.srcV & 0xFFF) - (+!this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & (this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* CPX 16bit */
                            else /*0xEC*/ {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.dstV = this.X - this.r(this.addr16) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                        }
                        else if (this.oc >= 0xE8) {
                            if (this.oc == 0xEB) {
                            }
                            /* NOP */
                            else if (this.oc == 0xEA) {
                            }
                            /* SBC #8bit */
                            else if (this.oc == 0xE9) {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.l_op;
                                this.dstV = (this.A - this.srcV & 0xFFF) - (+!this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & (this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* INX */
                            else /*0xE8*/ {
                                // 2.execute instruction
                                this.X = this.X + 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.X & 0x80) > 0;
                                this.ZF = !this.X;
                            }
                        }
                        else if (this.oc >= 0xE4) {
                            if (this.oc == 0xE7) {
                            }
                            /* INC 8bit */
                            else if (this.oc == 0xE6) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16] + 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* SBC 8bit */
                            else if (this.oc == 0xE5) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.dstV = (this.A - this.srcV & 0xFFF) - (+!this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & (this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* CPX 8bit */
                            else /*0xE4*/ {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.dstV = this.X - this.memory[this.addr16] & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                        }
                        else {
                            if (this.oc == 0xE3) {
                            }
                            else if (this.oc == 0xE2) {
                            }
                            /* SBC (8bit,X) */
                            else if (this.oc == 0xE1) {
                                // 1.Zero Page Indexed Indirect Addressing,X
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.memory[this.l_op + this.X + 1 & 0xFF] << 8 | this.memory[this.l_op + this.X & 0xFF];
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A - this.srcV & 0xFFF) - (+!this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & (this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* CPX #8bit */
                            else /*0xE0*/ {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.dstV = this.X - this.l_op & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                        }
                    }
                    // 208-223
                    else if (this.oc >= 0xD0) {
                        if (this.oc >= 0xDC) {
                            if (this.oc == 0xDF) {
                            }
                            /* DEC 16bit,X */
                            else if (this.oc == 0xDE) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16) - 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* CMP 16bit,X */
                            else if (this.oc == 0xDD) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.dstV = this.A - this.r(this.addr16) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            else {
                                /* 0xDC */
                            }
                        }
                        else if (this.oc >= 0xD8) {
                            if (this.oc == 0xDB) {
                            }
                            else if (this.oc == 0xDA) {
                            }
                            /* CMP 16bit,Y */
                            else if (this.oc == 0xD9) {
                                // 1.Absolute Y Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.dstV = this.A - this.r(this.addr16) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* CLD */
                            else /*0xD8*/ {
                                // 2.execute instruction
                                this.DF = false;
                            }
                        }
                        else if (this.oc >= 0xD4) {
                            if (this.oc == 0xD7) {
                            }
                            /* DEC 8bit,X */
                            else if (this.oc == 0xD6) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16] - 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* CMP 8bit,X */
                            else if (this.oc == 0xD5) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.dstV = this.A - this.memory[this.addr16] & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                            else {
                                /*0xD4*/
                            }
                        }
                        else {
                            if (this.oc == 0xD3) {
                            }
                            else if (this.oc == 0xD2) {
                            }
                            /* CMP (8bit),Y */
                            else if (this.oc == 0xD1) {
                                // 1.Zero Page Indirect Indexed with Y
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.memory[this.l_op + 1 & 0xFF] << 8 | this.memory[this.l_op];
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.dstV = this.A - this.r(this.addr16) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* BNE #8bit */
                            else {
                                // 1.Relative Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                if (!this.ZF) {
                                    this.base16 = this.PC16;
                                    this.addr16 = this.PC16 + ((this.l_op << 24) >> 24) & 0xFFFF;
                                    this.PC16 = this.addr16;
                                    // 9.sum clock cycles
                                    this.onceExecedCC += 1;
                                    this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                                }
                            }
                        }
                    }
                    // 192-207
                    else {
                        if (this.oc >= 0xCC) {
                            if (this.oc == 0xCF) {
                            }
                            /* DEC 16bit */
                            else if (this.oc == 0xCE) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16) - 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* CMP 16bit */
                            else if (this.oc == 0xCD) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.dstV = this.A - this.r(this.addr16) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                            /* CPY 16bit */
                            else /*0xCC*/ {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.dstV = this.Y - this.r(this.addr16) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                        }
                        else if (this.oc >= 0xC8) {
                            if (this.oc == 0xCB) {
                            }
                            /* DEX */
                            else if (this.oc == 0xCA) {
                                // 2.execute instruction
                                this.X = this.X - 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.X & 0x80) > 0;
                                this.ZF = !this.X;
                            }
                            /* CMP #8bit */
                            else if (this.oc == 0xC9) {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.dstV = this.A - this.l_op & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                            /* INY */
                            else /*0xC8*/ {
                                // 2.execute instruction
                                this.Y = this.Y + 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.Y & 0x80) > 0;
                                this.ZF = !this.Y;
                            }
                        }
                        else if (this.oc >= 0xC4) {
                            if (this.oc == 0xC7) {
                            }
                            /* DEC 8bit */
                            else if (this.oc == 0xC6) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16] - 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* CMP 8bit */
                            else if (this.oc == 0xC5) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.dstV = this.A - this.memory[this.addr16] & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                            /* CPY 8bit */
                            else /*0xC4*/ {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.dstV = this.Y - this.memory[this.addr16] & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                        }
                        else {
                            if (this.oc == 0xC3) {
                            }
                            else if (this.oc == 0xC2) {
                            }
                            /* CMP (8bit,X) */
                            else if (this.oc == 0xC1) {
                                // 1.Zero Page Indexed Indirect Addressing,X
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.memory[this.l_op + this.X + 1 & 0xFF] << 8 | this.memory[this.l_op + this.X & 0xFF];
                                // 2.execute instruction
                                this.dstV = this.A - this.r(this.addr16) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                            /* CPY #8bit */
                            else /*0xC0*/ {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.dstV = this.Y - this.l_op & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV < 0x100;
                                this.dstV &= 0xFF; // [fixed]
                                this.NF = (this.dstV & 0x80) > 0;
                                this.ZF = !this.dstV;
                            }
                        }
                    }
                }
                else if (this.oc >= 0x80) {
                    // 176-191
                    if (this.oc >= 0xB0) {
                        if (this.oc >= 0xBC) {
                            if (this.oc == 0xBF) {
                            }
                            /* LDX 16bit,Y */
                            else if (this.oc == 0xBE) {
                                // 1.Absolute Y Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.X = this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.X & 0x80) > 0;
                                this.ZF = !this.X;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* LDA 16bit,X */
                            else if (this.oc == 0xBD) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.A = this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /*  LDY 16bit,X */
                            else /*0xBC*/ {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.Y = this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.Y & 0x80) > 0;
                                this.ZF = !this.Y;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                        }
                        else if (this.oc >= 0xB8) {
                            if (this.oc == 0xBB) {
                            }
                            /* TSX */
                            else if (this.oc == 0xBA) {
                                // 2.execute instruction
                                this.X = this.S;
                                // 3.update flags
                                this.NF = (this.X & 0x80) > 0;
                                this.ZF = !this.X;
                            }
                            /* LDA 16bit,Y */
                            else if (this.oc == 0xB9) {
                                // 1.Absolute Y Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.A = this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* CLV */
                            else {
                                // 2.execute instruction
                                this.VF = false;
                            }
                        }
                        else if (this.oc >= 0xB4) {
                            if (this.oc == 0xB7) {
                            }
                            /* LDX 8bit,Y */
                            else if (this.oc == 0xB6) {
                                // 1.Zero-page Y Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.Y & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.X = this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.X & 0x80) > 0;
                                this.ZF = !this.X;
                            }
                            /* LDA 8bit,X */
                            else if (this.oc == 0xB5) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A = this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* LDY 8bit,X */
                            else /*0xB4*/ {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.Y = this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.Y & 0x80) > 0;
                                this.ZF = !this.Y;
                            }
                        }
                        else {
                            if (this.oc == 0xB3) {
                            }
                            else if (this.oc == 0xB2) {
                            }
                            /* LDA (8bit),Y */
                            else if (this.oc == 0xB1) {
                                // 1.Zero Page Indirect Indexed with Y
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.memory[this.l_op + 1 & 0xFF] << 8 | this.memory[this.l_op];
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.A = this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* BCS #8bit */
                            else /*0xB0*/ {
                                // 1.Relative Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                if (this.CF) {
                                    this.base16 = this.PC16;
                                    this.addr16 = this.PC16 + ((this.l_op << 24) >> 24) & 0xFFFF;
                                    this.PC16 = this.addr16;
                                    // 9.sum clock cycles
                                    this.onceExecedCC += 1;
                                    this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                                }
                            }
                        }
                    }
                    // 160-175
                    else if (this.oc >= 0xA0) {
                        if (this.oc >= 0xAC) {
                            if (this.oc == 0xAF) {
                            }
                            /* LDX 16bit */
                            else if (this.oc == 0xAE) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.X = this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.X & 0x80) > 0;
                                this.ZF = !this.X;
                            }
                            /* LDA 16bit */
                            else if (this.oc == 0xAD) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.A = this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* LDY 16bit */
                            else /*0xAC*/ {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.Y = this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.Y & 0x80) > 0;
                                this.ZF = !this.Y;
                            }
                        }
                        else if (this.oc >= 0xA8) {
                            if (this.oc == 0xAB) {
                            }
                            /* TAX */
                            else if (this.oc == 0xAA) {
                                // 2.execute instruction
                                this.X = this.A;
                                // 3.update flags
                                this.NF = (this.X & 0x80) > 0;
                                this.ZF = !this.X;
                            }
                            /* LDA #8bit */
                            else if (this.oc == 0xA9) {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A = this.l_op;
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* TAY */
                            else /*0xA8*/ {
                                // 2.execute instruction
                                this.Y = this.A;
                                // 3.update flags
                                this.NF = (this.Y & 0x80) > 0;
                                this.ZF = !this.Y;
                            }
                        }
                        else if (this.oc >= 0xA4) {
                            if (this.oc == 0xA7) {
                            }
                            /* LDX 8bit */
                            else if (this.oc == 0xA6) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.X = this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.X & 0x80) > 0;
                                this.ZF = !this.X;
                            }
                            /* LDA 8bit */
                            else if (this.oc == 0xA5) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A = this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* LDY 8bit */
                            else /*0xA4*/ {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.Y = this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.Y & 0x80) > 0;
                                this.ZF = !this.Y;
                            }
                        }
                        else {
                            if (this.oc == 0xA3) {
                            }
                            /* LDX #8bit */
                            else if (this.oc == 0xA2) {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.X = this.l_op;
                                // 3.update flags
                                this.NF = (this.X & 0x80) > 0;
                                this.ZF = !this.X;
                            }
                            /* LDA (8bit,X) */
                            else if (this.oc == 0xA1) {
                                // 1.Zero Page Indexed Indirect Addressing,X
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.memory[this.l_op + this.X + 1 & 0xFF] << 8 | this.memory[this.l_op + this.X & 0xFF];
                                // 2.execute instruction
                                this.A = this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* LDY #8bit */
                            else /*0xA0*/ {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.Y = this.l_op;
                                // 3.update flags
                                this.NF = (this.Y & 0x80) > 0;
                                this.ZF = !this.Y;
                            }
                        }
                    }
                    // 144-159
                    else if (this.oc >= 0x90) {
                        if (this.oc >= 0x9C) {
                            if (this.oc == 0x9F) {
                            }
                            else if (this.oc == 0x9E) {
                            }
                            /* STA 16bit,X */
                            else if (this.oc == 0x9D) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.A;
                                // 3.save data
                                this.w(this.addr16, this.srcV);
                            }
                            else {
                            }
                        }
                        else if (this.oc >= 0x98) {
                            if (this.oc == 0x9B) {
                            }
                            /* TXS */
                            else if (this.oc == 0x9A) {
                                // 2.execute instruction
                                this.S = this.X;
                            }
                            /* STA 16bit,Y */
                            else if (this.oc == 0x99) {
                                // 1.Absolute Y Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.A;
                                // 3.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* TYA */
                            else /*0x98*/ {
                                // 2.execute instruction
                                this.A = this.Y;
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                        }
                        else if (this.oc >= 0x94) {
                            if (this.oc == 0x97) {
                            }
                            /* STX 8bit,Y */
                            else if (this.oc == 0x96) {
                                // 1.Zero-page Y Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.Y & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.memory[this.addr16] = this.X;
                            }
                            /* STA 8bit,X */
                            else if (this.oc == 0x95) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.memory[this.addr16] = this.A;
                            }
                            /* STY 8bit,X */
                            else /*0x94*/ {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.memory[this.addr16] = this.Y;
                            }
                        }
                        else {
                            if (this.oc == 0x93) {
                            }
                            else if (this.oc == 0x92) {
                            }
                            /* STA (8bit),Y */
                            else if (this.oc == 0x91) {
                                // 1.Zero Page Indirect Indexed with Y
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.memory[this.l_op + 1 & 0xFF] << 8 | this.memory[this.l_op];
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.A;
                                // 3.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* BCC #8bit */
                            else /*0x90*/ {
                                // 1.Relative Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                if (!this.CF) {
                                    this.base16 = this.PC16;
                                    this.addr16 = this.PC16 + ((this.l_op << 24) >> 24) & 0xFFFF;
                                    this.PC16 = this.addr16;
                                    // 9.sum clock cycles
                                    this.onceExecedCC += 1;
                                    this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                                }
                            }
                        }
                    }
                    // 128-143
                    else {
                        if (this.oc >= 0x8C) {
                            if (this.oc == 0x8F) {
                            }
                            /* STX 16bit */
                            else if (this.oc == 0x8E) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.X;
                                // 3.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* STA 16bit */
                            else if (this.oc == 0x8D) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.A;
                                // 3.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* STY 16bit */
                            else /*0x8C*/ {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.Y;
                                // 3.save data
                                this.w(this.addr16, this.srcV);
                            }
                        }
                        else if (this.oc >= 0x88) {
                            if (this.oc == 0x8B) {
                            }
                            /* TXA */
                            else if (this.oc == 0x8A) {
                                // 2.execute instruction
                                this.A = this.X;
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else if (this.oc == 0x89) {
                            }
                            /* DEY */
                            else /*0x88*/ {
                                // 2.execute instruction
                                this.Y = this.Y - 1 & 0xFF;
                                // 3.update flags
                                this.NF = (this.Y & 0x80) > 0;
                                this.ZF = !this.Y;
                            }
                        }
                        else if (this.oc >= 0x84) {
                            if (this.oc == 0x87) {
                            }
                            /* STX 8bit */
                            else if (this.oc == 0x86) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.X;
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* STA 8bit */
                            else if (this.oc == 0x85) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.A;
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* STY 8bit */
                            else /*0x84*/ {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.Y;
                                this.memory[this.addr16] = this.srcV;
                            }
                        }
                        else {
                            if (this.oc == 0x83) {
                            }
                            else if (this.oc == 0x82) {
                            }
                            /* STA (8bit,X) */
                            else if (this.oc == 0x81) {
                                // 1.Zero Page Indexed Indirect Addressing,X
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.memory[(this.l_op + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_op + this.X & 0xFF];
                                // 2.execute instruction
                                this.srcV = this.A;
                                this.w(this.addr16, this.srcV);
                            }
                            else {
                            }
                        }
                    }
                }
                else if (this.oc >= 0x40) {
                    // 112-127
                    if (this.oc >= 0x70) {
                        if (this.oc >= 0x7C) {
                            if (this.oc == 0x7F) {
                            }
                            /* ROR 16bit,X */
                            else if (this.oc == 0x7E) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.tmpB = this.CF;
                                this.CF = (this.srcV & 0x01) > 0;
                                this.srcV = this.srcV >> 1 | (+this.tmpB) << 7;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* ADC 16bit,X */
                            else if (this.oc == 0x7D) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A + this.srcV & 0xFFF) + (+this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV > 0xFF;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & ~(this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            else {
                            }
                        }
                        else if (this.oc >= 0x78) {
                            if (this.oc == 0x7B) {
                            }
                            else if (this.oc == 0x7A) {
                            }
                            /* ADC 16bit,Y */
                            else if (this.oc == 0x79) {
                                // 1.Absolute Y Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A + this.srcV & 0xFFF) + (+this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV > 0xFF;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & ~(this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* SEI */
                            else /*0x78*/ {
                                // 2.execute instruction
                                this.IF = true;
                            }
                        }
                        else if (this.oc >= 0x74) {
                            if (this.oc == 0x77) {
                            }
                            /* ROR 8bit,X */
                            else if (this.oc == 0x76) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.tmpB = this.CF;
                                this.CF = (this.srcV & 0x01) > 0;
                                this.srcV = this.srcV >> 1 | (+this.tmpB) << 7;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* ADC 8bit,X */
                            else if (this.oc == 0x75) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.dstV = (this.A + this.srcV & 0xFFF) + (+this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV > 0xFF;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & ~(this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else {
                            }
                        }
                        else {
                            if (this.oc == 0x73) {
                            }
                            else if (this.oc == 0x72) {
                            }
                            /* ADC (8bit),Y */
                            else if (this.oc == 0x71) {
                                // 1.Zero Page Indirect Indexed with Y
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.memory[this.l_op + 1 & 0xFF] << 8 | this.memory[this.l_op];
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A + this.srcV & 0xFFF) + (+this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV > 0xFF;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & ~(this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* BVS #8bit */
                            else /*0x70*/ {
                                // 1.Relative Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                if (this.VF) {
                                    this.base16 = this.PC16;
                                    this.addr16 = this.PC16 + ((this.l_op << 24) >> 24) & 0xFFFF;
                                    this.PC16 = this.addr16;
                                    // 9.sum clock cycles
                                    this.onceExecedCC += 1;
                                    this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                                }
                            }
                        }
                    }
                    // 96-111
                    else if (this.oc >= 0x60) {
                        if (this.oc >= 0x6C) {
                            if (this.oc == 0x6F) {
                            }
                            /* ROR 16bit */
                            else if (this.oc == 0x6E) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.tmpB = this.CF;
                                this.CF = (this.srcV & 0x01) > 0;
                                this.srcV = this.srcV >> 1 | (+this.tmpB) << 7;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* ADC 16bit */
                            else if (this.oc == 0x6D) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A + this.srcV & 0xFFF) + (+this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV > 0xFF;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & ~(this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* JMP (16bit) */
                            else /*0x6C*/ {
                                // 1.Absolute Indirect
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                this.l_ad = this.r(this.addr16);
                                this.u_ad = this.r(this.addr16 + 1 & 0xFFFF);
                                this.addr16 = this.u_ad << 8 | this.l_ad;
                                // 2.execute instruction
                                this.PC16 = this.addr16;
                            }
                        }
                        else if (this.oc >= 0x68) {
                            if (this.oc == 0x6B) {
                            }
                            /* ROR */
                            else if (this.oc == 0x6A) {
                                // 2.execute instruction
                                this.tmpB = this.CF;
                                this.CF = (this.A & 0x01) > 0;
                                this.A = this.A >> 1 | (+this.tmpB) << 7;
                                this.A &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* ADC #8bit */
                            else if (this.oc == 0x69) {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.l_op;
                                this.dstV = (this.A + this.srcV & 0xFFF) + (+this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV > 0xFF;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & ~(this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* PLA */
                            else {
                                // 2.execute instruction
                                this.S += 1;
                                this.S &= 0xFF; // [fixed]
                                this.A = this.memory[0x0100 + this.S];
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                        }
                        else if (this.oc >= 0x64) {
                            if (this.oc == 0x67) {
                            }
                            /* ROR 8bit */
                            else if (this.oc == 0x66) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.tmpB = this.CF;
                                this.CF = (this.srcV & 0x01) > 0;
                                this.srcV = this.srcV >> 1 | (+this.tmpB) << 7;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* ADC 8bit */
                            else if (this.oc == 0x65) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.dstV = (this.A + this.srcV & 0xFFF) + (+this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV > 0xFF;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & ~(this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else {
                            }
                        }
                        else {
                            if (this.oc == 0x63) {
                            }
                            else if (this.oc == 0x62) {
                            }
                            /* ADC (8bit,X) */
                            else if (this.oc == 0x61) {
                                // 1.Zero Page Indexed Indirect Addressing,X
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.memory[this.l_op + this.X + 1 & 0xFF] << 8 | this.memory[this.l_op + this.X & 0xFF];
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.dstV = (this.A + this.srcV & 0xFFF) + (+this.CF) & 0xFFF;
                                // 3.update flags
                                this.CF = this.dstV > 0xFF;
                                this.dstV &= 0xFF; // [fixed]
                                this.VF = (0x80 & ~(this.A ^ this.srcV) & (this.A ^ this.dstV)) > 0;
                                this.A = this.dstV;
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* RTS */
                            else /*0x60*/ {
                                // 1.Implied Addressing
                                this.S += 1;
                                this.S &= 0xFF; // [fixed]
                                this.l_ad = this.memory[0x0100 + this.S];
                                this.S += 1;
                                this.S &= 0xFF; // [fixed]
                                this.u_ad = this.memory[0x0100 + this.S];
                                // 2.execute instruction
                                this.addr16 = this.u_ad << 8 | this.l_ad;
                                this.PC16 = this.addr16 + 1 & 0xFFFF;
                            }
                        }
                    }
                    // 80-95
                    else if (this.oc >= 0x50) {
                        if (this.oc >= 0x5C) {
                            if (this.oc == 0x5F) {
                            }
                            /* LSR 16bit,X */
                            else if (this.oc == 0x5E) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.CF = (this.srcV & 0x01) > 0;
                                this.srcV >>= 1;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* EOR 16bit,X */
                            else if (this.oc == 0x5D) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.A ^= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            else {
                            }
                        }
                        else if (this.oc >= 0x58) {
                            if (this.oc == 0x5B) {
                            }
                            else if (this.oc == 0x5A) {
                            }
                            /* EOR 16bit,Y */
                            else if (this.oc == 0x59) {
                                // 1.Absolute Y Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.A ^= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* CLI */
                            else /*0x58*/ {
                                // 2.execute instruction
                                this.IF = false;
                            }
                        }
                        else if (this.oc >= 0x54) {
                            if (this.oc == 0x57) {
                            }
                            /* LSR 8bit,X */
                            else if (this.oc == 0x56) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.CF = (this.srcV & 0x01) > 0;
                                this.srcV >>= 1;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* EOR 8bit,X */
                            else if (this.oc == 0x55) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A ^= this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else {
                            }
                        }
                        else {
                            if (this.oc == 0x53) {
                            }
                            else if (this.oc == 0x52) {
                            }
                            /* EOR (8bit),Y */
                            else if (this.oc == 0x51) {
                                // 1.Zero Page Indirect Indexed with Y
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.memory[this.l_op + 1 & 0xFF] << 8 | this.memory[this.l_op];
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.A ^= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* BVC #8bit */
                            else /*0x50*/ {
                                // 1.Relative Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                if (!this.VF) {
                                    this.base16 = this.PC16;
                                    this.addr16 = this.PC16 + ((this.l_op << 24) >> 24) & 0xFFFF;
                                    this.PC16 = this.addr16;
                                    // 9.sum clock cycles
                                    this.onceExecedCC += 1;
                                    this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                                }
                            }
                        }
                    }
                    // 64-79
                    else {
                        if (this.oc >= 0x4C) {
                            if (this.oc == 0x4F) {
                            }
                            /* LSR 16bit */
                            else if (this.oc == 0x4E) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.CF = (this.srcV & 0x01) > 0;
                                this.srcV >>= 1;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* EOR 16bit */
                            else if (this.oc == 0x4D) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.A ^= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* JMP 16bit */
                            else /*0x4C*/ {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.PC16 = this.addr16;
                            }
                        }
                        else if (this.oc >= 0x48) {
                            if (this.oc == 0x4B) {
                            }
                            /* LSR */
                            else if (this.oc == 0x4A) {
                                // 2.execute instruction
                                this.CF = (this.A & 0x01) > 0;
                                this.A >>= 1;
                                this.A &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* EOR #8bit */
                            else if (this.oc == 0x49) {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A ^= this.l_op;
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* PHA */
                            else /*0x48*/ {
                                // 2.execute instruction
                                this.addr16 = 0x0100 + this.S;
                                this.srcV = this.A;
                                this.w(this.addr16, this.srcV);
                                this.S -= 1;
                                this.S &= 0xFF; // [fixed]
                            }
                        }
                        else if (this.oc >= 0x44) {
                            if (this.oc == 0x47) {
                            }
                            /* LSR 8bit */
                            else if (this.oc == 0x46) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.CF = (this.srcV & 0x01) > 0;
                                this.srcV >>= 1;
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* EOR 8bit */
                            else if (this.oc == 0x45) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A ^= this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else {
                            }
                        }
                        else {
                            if (this.oc == 0x43) {
                            }
                            else if (this.oc == 0x42) {
                            }
                            /* EOR (8bit,X) */
                            else if (this.oc == 0x41) {
                                // 1.Zero Page Indexed Indirect Addressing,X
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.memory[this.l_op + this.X + 1 & 0xFF] << 8 | this.memory[this.l_op + this.X & 0xFF];
                                // 2.execute instruction
                                this.A ^= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* RTI */
                            else /*0x40*/ {
                                // restore stack
                                this.S += 1;
                                this.S &= 0xFF; // [fixed]
                                this.P = this.memory[0x0100 + this.S];
                                this.NF = (this.P & 0x80) > 0;
                                this.VF = (this.P & 0x40) > 0;
                                this.RF = true;
                                this.BF = (this.P & 0x10) > 0;
                                this.DF = (this.P & 0x08) > 0;
                                this.IF = (this.P & 0x04) > 0;
                                this.ZF = (this.P & 0x02) > 0;
                                this.CF = (this.P & 0x01) > 0;
                                // stack addressing
                                this.S += 1;
                                this.S &= 0xFF; // [fixed]
                                this.l_ad = this.memory[0x0100 + this.S];
                                this.S += 1;
                                this.S &= 0xFF; // [fixed]
                                this.u_ad = this.memory[0x0100 + this.S];
                                this.addr16 = this.u_ad << 8 | this.l_ad;
                                this.PC16 = this.addr16;
                            }
                        }
                    }
                }
                else {
                    // 48-63
                    if (this.oc >= 0x30) {
                        if (this.oc >= 0x3C) {
                            if (this.oc == 0x3F) {
                            }
                            /* ROL 16bit,X */
                            else if (this.oc == 0x3E) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.tmpB = this.CF;
                                this.CF = (this.srcV & 0x80) > 0;
                                this.srcV = this.srcV << 1 | (+this.tmpB);
                                this.srcV &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* AND 16bit,X */
                            else if (this.oc == 0x3D) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.A &= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            else {
                            }
                        }
                        else if (this.oc >= 0x38) {
                            if (this.oc == 0x3B) {
                            }
                            else if (this.oc == 0x3A) {
                            }
                            /* AND 16bit,Y */
                            else if (this.oc == 0x39) {
                                // 1.Absolute Y Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.A &= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* SEC */
                            else /*0x38*/ {
                                // 2.execute instruction
                                this.CF = true;
                            }
                        }
                        else if (this.oc >= 0x34) {
                            if (this.oc == 0x37) {
                            }
                            /* ROL 8bit,X */
                            else if (this.oc == 0x36) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.tmpB = this.CF;
                                this.CF = (this.srcV & 0x80) > 0;
                                this.srcV = this.srcV << 1 | (+this.tmpB);
                                this.srcV &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* AND 8bit,X */
                            else if (this.oc == 0x35) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A &= this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else {
                            }
                        }
                        else {
                            if (this.oc == 0x33) {
                            }
                            else if (this.oc == 0x32) {
                            }
                            /* AND (8bit),Y */
                            else if (this.oc == 0x31) {
                                // 1.Zero Page Indirect Indexed with Y
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.memory[this.l_op + 1 & 0xFF] << 8 | this.memory[this.l_op];
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.A &= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* BMI #8bit */
                            else /*0x30*/ {
                                // 1.Relative Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                if (this.NF) {
                                    this.base16 = this.PC16;
                                    this.addr16 = this.PC16 + ((this.l_op << 24) >> 24) & 0xFFFF;
                                    this.PC16 = this.addr16;
                                    // 9.sum clock cycles
                                    this.onceExecedCC += 1;
                                    this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                                }
                            }
                        }
                    }
                    // 32-47
                    else if (this.oc >= 0x20) {
                        if (this.oc >= 0x2C) {
                            if (this.oc == 0x2F) {
                            }
                            /* ROL 16bit */
                            else if (this.oc == 0x2E) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.tmpB = this.CF;
                                this.CF = (this.srcV & 0x80) > 0;
                                this.srcV = this.srcV << 1 | (+this.tmpB);
                                this.srcV &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* AND 16bit */
                            else if (this.oc == 0x2D) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.A &= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* BIT 16bit */
                            else /*0x2C*/ {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.ZF = !(this.srcV & this.A);
                                this.NF = (this.srcV & 0x80) > 0;
                                this.VF = (this.srcV & 0x40) > 0;
                            }
                        }
                        else if (this.oc >= 0x28) {
                            if (this.oc == 0x2B) {
                            }
                            /* ROL */
                            else if (this.oc == 0x2A) {
                                // 2.execute instruction
                                this.tmpB = this.CF;
                                this.CF = (this.A & 0x80) > 0;
                                this.A = this.A << 1 | (+this.tmpB);
                                this.A &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* AND #8bit */
                            else if (this.oc == 0x29) {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A &= this.l_op;
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* PLP */
                            else /*0x28*/ {
                                // 2.execute instruction
                                this.S += 1;
                                this.S &= 0xFF; // [fixed]
                                this.P = this.memory[0x0100 + this.S];
                                this.NF = (this.P & 0x80) > 0;
                                this.VF = (this.P & 0x40) > 0;
                                this.RF = true;
                                this.BF = (this.P & 0x10) > 0;
                                this.DF = (this.P & 0x08) > 0;
                                this.IF = (this.P & 0x04) > 0;
                                this.ZF = (this.P & 0x02) > 0;
                                this.CF = (this.P & 0x01) > 0;
                            }
                        }
                        else if (this.oc >= 0x24) {
                            if (this.oc == 0x27) {
                            }
                            /* ROL 8bit */
                            else if (this.oc == 0x26) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.tmpB = this.CF;
                                this.CF = (this.srcV & 0x80) > 0;
                                this.srcV = this.srcV << 1 | (+this.tmpB);
                                this.srcV &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* AND 8bit */
                            else if (this.oc == 0x25) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A &= this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* BIT 8bit */
                            else /*0x24*/ {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.ZF = !(this.srcV & this.A);
                                this.NF = (this.srcV & 0x80) > 0;
                                this.VF = (this.srcV & 0x40) > 0;
                            }
                        }
                        else {
                            if (this.oc == 0x23) {
                            }
                            else if (this.oc == 0x22) {
                            }
                            /* AND (8bit,X) */
                            else if (this.oc == 0x21) {
                                // 1.Zero Page Indexed Indirect Addressing,X
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.memory[(this.l_op + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_op + this.X & 0xFF];
                                // 2.execute instruction
                                this.A &= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* JSR 16bit */
                            else /*0x20*/ {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.PC16 -= 1; // jump back
                                this.memory[0x0100 + this.S] = this.PC16 >> 8;
                                this.S -= 1;
                                this.S &= 0xFF; // [fixed]
                                this.memory[0x0100 + this.S] = this.PC16 & 0xFF;
                                this.S -= 1;
                                this.S &= 0xFF; // [fixed]
                                this.PC16 = this.addr16;
                            }
                        }
                    }
                    // 16-31
                    else if (this.oc >= 0x10) {
                        if (this.oc >= 0x1C) {
                            if (this.oc == 0x1F) {
                            }
                            /* ASL 16bit,X */
                            else if (this.oc == 0x1E) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.CF = (this.srcV & 0x80) > 0;
                                this.srcV <<= 1;
                                this.srcV &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* ORA 16bit,X */
                            else if (this.oc == 0x1D) {
                                // 1.Absolute X Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.X & 0xFFFF;
                                // 2.execute instruction
                                this.A |= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            else {
                            }
                        }
                        else if (this.oc >= 0x18) {
                            if (this.oc == 0x1B) {
                            }
                            else if (this.oc == 0x1A) {
                            }
                            /* ORA 16bit,Y */
                            else if (this.oc == 0x19) {
                                // 1.Absolute Y Indexed Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.u_op << 8 | this.l_op;
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.A |= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* CLC */
                            else /*0x18*/ {
                                // 2.execute instruction
                                this.CF = false;
                            }
                        }
                        else if (this.oc >= 0x14) {
                            if (this.oc == 0x17) {
                            }
                            /* ASL 8bit,X */
                            else if (this.oc == 0x16) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.CF = (this.srcV & 0x80) > 0;
                                this.srcV <<= 1;
                                this.srcV &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* ORA 8bit,X */
                            else if (this.oc == 0x15) {
                                // 1.Zero-page X Indexed Addressing
                                this.addr16 = this.memory[this.PC16] + this.X & 0xFF;
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A |= this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else {
                            }
                        }
                        else {
                            if (this.oc == 0x13) {
                            }
                            else if (this.oc == 0x12) {
                            }
                            /* ORA (8bit),Y */
                            else if (this.oc == 0x11) {
                                // 1.Zero Page Indirect Indexed with Y
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.base16 = this.memory[this.l_op + 1 & 0xFF] << 8 | this.memory[this.l_op];
                                this.addr16 = this.base16 + this.Y & 0xFFFF;
                                // 2.execute instruction
                                this.A |= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                                // 9.sum clock cycles
                                this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                            }
                            /* BPL #8bit */
                            else /*0x10*/ {
                                // 1.Relative Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                if (!this.NF) {
                                    this.base16 = this.PC16;
                                    this.addr16 = this.PC16 + ((this.l_op << 24) >> 24) & 0xFFFF;
                                    this.PC16 = this.addr16;
                                    // 9.sum clock cycles
                                    this.onceExecedCC += 1;
                                    this.onceExecedCC += +((this.base16 & 0xFF00) != (this.addr16 & 0xFF00));
                                }
                            }
                        }
                    }
                    // 0-15
                    else {
                        if (this.oc >= 0x0C) {
                            if (this.oc == 0x0F) {
                            }
                            /* ASL 16bit */
                            else if (this.oc == 0x0E) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.srcV = this.r(this.addr16);
                                this.CF = (this.srcV & 0x80) > 0;
                                this.srcV <<= 1;
                                this.srcV &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.w(this.addr16, this.srcV);
                            }
                            /* ORA 16bit */
                            else if (this.oc == 0x0D) {
                                // 1.Absolute Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.u_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.u_op << 8 | this.l_op;
                                // 2.execute instruction
                                this.A |= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else {
                            }
                        }
                        else if (this.oc >= 0x08) {
                            if (this.oc == 0x0B) {
                            }
                            /* ASL */
                            else if (this.oc == 0x0A) {
                                // 2.execute instruction
                                this.CF = (this.A & 0x80) > 0;
                                this.A <<= 1;
                                this.A &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* ORA #8bit */
                            else if (this.oc == 0x09) {
                                // 1.Immediate Addressing
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A |= this.l_op;
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* PHP */
                            else {
                                // 2.execute instruction
                                this.P = (+this.NF) << 7 | (+this.VF) << 6 | (+this.RF) << 5 | (+this.BF) << 4 | (+this.DF) << 3 | (+this.IF) << 2 | (+this.ZF) << 1 | (+this.CF);
                                this.memory[0x0100 + this.S] = this.P;
                                this.S -= 1;
                                this.S &= 0xFF; // [fixed]
                            }
                        }
                        else if (this.oc >= 0x04) {
                            if (this.oc == 0x07) {
                            }
                            /* ASL 8bit */
                            else if (this.oc == 0x06) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.srcV = this.memory[this.addr16];
                                this.CF = (this.srcV & 0x80) > 0;
                                this.srcV <<= 1;
                                this.srcV &= 0xFF; // [fixed]
                                // 3.update flags
                                this.NF = (this.srcV & 0x80) > 0;
                                this.ZF = !this.srcV;
                                // 4.save data
                                this.memory[this.addr16] = this.srcV;
                            }
                            /* ORA 8bit */
                            else if (this.oc == 0x05) {
                                // 1.Zero Page Addressing
                                this.addr16 = this.memory[this.PC16];
                                this.PC16 += 1;
                                // 2.execute instruction
                                this.A |= this.memory[this.addr16];
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            else {
                            }
                        }
                        else {
                            if (this.oc == 0x03) {
                            }
                            else if (this.oc == 0x02) {
                            }
                            /* ORA (8bit,X) */
                            else if (this.oc == 0x01) {
                                // 1.Zero Page Indexed Indirect Addressing,X
                                this.l_op = this.memory[this.PC16];
                                this.PC16 += 1;
                                this.addr16 = this.memory[(this.l_op + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_op + this.X & 0xFF];
                                // 2.execute instruction
                                this.A |= this.r(this.addr16);
                                // 3.update flags
                                this.NF = (this.A & 0x80) > 0;
                                this.ZF = !this.A;
                            }
                            /* BRK(软中断) */
                            else /*0x00*/ {
                                // step 1 - stack <- PC + 2
                                this.PC16 += 1;
                                this.memory[0x0100 + this.S] = this.PC16 >> 8;
                                this.S -= 1;
                                this.S &= 0xFF; // [fixed]
                                this.memory[0x0100 + this.S] = this.PC16 & 0xFF;
                                this.S -= 1;
                                this.S &= 0xFF; // [fixed]
                                // step 2
                                this.BF = true;
                                // step 3 - stack <- P
                                this.P = (+this.NF) << 7 | (+this.VF) << 6 | (+this.RF) << 5 | (+this.BF) << 4 | (+this.DF) << 3 | (+this.IF) << 2 | (+this.ZF) << 1 | (+this.CF);
                                this.memory[0x0100 + this.S] = this.P;
                                this.S -= 1;
                                this.S &= 0xFF; // [fixed]
                                // step 4
                                this.IF = true;
                                // step 5
                                this.PC16 = this.memory[0xFFFF] << 8 | this.memory[0xFFFE];
                            }
                        }
                    }
                }
                // get clock cycles of current instruction
                var cycles = this.cycleList[this.oc];
                if (cycles == 0) {
                    console.log('Invalid instruction:', this.oc.toString(16), this.lastPC.toString(16));
                    this.onceExecedCC += 2;
                    return false;
                }
                // sum clock cycles of executed
                this.onceExecedCC += cycles;
                this.execedCC += cycles;
                // execute interrupt
                if (this.bus.ppu.ENC) {
                    this.bus.ppu.ENC -= cycles; // pass 7 clock cycle
                    if (this.bus.ppu.ENC <= 0) {
                        this.NMI();
                        this.bus.ppu.ENC = 0;
                    }
                }
                // Whether it meets the requirements of CC
                if (this.onceExecedCC >= requiredCC) {
                    // reander sound
                    this.bus.apu.virtualUpdateDPCM(this.onceExecedCC);
                    return true;
                }
            }
            return true;
        };
        /**
         * Defines.
         */
        CPU.frequency = 1789772.5;
        return CPU;
    }(anes.Node));
    anes.CPU = CPU;
})(anes || (anes = {}));
var anes;
(function (anes) {
    /**
     * Joypad.
     */
    var Joypad = /** @class */ (function () {
        /**
         * Constructor.
         */
        function Joypad() {
            this.dev0 |= (1 & 0x08 >> 3) >> 16;
            this.dev0 |= (1 & 0x04 >> 2) >> 17;
            this.dev0 |= (1 & 0x02 >> 1) >> 18;
            this.dev0 |= (1 & 0x01 >> 0) >> 19;
            this.dev0_nShift = 0;
            this.dev1 |= (2 & 0x08 >> 3) >> 16;
            this.dev1 |= (2 & 0x04 >> 2) >> 17;
            this.dev1 |= (2 & 0x02 >> 1) >> 18;
            this.dev1 |= (2 & 0x01 >> 0) >> 19;
            this.dev1_nShift = 0;
            this.bStrobe = false;
        }
        /**
         * Read data.
         */
        Joypad.prototype.r = function (dev) {
            var data;
            if (dev == 0) {
                data = this.dev0 >> this.dev0_nShift & 0x1;
                this.dev0_nShift += 1;
                this.dev0_nShift %= 24;
            }
            else {
                data = this.dev1 >> this.dev1_nShift & 0x1;
                this.dev1_nShift += 1;
                this.dev1_nShift %= 24;
            }
            return data;
        };
        /**
         * Write data.
         */
        Joypad.prototype.w = function (data) {
            if (data & 0x1 && this.bStrobe == false) {
                this.bStrobe = true;
            }
            else if (!(data & 0x1) && this.bStrobe) {
                // reset
                this.dev0_nShift = 0;
                this.dev1_nShift = 0;
                this.bStrobe = false;
            }
        };
        return Joypad;
    }());
    anes.Joypad = Joypad;
})(anes || (anes = {}));
/// <reference path="Node.ts" />
/// <reference path="Mapper.ts" />
var anes;
(function (anes) {
    //
    // iNes header length:16(0x10)bytes
    //
    // a bank of PRG-ROM is 0x4000(16KB)
    // a bank of CHR-ROM is 0x1000(4KB)
    // whole CHR-ROM is 0x2000(8KB)
    //
    // lower PRG-ROM address is:0x8000
    // upper PRG-ROM address is:0xC000
    //
    var Mapper0 = /** @class */ (function (_super) {
        __extends(Mapper0, _super);
        /**
         * Constructor.
         */
        function Mapper0(bus) {
            var _this = _super.call(this) || this;
            _this.bus = bus;
            return _this;
        }
        /**
         * reset.
         */
        Mapper0.prototype.reset = function () {
            var i;
            var offset;
            // load first PRG-ROM of 16K
            offset = 0x10;
            for (i = 0; i < 0x4000; i += 1) {
                this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
            }
            // load last PRG-ROM of 16K
            offset = 0x10 + (this.bus.numPRom16K - 1) * 0x4000;
            for (i = 0; i < 0x4000; i += 1) {
                this.bus.cpu.memory[0xC000 + i] = this.bus.rom[offset + i];
            }
            // load VROM of 8K
            offset = 0x10 + this.bus.numPRom16K * 0x4000;
            if (this.bus.numVRom8K != 0) {
                for (i = 0; i < 0x2000; i += 1) {
                    this.bus.ppu.VRAM[i] = this.bus.rom[offset + i];
                }
            }
        };
        /**
         * Write.
         */
        Mapper0.prototype.write = function (addr, src) {
        };
        return Mapper0;
    }(anes.Node));
    anes.Mapper0 = Mapper0;
})(anes || (anes = {}));
/// <reference path="Node.ts" />
/// <reference path="Mapper.ts" />
var anes;
(function (anes) {
    //
    // This Mapper is MMC1
    //
    var Mapper1 = /** @class */ (function (_super) {
        __extends(Mapper1, _super);
        /**
         * Constructor.
         */
        function Mapper1(bus) {
            var _this = _super.call(this) || this;
            _this.bus = bus;
            _this.shiftReg = 0;
            _this.reg0 = -1;
            _this.reg1 = -1;
            _this.reg2 = -1;
            _this.reg3 = -1;
            _this.temp = 0;
            _this.romMode = 0;
            _this.b8kVRom = false;
            _this.VRomSize = 0;
            return _this;
        }
        /**
         * Reset.
         */
        Mapper1.prototype.reset = function () {
            var i;
            var offset;
            // load first PRG-ROM of 16K
            offset = 0x10;
            for (i = 0; i < 0x4000; i += 1) {
                this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
            }
            // load last PRG-ROM of 16K
            offset = 0x10 + ((this.bus.numPRom16K - 1) * 0x4000);
            for (i = 0; i < 0x4000; i += 1) {
                this.bus.cpu.memory[0xC000 + i] = this.bus.rom[offset + i];
            }
        };
        /**
         * Write.
         */
        Mapper1.prototype.write = function (addr, data) {
            var i;
            var offset;
            // reset by shift
            if (this.shiftReg == 5) {
                this.shiftReg = this.temp = 0;
            }
            // reset by bit
            if ((data & 0x80) != 0) {
                this.shiftReg = this.temp = 0;
                this.romMode = 3;
                return;
            }
            // shift data
            this.temp |= (data & 0x1) << this.shiftReg;
            this.shiftReg += 1;
            if (this.shiftReg < 5) {
                return;
            }
            // register 0(configuration)
            if (addr < 0xA000) {
                this.bus.mirrorV = !(this.temp & 0x1);
                this.bus.mirrorS = !(this.temp & 0x2);
                this.romMode = (this.temp & 0xC) >> 2;
                this.b8kVRom = !(this.temp & 0x10);
            }
            // register 1(swtich lower VROM of 4K or 8K)
            else if (addr < 0xC000) {
                this.temp &= 0x1F;
                if (this.reg1 == this.temp) {
                    return;
                }
                this.reg1 = this.temp;
                if (this.b8kVRom) {
                    offset = 0x10 + ((this.bus.numPRom16K * 0x4000) + ((this.reg1 % (this.bus.numVRom8K)) * 0x2000));
                    this.VRomSize = 0x2000;
                }
                else {
                    offset = 0x10 + ((this.bus.numPRom16K * 0x4000) + ((this.reg1 % (this.bus.numVRom8K * 2)) * 0x1000));
                    this.VRomSize = 0x1000;
                }
                for (i = 0; i < this.VRomSize; i += 1) {
                    this.bus.ppu.VRAM[i] = this.bus.rom[offset + i];
                }
            }
            // register 2(swtich upper VROM of 4K)
            else if (addr < 0xE000) {
                this.temp &= 0x1F;
                if (this.reg2 == this.temp) {
                    return;
                }
                this.reg2 = this.temp;
                if (this.b8kVRom) {
                    return;
                }
                offset = 0x10 + ((this.bus.numPRom16K * 0x4000) + ((this.reg2 % (this.bus.numVRom8K * 2)) * 0x1000));
                for (i = 0; i < 0x1000; i += 1) {
                    this.bus.ppu.VRAM[0x1000 + i] = this.bus.rom[offset + i];
                }
            }
            // register 3(swtich PRG-ROM bank)
            else {
                if (this.reg3 == this.temp) {
                    return;
                }
                this.reg3 = this.temp;
                if (this.romMode == 0 || this.romMode == 1) // switch 32K PRG-ROM
                 {
                    offset = 0x10 + ((this.reg3 >> 1 & 0x7) % (this.bus.numPRom16K / 2) * 0x8000);
                    for (i = 0; i < 0x8000; i += 1) {
                        this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
                    }
                }
                else if (this.romMode == 2) // switch upper PRG-ROM of 16K
                 {
                    offset = 0x10 + ((this.reg3 % this.bus.numPRom16K) * 0x4000);
                    for (i = 0; i < 0x4000; i += 1) {
                        this.bus.cpu.memory[0xC000 + i] = this.bus.rom[offset + i];
                    }
                }
                else if (this.romMode == 3) // switch lower PRG-ROM of 16K
                 {
                    offset = 0x10 + ((this.reg3 % this.bus.numPRom16K) * 0x4000);
                    for (i = 0; i < 0x4000; i += 1) {
                        this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
                    }
                }
            }
        };
        return Mapper1;
    }(anes.Node));
    anes.Mapper1 = Mapper1;
})(anes || (anes = {}));
/// <reference path="Node.ts" />
/// <reference path="Mapper.ts" />
var anes;
(function (anes) {
    var Mapper2 = /** @class */ (function (_super) {
        __extends(Mapper2, _super);
        /**
         * Constructor.
         */
        function Mapper2(bus) {
            var _this = _super.call(this) || this;
            _this.bus = bus;
            _this.reg = -1;
            return _this;
        }
        /**
         * Reset.
         */
        Mapper2.prototype.reset = function () {
            var i;
            var offset;
            // load first PRG-ROM of 16K
            offset = 0x10;
            for (i = 0; i < 0x4000; i += 1) {
                this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
            }
            // load last PRG-ROM of 16K
            offset = 0x10 + (this.bus.numPRom16K - 1) * 0x4000;
            for (i = 0; i < 0x4000; i += 1) {
                this.bus.cpu.memory[0xC000 + i] = this.bus.rom[offset + i];
            }
        };
        /**
         * Write.
         */
        Mapper2.prototype.write = function (addr, src) {
            if (this.reg == src) {
                return;
            }
            this.reg = src;
            var i;
            var offset;
            // switch lower PRG-ROM of 16K
            offset = 0x10 + ((src % this.bus.numPRom16K) * 0x4000);
            for (i = 0; i < 0x4000; i += 1) {
                this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
            }
        };
        return Mapper2;
    }(anes.Node));
    anes.Mapper2 = Mapper2;
})(anes || (anes = {}));
/// <reference path="Node.ts" />
/// <reference path="Mapper.ts" />
var anes;
(function (anes) {
    var Mapper3 = /** @class */ (function (_super) {
        __extends(Mapper3, _super);
        /**
         * Constructor.
         */
        function Mapper3(bus) {
            var _this = _super.call(this) || this;
            _this.bus = bus;
            _this.reg = -1;
            return _this;
        }
        /**
         * Reset.
         */
        Mapper3.prototype.reset = function () {
            var i;
            var offset;
            // load first PRG-ROM of 16K
            offset = 0x10;
            for (i = 0; i < 0x4000; i += 1) {
                this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
            }
            // load last PRG-ROM of 16K
            offset = 0x10 + (this.bus.numPRom16K - 1) * 0x4000;
            for (i = 0; i < 0x4000; i += 1) {
                this.bus.cpu.memory[0xC000 + i] = this.bus.rom[offset + i];
            }
            // load VROM of 8K
            offset = 0x10 + this.bus.numPRom16K * 0x4000;
            for (i = 0; i < 0x2000; i += 1) {
                this.bus.ppu.VRAM[i] = this.bus.rom[offset + i];
            }
        };
        /**
         * Write.
         */
        Mapper3.prototype.write = function (addr, src) {
            if (this.reg == src) {
                return;
            }
            this.reg = src;
            var i;
            var offset;
            // switch 8K VROM
            offset = 0x10 + (this.bus.numPRom16K * 0x4000) + ((src % this.bus.numVRom8K) * 0x2000);
            for (i = 0; i < 0x2000; i += 1) {
                this.bus.ppu.VRAM[i] = this.bus.rom[offset + i];
            }
        };
        return Mapper3;
    }(anes.Node));
    anes.Mapper3 = Mapper3;
})(anes || (anes = {}));
/// <reference path="Node.ts" />
/// <reference path="Mapper.ts" />
var anes;
(function (anes) {
    var Mapper4 = /** @class */ (function (_super) {
        __extends(Mapper4, _super);
        /**
         * Constructor.
         */
        function Mapper4(bus) {
            var _this = _super.call(this) || this;
            _this.reg = new Int32Array(8);
            _this.nPRGIndex = new Int32Array(2);
            _this.nCHRIndex = new Int32Array(8);
            _this.nIRQLatch = 0xFF;
            _this.nIRQCounter = 0;
            _this.nIRQEnable = 0;
            _this.nIRQPreset = 0;
            _this.nIRQPresetVbl = 0;
            _this.Mapper4_CPU_Page = new Int32Array(4);
            _this.Mapper4_PPU_Page = new Int32Array(12);
            //public PPU_MEM_BANK: Int32Array = new Int32Array(12);
            //public CPU_MEM_BANK: Int32Array = new Int32Array(8);
            _this.CRAM = new Int32Array(32 * 1024);
            _this.VRAM = new Int32Array(4 * 1024);
            _this.bus = bus;
            return _this;
        }
        Mapper4.prototype.Mapper004_SetCPUBank = function () {
            if (this.reg[0] & 0x40) {
                this.SetPROM_32K_BankB(this.bus.numPRom8K - 2, this.nPRGIndex[1], this.nPRGIndex[0], this.bus.numPRom8K - 1);
                this.Mapper4_CPU_Page[0] = this.bus.numPRom8K - 2;
                this.Mapper4_CPU_Page[1] = this.nPRGIndex[1];
                this.Mapper4_CPU_Page[2] = this.nPRGIndex[0];
                this.Mapper4_CPU_Page[3] = this.bus.numPRom8K - 1;
            }
            else {
                this.SetPROM_32K_BankB(this.nPRGIndex[0], this.nPRGIndex[1], this.bus.numPRom8K - 2, this.bus.numPRom8K - 1);
                this.Mapper4_CPU_Page[0] = this.nPRGIndex[0];
                this.Mapper4_CPU_Page[1] = this.nPRGIndex[1];
                this.Mapper4_CPU_Page[2] = this.bus.numPRom8K - 2;
                this.Mapper4_CPU_Page[3] = this.bus.numPRom8K - 1;
            }
        };
        Mapper4.prototype.Mapper004_SetPPUBank = function () {
            if (this.bus.numVRom1K) {
                if (this.reg[0] & 0x80) {
                    this.SetVROM_8K_BankB(this.nCHRIndex[4], this.nCHRIndex[5], this.nCHRIndex[6], this.nCHRIndex[7], this.nCHRIndex[0], this.nCHRIndex[1], this.nCHRIndex[2], this.nCHRIndex[3]);
                    this.Mapper4_PPU_Page[0] = this.nCHRIndex[4];
                    this.Mapper4_PPU_Page[1] = this.nCHRIndex[5];
                    this.Mapper4_PPU_Page[2] = this.nCHRIndex[6];
                    this.Mapper4_PPU_Page[3] = this.nCHRIndex[7];
                    this.Mapper4_PPU_Page[4] = this.nCHRIndex[0];
                    this.Mapper4_PPU_Page[5] = this.nCHRIndex[1];
                    this.Mapper4_PPU_Page[6] = this.nCHRIndex[2];
                    this.Mapper4_PPU_Page[7] = this.nCHRIndex[3];
                }
                else {
                    this.SetVROM_8K_BankB(this.nCHRIndex[0], this.nCHRIndex[1], this.nCHRIndex[2], this.nCHRIndex[3], this.nCHRIndex[4], this.nCHRIndex[5], this.nCHRIndex[6], this.nCHRIndex[7]);
                    this.Mapper4_PPU_Page[0] = this.nCHRIndex[0];
                    this.Mapper4_PPU_Page[1] = this.nCHRIndex[1];
                    this.Mapper4_PPU_Page[2] = this.nCHRIndex[2];
                    this.Mapper4_PPU_Page[3] = this.nCHRIndex[3];
                    this.Mapper4_PPU_Page[4] = this.nCHRIndex[4];
                    this.Mapper4_PPU_Page[5] = this.nCHRIndex[5];
                    this.Mapper4_PPU_Page[6] = this.nCHRIndex[6];
                    this.Mapper4_PPU_Page[7] = this.nCHRIndex[7];
                }
            }
            else {
                if (this.reg[0] & 0x80) {
                    this.SetCRAM_1K_Bank(0, this.nCHRIndex[4] & 0x07);
                    this.SetCRAM_1K_Bank(1, this.nCHRIndex[5] & 0x07);
                    this.SetCRAM_1K_Bank(2, this.nCHRIndex[6] & 0x07);
                    this.SetCRAM_1K_Bank(3, this.nCHRIndex[7] & 0x07);
                    this.SetCRAM_1K_Bank(4, this.nCHRIndex[0] & 0x07);
                    this.SetCRAM_1K_Bank(5, this.nCHRIndex[1] & 0x07);
                    this.SetCRAM_1K_Bank(6, this.nCHRIndex[2] & 0x07);
                    this.SetCRAM_1K_Bank(7, this.nCHRIndex[3] & 0x07);
                    this.Mapper4_PPU_Page[0] = (this.nCHRIndex[4] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[1] = (this.nCHRIndex[5] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[2] = (this.nCHRIndex[6] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[3] = (this.nCHRIndex[7] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[4] = (this.nCHRIndex[0] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[5] = (this.nCHRIndex[1] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[6] = (this.nCHRIndex[2] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[7] = (this.nCHRIndex[3] & 0x07) | 0x80000000;
                }
                else {
                    this.SetCRAM_1K_Bank(0, this.nCHRIndex[0] & 0x07);
                    this.SetCRAM_1K_Bank(1, this.nCHRIndex[1] & 0x07);
                    this.SetCRAM_1K_Bank(2, this.nCHRIndex[2] & 0x07);
                    this.SetCRAM_1K_Bank(3, this.nCHRIndex[3] & 0x07);
                    this.SetCRAM_1K_Bank(4, this.nCHRIndex[4] & 0x07);
                    this.SetCRAM_1K_Bank(5, this.nCHRIndex[5] & 0x07);
                    this.SetCRAM_1K_Bank(6, this.nCHRIndex[6] & 0x07);
                    this.SetCRAM_1K_Bank(7, this.nCHRIndex[7] & 0x07);
                    this.Mapper4_PPU_Page[0] = (this.nCHRIndex[0] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[1] = (this.nCHRIndex[1] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[2] = (this.nCHRIndex[2] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[3] = (this.nCHRIndex[3] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[4] = (this.nCHRIndex[4] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[5] = (this.nCHRIndex[5] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[6] = (this.nCHRIndex[6] & 0x07) | 0x80000000;
                    this.Mapper4_PPU_Page[7] = (this.nCHRIndex[7] & 0x07) | 0x80000000;
                }
            }
        };
        /**
         * Reset.
         */
        Mapper4.prototype.reset = function () {
            var i;
            for (i = 0; i < 8; i++) {
                this.reg[i] = 0x00;
            }
            this.nPRGIndex[0] = 0;
            this.nPRGIndex[1] = 1;
            this.Mapper004_SetCPUBank();
            for (i = 0; i < 8; i++) {
                this.nCHRIndex[i] = i;
            }
            this.Mapper004_SetPPUBank();
            this.nIRQCounter = 0;
        };
        /**
         * Write.
         */
        Mapper4.prototype.write = function (addr, data) {
            switch (addr & 0xE001) {
                case 0x8000:
                    this.reg[0] = data;
                    this.Mapper004_SetCPUBank();
                    this.Mapper004_SetPPUBank();
                    break;
                case 0x8001:
                    this.reg[1] = data;
                    switch (this.reg[0] & 0x07) {
                        case 0:
                            this.nCHRIndex[0] = data & 0xFE;
                            this.nCHRIndex[1] = this.nCHRIndex[0] + 1;
                            this.Mapper004_SetPPUBank();
                            break;
                        case 1:
                            this.nCHRIndex[2] = data & 0xFE;
                            this.nCHRIndex[3] = this.nCHRIndex[2] + 1;
                            this.Mapper004_SetPPUBank();
                            break;
                        case 2:
                            this.nCHRIndex[4] = data;
                            this.Mapper004_SetPPUBank();
                            break;
                        case 3:
                            this.nCHRIndex[5] = data;
                            this.Mapper004_SetPPUBank();
                            break;
                        case 4:
                            this.nCHRIndex[6] = data;
                            this.Mapper004_SetPPUBank();
                            break;
                        case 5:
                            this.nCHRIndex[7] = data;
                            this.Mapper004_SetPPUBank();
                            break;
                        case 6:
                            this.nPRGIndex[0] = data;
                            this.Mapper004_SetCPUBank();
                            break;
                        case 7:
                            this.nPRGIndex[1] = data;
                            this.Mapper004_SetCPUBank();
                            break;
                    }
                    break;
                case 0xA000:
                    this.reg[2] = data;
                    if (data & 0x01) {
                        this.SetNameTable_Bank(0, 0, 1, 1);
                        this.Mapper4_PPU_Page[8] = 0;
                        this.Mapper4_PPU_Page[9] = 0;
                        this.Mapper4_PPU_Page[10] = 1;
                        this.Mapper4_PPU_Page[11] = 1;
                    }
                    else {
                        this.SetNameTable_Bank(0, 1, 0, 1);
                        this.Mapper4_PPU_Page[8] = 0;
                        this.Mapper4_PPU_Page[9] = 1;
                        this.Mapper4_PPU_Page[10] = 0;
                        this.Mapper4_PPU_Page[11] = 1;
                    }
                    break;
                case 0xA001:
                    this.reg[3] = data;
                    break;
                case 0xC000:
                    this.reg[4] = data;
                    this.nIRQLatch = data;
                    break;
                case 0xC001:
                    this.reg[5] = data;
                    this.nIRQCounter |= 0x80;
                    this.nIRQPresetVbl = 0xFF;
                    this.nIRQPreset = 0;
                    break;
                case 0xE000:
                    this.reg[6] = data;
                    this.nIRQEnable = 0;
                    break;
                case 0xE001:
                    this.reg[7] = data;
                    this.nIRQEnable = 1;
                    break;
            }
        };
        Mapper4.prototype.Mapper004_HSync = function (nScanline) {
            var bIsDispOn = this.bus.ppu.m_REG[1] & (0x08 | 0x10);
            if ((nScanline >= 0 && nScanline <= 239) && bIsDispOn) {
                if (this.nIRQPresetVbl) {
                    this.nIRQCounter = this.nIRQLatch;
                    this.nIRQPresetVbl = 0;
                }
                if (this.nIRQPreset) {
                    this.nIRQCounter = this.nIRQLatch;
                    this.nIRQPreset = 0;
                }
                else if (this.nIRQCounter > 0) {
                    this.nIRQCounter--;
                }
                if (this.nIRQCounter == 0) {
                    if (this.nIRQEnable) {
                        this.nIRQPreset = 0xFF;
                    }
                    this.nIRQPreset = 0xFF;
                }
            }
        };
        Mapper4.prototype.Mapper004_SaveDoc = function () {
        };
        Mapper4.prototype.Mapper004_LoadDoc = function () {
        };
        Mapper4.prototype.SetPROM_8K_Bank = function (page, bank) {
            bank %= this.bus.numPRom8K;
            //this.CPU_MEM_BANK[page] = this.bus.PRGBlock + 0x2000 * bank;
            //this.CPU_MEM_BANK[page] = this.bus.PRGBlock.subarray(0x2000 * bank);
        };
        Mapper4.prototype.SetPROM_16K_Bank = function (page, bank) {
            this.SetPROM_8K_Bank(page + 0, bank * 2 + 0);
            this.SetPROM_8K_Bank(page + 1, bank * 2 + 1);
        };
        Mapper4.prototype.SetPROM_32K_Bank = function (bank) {
            this.SetPROM_8K_Bank(4, bank * 4 + 0);
            this.SetPROM_8K_Bank(5, bank * 4 + 1);
            this.SetPROM_8K_Bank(6, bank * 4 + 2);
            this.SetPROM_8K_Bank(7, bank * 4 + 3);
        };
        Mapper4.prototype.SetPROM_32K_BankB = function (bank0, bank1, bank2, bank3) {
            this.SetPROM_8K_Bank(4, bank0);
            this.SetPROM_8K_Bank(5, bank1);
            this.SetPROM_8K_Bank(6, bank2);
            this.SetPROM_8K_Bank(7, bank3);
        };
        Mapper4.prototype.SetVROM_1K_Bank = function (page, bank) {
            bank %= this.bus.numVRom1K;
            //this.PPU_MEM_BANK[page] = this.bus.PatternTable + 0x0400 * bank;
        };
        Mapper4.prototype.SetVROM_2K_Bank = function (page, bank) {
            this.SetVROM_1K_Bank(page + 0, bank * 2 + 0);
            this.SetVROM_1K_Bank(page + 1, bank * 2 + 1);
        };
        Mapper4.prototype.SetVROM_4K_Bank = function (page, bank) {
            this.SetVROM_1K_Bank(page + 0, bank * 4 + 0);
            this.SetVROM_1K_Bank(page + 1, bank * 4 + 1);
            this.SetVROM_1K_Bank(page + 2, bank * 4 + 2);
            this.SetVROM_1K_Bank(page + 3, bank * 4 + 3);
        };
        Mapper4.prototype.SetVROM_8K_Bank = function (bank) {
            for (var i = 0; i < 8; i++) {
                this.SetVROM_1K_Bank(i, bank * 8 + i);
            }
        };
        Mapper4.prototype.SetVROM_8K_BankB = function (bank0, bank1, bank2, bank3, bank4, bank5, bank6, bank7) {
            this.SetVROM_1K_Bank(0, bank0);
            this.SetVROM_1K_Bank(1, bank1);
            this.SetVROM_1K_Bank(2, bank2);
            this.SetVROM_1K_Bank(3, bank3);
            this.SetVROM_1K_Bank(4, bank4);
            this.SetVROM_1K_Bank(5, bank5);
            this.SetVROM_1K_Bank(6, bank6);
            this.SetVROM_1K_Bank(7, bank7);
        };
        Mapper4.prototype.SetCRAM_1K_Bank = function (page, bank) {
            bank &= 0x1F;
            //this.PPU_MEM_BANK[page] = this.CRAM + 0x0400 * bank;
        };
        Mapper4.prototype.SetCRAM_4K_Bank = function (page, bank) {
            this.SetCRAM_1K_Bank(page + 0, bank * 4 + 0);
            this.SetCRAM_1K_Bank(page + 1, bank * 4 + 1);
            this.SetCRAM_1K_Bank(page + 2, bank * 4 + 2);
            this.SetCRAM_1K_Bank(page + 3, bank * 4 + 3);
        };
        Mapper4.prototype.SetCRAM_8K_Bank = function (bank) {
            for (var i = 0; i < 8; i++) {
                this.SetCRAM_1K_Bank(i, bank * 8 + i);
            }
        };
        Mapper4.prototype.SetVRAM_1K_Bank = function (page, bank) {
            bank &= 3;
            //this.PPU_MEM_BANK[page] = this.VRAM + 0x0400 * bank;
        };
        Mapper4.prototype.SetNameTable_Bank = function (bank0, bank1, bank2, bank3) {
            this.SetVRAM_1K_Bank(8, bank0);
            this.SetVRAM_1K_Bank(9, bank1);
            this.SetVRAM_1K_Bank(10, bank2);
            this.SetVRAM_1K_Bank(11, bank3);
        };
        return Mapper4;
    }(anes.Node));
    anes.Mapper4 = Mapper4;
})(anes || (anes = {}));
/// <reference path="Node.ts" />
var anes;
(function (anes) {
    var PPU = /** @class */ (function (_super) {
        __extends(PPU, _super);
        /**
         * Constructor.
         */
        function PPU(bus) {
            var _this = _super.call(this) || this;
            /**
             * Registers.
             */
            // ------------ 2000
            /* bit2 */
            _this.offset32 = 0; // nt_addr offset value
            /* bit3 */
            _this.SPHeadAddr = 0; // sprite start adderess - 0: 0x0000, 1: 0x1000
            /* bit4 */
            _this.BGHeadAddr = 0; // background start address - 0: 0x0000, 1: 0x1000
            /* bit5 */
            _this._8x16 = false; // big sprite flag - 0: 8x8 sprite, 1: 8x16 sprite
            /* bit7 */
            _this.NMI = false; // NMI flag - 0: on, 1: off
            // ------------ 2001
            /* bit0 */
            _this.BWColor = false; // [no uesd] - color flag - 0: color, 1:b&w 0
            /* bit1 */
            _this.BGL1Col = false; // [no uesd] - left 1 of background flag - 0: hidden, 1: show
            /* bit2 */
            _this.SPL1Col = false; // [no uesd] - left 1 of sprite flag - 0: hidden, 1: show
            /* bit3 */
            _this.hideBG = false; // background flag - 0: hidden, 1: show
            /* bit4 */
            _this.hideSP = false; // sprite flag - 0: hidden, 1: show
            /* point[5-7] */
            _this.lightness = 0; // [no uesd]
            // ------------ 2002
            /* bit4 */
            _this.ignoreWrite = false; // [no uesd] - ignore writ to VRAM flag
            /* bit5 */
            _this.more8Sprite = false; // [no uesd] - scan over 8 sprites flag
            /* bit6 */
            _this.hit = false; // collision detection flag
            /* bit7 */
            _this.VBlank = false; // VBlank flag
            // ------------ 2003
            _this.reg2003 = 0;
            // ------------ 2005 & 2006 shared flag
            _this.toggle = false;
            // ------------ 2006
            _this.reg2006 = 0; // Counter
            // ------------ 2007
            _this.readBuffer = 0; // VRAM read buffer, read address #2007 is invalid in first
            _this.scanline = 0; // Current Scan Line
            _this.forcedVBlank = false; // Forced VBlank	
            _this.regTemp = 0; // temporary register
            _this.FV = 0; // fine vertical
            _this.VT = 0; // vertical tile index
            _this.HT = 0; // horizontal tile index
            _this.V = 0; // vertical table index
            _this.H = 0; // horizontal table index
            _this.VH = 0;
            _this.FH = 0; // fine horizontal
            /**
             * Temporary variables
             */
            _this.topX = 0;
            _this.topY = 0;
            _this.sp_H = 0;
            _this.sp0_Y = 0;
            _this.sp0_X = 0;
            // name table
            _this.nt_addr = 0;
            // attribute table
            _this.groupRow = 0;
            _this.squareRow = 0;
            _this.sq_index = 0;
            _this.at_addr = 0;
            // pattern table
            _this.pt_addr = 0;
            _this.pt0_data = 0;
            _this.pt1_data = 0;
            // point attributes
            _this.point = 0;
            _this.point_row = 0;
            _this.l_bit_pal = 0; // lower image palette address
            _this.u_bit_pal = 0; // upper image palette address
            _this.pal_index = 0; // image palette address
            _this.pal_data = 0; // image palette value
            // sprite attributes
            _this.pt0_row = 0;
            _this.pt1_row = 0;
            _this.pt_index = 0;
            _this.sp_at = 0;
            _this.foreground = false;
            _this.flipH = false;
            _this.flipV = false;
            _this.fitX = 0;
            _this.fitY = 0;
            _this.bitX = 0;
            _this.bitY = 0;
            _this.bgPoint = 0;
            _this.renderedFrames = 0; // rendered frames
            _this.ENC = 0; // used time that enter NMI interrupt - 7 CC
            _this.m_REG = new Int32Array(4);
            _this.bus = bus;
            _this.hideBG = true;
            _this.hideSP = true;
            //----------------------------------------------------
            _this.VRAM = new Int32Array(0x10000);
            _this.SRAM = new Int32Array(0x100);
            _this.output = new Uint32Array(256 * 240);
            //----------------------------------------------------
            _this.background = new Int32Array(256 * 240);
            _this.sprite0 = new Int32Array(0x80);
            _this.SM0 = new Int32Array([0x03, 0x03, 0x0C, 0x0C, 0x03, 0x03, 0x0C, 0x0C, 0x30, 0x30, 0xC0, 0xC0, 0x30, 0x30, 0xC0, 0xC0]);
            _this.SM1 = new Int32Array([0, 0, 2, 2, 0, 0, 2, 2, 4, 4, 6, 6, 4, 4, 6, 6]);
            //----------------------------------------------------
            _this.pt0_vt = new Int32Array(16);
            _this.pt1_vt = new Int32Array(16);
            return _this;
        }
        /**
         * Render line
         * @return next scanline number
         */
        PPU.prototype.renderLine = function () {
            if (this.scanline == 0) // initial render line
             {
                // 1.init flag
                this.VBlank = false;
                this.hit = false;
                this.more8Sprite = false;
                // 2.update counter
                if (!this.hideBG || !this.hideSP) {
                    this.reg2006 = this.regTemp;
                }
                this.renderSprite0();
            }
            else if (this.scanline >= 1 && this.scanline <= 240) // start render line
             {
                // If both "hideBG" and "hideSP" are true, then enter "VBlank" mode
                if (this.hideBG && this.hideSP) {
                    this.renderBackgroundColor();
                    this.forcedVBlank = true;
                }
                else if (this.hideBG) {
                    this.renderBackgroundColor();
                }
                else {
                    if (this.forcedVBlank) {
                        this.reg2006 = this.regTemp;
                        this.forcedVBlank = false;
                    }
                    this.renderBackground();
                }
            }
            else if (this.scanline == 241) // end render line
             {
                if (!this.hideSP) {
                    this.renderSprite();
                }
                // 1.set flag
                this.VBlank = true;
                // 2.create a interrupt
                if (this.NMI) {
                    this.ENC = 7; // enter NMI must spend 7 CC
                }
            }
            else if (this.scanline == 261) // end frame line
             {
                this.scanline = -1;
                this.renderedFrames += 1;
            }
            // increase line
            this.scanline += 1;
            return this.scanline;
        };
        /**
         * Render background color.
         */
        PPU.prototype.renderBackgroundColor = function () {
            var drawLine = this.scanline - 1;
            this.point_row = drawLine * 256;
            var bgColor = this.bus.pal[this.VRAM[0x3F00]];
            for (var i = 0; i < 256; i += 1) {
                this.point = this.point_row + i;
                this.output[this.point] = bgColor;
                this.background[this.point] = 0;
            }
        };
        /**
         * Render background.
         */
        PPU.prototype.renderBackground = function () {
            var drawLine = this.scanline - 1;
            // parse counter
            this.FV = (this.reg2006 & 0x7000) >> 12;
            this.V = (this.reg2006 & 0x0800) >> 11;
            this.H = (this.reg2006 & 0x0400) >> 10;
            this.VT = (this.reg2006 & 0x03E0) >> 5;
            this.HT = this.reg2006 & 0x001F;
            // update counter
            this.H = (this.regTemp & 0x0400) >> 10;
            this.HT = this.regTemp & 0x001F;
            // initialize variable
            this.groupRow = (this.VT >> 2) * 8; // The 4x4 group that Tile is in
            this.squareRow = (this.VT & 0x03) * 4; // The 4x4 square that Tile is in
            this.point_row = drawLine * 256; // The row that the point is in
            var fineX = this.FH;
            var XRenderPoint = 0;
            // draw tile
            for (var times = 0; times < 33; times += 1) {
                this.VH = ((this.V << 11) + (this.H << 10)) + 0x2000;
                // 1.get name table
                this.nt_addr = (this.VH + this.HT) + (this.VT << 5);
                // 2.get attribute table
                this.at_addr = (this.VH + 0x3C0) + (this.groupRow + (this.HT >> 2));
                // 3.get pattern table
                this.pt_addr = (this.VRAM[this.nt_addr] << 4) + (this.BGHeadAddr + this.FV);
                // 4.get tile index
                this.sq_index = this.squareRow + (this.HT & 0x03);
                // 5.get upper 2 bits of palette
                this.u_bit_pal = (this.VRAM[this.at_addr] & this.SM0[this.sq_index]) >> this.SM1[this.sq_index];
                // 6.get character matrix
                this.pt0_data = this.VRAM[this.pt_addr];
                this.pt1_data = this.VRAM[this.pt_addr + 8];
                // 7.get the rendering start position
                this.point = this.point_row + XRenderPoint;
                // 8.get rendering X
                for (; fineX < 8; fineX += 1) {
                    // 1.get lower 2 bits of palette / backgroud matrix / 00 is background palette
                    this.l_bit_pal = ((this.pt1_data & 0x80 >> fineX) << 1 | (this.pt0_data & 0x80 >> fineX)) >> (7 - fineX);
                    // 2.get color of palette
                    this.pal_data = this.VRAM[0x3F00 + (this.u_bit_pal << 2 | this.l_bit_pal)];
                    // 3.save point of infomation
                    this.output[this.point] = this.bus.pal[this.pal_data];
                    this.background[this.point] = this.l_bit_pal; // use it in collision detection
                    // 4.move to next render point
                    this.point += 1;
                    XRenderPoint += 1;
                    if (XRenderPoint >= 256) {
                        times = 1000;
                        break;
                    }
                }
                // reset fine X
                fineX = 0;
                // update HT/H
                this.HT += 1;
                this.HT &= 31;
                if (!this.HT) {
                    this.H ^= 1;
                }
            }
            // update FV、VT、V
            this.FV += 1;
            this.FV &= 7;
            if (!this.FV) {
                this.VT += 1;
                // Tile Y只有30行，索引0开始到29
                if (this.VT == 30) {
                    this.VT = 0;
                    this.V ^= 1;
                }
                // 从30开始的值只递增不翻转V
                else if (this.VT == 32) {
                    this.VT = 0;
                }
            }
            // update counter
            this.reg2006 = (this.FV << 12) + (this.V << 11) + (this.H << 10) + (this.VT << 5) + this.HT;
            // collision detection
            if (!this.hit && drawLine < (this.sp0_Y + this.sp_H) && drawLine >= this.sp0_Y) {
                for (XRenderPoint = 0; XRenderPoint < 256; XRenderPoint += 1) {
                    if (XRenderPoint >= (this.sp0_X + 8)) {
                        break;
                    }
                    if (XRenderPoint >= this.sp0_X) {
                        if (this.sprite0[((drawLine - this.sp0_Y << 3) + (XRenderPoint - this.sp0_X))] != 0 && this.output[(this.point_row + XRenderPoint)] != 0) {
                            this.hit = true;
                            break;
                        }
                    }
                }
            }
        };
        /**
         * Render Sprite 0 for hit.
         */
        PPU.prototype.renderSprite0 = function () {
            // 1.get infomation
            this.sp0_Y = this.SRAM[0];
            this.pt_index = this.SRAM[1];
            this.sp_at = this.SRAM[2];
            this.sp0_X = this.SRAM[3];
            this.sp_H = 1 << 3 + (+this._8x16);
            // 2.parse attributes
            this.u_bit_pal = this.sp_at & 0x03;
            this.foreground = !(this.sp_at & 0x20);
            this.flipH = (this.sp_at & 0x40) > 0;
            this.flipV = (this.sp_at & 0x80) > 0;
            if (this._8x16) {
                if ((this.pt_index & 1) == 0) // even number
                 {
                    // 1.get pattern table
                    this.pt_addr = this.pt_index << 4;
                    // 2.get matrix
                    this.pt0_vt[0x0] = this.VRAM[this.pt_addr + 0x00];
                    this.pt1_vt[0x0] = this.VRAM[this.pt_addr + 0x08];
                    this.pt0_vt[0x1] = this.VRAM[this.pt_addr + 0x01];
                    this.pt1_vt[0x1] = this.VRAM[this.pt_addr + 0x09];
                    this.pt0_vt[0x2] = this.VRAM[this.pt_addr + 0x02];
                    this.pt1_vt[0x2] = this.VRAM[this.pt_addr + 0x0A];
                    this.pt0_vt[0x3] = this.VRAM[this.pt_addr + 0x03];
                    this.pt1_vt[0x3] = this.VRAM[this.pt_addr + 0x0B];
                    this.pt0_vt[0x4] = this.VRAM[this.pt_addr + 0x04];
                    this.pt1_vt[0x4] = this.VRAM[this.pt_addr + 0x0C];
                    this.pt0_vt[0x5] = this.VRAM[this.pt_addr + 0x05];
                    this.pt1_vt[0x5] = this.VRAM[this.pt_addr + 0x0D];
                    this.pt0_vt[0x6] = this.VRAM[this.pt_addr + 0x06];
                    this.pt1_vt[0x6] = this.VRAM[this.pt_addr + 0x0E];
                    this.pt0_vt[0x7] = this.VRAM[this.pt_addr + 0x07];
                    this.pt1_vt[0x7] = this.VRAM[this.pt_addr + 0x0F];
                    this.pt0_vt[0x8] = this.VRAM[this.pt_addr + 0x10];
                    this.pt1_vt[0x8] = this.VRAM[this.pt_addr + 0x18];
                    this.pt0_vt[0x9] = this.VRAM[this.pt_addr + 0x11];
                    this.pt1_vt[0x9] = this.VRAM[this.pt_addr + 0x19];
                    this.pt0_vt[0xA] = this.VRAM[this.pt_addr + 0x12];
                    this.pt1_vt[0xA] = this.VRAM[this.pt_addr + 0x1A];
                    this.pt0_vt[0xB] = this.VRAM[this.pt_addr + 0x13];
                    this.pt1_vt[0xB] = this.VRAM[this.pt_addr + 0x1B];
                    this.pt0_vt[0xC] = this.VRAM[this.pt_addr + 0x14];
                    this.pt1_vt[0xC] = this.VRAM[this.pt_addr + 0x1C];
                    this.pt0_vt[0xD] = this.VRAM[this.pt_addr + 0x15];
                    this.pt1_vt[0xD] = this.VRAM[this.pt_addr + 0x1D];
                    this.pt0_vt[0xE] = this.VRAM[this.pt_addr + 0x16];
                    this.pt1_vt[0xE] = this.VRAM[this.pt_addr + 0x1E];
                    this.pt0_vt[0xF] = this.VRAM[this.pt_addr + 0x17];
                    this.pt1_vt[0xF] = this.VRAM[this.pt_addr + 0x1F];
                }
                else // odd number
                 {
                    // 1.get pattern table
                    this.pt_addr = 0x1000 + ((this.pt_index & 0xFE) << 4);
                    // 2.get matrix
                    this.pt0_vt[0x0] = this.VRAM[this.pt_addr + 0x00];
                    this.pt1_vt[0x0] = this.VRAM[this.pt_addr + 0x08];
                    this.pt0_vt[0x1] = this.VRAM[this.pt_addr + 0x01];
                    this.pt1_vt[0x1] = this.VRAM[this.pt_addr + 0x09];
                    this.pt0_vt[0x2] = this.VRAM[this.pt_addr + 0x02];
                    this.pt1_vt[0x2] = this.VRAM[this.pt_addr + 0x0A];
                    this.pt0_vt[0x3] = this.VRAM[this.pt_addr + 0x03];
                    this.pt1_vt[0x3] = this.VRAM[this.pt_addr + 0x0B];
                    this.pt0_vt[0x4] = this.VRAM[this.pt_addr + 0x04];
                    this.pt1_vt[0x4] = this.VRAM[this.pt_addr + 0x0C];
                    this.pt0_vt[0x5] = this.VRAM[this.pt_addr + 0x05];
                    this.pt1_vt[0x5] = this.VRAM[this.pt_addr + 0x0D];
                    this.pt0_vt[0x6] = this.VRAM[this.pt_addr + 0x06];
                    this.pt1_vt[0x6] = this.VRAM[this.pt_addr + 0x0E];
                    this.pt0_vt[0x7] = this.VRAM[this.pt_addr + 0x07];
                    this.pt1_vt[0x7] = this.VRAM[this.pt_addr + 0x0F];
                    this.pt0_vt[0x8] = this.VRAM[this.pt_addr + 0x10];
                    this.pt1_vt[0x8] = this.VRAM[this.pt_addr + 0x18];
                    this.pt0_vt[0x9] = this.VRAM[this.pt_addr + 0x11];
                    this.pt1_vt[0x9] = this.VRAM[this.pt_addr + 0x19];
                    this.pt0_vt[0xA] = this.VRAM[this.pt_addr + 0x12];
                    this.pt1_vt[0xA] = this.VRAM[this.pt_addr + 0x1A];
                    this.pt0_vt[0xB] = this.VRAM[this.pt_addr + 0x13];
                    this.pt1_vt[0xB] = this.VRAM[this.pt_addr + 0x1B];
                    this.pt0_vt[0xC] = this.VRAM[this.pt_addr + 0x14];
                    this.pt1_vt[0xC] = this.VRAM[this.pt_addr + 0x1C];
                    this.pt0_vt[0xD] = this.VRAM[this.pt_addr + 0x15];
                    this.pt1_vt[0xD] = this.VRAM[this.pt_addr + 0x1D];
                    this.pt0_vt[0xE] = this.VRAM[this.pt_addr + 0x16];
                    this.pt1_vt[0xE] = this.VRAM[this.pt_addr + 0x1E];
                    this.pt0_vt[0xF] = this.VRAM[this.pt_addr + 0x17];
                    this.pt1_vt[0xF] = this.VRAM[this.pt_addr + 0x1F];
                }
            }
            else {
                // 1.get pattern table
                this.pt_addr = this.SPHeadAddr + (this.pt_index << 4);
                // 2.get matrix
                this.pt0_vt[0x0] = this.VRAM[this.pt_addr + 0x00];
                this.pt1_vt[0x0] = this.VRAM[this.pt_addr + 0x08];
                this.pt0_vt[0x1] = this.VRAM[this.pt_addr + 0x01];
                this.pt1_vt[0x1] = this.VRAM[this.pt_addr + 0x09];
                this.pt0_vt[0x2] = this.VRAM[this.pt_addr + 0x02];
                this.pt1_vt[0x2] = this.VRAM[this.pt_addr + 0x0A];
                this.pt0_vt[0x3] = this.VRAM[this.pt_addr + 0x03];
                this.pt1_vt[0x3] = this.VRAM[this.pt_addr + 0x0B];
                this.pt0_vt[0x4] = this.VRAM[this.pt_addr + 0x04];
                this.pt1_vt[0x4] = this.VRAM[this.pt_addr + 0x0C];
                this.pt0_vt[0x5] = this.VRAM[this.pt_addr + 0x05];
                this.pt1_vt[0x5] = this.VRAM[this.pt_addr + 0x0D];
                this.pt0_vt[0x6] = this.VRAM[this.pt_addr + 0x06];
                this.pt1_vt[0x6] = this.VRAM[this.pt_addr + 0x0E];
                this.pt0_vt[0x7] = this.VRAM[this.pt_addr + 0x07];
                this.pt1_vt[0x7] = this.VRAM[this.pt_addr + 0x0F];
            }
            // 3.render it
            for (var spY = 0; spY < this.sp_H; spY += 1) {
                // offset Y
                this.flipV ? this.fitY = (this.sp_H - 1) - spY : this.fitY = spY; // flip vertical
                this.pt0_row = this.pt0_vt[this.fitY]; // 对应字模0
                this.pt1_row = this.pt1_vt[this.fitY]; // 对应字模1
                for (var spX = 0; spX < 8; spX += 1) {
                    // offset X
                    this.flipH ? this.fitX = 7 - spX : this.fitX = spX; // flip horizintal
                    this.point = spY * 8 + spX; // current render point
                    this.l_bit_pal = ((this.pt1_row & 0x80 >> this.fitX) << 1 | (this.pt0_row & 0x80 >> this.fitX)) >> (7 - this.fitX);
                    this.sprite0[this.point] = this.l_bit_pal;
                }
            }
        };
        /**
         * Render sprite.
         */
        PPU.prototype.renderSprite = function () {
            // from Sprite 63 start
            for (var index = 252; index >= 0; index -= 4) {
                // 1.get infomation
                this.topY = this.SRAM[index];
                this.pt_index = this.SRAM[index + 1];
                this.sp_at = this.SRAM[index + 2];
                this.topX = this.SRAM[index + 3];
                this.sp_H = 1 << 3 + (+this._8x16);
                // 2.parse attributes
                this.u_bit_pal = this.sp_at & 0x03;
                this.foreground = !(this.sp_at & 0x20); // foreground
                this.flipH = (this.sp_at & 0x40) > 0;
                this.flipV = (this.sp_at & 0x80) > 0;
                if (this._8x16) {
                    if ((this.pt_index & 1) == 0) //even number
                     {
                        // 1.get pattern table
                        this.pt_addr = this.pt_index << 4;
                        // 2.get matrix
                        this.pt0_vt[0x0] = this.VRAM[this.pt_addr + 0x00];
                        this.pt1_vt[0x0] = this.VRAM[this.pt_addr + 0x08];
                        this.pt0_vt[0x1] = this.VRAM[this.pt_addr + 0x01];
                        this.pt1_vt[0x1] = this.VRAM[this.pt_addr + 0x09];
                        this.pt0_vt[0x2] = this.VRAM[this.pt_addr + 0x02];
                        this.pt1_vt[0x2] = this.VRAM[this.pt_addr + 0x0A];
                        this.pt0_vt[0x3] = this.VRAM[this.pt_addr + 0x03];
                        this.pt1_vt[0x3] = this.VRAM[this.pt_addr + 0x0B];
                        this.pt0_vt[0x4] = this.VRAM[this.pt_addr + 0x04];
                        this.pt1_vt[0x4] = this.VRAM[this.pt_addr + 0x0C];
                        this.pt0_vt[0x5] = this.VRAM[this.pt_addr + 0x05];
                        this.pt1_vt[0x5] = this.VRAM[this.pt_addr + 0x0D];
                        this.pt0_vt[0x6] = this.VRAM[this.pt_addr + 0x06];
                        this.pt1_vt[0x6] = this.VRAM[this.pt_addr + 0x0E];
                        this.pt0_vt[0x7] = this.VRAM[this.pt_addr + 0x07];
                        this.pt1_vt[0x7] = this.VRAM[this.pt_addr + 0x0F];
                        this.pt0_vt[0x8] = this.VRAM[this.pt_addr + 0x10];
                        this.pt1_vt[0x8] = this.VRAM[this.pt_addr + 0x18];
                        this.pt0_vt[0x9] = this.VRAM[this.pt_addr + 0x11];
                        this.pt1_vt[0x9] = this.VRAM[this.pt_addr + 0x19];
                        this.pt0_vt[0xA] = this.VRAM[this.pt_addr + 0x12];
                        this.pt1_vt[0xA] = this.VRAM[this.pt_addr + 0x1A];
                        this.pt0_vt[0xB] = this.VRAM[this.pt_addr + 0x13];
                        this.pt1_vt[0xB] = this.VRAM[this.pt_addr + 0x1B];
                        this.pt0_vt[0xC] = this.VRAM[this.pt_addr + 0x14];
                        this.pt1_vt[0xC] = this.VRAM[this.pt_addr + 0x1C];
                        this.pt0_vt[0xD] = this.VRAM[this.pt_addr + 0x15];
                        this.pt1_vt[0xD] = this.VRAM[this.pt_addr + 0x1D];
                        this.pt0_vt[0xE] = this.VRAM[this.pt_addr + 0x16];
                        this.pt1_vt[0xE] = this.VRAM[this.pt_addr + 0x1E];
                        this.pt0_vt[0xF] = this.VRAM[this.pt_addr + 0x17];
                        this.pt1_vt[0xF] = this.VRAM[this.pt_addr + 0x1F];
                    }
                    else // odd number
                     {
                        // 1.get pattern table
                        this.pt_addr = 0x1000 + ((this.pt_index & 0xFE) << 4);
                        // 2.get matrix
                        this.pt0_vt[0x0] = this.VRAM[this.pt_addr + 0x00];
                        this.pt1_vt[0x0] = this.VRAM[this.pt_addr + 0x08];
                        this.pt0_vt[0x1] = this.VRAM[this.pt_addr + 0x01];
                        this.pt1_vt[0x1] = this.VRAM[this.pt_addr + 0x09];
                        this.pt0_vt[0x2] = this.VRAM[this.pt_addr + 0x02];
                        this.pt1_vt[0x2] = this.VRAM[this.pt_addr + 0x0A];
                        this.pt0_vt[0x3] = this.VRAM[this.pt_addr + 0x03];
                        this.pt1_vt[0x3] = this.VRAM[this.pt_addr + 0x0B];
                        this.pt0_vt[0x4] = this.VRAM[this.pt_addr + 0x04];
                        this.pt1_vt[0x4] = this.VRAM[this.pt_addr + 0x0C];
                        this.pt0_vt[0x5] = this.VRAM[this.pt_addr + 0x05];
                        this.pt1_vt[0x5] = this.VRAM[this.pt_addr + 0x0D];
                        this.pt0_vt[0x6] = this.VRAM[this.pt_addr + 0x06];
                        this.pt1_vt[0x6] = this.VRAM[this.pt_addr + 0x0E];
                        this.pt0_vt[0x7] = this.VRAM[this.pt_addr + 0x07];
                        this.pt1_vt[0x7] = this.VRAM[this.pt_addr + 0x0F];
                        this.pt0_vt[0x8] = this.VRAM[this.pt_addr + 0x10];
                        this.pt1_vt[0x8] = this.VRAM[this.pt_addr + 0x18];
                        this.pt0_vt[0x9] = this.VRAM[this.pt_addr + 0x11];
                        this.pt1_vt[0x9] = this.VRAM[this.pt_addr + 0x19];
                        this.pt0_vt[0xA] = this.VRAM[this.pt_addr + 0x12];
                        this.pt1_vt[0xA] = this.VRAM[this.pt_addr + 0x1A];
                        this.pt0_vt[0xB] = this.VRAM[this.pt_addr + 0x13];
                        this.pt1_vt[0xB] = this.VRAM[this.pt_addr + 0x1B];
                        this.pt0_vt[0xC] = this.VRAM[this.pt_addr + 0x14];
                        this.pt1_vt[0xC] = this.VRAM[this.pt_addr + 0x1C];
                        this.pt0_vt[0xD] = this.VRAM[this.pt_addr + 0x15];
                        this.pt1_vt[0xD] = this.VRAM[this.pt_addr + 0x1D];
                        this.pt0_vt[0xE] = this.VRAM[this.pt_addr + 0x16];
                        this.pt1_vt[0xE] = this.VRAM[this.pt_addr + 0x1E];
                        this.pt0_vt[0xF] = this.VRAM[this.pt_addr + 0x17];
                        this.pt1_vt[0xF] = this.VRAM[this.pt_addr + 0x1F];
                    }
                }
                else {
                    // 1.get pattern table
                    this.pt_addr = this.SPHeadAddr + (this.pt_index << 4);
                    // 2.get matrix
                    this.pt0_vt[0x0] = this.VRAM[this.pt_addr + 0x00];
                    this.pt1_vt[0x0] = this.VRAM[this.pt_addr + 0x08];
                    this.pt0_vt[0x1] = this.VRAM[this.pt_addr + 0x01];
                    this.pt1_vt[0x1] = this.VRAM[this.pt_addr + 0x09];
                    this.pt0_vt[0x2] = this.VRAM[this.pt_addr + 0x02];
                    this.pt1_vt[0x2] = this.VRAM[this.pt_addr + 0x0A];
                    this.pt0_vt[0x3] = this.VRAM[this.pt_addr + 0x03];
                    this.pt1_vt[0x3] = this.VRAM[this.pt_addr + 0x0B];
                    this.pt0_vt[0x4] = this.VRAM[this.pt_addr + 0x04];
                    this.pt1_vt[0x4] = this.VRAM[this.pt_addr + 0x0C];
                    this.pt0_vt[0x5] = this.VRAM[this.pt_addr + 0x05];
                    this.pt1_vt[0x5] = this.VRAM[this.pt_addr + 0x0D];
                    this.pt0_vt[0x6] = this.VRAM[this.pt_addr + 0x06];
                    this.pt1_vt[0x6] = this.VRAM[this.pt_addr + 0x0E];
                    this.pt0_vt[0x7] = this.VRAM[this.pt_addr + 0x07];
                    this.pt1_vt[0x7] = this.VRAM[this.pt_addr + 0x0F];
                }
                // 3.render it
                for (var spY = 0; spY < this.sp_H; spY += 1) {
                    // offset Y
                    this.flipV ? this.fitY = (this.sp_H - 1) - spY : this.fitY = spY; // flip vertical
                    this.pt0_row = this.pt0_vt[this.fitY]; // 对应字模0
                    this.pt1_row = this.pt1_vt[this.fitY]; // 对应字模1
                    for (var spX = 0; spX < 8; spX += 1) {
                        // offset X
                        this.flipH ? this.fitX = 7 - spX : this.fitX = spX; // flip horizintal
                        this.bitY = this.topY + spY;
                        this.bitX = this.topX + spX;
                        if (this.bitX >= 256 || this.bitY >= 240) {
                            continue;
                        }
                        this.l_bit_pal = ((this.pt1_row & 0x80 >> this.fitX) << 1 | (this.pt0_row & 0x80 >> this.fitX)) >> (7 - this.fitX);
                        // Don't render transparent point
                        if (this.l_bit_pal == 0) {
                            continue;
                        }
                        this.point = (this.bitY * 256) + this.bitX; // current render point
                        this.bgPoint = this.background[this.point]; // 对应的背景点
                        // if it is in foreground and isnt transparent(如果在前景或背景为透明的话)
                        if (this.foreground || this.bgPoint == 0) {
                            this.pal_index = this.u_bit_pal << 2 | this.l_bit_pal; // make color index
                            this.pal_data = this.VRAM[0x3F10 + this.pal_index];
                            this.output[this.point] = this.bus.pal[this.pal_data]; // save ponit
                        }
                    }
                }
            }
        };
        /**
         * Read data.
         */
        PPU.prototype.r = function (address) {
            var value = 0;
            if (address == 0x2002) // PPU status
             {
                value = (+this.VBlank) << 7 | (+this.hit) << 6 | (+this.more8Sprite) << 5 | (+this.ignoreWrite) << 4;
                this.VBlank = false;
                this.toggle = false;
            }
            else if (address == 0x2007) // VRAM data
             {
                if (this.reg2006 >= 0x3F20) {
                    console.log('PPU read 0x3F20');
                }
                else if (this.reg2006 >= 0x3F00) {
                    value = this.VRAM[this.reg2006];
                }
                else if (this.reg2006 >= 0x3000) {
                    console.log('PPU read 0x3000');
                }
                else {
                    value = this.readBuffer;
                    this.readBuffer = this.VRAM[this.reg2006];
                }
                // move to next position
                this.reg2006 += 1 + (this.offset32 * 31);
                this.reg2006 &= 0xFFFF;
            }
            else if (address == 0x2004) {
                value = this.VRAM[this.reg2003];
                this.reg2003 += 1;
                this.reg2003 &= 0xFF;
            }
            else {
                console.log('unknown PPU read', address);
            }
            return value;
        };
        /**
         * Write data.
         */
        PPU.prototype.w = function (address, value) {
            if (address == 0x2007) // VRAM data
             {
                if (this.reg2006 >= 0x3F20) {
                    console.log('PPU write 0x3F20');
                }
                else if (this.reg2006 >= 0x3F00) {
                    if (this.reg2006 % 0x10 == 0) // 0x3F00 or 0x3F10
                     {
                        var t = (value & 0x3F);
                        this.VRAM[0x3F00] = t;
                        this.VRAM[0x3F04] = t;
                        this.VRAM[0x3F08] = t;
                        this.VRAM[0x3F0C] = t;
                        this.VRAM[0x3F10] = t;
                        this.VRAM[0x3F14] = t;
                        this.VRAM[0x3F18] = t;
                        this.VRAM[0x3F1C] = t;
                    }
                    else if (this.reg2006 % 0x04 != 0) {
                        // invalid write in 0x3F04|0x3F08|0x3F0C|0x3F14|0x3F18|0x3F1C
                        this.VRAM[this.reg2006] = (value & 0x3F);
                    }
                }
                else if (this.reg2006 >= 0x3000) {
                    console.log('PPU write 0x3000', this.scanline);
                }
                else if (this.reg2006 >= 0x2000) {
                    if (this.bus.mirrorS) {
                        this.VRAM[0x2000 + (this.reg2006 & 0x3FF)] = value;
                        this.VRAM[0x2400 + (this.reg2006 & 0x3FF)] = value;
                        this.VRAM[0x2800 + (this.reg2006 & 0x3FF)] = value;
                        this.VRAM[0x2C00 + (this.reg2006 & 0x3FF)] = value;
                    }
                    else if (this.bus.mirrorF) {
                        this.VRAM[this.reg2006] = value;
                    }
                    else if (this.reg2006 >= 0x2C00) {
                        this.VRAM[this.reg2006] = value;
                        if (this.bus.mirrorV) {
                            this.VRAM[this.reg2006 - 0x0800] = value;
                        }
                        else {
                            this.VRAM[this.reg2006 - 0x0400] = value;
                        }
                    }
                    else if (this.reg2006 >= 0x2800) {
                        this.VRAM[this.reg2006] = value;
                        if (this.bus.mirrorV) {
                            this.VRAM[this.reg2006 - 0x0800] = value;
                        }
                        else {
                            this.VRAM[this.reg2006 + 0x0400] = value;
                        }
                    }
                    else if (this.reg2006 >= 0x2400) {
                        this.VRAM[this.reg2006] = value;
                        if (this.bus.mirrorV) {
                            this.VRAM[this.reg2006 + 0x0800] = value;
                        }
                        else {
                            this.VRAM[this.reg2006 - 0x0400] = value;
                        }
                    }
                    else if (this.reg2006 >= 0x2000) {
                        this.VRAM[this.reg2006] = value;
                        if (this.bus.mirrorV) {
                            this.VRAM[this.reg2006 + 0x0800] = value;
                        }
                        else {
                            this.VRAM[this.reg2006 + 0x0400] = value;
                        }
                    }
                }
                else {
                    this.VRAM[this.reg2006] = value;
                }
                // move to next position
                this.reg2006 += 1 + (this.offset32 * 31);
                this.reg2006 &= 0xFFFF;
            }
            else if (address == 0x2006) // VRAM address
             {
                if (this.toggle) // lower,second time
                 {
                    this.regTemp &= 0x7F00; // cleare data
                    this.regTemp |= value;
                    this.reg2006 = this.regTemp;
                }
                else // upper,first time
                 {
                    this.regTemp &= 0x00FF; // cleare data
                    this.regTemp |= (value & 0x3F) << 8;
                }
                this.toggle = !this.toggle; // toggle switch
            }
            else if (address == 0x2005) // VRAM address
             {
                if (this.toggle) // Y,second time
                 {
                    this.regTemp &= 0xC1F; // cleare data
                    this.regTemp |= (value & 0xF8) << 2; // Tile Y
                    this.regTemp |= (value & 0x7) << 12; // Fine Y
                }
                else // X,first time				
                 {
                    this.regTemp &= 0xFFE0; // cleare data
                    this.regTemp |= value >> 3; // Tile X
                    this.FH = value & 0x7; // Fine X
                }
                this.toggle = !this.toggle; // toggle switch
            }
            else if (address == 0x2004) // spirte RAM address
             {
                this.SRAM[this.reg2003] = value;
                this.reg2003 += 1;
                this.reg2003 &= 0xFF;
            }
            else if (address == 0x2003) // spirte RAM data
             {
                this.reg2003 = value;
            }
            else if (address == 0x2001) // control register 2
             {
                this.BWColor = (value & 0x01) > 0;
                this.BGL1Col = (value & 0x02) > 0;
                this.SPL1Col = (value & 0x04) > 0;
                this.hideBG = !(value & 0x08);
                this.hideSP = !(value & 0x10);
                this.lightness = (value & 0xE0) >> 5;
            }
            else if (address == 0x2000) // control register 1
             {
                this.regTemp &= 0xF3FF; // cleare data
                this.regTemp |= (value & 0x03) << 10;
                this.offset32 = (value & 0x4) >> 2;
                this.SPHeadAddr = (value & 0x08) && 0x1000;
                this.BGHeadAddr = (value & 0x10) && 0x1000;
                this._8x16 = (value & 0x20) > 0;
                this.NMI = (value & 0x80) > 0;
            }
            else {
                console.log('unknown PPU write', address);
            }
        };
        return PPU;
    }(anes.Node));
    anes.PPU = PPU;
})(anes || (anes = {}));
var anes;
(function (anes) {
    /**
     * Virtual Machine.
     */
    var VM = /** @class */ (function () {
        /**
         * Constructor.
         */
        function VM() {
            /**
             * Frames.
             */
            this.frames = 0;
            /**
             * Next scanline.
             */
            this.nextScanline = 0;
            /**
             * Specifies whether to stop.
             */
            this.stop = false;
            // Create palettes (Nes only supports 64-bit colors)
            this.palettes = [];
            // #0 palette is default palette(defined in NesDoc)
            /* ARGB */ this.palettes.push(new Uint32Array([0xFF757575, 0xFF271B8F, 0xFF0000AB, 0xFF47009F, 0xFF8F0077, 0xFFAB0013, 0xFFA70000, 0xFF7F0B00, 0xFF432F00, 0xFF004700, 0xFF005100, 0xFF003F17, 0xFF1B3F5F, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFBCBCBC, 0xFF0073EF, 0xFF233BEF, 0xFF8300F3, 0xFFBF00BF, 0xFFE7005B, 0xFFDB2B00, 0xFFCB4F0F, 0xFF8B7300, 0xFF009700, 0xFF00AB00, 0xFF00933B, 0xFF00838B, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFFFFFFF, 0xFF3FBFFF, 0xFF5F97FF, 0xFFA78BFD, 0xFFF77BFF, 0xFFFF77B7, 0xFFFF7763, 0xFFFF9B3B, 0xFFF3BF3F, 0xFF83D313, 0xFF4FDF4B, 0xFF58F898, 0xFF00EBDB, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFFFFFFF, 0xFFABE7FF, 0xFFC7D7FF, 0xFFD7CBFF, 0xFFFFC7FF, 0xFFFFC7DB, 0xFFFFBFB3, 0xFFFFDBAB, 0xFFFFE7A3, 0xFFE3FFA3, 0xFFABF3BF, 0xFFB3FFCF, 0xFF9FFFF3, 0xFF000000, 0xFF000000, 0xFF000000]));
            // #1 palette is used in many other emulators
            /* ARGB */ this.palettes.push(new Uint32Array([0xFF7F7F7F, 0xFF2000B0, 0xFF2800B8, 0xFF6010A0, 0xFF982078, 0xFFB01030, 0xFFA03000, 0xFF784000, 0xFF485800, 0xFF386800, 0xFF386C00, 0xFF306040, 0xFF305080, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFBCBCBC, 0xFF4060F8, 0xFF4040FF, 0xFF9040F0, 0xFFD840C0, 0xFFD84060, 0xFFE05000, 0xFFC07000, 0xFF888800, 0xFF50A000, 0xFF48A810, 0xFF48A068, 0xFF4090C0, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFFFFFFF, 0xFF60A0FF, 0xFF5080FF, 0xFFA070FF, 0xFFF060FF, 0xFFFF60B0, 0xFFFF7830, 0xFFFFA000, 0xFFE8D020, 0xFF98E800, 0xFF70F040, 0xFF70E090, 0xFF60D0E0, 0xFF606060, 0xFF000000, 0xFF000000, 0xFFFFFFFF, 0xFF90D0FF, 0xFFA0B8FF, 0xFFC0B0FF, 0xFFE0B0FF, 0xFFFFB8E8, 0xFFFFC8B8, 0xFFFFD8A0, 0xFFFFF090, 0xFFC8F080, 0xFFA0F0A0, 0xFFA0FFC8, 0xFFA0FFF0, 0xFFA0A0A0, 0xFF000000, 0xFF000000]));
            // reset
            this.reset();
            // set default palette
            this.bus.pal = this.palettes[0];
        }
        /**
         * Shut down.
         */
        VM.prototype.shut = function () {
            this._image = null;
        };
        /**
         * 1.Connect image of TV.
         */
        VM.prototype.connect = function (image) {
            this._image = image;
        };
        /**
         * 2.insert cartridge
         */
        VM.prototype.insertCartridge = function (iNes) {
            // Conver binary to rom
            var rom = new Uint8Array(iNes);
            this.bus.rom = rom;
            // bytes[0-3] - Nes file flag
            if (rom[0] != 0x4E || rom[1] != 0x45 || rom[2] != 0x53 || rom[3] != 0x1A) {
                throw new Error('Invalid nes file');
                return false;
            }
            // byte4
            this.bus.numPRom8K = rom[4] * 2;
            this.bus.numPRom16K = rom[4]; // Program ROM number,everyone is 16KB
            this.bus.numPRom32K = rom[4] / 2;
            if (rom[4] > 0) {
                this.bus.PRGBlock = new Int32Array(rom[4] * 0x4000);
            }
            if (rom[5] > 0) {
                this.bus.PatternTable = new Int32Array(rom[5] * 0x2000);
            }
            // byte5
            this.bus.numVRom1K = rom[5] * 8;
            this.bus.numVRom2K = rom[5] * 4;
            this.bus.numVRom4K = rom[5] * 2;
            this.bus.numVRom8K = rom[5]; // Video ROM number,everyone is 8K
            // byte6	
            /* bit0 */
            this.bus.mirrorV = !!(rom[6] & 0x01); // Mirror Flag - 0: horizontal; 1: Vertical
            /* bit1 */
            this.bus.battery = !!(rom[6] & 0x02); // Save RAM($6000-$7FFF)
            /* bit2 */
            this.bus.trainer = !!(rom[6] & 0x04); // Trainer Flag
            /* bit3 */
            this.bus.mirrorF = !!(rom[6] & 0x08); // Four Screen Dlag
            /* bit[4-7] */
            this.bus.mapperNo = (rom[6] & 0xF0) >> 4; // Lower 4 bits of Mapper
            // byte7
            /* bit[0-3] */
            /* bit[4-7] */
            this.bus.mapperNo |= (rom[7] & 0xF0); // Upper 4 bits of Mapper
            // byte[8-F]
            // Preserve,must be 0
            // Cope mapper
            this.bus.mapperW = this.bus.mappersW[this.bus.mapperNo];
            var mapper_reset = this.bus.mappersR[this.bus.mapperNo];
            if (mapper_reset == null) {
                throw new Error('Unsupported mapper type:' + this.bus.mapperNo);
                return false;
            }
            // Reset parts
            mapper_reset();
            this.bus.cpu.reset();
            this.bus.apu.reset();
            return true;
        };
        /**
         * 3.Insert Joypay.
         */
        VM.prototype.insertJoypay = function (P1_r, P1_l, P1_u, P1_d, P1_se, P1_st, P1_b, P1_a, P1_b2, P1_a2, P2_r, P2_l, P2_u, P2_d, P2_b, P2_a, P2_b2, P2_a2) {
            if (P1_r === void 0) { P1_r = 68; }
            if (P1_l === void 0) { P1_l = 65; }
            if (P1_u === void 0) { P1_u = 87; }
            if (P1_d === void 0) { P1_d = 83; }
            if (P1_se === void 0) { P1_se = 70; }
            if (P1_st === void 0) { P1_st = 71; }
            if (P1_b === void 0) { P1_b = 86; }
            if (P1_a === void 0) { P1_a = 66; }
            if (P1_b2 === void 0) { P1_b2 = 67; }
            if (P1_a2 === void 0) { P1_a2 = 78; }
            if (P2_r === void 0) { P2_r = 39; }
            if (P2_l === void 0) { P2_l = 37; }
            if (P2_u === void 0) { P2_u = 38; }
            if (P2_d === void 0) { P2_d = 40; }
            if (P2_b === void 0) { P2_b = 219; }
            if (P2_a === void 0) { P2_a = 221; }
            if (P2_b2 === void 0) { P2_b2 = 189; }
            if (P2_a2 === void 0) { P2_a2 = 187; }
            this.P1_r = P1_r;
            this.P1_l = P1_l;
            this.P1_u = P1_u;
            this.P1_d = P1_d;
            this.P1_se = P1_se;
            this.P1_st = P1_st;
            this.P1_b = P1_b;
            this.P1_a = P1_a;
            this.P1_b2 = P1_b2;
            this.P1_a2 = P1_a2;
            this.P2_r = P2_r;
            this.P2_l = P2_l;
            this.P2_u = P2_u;
            this.P2_d = P2_d;
            this.P2_b = P2_b;
            this.P2_a = P2_a;
            this.P2_b2 = P2_b2;
            this.P2_a2 = P2_a2;
        };
        /**
         * Update key states.
         */
        VM.prototype.updateKeys = function () {
            if (this.stop == true) {
                return;
            }
            // initialize key signal
            var pulse1;
            var pulse2;
            var B1_bb = this.B1_b2 ? (this.B1_bt ^= 2) : this.B1_b;
            var B1_aa = this.B1_a2 ? (this.B1_at ^= 1) : this.B1_a;
            var B2_bb = this.B2_b2 ? (this.B2_bt ^= 2) : this.B2_b;
            var B2_aa = this.B2_a2 ? (this.B2_at ^= 1) : this.B2_a;
            pulse1 = B1_aa | B1_bb | this.B1_u | this.B1_d | this.B1_l | this.B1_r | this.B1_se | this.B1_st;
            pulse2 = B2_aa | B2_bb | this.B2_u | this.B2_d | this.B2_l | this.B2_r;
            //console.log(pulse1, pulse2);
            // inputs signals
            this.bus.joypad.dev0 &= 0xFFFFFF00;
            this.bus.joypad.dev0 |= pulse1 & 0xFF;
            this.bus.joypad.dev1 &= 0xFFFFFF00;
            this.bus.joypad.dev1 |= pulse2 & 0xFF;
        };
        /**
         * Render frame.
         */
        VM.prototype.renderFrame = function () {
            ++this.frames;
            if (this.stop) {
                return;
            }
            // remark:NTSC mode
            // PPU cycle is 21.48MHz divide by 4
            // one PPU clock cycle = three CPU clock cycle
            // one scanline:1364 PPU CC = 1364 / (3*4) = 114 CPU CC,HDraw get 85.3 CPU CC,HBlank get 28.3 CPU CC
            // 注:NTSC制式
            // PPU频率为21.48MHz分为4份
            // PPU 1cc对应CPU 3cc
            // 每条扫描线总周期:1364cc,对应的CPU是1364 / (3*4) = 114cc,HDraw占85.3,HBlank占28.3(不可用86和29,宁缺勿多)
            // 113.85321246819338422391857506361
            // 85.47337944826248199801511793631
            // 28.37983301993090222590345712729
            // Because of DMA, it is possible to scan multiple scan lines at a time
            var bankCC = 0;
            for (;;) {
                // 1.CPU CC corresponding to HDraw
                bankCC = 85;
                if (this.bus.cpu.onceExecedCC < bankCC) {
                    if (this.bus.cpu.exec(bankCC - this.bus.cpu.onceExecedCC) == false) {
                        return;
                    }
                }
                // 3.reset CPU CC
                this.bus.cpu.onceExecedCC -= bankCC;
                // 4.render scanline
                this.nextScanline = this.bus.ppu.renderLine();
                // 5.CPU CC corresponding to HBlank
                bankCC = 28;
                if (this.bus.cpu.onceExecedCC < bankCC) {
                    if (this.bus.cpu.exec(bankCC - this.bus.cpu.onceExecedCC) == false) {
                        return;
                    }
                }
                // 7.reset CPU CC
                this.bus.cpu.onceExecedCC -= bankCC;
                // 8.All scanlines are complete
                if (this.nextScanline == 0) {
                    this.bus.apu.renderSamples(735);
                    break;
                }
            }
            var src = this.bus.ppu.output;
            var dst = this._image.data;
            var len = src.length;
            for (var i = 0; i < len; i++) {
                var bits = src[i];
                var index = i * 4;
                dst[index + 0] = (bits & 0x00FF0000) >> 16;
                dst[index + 1] = (bits & 0x0000FF00) >> 8;
                dst[index + 2] = (bits & 0x000000FF);
                dst[index + 3] = 0xFF;
            }
            if (this.frames % 2 == 0) {
                this.updateKeys();
            }
        };
        /**
         * Render samples.
         */
        VM.prototype.renderSample = function (outputBuffer) {
            this.bus.apu.pushSamplesTo(outputBuffer);
        };
        /**
         * Reset.
         */
        VM.prototype.reset = function () {
            this.nextScanline = 0;
            if (this.bus) {
                var tmp = this.bus.pal;
            }
            this.bus = null;
            this.bus = new anes.Bus();
            this.bus.pal = tmp;
        };
        /**
         * @private
         */
        VM.prototype.onKeyDown = function (keyCode) {
            if (keyCode == this.P1_r) {
                this.B1_r = 128;
            }
            else if (keyCode == this.P1_l) {
                this.B1_l = 64;
            }
            else if (keyCode == this.P1_d) {
                this.B1_d = 32;
            }
            else if (keyCode == this.P1_u) {
                this.B1_u = 16;
            }
            else if (keyCode == this.P1_st) {
                this.B1_st = 8;
            }
            else if (keyCode == this.P1_se) {
                this.B1_se = 4;
            }
            else if (keyCode == this.P1_b) {
                this.B1_b = 2;
            }
            else if (keyCode == this.P1_a) {
                this.B1_a = 1;
            }
            else if (keyCode == this.P1_b2) {
                this.B1_b2 = 1;
            }
            else if (keyCode == this.P1_a2) {
                this.B1_a2 = 1;
            }
            else if (keyCode == this.P2_r) {
                this.B2_r = 128;
            }
            else if (keyCode == this.P2_l) {
                this.B2_l = 64;
            }
            else if (keyCode == this.P2_d) {
                this.B2_d = 32;
            }
            else if (keyCode == this.P2_u) {
                this.B2_u = 16;
            }
            else if (keyCode == this.P2_b) {
                this.B2_b = 2;
            }
            else if (keyCode == this.P2_a) {
                this.B2_a = 1;
            }
            else if (keyCode == this.P2_b2) {
                this.B2_b2 = 1;
            }
            else if (keyCode == this.P2_a2) {
                this.B2_a2 = 1;
            }
        };
        /**
         * @private
         */
        VM.prototype.onKeyUp = function (keyCode) {
            //console.log(keyCode);
            if (keyCode == this.P1_r) {
                this.B1_r = 0;
            }
            else if (keyCode == this.P1_l) {
                this.B1_l = 0;
            }
            else if (keyCode == this.P1_d) {
                this.B1_d = 0;
            }
            else if (keyCode == this.P1_u) {
                this.B1_u = 0;
            }
            else if (keyCode == this.P1_st) {
                this.B1_st = 0;
            }
            else if (keyCode == this.P1_se) {
                this.B1_se = 0;
            }
            else if (keyCode == this.P1_b) {
                this.B1_b = 0;
            }
            else if (keyCode == this.P1_a) {
                this.B1_a = 0;
            }
            else if (keyCode == this.P1_b2) {
                this.B1_b2 = 0;
            }
            else if (keyCode == this.P1_a2) {
                this.B1_a2 = 0;
            }
            else if (keyCode == this.P2_r) {
                this.B2_r = 0;
            }
            else if (keyCode == this.P2_l) {
                this.B2_l = 0;
            }
            else if (keyCode == this.P2_d) {
                this.B2_d = 0;
            }
            else if (keyCode == this.P2_u) {
                this.B2_u = 0;
            }
            else if (keyCode == this.P2_b) {
                this.B2_b = 0;
            }
            else if (keyCode == this.P2_a) {
                this.B2_a = 0;
            }
            else if (keyCode == this.P2_b2) {
                this.B2_b2 = 0;
            }
            else if (keyCode == this.P2_a2) {
                this.B2_a2 = 0;
            }
        };
        return VM;
    }());
    anes.VM = VM;
})(anes || (anes = {}));
