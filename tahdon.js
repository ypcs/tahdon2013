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
        
        


        items.sort(function(a, b) {
            return a[0] - b[0];
        });

        var m = 0, md = 0;
        
        for (var i=0; i<items.length; i++) {
            // fix utc => utc+2
            items[i][0] = (items[i][0] + 2 * 3600)* 1000.0;
            if (items[i][1] > m) {m = items[i][1];}
            if (items[i][0] > md) {md = items[i][0];}
        }
        
        var dm = new Date(md);
        $("#stats").text("Allekirjoituksia klo " + displayTime(latest) + ' yhteensä ' + m  + 'kpl.');
        
        var plot = $.plot('#chart', [{
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
                [items[0][0], 120000],
                [items[items.length - 1][0], 120000]
            ],
            color: "#ff55ff",
            label: "Pieni eduskuntaryhmä"
        },
        /*{
            data: [
                [items[0][0], 522931],
                [items[items.length - 1][0], 522931]
            ],
            color: "#ffff00",
            label: "Helmikuussa 1899 kerättiin Suomen valtiopäivien asemaa puolustavaan Suomen adressiin 522 931 allekirjoitusta 11 päivässä"
        },*/
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
            }
        }); 

        var legends = $("#chart .legendlabel");
        legends.each(function() {
            $(this).css('width', $(this).width());
        });

        var previousPoint = null;
        $("#chart").bind("plothover", function (event, pos, item) {          
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
    });
});
