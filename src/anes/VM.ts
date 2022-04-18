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
		 * TV.
		 */
		private TV: ImageData;
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
		public palettes: Array<Uint8Array>;
		/**
		 * Key Timer.
		 */
		private keyTimer: ATween;
		/**
		 * 按钮输入器.
		private keyInputer: EventDispatcher;*/
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
		private B1_se: number;
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
		public P1_se: number;
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
			this.palettes.push(new Uint8Array([0xFF757575, 0xFF271B8F, 0xFF0000AB, 0xFF47009F, 0xFF8F0077, 0xFFAB0013, 0xFFA70000, 0xFF7F0B00, 0xFF432F00, 0xFF004700, 0xFF005100, 0xFF003F17, 0xFF1B3F5F, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFBCBCBC, 0xFF0073EF, 0xFF233BEF, 0xFF8300F3, 0xFFBF00BF, 0xFFE7005B, 0xFFDB2B00, 0xFFCB4F0F, 0xFF8B7300, 0xFF009700, 0xFF00AB00, 0xFF00933B, 0xFF00838B, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFFFFFFF, 0xFF3FBFFF, 0xFF5F97FF, 0xFFA78BFD, 0xFFF77BFF, 0xFFFF77B7, 0xFFFF7763, 0xFFFF9B3B, 0xFFF3BF3F, 0xFF83D313, 0xFF4FDF4B, 0xFF58F898, 0xFF00EBDB, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFFFFFFF, 0xFFABE7FF, 0xFFC7D7FF, 0xFFD7CBFF, 0xFFFFC7FF, 0xFFFFC7DB, 0xFFFFBFB3, 0xFFFFDBAB, 0xFFFFE7A3, 0xFFE3FFA3, 0xFFABF3BF, 0xFFB3FFCF, 0xFF9FFFF3, 0xFF000000, 0xFF000000, 0xFF000000]));
			// #1 palette is used in many other emulators
			this.palettes.push(new Uint8Array([0xFF7F7F7F, 0xFF2000B0, 0xFF2800B8, 0xFF6010A0, 0xFF982078, 0xFFB01030, 0xFFA03000, 0xFF784000, 0xFF485800, 0xFF386800, 0xFF386C00, 0xFF306040, 0xFF305080, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFBCBCBC, 0xFF4060F8, 0xFF4040FF, 0xFF9040F0, 0xFFD840C0, 0xFFD84060, 0xFFE05000, 0xFFC07000, 0xFF888800, 0xFF50A000, 0xFF48A810, 0xFF48A068, 0xFF4090C0, 0xFF000000, 0xFF000000, 0xFF000000, 0xFFFFFFFF, 0xFF60A0FF, 0xFF5080FF, 0xFFA070FF, 0xFFF060FF, 0xFFFF60B0, 0xFFFF7830, 0xFFFFA000, 0xFFE8D020, 0xFF98E800, 0xFF70F040, 0xFF70E090, 0xFF60D0E0, 0xFF606060, 0xFF000000, 0xFF000000, 0xFFFFFFFF, 0xFF90D0FF, 0xFFA0B8FF, 0xFFC0B0FF, 0xFFE0B0FF, 0xFFFFB8E8, 0xFFFFC8B8, 0xFFFFD8A0, 0xFFFFF090, 0xFFC8F080, 0xFFA0F0A0, 0xFFA0FFC8, 0xFFA0FFF0, 0xFFA0A0A0, 0xFF000000, 0xFF000000]));
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
			this.keyTimer.cancel();
			this.keyTimer = null;

			//TV.removeEventListener(Event.ENTER_FRAME, onUpdateBitmap);
			this.TV = null;

			//keyInputer.removeEventListener(KeyboardEvent.KEY_DOWN, onKeyDown);
			//keyInputer.removeEventListener(KeyboardEvent.KEY_UP, onKeyUp);
			//keyInputer = null;
		}
		/**
		 * 1.Connect TV.
		 */
		public connect(TV: ImageData): void
		{
			this.TV = TV;
			//this.TV.addEventListener(Event.ENTER_FRAME, onUpdateBitmap);
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
				this.bus.PRGBlock = new Uint8Array(rom[4] * 0x4000);
			}
			if (rom[5] > 0)
			{
				this.bus.PatternTable = new Uint8Array(rom[5] * 0x2000);
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
		public insertJoypay(keyInputer: EventDispatcher, P1_r: number = 68, P1_l: number = 65, P1_u: number = 87, P1_d: number = 83, P1_se: number = 70, P1_st: number = 72, P1_b: number = 74, P1_a: number = 75, P1_b2: number = 85, P1_a2: number = 73, P2_r: number = 39, P2_l: number = 37, P2_u: number = 38, P2_d: number = 40, P2_b: number = 97, P2_a: number = 98, P2_b2: number = 100, P2_a2: number = 101): void
		{
			this.keyInputer = keyInputer;
			this.keyInputer.addEventListener(KeyboardEvent.KEY_DOWN, onKeyDown);
			this.keyInputer.addEventListener(KeyboardEvent.KEY_UP, onKeyUp);

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

			// 开启定时器
			keyTimer.addEventListener(TimerEvent.TIMER, onUpdateKey);
			keyTimer.start();
		}
		 */
		/**
		 * 按键输入.
		private function onUpdateKey(e: TimerEvent): void
		{
			if (stop == true)
			{
				return;
			}
			// 初始化按键信号
			pulse1: number;
			pulse2: number;
			B1_bb: number = B1_b2 ? (B1_bt ^= 2) : B1_b;
			B1_aa: number = B1_a2 ? (B1_at ^= 1) : B1_a;
			B2_bb: number = B2_b2 ? (B2_bt ^= 2) : B2_b;
			B2_aa: number = B2_a2 ? (B2_at ^= 1) : B2_a;
			pulse1 = B1_aa | B1_bb | B1_se | B1_st | B1_u | B1_d | B1_l | B1_r;
			pulse2 = B2_aa | B2_bb | B2_u | B2_d | B2_l | B2_r;
			// 输入信号
			bus.joypad.dev0 &= 0xFFFFFF00;
			bus.joypad.dev0 |= pulse1 & 0xFF;
			bus.joypad.dev1 &= 0xFFFFFF00;
			bus.joypad.dev1 |= pulse2 & 0xFF;
		}
		 */
		/**
		 * 图象输出.
		private function onUpdateBitmap(e: Event): void
		{
			if (stop == true)
			{
				return;
			}
			// output image
			TV.bitmapData.lock();
			TV.bitmapData.setVector(TV.bitmapData.rect, bus.ppu.output);
			TV.bitmapData.unlock();
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

			// because of DMA,so VM maybe scan multi-line in one times
			// 因为DMA,所以可能一次扫描多条扫描线

			a: number = getTimer();
			bankCC: number = 0;
			for (; ;)
			{
				// 1.CPU CC of HDraw of need to execute(执行HDraw相应的CPU时钟频率)
				bankCC = 85;
				if (bus.cpu.currentCC < bankCC)
				{
					if (bus.cpu.exec(number(bankCC - bus.cpu.currentCC)) == false)
					{
						return;
					}
				}
				// 3.reset CPU CC(重置CPU时钟频率)
				bus.cpu.currentCC -= bankCC;
				// 4.render scanline(渲染扫描线)
				nextScanline = bus.ppu.renderLine();
				// 5.CPU CC of HBlank of need to execute(执行HBalnk对应的CPU时钟频率)
				bankCC = 28;
				if (bus.cpu.currentCC < bankCC)
				{
					if (bus.cpu.exec(number(bankCC - bus.cpu.currentCC)) == false)
					{
						return;
					}
				}
				// 7.reset CPU CC(重置CPU时钟频率)
				bus.cpu.currentCC -= bankCC;
				// 所有扫描线渲染结束,一帧结束
				if (nextScanline == 0)
				{
					// 声音处理
					bus.apu.renderSamples(735);
					break;
				}
			}
			//trace(_ii++,bus.cpu.cpuRunCC);
		}
		 */
		/**
		 * Reset.
		 */
		public reset(): void
		{
			this.nextScanline = 0;
			if (this.bus)
			{
				var tmp: Uint8Array = this.bus.pal;
			}
			this.bus = null;
			this.bus = new Bus();
			this.bus.pal = tmp;
		}
		/**
		 * @private
		private onKeyDown(e: KeyboardEvent): void
		{
			if (e.keyCode == P1_r)
			{
				B1_r = 128;
			}
			else if (e.keyCode == P1_l)
			{
				B1_l = 64;
			}
			else if (e.keyCode == P1_d)
			{
				B1_d = 32;
			}
			else if (e.keyCode == P1_u)
			{
				B1_u = 16;
			}
			else if (e.keyCode == P1_st)
			{
				B1_st = 8;
			}
			else if (e.keyCode == P1_se)
			{
				B1_se = 4;
			}
			else if (e.keyCode == P1_b)
			{
				B1_b = 2;
			}
			else if (e.keyCode == P1_a)
			{
				B1_a = 1;
			}
			else if (e.keyCode == P1_b2)
			{
				B1_b2 = 1;
			}
			else if (e.keyCode == P1_a2)
			{
				B1_a2 = 1;
			}
			else if (e.keyCode == P2_r)
			{
				B2_r = 128;
			}
			else if (e.keyCode == P2_l)
			{
				B2_l = 64;
			}
			else if (e.keyCode == P2_d)
			{
				B2_d = 32;
			}
			else if (e.keyCode == P2_u)
			{
				B2_u = 16;
			}
			else if (e.keyCode == P2_b)
			{
				B2_b = 2;
			}
			else if (e.keyCode == P2_a)
			{
				B2_a = 1;
			}
			else if (e.keyCode == P2_b2)
			{
				B2_b2 = 1;
			}
			else if (e.keyCode == P2_a2)
			{
				B2_a2 = 1;
			}
		}
		 */
		/**
		 * @private
		private onKeyUp(e: KeyboardEvent): void
		{
			if (e.keyCode == P1_r)
			{
				B1_r = 0;
			}
			else if (e.keyCode == P1_l)
			{
				B1_l = 0;
			}
			else if (e.keyCode == P1_d)
			{
				B1_d = 0;
			}
			else if (e.keyCode == P1_u)
			{
				B1_u = 0;
			}
			else if (e.keyCode == P1_st)
			{
				B1_st = 0;
			}
			else if (e.keyCode == P1_se)
			{
				B1_se = 0;
			}
			else if (e.keyCode == P1_b)
			{
				B1_b = 0;
			}
			else if (e.keyCode == P1_a)
			{
				B1_a = 0;
			}
			else if (e.keyCode == P1_b2)
			{
				B1_b2 = 0;
			}
			else if (e.keyCode == P1_a2)
			{
				B1_a2 = 0;
			}
			else if (e.keyCode == P2_r)
			{
				B2_r = 0;
			}
			else if (e.keyCode == P2_l)
			{
				B2_l = 0;
			}
			else if (e.keyCode == P2_d)
			{
				B2_d = 0;
			}
			else if (e.keyCode == P2_u)
			{
				B2_u = 0;
			}
			else if (e.keyCode == P2_b)
			{
				B2_b = 0;
			}
			else if (e.keyCode == P2_a)
			{
				B2_a = 0;
			}
			else if (e.keyCode == P2_b2)
			{
				B2_b2 = 0;
			}
			else if (e.keyCode == P2_a2)
			{
				B2_a2 = 0;
			}
		}
		 */
	}
}
