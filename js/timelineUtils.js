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
	"dijit/registry",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/fx",
	"dojo/_base/lang",
	"dojo/Deferred",
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/dom-geometry",
	"dojo/dom-style",
	"dojo/mouse",
	"dojo/number",
	"dojo/query",
	"dojo/topic",
	"esri/Color",
	"esri/graphic",
	"esri/geometry/Extent",
	"esri/SpatialReference",
	"esri/layers/ArcGISImageServiceLayer",
	"esri/layers/ImageServiceParameters",
	"esri/layers/MosaicRule",
	"esri/tasks/query",
	"esri/tasks/QueryTask"
], function (registry, array, declare, fx, lang, Deferred, dom, domAttr, domConstruct, domGeom, domStyle, mouse, number, query, topic, Color, Graphic, Extent, SpatialReference, ArcGISImageServiceLayer, ImageServiceParameters, MosaicRule, Query, QueryTask) {
	return declare(null, {

		config:{},
		_main:{},

		timeline:"",
		timelineOptions:{},
		timelineContainerNode:{},
		timelineContainerNodeGeom:"",
		timelineContainerGeometry:"",
		timelineData:[],
		filterSelection:[],
		filter:[],
		filteredData:"",
		token:"",
		credentials:"",

		constructor:function (obj, templateConfig) {
			// config file
			this.config = templateConfig;
			this._main = obj;
			// timeline options
			this.timelineOptions = {
				"width":"100%",
				"height":this.config.TIMELINE_HEIGHT + "px",
				"style":this.config.TIMELINE_STYLE,
				"showNavigation":this.config.TIMELINE_SHOW_NAVIGATION,
				"max":new Date(this.config.TIMELINE_MAX_DATE, 0, 0),
				"min":new Date(this.config.TIMELINE_MIN_DATE, 0, 0),
				"scale":this.getTimelineScale(this.config.TIMELINE_SCALE),
				"step":this.config.TIMELINE_STEP,
				"stackEvents":true,
				"zoomMax":this.config.TIMELINE_ZOOM_MAX,
				"zoomMin":this.config.TIMELINE_ZOOM_MIN,
				"cluster":this.config.TIMELINE_CLUSTER,
				"animate":this.config.TIMELINE_ANIMATE,
				"customStackOrder":this._stackOrder
			};

			this.timelineContainerNode = dom.byId("timeline-container");

			if (esri.id.credentials.length > 0) {
				this.token = esri.id.credentials[0].token;
				this.credentials = esri.id.credentials[0];
			} else {
				this.token = "";
				this.credentials = "";
			}
		},

		_stackOrder:function (a, b) {
			var aValue = parseInt(a.content.split('data-scale="')[1].split('"')[0]),
					bValue = parseInt(b.content.split('data-scale="')[1].split('"')[0]);
			if (aValue > bValue) {
				return aValue;
			}
		},

		runQuery:function (mapExtent, mp) {
			var qt = new QueryTask(this.config.QUERY_TASK_URL);
			var q = new Query();
			q.returnGeometry = true;
			q.outFields = this.config.QUERY_TASK_OUTFIELDS;
			q.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;

			if (this.config.QUERY_WHERE !== "") {
				q.where = this.config.QUERY_WHERE;
			}

			if (this.config.QUERY_GEOMETRY === "MAP_POINT") {
				q.geometry = mp;
			} else {
				q.geometry = mapExtent.expand(this.config.EXTENT_EXPAND);
			}

			qt.execute(q).addCallback(lang.hitch(this, function (response) {
				this.timelineData = [];
				var nFeatures = response.features.length;

				if (nFeatures > 0) {
					// remove mask if present
					this._removeMask(".timeline-mask");
					// expand height of timeline parent container
					this._main.userInterfaceUtils.updateTimelineContainerHeight();

					array.forEach(response.features, lang.hitch(this, function (feature) {
						var ext = feature.geometry.getExtent(),
								xmin = ext.xmin,
								xmax = ext.xmax,
								ymin = ext.ymin,
								ymax = ext.ymax,

								objID = feature.attributes[this.config.ATTRIBUTE_OBJECTID],
								mapName = feature.attributes[this.config.ATTRIBUTE_MAP_NAME],
								scale = feature.attributes[this.config.ATTRIBUTE_SCALE],
								dateCurrent = new Date(feature.attributes[this.config.ATTRIBUTE_DATE]),
								downloadLink = feature.attributes[this.config.ATTRIBUTE_DOWNLOAD_LINK],
								citation = feature.attributes[this.config.ATTRIBUTE_CITATION],
								day = this.formatDay(dateCurrent),
								month = this.formatMonth(dateCurrent),
								year = this.formatYear(dateCurrent),
								formattedDate = month + "/" + day + "/" + year,
								startDate;

						if (dateCurrent === undefined || dateCurrent === null || dateCurrent === "") {
							dateCurrent = this.config.MSG_UNKNOWN;
						}

						if (citation === undefined) {
							citation = this.config.ATTRIBUTE_CITATION;
						}

						if (downloadLink === undefined) {
							downloadLink = this.config.ATTRIBUTE_DOWNLOAD_LINK;
						}

						// TODO What's up with this check?
						if (this.config.TIMELINE_SCALE === "year") {
							startDate = new Date(dateCurrent, month, day);
						} else {
							startDate = new Date(dateCurrent);
						}

						var className = this._main.timelineLegendUtils.setClassname(scale, this.config.TIMELINE_LEGEND_VALUES, this._main.timelineLegendUtils.nScales, this._main.timelineLegendUtils.minScaleValue, this._main.timelineLegendUtils.maxScaleValue);
						var lodThreshold = this._main.timelineLegendUtils.setLodThreshold(scale, this.config.TIMELINE_LEGEND_VALUES, this._main.timelineLegendUtils.nScales, this._main.timelineLegendUtils.minScaleValue, this._main.timelineLegendUtils.maxScaleValue);

						var tooltipContent = "<img class='tooltipThumbnail' src='" + this.setThumbnailUrl(this.token, objID) + "'>" +
								"<div class='tooltipContainer'>" +
								"<div class='tooltipHeader'>" + mapName + " (" + formattedDate + ")</div>" +
								"<div class='tooltipContent'>" + citation + "</div></div>";

						var timelineItemContent = '<div data-scale="' + scale + '" class="timelineItemTooltip noThumbnail" title="' + tooltipContent + '" data-xmin="' + xmin + '" data-ymin="' + ymin + '" data-xmax="' + xmax + '" data-ymax="' + ymax + '">' +
								'<span class="thumbnailLabel">' + mapName + '</span>';

						this.timelineData.push({
							"start":startDate,
							"content":timelineItemContent,
							"objID":objID,
							"downloadLink":downloadLink,
							"scale":scale,
							"lodThreshold":lodThreshold,
							"citation":citation,
							"className":className
						});
					})); // END forEach
				} else {
					// no results returned from the query, add a mask over the timeline to notify user
					this._main.userInterfaceUtils.addNoResultsMask();
				} // END QUERY
				this.drawTimeline(this.timelineData);
			})); // END Deferred
		},

		drawTimeline:function (data) {
			this.filteredData = this._filterData(data, this.filter);
			topic.subscribe("/dnd/drop", lang.hitch(this, function (source, nodes, copy, target) {
				var layers = [];
				query(".dgrid-row").forEach(lang.hitch(this, function (node) {
					var row = target.grid.row(node),
							lodThreshold,
							maskId;
					if (row) {
						layers.push(row.data.layer);
						this._main.map.removeLayer(row.data.layer);
						lodThreshold = row.data.lodThreshold;
						maskId = domAttr.get(node, "id") + "-mask";
						if (this._main.currentLOD <= lodThreshold) {
							// disable row
							if (dom.byId(maskId) === null) {
								this._main.userInterfaceUtils.addThumbnailMask(maskId, node);
							}
						} else {
							// enable row
							domConstruct.destroy(maskId);
						}
					}
				}));

				var j = layers.length;
				while (j >= 0) {
					this._main.map.addLayer(layers[j]);
					j--;
				}
			}));

			if (this.timeline === undefined || this.timeline === null || this.timeline === "") {
				if (this._main.sharingUtils.urlQueryObject) {
					this.timelineOptions.start = new Date(this._main.sharingUtils.urlQueryObject.minDate, 0, 0);
					this.timelineOptions.end = new Date(this._main.sharingUtils.urlQueryObject.maxDate, 0, 0);
				}

				this.timeline = new links.Timeline(dom.byId("timeline"));
				this.timeline.draw(this.filteredData, this.timelineOptions);
				links.events.addListener(this.timeline, "ready", lang.hitch(this, "_onTimelineReady"));
				links.events.addListener(this.timeline, "select", lang.hitch(this, "_onSelect"));
				this._main.userInterfaceUtils.hideStep(".step-one", "");
				this._main.userInterfaceUtils.showStep(".step-two", ".step-two-message");
			} else {
				var height = this.timelineContainerGeometry ? this.timelineContainerGeometry.h : this.config.TIMELINE_HEIGHT;
				//this.timelineOptions.height = height + "px";
				//this.timeline.draw(this.filteredData, this.timelineOptions);
				this.timeline.setData(this.filteredData);
				this.timeline.redraw();
			}

			$(".timelineItemTooltip").tooltipster({
				theme:"tooltipster-shadow",
				contentAsHTML:true,
				position:"right",
				offsetY:20
			});


			query(".timeline-event").on(mouse.enter, lang.hitch(this, function (evt) {
				var xmin, ymin, xmax, ymax, extent, sfs;
				if (evt.target.children[0] !== undefined && evt.target.children[0].children[0] !== undefined) {
					if (evt.target.children[0].children[0].getAttribute("data-xmin")) {
						xmin = evt.target.children[0].children[0].getAttribute("data-xmin");
						xmax = evt.target.children[0].children[0].getAttribute("data-xmax");
						ymin = evt.target.children[0].children[0].getAttribute("data-ymin");
						ymax = evt.target.children[0].children[0].getAttribute("data-ymax");
						extent = new Extent(xmin, ymin, xmax, ymax, new SpatialReference({
							wkid:102100
						}));
						sfs = this._main.userInterfaceUtils.createMouseOverGraphic(
								new Color(this.config.TIMELINE_ITEM_MOUSEOVER_GR_BORDER),
								new Color(this.config.TIMELINE_ITEM_MOUSEOVER_GR_FILL));
						this._main.gridUtils.mouseOverGraphic = new Graphic(extent, sfs);
						this._main.map.graphics.add(this._main.gridUtils.mouseOverGraphic);
					}
					// TODO
					var data = evt.currentTarget.childNodes[0].childNodes[0].dataset;
					if (data) {
						extent = new Extent(data.xmin, data.ymin, data.xmax, data.ymax, new SpatialReference({
							wkid:102100
						}));
						sfs = this._main.userInterfaceUtils.createMouseOverGraphic(
								new Color(this.config.TIMELINE_ITEM_MOUSEOVER_GR_BORDER),
								new Color(this.config.TIMELINE_ITEM_MOUSEOVER_GR_FILL));
						this._main.gridUtils.mouseOverGraphic = new Graphic(extent, sfs);
						this._main.map.graphics.add(this._main.gridUtils.mouseOverGraphic);
					}
				}
			}));

			query(".timeline-event").on(mouse.leave, lang.hitch(this, function (evt) {
				this._main.map.graphics.remove(this._main.gridUtils.mouseOverGraphic);
				this._main.map.graphics.clear();
				this._main.userInterfaceUtils.addCrosshair(this._main.mapUtils.currentMapClickPoint);
			}));
		},

		_onSelect:function () {
			var _sel = this.timeline.getSelection(),
					_timelineData = this.timeline.getData();
			if (_sel.length) {
				if (_sel[0].row !== undefined) {
					var row = _sel[0].row,
							objID = _timelineData[row].objID,
							downloadLink = _timelineData[row].downloadLink,
							lodThreshhold = _timelineData[row].lodThreshold,
							citation = _timelineData[row].citation,
							whereClause = this.config.IMAGE_SERVER_WHERE + objID,
							qt = new QueryTask(this.config.IMAGE_SERVER),
							q = new Query();
					q.returnGeometry = false;
					q.outFields = this.config.OUTFIELDS;
					q.where = whereClause;
					qt.execute(q, lang.hitch(this, function (rs) {
						var extent = rs.features[0].geometry.getExtent(),
								mapName = rs.features[0].attributes[this.config.ATTRIBUTE_MAP_NAME],
								dateCurrent = rs.features[0].attributes.DateCurrent,
								scale = rs.features[0].attributes[this.config.ATTRIBUTE_SCALE],
								scaleLabel = number.format(scale, {
									places:0
								});

						if (dateCurrent === null) {
							dateCurrent = this.config.MSG_UNKNOWN;
						}

						var mosaicRule = new MosaicRule({
							"method":MosaicRule.METHOD_CENTER,
							"ascending":true,
							"operation":MosaicRule.OPERATION_FIRST,
							"where":whereClause
						});

						var params = new ImageServiceParameters();
						params.noData = 0;
						params.mosaicRule = mosaicRule;

						var imageServiceLayer = new ArcGISImageServiceLayer(this.config.IMAGE_SERVER, {
							imageServiceParameters:params,
							opacity:1.0
						});
						this._main.map.addLayer(imageServiceLayer);

						var _firstRow;
						if (query(".dgrid-row", this._main.gridUtils.grid.domNode)[0]) {
							var rowId = query(".dgrid-row", this._main.gridUtils.grid.domNode)[0].id;
							_firstRow = rowId.split("-")[2];
						}

						var firstRowObj = this._main.gridUtils.store.query({
							objID:_firstRow
						});

						this._main.gridUtils.store.put({
							id:1,
							objID:objID,
							layer:imageServiceLayer,
							name:mapName,
							imprintYear:dateCurrent,
							scale:scale,
							scaleLabel:scaleLabel,
							lodThreshold:lodThreshhold,
							downloadLink:downloadLink,
							citation:citation,
							extent:extent
						}), {
							before:firstRowObj[0]
						};
					})).then(lang.hitch(this, function (evt) {
						this._main.userInterfaceUtils.hideStep(".step-two", ".step-two-message");
						this._main.userInterfaceUtils.showStep(".step-three", ".step-three-message");
						this._main.userInterfaceUtils.showGrid();
						this._main.gridUtils.grid.refresh();
					}));
				}
			}
		},

		_onTimelineReady:function () {
			// if the grid is visible, step 3 is visible, so hide step 2
			if (domStyle.get(query(".gridContainer")[0], "display") === "block") {
				this._main.userInterfaceUtils.hideStep(".step-two", ".step-two-message");
			}
			query(".timeline-frame").style("height", "220px");
			query(".timeline-content").style("height", "220px");
		},

		_filterData:function (dataToFilter, f) {
			var _filteredData = [];
			var exclude = false;
			var nFilters = f.length;

			if (nFilters > 0) {
				array.forEach(dataToFilter, lang.hitch(this, function (item) {
					// loop through each filter
					for (var i = 0; i < nFilters; i++) {
						var _filterScale = number.parse(f[i]);
						var _mapScale = item.scale;
						var _pos = array.indexOf(this._main.timelineLegendUtils.mapScaleValues, _filterScale);
						var _lowerBoundScale;
						var _upperBoundScale;
						var current;

						if (_pos !== -1) {
							if (this.config.TIMELINE_LEGEND_VALUES[_pos + 1] !== undefined) {
								_lowerBoundScale = this.config.TIMELINE_LEGEND_VALUES[(_pos + 1)].value;
							} else {
								_lowerBoundScale = "";
							}

							if (this.config.TIMELINE_LEGEND_VALUES[_pos].value) {
								current = this.config.TIMELINE_LEGEND_VALUES[_pos].value;
							}

							if (this.config.TIMELINE_LEGEND_VALUES[(_pos - 1)] !== undefined) {
								_upperBoundScale = this.config.TIMELINE_LEGEND_VALUES[(_pos)].value;
							} else {
								_upperBoundScale = "";
							}
						}

						if (_lowerBoundScale === "") {
							if (_mapScale <= _filterScale) {
								exclude = true;
								break;
							}
						}

						if (_upperBoundScale === "") {
							if (_mapScale >= _filterScale) {
								exclude = true;
								break;
							}
						}

						if (_lowerBoundScale !== "" && _upperBoundScale !== "") {
							if (_mapScale > _lowerBoundScale && _mapScale <= _upperBoundScale) {
								exclude = true;
								break;
							}
						}
					}

					if (!exclude) {
						_filteredData.push(item);
					}
					exclude = false;
				}));
				return _filteredData;
			} else {
				return dataToFilter;
			}
		},

		_removeMask:function (node) {
			query(node).forEach(domConstruct.destroy);
		},

		formatDay:function (date) {
			if (date instanceof Date) {
				return date.getDate();
			} else {
				return "";
			}
		},

		formatMonth:function (date) {
			if (date instanceof Date) {
				var month = date.getMonth();
				if (month === 0) {
					return "01";
				} else if (month === 1) {
					return "02";
				} else if (month === 2) {
					return "03";
				} else if (month === 3) {
					return "04";
				} else if (month === 4) {
					return "05";
				} else if (month === 5) {
					return "06";
				} else if (month === 6) {
					return "07";
				} else if (month === 7) {
					return "08";
				} else if (month === 8) {
					return "09";
				} else if (month === 9) {
					return "10";
				} else if (month === 10) {
					return "11";
				} else if (month === 11) {
					return "12";
				}
			} else {
				return "";
			}
		},

		formatYear:function (date) {
			if (date instanceof Date) {
				return date.getFullYear();
			} else {
				return "";
			}
		},

		getTimelineScale:function (str) {
			if (str === "millisecond") {
				return links.Timeline.StepDate.SCALE.MILLISECOND;
			} else if (str === "second") {
				return links.Timeline.StepDate.SCALE.SECOND;
			} else if (str === "minute") {
				return links.Timeline.StepDate.SCALE.MINUTE;
			} else if (str === "hour") {
				return links.Timeline.StepDate.SCALE.HOUR;
			} else if (str === "weekday") {
				return links.Timeline.StepDate.SCALE.WEEKDAY;
			} else if (str === "day") {
				return links.Timeline.StepDate.SCALE.DAY;
			} else if (str === "month") {
				return links.Timeline.StepDate.SCALE.MONTH;
			} else if (str === "year") {
				return links.Timeline.StepDate.SCALE.YEAR;
			}
		},

		setThumbnailUrl:function (token, objID) {
			var thumbnailUrl;
			if (token !== "") {
				thumbnailUrl = this.config.IMAGE_SERVER + "/" + objID + this.config.INFO_THUMBNAIL + this.config.INFO_THUMBNAIL_TOKEN + token;
			} else {
				thumbnailUrl = this.config.IMAGE_SERVER + "/" + objID + this.config.INFO_THUMBNAIL;
			}
			console.debug(thumbnailUrl);
			return thumbnailUrl;
		}
	});
});
