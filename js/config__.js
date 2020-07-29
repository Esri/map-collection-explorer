var Config = {
    "APP_ID": "TopoExplorer",
    "SHARING_HOST": "https://" + "www.arcgis.com",
    // DO NOT MODIFY
    "USER_NOT_SIGNED_IN": "User is not signed in.",

    /**************************************************************************
     *
     * Browser window title (text that will show up in the browser bookmarks)
     *
     ***************************************************************************/
    "APP_TITLE": "USGS Historical Topographic Map Explorer",

    /**************************************************************************
     *
     * Application header
     *
     * ************************************************************************/
    /* Header/Banner background color (rgb or hex) */
    "HEADER_HEIGHT": "70px",
    /* Header/Banner background color (rgb or hex) */
    "APP_HEADER_BACKGROUND_COLOR": "#304b3c",
    /* Header text color */
    "APP_HEADER_TEXT_COLOR": "white",
    /* Header text size */
    "APP_HEADER_TEXT_SIZE": "1.6em",
    /* Header text */
    "APP_HEADER_TEXT": "USGS Historical Topographic Map Explorer",

    /* Header text color */
    "APP_SUBHEADER_TEXT_COLOR": "white",
    /* Header text size */
    "APP_SUBHEADER_TEXT_SIZE": "0.9em",
    /* Subheader text */
    "APP_SUBHEADER_TEXT": "",

    /**************************************************************************
     *
     * Step Messages (1, 2, 3)
     *
     **************************************************************************/
    /* Step 1 */
    "STEP_ONE_MESSAGE": "<span style='font-weight: bold'>Find</span> a place you want to explore, then<br/><span style='font-weight: bold'>Click</span> on a location to see its historical maps.",
    "STEP_ONE_HALF_CIRCLE_MSG": "1",
    /* Step 2 */
    "STEP_TWO_MESSAGE": "<span style='font-weight: bold'>Click</span> on maps in the timeline to view them in the <br />main window.",
    "STEP_TWO_HALF_CIRCLE_MSG": "2",
    /* Step 3 */
    "STEP_THREE_MESSAGE": "<span style='font-weight: bold'>Compare</span> maps using the transparency sliders, and<br /><span style='font-weight: bold'>Reorder</span> maps by dragging them.",
    "STEP_THREE_HALF_CIRCLE_MSG": "3",
    /* Half circle */
    "HALF_CIRCLE_BACKGROUND_COLOR": "#92b3a0",
    "HALF_CIRCLE_COLOR": "white",
    "HALF_CIRCLE_OPACITY": "1.0",

    /**************************************************************************
     *
     * Basemap initialization properties
     *
     **************************************************************************/
    /* default basemap */
    "BASEMAP_STYLE": "topo",
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
     * Timeline Container
     *
     **************************************************************************/
    /* container background color */
    "TIMELINE_CONTAINER_BACKGROUND_COLOR": "rgba(224, 237, 228, 0.55)",
    /* legend header */
    "TIMELINE_LEGEND_HEADER": "Historical Map Scales",

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

    /* Timeline disabled message (Msg displayed when user zooms too far out) */
    "TIMELINE_DISABLED_MESSAGE": "Zoom closer on the map to enable the timeline",
    "TIMELINE_DISABLED_BACKGROUND_COLOR": "#7C7C7C",
    "TIMELINE_DISABLED_COLOR": "white",
    "TIMELINE_DISABLED_BACKGROUND_OPACITY": "0.65",
    "TIMELINE_DISABLED_BACKGROUND_FONT_SIZE": "1.7em",

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
    "TIMELINE_MIN_DATE": '1850',
    /* maximum date onLoad */
    "TIMELINE_MAX_DATE": '2015',
    /* steps between labels */
    "TIMELINE_STEP": 5,
    /* When true, events are moved animated when resizing or moving them. This is very pleasing for the eye, but does
     * require more computational power. */
    "TIMELINE_ANIMATE": true,

    /**************************************************************************
     *
     * REST endpoints and URL params
     *
     **************************************************************************/
    /* path to thumbnails on Image Service */
    "INFO_THUMBNAIL": "/info/thumbnail",
    /* TODO Change name/description */
    "IMAGE_SERVER_JSON": "?culture=en&f=json&token=",

    /* Image service */
    "IMAGE_SERVER": "https://utility.arcgis.com/usrsvcs/servers/88d12190e2494ce89374311800af4c4a/rest/services/USGS_Historical_Topographic_Maps/ImageServer",
    /* outfields */
    "OUTFIELDS": ['*'],
    /* WHERE clause */
    "IMAGE_SERVER_WHERE": "OBJECTID = ",

    /* A where clause for the query. */
    "QUERY_WHERE":"IsDefault = 1",
    /* The geometry to apply to the spatial filter. (<MAP_POINT> or < > */
    "QUERY_GEOMETRY": "MAP_POINT",

    /* USGS (temporary) */
    "DOWNLOAD_PATH": "https://prd-tnm.s3.amazonaws.com/StagedProducts/Maps/HistoricalTopo/GeoTIFF/",

    /* Attribute Fields */
    /* OBJECTID -- DO NOT modify this field --- */
    "ATTRIBUTE_OBJECTID": "OBJECTID",
    /* Name of map displayed */
    "ATTRIBUTE_MAP_NAME": "Map_Name",
    /* Date field (UTC format) */
    "ATTRIBUTE_DATE": "DateCurren",
    /* Scale field */
    "ATTRIBUTE_SCALE": "Map_Scale",
    /* Tooltip content */
    "TOOLTIP_CONTENT": "",
    /* Download map link */
    "ATTRIBUTE_DOWNLOAD_LINK": "DownloadG",
    /* Map citation <String> or <attribute field> */
    "ATTRIBUTE_CITATION": "Citation",

    /**************************************************************************
     *
     **************************************************************************/
    "MSG_UNKNOWN": "Unknown",
    "MSG_NO_MAPS": "No maps overlap the selected point",

    "EXTENT_EXPAND": 0.60,

    "ZOOM_LEVEL_THRESHOLD": 9,
    "THUMBNAIL_VISIBLE_THRESHOLD": 12,
    "THUMBNAIL_VISIBLE_THRESHOLD_MSG": "Zoom Closer to view map",

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

    /******** Sharing/Social media icons ********/
    "SHARING_RELATED": "",
    // comma separated list of tags
    "SHARING_HASHTAGS": "USGS,Esri,ArcGIS,LivingAtlas",

    "MAP_CLICK_HANDLER_ON": true
};
