/// <reference path="Node.ts" />
namespace anes
{
	/**
	 * APU.
	 */
	export class APU extends Node
	{
		/**
		 * Defines.
		 */
		static readonly MAX_BUF_SAMPLES = 2048 * 128;
		/**
		 * Sample.
		 */
		public samples = new Array<SAMPLE>();
		public sampleBuffer = new Float32Array(2048 * 128);
		public sampleReadPos: number = 0;
		public sampleWritePos: number = 0;
		/**
		 * Channels.
		 */
		public chR: Array<RECTANGLE> = [new RECTANGLE(), new RECTANGLE()];
		public chT: TRIANGLE = new TRIANGLE();
		public chN: NOISE = new NOISE();
		public chD: DPCM = new DPCM();

		public vblLength = new Int32Array([5, 127, 10, 1, 19, 2, 40, 3, 80, 4, 30, 5, 7, 6, 13, 7, 6, 8, 12, 9, 24, 10, 48, 11, 96, 12, 36, 13, 8, 14, 16, 15]);
		public freqLimit = new Int32Array([0x03FF, 0x0555, 0x0666, 0x071C, 0x0787, 0x07C1, 0x07E0, 0x07F0]);
		public dutyLut = new Int32Array([2, 4, 8, 12]);
		public noiseFreq = new Int32Array([4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068]);
		public dpcmCycles = new Int32Array([428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 85, 72, 54]);

		public reg4015: number = 0;
		public reg4015_sync: number = 0;

		public elapsedTime: number = 0;
		public frameCycles: number = 0;
		public samplingRate: number = 22050;
		public cycleRate: number;
		/**
		 * Constructor.
		 */
		constructor(bus: Bus)
		{
			super();
			this.bus = bus;

			this.cycleRate = (CPU.frequency * 65536 / this.samplingRate);
		}
		/**
		 * Reset.
		 */
		public reset(): void
		{
		}
		/**
		 * Read data.
		 */
		public r(addr: number): number
		{
			var data: number = 0;
			if (addr == 0x4017)
			{
				data |= (1 << 6);
			}
			return data;
		}
		/**
		 * Write data.
		 */
		public w(addr: number, data: number): void
		{
			if (addr >= 0x4000 && addr <= 0x401F)
			{
				this.virtualWrite(addr, data);
				// add samples
				var s: SAMPLE = new SAMPLE;
				s.time = this.bus.cpu.execedCC;
				s.addr = addr;
				s.data = data;
				this.samples.push(s);
			}
		}
		/**
		 * Shift sample.
		 */
		public shiftSample(writeTime: number): SAMPLE
		{
			if (this.samples.length == 0)
			{
				return null;
			}
			var q: SAMPLE = this.samples[0];
			if (q.time <= writeTime)
			{
				this.samples.shift();
				return q;
			}
			return null;
		}
		/**
		 * Push samples to output.
		 */
		public pushSamplesTo(output: AudioBuffer): void
		{
			var onceSamples: number = 2048;

			var bodySize: number = this.sampleWritePos;
			var availableSize: number = bodySize - this.sampleReadPos;
			if (availableSize < onceSamples)
			{
				// fill empty
				for (var ch = 0; ch < output.numberOfChannels; ch++)
				{
					var outputData = output.getChannelData(ch);
					for (var i: number = 0; i < onceSamples; i++)
					{
						outputData[i] = 0;
					}
					return;
				}
			}
			// 1.gen samples
			var outputSamples = new Float32Array(this.sampleBuffer.buffer, this.sampleReadPos * 4, onceSamples);
			for (var ch = 0; ch < output.numberOfChannels; ch++)
			{
				var outputData = output.getChannelData(ch);
				outputData.set(outputSamples);
			}
			// 2.update offset
			this.sampleReadPos += onceSamples;
			// 3.clear buffer
			if (bodySize >= 2048 * 128 / 2)
			{
				var sliceLen = bodySize - this.sampleReadPos;
				this.sampleBuffer.copyWithin(0, this.sampleReadPos, bodySize);
				this.sampleReadPos = 0;
				this.sampleWritePos = sliceLen;
			}
		}
		/**
		 * Render samples.
		 */
		public renderSamples(size: number): void
		{
			var output: number;
			var writeTime: number = 0;

			var s: SAMPLE;
			var addr: number;
			var data: number;

			var vol = new Uint32Array(24);
			vol[0] = 0x0F0;
			vol[1] = 0x0F0;
			vol[2] = 0x130;
			vol[3] = 0x0C0;
			vol[4] = 0x0F0;

			// flush accumulated samples
			if (this.elapsedTime > this.bus.cpu.execedCC)
			{
				while (this.samples.length)
				{
					s = this.samples.shift();
					// write data
					addr = s.addr;
					data = s.data;
					if (addr >= 0x4000 && addr <= 0x401F)
					{
						this.realWrite(addr, data);
					}
				}
			}
			// flush each sample
			while (size--)
			{
				writeTime = this.elapsedTime;
				for (; ;)
				{
					s = this.shiftSample(writeTime);
					if (s == null)
					{
						break;
					}
					// write data
					addr = s.addr;
					data = s.data;
					if (addr >= 0x4000 && addr <= 0x401F)
					{
						this.realWrite(addr, data);
					}
				}
				// merge rendering results
				output = 0;
				output += this.renderRectangle(this.chR[0]) * vol[0];
				output += this.renderRectangle(this.chR[1]) * vol[1];
				output += this.renderTriangle() * vol[2];
				output += this.renderNoise() * vol[3];
				output += this.renderDPCM() * vol[4];
				output >>= 8;
				if (output > 0x7FFF)
				{
					output = 0x7FFF;
				}
				else if (output < -0x8000)
				{
					output = -0x8000;
				}
				output /= 2;
				// write sample to buffer
				var multiplier: number = 1 / 32768;
				var sample: number = output * multiplier * 5;
				this.sampleBuffer[this.sampleWritePos] = sample;
				this.sampleWritePos++;
				this.sampleWritePos %= 2048 * 128;
				// sum time
				this.elapsedTime += 81.168820;
			}
			// sync time
			this.elapsedTime = this.bus.cpu.execedCC;
		}
		/**
		 * Real write data.
		 */
		public realWrite(addr: number, data: number): void
		{
			var no: number;
			var ch: RECTANGLE;
			if (addr >= 0x4000 && addr <= 0x401F)
			{
				switch (addr)
				{
					case 0x4000:
					case 0x4001:
					case 0x4002:
					case 0x4003:
					case 0x4004:
					case 0x4005:
					case 0x4006:
					case 0x4007:
						// write rectangle
						no = (addr < 0x4004) ? 0 : 1;
						ch = this.chR[no];
						ch.reg[addr & 3] = data;
						switch (addr & 3)
						{
							case 0:
								ch.holdnote = data & 0x20;
								ch.volume = data & 0x0F;
								ch.env_fixed = data & 0x10;
								ch.env_decay = (data & 0x0F) + 1;
								ch.duty = this.dutyLut[data >> 6];
								break;
							case 1:
								ch.swp_on = data & 0x80;
								ch.swp_inc = data & 0x08;
								ch.swp_shift = data & 0x07;
								ch.swp_decay = ((data >> 4) & 0x07) + 1;
								ch.freqlimit = this.freqLimit[data & 0x07];
								break;
							case 2:
								ch.freq = (ch.freq & (~0xFF)) + data;
								break;
							case 3:
								ch.freq = ((data & 0x07) << 8) + (ch.freq & 0xFF);
								ch.len_count = this.vblLength[data >> 3] * 2;
								ch.env_vol = 0x0F;
								ch.env_count = ch.env_decay + 1;
								ch.adder = 0;
								if (this.reg4015 & (1 << no))
								{
									ch.enable = 0xFF;
								}
								break;
						}
						break;
					case 0x4008:
					case 0x4009:
					case 0x400A:
					case 0x400B:
						// write triangle
						this.chT.reg[addr & 3] = data;
						switch (addr & 3)
						{
							case 0:
								this.chT.holdnote = data & 0x80;
								break;
							case 1:
								break;
							case 2:
								this.chT.freq = ((((this.chT.reg[3] & 0x07) << 8) + data + 1)) << 16;
								break;
							case 3:
								this.chT.freq = ((((data & 0x07) << 8) + this.chT.reg[2] + 1)) << 16;
								this.chT.len_count = this.vblLength[data >> 3] * 2;
								this.chT.counter_start = 0x80;
								if (this.reg4015 & (1 << 2))
								{
									this.chT.enable = 0xFF;
								}
								break;
						}
						break;
					case 0x400C:
					case 0x400D:
					case 0x400E:
					case 0x400F:
						// write noise
						this.chN.reg[addr & 3] = data;
						switch (addr & 3)
						{
							case 0:
								this.chN.holdnote = data & 0x20;
								this.chN.volume = data & 0x0F;
								this.chN.env_fixed = data & 0x10;
								this.chN.env_decay = (data & 0x0F) + 1;
								break;
							case 1:
								break;
							case 2:
								this.chN.freq = (this.noiseFreq[data & 0x0F]) << 16;
								this.chN.xor_tap = (data & 0x80) ? 0x40 : 0x02;
								break;
							case 3:
								this.chN.len_count = this.vblLength[data >> 3] * 2;
								this.chN.env_vol = 0x0F;
								this.chN.env_count = this.chN.env_decay + 1;
								if (this.reg4015 & (1 << 3))
								{
									this.chN.enable = 0xFF;
								}
								break;
						}
						break;
					case 0x4010:
					case 0x4011:
					case 0x4012:
					case 0x4013:
						// write DPCM
						this.chD.reg[addr & 3] = data;
						switch (addr & 3)
						{
							case 0:
								this.chD.freq = (this.dpcmCycles[data & 0x0F]) << 16;
								this.chD.looping = data & 0x40;
								break;
							case 1:
								this.chD.dpcm_value = (data & 0x7F) >> 1;
								break;
							case 2:
								this.chD.cache_addr = 0xC000 + (data << 6);
								break;
							case 3:
								this.chD.cache_dmalength = ((data << 4) + 1) << 3;
								break;
						}
						break;
					case 0x4015:
						this.reg4015 = data;
						if (!(data & (1 << 0)))
						{
							this.chR[0].enable = 0;
							this.chR[0].len_count = 0;
						}
						if (!(data & (1 << 1)))
						{
							this.chR[1].enable = 0;
							this.chR[1].len_count = 0;
						}
						if (!(data & (1 << 2)))
						{
							this.chT.enable = 0;
							this.chT.len_count = 0;
							this.chT.lin_count = 0;
							this.chT.counter_start = 0;
						}
						if (!(data & (1 << 3)))
						{
							this.chN.enable = 0;
							this.chN.len_count = 0;
						}
						if (!(data & (1 << 4)))
						{
							this.chD.enable = 0;
							this.chD.dmalength = 0;
						}
						else
						{
							this.chD.enable = 0xFF;
							if (!this.chD.dmalength)
							{
								this.chD.address = this.chD.cache_addr;
								this.chD.dmalength = this.chD.cache_dmalength;
								this.chD.phaseacc = 0;
							}
						}
						break;
					case 0x4018:
						// update rectangle
						for (var i: number = 0; i < 2; i++)
						{
							ch = this.chR[i];
							if (ch.enable && ch.len_count > 0)
							{
								if (!(data & 1))
								{
									if (ch.len_count && !ch.holdnote)
									{
										if (ch.len_count)
										{
											ch.len_count--;
										}
									}
									if (ch.swp_on && ch.swp_shift)
									{
										if (ch.swp_count)
										{
											ch.swp_count--;
										}
										if (ch.swp_count == 0)
										{
											ch.swp_count = ch.swp_decay;
											if (ch.swp_inc)
											{
												if (!ch.complement)
												{
													ch.freq += ~(ch.freq >> ch.swp_shift); // CH 0
												}
												else
												{
													ch.freq -= (ch.freq >> ch.swp_shift); // CH 1
												}
											}
											else
											{
												ch.freq += (ch.freq >> ch.swp_shift);
											}
										}
									}
								}
								if (ch.env_count)
								{
									ch.env_count--;
								}
								if (ch.env_count == 0)
								{
									ch.env_count = ch.env_decay;
									if (ch.holdnote)
									{
										ch.env_vol = (ch.env_vol - 1) & 0x0F;
									}
									else if (ch.env_vol)
									{
										ch.env_vol--;
									}
								}
								if (!ch.env_fixed)
								{
									ch.nowvolume = ch.env_vol << 8;
								}
							}
						}
						// update triangle
						if (this.chT.enable)
						{
							if (!(data & 1) && !this.chT.holdnote)
							{
								if (this.chT.len_count)
								{
									this.chT.len_count--;
								}
							}
							if (this.chT.counter_start)
							{
								this.chT.lin_count = this.chT.reg[0] & 0x7F;
							}
							else if (this.chT.lin_count)
							{
								this.chT.lin_count--;
							}
							if (!this.chT.holdnote && this.chT.lin_count)
							{
								this.chT.counter_start = 0;
							}
						}
						// update noise
						if (this.chN.enable && this.chN.len_count > 0)
						{
							if (!this.chN.holdnote)
							{
								if (!(data & 1) && this.chN.len_count)
								{
									this.chN.len_count--;
								}
							}
							if (this.chN.env_count)
							{
								this.chN.env_count--;
							}
							if (this.chN.env_count == 0)
							{
								this.chN.env_count = this.chN.env_decay;
								if (this.chN.holdnote)
								{
									this.chN.env_vol = (this.chN.env_vol - 1) & 0x0F;
								}
								else if (this.chN.env_vol)
								{
									this.chN.env_vol--;
								}
							}
							if (!this.chN.env_fixed)
							{
								this.chN.nowvolume = this.chN.env_vol << 8;
							}
						}
						break;
				}
			}
		}
		/**
		 * Virtual Write Data.
		 */
		public virtualWrite(addr: number, data: number): void
		{
			var no: number;
			var ch: RECTANGLE;
			switch (addr)
			{
				case 0x4000:
				case 0x4001:
				case 0x4002:
				case 0x4003:
				case 0x4004:
				case 0x4005:
				case 0x4006:
				case 0x4007:
					// write rectangle
					no = (addr < 0x4004) ? 0 : 1;
					ch = this.chR[no];
					ch.sync_reg[addr & 3] = data;
					switch (addr & 3)
					{
						case 0:
							ch.sync_holdnote = data & 0x20;
							break;
						case 1:
						case 2:
							break;
						case 3:
							ch.sync_len_count = this.vblLength[data >> 3] * 2;
							if (this.reg4015_sync & (1 << no))
							{
								ch.sync_enable = 0xFF;
							}
							break;
					}
					break;
				case 0x4008:
				case 0x4009:
				case 0x400A:
				case 0x400B:
					// write triangle
					this.chT.sync_reg[addr & 3] = data;
					switch (addr & 3)
					{
						case 0:
							this.chT.sync_holdnote = data & 0x80;
							break;
						case 1:
							break;
						case 2:
							break;
						case 3:
							this.chT.sync_len_count = this.vblLength[this.chT.sync_reg[3] >> 3] * 2;
							this.chT.sync_counter_start = 0x80;
							if (this.reg4015_sync & (1 << 2))
							{
								this.chT.sync_enable = 0xFF;
							}
							break;
					}
					break;
				case 0x400C:
				case 0x400D:
				case 0x400E:
				case 0x400F:
					// write noise
					this.chN.sync_reg[addr & 3] = data;
					switch (addr & 3)
					{
						case 0:
							this.chN.sync_holdnote = data & 0x20;
							break;
						case 1:
							break;
						case 2:
							break;
						case 3:
							this.chN.sync_len_count = this.vblLength[data >> 3] * 2;
							if (this.reg4015_sync & (1 << 3))
							{
								this.chN.sync_enable = 0xFF;
							}
							break;
					}
					break;
				case 0x4010:
				case 0x4011:
				case 0x4012:
				case 0x4013:
					// write DPCM
					this.chD.reg[addr & 3] = data;
					switch (addr & 3)
					{
						case 0:
							this.chD.sync_cache_cycles = this.dpcmCycles[data & 0x0F] * 8;
							this.chD.sync_looping = data & 0x40;
							this.chD.sync_irq_gen = data & 0x80;
							if (!this.chD.sync_irq_gen)
							{
								this.chD.sync_irq_enable = 0;
							}
							break;
						case 1:
							break;
						case 2:
							break;
						case 3:
							this.chD.sync_cache_dmalength = (data << 4) + 1;
							break;
					}
					break;
				case 0x4015:
					this.reg4015_sync = data;
					if (!(data & (1 << 0)))
					{
						this.chR[0].sync_enable = 0;
						this.chR[0].sync_len_count = 0;
					}
					if (!(data & (1 << 1)))
					{
						this.chR[1].sync_enable = 0;
						this.chR[1].sync_len_count = 0;
					}
					if (!(data & (1 << 2)))
					{
						this.chT.sync_enable = 0;
						this.chT.sync_len_count = 0;
						this.chT.sync_lin_count = 0;
						this.chT.sync_counter_start = 0;
					}
					if (!(data & (1 << 3)))
					{
						this.chN.sync_enable = 0;
						this.chN.sync_len_count = 0;
					}
					if (!(data & (1 << 4)))
					{
						this.chD.sync_enable = 0;
						this.chD.sync_dmalength = 0;
						this.chD.sync_irq_enable = 0;
					}
					else
					{
						this.chD.sync_enable = 0xFF;
						if (!this.chD.sync_dmalength)
						{
							this.chD.sync_dmalength = this.chD.sync_cache_dmalength;
							this.chD.sync_cycles = 0;
						}
					}
					break;
				case 0x4017:
					this.frameCycles = 0;
					if (data & 0x80)
					{
						this.updateFrame();
					}
				case 0x4018:
					// update rectangle
					for (var i: number = 0; i < 2; i++)
					{
						ch = this.chR[i];
						if (ch.sync_enable && ch.sync_len_count > 0)
						{
							if (ch.sync_len_count && !ch.sync_holdnote)
							{
								if (!(data & 1) && ch.sync_len_count)
								{
									ch.sync_len_count--;
								}
							}
						}
					}
					// update triangle
					if (this.chT.sync_enable)
					{
						if (!(data & 1) && !this.chT.sync_holdnote)
						{
							if (this.chT.sync_len_count)
							{
								this.chT.sync_len_count--;
							}
						}
						if (this.chT.sync_counter_start)
						{
							this.chT.sync_lin_count = this.chT.sync_reg[0] & 0x7F;
						}
						else if (this.chT.sync_lin_count)
						{
							this.chT.sync_lin_count--;
						}
						if (!this.chT.sync_holdnote && this.chT.sync_lin_count)
						{
							this.chT.sync_counter_start = 0;
						}
					}
					// update noise
					if (this.chN.sync_enable && this.chN.sync_len_count > 0)
					{
						if (this.chN.sync_len_count && !this.chN.sync_holdnote)
						{
							if (!(data & 1) && this.chN.sync_len_count)
							{
								this.chN.sync_len_count--;
							}
						}
					}
					break;
			}
		}
		/**
		 * Update Frame.
		 */
		public updateFrame(): void
		{
			this.bus.cpu.w(0x4018, 0);
		}
		/**
		 * Render Rectangle Wave.
		 */
		public renderRectangle(ch: RECTANGLE): number
		{
			if (!ch.enable || ch.len_count <= 0)
			{
				return 0;
			}
			if ((ch.freq < 8) || (!ch.swp_inc && ch.freq > ch.freqlimit))
			{
				return 0;
			}
			if (ch.env_fixed)
			{
				ch.nowvolume = ch.volume << 8;
			}
			var volume: number = ch.nowvolume;
			var total: number;
			var sample_weight: number = ch.phaseacc;
			if (sample_weight > this.cycleRate)
			{
				sample_weight = this.cycleRate;
			}
			total = (ch.adder < ch.duty) ? sample_weight : -sample_weight;
			var freq: number = (ch.freq + 1) << 16;
			ch.phaseacc -= this.cycleRate;
			while (ch.phaseacc < 0)
			{
				ch.phaseacc += freq;
				ch.adder = (ch.adder + 1) & 0x0F;

				sample_weight = freq;
				if (ch.phaseacc > 0)
				{
					sample_weight -= ch.phaseacc;
				}
				total += (ch.adder < ch.duty) ? sample_weight : -sample_weight;
			}
			return Math.floor(volume * total / this.cycleRate + 0.5);
		}
		/**
		 * Render Triangle Wave.
		 */
		public renderTriangle(): number
		{
			var vol: number;
			var vol = 256 - ((this.chD.reg[1] & 0x01) + this.chD.dpcm_value * 2);
			if (!this.chT.enable || (this.chT.len_count <= 0) || (this.chT.lin_count <= 0))
			{
				return this.chT.nowvolume * vol / 256;
			}
			if (this.chT.freq < (8 << 16))
			{
				return this.chT.nowvolume * vol / 256;
			}
			this.chT.phaseacc -= this.cycleRate;
			if (this.chT.phaseacc >= 0)
			{
				return this.chT.nowvolume * vol / 256;
			}
			if (this.chT.freq > this.cycleRate)
			{
				this.chT.phaseacc += this.chT.freq;
				this.chT.adder = (this.chT.adder + 1) & 0x1F;

				if (this.chT.adder < 0x10)
				{
					this.chT.nowvolume = (this.chT.adder & 0x0F) << 9;
				}
				else
				{
					this.chT.nowvolume = (0x0F - (this.chT.adder & 0x0F)) << 9;
				}

				return this.chT.nowvolume * vol / 256;
			}
			var num_times: number;
			var total: number;
			num_times = total = 0;
			while (this.chT.phaseacc < 0)
			{
				this.chT.phaseacc += this.chT.freq;
				this.chT.adder = (this.chT.adder + 1) & 0x1F;

				if (this.chT.adder < 0x10)
				{
					this.chT.nowvolume = (this.chT.adder & 0x0F) << 9;
				}
				else
				{
					this.chT.nowvolume = (0x0F - (this.chT.adder & 0x0F)) << 9;
				}

				total += this.chT.nowvolume;
				num_times++;
			}
			return (total / num_times) * vol / 256;
		}
		/**
		 * Render Noise Wave.
		 */
		public renderNoise(): number
		{
			if (!this.chN.enable || this.chN.len_count <= 0)
			{
				return 0;
			}
			if (this.chN.env_fixed)
			{
				this.chN.nowvolume = this.chN.volume << 8;
			}
			var vol: number = 256 - ((this.chD.reg[1] & 0x01) + this.chD.dpcm_value * 2);
			this.chN.phaseacc -= this.cycleRate;
			if (this.chN.phaseacc >= 0)
			{
				return this.chN.output * vol / 256;
			}
			if (this.chN.freq > this.cycleRate)
			{
				this.chN.phaseacc += this.chN.freq;
				if (this.noiseShiftReg(this.chN.xor_tap))
				{
					this.chN.output = this.chN.nowvolume;
				}
				else
				{
					this.chN.output = -this.chN.nowvolume;
				}
				return this.chN.output * vol / 256;
			}
			var num_times: number;
			var total: number;
			num_times = total = 0;
			while (this.chN.phaseacc < 0)
			{
				if (this.chN.freq == 0)
				{
					break;
				}
				this.chN.phaseacc += this.chN.freq;
				if (this.noiseShiftReg(this.chN.xor_tap))
				{
					this.chN.output = this.chN.nowvolume;
				}
				else
				{
					this.chN.output = -this.chN.nowvolume;
				}
				total += this.chN.output;
				num_times++;
			}
			return (total / num_times) * vol / 256;
		}
		/**
		 * Render DPCM.
		 */
		public renderDPCM(): number
		{
			if (this.chD.dmalength)
			{
				this.chD.phaseacc -= this.cycleRate;
				while (this.chD.phaseacc < 0)
				{
					this.chD.phaseacc += this.chD.freq;
					if (!(this.chD.dmalength & 7))
					{
						this.chD.cur_byte = this.bus.cpu.r(this.chD.address);
						if (0xFFFF == this.chD.address)
						{
							this.chD.address = 0x8000;
						}
						else
						{
							this.chD.address++;
						}
					}
					if (!(--this.chD.dmalength))
					{
						if (this.chD.looping)
						{
							this.chD.address = this.chD.cache_addr;
							this.chD.dmalength = this.chD.cache_dmalength;
						}
						else
						{
							this.chD.enable = 0;
							break;
						}
					}
					if (this.chD.cur_byte & (1 << ((this.chD.dmalength & 7) ^ 7)))
					{
						if (this.chD.dpcm_value < 0x3F)
						{
							this.chD.dpcm_value += 1;
						}
					}
					else
					{
						if (this.chD.dpcm_value > 1)
						{
							this.chD.dpcm_value -= 1;
						}
					}
				}
			}
			return this.chD.output;
		}
		/**
		 * Virtaul Update DPCM.
		 */
		public virtualUpdateDPCM(cycles: number): void
		{
			this.frameCycles += cycles;
			if (this.frameCycles >= 7458)
			{
				this.frameCycles -= 7458;
				this.bus.cpu.w(0x4018, 0); // 写入4018
			}
			if (this.chD.sync_enable)
			{
				this.chD.sync_cycles -= cycles;
				while (this.chD.sync_cycles < 0)
				{
					if (this.chD.sync_cache_cycles == 0)
					{
						break;
					}
					this.chD.sync_cycles += this.chD.sync_cache_cycles;
					if (this.chD.sync_dmalength)
					{
						if (!(--this.chD.sync_dmalength))
						{
							if (this.chD.sync_looping)
							{
								this.chD.sync_dmalength = this.chD.sync_cache_dmalength;
							}
							else
							{
								this.chD.sync_dmalength = 0;
								if (this.chD.sync_irq_gen)
								{
									this.chD.sync_irq_enable = 0xFF;
								}
							}
						}
					}
				}
			}
		}
		/**
		 * @private
		 */
		public noiseShiftReg(xor_tap: number): number
		{
			var bit0: number;
			var bit14: number;
			bit0 = this.chN.shift_reg & 1;
			if (this.chN.shift_reg & xor_tap)
			{
				bit14 = bit0 ^ 1;
			}
			else
			{
				bit14 = bit0 ^ 0;
			}
			this.chN.shift_reg >>= 1;
			this.chN.shift_reg |= (bit14 << 14);
			return (bit0 ^ 1);
		}
	}
	/**
	 * Sample.
	 */
	class SAMPLE
	{
		public time: number = 0;
		public addr: number = 0;
		public data: number = 0;
	}
	/**
	 * Rectangle Wave.
	 */
	class RECTANGLE
	{
		public reg: Float64Array = new Float64Array(4);

		public enable: number = 0;
		public holdnote: number = 0;
		public volume: number = 0;
		public complement: number = 0;

		public phaseacc: number = 0;
		public freq: number = 0;
		public freqlimit: number = 0;
		public adder: number = 0;
		public duty: number = 0;
		public len_count: number = 0;

		public nowvolume: number = 0;

		public env_fixed: number = 0;
		public env_decay: number = 0;
		public env_count: number = 0;
		public dummy0: number = 0;
		public env_vol: number = 0;

		public swp_on: number = 0;
		public swp_inc: number = 0;
		public swp_shift: number = 0;
		public swp_decay: number = 0;
		public swp_count: number = 0;
		public dummy1: Float64Array = new Float64Array(3);

		public sync_reg: Float64Array = new Float64Array(4);
		public sync_output_enable: number = 0;
		public sync_enable: number = 0;
		public sync_holdnote: number = 0;
		public dummy2: number = 0;
		public sync_len_count: number = 0;
	}
	/**
	 * Triangle Wave.
	 */
	class TRIANGLE
	{
		public reg: Float64Array = new Float64Array(4);

		public enable: number = 0;
		public holdnote: number = 0;
		public counter_start: number = 0;
		public dummy0: number = 0;

		public phaseacc: number = 0;
		public freq: number = 0;
		public len_count: number = 0;
		public lin_count: number = 0;
		public adder: number = 0;

		public nowvolume: number = 0;

		public sync_reg: Float64Array = new Float64Array(4);
		public sync_enable: number = 0;
		public sync_holdnote: number = 0;
		public sync_counter_start: number = 0;

		public sync_len_count: number = 0;
		public sync_lin_count: number = 0;
	}
	/**
	* Noise Wave.
	 */
	class NOISE
	{
		public reg: Float64Array = new Float64Array(4);

		public enable: number = 0;
		public holdnote: number = 0;
		public volume: number = 0;
		public xor_tap: number = 0;
		public shift_reg: number = 0;

		public phaseacc: number = 0;
		public freq: number = 0;
		public len_count: number = 0;

		public nowvolume: number = 0;
		public output: number = 0;

		public env_fixed: number = 0;
		public env_decay: number = 0;
		public env_count: number = 0;
		public dummy0: number = 0;
		public env_vol: number = 0;

		public sync_reg: Float64Array = new Float64Array(4);
		public sync_output_enable: number = 0;
		public sync_enable: number = 0;
		public sync_holdnote: number = 0;
		public dummy1: number = 0;
		public sync_len_count: number = 0;
	}
	/**
	 * DPCM.
	 */
	class DPCM
	{
		public reg: Float64Array = new Float64Array(4);
		public enable: number = 0;
		public looping: number = 0;
		public cur_byte: number = 0;
		public dpcm_value: number = 0;

		public freq: number = 0;
		public phaseacc: number = 0;
		public output: number = 0;

		public address: number = 0;
		public cache_addr: number = 0;
		public dmalength: number = 0;
		public cache_dmalength: number = 0;
		public dpcm_output_real: number = 0;
		public dpcm_output_fake: number = 0;
		public dpcm_output_old: number = 0;
		public dpcm_output_offset: number = 0;

		public sync_reg: Float64Array = new Float64Array(4);
		public sync_enable: number = 0;
		public sync_looping: number = 0;
		public sync_irq_gen: number = 0;
		public sync_irq_enable: number = 0;
		public sync_cycles: number = 0;
		public sync_cache_cycles: number = 0;
		public sync_dmalength: number = 0;
		public sync_cache_dmalength: number = 0;
	}
}
