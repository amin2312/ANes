/// <reference path="Node.ts" />
/// <reference path="Mapper.ts" />
namespace anes
{
	export class Mapper2 extends Node implements Mapper
	{
		private reg: number;
		/**
		 * Constructor.
		 */
		constructor(bus: Bus)
		{
			super();
			this.bus = bus;
			this.reg = -1;
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
			offset = 0x10 + (this.bus.numPRom16K - 1) * 0x4000;
			for (i = 0; i < 0x4000; i += 1)
			{
				this.bus.cpu.memory[0xC000 + i] = this.bus.rom[offset + i];
			}
		}
		/**
		 * Write.
		 */
		public write(addr: number, src: number): void
		{
			if (this.reg == src)
			{
				return;
			}
			this.reg = src;
			var i: number;
			var offset: number;
			// switch lower PRG-ROM of 16K
			offset = 0x10 + ((src % this.bus.numPRom16K) * 0x4000);
			for (i = 0; i < 0x4000; i += 1)
			{
				this.bus.cpu.memory[0x8000 + i] = this.bus.rom[offset + i];
			}
		}
	}
}