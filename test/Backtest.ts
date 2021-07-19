import { Config } from "@/config";
import { ExportExcel } from "./ExportExcel";
import CommonUtil from "@/util/common-util";
import * as moment from "moment";
import * as _ from "lodash";

const from = new Date(2021, 3, 1);
const to = new Date(2021, 6, 16);
const baseObject = "historyData[2]";
const compareStock = {
  code: "069500",
  name: "KODEX 200",
};

/**
 * 백테스트
 */
class Backtest {
  async test() {
    const exportExcel = new ExportExcel();
    const stockList = await exportExcel.loadStockCompanyList();
    // 2021. 3월에 발표
    const filterdStockList = exportExcel.filterStock(stockList, baseObject);

    const targetList = filterdStockList.slice(0, 30);

    const sumStock: StockItemBacktestResult[] = [];

    const promises = targetList.map(async (s) => {
      const marketPriceFile = `${Config.crawling.dir.marketPrice}/${s.code}_${s.name}.json`;
      sumStock.push({
        code: s.code,
        name: s.name,
        priceHistory: await this.getPriceList(marketPriceFile, from, to),
      });
    });
    await Promise.all(promises);

    const marketPriceFile = `${Config.crawling.dir.marketPrice}/${compareStock.code}_${compareStock.name}.json`;
    const compareStockResult: StockItemBacktestResult = {
      code: compareStock.code,
      name: compareStock.name,
      priceHistory: await this.getPriceList(marketPriceFile, from, to),
    };

    for (const p of sumStock) {
      p.gain = CommonUtil.getYield(p.priceHistory[p.priceHistory.length - 1], p.priceHistory[0]);
    }

    const avgGain = _.meanBy(sumStock, (p) => p.gain);
    console.log("평균수익률 :>> ", CommonUtil.getPercentage(avgGain, 2) + "%");

    compareStockResult.gain = CommonUtil.getYield(compareStockResult.priceHistory[compareStockResult.priceHistory.length - 1], compareStockResult.priceHistory[0]);
    console.log(`비교 지수 ${compareStockResult.name}(${compareStockResult.code}): ${CommonUtil.getPercentage(compareStockResult.gain, 2)}%`);
  }
  async getPriceList(file: string, from: Date, to: Date): Promise<number[]> {
    const formStr = moment(from).format("YYYYMMDD");
    const toStr = moment(to).format("YYYYMMDD");

    const text = await CommonUtil.readTextFile(file);
    const priceObject: [] = JSON.parse(text);

    // priceObject.filter((p) => formStr <= p[0] && p[0] <= toStr).forEach((p) => console.log(p));
    const endPrice: number[] = priceObject.filter((p) => formStr <= p[0] && p[0] <= toStr).map((p) => p[4]);
    return endPrice;
  }
}

type StockItemBacktestResult = {
  code: string;
  name: string;
  gain?: number;
  priceHistory: number[];
};

const backtest = new Backtest();

backtest.test();
