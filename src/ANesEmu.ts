/**
 * NES模拟器.
 */
class ANesEmu
{
	/**
	 * ROM.
	 */
	private _rom: ArrayBuffer;
	/**
	 * Graph Context.
	 */
	private _ctxGraph: CanvasRenderingContext2D;
	/**
	 * Audio Context.
	 */
	private _ctxAudio: AudioContext;
	/**
	 * Stats.
	 */
	private _stats: Stats = null;
	/**
	 * TV.
	 */
	public TV: HTMLCanvasElement = null;
	/**
	 * the image data bind of TV
	 */
	public TVD: ImageData = null;
	/**
	 * Virtual Machine
	 */
	public vm: anes.VM = null;

	/**
	 * [二进制文件] 图像.
	 */
	//[Embed(source = "../ui.swf", mimeType = "application/octet-stream")]
	//public static UiBin: Class;
	/**
	 * 外观.
	 */
	//public static ui: UI;
	/**
	 * 属性.
	public static output: TextField = new TextField;
	private binLoader: URLLoader;
	private tracker: Loader;
	private romUrl: String;
	 */
	/**
	 * Constructor.
	 */
	constructor()
	{
		this.showPerformance();
		this.loadRomFromUrl('index.rom', this.onLoadROM.bind(this));
		document.addEventListener('keydown', this.onKeyDown.bind(this));
		document.addEventListener('keyup', this.onKeyUp.bind(this));
		window.requestAnimationFrame(this.onFrame.bind(this));
		document.onpointerdown = function (this: ANesEmu): void
		{
			if (this._ctxAudio == null)
			{
				this._ctxAudio = new window.AudioContext();
				var asp = this._ctxAudio.createScriptProcessor(2048, 0, 2);
				asp.onaudioprocess = this.onSample.bind(this);
				asp.connect(this._ctxAudio.destination);
			}
		}.bind(this);
		/*
		// 3.加载ROM
		romUrl = this.loaderInfo.parameters.romUrl || 'default.txt';
		binLoader = new URLLoader;
		binLoader.dataFormat = URLLoaderDataFormat.BINARY;
		binLoader.addEventListener(Event.COMPLETE, onCompleteBin);
		binLoader.addEventListener(ProgressEvent.PROGRESS, onLoadingBin);
		binLoader.addEventListener(IOErrorEvent.IO_ERROR, onErrorBin);
		binLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onErrorBin);
		binLoader.load(new URLRequest(romUrl));
		// 4.加载UI
		uiLoader: Loader = new Loader;
		uiLoader.loadBytes(new UiBin);
		uiLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, onCompleteUI);
		addChild(uiLoader);
		*/
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
		this._rom = bytes;
		// init TV
		var canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
		this._ctxGraph = canvas.getContext('2d');
		this.TV = canvas;
		this.TVD = this._ctxGraph.createImageData(canvas.width, canvas.height);
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
		this.vm.connect(this.TVD);
		// 3.insert cartridge
		this.vm.insertCartridge(this._rom);
		// 连接手柄
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
		if (this.TV != null && this.TVD != null)
		{
			this._ctxGraph.putImageData(this.TVD, 0, 0);
		}
		if (this.vm != null)
		{
			this.vm.renderFrame();
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
		if (this.vm != null)
		{
			this.vm.renderSample(e.outputBuffer);
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
		document.body.appendChild(this._stats.dom);
	}
	/**
	 * @private
	 */
	private onKeyDown(e: KeyboardEvent): void
	{
		if (this.vm != null)
		{
			this.vm.onKeyDown(e.keyCode);
		}
	}
	/**
	 * @private
	 */
	private onKeyUp(e: KeyboardEvent): void
	{
		if (this.vm != null)
		{
			this.vm.onKeyUp(e.keyCode);
		}
	}
	/**
	 * @private
	private _focus: Shape = new Shape;
	 */
	/**
	 * @private
	private function onActivate(e: Event): void
	{
		if (_focus.parent)
		{
			_focus.parent.removeChild(_focus);
		}
	}
	 */
	/**
	 * @private
	private function onDeactivate(e: Event): void
	{
		if (_focus.parent)
		{
			return;
		}
		_focus.graphics.beginFill(0xFF0000, 0.2);
		_focus.graphics.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
		stage.addChild(_focus);
	}
	 */
	/**
	 * @private
	private function onLoadingBin(e: ProgressEvent): void
	{
		if (e.bytesTotal == 0)
		{
			output.text = 'LOADING ROM...';
			return;
		}
		per: String = ((e.bytesLoaded / e.bytesTotal) * 100).toFixed(2);
		output.text = 'LOAD ROM:' + per + '%';
	}
	 */
	/**
	 * @private
	private function onErrorBin(e: Event): void
	{
		output.text = e.type + ':' + romUrl;
	}
	 */
}
//debugger;
var ANewEmu = new ANesEmu();