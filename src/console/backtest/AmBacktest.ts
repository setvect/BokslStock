import * as moment from "moment";
import Config from "@/config/default";
import CommonUtil from "@/util/common-util";
import * as _ from "lodash";
import * as Excel from "exceljs";
import { AmCondition, Condition, Ohlc, StockItem, StockPrice } from "./BacktestType";

/**
 * 절대 모메텀 백테스트
 */
class AmBacktest {
  async test(condition: AmCondition) {
    // 1. 데이터 블러오기
    const text = await CommonUtil.readTextFile(this.getFilePath(condition.stock));
    const priceObject: Array<[string, number, number, number, number]> = JSON.parse(text);
    priceObject.splice(0, 1);

    // console.log("priceObject :>> ", priceObject);

    const monthPrice = _.chain(priceObject)
      .groupBy((p) => p[0].substr(0, 6))
      .map((value, date) => {
        const ohlc: Ohlc = {
          open: value[0][1],
          high: _.chain(value)
            .map((p) => p[2])
            .max()
            .value(),
          low: _.chain(value)
            .map((p) => p[3])
            .min()
            .value(),
          close: value[value.length - 1][4],
        };

        return { date, ohlc };
      })
      .value();
    console.log("monthPrice :>> ", monthPrice);

    // 2. 데이터 가공

    // 3. 분석

    // 4.결과 저장(excel)
    const workbook = new Excel.Workbook();
  }

  private getFilePath(stock: { code: string; name: string }): string {
    return Config.crawling.dir.mabsMarketPrice + "/" + `${stock.code}_${stock.name}.json`;
  }
}

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

const baseCondition: AmCondition = {
  stock: targetStock[0],
  cash: 10_000_000,
  feeRate: 0.00015,
  investRatio: 0.99,
  start: new Date(2003, 2, 1),
  end: new Date(2021, 5, 30),
  baseMonth: 3,
};

const backtest = new AmBacktest();
backtest.test(baseCondition);
