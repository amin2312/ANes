/// <reference path="Node.ts" />
/// <reference path="Mapper.ts" />
namespace anes
{
	export class Mapper4 extends Node implements Mapper
	{
		private reg: Int32Array = new Int32Array(8);

		private nPRGIndex: Int32Array = new Int32Array(2);
		private nCHRIndex: Int32Array = new Int32Array(8);

		private nIRQLatch: number = 0xFF;
		private nIRQCounter: number = 0;
		private nIRQEnable: number = 0;
		private nIRQPreset: number = 0;
		private nIRQPresetVbl: number = 0;

		private Mapper4_CPU_Page: Int32Array = new Int32Array(4);
		private Mapper4_PPU_Page: Int32Array = new Int32Array(12);

		//public PPU_MEM_BANK: Int32Array = new Int32Array(12);
		//public CPU_MEM_BANK: Int32Array = new Int32Array(8);
		public CRAM: Int32Array = new Int32Array(32 * 1024);
		public VRAM: Int32Array = new Int32Array(4 * 1024);
		/**
		 * Constructor.
		 */
		constructor(bus: Bus)
		{
			super();
			this.bus = bus;
		}

		public Mapper004_SetCPUBank(): void
		{
			if (this.reg[0] & 0x40)
			{
				this.SetPROM_32K_BankB(this.bus.numPRom8K - 2, this.nPRGIndex[1], this.nPRGIndex[0], this.bus.numPRom8K - 1);
				this.Mapper4_CPU_Page[0] = this.bus.numPRom8K - 2;
				this.Mapper4_CPU_Page[1] = this.nPRGIndex[1];
				this.Mapper4_CPU_Page[2] = this.nPRGIndex[0];
				this.Mapper4_CPU_Page[3] = this.bus.numPRom8K - 1;
			}
			else
			{
				this.SetPROM_32K_BankB(this.nPRGIndex[0], this.nPRGIndex[1], this.bus.numPRom8K - 2, this.bus.numPRom8K - 1);
				this.Mapper4_CPU_Page[0] = this.nPRGIndex[0];
				this.Mapper4_CPU_Page[1] = this.nPRGIndex[1];
				this.Mapper4_CPU_Page[2] = this.bus.numPRom8K - 2;
				this.Mapper4_CPU_Page[3] = this.bus.numPRom8K - 1;
			}
		}

		public Mapper004_SetPPUBank(): void
		{
			if (this.bus.numVRom1K)
			{
				if (this.reg[0] & 0x80)
				{
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
				else
				{
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
			else
			{
				if (this.reg[0] & 0x80)
				{
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
				else
				{
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
		}
		/**
		 * Reset.
		 */
		public reset(): void
		{
			var i: number;
			for (i = 0; i < 8; i++)
			{
				this.reg[i] = 0x00;
			}

			this.nPRGIndex[0] = 0;
			this.nPRGIndex[1] = 1;
			this.Mapper004_SetCPUBank();

			for (i = 0; i < 8; i++)
			{
				this.nCHRIndex[i] = i;
			}
			this.Mapper004_SetPPUBank();

			this.nIRQCounter = 0;
		}
		/**
		 * Write.
		 */
		public write(addr: number, data: number): void
		{
			switch (addr & 0xE001)
			{
				case 0x8000:
					this.reg[0] = data;
					this.Mapper004_SetCPUBank();
					this.Mapper004_SetPPUBank();
					break;
				case 0x8001:
					this.reg[1] = data;
					switch (this.reg[0] & 0x07)
					{
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
					if (data & 0x01)
					{
						this.SetNameTable_Bank(0, 0, 1, 1);
						this.Mapper4_PPU_Page[8] = 0;
						this.Mapper4_PPU_Page[9] = 0;
						this.Mapper4_PPU_Page[10] = 1;
						this.Mapper4_PPU_Page[11] = 1;
					}
					else
					{
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
		}

		private Mapper004_HSync(nScanline: number): void
		{
			var bIsDispOn = this.bus.ppu.m_REG[1] & (0x08 | 0x10);
			if ((nScanline >= 0 && nScanline <= 239) && bIsDispOn)
			{
				if (this.nIRQPresetVbl)
				{
					this.nIRQCounter = this.nIRQLatch;
					this.nIRQPresetVbl = 0;
				}
				if (this.nIRQPreset)
				{
					this.nIRQCounter = this.nIRQLatch;
					this.nIRQPreset = 0;
				}
				else if (this.nIRQCounter > 0)
				{
					this.nIRQCounter--;
				}

				if (this.nIRQCounter == 0)
				{
					if (this.nIRQEnable)
					{
						this.nIRQPreset = 0xFF;
					}
					this.nIRQPreset = 0xFF;
				}
			}
		}
		public Mapper004_SaveDoc(): void
		{

		}
		public Mapper004_LoadDoc(): void
		{

		}
		public SetPROM_8K_Bank(page: number, bank: number): void
		{
			bank %= this.bus.numPRom8K;
			//this.CPU_MEM_BANK[page] = this.bus.PRGBlock + 0x2000 * bank;
			//this.CPU_MEM_BANK[page] = this.bus.PRGBlock.subarray(0x2000 * bank);
		}

		public SetPROM_16K_Bank(page: number, bank: number): void
		{
			this.SetPROM_8K_Bank(page + 0, bank * 2 + 0);
			this.SetPROM_8K_Bank(page + 1, bank * 2 + 1);
		}

		public SetPROM_32K_Bank(bank: number): void
		{
			this.SetPROM_8K_Bank(4, bank * 4 + 0);
			this.SetPROM_8K_Bank(5, bank * 4 + 1);
			this.SetPROM_8K_Bank(6, bank * 4 + 2);
			this.SetPROM_8K_Bank(7, bank * 4 + 3);
		}

		public SetPROM_32K_BankB(bank0: number, bank1: number, bank2: number, bank3: number): void
		{
			this.SetPROM_8K_Bank(4, bank0);
			this.SetPROM_8K_Bank(5, bank1);
			this.SetPROM_8K_Bank(6, bank2);
			this.SetPROM_8K_Bank(7, bank3);
		}

		public SetVROM_1K_Bank(page: number, bank: number): void
		{
			bank %= this.bus.numVRom1K;
			//this.PPU_MEM_BANK[page] = this.bus.PatternTable + 0x0400 * bank;
		}

		public SetVROM_2K_Bank(page: number, bank: number): void
		{
			this.SetVROM_1K_Bank(page + 0, bank * 2 + 0);
			this.SetVROM_1K_Bank(page + 1, bank * 2 + 1);
		}

		public SetVROM_4K_Bank(page: number, bank: number): void
		{
			this.SetVROM_1K_Bank(page + 0, bank * 4 + 0);
			this.SetVROM_1K_Bank(page + 1, bank * 4 + 1);
			this.SetVROM_1K_Bank(page + 2, bank * 4 + 2);
			this.SetVROM_1K_Bank(page + 3, bank * 4 + 3);
		}

		public SetVROM_8K_Bank(bank: number): void
		{
			for (var i: number = 0; i < 8; i++)
			{
				this.SetVROM_1K_Bank(i, bank * 8 + i);
			}
		}

		public SetVROM_8K_BankB(bank0: number, bank1: number, bank2: number, bank3: number, bank4: number, bank5: number, bank6: number, bank7: number): void
		{
			this.SetVROM_1K_Bank(0, bank0);
			this.SetVROM_1K_Bank(1, bank1);
			this.SetVROM_1K_Bank(2, bank2);
			this.SetVROM_1K_Bank(3, bank3);
			this.SetVROM_1K_Bank(4, bank4);
			this.SetVROM_1K_Bank(5, bank5);
			this.SetVROM_1K_Bank(6, bank6);
			this.SetVROM_1K_Bank(7, bank7);
		}

		public SetCRAM_1K_Bank(page: number, bank: number): void
		{
			bank &= 0x1F;
			//this.PPU_MEM_BANK[page] = this.CRAM + 0x0400 * bank;
		}

		public SetCRAM_4K_Bank(page: number, bank: number): void
		{
			this.SetCRAM_1K_Bank(page + 0, bank * 4 + 0);
			this.SetCRAM_1K_Bank(page + 1, bank * 4 + 1);
			this.SetCRAM_1K_Bank(page + 2, bank * 4 + 2);
			this.SetCRAM_1K_Bank(page + 3, bank * 4 + 3);
		}

		public SetCRAM_8K_Bank(bank: number): void
		{
			for (var i: number = 0; i < 8; i++)
			{
				this.SetCRAM_1K_Bank(i, bank * 8 + i);
			}
		}

		public SetVRAM_1K_Bank(page: number, bank: number): void
		{
			bank &= 3;
			//this.PPU_MEM_BANK[page] = this.VRAM + 0x0400 * bank;
		}
		public SetNameTable_Bank(bank0: number, bank1: number, bank2: number, bank3: number): void
		{
			this.SetVRAM_1K_Bank(8, bank0);
			this.SetVRAM_1K_Bank(9, bank1);
			this.SetVRAM_1K_Bank(10, bank2);
			this.SetVRAM_1K_Bank(11, bank3);
		}
	}
}