export type StockItem = {
  code: string;
  name: string;
  market: string;
  capitalization: number;
};

export type Market = {
  name: string;
  seq: number;
};

export const MarketList: Market[] = [
  { name: "kospi", seq: 0 },
  { name: "kosdaq", seq: 1 },
];
