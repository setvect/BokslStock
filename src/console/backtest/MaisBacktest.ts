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
  async test(condition: MaisCondition) {
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

    for (let i = 0; i < marketPriceList.length; i++) {
      const price = marketPriceList[i];

      if (i >= condition.ma - 1) {
        const priceHistory = closePrice.slice(i - (condition.ma - 1), i + 1);
        price.ma[condition.ma + ""] = _.mean(priceHistory);
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
          account.unitPrice = marketPrice.close;
          account.qty = Math.floor((account.cash * condition.investRatio) / account.unitPrice);
          const fee = Math.floor(account.unitPrice * account.qty * condition.feeRate);
          account.cash = account.cash - account.unitPrice * account.qty - fee;
          stockPrice.trade = {
            cash: account.cash,
            fee,
            qty: account.qty,
            unitPrice: account.unitPrice,
            buyPrice: 0,
            gain: 0,
            total: account.cash + account.qty * account.unitPrice,
          };
        } else {
          stockPrice.trade = {
            cash: account.cash,
            fee: 0,
            qty: account.qty,
            unitPrice: account.unitPrice,
            buyPrice: 0,
            gain: 0,
            total: account.cash + account.qty * account.unitPrice,
          };
        }
      }
      // 매도 체크
      else if (marketPriceList[i - 1].ma[condition.ma] > marketPrice.ma[condition.ma]) {
        // 시초가 매매
        const fee = Math.floor(marketPrice.close * account.qty * condition.feeRate);
        const gain = CommonUtil.getYield(marketPrice.close, account.unitPrice);

        account.cash = account.cash + marketPrice.close * account.qty - fee;
        account.qty = 0;
        account.unitPrice = 0;

        stockPrice.trade = {
          cash: account.cash,
          fee,
          qty: account.qty,
          unitPrice: account.unitPrice,
          buyPrice: marketPrice.close,
          gain,
          total: account.cash + account.qty * account.unitPrice,
        };
      } else {
        stockPrice.trade = {
          cash: account.cash,
          fee: 0,
          qty: account.qty,
          unitPrice: account.unitPrice,
          buyPrice: 0,
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
      { header: "수익률", key: "gain", style: { numFmt: "0.00%" } },
      { header: `이동평균(${condition.ma})`, key: "ma", style: { numFmt: "###,###" } },
      { header: "수량", key: "trade_qty", style: { numFmt: "###,###" } },
      { header: "매수 단가", key: "trade_unitPrice", style: { numFmt: "###,###" } },
      { header: "매도 단가", key: "trade_buyPrice", style: { numFmt: "###,###" } },
      { header: "수수료", key: "fee", style: { numFmt: "###,###" } },
      { header: "실현수익", key: "trade_gain", style: { numFmt: "0.00%" } },
      { header: "현금", key: "trade_cash", style: { numFmt: "###,###" } },
      { header: "통합 금액", key: "trade_total", style: { numFmt: "###,###" } },
      { header: "통합수익률", key: "total_gain", style: { numFmt: "0.00%" } },
    ];

    for (const marketPrice of resultAcc) {
      const row = {
        date: marketPrice["date"],
        open: marketPrice["open"],
        high: marketPrice["high"],
        low: marketPrice["low"],
        close: marketPrice["close"],
        gain: marketPrice["gain"],
        ma: marketPrice.ma[condition.ma],
        trade_qty: marketPrice.trade.qty,
        fee: marketPrice.trade.fee,
        trade_unitPrice: marketPrice.trade.unitPrice,
        trade_buyPrice: marketPrice.trade.buyPrice,
        trade_gain: marketPrice.trade.gain,
        trade_cash: marketPrice.trade.cash,
        trade_total: marketPrice.trade.total,
        total_gain: marketPrice.trade.totalGain,
      };
      worksheet.addRow(row);
    }

    worksheet.addRow([]);
    worksheet.addRow([null, "------------"]);
    const diffDays = moment(condition.end).diff(moment(condition.start), "days");
    const gain = resultAcc[resultAcc.length - 1].gain;
    const mdd = CommonUtil.getMdd(resultAcc.map((p) => p.close));
    const cagr = CommonUtil.getCagr(1, gain + 1, diffDays);

    const gainResult = [null, "수익률", Math.round(gain * 100 * 100) / 100 + "%"];
    const mddResult = [null, "MDD", Math.round(mdd * 100 * 100) / 100 + "%"];
    const cagrResult = [null, "CAGR", Math.round(cagr * 100 * 100) / 100 + "%"];
    worksheet.addRow(gainResult);
    worksheet.addRow(mddResult);
    worksheet.addRow(cagrResult);
    worksheet.addRow([null, "------------"]);

    const sGain = resultAcc[resultAcc.length - 1].trade.totalGain;
    const sCagr = CommonUtil.getCagr(1, sGain + 1, diffDays);
    const sMdd = CommonUtil.getMdd(resultAcc.filter((p) => p.trade.total).map((p) => p.trade.total));
    const sTradeCount = resultAcc.filter((p) => p.trade.buyPrice).length;
    const sWinCount = resultAcc.filter((p) => p.trade.gain > 0).length;

    const sGainResult = [null, "전략 수익률", Math.round(sGain * 100 * 100) / 100 + "%"];
    const sMddResult = [null, "전략 MDD", Math.round(sMdd * 100 * 100) / 100 + "%"];
    const sCagrResult = [null, "전략 CAGR", Math.round(sCagr * 100 * 100) / 100 + "%"];
    const sTradeCountResult = [null, "전략 매매횟수", sTradeCount];
    const sTradeWinRateResult = [null, "전략 승률", Math.round((sWinCount / sTradeCount) * 100 * 100) / 100 + "%"];

    worksheet.addRow(sGainResult);
    worksheet.addRow(sMddResult);
    worksheet.addRow(sCagrResult);

    console.log(gainResult);
    console.log(mddResult);
    console.log(cagrResult);
    console.log(sGainResult);
    console.log(sMddResult);
    console.log(sCagrResult);
    console.log(sTradeCountResult);
    console.log(sTradeWinRateResult);

    worksheet.eachRow((row, rIdx) => {
      row.eachCell((cell, cIdx) => {
        let color = "cccccc";
        if (7 <= cIdx && cIdx <= 7) {
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

    const pattern = ` ${condition.stock.name}(${condition.ma})_${moment(condition.start).format("YYYYMMDD")}-${moment(condition.end).format("YYYYMMDD")}`;

    await workbook.xlsx.writeFile(CommonUtil.replaceAll(Config.report.file.maisBacktest, "{pattern}", pattern));
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

const baseCondition: MaisCondition = {
  stock: targetStock[0],
  cash: 10_000_000,
  feeRate: 0.00015,
  investRatio: 0.99,
  start: new Date(2015, 0, 1),
  end: new Date(2018, 7, 31),
  ma: 40,
};

export type MaisCondition = {
  stock: StockItem;
  cash: number;
  feeRate: number;
  investRatio: number;
  start: Date;
  end: Date;
  ma: number;
};

async function aaa() {
  const backtest = new MabsBacktest();
  const maList = [10, 20, 30, 40, 50, 60, 70];
  const rangeList = [
    // { start: new Date(2010, 3, 1), end: new Date(2010, 11, 31) },
    // { start: new Date(2011, 0, 1), end: new Date(2011, 11, 31) },
    // { start: new Date(2012, 0, 1), end: new Date(2012, 11, 31) },
    // { start: new Date(2013, 0, 1), end: new Date(2013, 11, 31) },
    // { start: new Date(2014, 0, 1), end: new Date(2014, 11, 31) },
    // { start: new Date(2015, 0, 1), end: new Date(2015, 11, 31) },
    // { start: new Date(2016, 0, 1), end: new Date(2016, 11, 31) },
    // { start: new Date(2017, 0, 1), end: new Date(2017, 11, 31) },
    // { start: new Date(2018, 0, 1), end: new Date(2018, 11, 31) },
    // { start: new Date(2019, 0, 1), end: new Date(2019, 11, 31) },
    // { start: new Date(2020, 0, 1), end: new Date(2020, 11, 31) },
    // { start: new Date(2021, 0, 1), end: new Date(2021, 11, 31) },
    { start: new Date(2004, 0, 1), end: new Date(2021, 11, 31) },
  ];

  for (const ma of maList) {
    for (const range of rangeList) {
      console.log("ma :>> ", ma, moment(range.start).format("YYYY-MM-DD") + "~" + moment(range.end).format("YYYY-MM-DD"));
      baseCondition.ma = ma;
      baseCondition.start = range.start;
      baseCondition.end = range.end;
      await backtest.test(baseCondition);
    }
  }
}
aaa();
