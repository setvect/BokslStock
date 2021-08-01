import * as moment from "moment";
import Config from "@/config/default";
import CommonUtil from "@/util/common-util";
import * as _ from "lodash";
import * as Excel from "exceljs";
import { StockItem, BaseCondition, Trade } from "./BacktestType";
import CrawlerHttp from "../crawler/CrawlerHttp";

/**
 * RSI 백테스트
 */
class VbsBacktest {
  async backtest(condition: VbsCondition) {
    // 1. 데이터 블러오기
    const text = await CommonUtil.readTextFile(this.getFilePath(condition.stock));
    const priceObject: Array<[string, number, number, number, number]> = JSON.parse(text);
    priceObject.splice(0, 1);

    // 2. 데이터 가공
    const marketPriceList: VbsStockPrice[] = this.makeVbsStockPrice(priceObject);

    // 3. 분석
    const resultAcc = this.analysis(condition, marketPriceList);

    // 4.결과 저장(excel)
    const summary = await this.makeReport(condition, resultAcc);
    return summary;
  }

  /**
   * 데이터 가공
   * @param priceObject
   */
  private makeVbsStockPrice(priceObject: [string, number, number, number, number][]) {
    const initClosePrice = priceObject[0][4];
    const marketPriceList: VbsStockPrice[] = priceObject.map(
      (p): VbsStockPrice => {
        return {
          date: p[0],
          open: p[1],
          high: p[2],
          low: p[3],
          close: p[4],
          gain: CommonUtil.getYield(p[4], initClosePrice),
          targetPrice: Number.MAX_VALUE,
          targetPriceFormula: "",
          trade: {},
        };
      },
    );
    return marketPriceList;
  }

  /**
   * 분석
   * @param condition 조건
   * @param marketPriceList 시세 데이터
   */
  private analysis(condition: VbsCondition, marketPriceList: VbsStockPrice[]) {
    const account = {
      cash: condition.cash,
      qty: 0,
      buyPrice: 0,
      buyCount: 0,
    };

    const formStr = moment(condition.start).format("YYYYMMDD");
    const endStr = moment(condition.end).format("YYYYMMDD");

    const resultAcc: VbsStockPrice[] = [];

    for (let i = 1; i < marketPriceList.length; i++) {
      const currentPrice = marketPriceList[i];
      const beforePrice = marketPriceList[i - 1];

      if (currentPrice.date < formStr || currentPrice.date > endStr) {
        continue;
      }

      // 목표가
      // 오늘 시가 + (전날 고가 - 전날 저가) * 변동성 비율
      const targetPrice = currentPrice.open + (beforePrice.high - beforePrice.low) * condition.k;
      let isTrade = false;

      // 매도 체크(전날 매수를 했을 경우)
      if (account.qty !== 0) {
        // 그날 시가 매도
        const fee = Math.floor(currentPrice.open * account.qty * condition.feeRate);
        const gain = CommonUtil.getYield(currentPrice.open, account.buyPrice);

        const gainPrice = account.qty * currentPrice.open - account.qty * account.buyPrice;

        account.cash = account.cash + currentPrice.open * account.qty - fee;
        account.qty = 0;
        account.buyPrice = 0;

        const stockPrice = _.cloneDeep(currentPrice);
        stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
        stockPrice.targetPrice = 0;

        stockPrice.trade = {
          action: "SELL",
          cash: account.cash,
          fee,
          qty: account.qty,
          buyPrice: account.buyPrice,
          sellPrice: currentPrice.open,
          gain,
          gainPrice: gainPrice,
          total: account.cash + account.qty * account.buyPrice,
        };
        stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
        resultAcc.push(stockPrice);
        resultAcc[resultAcc.length - 1].gain = CommonUtil.getYield(resultAcc[resultAcc.length - 1].open, resultAcc[0].open);
        isTrade = true;
      }

      // 매수 체크
      if (account.qty === 0) {
        const stockPrice = _.cloneDeep(currentPrice);
        stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
        stockPrice.targetPrice = targetPrice;
        stockPrice.targetPriceFormula = `${currentPrice.open} + (${beforePrice.high} - ${beforePrice.low}) * ${condition.k}`;

        if (currentPrice.high > stockPrice.targetPrice) {
          // 정해진 목표가 매수
          account.buyPrice = stockPrice.targetPrice;
          account.qty = Math.floor((account.cash * condition.investRatio) / account.buyPrice);
          const fee = Math.floor(account.buyPrice * account.qty * condition.feeRate);
          account.cash = account.cash - account.buyPrice * account.qty - fee;
          stockPrice.trade = {
            action: "BUY",
            cash: account.cash,
            fee,
            qty: account.qty,
            buyPrice: account.buyPrice,
            sellPrice: 0,
            gain: 0,
            gainPrice: 0,
            total: account.cash + account.qty * account.buyPrice,
          };
          stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
          resultAcc.push(stockPrice);
          resultAcc[resultAcc.length - 1].gain = CommonUtil.getYield(resultAcc[resultAcc.length - 1].close, resultAcc[0].close);
          isTrade = true;
        }
      }

      if (!isTrade) {
        const stockPrice = _.cloneDeep(currentPrice);
        stockPrice.targetPrice = targetPrice;
        stockPrice.targetPriceFormula = `${currentPrice.open} + (${beforePrice.high} - ${beforePrice.low}) * ${condition.k}`;

        stockPrice.trade = {
          action: "-",
          cash: account.cash,
          fee: 0,
          qty: account.qty,
          buyPrice: account.buyPrice,
          sellPrice: 0,
          gain: 0,
          gainPrice: 0,
          total: account.cash + account.qty * currentPrice.close,
        };
        resultAcc.push(stockPrice);
        resultAcc[resultAcc.length - 1].gain = CommonUtil.getYield(resultAcc[resultAcc.length - 1].close, resultAcc[0].close);
        stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
      }
    }
    return resultAcc;
  }

  /**
   * 엑레 리포트 만듦
   * @param condition 조건
   * @param resultAcc 매매 이력
   */
  private async makeReport(condition: VbsCondition, resultAcc: VbsStockPrice[]) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("종목");
    worksheet.columns = [
      { header: "날짜", key: "date" },
      { header: "시가", key: "open", style: { numFmt: "###,###" } },
      { header: "고가", key: "high", style: { numFmt: "###,###" } },
      { header: "저가", key: "low", style: { numFmt: "###,###" } },
      { header: "종가", key: "close", style: { numFmt: "###,###" } },
      { header: "주가 수익률(종가 기준)", key: "gain", style: { numFmt: "0.00%" } },
      { header: "주가 수익비(종가 기준)", key: "gain_rate", style: { numFmt: "###,###.00" } },
      { header: "목표가 계산식", key: "target_price_formula", style: { numFmt: "###,###" } },
      { header: "목표가", key: "target_price", style: { numFmt: "###,###" } },
      { header: "매매여부", key: "action", style: { alignment: { horizontal: "center" } } },
      { header: "수량", key: "trade_qty", style: { numFmt: "###,###" } },
      { header: "매입가", key: "trade_buyPrice", style: { numFmt: "###,###" } },
      { header: "매도가", key: "trade_sellPrice", style: { numFmt: "###,###" } },
      { header: "수수료", key: "fee", style: { numFmt: "###,###" } },
      { header: "실현수익률(수수료 X)", key: "trade_gain", style: { numFmt: "0.00%" } },
      { header: "수익금(수수료 X)", key: "price_gain", style: { numFmt: "###,###" } },
      { header: "현금", key: "trade_cash", style: { numFmt: "###,###" } },
      { header: "통합 금액", key: "trade_total", style: { numFmt: "###,###" } },
      { header: "전략 수익률", key: "total_gain", style: { numFmt: "0.00%" } },
      { header: "전략 수익비", key: "total_gain_rate", style: { numFmt: "###,###.00" } },
    ];

    for (const marketPrice of resultAcc) {
      const row = {
        date: marketPrice["date"],
        open: marketPrice["open"],
        high: marketPrice["high"],
        low: marketPrice["low"],
        close: marketPrice["close"],
        gain: marketPrice["gain"],
        gain_rate: 1 + marketPrice["gain"],
        target_price_formula: marketPrice.targetPriceFormula,
        target_price: marketPrice.targetPrice,
        action: marketPrice.trade.action,
        trade_qty: marketPrice.trade.qty,
        trade_buyPrice: marketPrice.trade.buyPrice,
        trade_sellPrice: marketPrice.trade.sellPrice,
        fee: marketPrice.trade.fee,
        trade_gain: marketPrice.trade.gain,
        price_gain: marketPrice.trade.gainPrice,
        trade_cash: marketPrice.trade.cash,
        trade_total: marketPrice.trade.total,
        total_gain: marketPrice.trade.totalGain,
        total_gain_rate: 1 + marketPrice.trade.totalGain,
      };
      worksheet.addRow(row);
    }

    const diffDays = moment(condition.end).diff(moment(condition.start), "days");
    console.log("resultAcc.length :>> ", resultAcc.length);
    const gain = resultAcc[resultAcc.length - 1].gain;
    const mdd = CommonUtil.getMdd(resultAcc.map((p) => p.close));
    const cagr = CommonUtil.getCagr(1, gain + 1, diffDays);

    const gainResult = [null, "수익률", Math.round(gain * 100 * 100) / 100 + "%"];
    const mddResult = [null, "MDD", Math.round(mdd * 100 * 100) / 100 + "%"];
    const cagrResult = [null, "CAGR", Math.round(cagr * 100 * 100) / 100 + "%"];

    worksheet.addRow([]);
    worksheet.addRow([null, `----- ${condition.stock.name}(${condition.stock.code}) -----`]);
    worksheet.addRow(gainResult);
    worksheet.addRow(mddResult);
    worksheet.addRow(cagrResult);

    const sGain = resultAcc[resultAcc.length - 1].trade.totalGain;
    const sCagr = CommonUtil.getCagr(1, sGain + 1, diffDays);
    const sMdd = CommonUtil.getMdd(resultAcc.filter((p) => p.trade.total).map((p) => p.trade.total));
    const sTradeCount = resultAcc.filter((p) => p.trade.sellPrice).length;
    const sWinCount = resultAcc.filter((p) => p.trade.gain > 0).length;

    worksheet.addRow([null, `----- 전략결과 -----`]);
    const sGainResult = [null, "전략 수익률", Math.round(sGain * 100 * 100) / 100 + "%"];
    const sMddResult = [null, "전략 MDD", Math.round(sMdd * 100 * 100) / 100 + "%"];
    const sCagrResult = [null, "전략 CAGR", Math.round(sCagr * 100 * 100) / 100 + "%"];
    const sTradeCountResult = [null, "전략 매매횟수", sTradeCount];
    const sTradeWinRateResult = [null, "전략 승률", Math.round((sWinCount / sTradeCount) * 100 * 100) / 100 + "%"];

    worksheet.addRow(sGainResult);
    worksheet.addRow(sMddResult);
    worksheet.addRow(sCagrResult);
    worksheet.addRow(sTradeCountResult);
    worksheet.addRow(sTradeWinRateResult);

    worksheet.addRow([null, `----- 조건 -----`]);
    worksheet.addRow([null, "기간", `${moment(condition.start).format("YYYYMMDD")} ~ ${moment(condition.end).format("YYYYMMDD")}`]);
    worksheet.addRow([null, "대상종목", `${condition.stock.name}(${condition.stock.code})`]);
    worksheet.addRow([null, "시작현금", `${CommonUtil.toComma(condition.cash)}원`]);
    worksheet.addRow([null, "투자비율", `${condition.investRatio * 100}%`]);
    worksheet.addRow([null, "수수료", `${condition.feeRate * 100}%`]);
    worksheet.addRow([null, "K", `${condition.k}`]);

    // 결과 출력
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
        if (8 <= cIdx && cIdx <= 9) {
          color = "00eeee";
        } else if (10 <= cIdx && cIdx <= 20) {
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

    const pattern = ` ${condition.stock.name}_${moment(condition.start).format("YYYYMMDD")}-${moment(condition.end).format("YYYYMMDD")}`;
    await workbook.xlsx.writeFile(CommonUtil.replaceAll(Config.report.file.vbsBacktest, "{pattern}", pattern));

    const summary: Summary = {
      market: {
        gain: gain,
        mdd: mdd,
        cagr: cagr,
      },
      strategy: {
        gain: sGain,
        mdd: sMdd,
        cagr: sCagr,
        tradeCount: sTradeCount,
        winCount: sWinCount,
      },
    };
    return summary;
  }
  async crawler(stock: StockItem) {
    const START = "20010101";
    const END = moment().format("YYYYMMDD");

    const priceArray = await CrawlerHttp.getMakretPrice(stock.code, START, END);
    await CommonUtil.saveObjectToJson(priceArray, Config.crawling.dir.marketPrice + "/" + `${stock.code}_${stock.name}.json`);
    const delayTime = 500 + Math.random() * 1000;
    console.log(`code: ${stock.code}, name: ${stock.name}, delayTime: ${delayTime}`);
  }

  private getFilePath(stock: { code: string; name: string }): string {
    return Config.crawling.dir.marketPrice + "/" + `${stock.code}_${stock.name}.json`;
  }
}

type VbsStockPrice = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  // 초기 값 기준 수익률
  gain: number;
  targetPrice: number;
  // 목표가 계산식
  targetPriceFormula: string;
  trade?: Trade;
};

type VbsCondition = {
  // 변동성 비율
  k: number;
  comment?: string;
} & BaseCondition;

type Summary = {
  market: {
    gain: number;
    mdd: number;
    cagr: number;
  };
  strategy: {
    gain: number;
    mdd: number;
    cagr: number;
    tradeCount: number;
    winCount: number;
  };
  condtion?: VbsCondition;
};

const targetStock: StockItem[] = [
  {
    code: "069500",
    name: "KODEX 200",
  },
  {
    code: "122630",
    name: "KODEX 레버리지",
  },
  {
    code: "229200",
    name: "KODEX 코스닥 150",
  },
  {
    code: "233740",
    name: "KODEX 코스닥150 레버리지",
  },
];

async function baktest() {
  const baseCondition: VbsCondition = {
    stock: targetStock[0],
    cash: 10_000_000,
    feeRate: 0.0002,
    investRatio: 0.99,
    start: new Date(2002, 1, 1),
    end: new Date(2021, 6, 31),
    k: 0.5,
  };

  const rangeList = [{ start: new Date(2002, 11 - 1, 1), end: new Date(2021, 7 - 1, 31) }];

  const backtest = new VbsBacktest();
  const summaryList: Summary[] = [];
  for (const stock of targetStock) {
    for (const range of rangeList) {
      baseCondition.stock = stock;
      baseCondition.start = range.start;
      baseCondition.end = range.end;

      const summary = await backtest.backtest(baseCondition);
      summary.condtion = _.cloneDeep(baseCondition);
      summaryList.push(summary);
    }
  }

  await makeReportSummary(summaryList);
}
/**
 * 요약 엑셀 리포트
 * @param summaryList
 */
async function makeReportSummary(summaryList: Summary[]) {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet("변동성돌파 전략 요약");
  worksheet.columns = [
    { header: "기간", key: "rnage" },
    { header: "대상종목", key: "market" },
    { header: "시작현금", key: "cash", style: { numFmt: "###,###" } },
    { header: "투자비율", key: "investRatio", style: { numFmt: "0.00%" } },
    { header: "수수료", key: "feeRate", style: { numFmt: "0.000%" } },
    { header: "K", key: "k", style: { numFmt: "0.0" } },
    { header: "조건 설명", key: "comment" },
    { header: "종목 수익률", key: "marketGain", style: { numFmt: "0.00%" } },
    { header: "종목 MDD", key: "marketMdd", style: { numFmt: "0.00%" } },
    { header: "종목 CAGR", key: "marketCagr", style: { numFmt: "0.00%" } },
    { header: "전략 수익률", key: "strategyGain", style: { numFmt: "0.00%" } },
    { header: "전략 MDD", key: "strategyMdd", style: { numFmt: "0.00%" } },
    { header: "전략 CAGR", key: "strategyCagr", style: { numFmt: "0.00%" } },
    { header: "매매회수", key: "strategyTradeCount", style: { numFmt: "###,###" } },
    { header: "승률", key: "strategyTradeWinRate", style: { numFmt: "0.00%" } },
  ];

  for (const summary of summaryList) {
    const condition = summary.condtion;
    const row = {
      rnage: `${moment(condition.start).format("YYYYMMDD")} ~ ${moment(condition.end).format("YYYYMMDD")}`,
      market: `${condition.stock.name}(${condition.stock.code})`,
      cash: condition.cash,
      investRatio: condition.investRatio,
      feeRate: condition.feeRate,
      k: condition.k,
      comment: condition.comment || "",
      marketGain: summary.market.gain,
      marketMdd: summary.market.mdd,
      marketCagr: summary.market.cagr,
      strategyGain: summary.strategy.gain,
      strategyMdd: summary.strategy.mdd,
      strategyCagr: summary.strategy.cagr,
      strategyTradeCount: summary.strategy.tradeCount,
      strategyTradeWinRate: summary.strategy.winCount / summary.strategy.tradeCount,
    };
    worksheet.addRow(row);
  }

  worksheet.eachRow((row, rIdx) => {
    row.eachCell((cell, cIdx) => {
      let color = "cccccc";
      if (8 <= cIdx && cIdx <= 10) {
        color = "00eeee";
      } else if (11 <= cIdx && cIdx <= 15) {
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

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  CommonUtil.applyAutoColumnWith(worksheet);
  await workbook.xlsx.writeFile(Config.report.file.vbsBacktestSummary);
}

async function crawler() {
  const backtest = new VbsBacktest();
  for (const stock of targetStock) {
    await backtest.crawler(stock);
  }
}

// crawler();
baktest();
