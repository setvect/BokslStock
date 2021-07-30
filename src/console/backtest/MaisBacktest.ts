import * as moment from "moment";
import Config from "@/config/default";
import CommonUtil from "@/util/common-util";
import * as _ from "lodash";
import * as Excel from "exceljs";
import { Condition, StockItem, StockPrice } from "./BacktestType";

/**
 * 이동평균선 반전 백테스트
 */
class MabsBacktest {
  async test(condition: Condition) {
    // 1. 데이터 블러오기
    const text = await CommonUtil.readTextFile(this.getFilePath(condition.stock));
    const priceObject: Array<[string, number, number, number]> = JSON.parse(text);
    priceObject.splice(0, 1);

    // 2. 데이터 가공
    const initClosePrice = priceObject[0][3];
    const marketPriceList: StockPrice[] = priceObject.map(
      (p): StockPrice => {
        return { date: p[0], open: p[1], high: p[1], low: p[2], close: p[3], gain: CommonUtil.getYield(p[3], initClosePrice), ma: {}, trade: {} };
      },
    );
    const closePrice = marketPriceList.map((p) => p.close);

    const maList = [5, 10, 20, 40, 60, 120];

    for (let i = 0; i < marketPriceList.length; i++) {
      const price = marketPriceList[i];

      for (const maSize of maList) {
        if (i >= maSize - 1) {
          const priceHistory = closePrice.slice(i - (maSize - 1), i + 1);
          price.ma[maSize + ""] = _.mean(priceHistory);
        }
      }
    }

    // 3. 분석
    const account = {
      cash: condition.cash,
      qty: 0,
      unitPrice: 0,
    };

    const formStr = moment(condition.start).format("YYYYMMDD");
    const endStr = moment(condition.end).format("YYYYMMDD");

    const resultAcc: StockPrice[] = [];

    for (let i = 0; i < marketPriceList.length; i++) {
      const marketPrice = marketPriceList[i];

      const stockPrice = Object.assign(marketPrice, {});

      if (marketPrice.date < formStr || marketPrice.date > endStr) {
        continue;
      }

      if (!marketPriceList[i - 1].ma[condition.ma]) {
        stockPrice.trade = {
          cash: account.cash,
          fee: 0,
          qty: 0,
          unitPrice: 0,
          gain: 0,
          total: account.cash + account.qty * account.unitPrice,
        };
        stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
        resultAcc.push(stockPrice);
        continue;
      }

      // 매수 체크
      if (account.qty == 0) {
        if (marketPriceList[i - 1].ma[condition.ma] < marketPrice.ma[condition.ma]) {
          account.unitPrice = marketPrice.open;
          account.qty = Math.floor((account.cash * condition.investRatio) / account.unitPrice);
          const fee = Math.floor(account.unitPrice * account.qty * condition.feeRate);
          account.cash = account.cash - account.unitPrice * account.qty - fee;
          stockPrice.trade = {
            cash: account.cash,
            fee,
            qty: account.qty,
            unitPrice: account.unitPrice,
            gain: 0,
            total: account.cash + account.qty * account.unitPrice,
          };
        } else {
          stockPrice.trade = {
            cash: account.cash,
            fee: 0,
            qty: account.qty,
            unitPrice: account.unitPrice,
            gain: 0,
            total: account.cash + account.qty * account.unitPrice,
          };
        }
      }
      // 매도 체크
      else if (marketPriceList[i - 1].ma[condition.ma] > marketPrice.ma[condition.ma]) {
        // 시초가 매매
        const fee = Math.floor(marketPrice.open * account.qty * condition.feeRate);
        const gain = CommonUtil.getYield(marketPrice.open, account.unitPrice);

        account.cash = account.cash + marketPrice.open * account.qty - fee;
        account.qty = 0;
        account.unitPrice = 0;

        stockPrice.trade = {
          cash: account.cash,
          fee,
          qty: account.qty,
          unitPrice: account.unitPrice,
          gain,
          total: account.cash + account.qty * account.unitPrice,
        };
      } else {
        stockPrice.trade = {
          cash: account.cash,
          fee: 0,
          qty: account.qty,
          unitPrice: account.unitPrice,
          gain: 0,
          total: account.cash + account.qty * marketPrice.close,
        };
      }
      stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
      resultAcc.push(stockPrice);
      resultAcc[resultAcc.length - 1].gain = CommonUtil.getYield(resultAcc[resultAcc.length - 1].close, resultAcc[0].close);
    }

    // 4.결과 저장(excel)
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("종목");
    worksheet.columns = [
      { header: "날짜", key: "date" },
      { header: "시가", key: "open", style: { numFmt: "###,###" } },
      { header: "고가", key: "high", style: { numFmt: "###,###" } },
      { header: "저가.", key: "low", style: { numFmt: "###,###" } },
      { header: "종가", key: "close", style: { numFmt: "###,###" } },
      { header: "수익률", key: "gain", style: { numFmt: ".00%" } },
      { header: "이동평균(5)", key: "ma_5", style: { numFmt: "###,###" } },
      { header: "이동평균(10)", key: "ma_10", style: { numFmt: "###,###" } },
      { header: "이동평균(20)", key: "ma_20", style: { numFmt: "###,###" } },
      { header: "이동평균(40)", key: "ma_40", style: { numFmt: "###,###" } },
      { header: "이동평균(60)", key: "ma_60", style: { numFmt: "###,###" } },
      { header: "이동평균(120)", key: "ma_120", style: { numFmt: "###,###" } },
      { header: "수량", key: "trade_qty", style: { numFmt: "###,###" } },
      { header: "단기", key: "trade_unitPrice", style: { numFmt: "###,###" } },
      { header: "실현수익", key: "trade_gain", style: { numFmt: ".00%" } },
      { header: "현금", key: "trade_cash", style: { numFmt: "###,###" } },
      { header: "통합 금액", key: "trade_total", style: { numFmt: "###,###" } },
      { header: "통합수익률", key: "total_gain", style: { numFmt: ".00%" } },
    ];

    for (const marketPrice of resultAcc) {
      const row = {
        date: marketPrice["date"],
        open: marketPrice["open"],
        high: marketPrice["high"],
        low: marketPrice["low"],
        close: marketPrice["close"],
        gain: marketPrice["gain"],
        ma_5: marketPrice.ma["5"],
        ma_10: marketPrice.ma["10"],
        ma_20: marketPrice.ma["20"],
        ma_40: marketPrice.ma["40"],
        ma_60: marketPrice.ma["60"],
        ma_120: marketPrice.ma["120"],
        trade_qty: marketPrice.trade.qty,
        trade_unitPrice: marketPrice.trade.unitPrice,
        trade_gain: marketPrice.trade.gain,
        trade_cash: marketPrice.trade.cash,
        trade_total: marketPrice.trade.total,
        total_gain: marketPrice.trade.totalGain,
      };
      worksheet.addRow(row);
    }

    worksheet.addRow([]);
    worksheet.addRow(["------------"]);
    const diffDays = moment(condition.end).diff(moment(condition.start), "days");
    const gain = resultAcc[resultAcc.length - 1].gain;
    const mdd = CommonUtil.getMdd(resultAcc.map((p) => p.close));
    const cagr = CommonUtil.getCagr(1, gain + 1, diffDays);

    const gainResult = ["수익률", Math.round(gain * 100 * 100) / 100 + "%"];
    const mddResult = ["MDD", Math.round(mdd * 100 * 100) / 100 + "%"];
    const cagrResult = ["CAGR", Math.round(cagr * 100 * 100) / 100 + "%"];
    worksheet.addRow(gainResult);
    worksheet.addRow(mddResult);
    worksheet.addRow(cagrResult);
    worksheet.addRow(["------------"]);

    const sGain = resultAcc[resultAcc.length - 1].trade.totalGain;
    const sCagr = CommonUtil.getCagr(1, sGain + 1, diffDays);
    const sMdd = CommonUtil.getMdd(resultAcc.filter((p) => p.trade.total).map((p) => p.trade.total));
    const sGainResult = ["전략 수익률", Math.round(sGain * 100 * 100) / 100 + "%"];
    const sMddResult = ["전략 MDD", Math.round(sMdd * 100 * 100) / 100 + "%"];
    const sCagrResult = ["전략 CAGR", Math.round(sCagr * 100 * 100) / 100 + "%"];
    worksheet.addRow(sGainResult);
    worksheet.addRow(sMddResult);
    worksheet.addRow(sCagrResult);

    console.log(gainResult);
    console.log(mddResult);
    console.log(cagrResult);
    console.log(sGainResult);
    console.log(sMddResult);
    console.log(sCagrResult);

    worksheet.eachRow((row, rIdx) => {
      row.eachCell((cell, cIdx) => {
        let color = "cccccc";
        if (7 <= cIdx && cIdx <= 12) {
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
        }
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // 틀고정
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    CommonUtil.applyAutoColumnWith(worksheet);

    await workbook.xlsx.writeFile(Config.report.file.maisBacktest);
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

const baseCondition: Condition = {
  stock: targetStock[1],
  cash: 10_000_000,
  feeRate: 0.00015,
  investRatio: 0.99,
  start: new Date(2012, 0, 1),
  end: new Date(2016, 11, 31),
  ma: 40,
};

const backtest = new MabsBacktest();
backtest.test(baseCondition);
