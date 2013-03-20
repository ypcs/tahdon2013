/** 
 * Tahdon2013
 * 
 * @author Ville Korhonen <ville@xd.fi>
 */

var stats_url = 'http://tmp.ypcs.fi/c/tahdon2013/stats.json';
//var stats_url = 'http://localhost/tahdon2013/stats.json';

function displayTime() {
    var str = "";

    var currentTime = new Date()
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    var seconds = currentTime.getSeconds()

    if (minutes < 10) {
        minutes = "0" + minutes
    }
    if (seconds < 10) {
        seconds = "0" + seconds
    }
    str += hours + ":" + minutes;
    
    return str;
}

var title_suffix = 'Tahdon2013 -allekirjoitusseuranta';

$(document).ready(function() {
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
        $("#stats").text("Allekirjoituksia klo " + displayTime(latest) + ' yhteensä ' + max  + 'kpl.');

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

        document.title = m + ' - ' + title_suffix;

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

     
        var plot = $.plot(placeholder, [{
            data: items,
            label: "Allekirjoituksia"
        },
        {
            data: [
                [items[0][0], 50000],
                [items[items.length - 1][0], 50000]
            ],
            color: "#ff0000",
            label: "Eduskuntakäsittelyn allekirjoitusraja"
        },
        {
            data: [
                [items[0][0], 118453],
                [items[items.length - 1][0], 118453]
            ],
            color: "#0135A5",
            label: "Kristillisdemokraatit (KD) (vaalit 2011)"
        },
        {
            data: [
                [items[0][0], 125785],
                [items[items.length - 1][0], 125785]
            ],
            color: "#007ac9",
            label: "Suomen ruotsalainen kansanpuolue (RKP) (vaalit 2011)"
        },
        {
            data: [
                [items[0][0], 213172],
                [items[items.length - 1][0], 213172]
            ],
            color: "#61bf1a",
            label: "Vihreä liitto (Vihr) (vaalit 2011)"
        },
        {
            data: [
                [items[0][0], 69381],
                [items[items.length - 1][0], 69381]
            ],
            color: "#ccffcc",
            label: "Turkistarhausaloitteen allekirjoittajia"
        },
        ], {
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
        }); 

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
        }], {
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
            }});

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
