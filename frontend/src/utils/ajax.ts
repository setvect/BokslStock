import axios from "axios";
import store from "@/store/index";
import Vue from "vue";
import "vue-loading-overlay/dist/vue-loading.css";
import { getToken } from "./auth";
import CommonUtil from "./common-util";

const NOTING_OPERATION = () => {
  // No Operation
};

type GenericObject = { [key: string]: any };

type CallbackFunction = (result: any) => any;

// get, delete, option,head 타입 유형과 post, put, patch 유형을 만족하기 위해서 param1, param2로 나눠었음
type AxiosFunction = { [key: string]: (url: string, param1?: any, param2?: any) => Promise<any> };

export default class AjaxCall {
  /*
   * url: 호출 주소
   * param: 전달 파라미터
   * option: 옵션
   */
  static async get(url: string, param: GenericObject, option?: GenericObject) {
    return await AjaxCall.ajaxCall("get", url, param, option);
  }

  /*
   * url: 호출 주소
   * param: 전달 파라미터
   * option: 옵션
   */
  static async post(url: string, param: GenericObject, option?: GenericObject) {
    return await AjaxCall.ajaxCall("post", url, param, option);
  }

  /*
   * url: 호출 주소
   * param: 전달 파라미터
   * option: 옵션
   */
  static async put(url: string, param: GenericObject, option?: GenericObject) {
    return await AjaxCall.ajaxCall("put", url, param, option);
  }

  /*
   * url: 호출 주소
   * param: 전달 파라미터
   * option: 옵션
   */
  static async patch(url: string, param: GenericObject, option?: GenericObject) {
    return await AjaxCall.ajaxCall("patch", url, param, option);
  }

  /*
   * url: 호출 주소
   * param: 전달 파라미터
   * option: 옵션
   */
  static async delete(url: string, param: GenericObject, option?: GenericObject) {
    return await AjaxCall.ajaxCall("delete", url, param, option);
  }

  static async ajaxCall(method: string, url: string, _param: GenericObject, _option?: GenericObject) {
    const option = _option || {};
    const { axiosMethod, config, sendParam, errorCall, finallyCall } = AjaxCall.makeParameter(method, _param, option);
    let loader: any = null;

    // 진행중 메시지 표시 여부
    if (option.wait == null || option.wait != false) {
      loader = Vue.$loading.show({
        loader: "dots",
      });
    }
    try {
      if (method === "get") {
        return await axiosMethod(url, config);
      } else {
        return await axiosMethod(url, sendParam, config);
      }
    } catch (err) {
      errorCall(err);
    } finally {
      if (loader) {
        loader.hide();
        loader = null;
      }
      finallyCall();
    }
  }

  private static makeParameter(method: string, _param: GenericObject, _option: GenericObject) {
    const param = _param || {};
    const option = _option || {};
    const config: { headers: GenericObject; responseType?: string } = {
      headers: {},
    };
    if (store.getters.token) {
      // 인증 토큰
      axios.defaults.headers.common["X-AUTH-TOKEN"] = getToken();
    }

    const methodMap: AxiosFunction = {
      get: axios.get,
      post: axios.post,
      put: axios.put,
      patch: axios.patch,
      delete: axios.delete,
    };

    // 기본적으로 Content-Type은 json
    const callType = option["call-type"] || "json";

    const axiosMethod = methodMap[method];
    let sendParam: any;

    if (method === "get") {
      // || method === "delete"
      const paramValue = new URLSearchParams();
      Object.keys(param).map((key) => {
        const value = param[key];
        if (value === null) {
          return;
        }
        if (Array.isArray(value)) {
          value.forEach((v) => paramValue.append(key, v));
        } else {
          paramValue.append(key, param[key]);
        }
      });
      sendParam = {
        params: paramValue,
      };
    } else {
      if (callType === "json") {
        sendParam = param;
        config.headers["Content-Type"] = "application/json; charset=utf-8";
      }

      // multipart는 post만 허용
      else if (callType === "multipart" && method === "post") {
        sendParam = new FormData();
        $.each(param, function (key, value) {
          if (Array.isArray(value)) {
            value.forEach((v) => sendParam.append(key, v));
          } else {
            sendParam.append(key, value);
          }
        });
        config.headers["Content-Type"] = "multipart/form-data";
      } else {
        sendParam = $.param(param, true);
      }
    }

    const finallyCall = option.finallyCall || NOTING_OPERATION;
    const errorCall =
      option.errorCall ||
      function (err: any) {
        CommonUtil.popupError(err);
      };

    if (option.download) {
      config["responseType"] = "arraybuffer";
    }
    return {
      axiosMethod,
      config,
      sendParam,
      errorCall,
      finallyCall,
    };
  }
}
