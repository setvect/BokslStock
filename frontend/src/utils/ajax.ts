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
  static get(url: string, param: GenericObject, callback: CallbackFunction, option?: GenericObject) {
    AjaxCall.ajaxCall("get", url, param, callback, option);
  }

  /*
   * url: 호출 주소
   * param: 전달 파라미터
   * option: 옵션
   */
  static post(url: string, param: GenericObject, callback: CallbackFunction, option?: GenericObject) {
    AjaxCall.ajaxCall("post", url, param, callback, option);
  }

  /*
   * url: 호출 주소
   * param: 전달 파라미터
   * option: 옵션
   */
  static put(url: string, param: GenericObject, callback: CallbackFunction, option?: GenericObject) {
    AjaxCall.ajaxCall("put", url, param, callback, option);
  }

  /*
   * url: 호출 주소
   * param: 전달 파라미터
   * option: 옵션
   */
  static patch(url: string, param: GenericObject, callback: CallbackFunction, option?: GenericObject) {
    AjaxCall.ajaxCall("patch", url, param, callback, option);
  }

  /*
   * url: 호출 주소
   * param: 전달 파라미터
   * option: 옵션
   */
  static delete = function (url: string, param: GenericObject, callback: CallbackFunction, option?: GenericObject) {
    AjaxCall.ajaxCall("delete", url, param, callback, option);
  };

  /*
   * get, post 처리
   */
  private static ajaxCall(method: string, url: string, _param: GenericObject, _callback: CallbackFunction, _option?: GenericObject) {
    const param = _param || {};
    const callback = _callback || NOTING_OPERATION;
    const option = _option || {};
    const config: { headers: GenericObject } = {
      headers: {},
    };
    if (store.getters.token) {
      // 인증 토큰
      axios.defaults.headers.common["x-auth-token"] = getToken();
    }

    const methodMap: AxiosFunction = {
      get: axios.get,
      post: axios.post,
      put: axios.put,
      patch: axios.patch,
      delete: axios.delete,
    };

    const callType = option["call-type"];

    const axiosMethod = methodMap[method];

    let sendParam: any;
    if (method === "get") {
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
      } else if (callType === "multipart" && method === "post") {
        // multipart는 post만 허용
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

    let loader: any = null;
    // 진행중 메시지 표시 여부
    if (option.wait == null || option.wait != false) {
      loader = Vue.$loading.show({
        loader: "dots",
      });
    }

    axiosMethod(url, sendParam)
      .then((result: any) => callback(result))
      .catch((err: any) => errorCall(err))
      .finally(() => {
        if (loader) {
          loader.hide();
        }
        finallyCall();
      });
  }
}
