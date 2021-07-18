import { Config } from "@/config";
import * as _ from "lodash";
import fs = require("fs");
import { promisify } from "util";
import { StockItem } from "./StockStruct";
import CommonUtil from "@/util/common-util";

/**
 * 기업 기본 정보 크롤링
 * 실시간 PER, 실시간 PBR, 실시간 EPS, 업종, 배당수익률, 상장주식수, 일반 주식/ETF,리츠 구분
 */
class CompanyInfoCrawler {
  async crawler() {
    const stockList = await this.loadStockList();
    const stockMap = await this.loadStockCompanyMap();
    stockList.forEach((s) => {
      const company = stockMap[s.code];
      if (!company) {
        return;
      }

      s.normalStock = company.normalStock;
      s.currentIndicator = company.currentIndicator;
      s.historyData = company.historyData;
      s.industry = company.industry;
    });

    CommonUtil.saveObjectToJson(stockList, Config.crawling.file.stockMergeList);
  }

  async loadStockList() {
    const readFilePromise = promisify(fs.readFile);
    const data = await readFilePromise(Config.crawling.file.stockList, "utf-8");
    const stockList: StockItem[] = JSON.parse(data);
    return stockList;
  }
  async loadStockCompanyMap(): Promise<_.Dictionary<StockItem>> {
    const readFilePromise = promisify(fs.readFile);
    const data = await readFilePromise(Config.crawling.file.stockCompanyList, "utf-8");
    const stockList: StockItem[] = JSON.parse(data);

    return _.keyBy(stockList, "code");
  }
}

const companyInfoCrawler = new CompanyInfoCrawler();
companyInfoCrawler.crawler();
