import { Config } from "@/config";
import axios, { AxiosResponse } from "axios";
import CrawlerUtil from "./CrawlerUtil";
import CommonUtil from "@/util/common-util";
import * as moment from "moment";

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
      const response: AxiosResponse = await this.crawlerMarketPrice(stockItem.code);
      const json = CommonUtil.replaceAll(response.data, "'", '"');
      const josnObject = JSON.parse(json);
      await CommonUtil.saveObjectToJson(josnObject, Config.crawling.dir.marketPrice + "/" + `${stockItem.code}_${stockItem.name}.json`);
      const delayTime = 500 + Math.random() * 1000;
      console.log(`idx:${i}, code: ${stockItem.code}, name: ${stockItem.name}, delayTime: ${delayTime}`);
      await CommonUtil.delay(delayTime);
    }
  }

  async crawlerMarketPrice(code: string) {
    const url = Config.crawling.url.marketPrice.replace("{code}", code).replace("{start}", START).replace("{end}", END);
    console.log("url :>> ", url);
    return await axios({
      method: "get",
      url: url,
      headers: {
        "User-Agent": Config.crawling.userAgent,
      },
    });
  }
}

const marketPriceCrawler = new MarketPriceCrawler();
marketPriceCrawler.crawler();
