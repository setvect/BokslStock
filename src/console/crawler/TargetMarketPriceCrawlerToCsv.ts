import { Config } from "@/config";
import CrawlerUtil from "./CrawlerUtil";
import CommonUtil from "@/util/common-util";
import * as moment from "moment";
import CrawlerHttp from "./CrawlerHttp";
import { StockItem } from "../backtest/BacktestType";
import * as csvWriter from "csv-writer";

const START = "20000101";
const END = moment().format("YYYYMMDD");

/**
 * 시세 데이터 크롤링
 */
class TargetMarketPriceCrawlerToCsv {
  async crawler(targetStock: StockItem[]) {
    for (let i = 0; i < targetStock.length; i++) {
      const stockItem = targetStock[i];
      let priceArray: [string, number, number, number, number][] = await CrawlerHttp.getMakretPrice(stockItem.code, START, END);
      priceArray = priceArray.splice(1);
      const delayTime = 500 + Math.random() * 1000;
      console.log(`idx:${i}, code: ${stockItem.code}, name: ${stockItem.name}, delayTime: ${delayTime}`);
      await CommonUtil.delay(delayTime);

      const a = csvWriter.createObjectCsvWriter({
        path: `${Config.crawling.dir.csvPrice}/${stockItem.code}_${stockItem.name}.csv`,
        header: [
          { id: "date", title: "date" },
          { id: "value", title: "value" },
        ],
      });

      const records = priceArray.map((p: [string, number, number, number, number]) => {
        return { date: `${p[0].substr(0, 4)}-${p[0].substr(4, 2)}-${p[0].substr(6, 2)}`, value: p[4] };
      });

      a.writeRecords(records) // returns a promise
        .then(() => {
          console.log("...Done");
        });
    }
  }
}

const targetStock: StockItem[] = [
  {
    code: "133690",
    name: "TIGER 미국나스닥100",
  },
  {
    code: "251350",
    name: "KODEX 선진국MSCI World",
  },
  {
    code: "192090",
    name: "TIGER 차이나CSI300",
  },
];

const targetMarketPriceCrawlerToCsv = new TargetMarketPriceCrawlerToCsv();
targetMarketPriceCrawlerToCsv.crawler(targetStock);
