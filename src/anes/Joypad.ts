namespace anes
{
	/**
	 * Joypad.
	 */
	export class Joypad
	{
		public dev0: number;
		public dev1: number;

		private dev0_nShift: number;
		private dev1_nShift: number;
		private bStrobe: Boolean;
		/**
		 * Constructor.
		 */
		constructor()
		{
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
		public r(dev: number): number
		{
			var data: number;
			if (dev == 0)
			{
				data = this.dev0 >> this.dev0_nShift & 0x1;
				this.dev0_nShift += 1;
				this.dev0_nShift %= 24;
			}
			else
			{
				data = this.dev1 >> this.dev1_nShift & 0x1;
				this.dev1_nShift += 1;
				this.dev1_nShift %= 24;
			}
			return data;
		}
		/**
		 * Write data.
		 */
		public w(data: number): void
		{
			if (data & 0x1 && this.bStrobe == false)
			{
				this.bStrobe = true;
			}
			else if (!(data & 0x1) && this.bStrobe)
			{
				// reset
				this.dev0_nShift = 0;
				this.dev1_nShift = 0;
				this.bStrobe = false;
			}
		}
	}
}