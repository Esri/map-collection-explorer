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
define({
	//Default configuration settings for the application. This is where you'll define things like a bing maps key,
	//default web map, default app color theme and more. These values can be overwritten by template configuration settings and url parameters.
	"appid": "",
	"webmap": "6e03e8c26aad4b9c92a87c1063ddb0e3",
	"oauthappid": null, //"AFTKRmv16wj14N3z",
	//Group templates must support a group url parameter. This will contain the id of the group.
	"group": "",
	//Enter the url to the proxy if needed by the application. See the 'Using the proxy page' help topic for details
	//http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
	"proxyurl": "",
	//Example of a template specific property. If your template had several color schemes
	//you could define the default here and setup configuration settings to allow users to choose a different
	//color theme.
	"theme": "blue",
	"bingKey": "", //Enter the url to your organizations bing maps key if you want to use bing basemaps
	//Defaults to arcgis.com. Set this value to your portal or organization host name.
	"sharinghost": location.protocol + "//" + "www.arcgis.com",
	"units": null,
	//This option demonstrates how to handle additional custom url parameters. For example
	//if you want users to be able to specify lat/lon coordinates that define the map's center or
	//specify an alternate basemap via a url parameter.
	"urlItems": [
		"theme" // example param. ?theme=<my theme>
	],
	"helperServices": {
		"geometry": {
			"url": null
		},
		"printTask": {
			"url": null
		},
		"elevationSync": {
			"url": null
		},
		"geocode": [
			{
				"url": null
			}
		]
	},

	/**************************************************************************
	 *
	 * Text displayed when saving is enabled.  Saving is enabled when users are
	 * logged into to their ArcGIS Online organization.
	 *
	 ***************************************************************************/
	"SAVE_AS_TEXT": "save",

	/**************************************************************************
	 *
	 * Browser window title (text that will show up in the browser's bookmarks)
	 *
	 ***************************************************************************/
	"APP_TITLE": "USGS Historical Topographic Map Explorer",

	/**************************************************************************
	 *
	 * Application header
	 *
	 * ************************************************************************/
	/* Header height */
	"HEADER_HEIGHT": "70px",
	/* Header/Banner background color (rgb or hex) */
	"HEADER_BACKGROUND_COLOR": "rgb(48, 75, 60)",
	/* Header text color */
	"HEADER_TEXT_COLOR": "white",
	/* Header text size */
	"HEADER_TEXT_SIZE": "1.6em",
	/* Header text */
	"HEADER_TEXT": "USGS Historical Topographic Map Explorer",

	/* Header text color */
	"SUBHEADER_TEXT_COLOR": "white",
	/* Header text size */
	"SUBHEADER_TEXT_SIZE": "0.9em",
	/* Subheader text */
	"SUBHEADER_TEXT": "",

	/* Header icons */
	"ESRI_ICON_PATH": "images/esri.png",
	"NON_ESRI_ICON_PATH": "images/usgswhite.green.jpg",

	/**************************************************************************
	 *
	 * Step Messages (1, 2, 3)
	 *
	 **************************************************************************/
	/* Step 1 */
	"STEP_ONE_MESSAGE": "<span style='font-weight: bold'>Go</span> to the location you want to explore, then <br/><span style='font-weight: bold'>Click</span> on a place to see its historical maps.",
	"STEP_ONE_HALF_CIRCLE_MSG": "1",
	/* Step 2 */
	"STEP_TWO_MESSAGE": "<span style='font-weight: bold'>Click</span> timeline maps to view in main window.",
	"STEP_TWO_HALF_CIRCLE_MSG": "2",
	/* Step 3 */
	"STEP_THREE_MESSAGE": "<span style='font-weight: bold'>Slide</span> transparency on map to compare, or drag/drop to re-order maps.",
	"STEP_THREE_HALF_CIRCLE_MSG": "3",
	/* Half circle */
	"HALF_CIRCLE_BACKGROUND_COLOR": "rgb(146, 179, 160)",
	"HALF_CIRCLE_COLOR": "white",
	"HALF_CIRCLE_OPACITY": "1.0",

	/**************************************************************************
	 *
	 * Basemap initialization properties
	 *
	 **************************************************************************/
	/* default coordinates and zoom level */
	"BASEMAP_INIT_LAT": 29.939833,
	"BASEMAP_INIT_LNG": -90.076046,
	"BASEMAP_INIT_ZOOM": 12,

	/**************************************************************************
	 *
	 * Map click crosshair
	 *
	 **************************************************************************/
	"CROSSHAIR_SIZE": 40,
	"CROSSHAIR_FILL_COLOR": [255, 0, 24],
	"CROSSHAIR_OPACITY": 0.95,

	/**************************************************************************
	 *
	 * Geocoder Dijit
	 *
	 **************************************************************************/
	"GEOCODER_PLACEHOLDER_TEXT": "Find a Place",

	/**************************************************************************
	 *
	 * Timeline Container - the container that display the timeline
	 *
	 **************************************************************************/
	/* container background color */
	"TIMELINE_CONTAINER_BACKGROUND_COLOR": "rgba(224, 237, 228, 0.55)",

	/**************************************************************************
	 *
	 * Timeline Legend
	 *
	 **************************************************************************/
	/* legend header */
	"TIMELINE_LEGEND_HEADER": "Historical Map Scales",
	/*
		legend values in DESCENDING order
				label:	label (any string value)
				value:	value (i.e. scale)
				color:	thumb color
			className:
		lodThreshhold:	level of detail threshold
	*/
	"TIMELINE_LEGEND_VALUES": [
		{
			"label": "250,000",
			"value": 250000,
			"color": "rgb(0, 78, 215)",
			"className": "five",
			"lodThreshold": 7
		},
		{
			"label": "125,000",
			"value": 125000,
			"color": "rgb(0, 117, 196)",
			"className": "four",
			"lodThreshold": 9
		},
		{
			"label": "62,500",
			"value": 62500,
			"color": "rgb(0, 156, 176)",
			"className": "three",
			"lodThreshold": 10
		},
		{
			"label": "24,000",
			"value": 24000,
			"color": "rgb(0, 196, 157)",
			"className": "two",
			"lodThreshold": 11
		},
		{
			"label": "12,000",
			"value": 12000,
			"color": "rgb(0, 235, 137)",
			"className": "one",
			"lodThreshold": 13
		}
	],

	/**************************************************************************
	 *
	 * Timeline parameters
	 *
	 **************************************************************************/
	/*
	 * Timeline style 'box' or 'dot'
	 * Specifies the style for the timeline events. Choose from "dot" or "box". Note that the content of the events may
	 * contain additional html formatting.
	*/
	"TIMELINE_STYLE": "box",
	/* timeline height */
	"TIMELINE_HEIGHT": "240",
	/* */
	"TIMELINE_ZOOM_MIN": 201536000000,
	"TIMELINE_ZOOM_MAX": 4153600000000,
	/* If true, events will be clustered together when zooming out. */
	"TIMELINE_CLUSTER": false,
	/* Enable a navigation menu with buttons to move and zoom the timeline. */
	"TIMELINE_SHOW_NAVIGATION": false,
	/* minimum date onLoad */
	"TIMELINE_MIN_DATE": '1950',
	/* maximum date onLoad */
	"TIMELINE_MAX_DATE": '2015',
	/* steps between labels */
	"TIMELINE_STEP": 5,
	/* When true, events are moved animated when resizing or moving them. This is very pleasing for the eye, but does
	 * require more computational power. */
	"TIMELINE_ANIMATE": true,
	"TIMELINE_SCALE": "year",

	/**************************************************************************
	 *
	 * REST endpoints and URL params
	 *
	 **************************************************************************/
	/* path to thumbnails on Image Service */
	"INFO_THUMBNAIL": "/info/thumbnail",
	/* Image service */
	"IMAGE_SERVER": "https://utility.arcgis.com/usrsvcs/servers/2b0399da54ca45b1a36825af098d7676/rest/services/USA_Historical_Topo_Maps/ImageServer",
	//"IMAGE_SERVER": "https://utility.arcgis.com/usrsvcs/servers/f0ccaa1db1e5457397d22847d66f7de1/rest/services/USA_Historical_Topo_Maps/ImageServer",
	/* outfields */
	"OUTFIELDS": ['*'],
	/* WHERE clause (DO NOT CHANGE) */
	"IMAGE_SERVER_WHERE": "OBJECTID = ",

	/* URL to the ArcGIS Server REST resource that represents a map service layer. */
	"QUERY_TASK_URL": "https://services.arcgis.com/YkVYBaX0zm7bsV3k/ArcGIS/rest/services/USGSTopoIndex/FeatureServer/0",
	/* */
	"QUERY_TASK_OUTFIELDS": ["Download_G", "Map_Name", "Map_Scale", "DateCurren", "SvcOID", "IsDefault", "Citation"],
	/* A where clause for the query. */
	/* For the USGS application we're only pulling back the 'official' maps */
	"QUERY_WHERE":"IsDefault = 1",
	/* The geometry to apply to the spatial filter. (<MAP_POINT> or < >) */
	"QUERY_GEOMETRY": "MAP_POINT",

	/* USGS (temporary) */
	/* Used specifically for the USGS application */
	"DOWNLOAD_PATH": "https://ims.er.usgs.gov/gda_services/download?item_id=",
	/* Attribute Fields */
	"ATTRIBUTE_OBJECTID": "SvcOID",
	/* Name of map displayed */
	"ATTRIBUTE_MAP_NAME": "Map_Name",
	/* Date field (UTC format) */
	"ATTRIBUTE_DATE": "DateCurren",
	/* Scale field */
	"ATTRIBUTE_SCALE": "Map_Scale",
	/* Tooltip content */
	"TOOLTIP_CONTENT": "",
	/* Download map link */
	"ATTRIBUTE_DOWNLOAD_LINK": "Download_G",
	/* Map citation <String> or <attribute field> */
	"ATTRIBUTE_CITATION": "Citation",

	/**************************************************************************
	 *
	 **************************************************************************/
	"MSG_UNKNOWN": "Unknown",
	"MSG_NO_MAPS": "No maps overlap the selected point",

	"ZOOM_LEVEL_THRESHOLD": 9,
	"THUMBNAIL_VISIBLE_THRESHOLD": 12,
	"THUMBNAIL_VISIBLE_THRESHOLD_MSG": "Zoom Closer to view map",

	/**************************************************************************
	 *
	 **************************************************************************/
	"DOWNLOAD_MAP_LABEL": "download map",

	/**************************************************************************
	 *
	 * Mouseover/Mouseout graphic styles (FILL and BORDER)
	 *
	 **************************************************************************/
	/* Timeline item mouseover graphics */
	"TIMELINE_ITEM_MOUSEOVER_GR_FILL":[146, 179, 160, 0.10],
	"TIMELINE_ITEM_MOUSEOVER_GR_BORDER":[48, 75, 60, 1.0],
	/* Sidebar item mouseover graphics */
	"SIDEBAR_MAP_MOUSEOVER_GR_FILL":[146, 179, 160, 0.0],
	"SIDEBAR_MAP_MOUSEOVER_GR_BORDER":[48, 75, 60, 1.75],
	/* */
	"IMAGE_BORDER_WIDTH": 1.75,

	"EXTENT_EXPAND": 0.60,

	/******** Sharing/Social media icons ********/
	"SHARING_RELATED": "",
	"SHARING_HASHTAG": "USGS"
});
