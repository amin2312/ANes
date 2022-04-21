/// <reference path="Node.ts" />
/// <reference path="Mapper.ts" />
namespace anes
{
	//
	// This Mapper is MMC1
	//
	export class Mapper1 extends Node implements Mapper
	{
		private shiftReg: number
		private reg0: number;
		private reg1: number;
		private reg2: number;
		private reg3: number;

		private temp: number;
		private romMode: number;
		private b8kVRom: Boolean;
		private VRomSize: number;
		/**
		 * Constructor.
		 */
		constructor(bus: Bus)
		{
			super();
			this.bus = bus;

			this.shiftReg = 0;
			this.reg0 = -1;
			this.reg1 = -1;
			this.reg2 = -1;
			this.reg3 = -1;

			this.temp = 0;
			this.romMode = 0;
			this.b8kVRom = false;
			this.VRomSize = 0;
		}
		/**
		 * Reset.
		 */
		public reset(): void
		{
			var i: number;
			var offset: number;
			// load first PRG-ROM of 16K
			offset = 0x10;
			for (i = 0; i < 0x4000; i += 1)
			{
				this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
			}
			// load last PRG-ROM of 16K
			offset = 0x10 + ((this.bus.numPRom16K - 1) * 0x4000);
			for (i = 0; i < 0x4000; i += 1)
			{
				this.bus.cpu.memory[0xC000 + i] = this.bus.rom[offset + i];
			}
		}
		/**
		 * Write.
		 */
		public write(addr: number, data: number): void
		{
			var i: number;
			var offset: number;
			// reset by shift
			if (this.shiftReg == 5)
			{
				this.shiftReg = this.temp = 0;
			}
			// reset by bit
			if ((data & 0x80) != 0)
			{
				this.shiftReg = this.temp = 0;
				this.romMode = 3;
				return;
			}
			// shift data
			this.temp |= (data & 0x1) << this.shiftReg;
			this.shiftReg += 1;
			if (this.shiftReg < 5)
			{
				return;
			}
			// register 0 (configuration)
			if (addr < 0xA000)
			{
				this.bus.mirrorV = !(this.temp & 0x1);
				this.bus.mirrorS = !(this.temp & 0x2);
				this.romMode = (this.temp & 0xC) >> 2;
				this.b8kVRom = !(this.temp & 0x10);
			}
			// register 1 (swtich lower VROM of 4K or 8K)
			else if (addr < 0xC000)
			{
				this.temp &= 0x1F;
				if (this.reg1 == this.temp)
				{
					return;
				}
				this.reg1 = this.temp;
				if (this.b8kVRom)
				{
					offset = 0x10 + ((this.bus.numPRom16K * 0x4000) + ((this.reg1 % (this.bus.numVRom8K)) * 0x2000));
					this.VRomSize = 0x2000;
				}
				else
				{
					offset = 0x10 + ((this.bus.numPRom16K * 0x4000) + ((this.reg1 % (this.bus.numVRom8K * 2)) * 0x1000));
					this.VRomSize = 0x1000;
				}
				for (i = 0; i < this.VRomSize; i += 1)
				{
					this.bus.ppu.VRAM[i] = this.bus.rom[offset + i];
				}
			}
			// register 2 (swtich upper VROM of 4K)
			else if (addr < 0xE000)
			{
				this.temp &= 0x1F;
				if (this.reg2 == this.temp)
				{
					return;
				}
				this.reg2 = this.temp;
				if (this.b8kVRom)
				{
					return;
				}
				offset = 0x10 + ((this.bus.numPRom16K * 0x4000) + ((this.reg2 % (this.bus.numVRom8K * 2)) * 0x1000));
				for (i = 0; i < 0x1000; i += 1)
				{
					this.bus.ppu.VRAM[0x1000 + i] = this.bus.rom[offset + i];
				}
			}
			// register 3 (swtich PRG-ROM bank)
			else
			{
				if (this.reg3 == this.temp)
				{
					return;
				}
				this.reg3 = this.temp;
				if (this.romMode == 0 || this.romMode == 1) // switch 32K PRG-ROM
				{
					offset = 0x10 + ((this.reg3 >> 1 & 0x7) % (this.bus.numPRom16K / 2) * 0x8000);
					for (i = 0; i < 0x8000; i += 1)
					{
						this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
					}
				}
				else if (this.romMode == 2) // switch upper PRG-ROM of 16K
				{
					offset = 0x10 + ((this.reg3 % this.bus.numPRom16K) * 0x4000);
					for (i = 0; i < 0x4000; i += 1)
					{
						this.bus.cpu.memory[0xC000 + i] = this.bus.rom[offset + i];
					}
				}
				else if (this.romMode == 3) // switch lower PRG-ROM of 16K
				{
					offset = 0x10 + ((this.reg3 % this.bus.numPRom16K) * 0x4000);
					for (i = 0; i < 0x4000; i += 1)
					{
						this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
					}
				}
			}
		}
	}
}
