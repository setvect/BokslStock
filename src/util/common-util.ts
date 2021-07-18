import { val } from "cheerio/lib/api/attributes";
import fs = require("fs");

export default class CommonUtil {
  static escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  static unescapeHtml(text: string) {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/#039;/g, "'");
  }

  /**
   * 변수의 타입 정보
   * @param obj
   */
  static getClass(obj: any): string {
    const instance = typeof obj;
    if (instance === "object") {
      return obj.constructor.name;
    }
    return instance;
  }

  /**
   * 정규표현식에서 사용하는 특수문자를 escape 처리함
   * @param str
   */
  static escapeRegExp(str: string) {
    return str.replace(/[\\-\\[\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\^\\$\\|]/g, "\\$&");
  }

  /**
   * 문장 전체 치환
   * @param text
   * @param org
   * @param dest
   */
  static replaceAll(text: string, org: string, dest: string): string {
    const escape = CommonUtil.escapeRegExp(org);
    const re = new RegExp(escape, "g");
    return text.replace(re, dest);
  }

  static async delay(ms: number): Promise<number> {
    return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
  }

  static saveObjectToJson(stockList: any, savePath: string) {
    const json = JSON.stringify(stockList, null, 2);
    fs.writeFile(savePath, json, (err: NodeJS.ErrnoException) => {
      if (err) {
        console.error(err);
      }
    });
  }

  static getElementText(element: cheerio.Cheerio): string {
    return element.text().trim();
  }

  static getElementInt(element: cheerio.Cheerio): number | null {
    const value = CommonUtil.getText(element);
    const n = parseInt(value);
    return isNaN(n) ? null : n;
  }

  static getElementFloat(element: cheerio.Cheerio): number | null {
    const value = CommonUtil.getText(element);
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  private static getText(element: cheerio.Cheerio) {
    let value = this.getElementText(element);
    value = CommonUtil.replaceAll(value, ",", "");
    return value;
  }
}
