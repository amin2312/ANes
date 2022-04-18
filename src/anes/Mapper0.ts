/// <reference path="Node.ts" />
/// <reference path="Mapper.ts" />
namespace anes
{
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
	export class Mapper0 extends Node implements Mapper
	{
		/**
		 * Constructor.
		 */
		constructor(bus: Bus)
		{
			super();
			this.bus = bus;
		}
		/**
		 * reset.
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
			offset = 0x10 + (this.bus.numPRom16K - 1) * 0x4000;
			for (i = 0; i < 0x4000; i += 1)
			{
				this.bus.cpu.memory[0xC000 + i] = this.bus.rom[offset + i];
			}
			// load VROM of 8K
			offset = 0x10 + this.bus.numPRom16K * 0x4000;
			if (this.bus.numVRom8K != 0)
			{
				for (i = 0; i < 0x2000; i += 1)
				{
					this.bus.ppu.VRAM[i] = this.bus.rom[offset + i];
				}
			}
		}
		/**
		 * Write.
		 */
		public write(addr: number, src: number): void
		{
		}
	}
}
