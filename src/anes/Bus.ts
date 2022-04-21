namespace anes
{
	/**
	 * Bus.
	 */
	export class Bus
	{
		public cpu: CPU;
		public ppu: PPU;
		public apu: APU;
		public joypad: Joypad;

		public rom: Uint8Array;					// ROM
		public pal: Uint32Array;				// Current Palette

		public mapper0: Mapper0;
		public mapper1: Mapper1;
		public mapper2: Mapper2;
		public mapper3: Mapper3;
		//public mapper4: Mapper4;

		public mapperW: Function;
		public mappersW: Array<Function>;		// Mapper write function set
		public mappersR: Array<Function>;		// Mapper reset function set

		public mapperNo: number = 0;			// Curreent Mapper Number
		public numPRom8K: number = 0;			// Program 8K Rom Number
		public numPRom16K: number = 0;			// Program 16K Rom Number
		public numPRom32K: number = 0;			// Program 32K Rom Number
		public numVRom1K: number = 0;			// Video 1K Rom Number,someone call 'Character Rom(CHR)'
		public numVRom2K: number = 0;			// Video 2K Rom Number,someone call 'Character Rom(CHR)'
		public numVRom4K: number = 0;			// Video 4K Rom Number,someone call 'Character Rom(CHR)'
		public numVRom8K: number = 0;			// Video 8K Rom Number,someone call 'Character Rom(CHR)'
		public mirrorV: Boolean = false;		// Vertical Mirror Flag
		public mirrorF: Boolean = false;		// Four Screen Mirror Flag
		public mirrorS: Boolean = false;		// Single Screen Mirror Flag
		public battery: Boolean = false;		// Battery Flag [not uesd]
		public trainer: Boolean = false;		// Trainer Flag
		public PRGBlock: Int32Array;
		public PatternTable: Int32Array;
		/**
		 * Constructor.
		 */
		constructor()
		{
			this.cpu = new CPU(this);
			this.ppu = new PPU(this);
			this.apu = new APU(this);
			this.joypad = new Joypad();

			this.mapper0 = new Mapper0(this);
			this.mapper1 = new Mapper1(this);
			this.mapper2 = new Mapper2(this);
			this.mapper3 = new Mapper3(this);
			//this.mapper4 = new Mapper4(this);

			this.mappersW = new Array<Function>(0x100);
			this.mappersW[0] = this.mapper0.write.bind(this.mapper0);
			this.mappersW[1] = this.mapper1.write.bind(this.mapper1);
			this.mappersW[2] = this.mapper2.write.bind(this.mapper2);
			this.mappersW[3] = this.mapper3.write.bind(this.mapper3);

			this.mappersR = new Array<Function>(0x100);
			this.mappersR[0] = this.mapper0.reset.bind(this.mapper0);
			this.mappersR[1] = this.mapper1.reset.bind(this.mapper1);
			this.mappersR[2] = this.mapper2.reset.bind(this.mapper2);
			this.mappersR[3] = this.mapper3.reset.bind(this.mapper3);
		}
	}
}
