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
  ma: GenericObject;
  trade?: {
    qty?: number;
    // 매수단가
    unitPrice?: number;
    // 거래 수수료
    fee?: number;
    cash?: number;
    // 수익률
    gain?: number;
    total?: number;
    totalGain?: number;
  };
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
