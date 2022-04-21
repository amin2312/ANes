/**
 * 1. Copyright (c) 2022 amin2312
 * 2. Version 1.0.0
 * 3. MIT License
 *
 * ANes is nes emulator base on javascript. It is port version of AminNes(©2009).
 */
class ANesEmu
{
	/**
	 * Stats.
	 */
	private _stats: Stats = null;
	/**
	 * ROM.
	 */
	private _rom: ArrayBuffer;
	/**
	 * Virtual Machine
	 */
	public vm: anes.VM = null;
	/**
	 * TV.
	 */
	private _tv: HTMLCanvasElement = null;
	/**
	 * TV Image Context.
	 */
	private _txImage: CanvasRenderingContext2D;
	/**
	 * TV Image Frame Data.
	 */
	private _tvImageFrameData: ImageData = null;
	/**
	 * TV Audio Context.
	 */
	private _tvAudio: AudioContext;
	/**
	 * TV Audio Context Processor.
	 */
	private _tvAudioProcessor: ScriptProcessorNode;
	/**
	 * Virtual Joypad Ids.
	 */
	private _vjIds = ['VJ_U', 'VJ_D', 'VJ_L', 'VJ_R', 'VJ_SL', 'VJ_ST', 'VJ_B', 'VJ_A'];
	private _vjKeys = [87, 83, 65, 68, 70, 71, 86, 66];
	/**
	 * Constructor.
	 */
	constructor()
	{
		document.addEventListener('keydown', this.onKeyDown.bind(this));
		document.addEventListener('keyup', this.onKeyUp.bind(this));
		window.requestAnimationFrame(this.onFrame.bind(this));
		//document.onpointerdown = function (this: ANesEmu): void{}.bind(this);
		window.onfocus = this.onActivate.bind(this);
		window.onblur = this.onDeactivate.bind(this);
		var fileInputer = document.getElementById('fileInputer') as HTMLInputElement;
		fileInputer.onchange = this.loadRomFromLocal;
		this.installVirtualJoypad();
		var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
		if (isTouchDevice)
		{
			document.getElementById('myIntro').style.display = 'none';
		}

		this.showPerformance();
		//this.loadRomFromUrl('index.rom', this.onLoadROM.bind(this));
	}
	/**
	 * Install virtual joypad
	 */
	public installVirtualJoypad(): void
	{
		for (var i = 0; i < this._vjIds.length; i++)
		{
			var id = this._vjIds[i];
			var bn = document.getElementById(id);
			bn.addEventListener('pointerdown', this.onDownVirtualJoypad.bind(this));
			bn.addEventListener('pointerup', this.onUpVirtualJoypad.bind(this));
		}
	}
	/**
	 * Load ROM from local.
	 */
	public loadRomFromLocal(this: GlobalEventHandlers, e1: Event): any
	{
		var reader = new FileReader();
		reader.onload = function (e2)
		{
			var content = e2.target.result as ArrayBuffer;
			myEmu.onLoadROM(content);
		};
		reader.onerror = function (err)
		{
			console.error("Failed to read file", err);
		}
		var inputer = e1.target as HTMLInputElement;
		reader.readAsArrayBuffer(inputer.files[0]);
	}
	/**
	 * Load ROM from url.
	 */
	public loadRomFromUrl(url: string, onload: (bytes: ArrayBuffer) => void)
	{
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.responseType = 'arraybuffer';
		xhr.onreadystatechange = function ()
		{
			if (xhr.readyState == 4)
			{
				if (xhr.status == 200)
				{
					onload(xhr.response);
				}
				else
				{
					console.log(xhr.responseText);
					alert('[LOAD ROM FAIL] ' + xhr.responseText);
				}
			}
		};
		xhr.send();
	};
	/**
	 * @private
	 */
	private onLoadROM(bytes: ArrayBuffer): void
	{
		console.log('onLoadRom success');
		this._rom = bytes;
		// init TV
		var canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
		this._tv = canvas;
		this._txImage = canvas.getContext('2d');
		this._tvImageFrameData = this._txImage.createImageData(canvas.width, canvas.height);
		if (this._tvAudio != null)
		{
			this._tvAudio.close();
			this._tvAudioProcessor.disconnect();
			this._tvAudioProcessor.onaudioprocess = null;
		}
		this._tvAudio = new window.AudioContext();
		this._tvAudioProcessor = this._tvAudio.createScriptProcessor(2048, 0, 2);
		this._tvAudioProcessor.onaudioprocess = this.onSample.bind(this);
		this._tvAudioProcessor.connect(this._tvAudio.destination);
		// replay game
		this.replay();
	}
	/**
	 * Replay.
	 */
	public replay(): void
	{
		if (this.vm)
		{
			this.vm.shut();
		}
		// 1.create VM
		this.vm = new anes.VM();
		// 2.connect TV
		this.vm.connect(this._tvImageFrameData);
		// 3.insert cartridge
		this.vm.insertCartridge(this._rom);
		// 4.insert joypay
		this.vm.insertJoypay();
	}
	/**
	 * @private
	 */
	private onFrame(): void
	{
		if (this._stats != null)
		{
			this._stats.begin();
		}
		if (this.vm != null && this.vm.stop == false)
		{
			this.vm.renderFrame();
			if (this._tv != null && this._tvImageFrameData != null)
			{
				this._txImage.putImageData(this._tvImageFrameData, 0, 0);
			}
		}
		if (this._stats != null)
		{
			this._stats.end();
		}
		window.requestAnimationFrame(this.onFrame.bind(this));
	}
	/**
	 * @private
	 */
	private onSample(e: AudioProcessingEvent): void
	{
		if (this.vm != null && this.vm.stop == false)
		{
			this.vm.renderSample(e.outputBuffer);
		}
	}
	/**
	 * @private
	 */
	private onDownVirtualJoypad(e: PointerEvent): void
	{
		var bn = e.target as HTMLElement;
		var index = this._vjIds.indexOf(bn.id);
		var key = this._vjKeys[index];
		if (this.vm != null && this.vm.stop == false)
		{
			this.vm.onKeyDown(key);
		}
	}
	/**
	 * @private
	 */
	private onUpVirtualJoypad(e: Event): void
	{
		var bn = e.target as HTMLElement;
		var index = this._vjIds.indexOf(bn.id);
		var key = this._vjKeys[index];
		if (this.vm != null && this.vm.stop == false)
		{
			this.vm.onKeyUp(key);
		}
	}
	/**
	 * @private
	 */
	private onKeyDown(e: KeyboardEvent): void
	{
		if (this.vm != null && this.vm.stop == false)
		{
			this.vm.onKeyDown(e.keyCode);
		}
	}
	/**
	 * @private
	 */
	private onKeyUp(e: KeyboardEvent): void
	{
		if (this.vm != null && this.vm.stop == false)
		{
			this.vm.onKeyUp(e.keyCode);
		}
	}
	/**
	 * @private
	 */
	private onActivate(e: Event): void
	{
		if (this.vm != null)
		{
			this.vm.stop = false;
			console.log('Pause VM');
		}
	}
	/**
	 * @private
	 */
	private onDeactivate(e: Event): void
	{
		if (this.vm != null)
		{
			this.vm.stop = true;
			console.log('Resume VM');
		}
	}
	/**
	 * Show performance.
	 */
	private showPerformance()
	{
		if (!(window as any).Stats) 
		{
			return;
		}
		this._stats = new Stats();
		this._stats.showPanel(0); /* 0: fps, 1: ms, 2: mb, 3+: custom */
		document.getElementById('myStats').appendChild(this._stats.dom);
	}
}
var myEmu = new ANesEmu();