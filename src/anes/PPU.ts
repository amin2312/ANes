/// <reference path="Node.ts" />
namespace anes
{
	export class PPU extends Node
	{
		/**
		 * Registers.
		 */
		// ------------ 2000
		/* bit2 */
		private offset32: number = 0;			// nt_addr offset value
		/* bit3 */
		private SPHeadAddr: number = 0;			// sprite start adderess - 0: 0x0000, 1: 0x1000
		/* bit4 */
		private BGHeadAddr: number = 0;			// background start address - 0: 0x0000, 1: 0x1000
		/* bit5 */
		private _8x16: Boolean = false;			// big sprite flag - 0: 8x8 sprite, 1: 8x16 sprite
		/* bit7 */
		private NMI: Boolean = false;			// NMI flag - 0: on, 1: off
		// ------------ 2001
		/* bit0 */
		private BWColor: Boolean = false;		// [no uesd] - color flag - 0: color, 1:b&w 0
		/* bit1 */
		private BGL1Col: Boolean = false;		// [no uesd] - left 1 of background flag - 0: hidden, 1: show
		/* bit2 */
		private SPL1Col: Boolean = false;		// [no uesd] - left 1 of sprite flag - 0: hidden, 1: show
		/* bit3 */
		private hideBG: Boolean = false;		// background flag - 0: hidden, 1: show
		/* bit4 */
		private hideSP: Boolean = false;		// sprite flag - 0: hidden, 1: show
		/* point[5-7] */
		private lightness: number = 0;			// [no uesd]
		// ------------ 2002
		/* bit4 */
		private ignoreWrite: Boolean = false;	// [no uesd] - ignore writ to VRAM flag
		/* bit5 */
		private more8Sprite: Boolean = false;	// [no uesd] - scan over 8 sprites flag
		/* bit6 */
		private hit: Boolean = false;			// collision detection flag
		/* bit7 */
		private VBlank: Boolean = false;		// VBlank flag
		// ------------ 2003
		private reg2003: number = 0;
		// ------------ 2005 & 2006 shared flag
		private toggle: Boolean = false;
		// ------------ 2006
		private reg2006: number = 0;		// Counter
		// ------------ 2007
		private readBuffer: number = 0;		// VRAM read buffer, read address #2007 is invalid in first
		/**
		 * Parameters for render
		 */
		private background: Int32Array;			// bitmap of background
		private sprite0: Int32Array;			// Sprite 0 graphics,used in collision detection
		private SM0: Int32Array;				// Matrix Mapping 0
		private SM1: Int32Array;				// Matrix Mapping 1
		private scanline: number = 0;			// Current Scan Line
		private forcedVBlank: Boolean = false;	// Forced VBlank	
		private regTemp: number = 0;			// temporary register
		private pt0_vt: Int32Array;
		private pt1_vt: Int32Array;

		private FV: number = 0;		// fine vertical
		private VT: number = 0;		// vertical tile index
		private HT: number = 0;		// horizontal tile index
		private V: number = 0;		// vertical table index
		private H: number = 0;		// horizontal table index
		private VH: number = 0;
		private FH: number = 0;		// fine horizontal
		/**
		 * Temporary variables
		 */
		private topX: number = 0;
		private topY: number = 0;
		private sp_H: number = 0;
		private sp0_Y: number = 0;
		private sp0_X: number = 0;
		// name table
		private nt_addr: number = 0;
		// attribute table
		private groupRow: number = 0;
		private squareRow: number = 0;
		private sq_index: number = 0;
		private at_addr: number = 0;
		// pattern table
		private pt_addr: number = 0;
		private pt0_data: number = 0;
		private pt1_data: number = 0;
		// point attributes
		private point: number = 0;
		private point_row: number = 0;
		private l_bit_pal: number = 0;		// lower image palette address
		private u_bit_pal: number = 0;		// upper image palette address
		private pal_index: number = 0;		// image palette address
		private pal_data: number = 0;		// image palette value
		// sprite attributes
		private pt0_row: number = 0;
		private pt1_row: number = 0;
		private pt_index: number = 0;
		private sp_at: number = 0;
		private foreground: Boolean = false;
		private flipH: Boolean = false;
		private flipV: Boolean = false;
		private fitX: number = 0;
		private fitY: number = 0;
		private bitX: number = 0;
		private bitY: number = 0;
		private bgPoint: number = 0;
		/**
		 * Outers
		 */
		public output: Uint32Array;			// bitmap of output image
		public renderedFrames: number = 0;	// rendered frames

		public VRAM: Int32Array;			// video RAM:PPU's memory, somrwhere are mapping
		public SRAM: Int32Array;			// sprite RAM:256 bytes,64 sprites
		public ENC: number = 0;				// used time that enter NMI interrupt - 7 CC

		public m_REG: Int32Array = new Int32Array(4);
		/**
		 * Constructor.
		 */
		constructor(bus: Bus)
		{
			super();
			this.bus = bus;
			this.hideBG = true;
			this.hideSP = true;
			//----------------------------------------------------
			this.VRAM = new Int32Array(0x10000);
			this.SRAM = new Int32Array(0x100);
			this.output = new Uint32Array(256 * 240);
			//----------------------------------------------------
			this.background = new Int32Array(256 * 240);
			this.sprite0 = new Int32Array(0x80);
			this.SM0 = new Int32Array([0x03, 0x03, 0x0C, 0x0C, 0x03, 0x03, 0x0C, 0x0C, 0x30, 0x30, 0xC0, 0xC0, 0x30, 0x30, 0xC0, 0xC0]);
			this.SM1 = new Int32Array([0, 0, 2, 2, 0, 0, 2, 2, 4, 4, 6, 6, 4, 4, 6, 6]);
			//----------------------------------------------------
			this.pt0_vt = new Int32Array(16);
			this.pt1_vt = new Int32Array(16);
		}
		/**
		 * Render line
		 * @return next scanline number
		 */
		public renderLine(): number
		{
			if (this.scanline == 0) // initial render line
			{
				// 1.init flag
				this.VBlank = false;
				this.hit = false;
				this.more8Sprite = false;
				// 2.update counter
				if (!this.hideBG || !this.hideSP)
				{
					this.reg2006 = this.regTemp;
				}
				this.renderSprite0();
			}
			else if (this.scanline >= 1 && this.scanline <= 240) // start render line
			{
				// If both "hideBG" and "hideSP" are true, then enter "VBlank" mode
				if (this.hideBG && this.hideSP)
				{
					this.renderBackgroundColor();
					this.forcedVBlank = true;
				}
				else if (this.hideBG)
				{
					this.renderBackgroundColor();
				}
				else
				{
					if (this.forcedVBlank)
					{
						this.reg2006 = this.regTemp;
						this.forcedVBlank = false;
					}
					this.renderBackground();
				}
			}
			else if (this.scanline == 241) // end render line
			{
				if (!this.hideSP)
				{
					this.renderSprite();
				}
				// 1.set flag
				this.VBlank = true;
				// 2.create a interrupt
				if (this.NMI)
				{
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
		}
		/**
		 * Render background color.
		 */
		private renderBackgroundColor(): void
		{
			var drawLine = this.scanline - 1;
			this.point_row = drawLine * 256;
			var bgColor = this.bus.pal[this.VRAM[0x3F00]];
			for (var i = 0; i < 256; i += 1)
			{
				this.point = this.point_row + i;
				this.output[this.point] = bgColor;
				this.background[this.point] = 0;
			}
		}
		/**
		 * Render background.
		 */
		private renderBackground(): void
		{
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
			this.groupRow = (this.VT >> 2) * 8;		// The 4x4 group that Tile is in
			this.squareRow = (this.VT & 0x03) * 4;	// The 4x4 square that Tile is in
			this.point_row = drawLine * 256;		// The row that the point is in
			var fineX = this.FH;
			var XRenderPoint = 0;
			// draw tile
			for (var times = 0; times < 33; times += 1)
			{
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
				for (; fineX < 8; fineX += 1)
				{
					// 1.get lower 2 bits of palette / backgroud matrix / 00 is background palette
					this.l_bit_pal = ((this.pt1_data & 0x80 >> fineX) << 1 | (this.pt0_data & 0x80 >> fineX)) >> (7 - fineX);
					// 2.get color of palette
					this.pal_data = this.VRAM[0x3F00 + (this.u_bit_pal << 2 | this.l_bit_pal)];
					// 3.save point of infomation
					this.output[this.point] = this.bus.pal[this.pal_data];
					this.background[this.point] = this.l_bit_pal;	// use it in collision detection
					// 4.move to next render point
					this.point += 1;
					XRenderPoint += 1;
					if (XRenderPoint >= 256) 
					{
						times = 1000;
						break;
					}
				}
				// reset fine X
				fineX = 0;
				// update HT/H
				this.HT += 1;
				this.HT &= 31;
				if (!this.HT)
				{
					this.H ^= 1;
				}
			}
			// update FV、VT、V
			this.FV += 1;
			this.FV &= 7;
			if (!this.FV)
			{
				this.VT += 1;
				// Tile Y只有30行，索引0开始到29
				if (this.VT == 30)
				{
					this.VT = 0;
					this.V ^= 1;
				}
				// 从30开始的值只递增不翻转V
				else if (this.VT == 32)
				{
					this.VT = 0;
				}
			}
			// update counter
			this.reg2006 = (this.FV << 12) + (this.V << 11) + (this.H << 10) + (this.VT << 5) + this.HT;
			// collision detection
			if (!this.hit && drawLine < (this.sp0_Y + this.sp_H) && drawLine >= this.sp0_Y)
			{
				for (XRenderPoint = 0; XRenderPoint < 256; XRenderPoint += 1)
				{
					if (XRenderPoint >= (this.sp0_X + 8))
					{
						break;
					}
					if (XRenderPoint >= this.sp0_X)
					{
						if (this.sprite0[((drawLine - this.sp0_Y << 3) + (XRenderPoint - this.sp0_X))] != 0 && this.output[(this.point_row + XRenderPoint)] != 0)
						{
							this.hit = true;
							break;
						}
					}
				}
			}
		}
		/**
		 * Render Sprite 0 for hit.
		 */
		private renderSprite0(): void
		{
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
			if (this._8x16)
			{
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
			else
			{
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
			for (var spY = 0; spY < this.sp_H; spY += 1)
			{
				// offset Y
				this.flipV ? this.fitY = (this.sp_H - 1) - spY : this.fitY = spY;		// flip vertical
				this.pt0_row = this.pt0_vt[this.fitY];									// 对应字模0
				this.pt1_row = this.pt1_vt[this.fitY];									// 对应字模1
				for (var spX = 0; spX < 8; spX += 1)
				{
					// offset X
					this.flipH ? this.fitX = 7 - spX : this.fitX = spX;					// flip horizintal
					this.point = spY * 8 + spX;											// current render point
					this.l_bit_pal = ((this.pt1_row & 0x80 >> this.fitX) << 1 | (this.pt0_row & 0x80 >> this.fitX)) >> (7 - this.fitX);
					this.sprite0[this.point] = this.l_bit_pal;
				}
			}
		}
		/**
		 * Render sprite.
		 */
		private renderSprite(): void
		{
			// from Sprite 63 start
			for (var index = 252; index >= 0; index -= 4)
			{
				// 1.get infomation
				this.topY = this.SRAM[index];
				this.pt_index = this.SRAM[index + 1];
				this.sp_at = this.SRAM[index + 2];
				this.topX = this.SRAM[index + 3];
				this.sp_H = 1 << 3 + (+this._8x16);
				// 2.parse attributes
				this.u_bit_pal = this.sp_at & 0x03;
				this.foreground = !(this.sp_at & 0x20);		// foreground
				this.flipH = (this.sp_at & 0x40) > 0;
				this.flipV = (this.sp_at & 0x80) > 0;
				if (this._8x16)
				{
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
				else
				{
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
				for (var spY = 0; spY < this.sp_H; spY += 1)
				{
					// offset Y
					this.flipV ? this.fitY = (this.sp_H - 1) - spY : this.fitY = spY;	// flip vertical
					this.pt0_row = this.pt0_vt[this.fitY];								// 对应字模0
					this.pt1_row = this.pt1_vt[this.fitY];								// 对应字模1
					for (var spX = 0; spX < 8; spX += 1)
					{
						// offset X
						this.flipH ? this.fitX = 7 - spX : this.fitX = spX;				// flip horizintal
						this.bitY = this.topY + spY;
						this.bitX = this.topX + spX;
						if (this.bitX >= 256 || this.bitY >= 240)
						{
							continue;
						}
						this.l_bit_pal = ((this.pt1_row & 0x80 >> this.fitX) << 1 | (this.pt0_row & 0x80 >> this.fitX)) >> (7 - this.fitX);
						// Don't render transparent point
						if (this.l_bit_pal == 0)
						{
							continue;
						}
						this.point = (this.bitY * 256) + this.bitX;					// current render point
						this.bgPoint = this.background[this.point];					// 对应的背景点
						// if it is in foreground and isnt transparent(如果在前景或背景为透明的话)
						if (this.foreground || this.bgPoint == 0)
						{
							this.pal_index = this.u_bit_pal << 2 | this.l_bit_pal;		// make color index
							this.pal_data = this.VRAM[0x3F10 + this.pal_index];
							this.output[this.point] = this.bus.pal[this.pal_data];		// save ponit
						}
					}
				}
			}
		}
		/**
		 * Read data.
		 */
		public r(address: number): number
		{
			var value = 0;
			if (address == 0x2002) // PPU status
			{
				value = (+this.VBlank) << 7 | (+this.hit) << 6 | (+this.more8Sprite) << 5 | (+this.ignoreWrite) << 4;
				this.VBlank = false;
				this.toggle = false;
			}
			else if (address == 0x2007) // VRAM data
			{
				if (this.reg2006 >= 0x3F20)
				{
					console.log('PPU read 0x3F20');
				}
				else if (this.reg2006 >= 0x3F00)
				{
					value = this.VRAM[this.reg2006];
				}
				else if (this.reg2006 >= 0x3000)
				{
					console.log('PPU read 0x3000');
				}
				else
				{
					value = this.readBuffer;
					this.readBuffer = this.VRAM[this.reg2006];
				}
				// move to next position
				this.reg2006 += 1 + (this.offset32 * 31);
				this.reg2006 &= 0xFFFF;
			}
			else if (address == 0x2004)
			{
				value = this.VRAM[this.reg2003];
				this.reg2003 += 1;
				this.reg2003 &= 0xFF;
			}
			else
			{
				console.log('unknown PPU read', address);
			}
			return value;
		}
		/**
		 * Write data.
		 */
		public w(address: number, value: number): void
		{
			if (address == 0x2007) // VRAM data
			{
				if (this.reg2006 >= 0x3F20)
				{
					//console.log('PPU write 0x3F20');
				}
				else if (this.reg2006 >= 0x3F00)
				{
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
					else if (this.reg2006 % 0x04 != 0)
					{
						// invalid write in 0x3F04|0x3F08|0x3F0C|0x3F14|0x3F18|0x3F1C
						this.VRAM[this.reg2006] = (value & 0x3F);
					}
				}
				else if (this.reg2006 >= 0x3000)
				{
					//console.log('PPU write 0x3000', this.scanline);
				}
				else if (this.reg2006 >= 0x2000)
				{
					if (this.bus.mirrorS)
					{
						this.VRAM[0x2000 + (this.reg2006 & 0x3FF)] = value;
						this.VRAM[0x2400 + (this.reg2006 & 0x3FF)] = value;
						this.VRAM[0x2800 + (this.reg2006 & 0x3FF)] = value;
						this.VRAM[0x2C00 + (this.reg2006 & 0x3FF)] = value;
					}
					else if (this.bus.mirrorF)
					{
						this.VRAM[this.reg2006] = value;
					}
					else if (this.reg2006 >= 0x2C00)
					{
						this.VRAM[this.reg2006] = value;
						if (this.bus.mirrorV)
						{
							this.VRAM[this.reg2006 - 0x0800] = value;
						}
						else
						{
							this.VRAM[this.reg2006 - 0x0400] = value;
						}
					}
					else if (this.reg2006 >= 0x2800)
					{
						this.VRAM[this.reg2006] = value;
						if (this.bus.mirrorV)
						{
							this.VRAM[this.reg2006 - 0x0800] = value;
						}
						else
						{
							this.VRAM[this.reg2006 + 0x0400] = value;
						}
					}
					else if (this.reg2006 >= 0x2400)
					{
						this.VRAM[this.reg2006] = value;
						if (this.bus.mirrorV)
						{
							this.VRAM[this.reg2006 + 0x0800] = value;
						}
						else
						{
							this.VRAM[this.reg2006 - 0x0400] = value;
						}
					}
					else if (this.reg2006 >= 0x2000)
					{
						this.VRAM[this.reg2006] = value;
						if (this.bus.mirrorV)
						{
							this.VRAM[this.reg2006 + 0x0800] = value;
						}
						else
						{
							this.VRAM[this.reg2006 + 0x0400] = value;
						}
					}
				}
				else
				{
					this.VRAM[this.reg2006] = value;
				}
				// move to next position
				this.reg2006 += 1 + (this.offset32 * 31);
				this.reg2006 &= 0xFFFF;
			}
			else if (address == 0x2006) // VRAM address
			{
				if (this.toggle)	// lower,second time
				{
					this.regTemp &= 0x7F00;			// cleare data
					this.regTemp |= value;
					this.reg2006 = this.regTemp;
				}
				else	// upper,first time
				{
					this.regTemp &= 0x00FF;					// cleare data
					this.regTemp |= (value & 0x3F) << 8;
				}
				this.toggle = !this.toggle					// toggle switch
			}
			else if (address == 0x2005) // VRAM address
			{
				if (this.toggle) // Y,second time
				{
					this.regTemp &= 0xC1F;					// cleare data
					this.regTemp |= (value & 0xF8) << 2;	// Tile Y
					this.regTemp |= (value & 0x7) << 12;	// Fine Y
				}
				else // X,first time				
				{
					this.regTemp &= 0xFFE0;					// cleare data
					this.regTemp |= value >> 3;				// Tile X
					this.FH = value & 0x7;					// Fine X
				}
				this.toggle = !this.toggle;					// toggle switch
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
			else if (address == 0x2001) // control register 2		- 控制寄存器2
			{
				this.BWColor = (value & 0x01) > 0;
				this.BGL1Col = (value & 0x02) > 0;
				this.SPL1Col = (value & 0x04) > 0;
				this.hideBG = !(value & 0x08);
				this.hideSP = !(value & 0x10);
				this.lightness = (value & 0xE0) >> 5;
				//console.log(SPL1Col, BGL1Col);
			}
			else if (address == 0x2000)	// control register 1
			{
				this.regTemp &= 0xF3FF;						// cleare data
				this.regTemp |= (value & 0x03) << 10;
				this.offset32 = (value & 0x4) >> 2;
				this.SPHeadAddr = (value & 0x08) && 0x1000;
				this.BGHeadAddr = (value & 0x10) && 0x1000;
				this._8x16 = (value & 0x20) > 0;
				this.NMI = (value & 0x80) > 0;
			}
			else
			{
				console.log('unknown PPU write', address);
			}
		}
	}
}