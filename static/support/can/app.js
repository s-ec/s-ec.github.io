daje = function() {
    $.getJSON('dati.json', function(data) {

        // create the chart
        $('#container').highcharts('StockChart', {


            //			title: {
            //				text: '....'
            //			},

            rangeSelector: {
                buttons: [/*{
                    type: 'minute',
                    count: 5,
                    text: '5m'
                },*/ {
                    type: 'hour',
                    count: 1,
                    text: '1h'
                }, {
                    type: 'day',
                    count: 1,
                    text: '1D'
                }, {
                    type: 'all',
                    count: 1,
                    text: 'All'
                }],
                selected: 1,
                inputEnabled: false
            },

            series: [{
                name: 'WHTV',
                type: 'candlestick',
                data: data,
                tooltip: {
                    valueDecimals: 4
                }
            }]
        });
    });
}
