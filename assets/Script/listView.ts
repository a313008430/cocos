const { ccclass, property, menu, disallowMultiple, requireComponent } = cc._decorator;

/**
 * list view 组件
 */
@ccclass
@menu("游戏组件/ListView")
@requireComponent(cc.ScrollView)
@disallowMultiple
export default class ListView extends cc.Component {
  /** item */
  @property({
    type: cc.Prefab,
    tooltip: "item组件",
  })
  private itemNode: cc.Node = null;

  /** 刷新频率 */
  private _updateRate: number = 3;
  @property({
    type: cc.Integer,
    range: [1, 10, 1],
    tooltip: "刷新频率（值越小刷新频率越低、性能越高）",
    slide: true,
  })
  private set updateRate(val: number) {
    this._updateRate = val;
  }
  private get updateRate() {
    return this._updateRate;
  }

  /** 渲染事件（渲染器） */
  @property({
    type: cc.Component.EventHandler,
    tooltip: "渲染事件（渲染器）",
  })
  private renderEvent: cc.Component.EventHandler = new cc.Component.EventHandler();
  /** item总数量 */
  private _items: number = 0;
  /** item总数量 */
  get items() {
    return this._items;
  }
  set items(length: number) {
    this._items = length;
  }
  /** item列表 */
  private itemNodeList: cc.Node[] = [];
  /** scroll content */
  private scrollContent: cc.Node;
  /** scroll view */
  private scrollView: cc.ScrollView;
  /** 已经添加过的数量总数 */
  private addSum: number = 0;

  /** 渲染列表的方向 => 竖 从上到下，从下到上 */

  /** item 对象池 */
  private itemPool: cc.NodePool = null;

  onLoad() {
    this.scrollView = this.node.getComponent(cc.ScrollView);
    this.scrollContent = this.scrollView.content;
    if (!this.scrollContent) {
      console.error("miss scroll content");
      return;
    }

    this.itemPool = new cc.NodePool();

    this.scrollView.node.on("scrolling", this.onScrollEvent, this);
  }

  start() {
    this.initItem();
  }

  /**
   * 初始化item
   */
  private initItem() {
    let itemHeightSum: number = 0;
    for (let x = 0; x < this.items; x++) {
      let node = this.getItem();
      this.sendRenderEvent(node, x);
      node.y = -itemHeightSum;
      itemHeightSum += node.height;
      node["idx"] = x;
      this.addSum++;
      this.itemNodeList.push(node);
      this.scrollContent.addChild(node);
      if (itemHeightSum > this.scrollView.node.height) {
        break;
      }
    }

    this.scrollContent.height = itemHeightSum;
  }

  private oldY = 0;

  private onScrollEvent(e: cc.ScrollView) {
    let idx;
    let itemPos;
    let preNode;
    for (let x = this.updateRate; x > -1; x--) {
      if (this.oldY < e.getScrollOffset().y) {
        // console.log("u");
        itemPos = this.itemNodeList[0].convertToWorldSpaceAR(cc.v2());
        //remove top to pool
        if (e.node.convertToNodeSpaceAR(itemPos).y > this.itemNodeList[0].height) {
          this.itemPool.put(this.itemNodeList[0]);
          this.itemNodeList.splice(0, 1);
        }

        preNode = this.itemNodeList[this.itemNodeList.length - 1];
        idx = preNode["idx"];
        itemPos = preNode.convertToWorldSpaceAR(cc.v2());
        //add to bottom
        if (
          idx < this.items - 1 &&
          e.node.convertToNodeSpaceAR(itemPos).y + this.getScrollViewHeight() - preNode.height >=
            -20
        ) {
          // console.log("add bottom");
          let node = this.getItem();
          idx++;
          this.sendRenderEvent(node, idx);
          node["idx"] = idx;
          node.y = preNode.y - preNode.height;
          this.scrollContent.addChild(node);
          if (this.addSum <= idx) {
            this.addSum++;
            this.scrollContent.height += node.height;
          }
          this.itemNodeList.push(node);
        }
      } else {
        // console.log("d");
        preNode = this.itemNodeList[this.itemNodeList.length - 1];
        itemPos = preNode.convertToWorldSpaceAR(cc.v2());
        //bottom remove to pool
        if (e.node.convertToNodeSpaceAR(itemPos).y + this.getScrollViewHeight() <= 0) {
          this.itemPool.put(preNode);
          this.itemNodeList.pop();
          // console.warn("del bottom");
        }

        //add to top
        idx = this.itemNodeList[0]["idx"];
        itemPos = this.itemNodeList[0].convertToWorldSpaceAR(cc.v2());
        if (idx > 0 && e.node.convertToNodeSpaceAR(itemPos).y <= 0) {
          let node = this.getItem();
          idx--;
          this.sendRenderEvent(node, idx);
          node["idx"] = idx;
          node.y = this.itemNodeList[0].y + node.height;
          this.itemNodeList.unshift(node);
          this.scrollContent.addChild(node);
        }
      }
    }
    this.oldY = e.getScrollOffset().y;
  }

  /**
   * 创建一个item
   */
  private getItem(): cc.Node {
    let node: cc.Node;
    if (this.itemPool.size()) {
      node = this.itemPool.get();
    } else {
      node = cc.instantiate(this.itemNode);
    }
    return node;
  }

  /**
   * 发送渲染事件
   * @param item 渲染的item
   * @param idx 下标
   */
  private sendRenderEvent(item: cc.Node, idx: number) {
    if (this.renderEvent) {
      cc.Component.EventHandler.emitEvents([this.renderEvent], item, idx);
    }
  }

  /**
   * 监听或是获取滚动容器高度
   */
  private getScrollViewHeight(): number {
    return this.scrollView.node.height;
  }
}
