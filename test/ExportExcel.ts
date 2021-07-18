import { Config } from "@/config";
import * as _ from "lodash";
import * as fs from "fs";
import { promisify } from "util";
import { StockItem } from "./StockStruct";
import * as Excel from "exceljs";

/**
 * 기업 정보를 엑셀로 내보내기
 */
class CompanyInfoCrawler {
  async crawler() {
    const stockList = await this.loadStockCompanyList();
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("종목");

    worksheet.columns = [
      { header: "이름", key: "name" },
      { header: "종목코드", key: "code" },
      { header: "상장위치.", key: "market" },
      { header: "시총", key: "capitalization" },
      { header: "현재가", key: "currentPrice" },
      { header: "일반주식", key: "normalStock" },
      { header: "업종", key: "industry" },
      { header: "상장 주식수", key: "current_shareNumber" },
      { header: "현재-PER", key: "current_per" },
      { header: "현재-EPS", key: "current_eps" },
      { header: "현재-PBR", key: "current_pbr" },
      { header: "현재-배당수익률", key: "current_dvr" },
    ];

    for (let year = 2020; year >= 2018; year--) {
      worksheet.columns = [
        ...worksheet.columns,
        { header: `${year}-매출`, key: `${year}_sales` },
        { header: `${year}-영업이익`, key: `${year}_op` },
        { header: `${year}-당기 순이익`, key: `${year}_np` },
        { header: `${year}-부채 비율`, key: `${year}_dr` },
        { header: `${year}-당좌 비율`, key: `${year}_cr` },
        { header: `${year}-EPS`, key: `${year}_eps` },
        { header: `${year}-PER`, key: `${year}_per` },
        { header: `${year}-PBR`, key: `${year}_pbr` },
        { header: `${year}-배당 수익률`, key: `${year}_dvr` },
      ];
    }

    stockList.forEach((s) => {
      const row = {
        name: s.name,
        code: s.code,
        market: s.market,
        capitalization: s.capitalization,
        currentPrice: s.currentPrice,
        normalStock: s.normalStock,
        industry: s.industry,
      };
      if (s.normalStock) {
        row["current_shareNumber"] = s.currentIndicator.shareNumber;
        row["current_per"] = s.currentIndicator.per;
        row["current_eps"] = s.currentIndicator.eps;
        row["current_pbr"] = s.currentIndicator.pbr;
        row["current_dvr"] = s.currentIndicator.dvr;

        for (let year = 2020; year >= 2018; year--) {
          row[`${year}_sales`] = s.historyData[year - 2018].sales;
          row[`${year}_op`] = s.historyData[year - 2018].op;
          row[`${year}_np`] = s.historyData[year - 2018].np;
          row[`${year}_dr`] = s.historyData[year - 2018].dr;
          row[`${year}_cr`] = s.historyData[year - 2018].cr;
          row[`${year}_eps`] = s.historyData[year - 2018].eps;
          row[`${year}_per`] = s.historyData[year - 2018].per;
          row[`${year}_pbr`] = s.historyData[year - 2018].pbr;
          row[`${year}_dvr`] = s.historyData[year - 2018].dvr;
        }
      }

      worksheet.addRow(row);
    });

    await workbook.xlsx.writeFile(Config.report.file.stockList);
  }

  async loadStockCompanyList(): Promise<StockItem[]> {
    const readFilePromise = promisify(fs.readFile);
    const data = await readFilePromise(Config.crawling.file.stockMergeList, "utf-8");
    const stockList: StockItem[] = JSON.parse(data);
    return stockList;
  }
}

const companyInfoCrawler = new CompanyInfoCrawler();
companyInfoCrawler.crawler();
