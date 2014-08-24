wholesheet = function(){
    return 'A1:' + SocialCalc.rcColname(spreadsheet.sheet.attribs.lastcol) + spreadsheet.sheet.attribs.lastrow;
}

exportAsJSON_old = function(a,b){
    var exobj = {
            save: _co.CreateSheetSave() + '\ncopiedfrom:' + wholesheet() + '\n',
            extinfo: JSON.parse(httpget(_CONFIG.Wserver, _CONFIG.Wport, '/HGETALL/rs-' + _room + ''))['HGETALL']
        };
    displayMsg(JSON.stringify(exobj), 'Exported sheet:');
}

exportAsJSON = function(a,b){
    var exobj = {
            save: _co.CreateSheetSave() + '\ncopiedfrom:' + wholesheet() + '\n',
            extinfo: { scripts: window.btoa(packagescripts()) }
        };
    displayMsg(JSON.stringify(exobj), 'Exported sheet:');
}

packagescripts = function(){
    saveobj = {
        Scratchpad: sce_win.items.items[2].items.items[0].rawValue,
        onRefresh: sce_win.items.items[2].items.items[1].rawValue,
        onOpen: sce_win.items.items[2].items.items[2].rawValue
    };
    if (top.extwindows)
        saveobj['extwindows'] = top.extwindows.map(function (e) {
            e.wref = null;
            return e;
        });
    console.log(JSON.stringify(saveobj));
    return JSON.stringify(saveobj);
}

savescripts = function(){
    httppost(_CONFIG.Wserver, _CONFIG.Wport, '/', 'HSET/rs-' + _room + '/scripts/' + encodeURIComponent(window.btoa(packagescripts())));
}

onSToggle = function(item,pressed){
    if (!win) {
        win = Ext.create('widget.window', {
            title: 'Layout Window',
            collapsible: true,
            closable: true,
            closeAction: 'hide',
            width: 600,
            height: 350,
            layout: 'border',
            bodyStyle: 'padding: 5px;',
            items: [
                {
                    region: 'west',
                    title: 'Navigation',
                    width: 200,
                    split: true,
                    collapsible: true,
                    floatable: false
                },
                {
                    region: 'center',
                    xtype: 'tabpanel',
                    items: [
                        {
                            title: 'RTGFX',
                            html: 'Hello world 1'
                        },
                        {
                            title: 'Online Help',
                            html: 'Hello world 3',
                            closable: true
                        },
                        {
                            title: 'Support',
                            html: 'Hello world 4',
                            closable: true
                        }
                    ]
                }
            ]
        });
    }
    button.dom.disabled = true;
    if (win.isVisible()) {
        win.hide(this, function () {
            button.dom.disabled = false;
        });
    } else {
        win.show(this, function () {
            button.dom.disabled = false;
        });
    }
}

onRecalcToggle = function(item,pressed){
    global_recalc_on = pressed;
    Ext.example.msg('Button Toggled', 'Button "{0}" was toggled to {1}.', item.text, pressed);
}

onRadioToggle = function(item,pressed){
    var s_c_o = SocialCalc.GetSpreadsheetControlObject();
    if (pressed) {
        if (item.text == 'Edit')
            SocialCalc.SetTab(document.getElementById('SocialCalc-edittab'));
        if (item.text == 'Names')
            SocialCalc.SetTab(document.getElementById('SocialCalc-namestab'));
        if (item.text == 'Format')
            SocialCalc.SetTab(document.getElementById('SocialCalc-settingstab'));
    }
    console.log(item);
}

onButtonClick = function(btn){
    Ext.example.msg('Button Click', 'You clicked the "{0}" button.', btn.text);
}

onChartReq = function(btn){
    charts_win.show();
    top['charts_name_txt-inputEl'].value = top.spreadsheet.editor.ecell.coord;
}

import_clicked = function(a,b){
    load_external_csv('http://' + _CONFIG.corsproxyserver + '/' + document.getElementById('CSVURLtxt-inputEl').value.replace('http://', ''));
}

upload_clicked = function(a,b){
    Ext.example.msg('Button Toggled', 'Button "{0}" was clicked.', a.text);
}

load_external_csv = function(url,c_os,r_os){
    var http_requesti = new XMLHttpRequest();
    http_requesti.open('GET', url, true);
    http_requesti.onreadystatechange = function () {
        if (http_requesti.readyState == 4 && http_requesti.status == 200) {
            Importcsv(http_requesti.responseText, c_os, r_os);
        } else {
            Importcsv('network error, csv import failed', c_os, r_os);
        }
    };
    http_requesti.send(null);
}

http_requesti.onreadystatechange = function(){
    if (http_requesti.readyState == 4 && http_requesti.status == 200) {
        Importcsv(http_requesti.responseText, c_os, r_os);
    } else {
        Importcsv('network error, csv import failed', c_os, r_os);
    }
}

isNumber = function(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
}

Importcsv = function(content,coloffset,rowoffset){
    rowoffset = rowoffset == undefined ? 0 : rowoffset;
    coloffset = coloffset == undefined ? 0 : coloffset;
    carr = CSVToArray(content, ',');
    var tmp = '';
    var lastcell = '';
    var c_str = '';
    var row = 0;
    var csvel = '';
    for (cl in carr) {
        row++;
        for (col in carr[cl]) {
            if (carr[cl].length > 0) {
                csvel = carr[cl][col];
                if (csvel == ' NaN ')
                    csvel = '0';
                lastcell = colnames[+col + eval(coloffset)] + (+row + rowoffset);
                if (isNumber(csvel)) {
                    c_str = c_str + 'set ' + lastcell + ' value n ' + csvel + '\n';
                } else {
                    if (csvel != '') {
                        c_str = c_str + 'set ' + lastcell + ' text t ' + csvel + '\n';
                    }
                }
            } else {
                console.log('row  number' + row + ' looks empty');
            }
        }
    }
    window.top.spreadsheet.ExecuteCommand(c_str, '');
    return {
        'lastcell': lastcell,
        lastrow: row + rowoffset,
        lastcol: +col + coloffset
    };
}

onItemClick = function(item){
    Ext.example.msg('Menu Click', 'You clicked the "{0}" menu item.', item.text);
}

onItemCheck = function(item,checked){
    Ext.example.msg('Item Check', 'You {1} the "{0}" menu item.', item.text, checked ? 'checked' : 'unchecked');
}

onItemToggle = function(item,pressed){
    Ext.example.msg('Button Toggled', 'Button "{0}" was toggled to {1}.', item.text, pressed);
}

ImportFromJString = function(istr){
    var routo = JSON.parse(istr);
    console.log(routo);
    sss = routo['save'];
    spreadsheet.ExecuteCommand('loadclipboard ' + SocialCalc.encodeForSave(sss) + '\npaste A1 all\n');
    s_obj = JSON.parse(window.atob(routo['extinfo']['scripts']));
    console.log(s_obj);
    sce_win.items.items[2].items.items[0].rawValue = s_obj.Scratchpad;
    sce_win.items.items[2].items.items[1].rawValue = s_obj.onRefresh;
    sce_win.items.items[2].items.items[2].rawValue = s_obj.onOpen;
    sce_win.items.items[2].items.items[0].value = s_obj.Scratchpad;
    sce_win.items.items[2].items.items[1].value = s_obj.onRefresh;
    sce_win.items.items[2].items.items[2].value = s_obj.onOpen;
    savescripts();
    eval(s_obj.onOpen);
}

open_filter = function(){
    var rr = spreadsheet.editor.range;
    _BIG_ARR = SocialCalc.Formula.RangeTo2D('A1:' + SocialCalc.rcColname(spreadsheet.sheet.attribs.lastcol) + spreadsheet.sheet.attribs.lastrow);
    _FLT_HEADER = SocialCalc.Formula.RangeTo2D('A1:' + SocialCalc.rcColname(spreadsheet.sheet.attribs.lastcol) + '1')[0];
    _FLT_FIRSTROW = SocialCalc.Formula.RangeTo2D('A2:' + SocialCalc.rcColname(spreadsheet.sheet.attribs.lastcol) + '2')[0];
    _FLT_TYPE = _FLT_FIRSTROW.map(isNumber);
    gv = window.open('static/support/e/x/index.html', '_blank');
}

switchDisplay = function(s){
    var el = document.getElementById(s);
    el.style.display = el.style.display == 'block' || el.style.display == undefined ? el.style.display = 'none' : el.style.display = 'block';
}

open_grid = function(withheaders,external){
    withheaders = withheaders === undefined ? true : withheaders;
    external = external === undefined ? false : external;
    var rr = spreadsheet.editor.range;
    var gv = external == true ? window.open('static/support/generic_grid.html', '_blank') : openwin('static/support/generic_grid.html');
    extwindows.push({
        typ: 'GRD',
        wref: gv,
        range: spreadsheet.editor.range,
        datarr: SocialCalc.Formula.RangeTo2D(SocialCalc.rcColname(rr.left) + rr.top + ':' + SocialCalc.rcColname(rr.right) + rr.bottom),
        withheaders: withheaders,
        humanrange: SocialCalc.rcColname(rr.left) + rr.top + ':' + SocialCalc.rcColname(rr.right) + rr.bottom
    });
}

open_dygr = function(external){
    var rr = spreadsheet.editor.range;
    _DYGR_CSV = SocialCalc.Formula.RangeTo2D(SocialCalc.rcColname(rr.left) + rr.top + ':' + SocialCalc.rcColname(rr.right) + rr.bottom);
    var gv = external != true ? window.open('static/support/dygraphs.html', '_blank') : openwin('static/support/dygraphs.html');
    extwindows.push({
        typ: 'DYG',
        wref: gv,
        range: spreadsheet.editor.range,
        humanrange: SocialCalc.rcColname(rr.left) + rr.top + ':' + SocialCalc.rcColname(rr.right) + rr.bottom
    });
}

open_raw = function(){
    var rr = spreadsheet.editor.range;
    _RAW_CSV = SocialCalc.Formula.RangeTo2D(SocialCalc.rcColname(rr.left) + rr.top + ':' + SocialCalc.rcColname(rr.right) + rr.bottom).map(function (e) {
        return e.join(',');
    }).join('\n');
    var gv = window.open('raw/', '_blank');
    extwindows.push({
        typ: 'RAW',
        wref: gv,
        range: spreadsheet.editor.range,
        humanrange: SocialCalc.rcColname(rr.left) + rr.top + ':' + SocialCalc.rcColname(rr.right) + rr.bottom
    });
}

open_gvis = function(){
    var rr = spreadsheet.editor.range;
    _GVIS_ARR = SocialCalc.Formula.RangeTo2D(SocialCalc.rcColname(rr.left) + rr.top + ':' + SocialCalc.rcColname(rr.right) + rr.bottom);
    var gv = window.open('static/support/chartedit.htm', '_blank');
    extwindows.push({
        typ: 'GVIS',
        wref: gv,
        range: spreadsheet.editor.range,
        humanrange: SocialCalc.rcColname(rr.left) + rr.top + ':' + SocialCalc.rcColname(rr.right) + rr.bottom
    });
}

refreshAlerts = function(){
    Ext.getCmp('alert_grid_exist').store.remove(Ext.getCmp('alert_grid_exist').store.getRange());
    var tctr = 0;
    for (each in window.top.SocialCalc.GetSpreadsheetControlObject().sheet.cells) {
        var tmpv = window.top.SocialCalc.GetSpreadsheetControlObject().sheet.cells[each].formula;
        if (tmpv.indexOf('EMAIL') > -1 || tmpv.indexOf('TWEET') > -1 || tmpv.indexOf('DM(') > -1 || tmpv.indexOf('DMIF') > -1) {
            Ext.getCmp('alert_grid_exist').store.add({
                Cell: each,
                Contents: tmpv
            });
            tctr++;
        }
    }
    if (tctr == 0)
        Ext.getCmp('alert_grid_exist').store.add({
            Cell: '---',
            Contents: 'There are no configured alerts on this sheet.'
        });
}

tEval = function(s){
    eval(s);
}

download = function(s){
    function dataUrl(data) {
        return 'data:x-application/text,' + escape(data);
    }
    window.open(dataUrl(s));
}

dataUrl = function(data){
    return 'data:x-application/text,' + escape(data);
}

downloadWithName = function(data,name){
    var uri = 'data:x-application/text,' + escape(data);
    function eventFire(el, etype) {
        if (el.fireEvent) {
            el.fireEvent('on' + etype);
        } else {
            var evObj = document.createEvent('Events');
            evObj.initEvent(etype, true, false);
            el.dispatchEvent(evObj);
        }
    }
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;
    eventFire(link, 'click');
}

eventFire = function(el,etype){
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}

opendivwin = function(contents,wintitle,wid,hei){
    wintitle = wintitle == undefined ? 'Message Window' : wintitle;
    wid = wid == undefined ? 810 : wid;
    hei = hei == undefined ? 420 : hei;
    var rnd = Math.random();
    var winname = 'div_win' + rnd;
    top[winname] = Ext.create('widget.window', {
        x: 12,
        title: wintitle,
        maximizable: true,
        resizable: true,
        collapsible: true,
        closable: true,
        closeAction: 'destroy',
        width: wid,
        height: hei,
        layout: 'fit',
        bodyStyle: 'padding: 5px;',
        items: [{
                id: 'DIV' + rnd,
                html: contents
            }]
    });
    top[winname].show();
    return document.getElementById('DIV' + rnd + '-body');
}

openwin = function(url,wintitle){
    wintitle = wintitle == undefined ? 'Message Window' : wintitle;
    var rnd = Math.random();
    var winname = 'msg_win' + rnd;
    top[winname] = Ext.create('widget.window', {
        x: 12,
        title: wintitle,
        maximizable: true,
        resizable: true,
        collapsible: true,
        closable: true,
        closeAction: 'destroy',
        width: 600,
        height: 350,
        layout: 'fit',
        bodyStyle: 'padding: 5px;',
        tools: [
            {
                type: 'plus',
                tooltip: 'Unpin window (creates an external window)',
                handler: function (event, toolEl, panel) {
                    alert('soon');
                }
            },
            {
                type: 'help',
                tooltip: 'Get Help',
                handler: function (event, toolEl, panel) {
                    alert('there is no help');
                }
            }
        ],
        items: [{
                region: 'center',
                id: 'FRAME' + rnd,
                xtype: 'component',
                autoEl: {
                    tag: 'iframe',
                    src: url == undefined ? 'about:blank' : url
                }
            }]
    });
    top[winname].show();
    return Ext.getCmp('FRAME' + rnd).el.dom.contentWindow;
}

displayMsg = function(msg,wintitle){
    wintitle = wintitle == undefined ? 'Message Window' : wintitle;
    var rnd = Math.random();
    var winname = 'msg_win' + rnd;
    top[winname] = Ext.create('widget.window', {
        x: 12,
        title: wintitle,
        maximizable: true,
        resizable: true,
        collapsible: true,
        closable: true,
        closeAction: 'destroy',
        width: 600,
        height: 350,
        layout: 'fit',
        bodyStyle: 'padding: 5px;',
        bbar: [
            { xtype: 'tbfill' },
            {
                xtype: 'button',
                text: 'Email',
                name: 'emailbtn' + rnd,
                id: 'emailbtn' + rnd,
                tooltip: 'Email',
                handler: function () {
                    alert('unimplemented yet sorry');
                }
            },
            {
                xtype: 'button',
                text: 'Download',
                name: 'btndownload' + rnd,
                id: 'btndownload' + rnd,
                tooltip: 'Download to file',
                handler: function () {
                    downloadWithName(msg, SocialCalc._room + '.export.json');
                }
            }
        ],
        items: [{
                title: 'Output',
                xtype: 'textarea',
                emptyText: '',
                value: msg,
                id: 'msgarea' + rnd,
                listeners: {
                    afterrender: function () {
                        var me = this;
                        me.el.swallowEvent([
                            'keypress',
                            'keydown'
                        ]);
                    }
                }
            }]
    });
    top[winname].show();
    return winname;
}

loadscripts = function(){
    url = 'http://' + _CONFIG.Wserver + ':' + _CONFIG.Wport + _CONFIG.Wprefix + 'rs-' + _room + '/scripts';
    var http_requesti = new XMLHttpRequest();
    http_requesti.open('GET', url, true);
    http_requesti.onreadystatechange = function () {
        console.log('readystate:' + http_requesti.readyState);
        console.log('status:' + http_requesti.status);
        if (http_requesti.readyState == 4 && http_requesti.status == 200) {
            tmp_obj = JSON.parse(http_requesti.responseText);
            console.log(tmp_obj);
            if (tmp_obj['HGET'] != undefined) {
                console.log('parsing');
                s_obj = JSON.parse(window.atob(tmp_obj.HGET));
                console.log(s_obj);
                sce_win.items.items[2].items.items[0].rawValue = s_obj.Scratchpad;
                sce_win.items.items[2].items.items[1].rawValue = s_obj.onRefresh;
                sce_win.items.items[2].items.items[2].rawValue = s_obj.onOpen;
                sce_win.items.items[2].items.items[0].value = s_obj.Scratchpad;
                sce_win.items.items[2].items.items[1].value = s_obj.onRefresh;
                sce_win.items.items[2].items.items[2].value = s_obj.onOpen;
                if (s_obj.extwindows != null && s_obj.extwindows != undefined)
                    top.extwindows = s_obj.extwindows;
                eval(s_obj.onOpen);
            } else {
                console.log('script is empty');
                console.log(tmp_obj);
            }
        }
    };
    http_requesti.send(null);
}

http_requesti.onreadystatechange = function(){
    console.log('readystate:' + http_requesti.readyState);
    console.log('status:' + http_requesti.status);
    if (http_requesti.readyState == 4 && http_requesti.status == 200) {
        tmp_obj = JSON.parse(http_requesti.responseText);
        console.log(tmp_obj);
        if (tmp_obj['HGET'] != undefined) {
            console.log('parsing');
            s_obj = JSON.parse(window.atob(tmp_obj.HGET));
            console.log(s_obj);
            sce_win.items.items[2].items.items[0].rawValue = s_obj.Scratchpad;
            sce_win.items.items[2].items.items[1].rawValue = s_obj.onRefresh;
            sce_win.items.items[2].items.items[2].rawValue = s_obj.onOpen;
            sce_win.items.items[2].items.items[0].value = s_obj.Scratchpad;
            sce_win.items.items[2].items.items[1].value = s_obj.onRefresh;
            sce_win.items.items[2].items.items[2].value = s_obj.onOpen;
            if (s_obj.extwindows != null && s_obj.extwindows != undefined)
                top.extwindows = s_obj.extwindows;
            eval(s_obj.onOpen);
        } else {
            console.log('script is empty');
            console.log(tmp_obj);
        }
    }
}

LCexec = function(cmdstring){
    window.top.spreadsheet.ExecuteCommand(cmdstring, '');
}

onRToggle = function(){
    ld_win.show();
}

onGenToggle = function(item,pressed){
    if (item.text == 'Data Sources') {
        if (pressed)
            ld_win.show();
        else
            ld_win.hide();
    }
    if (item.text == 'R integration') {
        if (pressed)
            r_win.show();
        else
            r_win.hide();
    }
    if (item.text == 'Live Alerts') {
        refreshAlerts();
        if (pressed)
            alerts_win.show();
        else
            alerts_win.hide();
    }
    if (item.text == 'Console') {
        if (pressed)
            sc_win.show();
        else
            sc_win.hide();
    }
    if (item.text == 'Scripts') {
        if (pressed)
            sce_win.show();
        else
            sce_win.hide();
    }
}

set_crt_range = function(s){
    var rr = spreadsheet.editor.range;
    var cstr = 'set ' + (SocialCalc.rcColname(rr.left) + rr.top + ':' + SocialCalc.rcColname(rr.right) + rr.bottom) + ' ' + s;
    LCexec(cstr);
    console.log(cstr);
}

pluginload = function(a,b){
    loadScriptArray(pluginObj.filter(function (c) {
        return c.Name == a.text;
    })[0].URL_ARR);
}

