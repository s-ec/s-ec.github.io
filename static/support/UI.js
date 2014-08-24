Ext.require(['Ext.tip.QuickTipManager', 'Ext.menu.*', 'Ext.form.field.ComboBox', 'Ext.layout.container.Table', 'Ext.container.ButtonGroup', 'Ext.tab.*', 'Ext.window.*', 'Ext.tip.*', 'Ext.grid.*', 'Ext.layout.container.Border', 'Ext.chart.*']);
// TODO: These are useless, must remove them and refactor eveything that uses them to use socialcalc.rccolname
colnames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ", "AK"];
//exportAsJSON = function(a, b) {
//exportAsJSON_new = function(a, b) {
//packagescripts = function() {
Ext.onReady(function() { 
   // GRID
    /*
gridwin=Ext.create('Ext.window.Window', {
    title: 'Hello',
	closable:true,
    height: 200,
    width: 400,
    layout: 'fit',
    items: {  // Let's put an empty grid in just to illustrate fit layout
        xtype: 'grid',
        border: false,
        columns: [{header: 'World'}],                 // One header just for show. There's no data,
        store: Ext.create('Ext.data.ArrayStore', {}) // A dummy empty data store
    }
});
*/
    
    
    
    // functions to display feedback
    
    
    
    
    
    
    
    
    
    
    Ext.QuickTips.init();
/*
    var dateMenu = Ext.create('Ext.menu.DatePicker', {
        handler: function(dp, date) {
            Ext.example.msg('Date Selected', 'You choose {0}.', Ext.Date.format(date, 'M j, Y'));
        }
    });
*/
    var colorMenu = Ext.create('Ext.menu.ColorPicker', {
        handler: function(cm, color) {
            Ext.example.msg('Color Selected', '<span style="color:#' + color + ';">You choose {0}.</span>', color);
        }
    });
    var store = Ext.create('Ext.data.ArrayStore', {
        fields: ['abbr', 'state'],
        data: Ext.example.states
    });
    /*
    var combo = Ext.create('Ext.form.field.ComboBox', {
        hideLabel: true,
        store: store,
        displayField: 'state',
        typeAhead: true,
        queryMode: 'local',
        triggerAction: 'all',
        emptyText: 'Select a state...',
        selectOnFocus: true,
        width: 135,
        iconCls: 'no-icon'
    });
*/
    
                
    
    menu = Ext.create('Ext.menu.Menu', {
        id: 'mainMenu',
        style: {
            overflow: 'visible' // For the Combo popup
        },
        items: [{
            text: 'Public',
            checked: true, // when checked has a boolean value, it is assumed to be a CheckItem
            checkHandler: onItemCheck
        },
        {text:"Export",menu:{items:[
                {text:"to JSON file",handler:exportAsJSON},
                {text:"to CSV",handler:function(){displayMsg(SocialCalc.Formula.RangeTo2D("A1:"+SocialCalc.rcColname(spreadsheet.sheet.attribs.lastcol)+spreadsheet.sheet.attribs.lastrow).map(function(e){return e.join(",")}).join("\n"),"CSV:");}}
            ]}},        
        {
            text: 'Filter',
            handler: open_filter
        },{
            text: 'Print',
            handler: function(){alert("Our sheet printers are on strike. \n\nPlease click the print icon yourself on the next window.");window.open("/_/"+SocialCalc._room+"/html","_blank");}
        },
        
        {text:"Import",menu:{items:[
                {text:"From Url",handler:function(){ImportFromJString(httpget(_CONFIG.corsproxyserver,_CONFIG.corsproxyport,"/"+prompt("Insert URL to import from:").replace("http://","")))}},
                {text:"From Clipboard",handler:function(){ImportFromJString(prompt("Please paste your JSON:"))}},
                {text:"From XLS",handler:function(){alert("Sorry we don't accept xls files here. Please go wash your hands before resuming your session.")}},
                {text:"From XLSX",handler:function(){alert("Why?")}},
                {text:"From CSV",handler:function(){ld_win.show();}}
                
                
            ]}},
        // TODO: use non systemmodal dialogs, import/export to/from localstorage? add that shiny library
        ,{
            text: 'Empty',
            handler: function(){if(confirm("Are you sure?\nclicking ok will delete the whole sheet.\n\n(You can still ctrl-Z)")){
                    var lastcell=SocialCalc.rcColname(spreadsheet.sheet.attribs.lastcol)+spreadsheet.sheet.attribs.lastrow;
                    spreadsheet.ExecuteCommand("set A1:"+lastcell+" empty");
                }
            }
        },{
            text: 'Email',
            handler: function(){alert("Our email postmen are on strike. Please export to JSON and send your email through your non unionized email provider.")} // TODO: {stop being sarcastic at inappropriate times}
        },'-',
        
        { text:"Import", menu:{items:[
          {text:"JSON", menu:{items:[{text:"From URL",  handler:function(){}},{text:"From Clipboard",  handler:function(){Ext.Msg.prompt("Importing JSON","please paste your JSON",function(a,b){if (a=="ok") ImportFromJString(b); console.log(a,b);},this,true)}},{text:"From File",  handler:function(){alert('ERR TOO OLD STYLE')}} ] } },
          {text:"CSV", menu:{items:[{text:"From URL",  handler:function(){}},{text:"From Clipboard",  handler:function(){}},{text:"From File",  handler:function(){alert('ERR TOO OLD STYLE')}} ] } },
          {text:"XLSx", menu:{items:[{text:"From URL",  handler:function(){}},{text:"From File",  handler:function(){alert('ERR TOO OLD STYLE')}} ] } }
        
        ] } }
        
        /* ,'-', {
            text: 'Choose a Date',
            iconCls: 'calendar',
            menu: dateMenu // <-- submenu by reference
        }, {
            text: 'Choose a Color',
            menu: colorMenu // <-- submenu by reference
        } */
        ]
    });
    
    
    
    viewmenu = Ext.create('Ext.menu.Menu', {
        id: 'viewMenu',
        items: [
        {
            text: 'Low Light Mode',
            checked: false,
            handler: function(a,b){
                      S=document.getElementsByTagName("body")[0].style; 
                      S["-webkit-filter"]="invert(100%)"; S["background-color"]="#000000"; 
                      console.log(a);console.log(b);
                } 
        }
        ,{
            text: 'Show Menus',
            checked: true,
            handler: function(){switchDisplay("toolbar");doresize();}
        }
        ,{
            text: 'Show Toolbar',
            checked: true,
            handler: function(){ switchDisplay("_SC_top");doresize(); }
        }
        ,{
            text: 'Show Legacy Tabs',
            checked: false,
            handler: function(){ switchDisplay("_SC_mid"); doresize();}
        }
        ,{
            text: 'Show Grid',
            checked: true,
            handler: function(){spreadsheet.context.showGrid=false;doresize();LCexec("recalc");}
        }
        ]
    });
    
    extwindows=[];
    
    
    
            
    
    vismenu = Ext.create('Ext.menu.Menu', {
        id: 'visMenu',
        items: [
        {
            text: 'RAW visualizations',
            handler: open_raw
        },{
            text: 'CandleSticks',
            handler: function(a,b){ alert("our candlesticks are currently en route from japan. hold on a minute...")               } 
        },{
            text: 'GoogleVis Explorer',
            handler: open_gvis
        },{
            text: '3d surface plot',
            handler: function(){loadScript("static/support/3ds.js")}
        }, {text:"RT plots",menu:{items:[
                {text:"Dygraphs embedded",handler:function(a,b){open_dygr(true)                }},
                {text:"Dygraphs external",handler:function(){open_dygr(false)}},
                {text: 'Realtime plot', handler: onChartReq        }
            ]}}
        ]
    });
    tb = Ext.create('Ext.toolbar.Toolbar');
    tb.render('toolbar');
    tb.suspendLayouts();
    tb.add({
        text: 'File',
        iconCls: 'bmenu', // <-- icon
        menu: menu // assign menu by instance
    });
       tb.add({
        text: 'View',
        menu: viewmenu // assign menu by instance
    });
    tb.add("-", {
        text: 'Edit',
        toggleGroup: 'panelState',
        tooltip: 'Show cells.',
        enableToggle: true,
        toggleHandler: onRadioToggle,
        pressed: true
    }, {
        text: 'Format',
        toggleGroup: 'panelState',
        tooltip: 'Click here to format selected cells.',
        enableToggle: true,
        toggleHandler: onRadioToggle,
        pressed: false
    }, {
        text: 'Names',
        toggleGroup: 'panelState',
        tooltip: {
            text: 'Click to define a new name and see a list of defined names',
            title: 'Use names instead of cell references'
        },
        enableToggle: true,
        toggleHandler: onRadioToggle,
        pressed: false
    }, "-");
/*
    tb.add({
        text: 'RT Chart',
        tooltip: {
            text: 'Click to chart the contents on the current cells',
            title: 'Realtime Chart'
        },
        handler: onChartReq,
    }, "-");
*/
    tb.add({
        text: 'Visualize',
        menu: vismenu // assign menu by instance
    });
    var scrollMenu = Ext.create('Ext.menu.Menu');
    var sizeObj = {"8":"1","9":"1","10":"1","11":"1","12":"1","14":"1","16":"1","18":"1","24":"1","36":"1","72":"1","144":"1"};
    for (isize in sizeObj) {
        scrollMenu.add({
            text: isize+"px",
            handler: onItemClick
        });
    }
    
    menu.add(' ');
    /*
        // Menus have a rich api for
        // adding and removing elements dynamically
        var item = menu.add({
                text: 'Dynamically added Item'
            });
        // items support full Observable API
        item.on('click', onItemClick);
*/
    /*
        // items can easily be looked up
        menu.add({
                text: 'Disabled Item',
                id: 'disableMe' // <-- Items can also have an id for easy lookup
                // disabled: true   <-- allowed but for sake of example we use long way below
            });
        // access items by id or index
        //menu.items.get('disableMe').disable();
*/
    // scrollable menu
    /*
    tb.add({
        icon: 'preview.png',
        cls: 'x-btn-text-icon',
        text: 'Other Sheets',
        menu: scrollMenu 
    });
	*/
    /*
		    tb.add({
        text: 'Show Charts',
		        tooltip: 'Show charts/graphs window',
        enableToggle: true,
		id:"winSHOW",
		        toggleHandler: onSToggle,
        pressed: false
    },"-");
*/
    tb.add({
        text: 'Help',
        url: 'http://livecalc.uservoice.com/knowledgebase',
        //baseParams: {  q: 'urlparam'},
        tooltip: 'Click here for help.'
    });
/*
    // add a combobox to the toolbar
    combo = Ext.create('Ext.form.field.ComboBox', {
        hideLabel: true,
        store: store,
        displayField: 'state',
        typeAhead: true,
        queryMode: 'local',
        triggerAction: 'all',
        emptyText: 'Update frequency',
        selectOnFocus: true,
        width: 135
    });
    tb.add("-", combo);
*/
    sentalertstore = Ext.create('Ext.data.ArrayStore', {
        fields: [{
            name: "Sent",
            type: "string"
        }, {
            name: "Content",
            type: "string"
        }],
        data: [
            ['01012014', 'Alert logging not yet implemented'],
            ['---', '--']
        ]
    });
    alertstore = Ext.create('Ext.data.ArrayStore', {
        fields: [{
            name: "Cell",
            type: "string"
        }, {
            name: "Contents",
            type: "string"
        }],
        data: []
    });
    charts_win = Ext.create('widget.window', {
        "xtype": "window",
        "height": 242,
        "width": 400,
        "title": "New realtime chart",
        "modal": true,
        "items": [{
            "xtype": "form",
            "layout": {
                "type": "auto"
            },
            "bodyPadding": 8,
            "title": "Pick a name and color. We wont use them anyway",
            "items": [{
                "xtype": "textfield",
                "id": "charts_name_txt",
                "minWidth": 300,
                "width": 340,
                "fieldLabel": "Cell:",
                "labelWidth": 64
            }, {
                "xtype": "textfield",
                "bodyPadding": 8,
                "id": "charts_title_txt",
                "minWidth": 300,
                "width": 340,
                "fieldLabel": "Title (opt.):",
                "labelWidth": 64
            }, {
                "xtype": "colormenu",
                "floating": false,
            }]
        }],
        "dockedItems": [{
            "xtype": "toolbar",
            "dock": "bottom",
            layout: {
                pack: 'end',
                type: 'hbox'
            },
            "items": [
            {
                "xtype": "button",
                "text": "cancel",
                "handler": function(__btn, __event) {
                    charts_win.hide();
                }
            }, {
                "xtype": "button",
                "text": "Create Chart [external]",
                "handler": function(__btn, __event) {
                    window.open("/rtgfx/" + window.top.SocialCalc._room + "/" + top["charts_name_txt-inputEl"].value, "chart" + top["charts_name_txt-inputEl"].value, "menubar=1,resizable=1,width=750,height=350");
                    charts_win.hide();
                }}, {
                "xtype": "button",
                "text": "Create Chart [embedded]",
                "handler": function(__btn, __event) {
                    openwin("/rtgfx/" + window.top.SocialCalc._room + "/" + top["charts_name_txt-inputEl"].value);
                    charts_win.hide();
                }
            }]
        }]
    });
    
    r_win = Ext.create('widget.window', {
        x: 150,
        title: 'R integration',
        collapsible: true, closable: true,
        closeAction: 'hide',
        //animateTarget: this,
        width: 800,
        height: 350,
        layout: 'border',
        bodyStyle: 'padding: 5px;',
        items: [{
            region: 'west',
            title: 'Help',
            width: 100,
            split: true,
            collapsible: true,
            html: "<div style='padding:6px'><%- helphtml.r -%></div>",
            floatable: true
        }, {
            region: 'center',
            xtype: 'tabpanel',
            items: [{
                title: 'Free advanced R functions',
                html: '<div style="padding:6px">Insert list of R functions available here</div>'
            }, {
                title: 'Premium R',
                html: '<div style="padding:6px"><%- helphtml.r_premium -%></div>'
            }, {
                title: 'R spread analysis',
                html: '<div style="padding:6px"><%- helphtml.r_spread -%></div>'
            }]
        }]
    });
    ld_win = Ext.create('widget.window', { // TODO; ld what? replace all over.
        x: 300,
        title: 'Live Data Sources',
        collapsible: true, closable: true,
        closeAction: 'hide',
        //animateTarget: this,
        width: 900,
        height: 350,
        layout: 'border',
        bodyStyle: 'padding: 5px;',
        items: [{
            region: 'west',
            title: 'Help',
            width: 150,
            split: true,
            collapsible: true,
            html: "<div style='padding:6px'><%- helphtml.livedata -%></div>",
            floatable: true
        }, {
            region: 'center',
            xtype: 'tabpanel',
            items: [{
                title: 'Import CSV from URL',
                bodyStyle: 'padding: 5px;',
                xtype: "panel",
                items: [{
                    xtype: 'radiogroup',
                    id: "CSVSEPtxt",
                    width: 400,
                    fieldLabel: 'Separator',
                    items: [{
                        xtype: 'radiofield',
                        boxLabel: 'Comma',
                        toggleGroup: "csv1"
                    }, {
                        xtype: 'radiofield',
                        boxLabel: 'Space',
                        toggleGroup: "csv1"
                    }, {
                        xtype: 'radiofield',
                        boxLabel: 'Semicolon',
                        toggleGroup: "csv1"
                    }]
                }, {
                    xtype: 'textfield',
                    width: 372,
                    id: "CSVURLtxt",
                    fieldLabel: 'insert URL:'
                }],
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'bottom',
                    layout: {
                        pack: 'end',
                        type: 'hbox'
                    },
                    items: [{
                        xtype: 'button',
                        text: 'Import from URL',
                        handler: import_clicked
                    }, {
                        xtype: 'button',
                        text: 'cancel'
                    }]
                }]
            }, {
                title: 'Upload CSV',
                bodyStyle: 'padding: 5px;',
                xtype: "form",
                waitMsgTarget: true,
                items: [{
                    xtype: 'radiogroup',
                    id: "uplSEPtxt",
                    width: 400,
                    fieldLabel: 'Separator',
                    items: [{
                        xtype: 'radiofield',
                        boxLabel: 'Comma'
                    }, {
                        xtype: 'radiofield',
                        boxLabel: 'Space'
                    }, {
                        xtype: 'radiofield',
                        boxLabel: 'Semicolon'
                    }]
                }, {
                    xtype: 'filefield',
                    id: 'form-file',
                    width: 372,
                    emptyText: 'upload a file',
                    fieldLabel: 'CSV Upload',
                    name: 'csvpath',
                    buttonText: '',
                    buttonConfig: {
                        iconCls: 'upload-icon'
                    }
                }],
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'bottom',
                    layout: {
                        pack: 'end',
                        type: 'hbox'
                    },
                    items: [{
                        xtype: 'button',
                        text: 'Upload',
                        handler: function() {
                            var form = this.up('form').getForm();
                            form.submit({
                                url: '/csv/upload',
                                waitMsg: 'Uploading CSV...',
                                success: function(fp, o) {
                                    console.log('Success', 'Processed file  on the server');
                                    console.log(o.result.data[0].someData);
                                    //document.getElementById("CSVURLtxt-inputEl").value="http://recal.cc/tmp/"+o.result.data[0].someData;
                                    console.log(o);
                                    load_external_csv("http://recal.cc/tmp/" + o.result.data[0].someData); // TODO: replace absolute url, find way to serve tmp files from node
                                }
                            });
                        }
                    }, {
                        xtype: 'button',
                        text: 'cancel'
                    }]
                }]
            },{
                layout: 'fit',
                constrain: true,
                title: 'Real Time Symbol List',
                html: '<iframe src="'+_CONFIG.urlpath+'/quote_grid.php" width=100% height=100%></iframe>'
            }, {
                title: 'End of day Symbol List',
                html: '<iframe src="'+_CONFIG.urlpath+'/quote_grid.php" width=100% height=100%></iframe>'
            }]
        }]
    });
    sce_win = Ext.create('widget.window', {
        x: 110,
        title: 'Script Editor',
        maximizable: true,
        collapsible: true, closable: true,
        closeAction: 'hide',
        //animateTarget: this,
        width: 600,
        height: 350,
        layout: 'border',
        bodyStyle: 'padding: 5px;',
        bbar: [{
            xtype: 'tbfill'
        }, {
            xtype: 'button',
            text: 'Execute',
            name: 'vv',
            id: 'vv',
            tooltip: 'Execute this script immediately',
            handler: function() {
                _status_tmp=document.getElementById("SocialCalc-statusline").innerText;
                document.getElementById("SocialCalc-statusline").innerText="EXECUTING SCRIPT";
                Ext.example.msg('Executing', 'Executing Scratchpad contents.');
                setTimeout(function(){eval(top["script1-inputEl"].value);},50);
                document.getElementById("SocialCalc-statusline").innerText=_status_tmp;
            }
        },{
            xtype: 'button',
            text: 'Reload',
            name: 'btnreload',
            id: 'btnreload',
            tooltip: 'Reload scripts (you will lose any changes you made since last open)',
            handler: function() {
                loadscripts();
            }
        }, {
            xtype: 'button',
            text: 'Save',
            name: 'vvws',
            id: 'vvws',
            handler: savescripts
        }
        ],
        items: [{
            region: 'west',
            title: 'Help',
            width: 150,
            split: true,
            collapsible: true,
            html: "<div style='padding:6px'><%- helphtml.scripts -%></div>",
            floatable: true
        }, {
            region: 'center',
            xtype: 'tabpanel',
            id: 'scriptsTab',
            items: [{
                title: 'Scratchpad',
                xtype: 'textarea',
                emptyText: "Write your scripts here",
                value: s_obj.Scratchpad,
                id: 'script1',
                listeners: {
                    afterrender: function() {
                        var me = this;
                        me.el.swallowEvent(['keypress', 'keydown']);
                        sce_win.items.items[2].items.items[0].rawValue = (s_obj.Scratchpad);
                        sce_win.items.items[2].items.items[1].rawValue = (s_obj.onRefresh);
                        sce_win.items.items[2].items.items[2].rawValue = (s_obj.onOpen);
                        sce_win.items.items[2].items.items[0].value = (s_obj.Scratchpad);
                        sce_win.items.items[2].items.items[1].value = (s_obj.onRefresh);
                        sce_win.items.items[2].items.items[2].value = (s_obj.onOpen);
                    }
                }
            }, {
                title: 'onRefresh',
                xtype: 'textarea',
                value: s_obj.onRefresh,
                id: 'script2',
                listeners: {
                    afterrender: function() {
                        var me = this;
                        me.el.swallowEvent(['keypress', 'keydown']);
                    }
                }
            }, {
                title: 'onOpen',
                xtype: 'textarea',
                value: s_obj.onOpen,
                id: 'script3',
                listeners: {
                    afterrender: function() {
                        var me = this;
                        me.el.swallowEvent(['keypress', 'keydown']);
                    }
                }
            }]
        }]
    });
// this is a chrome-only solution to settign a filename for the download. will need to write crossbroser wrapper around these two TODO:
    loadscripts();
    setTimeout(function(){                
        if (window.top.SocialCalc != undefined) {
                    // these should probably be moved somewhere else
                    _s = window.top.SocialCalc;
                    execmd = _s.ExecuteSheetCommand;
                    _co = _s.GetSpreadsheetControlObject();
                    _cels = _s.GetSpreadsheetControlObject().sheet.cells;
                    _lc = window.top.spreadsheet;
                    window.top.spreadsheet.ExecuteCommand("recalc", "");
                    ;
                    LC_exe = window.top.spreadsheet.ExecuteCommand;
                }},5000)
    /*
                if(s_obj["Scratchpad"]) {    top["script1-inputEl"].value=s_obj.Scratchpad;console.log("1");}
                if(s_obj.onRefresh)   {  top["script2-inputEl"].value=s_obj.onRefresh;console.log("1");}
                if(s_obj.onOpen)    { top["script3-inputEl"].value=s_obj.onOpen;console.log("1");}
sce_win.on('show',function() {
             if (_CONFIG["codeloaded"]!=1) {
                if(s_obj["Scratchpad"]) {    top["script1-inputEl"].value=s_obj.Scratchpad;console.log("2");}
                if(s_obj["onRefresh"])   {  top["script2-inputEl"].value=s_obj.onRefresh;console.log("3");}
                if(s_obj["onOpen"])    { top["script3-inputEl"].value=s_obj.onOpen;console.log("4");}
		_CONFIG["codeloaded"]=1; }
});
*/
    sc_win = Ext.create('widget.window', {
        x: 50,
        y: 50,
        title: 'Scripting Console',
        maximizable: true,
        collapsible: true, closable: true,
        closeAction: 'hide',
        //animateTarget: this,
        width: 900,
        height: 500,
        layout: 'border',
        bodyStyle: 'padding: 5px;',
        items: [{
            region: 'west',
            title: 'Help',
            width: 200,
            split: true,
            collapsible: true,
            html: "<div style='padding:6px'><%- helphtml.console -%>... Make sure you know what you're doing .. Try typing <i>this.window.top.SocialCalc</i> in the lower box and see what happens.<br>We've abbreviated it to <i>_s</i> for you.<br><br> Also try the <i>execmd()</i> function..<br><br> <a href='http://fe/reference/executeCommand'>Click here for a command syntax reference.</a></div>",
            floatable: true
        }, {
            region: 'center',
            xtype: "component",
            autoEl: {
                tag: "iframe",
                src: "/js-repl/index.html"
            }
        }]
    });
    ;
    
    tb.add("-", {
        text: 'Auto Recalc',
        enableToggle: true,
        toggleHandler: onRecalcToggle,
        pressed: false
    }, "-", {
        icon: '/static/resources/themes/images/gray/grid/refresh.gif', // icons can also be specified inline
        text: 'Recalc Now',
        cls: 'x-btn-icon',
        tooltip: '<b>Click here to recalc immediately</b>',
        clickEvent: 'mousedown',
        handler: function() {
            Ext.example.msg('Recalculating...', 'Complex sheets may require more time.');
            spreadsheet.ExecuteCommand('recalc', '');
        }
    }, '-');
    tb.add({
        text: "Data Sources",
        tooltip: 'Browse available live data series',
        enableToggle: true,
        id: "ldSHOW",
        toggleHandler: onGenToggle,
        pressed: false
    }, "-");
    /*
        tb.add({
                text: "R integration",
                tooltip: 'Show specific R help',
                enableToggle: true,
                id: "rSHOW",
                toggleHandler: onGenToggle,
                pressed: false
            }, "-");
*/
    tb.add({
        text: 'Live Alerts',
        tooltip: 'Show live alerts window',
        enableToggle: true,
        id: "laSHOW",
        toggleHandler: onGenToggle,
        pressed: false
    }, "-");
    tb.add({
        text: 'Scripts',
        tooltip: 'Access the script editor',
        enableToggle: true,
        id: "sceSHOW",
        toggleHandler: onGenToggle,
        pressed: false
    }, "-");
    tb.add({
        text: 'Console',
        tooltip: 'Access the scripting console',
        enableToggle: true,
        id: "scSHOW",
        toggleHandler: onGenToggle,
        pressed: false
    }, "-");
    
	tb.add(
        Ext.create('Ext.button.Split', {
            text: 'CellFormat',
             //toggleGroup: 'panelState', enableToggle: true,        toggleHandler: onRadioToggle,
            tooltip: {text:'Access common formatting options quickly -- this menu is not currently functional', title:'Warning'},
            menu : {
                items: [{
                    text: '<b>Bold</b>', handler: onItemClick
                }, {
                    text: '<i>Italic</i>', handler: onItemClick
                }, {
                    text: '<u>Underline</u>', handler: onItemClick
                },
                {  text : "Font Size" , menu: scrollMenu },
                
                '-', {
                    text: 'Foreground Color',
                    handler: onItemClick,
                    menu: {
                        showSeparator: false,
                        items: [
                            Ext.create('Ext.ColorPalette', {
                                listeners: {
                                    select: function(cp, color){
                                        Ext.example.msg('Color Selected', 'You chose {0}.', color);
                                         set_crt_range("color #"+color);
                                    }
                                }
                            }) 
                        ]
                    }
                },{
                    text: 'Background Color',
                    handler: onItemClick,
                    menu: {
                        showSeparator: false,
                        items: [
                            Ext.create('Ext.ColorPalette', {
                                listeners: {
                                    select: function(cp, color){
                                        Ext.example.msg('Color Selected', 'You chose {0}.', color);
                                        set_crt_range("bgcolor #"+color);
                                    }
                                }
                            }) 
                        ]
                    }
                },'-',
                            {
                                text: 'More Formatting Options...',
                                handler: onItemClick
                            }]
            }
        }));
    tb.resumeLayouts(true);
    ////
    var win,
    button = Ext.get('show-btn');
    //button = Ext.get('winSHOW-btnEl');
    button.on('click', function() {
        if (!win) {
            win = Ext.create('widget.window', {
                title: 'Layout Window',
                collapsible: true, closable: true,
                closeAction: 'hide',
                //animateTarget: this,
                width: 600,
                height: 350,
                layout: 'border',
                bodyStyle: 'padding: 5px;',
                items: [{
                    region: 'west',
                    title: 'Navigation',
                    width: 200,
                    split: true,
                    collapsible: true,
                    floatable: false
                }, {
                    region: 'center',
                    xtype: 'tabpanel',
                    items: [{
                        title: 'RTGFX',
                        html: 'Hello world 1'
                    }, {
                        title: 'Symbol List',
                        html: 'Hello world 2'
                    }, {
                        title: 'Online Help',
                        html: 'Hello world 3',
                        closable: true
                    }, {
                        title: 'Support',
                        html: 'Hello world 4',
                        closable: true
                    }]
                }]
            });
        }
        button.dom.disabled = true;
        if (win.isVisible()) {
            win.hide(this, function() {
                button.dom.disabled = false;
            });
        }
        else {
            win.show(this, function() {
                button.dom.disabled = false;
            });
        }
    });
    /// plugin menu
    
;
try { pluginObj = JSON.parse(httpget("oauthbouncer.herokuapp.com",80,"/http://u-f.github.io/addons.json")) } catch (e) {pluginObj={}}
var pluginmenuitems=[];
for (var eael in pluginObj) {
pluginmenuitems.push({text:pluginObj[eael].Name,handler:pluginload  })
}
//console.log(pluginmenuitems);
if (pluginmenuitems.length) {
    pluginmenu = Ext.create('Ext.menu.Menu', {
        id: 'pluginMenu',
        items: pluginmenuitems
    });
   tb.add({
        text: 'AddOns',
       // iconCls: 'bmenu', // <-- icon
        menu: pluginmenu
    });
}
   /// end of plugin menu
}); // end of onready
