/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/query",
	"esri/urlUtils"
], function (array, declare, lang, query, urlUtils) {
	return declare(null, {

		config: {},
		sharingUrl: "",
		urlQueryObject:"",

		constructor:function (templateConfig) {
			this.config = templateConfig;
			this.urlQueryObject = this._getUrlParameters();
		},

		_getUrlParameters:function () {
			var urlObject = urlUtils.urlToObject(window.location.href);
			return urlObject.query;
		},

		documentClickHandler: function (evt) {
			if (!$("#bitlyIcon").is(evt.target) && !$("#bitlyInput").is(evt.target) && !$(".popover-content").is(evt.target)) {
				$(".popover").hide();
			}
		},

		requestBitly: function () {
			var url = this.sharingUtils._setSharingUrl(this),
				bitlyUrls = [
					"http://api.bitly.com/v3/shorten?callback=?",
					"https://api-ssl.bitly.com/v3/shorten?callback=?"
				],
				bitlyUrl = location.protocol === 'http:' ? bitlyUrls[0] : bitlyUrls[1],
				urlParams = urlUtils.urlToObject(url).query || {},
				targetUrl = url;

			$.getJSON(
					bitlyUrl,
					{
						"format":"json",
						"apiKey":"R_14fc9f92e48f7c78c21db32bd01f7014",
						"login":"esristorymaps",
						"longUrl":targetUrl
					},
					function (response) {
						if (!response || !response || !response.data.url)
							return;
						$("#bitlyLoad").fadeOut();
						$("#bitlyInput").fadeIn();
						$("#bitlyInput").val(response.data.url);
						$("#bitlyInput").select();
					}
			);
			$(".popover").show();
		},

		shareFacebook: function () {
			var url = this.sharingUtils._setSharingUrl(this),
				options = '&p[title]=' + encodeURIComponent($('#title').text())
					+ '&p[summary]=' + encodeURIComponent($('#subtitle').text())
					+ '&p[url]=' + encodeURIComponent(url)
					+ '&p[images][0]=' + encodeURIComponent($("meta[property='og:image']").attr("content"));

			window.open('http://www.facebook.com/sharer.php?s=100' + options, 'Facebook sharing', 'toolbar=0,status=0,width=626,height=436');
		},

		shareTwitter: function () {
			var url = this.sharingUtils._setSharingUrl(this),
				bitlyUrls = [
					"http://api.bitly.com/v3/shorten?callback=?",
					"https://api-ssl.bitly.com/v3/shorten?callback=?"
				],
				bitlyUrl = location.protocol === 'http:' ? bitlyUrls[0] : bitlyUrls[1],
				urlParams = urlUtils.urlToObject(url).query || {},
				targetUrl = url,
				options;

			$.getJSON(
					bitlyUrl,
					{
						"format":"json",
						"apiKey":"R_14fc9f92e48f7c78c21db32bd01f7014",
						"login":"esristorymaps",
						"longUrl":targetUrl
					},
					function (response) {
						if (!response || !response || !response.data.url) {
							return;
						}
					}
			).complete(function (response) {
				options = 'text=' + encodeURIComponent($('#title').text()) +
						'&url=' + encodeURIComponent(response.responseJSON.data.url) +
						'&related=' + this.config.SHARING_RELATED +
						'&hashtags=' + this.config.SHARING_HASHTAG;
				window.open('https://twitter.com/intent/tweet?' + options, 'Tweet', 'toolbar=0,status=0,width=626,height=436');
			});
			//window.open('https://twitter.com/intent/tweet?' + options, 'Tweet', 'toolbar=0,status=0,width=626,height=436');
		},

		_setSharingUrl: function (_self) {
			var mapClickX,
				mapClickY,
				timelineDateRange = "",
				minDate = "",
				maxDate = "",
				objectIDs = "",
				downloadIDs = "",
				filters = "";
			if (!_self.mapUtils.currentMapClickPoint) {
				// User is sharing the app but never even clicked on the map
				// Leave these params empty
				mapClickX = "";
				mapClickY = "";
			} else {
				mapClickX = _self.mapUtils.currentMapClickPoint.x;
				mapClickY = _self.mapUtils.currentMapClickPoint.y;
			}

			var lat = _self.map.extent.getCenter().getLatitude();
			var lng = _self.map.extent.getCenter().getLongitude();
			var zoomLevel = _self.map.getLevel();

			if (_self.timelineUtils.timeline) {
				timelineDateRange = _self.timelineUtils.timeline.getVisibleChartRange();
				minDate = new Date(timelineDateRange.start).getFullYear();
				maxDate = new Date(timelineDateRange.end).getFullYear();
			}

			query(".dgrid-row", _self.gridUtils.grid.domNode).forEach(lang.hitch(_self, function (node) {
				var row = _self.gridUtils.grid.row(node);
				objectIDs += row.data.objID + "|";
				downloadIDs += row.data.downloadLink.split("=")[1] + "|";
			}));
			objectIDs = objectIDs.substr(0, objectIDs.length - 1);
			downloadIDs = downloadIDs.substr(0, downloadIDs.length - 1);

			array.forEach(_self.timelineUtils.filterSelection, function (filter) {
				filters += filter + "|";
			});
			filters = filters.substr(0, filters.length - 1);

			var protocol = window.location.protocol;
			var host = window.location.host;
			var pathName = window.location.pathname;
			var fileName = "";
			var pathArray = window.location.pathname.split("/");
			if (pathArray[pathArray.length - 1] !== "index.html") {
				fileName = "index.html";
			} else {
				fileName = "";
			}

			this.sharingUrl = protocol + "//" + host + pathName + fileName +
					"?lat=" + lat + "&lng=" + lng + "&zl=" + zoomLevel +
					"&minDate=" + minDate + "&maxDate=" + maxDate +
					"&oids=" + objectIDs +
					"&dlids=" + downloadIDs +
					"&f=" + filters +
					"&clickLat=" + mapClickX +
					"&clickLng=" + mapClickY;
			return this.sharingUrl;
		}
	});
});
