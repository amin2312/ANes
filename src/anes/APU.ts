/// <reference path="Node.ts" />
namespace anes
{
	/**
	 * APU.
	 */
	export class APU extends Node
	{
		public elapsedTime: number = 0;

		public samples = new Array<SAMPLE>();

		//public sound: Sound = new Sound;
		//public soundBuffer: ByteArray = new ByteArray;
		//public soundPosition: number = 0;

		public chR: Array<RECTANGLE> = [new RECTANGLE, new RECTANGLE];
		public chT: TRIANGLE = new TRIANGLE;
		public chN: NOISE = new NOISE;
		public chD: DPCM = new DPCM;

		public vblLength: Float64Array = new Float64Array([5, 127, 10, 1, 19, 2, 40, 3, 80, 4, 30, 5, 7, 6, 13, 7, 6, 8, 12, 9, 24, 10, 48, 11, 96, 12, 36, 13, 8, 14, 16, 15]);
		public freqLimit: Float64Array = new Float64Array([0x03FF, 0x0555, 0x0666, 0x071C, 0x0787, 0x07C1, 0x07E0, 0x07F0]);
		public dutyLut: Float64Array = new Float64Array([2, 4, 8, 12]);
		public noiseFreq: Float64Array = new Float64Array([4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068]);
		public dpcmCycles: Float64Array = new Float64Array([428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 85, 72, 54]);

		public frameCycles: number;
		///public FrameCount:number;
		///public FrameType:number;
		///public FrameIRQ:number;
		///public FrameIRQoccur:number;

		public reg4015: number;
		public sync_reg4015: number;

		public cpu_clock: number;
		public sampling_rate: number;
		public cycle_rate: number;
		/**
		 * 构造函数.
		 */
		constructor(bus: Bus)
		{
			super();
			this.bus = bus;

			this.bus = bus;
			///FrameIRQ = 0xC0;
			this.frameCycles = 0;
			///FrameIRQoccur = 0;
			///FrameCount = 0;
			///FrameType = 0;

			this.reg4015 = this.sync_reg4015 = 0;

			this.cpu_clock = 1789772.5;
			this.sampling_rate = 22050;
			this.cycle_rate = (1789772.5 * 65536 / 22050);

			// 监听样本事件
			//this.sound.addEventListener(SampleDataEvent.SAMPLE_DATA, this.onSampleDataEvent);
			//this.sound.play();
		}
		public reset(): void
		{
		}
		public r(addr: number): number
		{
			var data: number = 0;
			if (addr == 0x4017)
			{
				data |= (1 << 6);
			}
			return data;
		}
		public w(addr: number, data: number): void
		{
			if (addr >= 0x4000 && addr <= 0x401F)
			{
				this.virtualWrite(addr, data);
				// 加入原始样本
				var s: SAMPLE = new SAMPLE;
				s.time = this.bus.cpu.execedCC;
				s.addr = addr;
				s.data = data;
				this.samples.push(s);
			}
		}
		/**
		 * 获取样本.
		 */
		public shiftSample(writetime: number): SAMPLE
		{
			if (this.samples.length == 0)
			{
				return null;
			}
			var q: SAMPLE = this.samples[0];
			if (q.time <= writetime)
			{
				this.samples.shift();
				return q;
			}
			return null;
		}
		/**
		 * 样本事件.
		public onSampleDataEvent(e: SampleDataEvent): void
		{
			var numSamples: number = 2048;
			var sizeSamples: number = numSamples * 8;

			var len: number = this.soundBuffer.length;
			var pos: number = this.soundPosition;
			var size: number = len - pos;

			if (size < sizeSamples)
			{
				for (var i: number = 0; i < numSamples; i++)
				{
					e.data.writeFloat(0);
					e.data.writeFloat(0);
				}
				return;
			}
			// 写入样本
			e.data.writeBytes(this.soundBuffer, pos, sizeSamples);
			// 移动偏移
			this.soundPosition += sizeSamples;
			// 清空BUFFER
			if (len >= 1048576)
			{
				var tmp: ByteArray = new ByteArray;
				tmp.writeBytes(this.soundBuffer, this.soundPosition, this.soundBuffer.length - this.soundPosition);
				tmp.position = 0;

				this.soundBuffer.position = 0;
				this.soundBuffer.length = 0;
				this.soundPosition = 0;

				this.soundBuffer.writeBytes(tmp);
			}
		}
		 */
		/**
		 * 渲染声音样本.
		 */
		public renderSamples(dwSize: number): void
		{
			var output: number;
			var writeTime: number = 0;

			var s: SAMPLE;
			var addr: number;
			var data: number;

			var vol: Uint8Array = new Uint8Array(24);
			vol[0] = 0x0F0;
			vol[1] = 0x0F0;
			vol[2] = 0x130;
			vol[3] = 0x0C0;
			vol[4] = 0x0F0;

			// 刷入所有样本
			if (this.elapsedTime > this.bus.cpu.execedCC)
			{
				while (this.samples.length)
				{
					s = this.samples.shift();
					// 写入数据
					addr = s.addr;
					data = s.data;
					if (addr >= 0x4000 && addr <= 0x401F)
					{
						this.realWrite(addr, data);
					}
				}
			}
			// 逐个刷入样本
			while (dwSize--)
			{
				writeTime = this.elapsedTime;
				for (; ;)
				{
					s = this.shiftSample(writeTime);
					if (s == null)
					{
						break;
					}
					// 写入数据
					addr = s.addr;
					data = s.data;
					if (addr >= 0x4000 && addr <= 0x401F)
					{
						this.realWrite(addr, data);
					}
				}
				// 输出声音样本
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
				// 写入FLASH声音样本
				var multiplier: number = 1 / 32768;
				var sample: number = output * multiplier * 5;
				//this.soundBuffer.writeFloat(sample);
				//this.soundBuffer.writeFloat(sample);
				// 累加时间
				//elapsedTime += 6.764063492063492;
				this.elapsedTime += 81.168820;
			}
			// 同步时间
			this.elapsedTime = this.bus.cpu.execedCC;
		}
		/**
		 * 真正写入.
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
						// WriteRectangle
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
						// WriteTriangle
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
						// WriteNoise
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
						// WriteDPCM
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
						// updateRectangle
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
						// updateTriangle
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
						// updateNoise
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
		 * 写入(虚拟).
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
							if (this.sync_reg4015 & (1 << no))
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
					// syncWriteTriangle
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
							if (this.sync_reg4015 & (1 << 2))
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
					// syncWriteNoise
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
							if (this.sync_reg4015 & (1 << 3))
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
					// syncWriteDPCM
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
								///nes->cpu->ClrIRQ( IRQ_DPCM );
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
					this.sync_reg4015 = data;
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
						///nes.cpu.ClrIRQ( IRQ_DPCM );
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
					// SyncWrite4017(data);
					this.frameCycles = 0;
					///FrameIRQ = data;
					///FrameIRQoccur = 0;
					///nes.cpu.ClrIRQ( IRQ_FRAMEIRQ );
					///FrameType = (data & 0x80) ? 1 : 0;
					///FrameCount = 0;
					if (data & 0x80)
					{
						this.UpdateFrame();
					}
					///FrameCount = 1;
					this.frameCycles = 7458;
					break;
				case 0x4018:
					// syncUpdateRectangle
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
					// syncUpdateTriangle
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
					// syncUpdateNoise(data);
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
		 * 更新帧.
		 */
		public UpdateFrame(): void
		{
			/*///
			if(!FrameCount)
			{
			if(!(FrameIRQ & 0xC0) && nes.GetFrameIRQmode())
			{
			FrameIRQoccur = 0xFF;
			nes.cpu.SetIRQ(IRQ_FRAMEIRQ);
			}
			}
			*/
			////if(FrameCount == 3)
			///{
			///	if(FrameIRQ & 0x80)
			///	{
			///		frameCycles += 7458;
			//	}
			///}

			///bus.cpu.w1(0x4018,FrameCount);
			this.bus.cpu.w(0x4018, 0);
			///FrameCount = (FrameCount + 1) & 3;
		}
		/**
		 * 渲染方形波.
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
			if (sample_weight > this.cycle_rate)
			{
				sample_weight = this.cycle_rate;
			}
			total = (ch.adder < ch.duty) ? sample_weight : -sample_weight;
			var freq: number = (ch.freq + 1) << 16;
			ch.phaseacc -= this.cycle_rate;
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
			return Math.floor(volume * total / this.cycle_rate + 0.5);
		}
		/**
		 * 渲染三角波.
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
			this.chT.phaseacc -= this.cycle_rate;
			if (this.chT.phaseacc >= 0)
			{
				return this.chT.nowvolume * vol / 256;
			}
			if (this.chT.freq > this.cycle_rate)
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
		 * 渲染噪声波.
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
			this.chN.phaseacc -= this.cycle_rate;
			if (this.chN.phaseacc >= 0)
			{
				return this.chN.output * vol / 256;
			}
			if (this.chN.freq > this.cycle_rate)
			{
				this.chN.phaseacc += this.chN.freq;
				if (this.noiseShiftreg(this.chN.xor_tap))
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
				if (this.noiseShiftreg(this.chN.xor_tap))
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
		 * 渲染差分脉冲编码调制.
		 */
		public renderDPCM(): number
		{
			if (this.chD.dmalength)
			{
				this.chD.phaseacc -= this.cycle_rate;

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
			/*
			chD.dpcm_output_real = ((chD.reg[1] & 0x01) + chD.dpcm_value * 2) - 0x40;
			if(Math.abs(chD.dpcm_output_real - chD.dpcm_output_fake) <= 8)
			{
			chD.dpcm_output_fake = chD.dpcm_output_real;
			chD.output = chD.dpcm_output_real << 8;
			}
			else
			{
			if(chD.dpcm_output_real > chD.dpcm_output_fake)
			{
			chD.dpcm_output_fake += 8;
			}
			else
			{
			chD.dpcm_output_fake -= 8;
			}
			chD.output = chD.dpcm_output_fake << 8;
			}
			*/
			return this.chD.output;
		}
		/**
		 * 更新DPCM(虚拟).
		 */
		public virtualUpdateDPCM(cycles: number): void
		{
			this.frameCycles += cycles;
			if (this.frameCycles >= 7458)
			{
				this.frameCycles -= 7458;
				this.bus.cpu.w(0x4018, 0); // 写入4018
			}
			// 更新DPCM(虚拟)
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
						//if(--chD.sync_dmalength < 2)
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
									///nes->cpu->SetIRQ( IRQ_DPCM );
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
		public noiseShiftreg(xor_tap: number): number
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
	 * 样本.
	 */
	class SAMPLE
	{
		public time: number;
		public addr: number;
		public data: number;
	}

	/**
	 * 方形波.
	 */
	class RECTANGLE
	{
		public reg: Float64Array = new Float64Array(4);

		public enable: number;
		public holdnote: number;
		public volume: number;
		public complement: number;

		public phaseacc: number;
		public freq: number;
		public freqlimit: number;
		public adder: number;
		public duty: number;
		public len_count: number;

		public nowvolume: number;

		public env_fixed: number;
		public env_decay: number;
		public env_count: number;
		public dummy0: number;
		public env_vol: number;

		public swp_on: number;
		public swp_inc: number;
		public swp_shift: number;
		public swp_decay: number;
		public swp_count: number;
		public dummy1: Float64Array = new Float64Array(3);

		public sync_reg: Float64Array = new Float64Array(4);
		public sync_output_enable: number;
		public sync_enable: number;
		public sync_holdnote: number;
		public dummy2: number;
		public sync_len_count: number;
	}

	/**
	 * 三角波.
	 */
	class TRIANGLE
	{
		public reg: Float64Array = new Float64Array(4);

		public enable: number;
		public holdnote: number;
		public counter_start: number;
		public dummy0: number;

		public phaseacc: number;
		public freq: number;
		public len_count: number;
		public lin_count: number;
		public adder: number;

		public nowvolume: number;

		public sync_reg: Float64Array = new Float64Array(4);
		public sync_enable: number;
		public sync_holdnote: number;
		public sync_counter_start: number;

		public sync_len_count: number;
		public sync_lin_count: number;
	}

	/**
	 * 噪声波.
	 */
	class NOISE
	{
		public reg: Float64Array = new Float64Array(4);

		public enable: number;
		public holdnote: number;
		public volume: number;
		public xor_tap: number;
		public shift_reg: number;

		public phaseacc: number;
		public freq: number;
		public len_count: number;

		public nowvolume: number;
		public output: number;

		public env_fixed: number;
		public env_decay: number;
		public env_count: number;
		public dummy0: number;
		public env_vol: number;

		public sync_reg: Float64Array = new Float64Array(4);
		public sync_output_enable: number;
		public sync_enable: number;
		public sync_holdnote: number;
		public dummy1: number;
		public sync_len_count: number;
	}

	/**
	 * 差分脉冲编码调制.
	 */
	class DPCM
	{
		public reg: Float64Array = new Float64Array(4);
		public enable: number;
		public looping: number;
		public cur_byte: number;
		public dpcm_value: number;

		public freq: number;
		public phaseacc: number;
		public output: number;

		public address: number;
		public cache_addr: number;
		public dmalength: number
		public cache_dmalength: number;
		public dpcm_output_real: number;
		public dpcm_output_fake: number;
		public dpcm_output_old: number;
		public dpcm_output_offset: number;

		public sync_reg: Float64Array = new Float64Array(4);
		public sync_enable: number;
		public sync_looping: number;
		public sync_irq_gen: number;
		public sync_irq_enable: number;
		public sync_cycles: number;
		public sync_cache_cycles: number;
		public sync_dmalength: number;
		public sync_cache_dmalength: number;
	}

}
