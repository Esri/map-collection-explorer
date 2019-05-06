/*
 | Copyright 2019 Esri
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
require([
        "dojo/_base/window",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/fx",
        "dojo/_base/lang",
        "dojo/Deferred",
        "dojo/aspect",
        "dojo/dom",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/io-query",
        "dojo/json",
        "dojo/mouse",
        "dojo/number",
        "dojo/on",
        "dojo/parser",
        "dojo/promise/all",
        "dojo/query",
        "dojo/ready",
        "dojo/topic",
        "dojo/store/Observable",
        "dojo/store/Memory",
        "dgrid/extensions/DnD",
        "dgrid/OnDemandGrid",
        "dgrid/editor",
        "dgrid/Selection",
        "dgrid/Keyboard",
        "dgrid/util/mouse",
        "dijit/form/Button",
        "dijit/form/HorizontalSlider",
        "dijit/layout/BorderContainer",
        "dijit/layout/ContentPane",
        "dijit/registry",

        "esri/arcgis/OAuthInfo",
        "esri/arcgis/Portal",
        "esri/arcgis/utils",
        "esri/dijit/Geocoder",
        "esri/geometry/Extent",
        "esri/geometry/Point",
        "esri/geometry/webMercatorUtils",
        "esri/IdentityManager",
        "esri/SpatialReference",
        "esri/graphic",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/layers/ArcGISImageServiceLayer",
        "esri/layers/ImageServiceParameters",
        "esri/layers/MosaicRule",
        "esri/map",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/Color",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/urlUtils",
        "esri/request",
        "esri/lang",

        "dojo/domReady!"],
    function (win, array, declare, fx, lang,
              Deferred, aspect, dom, domAttr, domClass, domConstruct, domGeom, domStyle, ioQuery, json, mouse, number, on, parser, all, query, ready, topic, Observable, Memory,
              DnD, Grid, editor, Selection, Keyboard, mouseUtil, Button, HorizontalSlider, BorderContainer, ContentPane, registry,
              OAuthInfo, arcgisPortal, arcgisUtils, Geocoder, Extent, Point, webMercatorUtils, esriId, SpatialReference, Graphic, ArcGISDynamicMapServiceLayer,
              ArcGISImageServiceLayer, ImageServiceParameters, MosaicRule, Map, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color,
              Query, QueryTask, urlUtils, esriRequest, esriLang) {

        var map,
            imageServiceLayer,

            // dgrid store
            store,
            storeData = [],

            // dgrid
            grid,
            mouseOverGraphic,

            // timeline data and filters
            timeline,
            timelineOptions,
            timelineData = [],
            filter = [],
            TOPO_MAP_SCALES,

            //urlObject,
            urlQueryObject,

            // timeline container dimensions
            timelineContainerGeometry,

            filterSelection = [],

            crosshairGraphic,

            timelineContainerNodeGeom,

            currentLOD,
            currentMapExtent,
            currentMapClickPoint,

            nScales = 0,
            maxScaleValue = 0,
            minScaleValue = 0,

            portal = null,
            credential = null;

        ready(function () {
            parser.parse();
            // initialize Calcite
            calcite.init();
            // load application config-defined styles
            loadAppStyles();
            // set timeline scale values
            TOPO_MAP_SCALES = Config.TIMELINE_LEGEND_VALUES;
            nScales = getNumberOfScales(TOPO_MAP_SCALES);
            maxScaleValue = getMaxScaleValue(TOPO_MAP_SCALES);
            minScaleValue = getMinScaleValue(TOPO_MAP_SCALES);
            //
            checkSignIn().then(function (response) {
                var signInEle = query(".sign-in-message")[0];
                var saveMapsEle = query(".save-maps-message")[0];
                if (response.message === Config.USER_NOT_SIGNED_IN) {
                    portal = response;
                    calcite.removeClass(signInEle, "hide");
                    calcite.addClass(saveMapsEle, "hide");
                } else {
                    portal = new arcgisPortal.Portal(Config.SHARING_HOST).signIn().then(function (portalUser) {
                        portal = portalUser.portal;
                        credential = portalUser.credential;
                        calcite.addClass(signInEle, "hide");
                        calcite.removeClass(saveMapsEle, "hide");
                        calcite.removeClass(query(".sign-out-btn")[0], "hide");
                        getUserProfile(credential);
                    });
                }
            });

            urlQueryObject = getUrlParameters();
            initBaseMap(urlQueryObject);
            initGeocoderDijit("geocoder");

            on(map, "load", mapLoadedHandler);
            on(map, "click", mapClickHandler);
            on(map, "extent-change", extentChangeHandler);
            on(map, "update-start", showLoadingIndicator);
            on(map, "update-end", hideLoadingIndicator);
            //
            on(query(".sign-in-btn")[0], "click", saveMapsHandler);
            on(query(".save-maps-btn")[0], "click", saveMapsHandler);
            on(query(".sign-out-btn")[0], "click", signOutBtnClickHandler);
            on(query(".reset-btn")[0], "click", resetApplicationClickHandler);
            on(query(".share_facebook")[0], "click", shareFacebook);
            on(query(".share_twitter")[0], "click", shareTwitter);
            on(query(".share_bitly")[0], "click", shareBitly);
            on(query(".copy-btn")[0], "click", copyInput);
            on(query(".about-modal")[0], "click", aboutApplication);
            on(document, "click", documentClickHandler);

            var columns = [
                {
                    label: " ",
                    field: "objID",
                    hidden: true
                },
                {
                    label: " ",
                    field: "name",
                    renderCell: thumbnailRenderCell
                },
                editor({
                    label: " ",
                    field: "transparency",
                    editorArgs: {
                        value: 0,
                        minimum: 0,
                        maximum: 1.0,
                        intermediateChanges: true
                    }
                }, HorizontalSlider)
            ];

            grid = new (declare([Grid, Selection, DnD, Keyboard]))({
                store: store = createOrderedStore(storeData, {
                    idProperty: "objID"
                }),
                columns: columns,
                showHeader: false,
                selectionMode: "single",
                dndParams: {
                    singular: true
                },
                getObjectDndType: function (item) {
                    return [item.type ? item.type : this.dndSourceType];
                }
            }, "grid");

            grid.on("dgrid-datachange", gridDataChangeHandler);
            grid.on("dgrid-refresh-complete", gridRefreshHandler);
            grid.on(mouseUtil.enterCell, gridEnterCellHandler);
            grid.on(mouseUtil.leaveCell, gridLeaveCellHandler);

            // timeline options
            timelineOptions = {
                "width": "100%",
                "height": Config.TIMELINE_HEIGHT + "px",
                "style": Config.TIMELINE_STYLE,
                "showNavigation": Config.TIMELINE_SHOW_NAVIGATION,
                "max": new Date(Config.TIMELINE_MAX_DATE, 0, 0),
                "min": new Date(Config.TIMELINE_MIN_DATE, 0, 0),
                "scale": links.Timeline.StepDate.SCALE.YEAR,
                "step": Config.TIMELINE_STEP,
                "stackEvents": true,
                "zoomMax": Config.TIMELINE_ZOOM_MAX,
                "zoomMin": Config.TIMELINE_ZOOM_MIN,
                "cluster": Config.TIMELINE_CLUSTER,
                "animate": Config.TIMELINE_ANIMATE
            };

            array.forEach(Config.TIMELINE_LEGEND_VALUES, buildLegend);

            watchSplitters(registry.byId("main-window"));
        });

        function saveMapsHandler(evt) {
            if (portal.message === Config.USER_NOT_SIGNED_IN) {
                // user is not signed in
                var deployRoot = getDeployRoot(window.location.host);
                esriId.getCredential("https://" + deployRoot + ".arcgis.com", {
                    oAuthPopupConfirmation: false
                }).then(function (response) {
                    new arcgisPortal.Portal(Config.SHARING_HOST).signIn().then(function (portalUser) {
                        portal = portalUser.portal;
                        calcite.addClass(query(".sign-in-message")[0], "hide");
                        calcite.removeClass(query(".save-maps-message")[0], "hide");
                        credential = portalUser.credential;
                        getUserProfile(credential);
                    });
                });
            } else {
                saveWebMap(credential);
            }
        }

        function saveWebMap(credentials) {
            // TODO show loading saving indicator
            // User authenticated...
            var tmp = [].slice.call(document.querySelectorAll('[data-objectid]'));
            var objectIDs = tmp.map(function (x) {
                return x.dataset.objectid;
            });

            var url = Config.IMAGE_SERVER;
            var operationalLayers = array.map(objectIDs, function (objectID) {
                var storeObj = store.query({
                    objID: objectID
                })[0];
                var yr = "";
                if (storeObj.imprintYear === undefined) {
                    yr = "";
                } else {
                    yr = storeObj.imprintYear;
                }
                return {
                    "type": "Image Service",
                    "url": url,
                    "title": "" + storeObj.name + " (" + yr + ")",
                    "format": "jpgpng",
                    "compressionQuality": 75,
                    "layerDefinition": {
                        "definitionExpression": "OBJECTID = " + objectID
                    }
                };
            });

            var currentExtent = [];
            var lowerLeft = new Point(map.extent.xmin, map.extent.ymin);
            var lowerLeft_x = webMercatorUtils.webMercatorToGeographic(lowerLeft).x;
            var lowerLeft_y = webMercatorUtils.webMercatorToGeographic(lowerLeft).y;
            currentExtent.push(lowerLeft_x);
            currentExtent.push(lowerLeft_y);
            var upperRight = new Point(map.extent.xmax, map.extent.ymax);
            var upperRight_x = webMercatorUtils.webMercatorToGeographic(upperRight).x;
            var upperRight_y = webMercatorUtils.webMercatorToGeographic(upperRight).y;
            currentExtent.push(upperRight_x);
            currentExtent.push(upperRight_y);

            esriRequest({
                    url: Config.SHARING_HOST + "/sharing/rest/content/users/" + credentials.userId + "/addItem",
                    content: {
                        f: "json",
                        title: operationalLayers[0].title,
                        type: "Web Map",
                        extent: currentExtent.join(),
                        text: JSON.stringify({
                            "operationalLayers": operationalLayers,
                            "baseMap": {
                                "baseMapLayers": [{
                                    "id": "defaultBasemap_0",
                                    "layerType": "ArcGISTiledMapServiceLayer",
                                    "url": "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer",
                                    "visibility": true,
                                    "opacity": 1,
                                    "title": "World_Topo_Map"
                                }], "title": "Topographic"
                            },
                            "spatialReference": {
                                "wkid": 102100,
                                "latestWkid": 3857
                            }
                        })
                    }
                }, {
                    usePost: true
                }
            ).then(function (response) {
                if (response.success) {
                    // show alert message
                    // var successMsgEle = document.getElementsByClassName('save-success-msg')[0];
                    // calcite.removeClass(successMsgEle, 'hide');
                    // fade message out
                    // this._fade(successMsgEle);
                    var itemID = response.id;
                    var deployRoot = getDeployRoot(window.location.host);
                    var urlKey = esriLang.isDefined(portal.urlKey) ? portal.urlKey : null;
                    if (esriLang.isDefined(urlKey)) {
                        var customBaseUrl = esriLang.isDefined(portal.customBaseUrl) ? portal.customBaseUrl : ".arcgis.com";
                        window.open("https://" + urlKey + "." + customBaseUrl + "/home/webmap/viewer.html?webmap=" + itemID, "_blank");
                    } else {
                        window.open("https://" + deployRoot + ".arcgis.com/home/webmap/viewer.html?webmap=" + itemID, "_blank");
                    }
                } else {

                }
            });
        }

        function loadAppStyles() {
            document.title = Config.APP_TITLE;
            setAppHeaderStyle(Config.APP_HEADER_TEXT_COLOR, Config.APP_HEADER_BACKGROUND_COLOR);
            setAppHeaderTitle(Config.APP_HEADER_TEXT);
            setAppHeaderSubtitle(Config.APP_SUBHEADER_TEXT);
            setAppMessage(".step-one-message", Config.STEP_ONE_MESSAGE);
            setAppMessage(".step-one-half-circle-msg", Config.STEP_ONE_HALF_CIRCLE_MSG);
            setAppMessage(".step-two-message", Config.STEP_TWO_MESSAGE);
            setAppMessage(".step-two-half-circle-msg", Config.STEP_TWO_HALF_CIRCLE_MSG);
            setAppMessage(".step-three-message", Config.STEP_THREE_MESSAGE);
            setAppMessage(".step-three-half-circle-msg", Config.STEP_THREE_HALF_CIRCLE_MSG);
            setHalfCircleStyle(Config.HALF_CIRCLE_BACKGROUND_COLOR, Config.HALF_CIRCLE_COLOR, Config.HALF_CIRCLE_OPACITY);
            setTimelineLegendHeaderTitle(Config.TIMELINE_LEGEND_HEADER);
            setTimelineContainerStyle(Config.TIMELINE_CONTAINER_BACKGROUND_COLOR);
        }

        function documentClickHandler(e) {
            if (!$("#bitlyIcon").is(e.target) && !$("#bitlyInput").is(e.target) && !$(".popover-content").is(e.target)) {
                $(".popover").hide();
            }
        }

        function buildLegend(legendItem) {
            // TODO Change from topo-legend to timeline-legend
            var legendNode = query(".topo-legend")[0];
            var node = domConstruct.toDom('<label data-scale="' + legendItem.value + '" data-placement="right" class="btn toggle-scale active" style="background-color: ' + legendItem.color + '">' +
                '<input type="checkbox" name="options"><span data-scale="' + legendItem.value + '">' + legendItem.label + '</span>' +
                '</label>');

            if (urlQueryObject) {
                var _tmpFilters = urlQueryObject.f.split("|");
                var num = number.format(legendItem.value, {
                    places: 0,
                    pattern: "#"
                });
                var i = _tmpFilters.indexOf(num);
                if (_tmpFilters[i] !== undefined) {
                    domClass.toggle(node, "sel");
                    domStyle.set(node, "opacity", "0.3");
                    filter.push(_tmpFilters[i]);
                } else {
                    //
                }
            }

            on(node, "click", function (evt) {
                var selectedScale = evt.target.getAttribute("data-scale");
                domClass.toggle(this, "sel");
                if (domClass.contains(this, "sel")) {
                    var j = filter.indexOf(selectedScale);
                    if (j === -1) {
                        filter.push(selectedScale);
                    }
                    domStyle.set(this, "opacity", "0.3");
                    filterSelection.push(selectedScale);
                } else {
                    var k = filter.indexOf(selectedScale);
                    if (k !== -1) {
                        filter.splice(k, 1);
                    }
                    domStyle.set(this, "opacity", "1.0");
                    var i = filterSelection.indexOf(selectedScale);
                    if (i != -1) {
                        filterSelection.splice(i, 1);
                    }
                }
                drawTimeline(timelineData);
            });
            domConstruct.place(node, legendNode);
        }

        function watchSplitters(bc) {
            var timelineContainerNode = dom.byId("timeline-container");
            array.forEach(["bottom"], function (region) {
                var spl = bc.getSplitter(region);
                aspect.after(spl, "_startDrag", function () {
                    domStyle.set(spl.child.domNode, "opacity", "0.4");
                });
                aspect.after(spl, "_stopDrag", function () {
                    domStyle.set(spl.child.domNode, "opacity", "1.0");
                    // TODO Timeline height needs to be resized accordingly
                    var node = dom.byId("timeline-container");
                    timelineContainerNodeGeom = domStyle.getComputedStyle(timelineContainerNode);
                    timelineContainerGeometry = domGeom.getContentBox(node, timelineContainerNodeGeom);
                    drawTimeline(timelineData);
                });
            });
        }


        function getUrlParameters() {
            var urlObject = urlUtils.urlToObject(window.location.href);
            return urlObject.query;
        }

        function filterData(dataToFilter, filter) {
            var _filteredData = [];
            var exclude = false;
            var nFilters = filter.length;

            if (nFilters > 0) {
                var mapScaleValues = [];
                for (var i = 0; i < TOPO_MAP_SCALES.length; i++) {
                    mapScaleValues.push(TOPO_MAP_SCALES[i].value);
                }

                array.forEach(dataToFilter, function (item) {
                    // loop through each filter
                    for (var i = 0; i < nFilters; i++) {
                        var _filterScale = number.parse(filter[i]);
                        var _mapScale = item.scale;
                        var _pos = array.indexOf(mapScaleValues, _filterScale);
                        var _lowerBoundScale;
                        var _upperBoundScale;
                        var current;

                        if (_pos !== -1) {
                            if (TOPO_MAP_SCALES[_pos + 1] !== undefined) {
                                _lowerBoundScale = TOPO_MAP_SCALES[(_pos + 1)].value;
                            } else {
                                _lowerBoundScale = "";
                            }

                            if (TOPO_MAP_SCALES[_pos].value) {
                                current = TOPO_MAP_SCALES[_pos].value;
                            }

                            if (TOPO_MAP_SCALES[(_pos - 1)] !== undefined) {
                                _upperBoundScale = TOPO_MAP_SCALES[(_pos)].value;
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
                });
                return _filteredData;
            } else {
                return dataToFilter;
            }
        }

        function runQuery(mapExtent, mp, lod) {
            var timelineContainerNode = dom.byId("timeline-container");
            var queryTask = new QueryTask(Config.IMAGE_SERVER);
            var q = new Query();
            q.returnGeometry = true;
            q.outFields = Config.OUTFIELDS;
            q.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            q.where = Config.QUERY_WHERE;
            if (Config.QUERY_WHERE !== "") {
                q.where = Config.QUERY_WHERE;
            }
            if (Config.QUERY_GEOMETRY === "MAP_POINT") {
                q.geometry = mp;
            } else {
                q.geometry = mapExtent.expand(Config.EXTENT_EXPAND);
            }

            showLoadingIndicator();
            var deferred = queryTask.execute(q).addCallback(function (response) {
                timelineData = [];
                var nFeatures = response.features.length;

                if (nFeatures > 0) {
                    query(".timeline-mask").forEach(domConstruct.destroy);
                    timelineContainerNodeGeom = domStyle.getComputedStyle(timelineContainerNode);
                    timelineContainerGeometry = domGeom.getContentBox(timelineContainerNode, timelineContainerNodeGeom);
                    if (timelineContainerGeometry.h === 0) {
                        var n = registry.byId("timeline-container").domNode;
                        fx.animateProperty({
                            node: n,
                            duration: 1000,
                            properties: {
                                height: {
                                    end: 250
                                }
                            },
                            onEnd: function () {
                                registry.byId("main-window").layout();
                            }
                        }).play();
                    }

                    array.forEach(response.features, function (feature) {
                        var ext = feature.geometry.getExtent();
                        var xmin = ext.xmin;
                        var xmax = ext.xmax;
                        var ymin = ext.ymin;
                        var ymax = ext.ymax;

                        var objID = feature.attributes[Config.ATTRIBUTE_OBJECTID];
                        var mapName = feature.attributes[Config.ATTRIBUTE_MAP_NAME];
                        var scale = feature.attributes[Config.ATTRIBUTE_SCALE];
                        var dateCurrent = feature.attributes[Config.ATTRIBUTE_DATE];
                        if (dateCurrent === null)
                            dateCurrent = Config.MSG_UNKNOWN;
                        var day = formatDay(dateCurrent);
                        var month = formatMonth(dateCurrent);
                        var year = formatYear(dateCurrent);
                        var formattedDate = month + "/" + day + "/" + year;

                        var startDate = new Date(dateCurrent, month, day);

                        var downloadLink = feature.attributes[Config.ATTRIBUTE_DOWNLOAD_LINK];
                        var citation = feature.attributes[Config.ATTRIBUTE_CITATION];
                        var className = setClassname(scale);
                        var lodThreshold = setLodThreshold(scale);

                        var tooltipContent = "<img class='tooltipThumbnail' src='" + Config.IMAGE_SERVER + "/" + objID + Config.INFO_THUMBNAIL + "'>" +
                            "<div class='tooltipContainer'>" +
                            "<div class='tooltipHeader'>" + mapName + " (" + dateCurrent + ")</div>" +
                            "<div class='tooltipContent'>" + citation + "</div></div>";

                        var timelineItemContent = '<div class="timelineItemTooltip noThumbnail" title="' + tooltipContent + '" data-xmin="' + xmin + '" data-ymin="' + ymin + '" data-xmax="' + xmax + '" data-ymax="' + ymax + '">' +
                            '<span class="thumbnailLabel">' + mapName + '</span>';

                        timelineData.push({
                            "start": startDate,
                            "content": timelineItemContent,
                            "objID": objID,
                            "downloadLink": downloadLink,
                            "scale": scale,
                            "lodThreshold": lodThreshold,
                            "className": className
                        });
                    }); // END forEach
                } else {
                    addNoResultsMask();
                } // END QUERY
                drawTimeline(timelineData);
            }); // END Deferred
        }

        function initUrlParamData(urlQueryObject) {
            if (esriLang.isDefined(urlQueryObject)) {
                if (esriLang.isDefined(urlQueryObject.selLat) && esriLang.isDefined(urlQueryObject.selLng)) {
                    if (urlQueryObject.selLat !== "" && urlQueryObject.selLng !== "") {
                        var selLat = urlQueryObject.selLat;
                        var selLng = urlQueryObject.selLng;
                        var mp = new Point([selLat, selLng], new SpatialReference({
                            wkid: 102100
                        }));
                        // add crosshair
                        addCrosshair(mp);
                        currentMapClickPoint = mp;
                        currentLOD = map.getLevel();
                        currentMapExtent = map.extent;

                        if (urlQueryObject.oids.length > 0) {
                            var qt = new QueryTask(Config.IMAGE_SERVER);
                            var q = new Query();
                            q.returnGeometry = true;
                            q.outFields = Config.OUTFIELDS;
                            q.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                            if (Config.QUERY_GEOMETRY === "MAP_POINT") {
                                q.geometry = currentMapClickPoint;
                            } else {
                                q.geometry = currentMapExtent.expand(Config.EXTENT_EXPAND);
                            }

                            var deferreds = [];
                            // we need to fire off a query for 'each' OID, not all at once
                            array.forEach(urlQueryObject.oids.split("|"), function (oid) {
                                q.where = "OBJECTID = " + oid;
                                var deferred = qt.execute(q).addCallback(function (rs) {
                                    return rs.features[0];
                                });
                                deferreds.push(deferred);
                            });// END forEach

                            var layers = [];
                            all(deferreds).then(function (results) {
                                array.forEach(results, function (feature, index) {
                                    var objID = feature.attributes.OBJECTID;
                                    var mapName = feature.attributes[Config.ATTRIBUTE_MAP_NAME];
                                    var extent = feature.geometry.getExtent();
                                    var dateCurrent = feature.attributes[Config.ATTRIBUTE_DATE];

                                    if (dateCurrent === undefined || dateCurrent === null || dateCurrent === "") {
                                        dateCurrent = Config.MSG_UNKNOWN;
                                    }

                                    var scale = feature.attributes[Config.ATTRIBUTE_SCALE];
                                    var scaleLabel = number.format(scale, {
                                        places: 0
                                    });
                                    var lodThreshold = setLodThreshold(scale, Config.TIMELINE_LEGEND_VALUES, nScales, minScaleValue, maxScaleValue);

                                    var mosaicRule = new MosaicRule({
                                        "method": MosaicRule.METHOD_CENTER,
                                        "ascending": true,
                                        "operation": MosaicRule.OPERATION_FIRST,
                                        "where": "OBJECTID = " + objID
                                    });
                                    var params = new ImageServiceParameters();
                                    params.noData = 0;
                                    params.mosaicRule = mosaicRule;
                                    var imageServiceLayer = new ArcGISImageServiceLayer(Config.IMAGE_SERVER, {
                                        imageServiceParameters: params,
                                        opacity: 1.0
                                    });
                                    layers.push(imageServiceLayer);

                                    store.put({
                                        id: "1",
                                        objID: objID,
                                        layer: imageServiceLayer,
                                        name: mapName,
                                        imprintYear: dateCurrent,
                                        scale: scale,
                                        scaleLabel: scaleLabel,
                                        lodThreshold: lodThreshold,
                                        extent: extent
                                    });
                                });// End forEach
                                return layers.reverse();
                            }).then(function (layers) {
                                array.forEach(layers, function (layer, index) {
                                    map.addLayer(layer, index + 1);
                                });
                            });// END all

                            // expand height of timeline parent container
                            updateTimelineContainerHeight();
                            showGrid();
                            showStepThree();
                        } else {
                            // user shared only lat/lng and no selected maps
                            showStepTwo();
                        }
                        runQuery(currentMapExtent, currentMapClickPoint);
                    } else {
                        // user shared default url
                    }
                } else {
                    // user shared default url
                }
            }
        }

        function updateTimelineContainerHeight() {
            var timelineContainerNode = dom.byId("timeline-container");
            var timelineContainerNodeGeom = domStyle.getComputedStyle(timelineContainerNode);
            var timelineContainerGeometry = domGeom.getContentBox(timelineContainerNode, timelineContainerNodeGeom);
            if (timelineContainerGeometry.h === 0) {
                var n = registry.byId("timeline-container").domNode;
                fx.animateProperty({
                    node: n,
                    duration: 1000,
                    properties: {
                        height: {
                            end: parseInt(Config.TIMELINE_HEIGHT) + 20
                        }
                    },
                    onEnd: function () {
                        registry.byId("main-window").layout();
                    }
                }).play();
            }
        }

        function thumbnailRenderCell(object, data, td, options) {
            var objID = object.objID;
            var mapName = object.name;
            var imprintYear = object.imprintYear;
            var downloadLink = object.downloadLink;
            var imgSrc = Config.IMAGE_SERVER + "/" + objID + Config.INFO_THUMBNAIL;

            return domConstruct.create("div", {
                "class": "renderedCell",
                "innerHTML": "<button class='rm-layer-btn' data-objectid='" + objID + "'> X </button>" +
                "<img class='rm-layer-icon' src='" + imgSrc + "'>" +
                "<div class='thumbnailMapName' data-mapname-objectid='" + objID + "'>" + mapName + "</div>" +
                "<div class='thumbnailMapImprintYear'>" + imprintYear + "</div>" +
                "<div class='downloadLink'><a href='" + downloadLink + "' target='_parent'>download map</a></div>",
                onclick: function (evt) {
                    var objID = evt.target.getAttribute("data-objectid");
                    var storeObj = store.query({
                        objID: objID
                    });

                    if (calcite.hasClass(evt.target, "thumbnailMapName")) {
                        var qt = new QueryTask(Config.IMAGE_SERVER);
                        var q = new Query();
                        q.returnGeometry = false;
                        q.outFields = Config.OUTFIELDS;
                        q.where = "OBJECTID = " + evt.target.getAttribute("data-mapname-objectid");
                        qt.execute(q).addCallback(function (response) {
                            var feature = response.features[0].attributes;
                            domConstruct.create("div", {
                                "id": "grid-item-tooltip",
                                "style": {
                                    left: 205 + "px",
                                    top: evt.clientY + "px"
                                },
                                "innerHTML": "<div class='btn btn-small btn-transparent icon-ui-close-circled icon-ui-gray padding-left-0 padding-right-0 padding-trailer-0 padding-leader-0'></div>" + feature.Citation,
                                "onclick": function (evt) {
                                    if (evt.target.getAttribute("class")) {
                                        domConstruct.destroy("grid-item-tooltip");
                                    }
                                }
                            }, win.body(), "first");
                        });

                    } else {
                        map.removeLayer(storeObj[0].layer);
                        store.remove(objID);
                        if (store.data.length < 1) {
                            // no remaining items in the grid/store
                            map.graphics.remove(mouseOverGraphic);
                            map.graphics.clear();
                            addCrosshair(currentMapClickPoint);
                            hideLoadingIndicator();
                            showStepTwo();
                        }
                    }
                }
            });
        }

        function drawTimeline(data) {
            var filteredData = filterData(data, filter);
            topic.subscribe("/dnd/drop", function (source, nodes, copy, target) {
                var layers = [];
                query(".grid-map").forEach(domConstruct.destroy);
                query(".dgrid-row").forEach(function (node) {
                    var row = target.grid.row(node);
                    if (row) {
                        layers.push(row.data.layer);
                        map.removeLayer(row.data.layer);

                        var lodThreshold = row.data.lodThreshold;
                        var maskId = domAttr.get(node, "id") + "-mask";
                        if (currentLOD <= lodThreshold) {
                            // disable row
                            if (dom.byId("" + maskId) === null) {
                                domConstruct.create("div", {
                                    "id": "" + maskId,
                                    "class": "grid-map",
                                    "innerHTML": "<p style='text-align: center; margin-top: 20px'>" + Config.THUMBNAIL_VISIBLE_THRESHOLD_MSG + "</p>"
                                }, node, "first");
                            }
                        } else {
                            // enable row
                            domConstruct.destroy("" + maskId);
                        }
                    }
                });

                var j = layers.length;
                while (j >= 0) {
                    map.addLayer(layers[j]);
                    j--;
                }
            });

            if (timeline === undefined) {
                if (urlQueryObject) {
                    timelineOptions.start = new Date(urlQueryObject.minDate, 0, 0);
                    timelineOptions.end = new Date(urlQueryObject.maxDate, 0, 0);
                }
                timeline = new links.Timeline(dom.byId("timeline"));
                timeline.draw(filteredData, timelineOptions);
                links.events.addListener(timeline, "ready", onTimelineReady);
                links.events.addListener(timeline, "select", onSelect);
                showStepTwo();
            } else {
                timeline.setData(filteredData);
                timeline.redraw();
            }

            $(".timelineItemTooltip").tooltipster({
                theme: "tooltipster-shadow",
                contentAsHTML: true,
                position: "right",
                offsetY: 20
            });

            $(".timeline-event").mouseenter(function (evt) {
                // TODO IE / What a mess!
                var xmin, ymin, xmax, ymax, extent, sfs;
                if (evt.target.children[0] !== undefined && evt.target.children[0].children[0] !== undefined) {
                    if (evt.target.children[0].children[0].getAttribute("data-xmin")) {
                        xmin = evt.target.children[0].children[0].getAttribute("data-xmin");
                        xmax = evt.target.children[0].children[0].getAttribute("data-xmax");
                        ymin = evt.target.children[0].children[0].getAttribute("data-ymin");
                        ymax = evt.target.children[0].children[0].getAttribute("data-ymax");
                    }
                    // TODO
                    var data = evt.currentTarget.childNodes[0].childNodes[0].dataset;
                    if (data) {
                        xmin = data.xmin;
                        xmax = data.xmax;
                        ymin = data.ymin;
                        ymax = data.ymax;
                    }
                    extent = new Extent(xmin, ymin, xmax, ymax, new SpatialReference({
                        wkid: 102100
                    }));
                    sfs = sfs = createMouseOverGraphic(
                        new Color(Config.TIMELINE_ITEM_MOUSEOVER_GR_BORDER),
                        new Color(Config.TIMELINE_ITEM_MOUSEOVER_GR_FILL));
                    mouseOverGraphic = new Graphic(extent, sfs);
                    map.graphics.add(mouseOverGraphic);
                }

            }).mouseleave(function () {
                map.graphics.remove(mouseOverGraphic);
                map.graphics.clear();
                addCrosshair(currentMapClickPoint);
            });
            hideLoadingIndicator();
        }

        function onSelect() {
            var sel = timeline.getSelection();
            var _timelineData = timeline.getData();
            if (sel.length) {
                if (sel[0].row !== undefined) {
                    var row = sel[0].row;
                    var objID = _timelineData[row].objID;
                    // check to see if the timeline item is in the store
                    var objIDs = store.query({
                        objID: objID
                    });

                    if (objIDs.length < 1) {
                        var downloadLink = _timelineData[row].downloadLink;
                        var lodThreshhold = _timelineData[row].lodThreshold;
                        var whereClause = Config.IMAGE_SERVER_WHERE + objID;
                        var queryTask = new QueryTask(Config.IMAGE_SERVER);
                        var q = new Query();
                        q.returnGeometry = false;
                        q.outFields = Config.OUTFIELDS;
                        q.where = whereClause;
                        queryTask.execute(q, function (rs) {
                            var extent = rs.features[0].geometry.getExtent();
                            var mapName = rs.features[0].attributes.Map_Name;
                            var dateCurrent = rs.features[0].attributes.DateCurrent;

                            if (dateCurrent === null)
                                dateCurrent = Config.MSG_UNKNOWN;
                            var scale = rs.features[0].attributes.Map_Scale;
                            var scaleLabel = number.format(scale, {
                                places: 0
                            });

                            var mosaicRule = new MosaicRule({
                                "method": MosaicRule.METHOD_CENTER,
                                "ascending": true,
                                "operation": MosaicRule.OPERATION_FIRST,
                                "where": whereClause
                            });
                            var params = new ImageServiceParameters();
                            params.noData = 0;
                            params.mosaicRule = mosaicRule;
                            imageServiceLayer = new ArcGISImageServiceLayer(Config.IMAGE_SERVER, {
                                imageServiceParameters: params,
                                opacity: 1.0
                            });
                            map.addLayer(imageServiceLayer);

                            var _firstRow;
                            if (query(".dgrid-row", grid.domNode)[0]) {
                                var rowId = query(".dgrid-row", grid.domNode)[0].id;
                                _firstRow = rowId.split("-")[2];
                            }
                            var firstRowObj = store.query({
                                objID: _firstRow
                            });

                            store.put({
                                id: 1,
                                objID: objID,
                                layer: imageServiceLayer,
                                name: mapName,
                                imprintYear: dateCurrent,
                                scale: scale,
                                scaleLabel: scaleLabel,
                                lodThreshold: lodThreshhold,
                                downloadLink: downloadLink,
                                extent: extent
                            }, {
                                before: firstRowObj[0]
                            });
                        }).then(function (evt) {
                            showGrid();
                            grid.refresh();
                            showStepThree();
                        }); // END execute
                    } else {
                        // TODO already in the store/added to the map (alert the user)
                    }
                }
            }
        }

        function onTimelineReady() {
            // if the grid is visible, step 3 is visible, so hide step 2
            if ($(".gridContainer").css("display") === "block") {
                showStepThree();
            }
        }

        function createOrderedStore(data, options) {
            // Instantiate a Memory store modified to support ordering.
            return Observable(new Memory(lang.mixin({
                data: data,
                idProperty: "id",
                put: function (object, options) {
                    object.id = calculateOrder(this, object, options && options.before);
                    return Memory.prototype.put.call(this, object, options);
                },
                // Memory's add does not need to be augmented since it calls put
                copy: function (object, options) {
                    console.log("COPY");
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
                query: function (query, options) {
                    options = options || {};
                    options.sort = [
                        {attribute: "id"}
                    ];
                    return Memory.prototype.query.call(this, query, options);
                }
            }, options)));
        }

        function calculateOrder(store, object, before, orderField) {
            // Calculates proper value of order for an item to be placed before another
            var afterOrder,
                beforeOrder = 0;
            if (!orderField) {
                orderField = "id";
            }
            if (before) {
                // calculate midpoint between two items' orders to fit this one
                afterOrder = before[orderField];
                store.query({}, {}).forEach(function (object) {
                    var ord = object[orderField];
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

        function setClassname(scale) {
            var className;
            if (scale <= TOPO_MAP_SCALES[4].value) {
                className = "one";	// 0 - 12000
            } else if (scale > TOPO_MAP_SCALES[4].value && scale <= TOPO_MAP_SCALES[3].value) {
                className = "two";	// 12001 - 24000
            } else if (scale > TOPO_MAP_SCALES[3].value && scale <= TOPO_MAP_SCALES[2].value) {
                className = "three";// 24001 - 63360
            } else if (scale > TOPO_MAP_SCALES[2].value && scale <= TOPO_MAP_SCALES[1].value) {
                className = "four";	// 63361 - 125000
            } else if (scale > TOPO_MAP_SCALES[1].value) {
                className = "five";	// 125001 - 250000
            }
            return className;
        }

        function setLodThreshold(scale) {
            var _lodThreshold;
            var i = nScales;
            while (i > 0) {
                if (scale <= minScaleValue) {
                    _lodThreshold = TOPO_MAP_SCALES[TOPO_MAP_SCALES.length - 1].lodThreshold;
                    break;
                }

                if (scale > TOPO_MAP_SCALES[i].value && scale <= TOPO_MAP_SCALES[i - 1].value) {
                    _lodThreshold = TOPO_MAP_SCALES[i - 1].lodThreshold;
                    break;
                }

                if (scale > maxScaleValue) {
                    _lodThreshold = TOPO_MAP_SCALES[0].lodThreshold;
                    break;
                }
                i--;
            }

            return _lodThreshold;
        }

        function getNumberOfScales(scales) {
            return scales.length - 1;
        }

        function getMinScaleValue(scales) {
            return scales[nScales].value;
        }

        function getMaxScaleValue(scales) {
            return scales[0].value;
        }

        function createMouseOverGraphic(borderColor, fillColor) {
            var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, borderColor, Config.IMAGE_BORDER_WIDTH), fillColor);
            return sfs;
        }

        function addCrosshair(mp) {
            var crosshairSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CROSS, Config.CROSSHAIR_SIZE, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(Config.CROSSHAIR_FILL_COLOR), Config.CROSSHAIR_OPACITY));
            if (crosshairGraphic) {
                map.graphics.remove(crosshairGraphic);
            }
            crosshairGraphic = new Graphic(mp, crosshairSymbol);
            map.graphics.add(crosshairGraphic);
        }

        function setAppHeaderStyle(txtColor, backgroundColor) {
            query(".header").style("color", txtColor);
            query(".header").style("background-color", backgroundColor);
        }

        function setAppHeaderTitle(str) {
            query(".header-title")[0].innerHTML = str;
        }

        function setAppHeaderSubtitle(str) {
            query(".subheader-title")[0].innerHTML = str;
        }

        function setAppMessage(node, str) {
            query(node)[0].innerHTML = str;
        }

        function setTimelineLegendHeaderTitle(str) {
            query(".timeline-legend-header")[0].innerHTML = str;
        }

        function setTimelineContainerStyle(backgroundColor) {
            domStyle.set(dom.byId("timeline-container"), "backgroundColor", backgroundColor);
        }

        function resetApplicationClickHandler() {
            window.open(window.location.origin + window.location.pathname, '_top');
        }

        /*********************
         *
         * Grid
         *
         *********************/
        function gridDataChangeHandler(evt) {
            var diff = 1 - evt.value;
            evt.cell.row.data.layer.setOpacity(diff);
            //console.debug("cell: ", evt.cell, evt.cell.row.id, evt.cell.row.data.layer);
        }

        function gridRefreshHandler(event) {
            array.forEach(event.grid.store.data, function (node) {
                var row = grid.row(node);
                var lodThreshold = row.data.lodThreshold;
                var maskId = "grid-row-" + row.data.objID + "-mask";
                if (currentLOD <= lodThreshold) {
                    domConstruct.create("div", {
                        id: "" + maskId,
                        "class": "grid-map",
                        innerHTML: "<p style='text-align: center; margin-top: 20px'>" + Config.THUMBNAIL_VISIBLE_THRESHOLD_MSG + "</p>"
                    }, row.element, "first");
                } else {

                }
            });
        }

        function gridEnterCellHandler(evt) {
            if (mouseOverGraphic)
                map.graphics.remove(mouseOverGraphic);
            var row = grid.row(evt);
            var extent = row.data.extent;
            var sfs = createMouseOverGraphic(
                new Color(Config.SIDEBAR_MAP_MOUSEOVER_GR_BORDER),
                new Color(Config.SIDEBAR_MAP_MOUSEOVER_GR_FILL));
            mouseOverGraphic = new Graphic(extent, sfs);
            map.graphics.add(mouseOverGraphic);
        }

        function gridLeaveCellHandler(evt) {
            map.graphics.remove(mouseOverGraphic);
            map.graphics.clear();
            addCrosshair(currentMapClickPoint);
        }

        /*********************
         *
         * Portal
         *
         *********************/

        function getUserProfile(credential) {
            var DEPLOY_ROOT = getDeployRoot(window.location.host);
            var PORTAL_DOMAIN = ".arcgis.com";
            var PORTAL_URL = "//" + DEPLOY_ROOT + PORTAL_DOMAIN;

            esriRequest({
                url: "https://" + PORTAL_URL + "/sharing/rest/community/users/" + credential.userId + "?f=json",
                content: {
                    f: "json"
                }
            }).then(function (response) {
                // set user profile thumbnail
                var userProfileThumbnailUrl = null;
                if (!esriLang.isDefined(response.thumbnail)) {
                    userProfileThumbnailUrl = 'images/profile-pictures.png';
                } else {
                    userProfileThumbnailUrl = "https://" + PORTAL_URL + "/sharing/rest/community/users/" + credential.userId + "/info/" + response.thumbnail + "?token=" + credential.token;
                }
                // set user thumbnail
                var userThumbnailEle = query(".user-thumbnail")[0];
                domAttr.set(userThumbnailEle, "src", userProfileThumbnailUrl);
                // set username label
                var userNameEle = query(".user-name")[0];
                userNameEle.innerHTML = response.fullName;
            });
        }

        /*********************
         *
         * Map
         *
         *********************/

        function initBaseMap(urlQueryObject) {
            var _lat, _lng, _lod;
            if (urlQueryObject) {
                _lat = urlQueryObject.lat;
                _lng = urlQueryObject.lng;
                _lod = urlQueryObject.zl;
            } else {
                _lat = Config.BASEMAP_INIT_LAT;
                _lng = Config.BASEMAP_INIT_LNG;
                _lod = Config.BASEMAP_INIT_ZOOM;
            }
            map = new Map("map", {
                basemap: Config.BASEMAP_STYLE,
                center: [_lng, _lat],
                zoom: _lod
            });
        }

        function initGeocoderDijit(srcRef) {
            var geocoder = new Geocoder({
                map: map,
                autoComplete: true,
                showResults: true,
                searchDelay: 250,
                arcgisGeocoder: {
                    placeholder: Config.GEOCODER_PLACEHOLDER_TEXT
                }
            }, srcRef);
            geocoder.startup();
        }

        function mapClickHandler(evt) {
            var crosshairSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CROSS, Config.CROSSHAIR_SIZE, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(Config.CROSSHAIR_FILL_COLOR), Config.CROSSHAIR_OPACITY));
            currentMapClickPoint = evt.mapPoint;
            currentLOD = map.getLevel();
            if (crosshairGraphic) {
                map.graphics.remove(crosshairGraphic);
            }
            crosshairGraphic = new Graphic(currentMapClickPoint, crosshairSymbol);
            map.graphics.add(crosshairGraphic);
            runQuery(currentMapExtent, currentMapClickPoint, currentLOD);
        }

        function extentChangeHandler(evt) {
            currentMapExtent = evt.extent;
            currentLOD = evt.lod.level;
            query('.dgrid-row', grid.domNode).forEach(function (node) {
                var row = grid.row(node);
                var lodThreshold = row.data.lodThreshold;
                var maskId = domAttr.get(node, "id") + "-mask";
                if (currentLOD <= lodThreshold) {
                    // disable row
                    if (dom.byId("" + maskId) === null) {
                        domConstruct.create("div", {
                            id: "" + maskId,
                            "class": "grid-map",
                            innerHTML: "<p style='text-align: center; margin-top: 20px'>" + Config.THUMBNAIL_VISIBLE_THRESHOLD_MSG + "</p>"
                        }, node, "first");
                    }
                } else {
                    // enable row
                    domConstruct.destroy("" + maskId);
                }
            });
        }

        function mapLoadedHandler() {
            if (urlQueryObject !== null) {
                initUrlParamData(urlQueryObject);
            }
        }


        /*********************
         *
         * OAuth
         *
         *********************/

        function checkSignIn() {
            var deferred = new Deferred();
            var oauthConfig = _registerOAuthConfig();
            esriId.checkSignInStatus(oauthConfig.portalUrl).then(function (x) {
                deferred.resolve(x);
            }).otherwise(function (y) {
                deferred.resolve(y);
            });
            return deferred.promise;
        }

        function signOutBtnClickHandler(evt) {
            esriId.destroyCredentials();
            location.reload();
        }

        function _registerOAuthConfig() {
            var left = (screen.width - 800) / 2;
            var top = (screen.height - 480) / 4;
            esriId.useSignInPage = false;
            var oauthConfig = new OAuthInfo({
                appId: Config.APP_ID,
                // Uncomment this line to prevent the user's signed in state from being shared
                // with other apps on the same domain with the same authNamespace value.
                // authNamespace: "portal_oauth_inline",
                portalUrl: Config.SHARING_HOST,
                popup: true,
                popupWindowFeatures: "height=480,width=800,toolbar=no,location=no,directories=no,resizable=no,menubar=no,copyhistory=no,scrollbars=no,status=no,top=" + top + ",left=" + left
            });
            esriId.registerOAuthInfos([oauthConfig]);
            return oauthConfig;
        }

        /*********************
         *
         * Sharing
         *
         *********************/

        function shareFacebook() {
            var url = setSharingUrl();
            var options = '&p[title]=' + encodeURIComponent($('#title').text())
                + '&p[summary]=' + encodeURIComponent($('#subtitle').text())
                + '&p[url]=' + encodeURIComponent(url)
                + '&p[images][0]=' + encodeURIComponent($("meta[property='og:image']").attr("content"));

            window.open('https://www.facebook.com/sharer.php?s=100' + options, 'Facebook sharing', 'toolbar=0,status=0,width=626,height=436');
        }

        function shareTwitter() {
            var url = setSharingUrl();
            var options = null;
            requestShortUrl(url).then(function (response) {
                options = 'text=' + encodeURIComponent($('#title').text()) +
                    '&url=' + encodeURIComponent(response) +
                    '&related=' + Config.SHARING_RELATED +
                    '&hashtags=' + Config.SHARING_HASHTAGS;
                window.open('https://twitter.com/intent/tweet?' + options, 'Tweet', 'toolbar=0,status=0,width=626,height=436');
            });
        }

        function shareBitly() {
            var url = setSharingUrl();
            requestShortUrl(url).then(function (response) {
                $("#bitlyLoad").fadeOut();
                $("#bitlyInput").fadeIn();
                $("#bitlyInput").val(response);
                $("#bitlyInput").select();
                $(".popover").show();
            });
        }

        function aboutApplication() {
            var aboutModalBtn = query(".foo-modal")[0];
            aboutModalBtn.click();
        }

        function requestShortUrl(url) {
            var esriUrlShortener = 'https://arcg.is/prod/shorten?callback=?',
                targetUrl = url || document.location.href,
                deferred = new Deferred();

            $.getJSON(
                esriUrlShortener,
                {
                    'longUrl': targetUrl
                },
                function (response) {
                    if (!response || !response || !response.data.url) {
                        deferred.reject();
                    } else {
                        deferred.resolve(response.data.url);
                    }
                }
            );
            return deferred;
        }

        function setSharingUrl() {
            var mapClickX,
                mapClickY,
                timelineDateRange = "",
                minDate = "",
                maxDate = "",
                objectIDs = "",
                filters = "";
            if (!currentMapClickPoint) {
                // User is sharing the app but never even clicked on the map
                // Leave these params empty
                mapClickX = "";
                mapClickY = "";
            } else {
                mapClickX = currentMapClickPoint.x;
                mapClickY = currentMapClickPoint.y;
            }

            var lat = map.extent.getCenter().getLatitude();
            var lng = map.extent.getCenter().getLongitude();
            var zoomLevel = map.getLevel();

            if (timeline) {
                timelineDateRange = timeline.getVisibleChartRange();
                minDate = new Date(timelineDateRange.start).getFullYear();
                maxDate = new Date(timelineDateRange.end).getFullYear();
            }

            query(".dgrid-row", grid.domNode).forEach(function (node) {
                var row = grid.row(node);
                objectIDs += row.data.objID + "|";
            });
            objectIDs = objectIDs.substr(0, objectIDs.length - 1);

            array.forEach(filterSelection, function (filter) {
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

            return protocol + "//" + host + pathName + fileName +
                "?lat=" + lat +
                "&lng=" + lng +
                "&zl=" + zoomLevel +
                "&selLat=" + mapClickX +
                "&selLng=" + mapClickY +
                "&minDate=" + minDate +
                "&maxDate=" + maxDate +
                "&oids=" + objectIDs +
                "&f=" + filters;
        }

        function copyInput() {
            /* Get the text field */
            var copyText = $("#bitlyInput")[0];
            /* Select the text field */
            copyText.select();
            /* Copy the text inside the text field */
            document.execCommand("copy");
            /* Alert the copied text */
            alert("Copied the text: " + copyText.value);
            calcite.addClass(query(".popover"), "hide");
        }

        /*********************
         *
         * Utils
         *
         *********************/

        function addNoResultsMask() {
            domConstruct.create("div", {
                "class": "timeline-mask",
                "innerHTML": "<p style='text-align: center; margin-top: 20px'>" + Config.MSG_NO_MAPS + "</p>"
            }, "timeline", "first");
        }

        function showStepTwo() {
            calcite.addClass(query(".stepOne")[0], "hide-step");
            calcite.removeClass(query(".step-two-message-container")[0], "hide");
            calcite.addClass(query(".step-three-message-container")[0], "hide");
            calcite.addClass(query(".step-four-message-container")[0], "hide");
        }

        function showStepThree() {
            calcite.addClass(query(".stepOne")[0], "hide-step");
            calcite.addClass(query(".step-two-message-container")[0], "hide");
            calcite.removeClass(query(".step-three-message-container")[0], "hide");
            calcite.removeClass(query(".step-four-message-container")[0], "hide");
        }

        function showGrid() {
            $(".gridContainer").css("display", "block");
            showStepThree();
        }

        function setHalfCircleStyle(backgroundColor, color, opacity) {
            query(".halfCircleRight").style("backgroundColor", backgroundColor);
            query(".halfCircleRight").style("color", color);
            query(".halfCircleRight").style("opacity", opacity);
        }

        function fadeIn(node) {
            var _node = query(node)[0];
            var fadeArgs = {
                node: _node,
                duration: 600
            };
            fx.fadeIn(fadeArgs).play();
        }

        function fadeOut(node) {
            var _node = query(node)[0];
            var fadeArgs = {
                node: _node,
                duration: 600
            };
            fx.fadeOut(fadeArgs).play();
        }

        function showLoadingIndicator() {
            var loading = dom.byId("loadingImg");
            esri.show(loading);
            map.disableMapNavigation();
        }

        function hideLoadingIndicator() {
            var loading = dom.byId("loadingImg");
            esri.hide(loading);
            map.enableMapNavigation();
        }

        function getDeployRoot(host) {
            switch (host) {
                case 'livingatlasdev.arcgis.com':
                    return 'devext';
                    break;
                case 'livingatlasstg.arcgis.com':
                    return 'qaext';
                    break;
                case 'livingatlas.arcgis.com':
                    return 'www';
                    break;
                default:
                    return 'www';
            }
        }

        function formatDay(date) {
            if (date instanceof Date)
                return date.getDate();
            else
                return "";
        }

        function formatMonth(date) {
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
        }

        function formatYear(date) {
            if (date instanceof Date) {
                return date.getFullYear();
            } else {
                return "";
            }
        }
    });
