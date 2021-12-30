const $ = jQuery;
import { MapSVG } from "../../Core/globals.js";
export class Server {
    constructor() {
        this.apiUrl = "/wp-json/mapsvg/v1/";
    }
    getUrl(path) {
        return this.apiUrl + path;
    }
    get(path, data) {
        return $.ajax({
            url: this.apiUrl + path,
            type: "GET",
            data: data,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
            },
        });
    }
    post(path, data) {
        const ajaxParams = {
            url: this.apiUrl + path,
            type: "POST",
            data: data,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
            }
        };
        if (data instanceof FormData) {
            ajaxParams["processData"] = false;
            ajaxParams["contentType"] = false;
        }
        return $.ajax(ajaxParams);
    }
    put(path, data) {
        const ajaxParams = {
            url: this.apiUrl + path,
            type: "PUT",
            data: data,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
            }
        };
        if (data instanceof FormData) {
            ajaxParams["processData"] = false;
            ajaxParams["contentType"] = false;
        }
        return $.ajax(ajaxParams);
    }
    delete(path, data) {
        return $.ajax({
            url: this.apiUrl + path,
            type: "DELETE",
            data: data,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
            },
        });
    }
    ajax(path, data) {
        data.url = this.getUrl(path);
        data.beforeSend = function (xhr) {
            xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
        };
        return $.ajax(data);
    }
}
//# sourceMappingURL=Server.js.map