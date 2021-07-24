import { Config } from "@/config";
import CommonUtil from "@/util/common-util";
import { StockItem, HistoryData } from "./StockStruct";
import { AxiosResponse } from "axios";
import * as iconv from "iconv-lite";
import cheerio from "cheerio";
import CrawlerUtil from "./CrawlerUtil";
import CrawlerHttp from "./CrawlerHttp";

/**
 * 기업 기본 정보 크롤링
 * 실시간 PER, 실시간 PBR, 실시간 EPS, 업종, 배당수익률, 상장주식수, 일반 주식/ETF,리츠 구분
 */
class CompanyInfoCrawler {
  async crawler() {
    const stockList = await CrawlerUtil.loadStockList();
    const newStockList = await this.crawlerDetail(stockList);
    CommonUtil.saveObjectToJson(newStockList, Config.crawling.file.stockCompanyList);
  }

  private async crawlerDetail(stockList: StockItem[]) {
    for (let i = 0; i < stockList.length; i++) {
      const stockItem = stockList[i];
      const htmlDoc: AxiosResponse = await CrawlerHttp.crawlerCompany(stockItem.code);
      const html = iconv.decode(htmlDoc.data, "euc-kr");
      const $ = cheerio.load(html);
      const infoBox = $("#tab_con1");

      // per 항목이 있으면 일반주식
      if (infoBox.find("#_eps").length) {
        stockItem.normalStock = true;
        const shareText = infoBox.find("#tab_con1 > .first tbody tr:eq(2) td:eq(0)").text();
        stockItem.currentIndicator = {
          shareNumber: parseInt(CommonUtil.replaceAll(shareText, ",", "")),
          per: CommonUtil.getElementFloat(infoBox.find("#_per")),
          eps: CommonUtil.getElementFloat(infoBox.find("#_eps")),
          pbr: CommonUtil.getElementFloat(infoBox.find("#_pbr")),
          dvr: CommonUtil.getElementFloat(infoBox.find("#_dvr")),
        };
        stockItem.industry = $(".sub_tit7 em a").text();

        const newstPerformance = $(".tb_type1_ifrs");
        const historyData: HistoryData[] = [];
        for (let colIdx = 0; colIdx < 10; colIdx++) {
          historyData.push({
            date: CommonUtil.getElementText($(newstPerformance.find("tr:eq(1)").find("th")[colIdx])),
            sales: CommonUtil.getElementInt(newstPerformance.find("tbody tr:eq(0)").find(`td:eq(${colIdx})`)),
            op: CommonUtil.getElementInt(newstPerformance.find("tbody tr:eq(1)").find(`td:eq(${colIdx})`)),
            np: CommonUtil.getElementInt(newstPerformance.find("tbody tr:eq(2)").find(`td:eq(${colIdx})`)),
            dr: CommonUtil.getElementFloat(newstPerformance.find("tbody tr:eq(6)").find(`td:eq(${colIdx})`)),
            cr: CommonUtil.getElementFloat(newstPerformance.find("tbody tr:eq(7)").find(`td:eq(${colIdx})`)),
            eps: CommonUtil.getElementFloat(newstPerformance.find("tbody tr:eq(9)").find(`td:eq(${colIdx})`)),
            per: CommonUtil.getElementFloat(newstPerformance.find("tbody tr:eq(10)").find(`td:eq(${colIdx})`)),
            pbr: CommonUtil.getElementFloat(newstPerformance.find("tbody tr:eq(12)").find(`td:eq(${colIdx})`)),
            dvr: CommonUtil.getElementFloat(newstPerformance.find("tbody tr:eq(14)").find(`td:eq(${colIdx})`)),
          });
        }
        stockItem.historyData = historyData;
      } else {
        stockItem.normalStock = false;
      }
      // 중간중간 파일 저장
      if (i % 50 === 0) {
        CommonUtil.saveObjectToJson(stockList, Config.crawling.file.stockCompanyList);
        console.log("save", Config.crawling.file.stockCompanyList);
      }

      const delayTime = 800 + Math.random() * 1500;
      console.log("currentIdx, delayTime :>> ", i, delayTime);
      await CommonUtil.delay(delayTime);
    }
    return stockList;
  }
}

const companyInfoCrawler = new CompanyInfoCrawler();
companyInfoCrawler.crawler();
