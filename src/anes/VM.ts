/**
 * 1. Copyright (c) 2022 amin2312
 * 2. Version 1.0.0
 * 3. MIT License
 *
 * ANes is nes emulator base on javascript. It is port version of AminNes(©2009).
 */
namespace anes
{
	/**
	 * Virtual Machine.
	 */
	export class VM
	{
		/**
		 * Bus.
		 */
		public bus: Bus;
		/**
		 * Frames.
		 */
		public frames: number = 0;
		/**
		 * image.
		 */
		private _image: ImageData;
		/**
		 * Next scanline.
		 */
		private nextScanline: number = 0;
		/**
		 * Specifies whether to stop.
		 */
		public stop: Boolean = false;
		/**
		 * Palette Set.
		 */
		public palettes: Array<Uint32Array>;
		/**
		 * Joypad Signal of Player 1,2
		 */
		private B1_r: number;
		private B2_r: number;
		private B1_l: number;
		private B2_l: number;
		private B1_u: number;
		private B2_u: number;
		private B1_d: number;
		private B2_d: number;
		private B1_sl: number;
		private B1_st: number;
		private B1_b: number;
		private B2_b: number;
		private B1_a: number;
		private B2_a: number;
		private B1_b2: number;
		private B2_b2: number;
		private B1_a2: number;
		private B2_a2: number;
		private B1_bt: number;
		private B2_bt: number;
		private B1_at: number;
		private B2_at: number;
		/**
		 * Joypad mapping values
		 */
		public P1_r: number;
		public P2_r: number;
		public P1_l: number;
		public P2_l: number;
		public P1_u: number;
		public P2_u: number;
		public P1_d: number;
		public P2_d: number;
		public P1_sl: number;
		public P1_st: number;
		public P1_b: number;
		public P2_b: number;
		public P1_a: number;
		public P2_a: number;
		public P1_b2: number;
		public P2_b2: number;
		public P1_a2: number;
		public P2_a2: number;
		/**
		 * Constructor.
		 */
		constructor()
		{
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
		public shut(): void
		{
			this._image = null;
		}
		/**
		 * 1.Connect image of TV.
		 */
		public connect(image: ImageData): void
		{
			this._image = image;
		}
		/**
		 * 2.insert cartridge
		 */
		public insertCartridge(iNes: ArrayBuffer): Boolean
		{
			// Conver binary to rom
			let rom = new Uint8Array(iNes);
			this.bus.rom = rom;
			// bytes[0-3] - Nes file flag
			if (rom[0] != 0x4E || rom[1] != 0x45 || rom[2] != 0x53 || rom[3] != 0x1A)
			{
				throw new Error('Invalid nes file');
				return false;
			}
			// byte4
			this.bus.numPRom8K = rom[4] * 2;
			this.bus.numPRom16K = rom[4];		// Program ROM number,everyone is 16KB
			this.bus.numPRom32K = rom[4] / 2;
			if (rom[4] > 0)
			{
				this.bus.PRGBlock = new Int32Array(rom[4] * 0x4000);
			}
			if (rom[5] > 0)
			{
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
			
			console.log('ROM info:' + this.bus.mapperNo);

			// Cope mapper
			this.bus.mapperW = this.bus.mappersW[this.bus.mapperNo];
			var mapper_reset: Function = this.bus.mappersR[this.bus.mapperNo];
			if (mapper_reset == null)
			{
				throw new Error('Unsupported mapper type:' + this.bus.mapperNo);
				return false;
			}
			// Reset parts
			mapper_reset();
			this.bus.cpu.reset();
			this.bus.apu.reset();
			return true;
		}
		/**
		 * 3.Insert Joypay.
		 */
		public insertJoypay(P1_r: number = 68, P1_l: number = 65, P1_u: number = 87, P1_d: number = 83, P1_sl: number = 70, P1_st: number = 71, P1_b: number = 86, P1_a: number = 66, P1_b2: number = 67, P1_a2: number = 78, P2_r: number = 39, P2_l: number = 37, P2_u: number = 38, P2_d: number = 40, P2_b: number = 219, P2_a: number = 221, P2_b2: number = 189, P2_a2: number = 187): void
		{
			this.P1_r = P1_r;
			this.P1_l = P1_l;
			this.P1_u = P1_u;
			this.P1_d = P1_d;
			this.P1_sl = P1_sl;
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
		}
		/**
		 * Update key states.
		 */
		public updateKeys(): void
		{
			if (this.stop == true)
			{
				return;
			}
			// initialize key signal
			var pulse1: number;
			var pulse2: number;
			var B1_bb: number = this.B1_b2 ? (this.B1_bt ^= 2) : this.B1_b;
			var B1_aa: number = this.B1_a2 ? (this.B1_at ^= 1) : this.B1_a;
			var B2_bb: number = this.B2_b2 ? (this.B2_bt ^= 2) : this.B2_b;
			var B2_aa: number = this.B2_a2 ? (this.B2_at ^= 1) : this.B2_a;
			pulse1 = B1_aa | B1_bb | this.B1_u | this.B1_d | this.B1_l | this.B1_r | this.B1_sl | this.B1_st;
			pulse2 = B2_aa | B2_bb | this.B2_u | this.B2_d | this.B2_l | this.B2_r;
			//console.log(pulse1, pulse2);
			// inputs signals
			this.bus.joypad.dev0 &= 0xFFFFFF00;
			this.bus.joypad.dev0 |= pulse1 & 0xFF;
			this.bus.joypad.dev1 &= 0xFFFFFF00;
			this.bus.joypad.dev1 |= pulse2 & 0xFF;
		}
		/**
		 * Render frame.
		 */
		public renderFrame(): void
		{
			++this.frames;
			if (this.stop)
			{
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
			var bankCC: number = 0;
			for (; ;)
			{
				// 1.CPU CC corresponding to HDraw
				bankCC = 85;
				if (this.bus.cpu.onceExecedCC < bankCC)
				{
					if (this.bus.cpu.exec(bankCC - this.bus.cpu.onceExecedCC) == false)
					{
						return;
					}
				}
				// 3.reset CPU CC
				this.bus.cpu.onceExecedCC -= bankCC;
				// 4.render scanline
				this.nextScanline = this.bus.ppu.renderLine();
				// 5.CPU CC corresponding to HBlank
				bankCC = 28;
				if (this.bus.cpu.onceExecedCC < bankCC)
				{
					if (this.bus.cpu.exec(bankCC - this.bus.cpu.onceExecedCC) == false)
					{
						return;
					}
				}
				// 7.reset CPU CC
				this.bus.cpu.onceExecedCC -= bankCC;
				// 8.All scanlines are complete
				if (this.nextScanline == 0)
				{
					this.bus.apu.renderSamples(735);
					break;
				}
			}
			var src = this.bus.ppu.output;
			var dst = this._image.data;
			var len = src.length;
			for (var i = 0; i < len; i++)
			{
				var bits = src[i];
				var index = i * 4;
				dst[index + 0] = (bits & 0x00FF0000) >> 16;
				dst[index + 1] = (bits & 0x0000FF00) >> 8;
				dst[index + 2] = (bits & 0x000000FF);
				dst[index + 3] = 0xFF;
			}
			if (this.frames % 2 == 0)
			{
				this.updateKeys();
			}
		}
		/**
		 * Render samples.
		 */
		public renderSample(outputBuffer:AudioBuffer):void
		{
			this.bus.apu.pushSamplesTo(outputBuffer);
		}
		/**
		 * Reset.
		 */
		public reset(): void
		{
			this.nextScanline = 0;
			if (this.bus)
			{
				var tmp: Int32Array = this.bus.pal;
			}
			this.bus = null;
			this.bus = new Bus();
			this.bus.pal = tmp;
		}
		/**
		 * @private
		 */
		public onKeyDown(keyCode: number): void
		{
			if (keyCode == this.P1_r)
			{
				this.B1_r = 128;
			}
			else if (keyCode == this.P1_l)
			{
				this.B1_l = 64;
			}
			else if (keyCode == this.P1_d)
			{
				this.B1_d = 32;
			}
			else if (keyCode == this.P1_u)
			{
				this.B1_u = 16;
			}
			else if (keyCode == this.P1_st)
			{
				this.B1_st = 8;
			}
			else if (keyCode == this.P1_sl)
			{
				this.B1_sl = 4;
			}
			else if (keyCode == this.P1_b)
			{
				this.B1_b = 2;
			}
			else if (keyCode == this.P1_a)
			{
				this.B1_a = 1;
			}
			else if (keyCode == this.P1_b2)
			{
				this.B1_b2 = 1;
			}
			else if (keyCode == this.P1_a2)
			{
				this.B1_a2 = 1;
			}
			else if (keyCode == this.P2_r)
			{
				this.B2_r = 128;
			}
			else if (keyCode == this.P2_l)
			{
				this.B2_l = 64;
			}
			else if (keyCode == this.P2_d)
			{
				this.B2_d = 32;
			}
			else if (keyCode == this.P2_u)
			{
				this.B2_u = 16;
			}
			else if (keyCode == this.P2_b)
			{
				this.B2_b = 2;
			}
			else if (keyCode == this.P2_a)
			{
				this.B2_a = 1;
			}
			else if (keyCode == this.P2_b2)
			{
				this.B2_b2 = 1;
			}
			else if (keyCode == this.P2_a2)
			{
				this.B2_a2 = 1;
			}
		}
		/**
		 * @private
		 */
		public onKeyUp(keyCode: number): void
		{
			//console.log(keyCode);
			if (keyCode == this.P1_r)
			{
				this.B1_r = 0;
			}
			else if (keyCode == this.P1_l)
			{
				this.B1_l = 0;
			}
			else if (keyCode == this.P1_d)
			{
				this.B1_d = 0;
			}
			else if (keyCode == this.P1_u)
			{
				this.B1_u = 0;
			}
			else if (keyCode == this.P1_st)
			{
				this.B1_st = 0;
			}
			else if (keyCode == this.P1_sl)
			{
				this.B1_sl = 0;
			}
			else if (keyCode == this.P1_b)
			{
				this.B1_b = 0;
			}
			else if (keyCode == this.P1_a)
			{
				this.B1_a = 0;
			}
			else if (keyCode == this.P1_b2)
			{
				this.B1_b2 = 0;
			}
			else if (keyCode == this.P1_a2)
			{
				this.B1_a2 = 0;
			}
			else if (keyCode == this.P2_r)
			{
				this.B2_r = 0;
			}
			else if (keyCode == this.P2_l)
			{
				this.B2_l = 0;
			}
			else if (keyCode == this.P2_d)
			{
				this.B2_d = 0;
			}
			else if (keyCode == this.P2_u)
			{
				this.B2_u = 0;
			}
			else if (keyCode == this.P2_b)
			{
				this.B2_b = 0;
			}
			else if (keyCode == this.P2_a)
			{
				this.B2_a = 0;
			}
			else if (keyCode == this.P2_b2)
			{
				this.B2_b2 = 0;
			}
			else if (keyCode == this.P2_a2)
			{
				this.B2_a2 = 0;
			}
		}
	}
}
