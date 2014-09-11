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
	"dijit/form/HorizontalSlider",
	"dgrid/editor",
	"dgrid/extensions/DnD",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/Keyboard",
	"dgrid/util/mouse",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/query",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"esri/Color",
	"esri/graphic",
	"esri/kernel",
	"esri/request"
], function (HorizontalSlider, editor, DnD, OnDemandGrid, Selection, Keyboard, mouseUtil, array, declare, lang, win, dom, domConstruct, on, query, Memory, Observable, Color, Graphic, kernel, esriRequest) {
	return declare(null, {

		config:{},
		_main:{},

		store:{},
		storeData:[],
		grid:{},
		mouseOverGraphic:{},

		constructor:function (obj, templateConfig) {
			this.config = templateConfig;
			this._main = obj;

			var columns = [
				{
					label:" ",
					field:"objID",
					hidden:true
				},
				{
					label:" ",
					field:"name",
					renderCell:lang.hitch(this, this._thumbnailRenderCell)
				},
				editor({
					label:" ",
					field:"transparency",
					editorArgs:{
						value:0,
						minimum:0,
						maximum:1.0,
						intermediateChanges:true
					}
				}, HorizontalSlider)
			];

			this.grid = new (declare([OnDemandGrid, Selection, DnD, Keyboard]))({
				store:this.store = this._createOrderedStore(this.storeData, {
					idProperty:"objID"
				}),
				idProperty:"objID",
				columns:columns,
				showHeader:false,
				selectionMode:"single",
				dndParams:{
					singular:true
				},
				getObjectDndType:function (item) {
					return [item.type ? item.type : this.dndSourceType];
				}
			}, "grid");

			this.grid.on("dgrid-datachange", this._gridDataChangeHandler);
			this.grid.on("dgrid-refresh-complete", lang.hitch(this, this._gridRefreshHandler));
			this.grid.on(mouseUtil.enterCell, lang.hitch(this, this._gridEnterCellHandler));
			this.grid.on(mouseUtil.leaveCell, lang.hitch(this, this._gridLeaveCellHandler));
		},

		/**
		 * Fires any time a refresh call completes successfully.
		 *
		 * @param evt
		 */
		_gridRefreshHandler:function (evt) {
			array.forEach(evt.grid.store.data, lang.hitch(this, function (node) {
				var row = evt.grid.row(node),
						lodThreshold = row.data.lodThreshold,
						maskId = "grid-row-" + row.data.objID + "-mask";
				if (this._main.currentLOD <= lodThreshold) {
					this._main.userInterfaceUtils.addThumbnailMask(maskId, row.element);
				}
			}));
		},

		/**
		 * Editor module when an editor field loses focus after being changed (handle HSlider changes)
		 *
		 * @param evt
		 */
		_gridDataChangeHandler:function (evt) {
			var diff = 1 - evt.value;
			evt.cell.row.data.layer.setOpacity(diff);
		},

		/**
		 * Fires when the mouse moves into a cell within the body of a grid.
		 *
		 * @param evt
		 */
		_gridEnterCellHandler:function (evt) {
			if (this.mouseOverGraphic) {
				this._main.map.graphics.remove(this.mouseOverGraphic);
			}
			var row = this.grid.row(evt),
					extent = row.data.extent,
					sfs = this._main.userInterfaceUtils.createMouseOverGraphic(
							new Color(this.config.SIDEBAR_MAP_MOUSEOVER_GR_BORDER),
							new Color(this.config.SIDEBAR_MAP_MOUSEOVER_GR_FILL));
			this.mouseOverGraphic = new Graphic(extent, sfs);
			this._main.map.graphics.add(this.mouseOverGraphic);
		},

		/**
		 * Fires when the mouse moves out of a cell within the body of a grid.
		 * Remove any mouseover/out graphics and redraw the crosshair
		 *
		 * @param evt
		 */
		_gridLeaveCellHandler:function (evt) {
			this._main.map.graphics.remove(this.mouseOverGraphic);
			this._main.map.graphics.clear();
			this._main.userInterfaceUtils.addCrosshair(this._main.mapUtils.currentMapClickPoint);
		},

		/**
		 * Handle selections on the rows
		 *
		 * @param object
		 * @param data
		 * @param td
		 * @param options
		 * @return {*}
		 */
		_thumbnailRenderCell:function (object, data, td, options) {
			var saveAsString = "";
			if (this._main.timelineUtils.credentials.userId !== undefined)
					saveAsString = "<div class='downloadLink saveAsItem' data-objectid='" + objID + "'>" + this.config.SAVE_AS_TEXT + "</div>";

			var objID = object.objID,
					mapName = object.name,
					imprintYear = object.imprintYear,
					downloadLink = object.downloadLink,
					citation = object.citation,
					imgSrc = this._main.timelineUtils.setThumbnailUrl(this._main.timelineUtils.token, object.objID),

					node = domConstruct.create("div", {
						"class":"renderedCell",
						"innerHTML":"<button class='rm-layer-btn' data-objectid='" + objID + "'> X </button>" +
								"<img class='rm-layer-icon' src='" + imgSrc + "'>" +
								"<div class='thumbnailMapName'>" + mapName + "</div>" +
								"<div class='thumbnailMapImprintYear'>" + imprintYear + "</div>" +
								"<div class='downloadLink'><a href='" + downloadLink + "' target='_parent'>" + this.config.DOWNLOAD_MAP_LABEL + "</a></div>" +
								saveAsString,
						"onclick":lang.hitch(this, function (evt) {
							var objID = evt.target.getAttribute("data-objectid"),
									storeObj = this.store.query({
										objID:objID
									});

							if (evt.target.getAttribute("class") === "thumbnailMapName") {
								domConstruct.create("div", {
									"id":"grid-item-tooltip",
									"style":{
										left:205 + "px",
										top:evt.clientY + "px"
									},
									"innerHTML":"<button class='rm-tooltip-btn'> X </button>" + citation,
									"onclick":lang.hitch(this, function (evt) {
										if (evt.target.getAttribute("class")) {
											domConstruct.destroy("grid-item-tooltip");
										}
									})
								}, win.body(), "first");
							}

							// save selected map as an item in AGOL
							if (evt.target.getAttribute("class") === "downloadLink saveAsItem") {
								var yr = "";
									if (imprintYear === undefined) {
										yr = "";
									} else {
										yr = imprintYear;
									}
								if (this._main.timelineUtils.credentials.userId !== "") {
									//var _url = this.config.IMAGE_SERVER.replace("", "");
									esriRequest({
												url:"http://www.arcgis.com/sharing/rest/content/users/" + this._main.timelineUtils.credentials.userId + "/addItem",
												content:{
													f:"json",
													url:this.config.IMAGE_SERVER,
													title:mapName + " " + yr,
													type:"Image Service",
													text:JSON.stringify({
														"format":"jpgpng",
														"compressionQuality":75,
														"layerDefinition":{
															"definitionExpression":"OBJECTID = " + objID
														}
													})
												}
											}, {
												usePost:true
											}
									).then(function (response) {
												console.log(response);
											});
								}
							} else {

								if (storeObj[0] !== undefined) {
									// remove the layer
									this._main.map.removeLayer(storeObj[0].layer);
									// update the store
									this.store.remove(parseInt(objID));
									// update the UI
									if (this.store.data.length < 1) {
										// no remaining items in the grid/store
										this._main.map.graphics.remove(this.mouseOverGraphic);
										this._main.map.graphics.clear();
										this._main.userInterfaceUtils.addCrosshair(this._main.mapUtils.currentMapClickPoint);
										this._main.userInterfaceUtils.showStep(".step-two", ".step-two-message");
										this._main.userInterfaceUtils.hideStep(".step-three", ".step-three-message");
									}
								}
							}
						})
					});
			return node;
		},

		// dojo src
		_createOrderedStore:function (data, options) {
			var opts = options;
			// Instantiate a Memory store modified to support ordering.
			return Observable(new Memory(lang.mixin({
				data:data,
				idProperty:"id",
				put:lang.hitch(this, function (object, opts) {
					var storeRef = this.store;
					var _calc = lang.hitch(this, function () {
						return this._calculateOrder(storeRef, object, opts && opts.before);
					});
					object.id = _calc();
					return Memory.prototype.put.call(storeRef, object, opts);
				}),
				// Memory's add does not need to be augmented since it calls put
				copy:function (object, options) {
					// summary:
					//		Given an item already in the store, creates a copy of it.
					//		(i.e., shallow-clones the item sans id, then calls add)
					var k, obj = {}, id, idprop = this.idProperty, i = 0;
					for (k in object) {
						obj[k] = object[k];
					}
					// Ensure unique ID.
					// NOTE: this works for this example (where id's are strings);
					// Memory should autogenerate random numeric IDs, but
					// something seems to be falling through the cracks currently...
					id = object[idprop];
					if (id in this.index) {
						// rev id
						while (this.index[id + "(" + (++i) + ")"]) {
						}
						obj[idprop] = id + "(" + i + ")";
					}
					this.add(obj, options);
				},
				query:function (query, options) {
					options = options || {};
					options.sort = [
						{
							attribute:"id"
						}
					];
					return Memory.prototype.query.call(this, query, options);
				}
			}, options)));
		},

		// dojo src
		_calculateOrder:function (store, object, before, orderField) {
			// Calculates proper value of order for an item to be placed before another
			var afterOrder,
					beforeOrder = 0;
			if (!orderField) {
				orderField = "id";
			}

			if (store.data.length > 0) {
				// calculate midpoint between two items' orders to fit this one
				// afterOrder = before[orderField];
				var tmp = store.query({
					"objID":query(".dgrid-row", this.grid.domNode)[0].id.split("-")[2]
				});
				afterOrder = tmp[0].id;
				//afterOrder = store.data[store.data.length - 1].id;
				store.query({}, {}).forEach(function (obj) {
					//var ord = obj[orderField];
					var ord = obj.id;
					if (ord > beforeOrder && ord < afterOrder) {
						beforeOrder = ord;
					}
				});
				return (afterOrder + beforeOrder) / 2;
			} else {
				// find maximum order and place this one after it
				afterOrder = 0;
				store.query({}, {}).forEach(function (object) {
					var ord = object[orderField];
					if (ord > afterOrder) {
						afterOrder = ord;
					}
				});
				return afterOrder + 1;
			}
		}
	});
});
