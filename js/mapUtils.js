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
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/query"
], function (declare, lang, dom, domAttr, domConstruct, query) {
	return declare(null, {

		config: {},
		// Loading indicator
		_loading:"",
		currentLOD: 0,
		currentMapClickPoint:"",
		currentMapExtent:"",

		constructor: function (templateConfig) {
			this.config = templateConfig;
			this._loading = dom.byId("loadingImg");
		},

		/**
		 * Map click handler
		 *
		 * @param evt
		 */
		mapClickHandler: function (evt) {
			this.currentMapClickPoint = evt.mapPoint;
			this.currentLOD = this.map.getLevel();
			this.currentMapExtent = this.map.extent;
			this.userInterfaceUtils.addCrosshair(this.currentMapClickPoint);
			this.timelineUtils.runQuery(this.currentMapExtent, this.currentMapClickPoint);
		},

		/**
		 * Map extent change handler
		 *
		 * @param evt
		 */
		mapExtentChangeHandler: function (evt) {
			this.currentMapExtent = evt.extent;
			this.currentLOD = evt.lod.level;
			query(".dgrid-row").forEach(lang.hitch(this, function (node) {
				var row = this.gridUtils.grid.row(node),
					lodThreshold = row.data.lodThreshold,
					maskId = domAttr.get(node, "id") + "-mask";
				if (this.currentLOD <= lodThreshold) {
					// disable row
					if (dom.byId(maskId) === null) {
						this.userInterfaceUtils.addThumbnailMask(maskId, node);
					}
				} else {
					// enable row
					domConstruct.destroy(maskId);
				}
			}));
		},

		/**
		 * Update started handler
		 */
		updateStartHandler: function () {
			esri.show(this.mapUtils._loading);
			this.map.disableMapNavigation();
		},

		/**
		 * Updated ended handler
		 */
		updateEndHandler: function () {
			esri.hide(this.mapUtils._loading);
			this.map.enableMapNavigation();
		}
	});
});
