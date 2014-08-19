/*global Ext:false */
/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/

function isDigit_(char) {
  return char >= '0' && char <= '9';
}
 
// Given a JavaScript 2d Array, this function returns the transposed table.
// Arguments:
//   - data: JavaScript 2d Array
// Returns a JavaScript 2d Array
// Example: arrayTranspose([[1,2,3],[4,5,6]]) returns [[1,4],[2,5],[3,6]].
function arrayTranspose_(data) {
  if (data.length == 0 || data[0].length == 0) {
    return null;
  }
 
  var ret = [];
  for (var i = 0; i < data[0].length; ++i) {
    ret.push([]);
  }
 
  for (var i = 0; i < data.length; ++i) {
    for (var j = 0; j < data[i].length; ++j) {
      ret[j][i] = data[i][j];
    }
  }
 
  return ret;
}


Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath('Ext.ux', 'ux');
Ext.require([
    'Ext.grid.*',
    'Ext.data.*',
    'Ext.ux.grid.FiltersFeature',
    'Ext.toolbar.Paging'
]);



Ext.onReady(function(){

    Ext.QuickTips.init();

    // for this demo configure local and remote urls for demo purposes
    var url = {
        local:  'grid-filter.json',  // static data file
        remote: 'grid-filter.php'
    };

    // configure whether filter query is encoded or not (initially)
    var encode = false;
    
    // configure whether filtering is performed locally or remotely (initially)
    var local = true;

/*
    store = Ext.create('Ext.data.JsonStore', {
        // store configs
        autoDestroy: true,
        model: 'Product',
        proxy: {
            type: 'ajax',
            url: (local ? url.local : url.remote),
            reader: {
                type: 'json',
                root: 'data',
                idProperty: 'id',
                totalProperty: 'total'
            }
        },
        remoteSort: false,
        sorters: [{
            property: 'company',
            direction: 'ASC'
        }],
        pageSize: 50
    });
*/



myStore = new Ext.data.ArrayStore({
    fields: window.opener._FLT_HEADER,
    idIndex: 0 // id for each record will be the first element
});

myData=window.opener._BIG_ARR;
myStore.loadData(myData);

cols=[];

for (ea in window.opener._FLT_HEADER)
{
	if (window.opener._FLT_TYPE[ea]) { // its a number
	cols.push({
            dataIndex: window.opener._FLT_HEADER[ea],
            text: window.opener._FLT_HEADER[ea],
            filter: {
                type: 'numeric'  
            }
        });
	}
	else {
	cols.push({
            dataIndex:  window.opener._FLT_HEADER[ea],
            text:  window.opener._FLT_HEADER[ea],
            id:  window.opener._FLT_HEADER[ea],
            flex: 1,
            filter: {
                type: 'string'
            }
        });
	}
}





    var filters = {
        ftype: 'filters',
        // encode and local configuration options defined previously for easier reuse
        encode: encode, // json encode the filter query
        local: local,   // defaults to false (remote filtering)

        // Filters are most naturally placed in the column definition, but can also be
        // added here.
        filters: [
            {
                type: 'boolean',
                dataIndex: 'visible'
            }
        ]
    };

    // use a factory method to reduce code while demonstrating
    // that the GridFilter plugin may be configured with or without
    // the filter types (the filters may be specified on the column model
    var createColumns = function (finish, start) {

        var columns = [{
            dataIndex: 'id',
            text: 'Id',
            // instead of specifying filter config just specify filterable=true
            // to use store's field's type property (if type property not
            // explicitly specified in store config it will be 'auto' which
            // GridFilters will assume to be 'StringFilter'
            filterable: true,
            width: 30
            //,filter: {type: 'numeric'}
        }, {
            dataIndex: 'name',
            text: 'name',
            id: 'name',
            flex: 1,
            filter: {
                type: 'string'
                // specify disabled to disable the filter menu
                //, disabled: true
            }
        }, {
            dataIndex: 'nid',
            text: 'nid',
            filter: {
                type: 'numeric'  // specify type here or in store fields config
            },
            width: 70
        }, {
            dataIndex: 'size',
            text: 'Size',
            filter: {
                type: 'list',
                options: ['small', 'medium', 'large', 'extra large']
                //,phpMode: true
            }
        }, {
            dataIndex: 'date',
            text: 'Date',
            filter: true,
            renderer: Ext.util.Format.dateRenderer('m/d/Y')
        }, {
            dataIndex: 'visible',
            text: 'Visible'
            // this column's filter is defined in the filters feature config
        }];

        return columns.slice(start || 0, finish);
    };
    window.document.title="Filtering..";
    grid = Ext.create('Ext.grid.Panel', {
        renderTo: Ext.getBody(),
        border: false,
        store: myStore,
        columns: cols,
        loadMask: true,
        features: [filters],
        dockedItems: [Ext.create('Ext.toolbar.Paging', {
            dock: 'top',
            store: myStore
        })]
    });

    // add some buttons to bottom toolbar just for demonstration purposes
document.getElementById(grid.child('pagingtoolbar').id).style.position="fixed";
document.getElementById(grid.child('headercontainer').id).style.position="fixed";

function makecsv(its){
    		        var csv="";
		        for (num in its) {
		            var cuel= its[num].data;
		            for (ea in cuel) { // this would fail if they werent properly ordered, but they are
		              csv+=cuel[ea]+",";
		            }
                csv+="\n";
		        }
    return csv;
    }

    grid.child('pagingtoolbar').add([
        '->',
        {
            text: 'Export to CSV',
            handler: function (button, state) {
            csv=makecsv(grid.store.data.items);
		    var myWindow=window.open('');
            myWindow.document.write("<pre>"+csv+"</pre>");        
            } 
        },
        {
            text: 'All Filter Data',
            tooltip: 'Get Filter Data for Grid',
            handler: function () {
                var data = Ext.encode(grid.filters.getFilterData());
                Ext.Msg.alert('All Filter Data',data);
            } 
        },{
            text: 'Clear Filter Data',
            handler: function () {
                grid.filters.clearFilters();
            } 
        },{
            text: 'Export to new sheet',
            handler: function () {
			alert("not implemented yet");
                }
            }
    
    ]);


grid.show();
});
