export type StockItem = {
  code: string;
  name: string;
  // kospi, kosdaq
  market: string;
  capitalization: number;
  // 현재가
  currentPrice: number;
  // true: 일반 주식, false: etf, 리츠 등
  normalStock?: boolean;
  // 업종
  industry?: string;
  currentIndicator?: {
    // 상장주식수
    shareNumber: number;
    per: number;
    eps: number;
    pbr: number;
    // 현금배당 수익률 (%단위)
    dvr: number;
  };
  historyData?: HistoryData[];
};

export type HistoryData = {
  date: string; //yyyy.MM
  // 매출액
  sales: number;
  // 영업이익
  op: number;
  // 당기 순이익
  np: number;
  // 부채 비율
  dr: number;
  // 당좌 비율
  cr: number;
  eps: number;
  per: number;
  pbr: number;
  dvr: number;
};

export type Market = {
  name: string;
  seq: number;
};

export const MarketList: Market[] = [
  { name: "kospi", seq: 0 },
  { name: "kosdaq", seq: 1 },
];
