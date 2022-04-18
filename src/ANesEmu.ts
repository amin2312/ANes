/**
 * NES模拟器.
 */
class ANesEmu
{
	/**
	 * 显示器.
	 */
	//public TV: Sprite = new Sprite;
	/**
	 * 游戏机.
	 */
	public vm: anes.VM;
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
	public static GAP: number = 12;
	public static EDGE: number = 24;
	public static output: TextField = new TextField;
	private binLoader: URLLoader;
	private tracker: Loader;
	private romUrl: String;
	 */
	/**
	 * 构造函数.
	 */
	public ANesEmulator()
	{
		// 1.填充背景
		/*this.graphics.beginFill(0);
		this.graphics.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
		// 2.创建标签
		output.defaultTextFormat = new TextFormat('Consolas', 12, 0xFFFFFF);
		output.autoSize = TextFieldAutoSize.CENTER;
		output.x = number(stage.stageWidth / 2);
		output.y = number((stage.stageHeight - 26) / 2);
		addChild(output);
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
		addChild(uiLoader);*/
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
	private function onCompleteBin(e: Event): void
	{
		output.visible = false;
		// 添加显示器
		TV.scaleX = 2;
		TV.scaleY = 2;
		TV.x = EDGE;
		TV.y = EDGE + GAP;
		TV.addChild(new Bitmap(new BitmapData(256, 240, false, 0)));
		shape: Shape = new Shape;
		shape.graphics.beginFill(0);
		shape.graphics.drawRect(0, 0, 256, 8);
		shape.graphics.drawRect(0, 232, 256, 8);
		TV.addChild(shape);
		addChildAt(TV, 0);
		replay();
	}
	 */
	/**
	 * 重玩.
	 */
	public replay(): void
	{
		if (this.vm)
		{
			this.vm.shut();
		}
		// 创建虚拟机
		this.vm = new anes.VM();
		// 连接显示器
		//this.vm.connect(TV.getChildAt(0) as Bitmap);
		// 插卡
		//this.vm.insertCartridge(binLoader.data);
		// 连接手柄
		//this.vm.insertJoypay(stage);
	}
	/**
	 * @private
	private function onCompleteUI(e: Event): void
	{
		ui = new UI;
		addChild(ui);
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

