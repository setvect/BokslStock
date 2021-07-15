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
}
