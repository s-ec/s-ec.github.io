Ext.require([
    'Ext.tip.QuickTipManager',
    'Ext.menu.*',
    'Ext.form.field.ComboBox',
    'Ext.layout.container.Table',
    'Ext.container.ButtonGroup',
	    'Ext.tab.*',
    'Ext.window.*',
    'Ext.tip.*',
    'Ext.layout.container.Border'
]);

Ext.onReady(function(){

    function onSToggle(item, pressed){
        if (!win) {
            win = Ext.create('widget.window', {
                title: 'Layout Window',
                closable: true,
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
        } else {
            win.show(this, function() {
                button.dom.disabled = false;
            });
        }
}


    function onRecalcToggle(item, pressed){
	global_recalc_on = pressed;
	 Ext.example.msg('Button Toggled', 'Button "{0}" was toggled to {1}.', item.text, pressed);
    }

    function onRadioToggle(item, pressed){
	 Ext.example.msg('Button Toggled', 'Button "{0}" was toggled to {1}.', item.text, pressed);
	console.log(item);
    }
    
    // functions to display feedback
    function onButtonClick(btn){
        Ext.example.msg('Button Click','You clicked the "{0}" button.', btn.text);
    }

    function onItemClick(item){
        Ext.example.msg('Menu Click', 'You clicked the "{0}" menu item.', item.text);
    }

    function onItemCheck(item, checked){
        Ext.example.msg('Item Check', 'You {1} the "{0}" menu item.', item.text, checked ? 'checked' : 'unchecked');
    }

    function onItemToggle(item, pressed){
        Ext.example.msg('Button Toggled', 'Button "{0}" was toggled to {1}.', item.text, pressed);
    }
    
    Ext.QuickTips.init();

    var dateMenu = Ext.create('Ext.menu.DatePicker', {
        handler: function(dp, date){
            Ext.example.msg('Date Selected', 'You choose {0}.', Ext.Date.format(date, 'M j, Y'));

        }
    });

    var colorMenu = Ext.create('Ext.menu.ColorPicker', {
        handler: function(cm, color){
            Ext.example.msg('Color Selected', '<span style="color:#' + color + ';">You choose {0}.</span>', color);
        }
    });

    var store = Ext.create('Ext.data.ArrayStore', {
        fields: ['abbr', 'state'],
        data : Ext.example.states
    });

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

    var menu = Ext.create('Ext.menu.Menu', {
        id: 'mainMenu',
        style: {
            overflow: 'visible'     // For the Combo popup
        },
        items: [
            combo,                  // A Field in a Menu
            {
                text: 'I like Ext',
                checked: true,       // when checked has a boolean value, it is assumed to be a CheckItem
                checkHandler: onItemCheck
            }, '-', {
                text: 'Radio Options',
                menu: {        // <-- submenu by nested config object
                    items: [
                        // stick any markup in a menu
                        '<b class="menu-title">Choose a Theme</b>',
                        {
                            text: 'Aero Glass',
                            checked: true,
                            group: 'theme',
                            checkHandler: onItemCheck
                        }, {
                            text: 'Vista Black',
                            checked: false,
                            group: 'theme',
                            checkHandler: onItemCheck
                        }, {
                            text: 'Gray Theme',
                            checked: false,
                            group: 'theme',
                            checkHandler: onItemCheck
                        }, {
                            text: 'Default Theme',
                            checked: false,
                            group: 'theme',
                            checkHandler: onItemCheck
                        }
                    ]
                }
           },{
               text: 'Choose a Date',
               iconCls: 'calendar',
               menu: dateMenu // <-- submenu by reference
           },{
               text: 'Choose a Color',
               menu: colorMenu // <-- submenu by reference
           }
        ]
    });

    var tb = Ext.create('Ext.toolbar.Toolbar');
    tb.render('toolbar');
    tb.suspendLayouts();

    tb.add({
            text:'File',
            iconCls: 'bmenu',  // <-- icon
            menu: menu  // assign menu by instance
        });

tb.add("-",{
        text: 'Edit',  toggleGroup: 'ratings',

		
        enableToggle: true,
        toggleHandler: onRadioToggle,
        pressed: true
    },{
        text: 'Format', toggleGroup: 'ratings',
        enableToggle: true,
        toggleHandler: onRadioToggle,
        pressed: false
    },{
        text: 'Names', toggleGroup: 'ratings',
        enableToggle: true,
        toggleHandler: onRadioToggle,
        pressed: false
    },"-");

tb.add(
 {
            text: 'Share',
            iconCls: 'user',
            menu: {
                xtype: 'menu',
                plain: true,
                items: {
                    xtype: 'buttongroup',
                    title: 'User options',
                    columns: 2,
                    defaults: {
                        xtype: 'button',
                        scale: 'large',
                        iconAlign: 'left'
                    },
                    items: [{
                        text: 'User<br/>manager',
                        iconCls: 'edit',
                        width: 90
                    },{
                        iconCls: 'add',
                        tooltip: 'Add user',
                        width: 40
                    },{
                        colspan: 2,
                        text: 'Import',
                        scale: 'small',
                        width: 130
                    },{
                        colspan: 2,
                        text: 'Who is online?',
                        scale: 'small',
                        width: 130
                    }]
                }
            }
        },
        Ext.create('Ext.button.Split', {
            text: 'View',
            handler: onButtonClick,
            tooltip: {text:'This is a an example QuickTip for a toolbar item', title:'Tip Title'},
            iconCls: 'blist',
            // Menus can be built/referenced by using nested menu config objects
            menu : {
                items: [{
                    text: '<b>Bold</b>', handler: onItemClick
                }, {
                    text: '<i>Italic</i>', handler: onItemClick
                }, {
                    text: '<u>Underline</u>', handler: onItemClick
                }, '-', {
                    text: 'Pick a Color',
                    handler: onItemClick,
                    menu: {
                        showSeparator: false,
                        items: [
                            Ext.create('Ext.ColorPalette', {
                                listeners: {
                                    select: function(cp, color){
                                        Ext.example.msg('Color Selected', 'You chose {0}.', color);
                                    }
                                }
                            }), '-',
                            {
                                text: 'More Colors...',
                                handler: onItemClick
                            }
                        ]
                    }
                }, {
                    text: 'Extellent!',
                    handler: onItemClick
                }]
            }
        }));

    menu.add(' ');

    // Menus have a rich api for
    // adding and removing elements dynamically
    var item = menu.add({
        text: 'Dynamically added Item'
    });
    // items support full Observable API
    item.on('click', onItemClick);

    // items can easily be looked up
    menu.add({
        text: 'Disabled Item',
        id: 'disableMe'  // <-- Items can also have an id for easy lookup
        // disabled: true   <-- allowed but for sake of example we use long way below
    });
    // access items by id or index
    menu.items.get('disableMe').disable();

    // They can also be referenced by id in or components
    tb.add('-', {
        icon: 'list-items.gif', // icons can also be specified inline
		text: 'not really',
        cls: 'x-btn-icon',
        tooltip: '<b>Quick Tips</b><br/>Icon only button with tooltip<br><b>Activated on mousedown</b>',
        clickEvent: 'mousedown',
        handler: function(){
            Ext.example.msg('Button Click','You clicked the "icon only" button.');
        }
    }, '-');

	
	
    var scrollMenu = Ext.create('Ext.menu.Menu');
    for (var i = 0; i < 50; ++i){
        scrollMenu.add({
            text: 'Sheet' + (i + 1),
            handler: onItemClick
        });
    }
    // scrollable menu
    tb.add({
        icon: 'preview.png',
        cls: 'x-btn-text-icon',
        text: 'Other Sheets',
        menu: scrollMenu
    });
	
		    tb.add("-",{
        text: 'Show Window',
        enableToggle: true,
		id:"winSHOW",
		        toggleHandler: onSToggle,
        pressed: false
    },"-");

    tb.add({
        text: 'Help',
        url: '/help',
        baseParams: {
            q: 'there+is+no+help'
        },
        tooltip: 'Click here for help.'
    });

    // add a combobox to the toolbar
    combo = Ext.create('Ext.form.field.ComboBox', {
        hideLabel: true,
        store: store,
        displayField: 'state',
        typeAhead: true,
        queryMode: 'local',
        triggerAction: 'all',
        emptyText:'Update frequency',
        selectOnFocus:true,
        width:135
    });
    tb.add("-",combo);




	
	    tb.add("-",{
        text: 'Auto Recalc',
        enableToggle: true,
        toggleHandler: onRecalcToggle,
        pressed: false
    },"-", {
        icon: 'list-items.gif', // icons can also be specified inline
		text: 'Recalc Now',
        cls: 'x-btn-icon',
        tooltip: '<b>Click here to recalc immediately</b>',
        clickEvent: 'mousedown',
        handler: function(){
            Ext.example.msg('Recalculating...','Complex sheets may require more time.');
			spreadsheet.ExecuteCommand('recalc', '');
        }
    }, '-');
		
    tb.resumeLayouts(true);
	
	
	////
	
	    var win,
        button = Ext.get('show-btn');
		//button = Ext.get('winSHOW-btnEl');

    button.on('click', function(){

        if (!win) {
            win = Ext.create('widget.window', {
                title: 'Layout Window',
                closable: true,
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
        } else {
            win.show(this, function() {
                button.dom.disabled = false;
            });
        }
    });

	
	///
	
}); // end of onready
