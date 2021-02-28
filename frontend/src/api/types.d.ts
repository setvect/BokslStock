export type GenericObject = { [key: string]: any };
export type CallbackFunction = (result: any) => any;

export interface PageMetadata {
  totalCount: number;
  startCursor: number;
}
