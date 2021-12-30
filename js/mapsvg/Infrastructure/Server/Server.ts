const $ = jQuery;
import { MapSVG } from "../../Core/globals.js";

export class Server {
    apiUrl: string;
    completeChunks: number;

    constructor() {
        this.apiUrl = MapSVG.urls.api;
    }
    getUrl(path) {
        return this.apiUrl + path;
    }
    get(path: string, data?: any): JQueryPromise<any> {
        return $.ajax({
            url: this.apiUrl + path,
            type: "GET",
            data: data,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
            },
        });
    }
    post(path: string, data?: any): JQueryPromise<any> {
        const ajaxParams = {
            url: this.apiUrl + path,
            type: "POST",
            data: data,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
            },
        };

        if (data instanceof FormData) {
            ajaxParams["processData"] = false;
            ajaxParams["contentType"] = false;
        }

        return $.ajax(ajaxParams);
    }
    put(path: string, data?: any): JQueryPromise<any> {
        const ajaxParams = {
            url: this.apiUrl + path,
            type: "POST",
            data: data,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
                xhr.setRequestHeader("X-HTTP-Method-Override", "PUT");
            },
        };

        if (data instanceof FormData) {
            ajaxParams["processData"] = false;
            ajaxParams["contentType"] = false;
        }

        return $.ajax(ajaxParams);
    }
    delete(path: string, data?: any): JQueryPromise<any> {
        return $.ajax({
            url: this.apiUrl + path,
            type: "POST",
            data: data,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
                xhr.setRequestHeader("X-HTTP-Method-Override", "DELETE");
            },
        });
    }
    ajax(
        path: string,
        data: { type: string; data: any; processData?: boolean; contentType?: boolean }
    ): JQueryPromise<any> {
        // @ts-ignore
        data.url = this.getUrl(path);
        // @ts-ignore
        data.beforeSend = function (xhr) {
            xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
        };
        // @ts-ignore
        return $.ajax(data);
    }
}
