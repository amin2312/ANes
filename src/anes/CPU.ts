/// <reference path="Node.ts" />
namespace anes
{
	/**
	 * CPU.
	 */
	export class CPU extends Node
	{
		/**
		 * Defines.
		 */
		readonly frequency: Number = 1789772.5;
		/**
		 * Registers
		 */
		private A: number;				// Accumulator
		private X: number;				// Index Register X
		private Y: number;				// Index Register Y
		private S: number;				// Stack Pointer
		private PC: number;				// Program Counter
		private P: number;				// Processor Status Register
		/* bit7 */private NF: boolean;	// Negative Flag
		/* bit6 */private VF: boolean;	// Overflow Flag
		/* bit5 */private RF: boolean;	// Preserve, alway is 1
		/* bit4 */private BF: boolean;	// Software Break Flag
		/* bit3 */private DF: boolean;	// Decimal Flag
		/* bit2 */private IF: boolean;	// Hardwrae Interrupt Flag
		/* bit1 */private ZF: boolean;	// Zero Flag
		/* bit0 */private CF: boolean;	// Carry Flag
		/**
		 * Involved parameters in the operation.
		 */
		private oc: number;					// opcode
		private l_or: number;				// lower oprand
		private u_or: number;				// upper oprand
		private l_addr: number;				// lower addr
		private u_addr: number;				// upper addr
		private addr: number;				// addr
		private src: number;				// source value
		private dst: number;				// destination value
		private tmpN: number;				// temp number value
		private tmpB: boolean;				// temp boolean value
		private lastPC: number;				// last program counter
		private cycleList: Uint8Array;		// opcode clock cycles lsit
		private seg: number;
		/**
		 * Outputs.
		 */
		public memory: Uint8Array;			// some addrs is mapping addrs
		public onceExecedCC: number;		// clock cycles of executed in once exec
		public execedCC: number				// clock cycles of executed
		/**
		 * Constructor.
		 */
		constructor(bus: Bus)
		{
			super();
			this.bus = bus;
			// initialize registers
			this.A = this.X = this.Y = this.P = this.PC = 0;
			this.S = 0xFF;
			this.NF = this.VF = this.BF = this.DF = this.IF = this.ZF = this.CF = false;
			this.RF = true;
			// initalize variables
			this.memory = new Uint8Array(0x10000);	// 64KB
			this.cycleList = new Uint8Array([7, 6, 0, 0, 0, 3, 5, 0, 3, 2, 2, 0, 0, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 6, 2, 0, 0, 3, 3, 5, 0, 4, 2, 2, 0, 4, 4, 6, 0, 2, 2, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 6, 6, 0, 0, 0, 3, 5, 0, 3, 2, 2, 0, 3, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 6, 6, 0, 0, 0, 3, 5, 0, 4, 2, 2, 0, 5, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 0, 6, 0, 0, 3, 3, 3, 0, 2, 0, 2, 0, 4, 4, 4, 0, 2, 6, 0, 0, 4, 4, 4, 0, 2, 5, 2, 0, 0, 5, 0, 0, 2, 6, 2, 0, 3, 3, 3, 0, 2, 2, 2, 0, 4, 4, 4, 0, 2, 5, 0, 0, 4, 4, 4, 0, 2, 4, 2, 0, 4, 4, 4, 0, 2, 6, 0, 0, 3, 3, 5, 0, 2, 2, 2, 0, 4, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0, 2, 6, 0, 0, 3, 3, 5, 0, 2, 2, 2, 0, 4, 4, 6, 0, 2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0]);
		}
		/**
		 * Reset.
		 */
		public reset(): void
		{
			this.PC = this.memory[0xFFFD] << 8 | this.memory[0xFFFC];
		}
		/**
		 * Non-Maskable Interrupt.
		 */
		public NMI(): void
		{
			this.memory[0x0100 + this.S] = this.PC >> 8;
			this.S -= 1;
			this.S &= 0xFF; // [fixed]
			this.memory[0x0100 + this.S] = this.PC & 0xFF;
			this.S -= 1;
			this.S &= 0xFF; // [fixed]
			this.BF = false;
			this.P = (+this.NF) << 7 | (+this.VF) << 6 | (+this.RF) << 5 | (+this.BF) << 4 | (+this.DF) << 3 | (+this.IF) << 2 | (+this.ZF) << 1 | (+this.CF);
			this.memory[0x0100 + this.S] = this.P;
			this.S -= 1;
			this.S &= 0xFF; // [fixed]
			this.IF = true;
			this.PC = this.memory[0xFFFB] << 8 | this.memory[0xFFFA];
		}
		/**
		 * Interrupt Request.
		 */
		public IRQ(): void
		{
			this.memory[0x0100 + this.S] = this.PC >> 8;
			this.S -= 1;
			this.S &= 0xFF; // [fixed]
			this.memory[0x0100 + this.S] = this.PC & 0xFF;
			this.S -= 1;
			this.S &= 0xFF; // [fixed]
			this.BF = false;
			this.P = (+this.NF) << 7 | (+this.VF) << 6 | (+this.RF) << 5 | (+this.BF) << 4 | (+this.DF) << 3 | (+this.IF) << 2 | (+this.ZF) << 1 | (+this.CF);
			this.memory[0x0100 + this.S] = this.P;
			this.S -= 1;
			this.S &= 0xFF; // [fixed]
			this.IF = true;
			this.PC = this.memory[0xFFFF] << 8 | this.memory[0xFFFE];
		}
		/**
		 * Read value from memory.
		 */
		public r1(addr: number): number
		{
			// Get addr segment
			this.seg = addr >> 13;
			if (this.seg == 0x00)
			{
				/* $0000-$1FFF(RAM) */
				return this.memory[addr & 0x07FF];
			}
			else if (this.seg == 0x01)
			{
				/* $2000-$3FFF(PPU) */
				return this.bus.ppu.r2(addr & 0xE007);
			}
			else if (this.seg == 0x02)
			{
				/* $4000-$5FFF(Registers) */
				if (addr < 0x4100)
				{
					if (addr <= 0x4013 || addr == 0x4015)
					{
						// APU
						return this.bus.apu.r3(addr);
					}
					else if (addr == 0x4016)
					{
						// Joypad 1
						return this.bus.joypad.r5(0);
					}
					else if (addr == 0x4017)
					{
						// Joypad 2
						return this.bus.joypad.r5(1) | this.bus.apu.r3(addr);
					}
					else
					{
						console.log('uncope read register');
						return this.memory[addr];
					}
				}
				else
				{
					console.log('read mapper lower - 1');
				}
			}
			else if (this.seg == 0x03)
			{
				/* $6000-$7FFF(Mapper Lower) */
				console.log('read mapper lower - 2');
				return 0;
			}
			else
			{
				return this.memory[addr];
			}
			return 0;
		}
		/**
		 * Write data to memory.
		 */
		public w1(addr: number, value: number): void
		{
			// get addr segment
			this.seg = addr >> 13;
			if (this.seg == 0x00)
			{
				/* $0000-$1FFF(RAM) */
				this.memory[addr & 0x07FF] = value;
			}
			else if (this.seg == 0x01)
			{
				/* $2000-$3FFF(PPU) */
				this.bus.ppu.w2(addr & 0xE007, value);
			}
			else if (this.seg == 0x02)
			{
				/* $4000-$5FFF(Registers) */
				if (addr < 0x4100)
				{
					if (addr <= 0x4013 || addr == 0x4015 || addr == 0x4017 || addr == 0x4018)
					{
						// APU
						this.bus.apu.w3(addr, value);
					}
					else if (addr == 0x4014)
					{
						// DMA
						var point = 0x0100 * value;
						for (var i = 0; i < 256; i += 1)
						{
							this.bus.ppu.SRAM[i] = this.memory[point + i];
						}
						this.onceExecedCC += 512;
					}
					else if (addr == 0x4016)
					{
						// Joypad
						this.bus.joypad.w5(value);
					}
					else
					{
						//console.log('uncope write register',addr.toString(16));
					}
				}
				else
				{
					console.log('write mapper lower - 1');
				}
			}
			else if (this.seg == 0x03)
			{
				/* $6000-$7FFF(Mapper Lower) */
				console.log('write mapper lower - 2');
			}
			else
			{
				/* $6000-$FFFF(P-ROM) */
				this.bus.mapperW(addr, value);
			}
		}
		/**
		 * Execution instruction.
		 */
		public exec(requiredCC: number): Boolean
		{
			for (; ;)
			{
				this.oc = this.memory[this.PC];
				this.lastPC = this.PC;
				this.PC += 1;

				if (this.oc >= 0xC0)
				{
					// 240-255
					if (this.oc >= 0xF0)
					{
						if (this.oc >= 0xFC)
						{

							if (this.oc == 0xFF)
							{
							}
							/* INC 16bit,X */
							else if (this.oc == 0xFE)
							{
								// 1.indexed addressing [X]
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [INC]
								this.src = this.r1(this.addr) + 1 & 0xFF;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* SBC 16bit,X */
							else if (this.oc == 0xFD)
							{
								// 1.indexed addressing [X]
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [SBC]
								this.src = this.r1(this.addr);
								this.dst = (this.A - this.src) - (+!this.CF);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & (this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							else
							{
								/*0xFC*/
							}
						}
						else if (this.oc >= 0xF8)
						{

							if (this.oc == 0xFB)
							{
							}
							else if (this.oc == 0xFA)
							{
							}
							/* SBC 16bit,Y */
							else if (this.oc == 0xF9)
							{
								// 1.indexed addressing [Y]
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [SBC]
								this.src = this.r1(this.addr);
								this.dst = (this.A - this.src) - (+!this.CF);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & (this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* SED */
							else
							{
								/*0xF8*/
								// Exec instruction [SED]
								this.DF = true;
							}
						}
						else if (this.oc >= 0xF4)
						{

							if (this.oc == 0xF7)
							{
							}
							/* INC 8bit,X */
							else if (this.oc == 0xF6)
							{
								// 1.indexed addressing [X]
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [INC]
								this.src = this.memory[this.addr] + 1 & 0xFF;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* SBC 8bit,X */
							else if (this.oc == 0xF5)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [sbc]
								this.src = this.memory[this.addr];
								this.dst = (this.A - this.src) - (+!this.CF);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & (this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else
							{
								/*0xF4*/
							}
						}
						else
						{

							if (this.oc == 0xF3)
							{
							}
							else if (this.oc == 0xF2)
							{
							}
							/* SBC (8bit),Y */
							else if (this.oc == 0xF1)
							{
								// 1.先零页间址后Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.memory[this.l_or + 1 & 0xFF] << 8 | this.memory[this.l_or];
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [sbc]
								this.src = this.r1(this.addr);
								this.dst = (this.A - this.src) - (+!this.CF);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & (this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* BEQ #8bit */
							else
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [beq]
								if (this.ZF)
								{
									this.tmpN = this.PC;
									this.addr = (this.PC + this.l_or) & 0xFFFF;
									this.PC = this.addr;
									// 9.sum clock cycles
									this.onceExecedCC += 1;
									this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
								}
							}
						}
					}
					// 224-239
					else if (this.oc >= 0xE0)
					{
						if (this.oc >= 0xEC)
						{

							if (this.oc == 0xEF)
							{
							}
							/* INC 16bit */
							else if (this.oc == 0xEE)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [inc]
								this.src = this.r1(this.addr) + 1 & 0xFF;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* SBC 16bit */
							else if (this.oc == 0xED)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [sbc]
								this.src = this.r1(this.addr);
								this.dst = (this.A - this.src) - (+!this.CF);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & (this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* CPX 16bit */
							else /*0xEC*/
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [cpx]
								this.dst = this.X - this.r1(this.addr);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
						}
						else if (this.oc >= 0xE8)
						{

							if (this.oc == 0xEB)
							{
							}
							/* NOP */
							else if (this.oc == 0xEA)
							{
							}
							/* SBC #8bit */
							else if (this.oc == 0xE9)
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [sbc]
								this.src = this.l_or;
								this.dst = (this.A - this.src) - (+!this.CF);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & (this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* INX */
							else /*0xE8*/
							{
								// 2.Exec instruction [inx]
								this.X += 1;
								this.X &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.X & 0x80) > 0;
								this.ZF = !this.X;
							}
						}
						else if (this.oc >= 0xE4)
						{

							if (this.oc == 0xE7)
							{
							}
							/* INC 8bit */
							else if (this.oc == 0xE6)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [inc]
								this.src = this.memory[this.addr] + 1 & 0xFF;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* SBC 8bit */
							else if (this.oc == 0xE5)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [sbc]
								this.src = this.memory[this.addr];
								this.dst = (this.A - this.src) - (+!this.CF);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & (this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* CPX 8bit */
							else
							{		/*0xE4*/
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [cpx]
								this.dst = this.X - this.memory[this.addr];
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
						}
						else
						{

							if (this.oc == 0xE3)
							{
							}
							else if (this.oc == 0xE2)
							{
							}
							/* SBC (8bit,X) */
							else if (this.oc == 0xE1)
							{
								// 1.先零页X变址后间址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.memory[(this.l_or + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_or + this.X & 0xFF];
								// 2.Exec instruction [sbc]
								this.src = this.r1(this.addr);
								this.dst = (this.A - this.src) - (+!this.CF);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & (this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* CPX #8bit */
							else
							{		/*0xE0*/
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [cpx]
								this.dst = this.X - this.l_or;
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
						}
					}
					// 208-223
					else if (this.oc >= 0xD0)
					{
						if (this.oc >= 0xDC)
						{

							if (this.oc == 0xDF)
							{
							}
							/* DEC 16bit,X */
							else if (this.oc == 0xDE)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [dec]
								this.src = this.r1(this.addr) - 1 & 0xFF;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* CMP 16bit,X */
							else if (this.oc == 0xDD)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [cmp]
								this.dst = this.A - this.r1(this.addr);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							else
							{
								/* 0xDC */
							}
						}
						else if (this.oc >= 0xD8)
						{

							if (this.oc == 0xDB)
							{
							}
							else if (this.oc == 0xDA)
							{
							}
							/* CMP 16bit,Y */
							else if (this.oc == 0xD9)
							{
								// 1.绝对Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [cmp]
								this.dst = this.A - this.r1(this.addr);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* CLD */
							else
							{		/*0xD8*/
								// 2.Exec instruction 
								this.DF = false;
							}
						}
						else if (this.oc >= 0xD4)
						{

							if (this.oc == 0xD7)
							{
							}
							/* DEC 8bit,X */
							else if (this.oc == 0xD6)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [dec]
								this.src = this.memory[this.addr] - 1 & 0xFF;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* CMP 8bit,X */
							else if (this.oc == 0xD5)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [cmp]
								this.dst = this.A - this.memory[this.addr];
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
							else
							{
								/*0xD4*/
							}
						}
						else
						{

							if (this.oc == 0xD3)
							{
							}
							else if (this.oc == 0xD2)
							{
							}
							/* CMP (8bit),Y */
							else if (this.oc == 0xD1)
							{
								// 1.先零页间址后Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.memory[this.l_or + 1 & 0xFF] << 8 | this.memory[this.l_or];
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [cmp]
								this.dst = this.A - this.r1(this.addr);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* BNE #8bit */
							else
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [bne]
								if (!this.ZF)
								{
									this.tmpN = this.PC;
									this.addr = (this.PC + this.l_or) & 0xFFFF;
									this.PC = this.addr;
									// 9.sum clock cycles
									this.onceExecedCC += 1;
									this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
								}
							}
						}
					}
					// 192-207
					else
					{
						if (this.oc >= 0xCC)
						{

							if (this.oc == 0xCF)
							{
							}
							/* DEC 16bit */
							else if (this.oc == 0xCE)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [dec]
								this.src = this.r1(this.addr) - 1 & 0xFF;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* CMP 16bit */
							else if (this.oc == 0xCD)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [cmp]
								this.dst = this.A - this.r1(this.addr);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
							/* CPY 16bit */
							else
							{		/*0xCC*/
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [cmy]
								this.dst = this.Y - this.r1(this.addr);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
						}
						else if (this.oc >= 0xC8)
						{

							if (this.oc == 0xCB)
							{
							}
							/* DEX */
							else if (this.oc == 0xCA)
							{
								// 2.Exec instruction [dex]
								this.X -= 1;
								this.X &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.X & 0x80) > 0;
								this.ZF = !this.X;
							}
							/* CMP #8bit */
							else if (this.oc == 0xC9)
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [cmp]
								this.dst = this.A - this.l_or;
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
							/* INY */
							else
							{		/*0xC8*/
								// 2.Exec instruction [iny]
								this.Y += 1;
								this.Y &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.Y & 0x80) > 0;
								this.ZF = !this.Y;
							}
						}
						else if (this.oc >= 0xC4)
						{

							if (this.oc == 0xC7)
							{
							}
							/* DEC 8bit */
							else if (this.oc == 0xC6)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [dec]
								this.src = this.memory[this.addr] - 1 & 0xFF;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* CMP 8bit */
							else if (this.oc == 0xC5)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [cmp]
								this.dst = this.A - this.memory[this.addr];
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
							/* CPY 8bit */
							else
							{		/*0xC4*/
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [cpy]
								this.dst = this.Y - this.memory[this.addr];
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
						}
						else
						{

							if (this.oc == 0xC3)
							{
							}
							else if (this.oc == 0xC2)
							{
							}
							/* CMP (8bit,X) */
							else if (this.oc == 0xC1)
							{
								// 1.先零页X变址后间址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.memory[(this.l_or + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_or + this.X & 0xFF];
								// 2.Exec instruction [cmp]
								this.dst = this.A - this.r1(this.addr);
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
							/* CPY #8bit */
							else
							{		/*0xC0*/
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [cpy]
								this.dst = this.Y - this.l_or;
								// 3.Update flags
								this.CF = this.dst < 0x100;
								this.dst &= 0xFF; // [fixed]
								this.NF = (this.dst & 0x80) > 0;
								this.ZF = !this.dst;
							}
						}
					}
				}
				else if (this.oc >= 0x80)
				{
					// 176-191
					if (this.oc >= 0xB0)
					{
						if (this.oc >= 0xBC)
						{

							if (this.oc == 0xBF)
							{
							}
							/* LDX 16bit,Y */
							else if (this.oc == 0xBE)
							{
								// 1.绝对Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [ldx]
								this.X = this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.X & 0x80) > 0;
								this.ZF = !this.X;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* LDA 16bit,X */
							else if (this.oc == 0xBD)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [lda]
								this.A = this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/*  LDY 16bit,X */
							else
							{		/*0xBC*/
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [ldy]
								this.Y = this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.Y & 0x80) > 0;
								this.ZF = !this.Y;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
						}
						else if (this.oc >= 0xB8)
						{

							if (this.oc == 0xBB)
							{
							}
							/* TSX */
							else if (this.oc == 0xBA)
							{
								// 2.Exec instruction [tsx]
								this.X = this.S;
								// 3.Update flags
								this.NF = (this.X & 0x80) > 0;
								this.ZF = !this.X;
							}
							/* LDA 16bit,Y */
							else if (this.oc == 0xB9)
							{
								// 1.绝对Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [lda]
								this.A = this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* CLV */
							else
							{
								// 2.Exec instruction 
								this.VF = false;
							}
						}
						else if (this.oc >= 0xB4)
						{

							if (this.oc == 0xB7)
							{
							}
							/* LDX 8bit,Y */
							else if (this.oc == 0xB6)
							{
								// 1.零页Y变址寻址
								this.addr = this.memory[this.PC] + this.Y & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [ldx]
								this.X = this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.X & 0x80) > 0;
								this.ZF = !this.X;
							}
							/* LDA 8bit,X */
							else if (this.oc == 0xB5)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [lda]
								this.A = this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* LDY 8bit,X */
							else
							{		/*0xB4*/
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [lda]
								this.Y = this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.Y & 0x80) > 0;
								this.ZF = !this.Y;
							}
						}
						else
						{

							if (this.oc == 0xB3)
							{
							}
							else if (this.oc == 0xB2)
							{
							}
							/* LDA (8bit),Y */
							else if (this.oc == 0xB1)
							{
								// 1.先零页间址后Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.memory[this.l_or + 1 & 0xFF] << 8 | this.memory[this.l_or];
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [lda]
								this.A = this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* BCS #8bit */
							else
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [bcs]
								if (this.CF)
								{
									this.tmpN = this.PC;
									this.addr = (this.PC + this.l_or << 24) & 0xFFFF;
									this.PC = this.addr;
									// 9.sum clock cycles
									this.onceExecedCC += 1;
									this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
								}
							}
						}
					}
					// 160-175
					else if (this.oc >= 0xA0)
					{
						if (this.oc >= 0xAC)
						{

							if (this.oc == 0xAF)
							{
							}
							/* LDX 16bit */
							else if (this.oc == 0xAE)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [ldx]
								this.X = this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.X & 0x80) > 0;
								this.ZF = !this.X;
							}
							/* LDA 16bit */
							else if (this.oc == 0xAD)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [lda]
								this.A = this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* LDY 16bit */
							else
							{		/*0xAC*/
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [ldy]
								this.Y = this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.Y & 0x80) > 0;
								this.ZF = !this.Y;
							}
						}
						else if (this.oc >= 0xA8)
						{

							if (this.oc == 0xAB)
							{
							}
							/* TAX */
							else if (this.oc == 0xAA)
							{
								// 2.Exec instruction [tax]
								this.X = this.A;
								// 3.Update flags
								this.NF = (this.X & 0x80) > 0;
								this.ZF = !this.X;
							}
							/* LDA #8bit */
							else if (this.oc == 0xA9)
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [lda]
								this.A = this.l_or;
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* TAY */
							else
							{		/*0xA8*/
								// 2.Exec instruction [tay]
								this.Y = this.A;
								// 3.Update flags
								this.NF = (this.Y & 0x80) > 0;
								this.ZF = !this.Y;
							}
						}
						else if (this.oc >= 0xA4)
						{

							if (this.oc == 0xA7)
							{
							}
							/* LDX 8bit */
							else if (this.oc == 0xA6)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [ldx]
								this.X = this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.X & 0x80) > 0;
								this.ZF = !this.X;
							}
							/* LDA 8bit */
							else if (this.oc == 0xA5)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [lda]
								this.A = this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* LDY 8bit */
							else
							{		/*0xA4*/
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [ldy]
								this.Y = this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.Y & 0x80) > 0;
								this.ZF = !this.Y;
							}
						}
						else
						{

							if (this.oc == 0xA3)
							{
							}
							/* LDX #8bit */
							else if (this.oc == 0xA2)
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [ldx]
								this.X = this.l_or;
								// 3.Update flags
								this.NF = (this.X & 0x80) > 0;
								this.ZF = !this.X;
							}
							/* LDA (8bit,X) */
							else if (this.oc == 0xA1)
							{
								// 1.先零页X变址后间址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.memory[(this.l_or + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_or + this.X & 0xFF];
								// 2.Exec instruction [lda]
								this.A = this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* LDY #8bit */
							else
							{		/*0xA0*/
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [ldy]
								this.Y = this.l_or;
								// 3.Update flags
								this.NF = (this.Y & 0x80) > 0;
								this.ZF = !this.Y;
							}
						}
					}
					// 144-159
					else if (this.oc >= 0x90)
					{
						if (this.oc >= 0x9C)
						{

							if (this.oc == 0x9F)
							{
							}
							else if (this.oc == 0x9E)
							{
							}
							/* STA 16bit,X */
							else if (this.oc == 0x9D)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [sta]
								this.src = this.A;
								this.w1(this.addr, this.src);
							}
							else
							{
							}
						}
						else if (this.oc >= 0x98)
						{

							if (this.oc == 0x9B)
							{
							}
							/* TXS */
							else if (this.oc == 0x9A)
							{
								// 2.Exec instruction 
								this.S = this.X;
							}
							/* STA 16bit,Y */
							else if (this.oc == 0x99)
							{
								// 1.绝对Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [sta]
								this.src = this.A;
								this.w1(this.addr, this.src);
							}
							/* TYA */
							else
							{		/*0x98*/
								// 2.Exec instruction [tya]
								this.A = this.Y;
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
						}
						else if (this.oc >= 0x94)
						{

							if (this.oc == 0x97)
							{
							}
							/* STX 8bit,Y */
							else if (this.oc == 0x96)
							{
								// 1.零页Y变址寻址
								this.addr = this.memory[this.PC] + this.Y & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [stx]
								this.memory[this.addr] = this.X;
							}
							/* STA 8bit,X */
							else if (this.oc == 0x95)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [sta]
								this.memory[this.addr] = this.A;
							}
							/* STY 8bit,X */
							else
							{		/*0x94*/
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [sty]
								this.memory[this.addr] = this.Y;
							}
						}
						else
						{

							if (this.oc == 0x93)
							{
							}
							else if (this.oc == 0x92)
							{
							}
							/* STA (8bit),Y */
							else if (this.oc == 0x91)
							{
								// 1.先零页间址后Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.memory[this.l_or + 1 & 0xFF] << 8 | this.memory[this.l_or];
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [sta]
								this.src = this.A;
								this.w1(this.addr, this.src);
							}
							/* BCC #8bit */
							else
							{		/*0x90*/
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [bcc]
								if (!this.CF)
								{
									this.tmpN = this.PC;
									this.addr = (this.PC + this.l_or) & 0xFFFF;
									this.PC = this.addr;
									// 9.sum clock cycles
									this.onceExecedCC += 1;
									this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
								}
							}
						}
					}
					// 128-143
					else
					{
						if (this.oc >= 0x8C)
						{

							if (this.oc == 0x8F)
							{
							}
							/* STX 16bit */
							else if (this.oc == 0x8E)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [stx]
								this.src = this.X;
								this.w1(this.addr, this.src);
							}
							/* STA 16bit */
							else if (this.oc == 0x8D)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [sta]
								this.src = this.A;
								this.w1(this.addr, this.src);
							}
							/* STY 16bit */
							else
							{		/*0x8C*/
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [sty]
								this.src = this.Y;
								this.w1(this.addr, this.src);
							}
						}
						else if (this.oc >= 0x88)
						{

							if (this.oc == 0x8B)
							{
							}
							/* TXA */
							else if (this.oc == 0x8A)
							{
								// 2.Exec instruction [txa]
								this.A = this.X;
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else if (this.oc == 0x89)
							{
							}
							/* DEY */
							else
							{		/*0x88*/
								// 2.Exec instruction [dey]
								this.Y -= 1;
								this.Y &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.Y & 0x80) > 0;
								this.ZF = !this.Y;
							}
						}
						else if (this.oc >= 0x84)
						{

							if (this.oc == 0x87)
							{
							}
							/* STX 8bit */
							else if (this.oc == 0x86)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [stx]
								this.src = this.X;
								this.memory[this.addr] = this.src;
							}
							/* STA 8bit */
							else if (this.oc == 0x85)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [sta]
								this.src = this.A;
								this.memory[this.addr] = this.src;
							}
							/* STY 8bit */
							else
							{		/*0x84*/
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [sty]
								this.src = this.Y;
								this.memory[this.addr] = this.src;
							}
						}
						else
						{

							if (this.oc == 0x83)
							{
							}
							else if (this.oc == 0x82)
							{
							}
							/* STA (8bit,X) */
							else if (this.oc == 0x81)
							{
								// 1.先零页X变址后间址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.memory[(this.l_or + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_or + this.X & 0xFF];
								// 2.Exec instruction [sta]
								this.src = this.A;
								this.w1(this.addr, this.src);
							}
							else
							{
							}
						}
					}
				}
				else if (this.oc >= 0x40)
				{
					// 112-127
					if (this.oc >= 0x70)
					{
						if (this.oc >= 0x7C)
						{

							if (this.oc == 0x7F)
							{
							}
							/* ROR 16bit,X */
							else if (this.oc == 0x7E)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [ror]
								this.src = this.r1(this.addr);
								this.tmpB = this.CF;
								this.CF = (this.src & 0x01) > 0;
								this.src = this.src >> 1 | (+this.tmpB) << 7;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* ADC 16bit,X */
							else if (this.oc == 0x7D)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [adc]
								this.src = this.r1(this.addr);
								this.dst = (this.A + this.src) + (+this.CF);
								// 3.Update flags
								this.CF = this.dst > 0xFF;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & ~(this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							else
							{
							}
						}
						else if (this.oc >= 0x78)
						{

							if (this.oc == 0x7B)
							{
							}
							else if (this.oc == 0x7A)
							{
							}
							/* ADC 16bit,Y */
							else if (this.oc == 0x79)
							{
								// 1.绝对Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [adc]
								this.src = this.r1(this.addr);
								this.dst = (this.A + this.src) + (+this.CF);
								// 3.Update flags
								this.CF = this.dst > 0xFF;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & ~(this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* SEI */
							else
							{		/*0x78*/
								// 2.Exec instruction [sei]
								this.IF = true;
							}
						}
						else if (this.oc >= 0x74)
						{

							if (this.oc == 0x77)
							{
							}
							/* ROR 8bit,X */
							else if (this.oc == 0x76)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [ror]
								this.src = this.memory[this.addr];
								this.tmpB = this.CF;
								this.CF = (this.src & 0x01) > 0;
								this.src = this.src >> 1 | (+this.tmpB) << 7;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* ADC 8bit,X */
							else if (this.oc == 0x75)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [adc]
								this.src = this.memory[this.addr];
								this.dst = (this.A + this.src) + (+this.CF);
								// 3.Update flags
								this.CF = this.dst > 0xFF;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & ~(this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else
							{
							}
						}
						else
						{

							if (this.oc == 0x73)
							{
							}
							else if (this.oc == 0x72)
							{
							}
							/* ADC (8bit),Y */
							else if (this.oc == 0x71)
							{
								// 1.先零页间址后Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.memory[this.l_or + 1 & 0xFF] << 8 | this.memory[this.l_or];
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [adc]
								this.src = this.r1(this.addr);
								this.dst = (this.A + this.src) + (+this.CF);
								// 3.Update flags
								this.CF = this.dst > 0xFF;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & ~(this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* BVS #8bit */
							else
							{		/*0x70*/
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [bvs]
								if (this.VF)
								{
									this.tmpN = this.PC;
									this.addr = (this.PC + this.l_or) & 0xFFFF;
									this.PC = this.addr;
									// 9.sum clock cycles
									this.onceExecedCC += 1;
									this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
								}
							}
						}
					}
					// 96-111
					else if (this.oc >= 0x60)
					{
						if (this.oc >= 0x6C)
						{

							if (this.oc == 0x6F)
							{
							}
							/* ROR 16bit */
							else if (this.oc == 0x6E)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [ror]
								this.src = this.r1(this.addr);
								this.tmpB = this.CF;
								this.CF = (this.src & 0x01) > 0;
								this.src = this.src >> 1 | (+this.tmpB) << 7;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* ADC 16bit */
							else if (this.oc == 0x6D)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [adc]
								this.src = this.r1(this.addr);
								this.dst = (this.A + this.src) + (+this.CF);
								// 3.Update flags
								this.CF = this.dst > 0xFF;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & ~(this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* JMP (16bit) */
							else
							{		/*0x6C*/
								// 1.相对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								this.l_addr = this.r1(this.addr);
								this.u_addr = this.r1(this.addr + 1 & 0xFFFF);
								this.addr = this.u_addr << 8 | this.l_addr;
								// 2.Exec instruction [jmp]
								this.PC = this.addr;
							}
						}
						else if (this.oc >= 0x68)
						{

							if (this.oc == 0x6B)
							{
							}
							/* ROR */
							else if (this.oc == 0x6A)
							{
								// 2.Exec instruction [ror]
								this.tmpB = this.CF;
								this.CF = (this.A & 0x01) > 0;
								this.A = this.A >> 1 | (+this.tmpB) << 7;
								this.A &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* ADC #8bit */
							else if (this.oc == 0x69)
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [adc]
								this.src = this.l_or;
								this.dst = (this.A + this.src) + (+this.CF);
								// 3.Update flags
								this.CF = this.dst > 0xFF;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & ~(this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* PLA */
							else
							{
								// 2.Exec instruction [pla]
								this.S += 1;
								this.S &= 0xFF; // [fixed]
								this.A = this.memory[0x0100 + this.S];
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
						}
						else if (this.oc >= 0x64)
						{

							if (this.oc == 0x67)
							{
							}
							/* ROR 8bit */
							else if (this.oc == 0x66)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [ror]
								this.src = this.memory[this.addr];
								this.tmpB = this.CF;
								this.CF = (this.src & 0x01) > 0;
								this.src = this.src >> 1 | (+this.tmpB) << 7;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* ADC 8bit */
							else if (this.oc == 0x65)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [adc]
								this.src = this.memory[this.addr];
								this.dst = (this.A + this.src) + (+this.CF);
								// 3.Update flags
								this.CF = this.dst > 0xFF;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & ~(this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else
							{
							}
						}
						else
						{

							if (this.oc == 0x63)
							{
							}
							else if (this.oc == 0x62)
							{
							}
							/* ADC (8bit,X) */
							else if (this.oc == 0x61)
							{
								// 1.先零页X变址后间址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.memory[(this.l_or + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_or + this.X & 0xFF];
								// 2.Exec instruction [adc]
								this.src = this.r1(this.addr);
								this.dst = (this.A + this.src) + (+this.CF);
								// 3.Update flags
								this.CF = this.dst > 0xFF;
								this.dst &= 0xFF; // [fixed]
								this.VF = (0x80 & ~(this.A ^ this.src) & (this.A ^ this.dst)) > 0;
								this.A = this.dst;
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* RTS */
							else
							{		/*0x60*/
								// 1.栈寻址
								this.S += 1;
								this.S &= 0xFF; // [fixed]
								this.l_addr = this.memory[0x0100 + this.S];
								this.S += 1;
								this.S &= 0xFF; // [fixed]
								this.u_addr = this.memory[0x0100 + this.S];
								// 2.Exec instruction [rts]
								this.addr = this.u_addr << 8 | this.l_addr;
								this.PC = this.addr + 1;
							}
						}
					}
					// 80-95
					else if (this.oc >= 0x50)
					{
						if (this.oc >= 0x5C)
						{

							if (this.oc == 0x5F)
							{
							}
							/* LSR 16bit,X */
							else if (this.oc == 0x5E)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [lsr]
								this.src = this.r1(this.addr);
								this.CF = (this.src & 0x01) > 0;
								this.src >>= 1;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* EOR 16bit,X */
							else if (this.oc == 0x5D)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [eor]
								this.A ^= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							else
							{
							}
						}
						else if (this.oc >= 0x58)
						{

							if (this.oc == 0x5B)
							{
							}
							else if (this.oc == 0x5A)
							{
							}
							/* EOR 16bit,Y */
							else if (this.oc == 0x59)
							{
								// 1.绝对Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [eor]
								this.A ^= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* CLI */
							else
							{		/*0x58*/
								// 2.Exec instruction 
								this.IF = false;
							}
						}
						else if (this.oc >= 0x54)
						{

							if (this.oc == 0x57)
							{
							}
							/* LSR 8bit,X */
							else if (this.oc == 0x56)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [lsr]
								this.src = this.memory[this.addr];
								this.CF = (this.src & 0x01) > 0;
								this.src >>= 1;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* EOR 8bit,X */
							else if (this.oc == 0x55)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [eor]
								this.A ^= this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else
							{
							}
						}
						else
						{

							if (this.oc == 0x53)
							{
							}
							else if (this.oc == 0x52)
							{
							}
							/* EOR (8bit),Y */
							else if (this.oc == 0x51)
							{
								// 1.先零页间址后Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.memory[this.l_or + 1 & 0xFF] << 8 | this.memory[this.l_or];
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [eor]
								this.A ^= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* BVC #8bit */
							else
							{		/*0x50*/
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [bvc]
								if (!this.VF)
								{
									this.tmpN = this.PC;
									this.addr = (this.PC + this.l_or) & 0xFFFF;
									this.PC = this.addr;
									// 9.sum clock cycles
									this.onceExecedCC += 1;
									this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
								}
							}
						}
					}
					// 64-79
					else
					{
						if (this.oc >= 0x4C)
						{

							if (this.oc == 0x4F)
							{
							}
							/* LSR 16bit */
							else if (this.oc == 0x4E)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [lsr]
								this.src = this.r1(this.addr);
								this.CF = (this.src & 0x01) > 0;
								this.src >>= 1;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* EOR 16bit */
							else if (this.oc == 0x4D)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [eor]
								this.A ^= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* JMP 16bit */
							else
							{		/*0x4C*/
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [jmp]
								this.PC = this.addr;
							}
						}
						else if (this.oc >= 0x48)
						{

							if (this.oc == 0x4B)
							{
							}
							/* LSR */
							else if (this.oc == 0x4A)
							{
								// 2.Exec instruction [lsr]
								this.CF = (this.A & 0x01) > 0;
								this.A >>= 1;
								this.A &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* EOR #8bit */
							else if (this.oc == 0x49)
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [eor]
								this.A ^= this.l_or;
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* PHA */
							else
							{		/*0x48*/
								// 2.Exec instruction [pha]
								this.addr = 0x0100 + this.S;
								this.src = this.A;
								this.w1(this.addr, this.src);
								this.S -= 1;
								this.S &= 0xFF; // [fixed]
							}
						}
						else if (this.oc >= 0x44)
						{

							if (this.oc == 0x47)
							{
							}
							/* LSR 8bit */
							else if (this.oc == 0x46)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [lsr]
								this.src = this.memory[this.addr];
								this.CF = (this.src & 0x01) > 0;
								this.src >>= 1;
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* EOR 8bit */
							else if (this.oc == 0x45)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [eor]
								this.A ^= this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else
							{
							}
						}
						else
						{

							if (this.oc == 0x43)
							{
							}
							else if (this.oc == 0x42)
							{
							}
							/* EOR (8bit,X) */
							else if (this.oc == 0x41)
							{
								// 1.先零页X变址后间址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.memory[(this.l_or + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_or + this.X & 0xFF];
								// 2.Exec instruction [eor]
								this.A ^= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* RTI */
							else
							{		/*0x40*/
								// 栈还原
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
								// 栈寻址
								this.S += 1;
								this.S &= 0xFF; // [fixed]
								this.l_addr = this.memory[0x0100 + this.S];
								this.S += 1;
								this.S &= 0xFF; // [fixed]
								this.u_addr = this.memory[0x0100 + this.S];
								this.addr = this.u_addr << 8 | this.l_addr;
								this.PC = this.addr;
							}
						}
					}
				}
				else
				{
					// 48-63
					if (this.oc >= 0x30)
					{
						if (this.oc >= 0x3C)
						{

							if (this.oc == 0x3F)
							{
							}
							/* ROL 16bit,X */
							else if (this.oc == 0x3E)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [rol]
								this.src = this.r1(this.addr);
								this.tmpB = this.CF;
								this.CF = (this.src & 0x80) > 0;
								this.src = this.src << 1 | (+this.tmpB);
								this.src &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* AND 16bit,X */
							else if (this.oc == 0x3D)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [and]
								this.A &= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							else
							{
							}
						}
						else if (this.oc >= 0x38)
						{

							if (this.oc == 0x3B)
							{
							}
							else if (this.oc == 0x3A)
							{
							}
							/* AND 16bit,Y */
							else if (this.oc == 0x39)
							{
								// 1.绝对Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [and]
								this.A &= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* SEC */
							else
							{		/*0x38*/
								// 2.Exec instruction [sec]
								this.CF = true;
							}
						}
						else if (this.oc >= 0x34)
						{

							if (this.oc == 0x37)
							{
							}
							/* ROL 8bit,X */
							else if (this.oc == 0x36)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [rol]
								this.src = this.memory[this.addr];
								this.tmpB = this.CF;
								this.CF = (this.src & 0x80) > 0;
								this.src = this.src << 1 | (+this.tmpB);
								this.src &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* AND 8bit,X */
							else if (this.oc == 0x35)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [and]
								this.A &= this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else
							{
							}
						}
						else
						{

							if (this.oc == 0x33)
							{
							}
							else if (this.oc == 0x32)
							{
							}
							/* AND (8bit),Y */
							else if (this.oc == 0x31)
							{
								// 1.先零页间址后Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.memory[this.l_or + 1 & 0xFF] << 8 | this.memory[this.l_or];
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [and]
								this.A &= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* BMI #8bit */
							else
							{		/*0x30*/
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [bmi]
								if (this.NF)
								{
									this.tmpN = this.PC;
									this.addr = (this.PC + this.l_or) & 0xFFFF;
									this.PC = this.addr;
									// 9.sum clock cycles
									this.onceExecedCC += 1;
									this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
								}
							}
						}
					}
					// 32-47
					else if (this.oc >= 0x20)
					{
						if (this.oc >= 0x2C)
						{

							if (this.oc == 0x2F)
							{
							}
							/* ROL 16bit */
							else if (this.oc == 0x2E)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [rol]
								this.src = this.r1(this.addr);
								this.tmpB = this.CF;
								this.CF = (this.src & 0x80) > 0;
								this.src = this.src << 1 | (+this.tmpB);
								this.src &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* AND 16bit */
							else if (this.oc == 0x2D)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [and]
								this.A &= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* BIT 16bit */
							else
							{		/*0x2C*/
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [bit]
								this.src = this.r1(this.addr);
								this.ZF = !(this.src & this.A);
								this.NF = (this.src & 0x80) > 0;
								this.VF = (this.src & 0x40) > 0;
							}
						}
						else if (this.oc >= 0x28)
						{

							if (this.oc == 0x2B)
							{
							}
							/* ROL */
							else if (this.oc == 0x2A)
							{
								// 2.Exec instruction [rol]
								this.tmpB = this.CF;
								this.CF = (this.A & 0x80) > 0;
								this.A = this.A << 1 | (+this.tmpB);
								this.A &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* AND #8bit */
							else if (this.oc == 0x29)
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [and]
								this.A &= this.l_or;
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* PLP */
							else
							{		/*0x28*/
								// 2.Exec instruction [plp]
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
						else if (this.oc >= 0x24)
						{

							if (this.oc == 0x27)
							{
							}
							/* ROL 8bit */
							else if (this.oc == 0x26)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [rol]
								this.src = this.memory[this.addr];
								this.tmpB = this.CF;
								this.CF = (this.src & 0x80) > 0;
								this.src = this.src << 1 | (+this.tmpB);
								this.src &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* AND 8bit */
							else if (this.oc == 0x25)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [and]
								this.A &= this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* BIT 8bit */
							else
							{		/*0x24*/
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [bit]
								this.src = this.memory[this.addr];
								this.ZF = !(this.src & this.A);
								this.NF = (this.src & 0x80) > 0;
								this.VF = (this.src & 0x40) > 0;
							}
						}
						else
						{

							if (this.oc == 0x23)
							{
							}
							else if (this.oc == 0x22)
							{
							}
							/* AND (8bit,X) */
							else if (this.oc == 0x21)
							{
								// 1.先零页X变址后间址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.memory[(this.l_or + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_or + this.X & 0xFF];
								// 2.Exec instruction [and]
								this.A &= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* JSR 16bit */
							else
							{		/*0x20*/
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [jsr]
								this.PC -= 1; // 跳回来一下
								this.memory[0x0100 + this.S] = this.PC >> 8;
								this.S -= 1;
								this.S &= 0xFF; // [fixed]
								this.memory[0x0100 + this.S] = this.PC & 0xFF;
								this.S -= 1;
								this.S &= 0xFF; // [fixed]
								this.PC = this.addr;
							}
						}
					}
					// 16-31
					else if (this.oc >= 0x10)
					{
						if (this.oc >= 0x1C)
						{

							if (this.oc == 0x1F)
							{
							}
							/* ASL 16bit,X */
							else if (this.oc == 0x1E)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [asl]
								this.src = this.r1(this.addr);
								this.CF = (this.src & 0x80) > 0;
								this.src <<= 1;
								this.src &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* ORA 16bit,X */
							else if (this.oc == 0x1D)
							{
								// 1.绝对X变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.X & 0xFFFF;
								// 2.Exec instruction [ora]
								this.A |= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							else
							{
							}
						}
						else if (this.oc >= 0x18)
						{

							if (this.oc == 0x1B)
							{
							}
							else if (this.oc == 0x1A)
							{
							}
							/* ORA 16bit,Y */
							else if (this.oc == 0x19)
							{
								// 1.绝对Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.u_or << 8 | this.l_or;
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [ora]
								this.A |= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* CLC */
							else
							{		/*0x18*/
								// 2.Exec instruction [cls]
								this.CF = false;
							}
						}
						else if (this.oc >= 0x14)
						{

							if (this.oc == 0x17)
							{
							}
							/* ASL 8bit,X */
							else if (this.oc == 0x16)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [asl]
								this.src = this.memory[this.addr];
								this.CF = (this.src & 0x80) > 0;
								this.src <<= 1;
								this.src &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* ORA 8bit,X */
							else if (this.oc == 0x15)
							{
								// 1.零页X变址寻址
								this.addr = this.memory[this.PC] + this.X & 0xFF;
								this.PC += 1;
								// 2.Exec instruction [ora]
								this.A |= this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else
							{
							}
						}
						else
						{

							if (this.oc == 0x13)
							{
							}
							else if (this.oc == 0x12)
							{
							}
							/* ORA (8bit),Y */
							else if (this.oc == 0x11)
							{
								// 1.先零页间址后Y变址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.tmpN = this.memory[this.l_or + 1 & 0xFF] << 8 | this.memory[this.l_or];
								this.addr = this.tmpN + this.Y;
								// 2.Exec instruction [ora]
								this.A |= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
								// 9.sum clock cycles
								this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
							}
							/* BPL #8bit */
							else
							{		/*0x10*/
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [bpl]
								if (!this.NF)
								{
									this.tmpN = this.PC;
									this.addr = (this.PC + this.l_or) & 0xFFFF;
									this.PC = this.addr;
									// 9.sum clock cycles
									this.onceExecedCC += 1;
									this.onceExecedCC += +((this.tmpN & 0xFF00) != (this.addr & 0xFF00));
								}
							}
						}
					}
					// 0-15
					else
					{
						if (this.oc >= 0x0C)
						{

							if (this.oc == 0x0F)
							{
							}
							/* ASL 16bit */
							else if (this.oc == 0x0E)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [asl]
								this.src = this.r1(this.addr);
								this.CF = (this.src & 0x80) > 0;
								this.src <<= 1;
								this.src &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.w1(this.addr, this.src);
							}
							/* ORA 16bit */
							else if (this.oc == 0x0D)
							{
								// 1.绝对寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.u_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.u_or << 8 | this.l_or;
								// 2.Exec instruction [ora]
								this.A |= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else
							{
							}
						}
						else if (this.oc >= 0x08)
						{

							if (this.oc == 0x0B)
							{
							}
							/* ASL */
							else if (this.oc == 0x0A)
							{
								// 2.Exec instruction [asl]
								this.CF = (this.A & 0x80) > 0;
								this.A <<= 1;
								this.A &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* ORA #8bit */
							else if (this.oc == 0x09)
							{
								// 1.Immediate Addressing
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [ora]
								this.A |= this.l_or;
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* PHP */
							else
							{
								// 2.Exec instruction [php]
								this.P = (+this.NF) << 7 | (+this.VF) << 6 | (+this.RF) << 5 | (+this.BF) << 4 | (+this.DF) << 3 | (+this.IF) << 2 | +(this.ZF) << 1 | (+this.CF);
								this.memory[0x0100 + this.S] = this.P;
								this.S -= 1;
								this.S &= 0xFF; // [fixed]
							}
						}
						else if (this.oc >= 0x04)
						{

							if (this.oc == 0x07)
							{
							}
							/* ASL 8bit */
							else if (this.oc == 0x06)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [asl]
								this.src = this.memory[this.addr];
								this.CF = (this.src & 0x80) > 0;
								this.src <<= 1;
								this.src &= 0xFF; // [fixed]
								// 3.Update flags
								this.NF = (this.src & 0x80) > 0;
								this.ZF = !this.src;
								// 4.save data to momery
								this.memory[this.addr] = this.src;
							}
							/* ORA 8bit */
							else if (this.oc == 0x05)
							{
								// 1.零页寻址
								this.addr = this.memory[this.PC];
								this.PC += 1;
								// 2.Exec instruction [ora]
								this.A |= this.memory[this.addr];
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							else
							{
							}
						}
						else
						{
							if (this.oc == 0x03)
							{
							}
							else if (this.oc == 0x02)
							{
							}
							/* ORA (8bit,X) */
							else if (this.oc == 0x01)
							{
								// 1.先零页X变址后间址寻址
								this.l_or = this.memory[this.PC];
								this.PC += 1;
								this.addr = this.memory[(this.l_or + this.X) + 1 & 0xFF] << 8 | this.memory[this.l_or + this.X & 0xFF];
								// 2.Exec instruction [ora]
								this.A |= this.r1(this.addr);
								// 3.Update flags
								this.NF = (this.A & 0x80) > 0;
								this.ZF = !this.A;
							}
							/* BRK(软中断) */
							else
							{		/*0x00*/
								// 步骤1 - stack <- PC + 2
								this.PC += 1;
								this.memory[0x0100 + this.S] = this.PC >> 8;
								this.S -= 1;
								this.S &= 0xFF; // [fixed]
								this.memory[0x0100 + this.S] = this.PC & 0xFF;
								this.S -= 1;
								this.S &= 0xFF; // [fixed]
								// 步骤2
								this.BF = true;
								// 步骤3 - stack <- P
								this.P = (+this.NF) << 7 | (+this.VF) << 6 | (+this.RF) << 5 | (+this.BF) << 4 | (+this.DF) << 3 | (+this.IF) << 2 | (+this.ZF) << 1 | (+this.CF);
								this.memory[0x0100 + this.S] = this.P;
								this.S -= 1;
								this.S &= 0xFF; // [fixed]
								// 步骤4
								this.IF = true;
								// 步骤5
								this.PC = this.memory[0xFFFF] << 8 | this.memory[0xFFFE];
							}
						}
					}
				}
				// get clock cycles of current instruction(获取当前指令的时钟频率)
				var cycles = this.cycleList[this.oc];
				if (cycles == 0)
				{
					console.log('Invalid instruction:', this.oc.toString(16), this.lastPC.toString(16));
					this.onceExecedCC += 2;
					return false;
				}
				// sum clock cycles of executed(累积已执行的指令时钟频率)
				this.onceExecedCC += cycles;
				this.execedCC += cycles;
				// execute interrupt(执行中断)
				if (this.bus.ppu.ENC)
				{
					this.bus.ppu.ENC -= cycles;	// pass 7 clock cycle
					if (this.bus.ppu.ENC <= 0)
					{
						this.NMI();
						this.bus.ppu.ENC = 0;
					}
				}
				// if execute finish(执行到目标时钟频率)
				if (this.onceExecedCC >= requiredCC)
				{
					// 渲染声音
					this.bus.apu.virtualUpdateDPCM(this.onceExecedCC);
					return true;
				}
			}
			return true;
		}
	}
}