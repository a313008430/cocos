import ListView from "./listView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {
  @property(ListView)
  private list: ListView = null;

  data: any[] = new Array(600);

  start() {
    this.list.items = this.data.length;
    console.log(this.list.items);
  }

  render(item: cc.Node, idx) {
    // console.log(idx);

    switch (idx % 3) {
      case 1:
        item.height = 140;
        break;
      case 2:
        item.height = 20;
        break;
      default:
        item.height = 100;
        break;
    }

    // item.height = 20;

    item.getChildByName("lb").getComponent(cc.Label).string = idx;
  }
}
