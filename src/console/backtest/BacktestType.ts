import { GenericObject } from "@/types/type";

export type StockItem = {
  code: string;
  name: string;
};

export type StockPrice = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  // 초기 값 기준 수익률
  gain: number;
  ma?: GenericObject;
  trade?: Trade;
};

export type Trade = {
  qty?: number;
  // 매수단가
  buyPrice?: number;
  // 매도단가
  sellPrice?: number;
  // 거래 수수료
  fee?: number;
  cash?: number;
  // 수익률
  gain?: number;
  // 수익금
  gainPrice?: number;
  total?: number;
  // 전체 수익금
  totalGain?: number;
  // 매수, 매도, 매매 하지 않음
  action?: "BUY" | "SELL" | "-";
};

export type BaseCondition = {
  stock: StockItem;
  cash: number;
  feeRate: number;
  investRatio: number;
  start: Date;
  end: Date;
};

export type Condition = {
  stock: StockItem;
  cash: number;
  feeRate: number;
  investRatio: number;
  start: Date;
  end: Date;
  ma: number;
};

/**
 * 절대 모멘텀 조건
 */
export type AmCondition = {
  // 1월 == 1, 12월 == 12
  diffMonth: number;
} & BaseCondition;

export type Ohlc = {
  open: number;
  high: number;
  low: number;
  close: number;
};
