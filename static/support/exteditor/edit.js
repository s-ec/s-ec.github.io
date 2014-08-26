
if (typeof origintop=="undefined" || origintop==null)
refwin=top;
else
refwin=origintop;
console.log("refwin:");console.log(refwin);
console.log("top:");console.log(top);
console.log(typeof origintop);
console.log(origintop);


eurl= '/static/support/exteditor/miniace.htm';
rnd=Math.random();

checkVal =function(cname){
    var t =Ext.getCmp("chex").items.items;
    for (var it in t) {if (t[it].boxLabel==cname) return t[it].value  }
    }

checkProp =function(cname){
    var t =Ext.getCmp("pgrid").getStore().data.items;
    for (var it in t) {if (t[it].data["name"]==cname) return t[it].data["value"]  }
    }
    
    /*
                    sce_win.items.items[2].items.items[0].rawValue = (s_obj.Scratchpad);
                    sce_win.items.items[2].items.items[1].rawValue = (s_obj.onRefresh);
                    sce_win.items.items[2].items.items[2].rawValue = (s_obj.onOpen);
                    sce_win.items.items[2].items.items[0].value = (s_obj.Scratchpad);
                    sce_win.items.items[2].items.items[1].value = (s_obj.onRefresh);
                    sce_win.items.items[2].items.items[2].value = (s_obj.onOpen);
                    
                saveobj = {
                    Scratchpad: (sce_win.items.items[2].items.items[0].rawValue),
                    onRefresh: (sce_win.items.items[2].items.items[1].rawValue),
                    onOpen: (sce_win.items.items[2].items.items[2].rawValue)
                };
                
                top["script1-inputEl"].value
                    */

savescriptsnew = function()            {     /*
                            localStorage.setItem('script1', top["script1-inputEl"].value);
                            localStorage.setItem('script2', top["script2-inputEl"].value);
                            localStorage.setItem('script3', top["script3-inputEl"].value);
			    console.log(top["script1-inputEl"].value);*/
                saveobj = {
                    Scratchpad: (refwin.s_obj["Scratchpad"]),
                    onRefresh: (refwin.s_obj["onRefresh"]),
                    onOpen: (refwin.s_obj["onOpen"])
                };
                if (refwin.extwindows) saveobj["extwindows"]=refwin.extwindows.map(function(e){e.wref=null;return e});
                console.log((JSON.stringify(saveobj)));
                refwin.httppost(_CONFIG.Wserver, _CONFIG.Wport, "/", "HSET/rs-" + _room + "/scripts/" + encodeURIComponent(window.btoa(JSON.stringify(saveobj))));
                //Ext.example.msg('Warning', 'Function is not yet implemented');
}    

        bbar= [{
            xtype: 'tbfill'
        }, {
            xtype: 'button',
            text: 'Execute Scratchpad',
            name: 'exec'+rnd,
            id: 'exec'+rnd,
            tooltip: 'exec',
            handler: function() {
                refwin.tEval(refwin.diseditor["Scratchpad"].getSession().getValue()); // may need changing to support multiple wins?
            }
        },{
            xtype: 'button',
            text: 'Save',
            name: 'snarf'+rnd,
            id: 'snarf'+rnd,
            tooltip: 'save',
            handler: function() {
                savescriptsnew();
            }
        },{
            xtype: 'button',
            text: 'Exec Selection',
            name: 'sstop'+rnd,
            id: 'sstop'+rnd,
            tooltip: 'Download to file',
            handler: function() {
                console.log(refwin.diseditor["Scratchpad"].getCopyText()) ;
                refwin.tEval(refwin.diseditor["Scratchpad"].getCopyText())  ; // must change to get currently focused tab. should. never will.
            }
        } 

        ];


displayWin = function(wintitle,itemsObj,bbarobj) {
        wintitle = (wintitle == undefined) ? "Script Editor" : wintitle;
        var rnd=Math.random();
        var winname = "msg_win"+rnd;
        top[winname] = Ext.create('widget.window', {
        x: 12,
        title: wintitle,
        bbar:bbarobj,
        maximizable: true,
        resizable:true,
        collapsible: true, closable: true,
        closeAction: 'destroy',
        //animateTarget: this,
        width: 700,
        height: 450,
        layout: 'fit',
        bodyStyle: 'padding: 5px;',
        items: itemsObj
    });
        top[winname].show();
return (winname); // need to return a pointer to the msgarea instead . use .replace("_win","area") for now : Ext.getCmp(xx.replace("_win","area")).setValue("12") // where xx = winname
}

buildFSUI= function(obj){
    _exteditpanel=Ext.create('Ext.panel.Panel', {
        layout: 'fit',
                  width: '100%',
          height: '100%',
        fullscreen:true,
        items: obj.items,
        flex:1,
        bbar:bbar,
        renderTo: "topmostdiv"
    }); 
Ext.EventManager.onWindowResize(function(w, h){
    _exteditpanel.doComponentLayout();
});

}




configobj={
layout:"border",
items:[
/*{
    region:"center",
    title:"CCC",
                "items": [
                {
                    "xtype": "propertygrid",
                    id:"pgrid",
                    //"title": "My Property Grid",
                    "source": {
                        "DepthPenalty": true,
                        "MaxDepth":6,
                        "MinDepth":1,
                        "Property 2": true,
                        "Property 3": "2014-01-06T00:37:17",
                        "Timeout": 123
                    },
                     customEditors: {
    "Timeout": Ext.create('Ext.slider.Single',  {
        
        hideLabel: true,
        useTips: false,
        //width: 214,
        value:50,
        increment: 1,
        minValue: 1,
        maxValue: 250
    }),
        description: {
            xtype: 'customeditorfield'  
        }
    },
    //customRenderers: {  "Property 2": function(value) {    return "<input type='checkbox' name='yyy' value="+value+">"  }}
                }
                ,  */
                
{            region:"center",
            xtype: 'tabpanel',
            id: 'EditorTabs',
            layout:"fit",
            fullscreen:true,
            // height:400,
            items: [ /* {
                title: 'info',
                xtype: 'textarea',
                emptyText: "",
                value: "hi",
                id: 'infot',
                listeners: {                }
            }
            , */
            {
            title:"Scratchpad",
            id: "Scratchpad_F",
            xtype: "component",
            autoEl: {
                tag: "iframe",         id: "Scratchpad_Fr",
                src: (eurl == undefined) ? "about:blank" : eurl+"?Scratchpad=1"
            }
        }  ,
            {
            title:"onOpen",
            id: "onOpen_F",
            xtype: "component",
            autoEl: {
                tag: "iframe", id: "onOpen_Fr",
                src: (eurl == undefined) ? "about:blank" : eurl+"?onOpen=1"
            }
        }  ,
            {
            title:"onRefresh",
            id: "onRefresh_F",
            xtype: "component",
            autoEl: {
                tag: "iframe", id: "onRefresh_Fr",
                src: (eurl == undefined) ? "about:blank" : eurl+"?onRefresh=1"
            }
        }
        /*
        ,{
            title:"gfx demo",
            id: "FRAME3",
            xtype: "component",
            autoEl: {
                tag: "iframe",
                src: "http://graph.tk/#y=x^2"
            }
        }
        ,
        {
                title: 'more info',
                xtype: 'textarea',
                value: s_obj.onRefresh,
                id: 'moreinfot',
                listeners: {                }
            }*/
            ]
        }
            ]
  };
  //{   region:"north",    title:"NNN",    split:true,    autosize:true,    items: [{xtype:"textfield",id:"notxt",listeners: {beforeshow: function(t) { t.autoSize(); } }}],    collapsible:true,    titleCollapse:true,    height:60  },
  /*  {    region:"south",
    collapsible:true,
    split:true,
    height:60,
    title:"SSS",
                "items": [
                {
                "xtype": "multislider",
                                    "width": "100%",
                                    id:"southslider",
                                    "fieldLabel": "Randomized - Mutated - Converted",
                                    "values": [
                                        10,
                                        40
                                    ],
                                    listeners: {beforeshow: function(t) { t.center(); } }
                }
            ]
  }, 
  {
    region:"west",
    title:"WWW",
     items: {  // Let's put an empty grid in just to illustrate fit layout
        xtype: 'grid',
        layout:"fit",
        border: false,
        
        columns: [{name:"uno",dataIndex:1,text:"uno"},{name:"due",dataIndex:2,text:"unorr"}],                 // One header just for show. There's no data,
        //store: Ext.create('Ext.data.ArrayStore', {}) // A dummy empty data store
        viewConfig: {
            stripeRows: true,
			forceFit: true
        },
        //store : {data:R2D("A1:B2"),fields: [{name:"uno"},{name:"due"}]}
        store : Ext.create('Ext.data.ArrayStore', {        fields:    [{name:"uno"},{name:"due"}]        ,        data: R2D("A1:B2")    })
    },
    split:true,
    width:200,
    collapsible:true,
    titleCollapse:true
  } , */
  
  /* {    region:"east",    title:"EEE",    width:100,    split:true  , collapsible:true,
  "items": [
                                {
                                    "xtype": "checkboxgroup",
                                    "width": 200,
                                    id:"chex",
                                    columns:1,
                                    //"fieldLabel": "Label",
                                    "items": [
                                        {
                                            "xtype": "checkboxfield",
                                            "boxLabel": "Mutate"
                                        },
                                        {
                                            "xtype": "checkboxfield",
                                            "boxLabel": "Generate"
                                        },
                                        {
                                            "xtype": "checkboxfield",
                                            "boxLabel": "Mate"
                                        },
                                        {
                                            "xtype": "checkboxfield",
                                            "boxLabel": "Display"
                                        }
                                    ]
                                }
                            ]
  } */
  
  

//,

if (origintop===undefined)
displayWin("Script Editor", configobj, bbar);
else 
{
    buildFSUI(configobj);
}


console.log(" loaded edit.js");
//alert("ok");
//Ext.getCmp("funarea").autoSize();





