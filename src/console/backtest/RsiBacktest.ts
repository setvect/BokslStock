import StockUtil from "@/util/stock-util";

import * as moment from "moment";
import Config from "@/config/default";
import CommonUtil from "@/util/common-util";
import * as _ from "lodash";
import * as Excel from "exceljs";
import { StockItem, StockPrice, BaseCondition } from "./BacktestType";
import CrawlerHttp from "../crawler/CrawlerHttp";

/**
 * RSI 백테스트
 */
class RsiBacktest {
  async test(condition: RsiCondition) {
    // 1. 데이터 블러오기
    const text = await CommonUtil.readTextFile(this.getFilePath(condition.stock));
    const priceObject: Array<[string, number, number, number, number]> = JSON.parse(text);
    priceObject.splice(0, 1);

    // 2. 데이터 가공
    const initClosePrice = priceObject[0][4];
    const marketPriceList: StockPrice[] = priceObject.map(
      (p): StockPrice => {
        return { date: p[0], open: p[1], high: p[2], low: p[3], close: p[4], gain: CommonUtil.getYield(p[4], initClosePrice), ma: {}, trade: {} };
      },
    );
    const closePrice = marketPriceList.map((p) => p.close);

    const maList = [200];

    for (let i = 0; i < marketPriceList.length; i++) {
      const price = marketPriceList[i];

      for (const maSize of maList) {
        if (i >= maSize - 1) {
          const priceHistory = closePrice.slice(i - (maSize - 1), i + 1);
          price.ma[maSize + ""] = _.mean(priceHistory);
        }
      }
    }

    let historyValue = [];
    for (const marketPrice of marketPriceList) {
      historyValue.push(marketPrice.close);
      if (historyValue.length >= condition.period) {
        historyValue = historyValue.slice(-(condition.period + 1));
      }
      if (marketPrice.ma["200"] > marketPrice.close) {
        condition;
      }
      const rsi = StockUtil.getRsi(historyValue);
      console.log('marketPrice.ma["200"] :>> ', marketPrice.date, marketPrice.ma["200"], marketPrice.close, historyValue, rsi);
    }
  }

  private getFilePath(stock: { code: string; name: string }): string {
    return Config.crawling.dir.marketPrice + "/" + `${stock.code}_${stock.name}.json`;
  }

  async crawler(stock: StockItem) {
    const START = "20010101";
    const END = moment().format("YYYYMMDD");

    const priceArray = await CrawlerHttp.getMakretPrice(stock.code, START, END);
    await CommonUtil.saveObjectToJson(priceArray, Config.crawling.dir.marketPrice + "/" + `${stock.code}_${stock.name}.json`);
    const delayTime = 500 + Math.random() * 1000;
    console.log(`code: ${stock.code}, name: ${stock.name}, delayTime: ${delayTime}`);
  }
}

export type RsiCondition = {
  period: number;
  // 과열 구간
  upturn: number;
  // 침체 구간
  downturn: number;
  // 첫번째 매매 비율
  firstRatio: number;
} & BaseCondition;

const targetStock: StockItem[] = [
  {
    code: "069500",
    name: "KODEX 200",
  },
  {
    code: "122630",
    name: "KODEX 레버리지",
  },
];

const baseCondition: RsiCondition = {
  stock: targetStock[0],
  cash: 10_000_000,
  feeRate: 0.00015,
  investRatio: 0.99,
  start: new Date(2004, 0, 1),
  end: new Date(2021, 5, 30),
  period: 4,
  upturn: 0.55,
  downturn: 0.3,
  firstRatio: 0.5,
};

const backtest = new RsiBacktest();
backtest.test(baseCondition);

// backtest.crawler(targetStock[0]);
