import { Config } from "@/config";
import * as fs from "fs";
import { promisify } from "util";
import { StockItem } from "./StockStruct";
import * as Excel from "exceljs";

/**
 * 종목 정보를 엑셀로 내보내기
 */
export class ExportExcel {
  async crawler() {
    const stockList = await this.loadStockCompanyList();
    const filterdStockList = this.filterStock(stockList, "historyData[2]");
    // const filterdStockList = this.filterStock(stockList, "currentIndicator");

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("종목");

    worksheet.columns = [
      { header: "이름", key: "name" },
      { header: "종목코드", key: "code" },
      { header: "링크", key: "link" },
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
      { header: "PER-순위", key: "per_rank" },
      { header: "PBR-순위", key: "pbr_rank" },
      { header: "배당수익률-순위", key: "dvr_rank" },
      { header: "순위 합계", key: "rank_sum" },
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

    filterdStockList.forEach((s) => {
      const row = {
        name: s.name,
        code: s.code,
        link: { text: `https://finance.naver.com/item/main.nhn?code=${s.code}`, hyperlink: `https://finance.naver.com/item/main.nhn?code=${s.code}` },
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
        row["per_rank"] = s.rank.per;
        row["pbr_rank"] = s.rank.pbr;
        row["dvr_rank"] = s.rank.dvr;
        // row["rank_sum"] = s.rank.per + s.rank.pbr + s.rank.dvr;
        row["rank_sum"] = s.rank.per + s.rank.pbr;

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

    this.applyStyle(worksheet);

    await workbook.xlsx.writeFile(Config.report.file.stockList);
  }

  /**
   * @param stockList 주식 목록
   */
  filterStock(stockList: StockItem[], baseObject): StockItem[] {
    const excludeIndustry = ["기타금융", "생명보험", "손해보험", "은행", "증권", "창업투자"];
    const filterdStockList = stockList
      .filter((s) => s.normalStock)
      .filter((s) => !excludeIndustry.includes(s.industry))
      .filter((s) => eval("s." + baseObject).per != null && eval("s." + baseObject).per > 0)
      .filter((s) => eval("s." + baseObject).pbr > 0.2)
      .filter((s) => s.capitalization > 700)
      // 우선주 제외
      // .filter((s) => s.code.endsWith("0"))
      .filter((s) => !s.name.endsWith("홀딩스"))
      .filter((s) => !s.name.endsWith("지주"))
      .filter((s) => s.historyData[2].op > 0)
      .filter((s) => s.historyData[2].np > 0);

    // 시총 순으로 낮은 20% 기업
    // filterdStockList.sort((a, b) => a.capitalization - b.capitalization);
    // filterdStockList = filterdStockList.slice(0, filterdStockList.length * 0.2);
    this.ranking(filterdStockList, baseObject, "per", true);
    this.ranking(filterdStockList, baseObject, "pbr", true);
    this.ranking(filterdStockList, baseObject, "dvr", false);

    // filterdStockList.sort((a, b) => a.rank.per + a.rank.pbr + a.rank.dvr - (b.rank.per + b.rank.pbr + b.rank.dvr));
    filterdStockList.sort((a, b) => a.rank.per + a.rank.pbr - (b.rank.per + b.rank.pbr));
    return filterdStockList;
  }

  private ranking(filterdStockList: StockItem[], baseObject: string, sortField: string, asc: boolean) {
    filterdStockList.sort((a, b) => {
      if (asc) {
        return eval("a." + baseObject)[sortField] - eval("b." + baseObject)[sortField];
      } else {
        return eval("b." + baseObject)[sortField] - eval("a." + baseObject)[sortField];
      }
    });
    let preValue = -1;
    let currntRank = 1;

    filterdStockList.forEach((s, idx) => {
      s.rank = s.rank || {};
      if (eval("s." + baseObject)[sortField] === preValue) {
        s.rank[sortField] = currntRank;
        preValue = eval("s." + baseObject)[sortField];
        return;
      }

      s.rank[sortField] = idx + 1;
      currntRank = s.rank[sortField];
      preValue = eval("s." + baseObject)[sortField];
    });
  }

  /**
   * 엑셀 스타일 적용
   */
  private applyStyle(worksheet: Excel.Worksheet) {
    worksheet.eachRow((row, rIdx) => {
      row.eachCell((cell, cIdx) => {
        let color = "cccccc";
        if (14 <= cIdx && cIdx <= 17) {
          color = "eeee00";
        }

        if (rIdx === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: color },
          };
          cell.font = {
            bold: true,
          };
        } else if (cIdx === 3) {
          cell.font = {
            color: { argb: "004e47cc" },
            underline: true,
          };
        }
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // 필터
    worksheet.autoFilter = "A1:AQ1";

    // 틀고정
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // 컬럼 넓이
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column["eachCell"]({ includeEmpty: true }, function (cell) {
        const columnLength = cell.value ? cell.value.toString().length + 5 : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength;
    });
  }

  async loadStockCompanyList(): Promise<StockItem[]> {
    const readFilePromise = promisify(fs.readFile);
    const data = await readFilePromise(Config.crawling.file.stockMergeList, "utf-8");
    const stockList: StockItem[] = JSON.parse(data);
    return stockList;
  }
}

const exportExcel = new ExportExcel();
exportExcel.crawler();
