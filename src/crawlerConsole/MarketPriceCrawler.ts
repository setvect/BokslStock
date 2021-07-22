import { Config } from "@/config";
import { AxiosResponse } from "axios";
import CrawlerUtil from "./CrawlerUtil";
import CommonUtil from "@/util/common-util";
import * as moment from "moment";
import CrawlerHttp from "./CrawlerHttp";

const START = "20190101";
const END = moment().format("YYYYMMDD");

/**
 * 시세 데이터 크롤링
 */
class MarketPriceCrawler {
  async crawler() {
    const stockList = await CrawlerUtil.loadStockList();
    for (let i = 0; i < stockList.length; i++) {
      const stockItem = stockList[i];
      const response: AxiosResponse = await CrawlerHttp.crawlerMarketPrice(stockItem.code, START, END);
      const json = CommonUtil.replaceAll(response.data, "'", '"');
      const josnObject = JSON.parse(json);
      await CommonUtil.saveObjectToJson(josnObject, Config.crawling.dir.marketPrice + "/" + `${stockItem.code}_${stockItem.name}.json`);
      const delayTime = 500 + Math.random() * 1000;
      console.log(`idx:${i}, code: ${stockItem.code}, name: ${stockItem.name}, delayTime: ${delayTime}`);
      await CommonUtil.delay(delayTime);
    }
  }
}

const marketPriceCrawler = new MarketPriceCrawler();
marketPriceCrawler.crawler();
