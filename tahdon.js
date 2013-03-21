/** 
 * Tahdon2013
 * 
 * @author Ville Korhonen <ville@xd.fi>
 */

var initiate_id = 3;

var stats_url = 'http://tmp.ypcs.fi/c/tahdon2013/stats.json';
//var latest_url = 'http://api.ypcs.fi/api/v1/initiativestatus.json';
var latest_url = 'http://tmp.ypcs.fi/c/tahdon2013/small.json';
var limits_url = 'http://api.ypcs.fi/api/v1/initiativelimit.json';
//var stats_url = 'http://localhost/tahdon2013/stats.json';
var autoupdate = true;
var autoupdate_timeout = 10000; // 5 seconds (5000ms)
var title_suffix = 'Tahdon2013 -allekirjoitusseuranta';
var plot_options = {
    xaxis: {
        mode: "time"
    },
    series: {
        lines: {
            show: true
        },
        points: {
            show: true
        }
    },
    grid: {
        hoverable: true,
        autoHighlight: false,
        clickable: true
    },
    zoom: {
        interactive: false
    },
    pan: {
        interactive: false
    },
    legend: {
        show: true,
        position: "nw"
    }
};

var currentLimits = [
    {
        title: 'Eduskuntakäsittelyn allekirjoitusraja',
        limit: 50000,
        color: '#ff0000'
    },
    {
        title: 'Turkistarhausaloitteen allekirjoittajia',
        limit: 69381,
        color: '#ccffcc'
    },
    {
        title: 'Äänioikeutettuja 2012 (Keski-Suomi)',
        limit: 219668
    },
    {
        title: 'Äänioikeutettuja 2012 (Lappi)',
        limit: 147793
    },
    {
        title: 'Äänioikeutettuja 2012 (Vaasa)',
        limit: 347141
    },
    {
        title: 'Äänioikeutettuja 2012 (Pohjois-Savo)',
        limit: 200898
    },
    {
        title: 'Äänioikeutettuja 2012 (Pohjois-Karjala)',
        limit: 134965
    },
    /*{
        title: 'Äänioikeutettuja 2012 (Oulu)',
        limit: 367292
    },*/
    {
        title: 'Äänioikeutettuja 2012 (Etelä-Savo)',
        limit: 127511
    },
    {
        title: 'Äänioikeutettuja 2012 (Satakunta)',
        limit: 182879
    },
    /*{
        title: 'Äänioikeutettuja 2012 (Keski-Suomi)',
        limit: 219668
    },
    {
        title: 'Äänioikeutettuja 2012 (Keski-Suomi)',
        limit: 219668
    },
    {
        title: 'Äänioikeutettuja 2012 (Keski-Suomi)',
        limit: 219668
    },
    {
        title: 'Äänioikeutettuja 2012 (Keski-Suomi)',
        limit: 219668
    },*/

];

function formatLimit(limit, min, max) {
    var s = {
        data: [
            [min, limit.limit],
            [max, limit.limit]
        ],
        label: limit.title
    };
    if (limit.color) {
        s.color = limit.color;
    }
    return s;
}

function displayLimits(m) {
    var params = {
        order_by: "-count",
        count__lte: m + Math.round(m * 0.10)
    };
    var url = limits_url + '?' + $.param(params);

    $.getJSON(url, function(data) {
        var limits = data.objects;

        for (var i=0; i<limits.length; i++) {
            currentLimits.push(flotLimit(limits[i]));
        }
    });
}

function displayTime(d) {
    var str = "";

    //var currentTime = new Date()
    var currentTime = d;
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    var seconds = currentTime.getSeconds()

    if (minutes < 10) {
        minutes = "0" + minutes
    }
    if (seconds < 10) {
        seconds = "0" + seconds
    }
    str += hours + ":" + minutes + ":" + seconds;
    
    return str;
}

function updateTitle(c) {
    document.title = c + ' - ' + title_suffix;
}

function updateLabel(t, c) {
    $("#stats").text("Allekirjoituksia klo " + displayTime(t) + ' yhteensä ' + c  + 'kpl.');
}

function updateLatest() {
    var params = {
        initiative: initiate_id,
        order_by: "-timestamp",
        limit: 1
    };
    var url = latest_url + '?' + $.param(params);
    $.getJSON(url, function(data) {
        var t = new Date(data.objects[0].timestamp);
        var c = data.objects[0].supportCount;

        updateTitle(c);
        updateLabel(t, c);
    });

    if (autoupdate) {
        setTimeout('updateLatest()', autoupdate_timeout);
    }
}


$(document).ready(function() {
    updateLatest();

    //displayLimits(200000);

        function showTooltip(x, y, contents) {
            $("<div id='tooltip'>" + contents + "</div>").css({
                position: "absolute",
                display: "none",
                top: y + 5,
                left: x + 5,
                border: "1px solid #fdd",
                padding: "2px",
                "background-color": "#fee",
                opacity: 0.80
            }).appendTo("body").fadeIn(200);
        }

    $.getJSON(stats_url, function(data) {
        var items = data.data;
        var latest = new Date((2 * 3600 + data.meta.latest) * 1000.0);
        var max = data.meta.max;
        var placeholder = $("#chart");

        updateTitle(max);

        var m = 0, md = 0;
        var diff = 0, dstart = 0, dstop = 0;
        derivative = new Array();
        smoothderivative = new Array();

        for (var i=0; i<items.length; i++) {
            // fix utc => utc+2
            items[i][0] = (items[i][0] + 2 * 3600)* 1000.0;
            if (items[i][1] > m) {m = items[i][1];}
            if (items[i][0] > md) {md = items[i][0];}
        }

        

        for (var i=0; i<items.length; i++) { // calculate derivative
            var dstop = i;
            if (i == 0) { dstop = 1; }
            for (var dstart=dstop; dstart>0 && items[dstop][0]-items[dstart][0]<7*60*1000.0; dstart--) {} // go backwards (max 7mins)
            diff = (items[dstop][1] - items[dstart][1]) * (3600 * 1000.0);
            diff /= items[dstop][0] - items[dstart][0];
            derivative.push([ items[i][0], diff]); 
        }
        smoothderivative = new Array();
        // smoothing, simple rectangular window -60 mins to now 
        for (var i=0;i<items.length; i++) { 
            var dstop = i;
            if (i == 0) { dstop = 1; }
            for (var dstart=dstop; dstart>0 && items[dstop][0]-items[dstart][0]<3600*1000.0; dstart--) {} // go backwards (max 60mins)
            diff = (items[dstop][1] - items[dstart][1]) * (3600 * 1000.0);
            diff /= items[dstop][0] - items[dstart][0];
            smoothderivative.push([ items[i][0], diff]); 
        }
        
        var dm = new Date(md);

        var max_v = items[items.length - 1][0];
        var min_v = items[0][0];

        var values = [
            {
                data: items,
                label: "Allekirjoituksia"
            }
        ];

        for (var i=0; i<currentLimits.length; i++) {
            values.push(formatLimit(currentLimits[i], min_v, max_v));
        }

     
        var plot = $.plot(placeholder, values, plot_options); 

        var legends = $("#chart .legendlabel");
        legends.each(function() {
            $(this).css('width', $(this).width());
        });

        var previousPoint = null;
        placeholder.bind("plothover", function (event, pos, item) {          
                if (item) {
                    if (previousPoint != item.dataIndex) {

                        previousPoint = item.dataIndex;

                        $("#tooltip").remove();
                        var x = item.datapoint[0].toFixed(2),
                        y = item.datapoint[1];
                        

                        showTooltip(item.pageX, item.pageY,
                            item.series.label + " " + y);
                    }
                } else {
                    $("#tooltip").remove();
                    previousPoint = null;            
                }
            
        });
        
        var plot2 = $.plot('#chart2', [
        {
            data: derivative,
            label: "Hetkellinen nopeus (allekirjoitusta tunnissa)"
        },
        {
            data: smoothderivative,
            label: "Allekirjoituksia viimeisen tunnin aikana"
        }], plot_options);

        var legends2 = $("#chart2 .legendlabel");
        legends.each(function() {
            $(this).css('width', $(this).width());
        });




// show pan/zoom messages to illustrate events 

        placeholder.bind("plotpan", function (event, plot) {
            var axes = plot.getAxes();
            $(".message").html("Panning to x: "  + axes.xaxis.min.toFixed(2)
            + " &ndash; " + axes.xaxis.max.toFixed(2)
            + " and y: " + axes.yaxis.min.toFixed(2)
            + " &ndash; " + axes.yaxis.max.toFixed(2));
        });

        placeholder.bind("plotzoom", function (event, plot) {
            var axes = plot.getAxes();
            $(".message").html("Zooming to x: "  + axes.xaxis.min.toFixed(2)
            + " &ndash; " + axes.xaxis.max.toFixed(2)
            + " and y: " + axes.yaxis.min.toFixed(2)
            + " &ndash; " + axes.yaxis.max.toFixed(2));
        });

        // add zoom out button 

        $("<div class='button' style='right:80px;top:20px'>zoom in</div>")
            .appendTo(placeholder)
            .click(function (event) {
                event.preventDefault();
                plot.zoom();
            });
        $("<div class='button' style='right:20px;top:20px'>zoom out</div>")
            .appendTo(placeholder)
            .click(function (event) {
                event.preventDefault();
                plot.zoomOut();
            });

        // and add panning buttons

        // little helper for taking the repetitive work out of placing
        // panning arrows

        function addArrow(dir, right, top, offset) {
            $("<img class='button' src='arrow-" + dir + ".gif' style='right:" + right + "px;top:" + top + "px'>")
                .appendTo(placeholder)
                .click(function (e) {
                    e.preventDefault();
                    plot.pan(offset);
                });
        }

        addArrow("left", 55, 60, { left: -100 });
        addArrow("right", 25, 60, { left: 100 });
        addArrow("up", 40, 45, { top: -100 });
        addArrow("down", 40, 75, { top: 100 });

    });
});
