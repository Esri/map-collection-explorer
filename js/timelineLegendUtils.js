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
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/mouse",
	"dojo/number",
	"dojo/on",
	"dojo/query"
], function (declare, lang, dom, domAttr, domClass, domConstruct, domStyle, mouse, number, on, query) {
	return declare(null, {

		// configuration
		config:{},

		// scale values
		mapScaleValues:[],
		// number of scales in the timeline legend
		nScales:0,
		// maximum scale value
		maxScaleValue:0,
		// minimum scale value
		minScaleValue:0,

		constructor: function (templateConfig) {
			this.config = templateConfig;
			for (var i = 0; i < this.config.TIMELINE_LEGEND_VALUES.length; i++) {
				this.mapScaleValues.push(this.config.TIMELINE_LEGEND_VALUES[i].value);
			}

			this.nScales = this.getNumberOfScales(this.config.TIMELINE_LEGEND_VALUES);
			this.maxScaleValue = this.getMaxScaleValue(this.config.TIMELINE_LEGEND_VALUES);
			this.minScaleValue = this.getMinScaleValue(this.config.TIMELINE_LEGEND_VALUES);
		},

		/**
		 * Get the number of scales (legend items)
		 *
		 * @param scales
		 * @return {*}
		 */
		getNumberOfScales: function (scales) {
			return scales.length - 1;
		},

		/**
		 * Minimum scale value
		 *
		 * @param scales
		 * @return {*|String|String|String|String|String|String|String|Number|String}
		 */
		getMinScaleValue: function (scales) {
			var numScales = this.getNumberOfScales(scales);
			return scales[numScales].value;
		},

		/**
		 * Maximum scale value
		 *
		 * @param scales
		 * @return {*|String|String|String|String|String|String|String|Number|String}
		 */
		getMaxScaleValue: function (scales) {
			return scales[0].value;
		},

		/**
		 * Set the classname
		 *
		 * @param currentScale
		 * @param scales
		 * @return {*}
		 */
		setClassname: function (currentScale, scales, numScales, minScaleValue, maxScaleValue) {
			var className;
			var i = numScales;
			while (i > 0) {
				//console.log("currentScale: " + currentScale + "\t\tminScaleValue: " + minScaleValue + "\t\tmaxScaleValue: " + maxScaleValue);
				if (currentScale <= minScaleValue) {
					className = scales[scales.length - 1].className;
					break;
				}

				if (currentScale > scales[i].value && currentScale <= scales[i - 1].value) {
					className = scales[i - 1].className;
					break;
				}

				if (currentScale > maxScaleValue) {
					className = scales[0].className;
					break;
				}
				i--;
			}

			if (numScales === 0) {
				className = scales[0].className;
			}
			return className;
		},

		setLodThreshold: function (currentScale, scales, numScales, minScaleValue, maxScaleValue) {
			var lodThreshold,
				i = numScales;
			while (i >= 0) {
				if (currentScale <= minScaleValue) {
					lodThreshold = scales[scales.length - 1].lodThreshold;
					break;
				}

				if (currentScale > scales[i].value && currentScale <= scales[i - 1].value) {
					lodThreshold = scales[i - 1].lodThreshold;
					break;
				}

				if (currentScale > maxScaleValue) {
					lodThreshold = scales[0].lodThreshold;
					break;
				}
				i--;
			}
			return lodThreshold;
		},

		buildLegend: function (legendItem) {
			var node = domConstruct.toDom('<label data-scale="' + legendItem.value + '" data-placement="right" class="btn toggle-scale active" style="background-color: ' + legendItem.color + '">' +
					'<input type="checkbox" name="options"><span data-scale="' + legendItem.value + '">' + legendItem.label + '</span>' +
					'</label>');

			if (this.sharingUtils.urlQueryObject) {
				var tmpFilters = this.sharingUtils.urlQueryObject.f.split("|"),
					num = number.format(legendItem.value, {
						places: 0,
						pattern: "#"
					}),
					i = tmpFilters.indexOf(num);
				if (tmpFilters[i] !== undefined) {
					domClass.toggle(node, "sel");
					domStyle.set(node, "opacity", "0.3");
					this.filter.push(tmpFilters[i]);
				}
			}

			on(node, "click", lang.hitch(this, function (evt) {
				var selectedScale = evt.target.getAttribute("data-scale"),
					selectedScaleIndex = this.timelineUtils.filter.indexOf(selectedScale);

				domClass.toggle(node, "sel");

				if (domClass.contains(node, "sel")) {
					if (selectedScaleIndex === -1) {
						this.timelineUtils.filter.push(selectedScale);
					}
					domStyle.set(node, "opacity", "0.3");
					this.timelineUtils.filterSelection.push(selectedScale);
				} else {
					if (selectedScaleIndex !== -1) {
						this.timelineUtils.filter.splice(selectedScaleIndex, 1);
					}
					domStyle.set(node, "opacity", "1.0");
					var i = this.timelineUtils.filterSelection.indexOf(selectedScale);
					if (i !== -1) {
						this.timelineUtils.filterSelection.splice(i, 1);
					}
				}
				this.timelineUtils.drawTimeline(this.timelineUtils.timelineData);
			}));

			on(node, mouse.enter, function (evt) {
				//console.log(evt);
			});

			domConstruct.place(node, query(".topo-legend")[0]);
		}
	});
});
