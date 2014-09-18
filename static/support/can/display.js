	
	parentwin=window.opener!=null?window.opener:top;	

index2axisobj=function(i){return (defarr.filter(function(x){return (x.index==i)})[0])     }
nam2axisobj=function(i){return (defarr.filter(function(x){return (x.nam==i)})[0])     } // deletable?

	
arrayUnique = function(a) {
    return a.reduce(function(p, c) {
        if (p.indexOf(c) < 0) p.push(c);
        return p;
    }, []);
};

window["vertpanesno"]=0;

function defarr2axes() {
	var ret=[];
	uniques=arrayUnique(defarr.map(function(x){return x.index}));
	for (var ea in uniques) {
			ret.push({index:uniques[ea],nam: defarr.filter(function(y){return (y.index==uniques[ea])}).map(function(x){return x.nam}).join(" ") });
		} // bonus points for redoing this loop with a .map call
	return ret;
	}
 

function indexDef(obj) {
    var top, height;
    var totalitems = arrayUnique(defarr.map(function(x) {return(x.index) })).length;
    var addtlitems = totalitems - 1;
    var addtlh = 45 / addtlitems;
    if (obj.index == 1) {
        top = "0%";
        height=totalitems>1?"50%":"100%";
    }
    else {
        top = (55 + (obj.index - 2) * addtlh) + "%";
        height = (45 / (totalitems - 1)) + "%";
    }
    return ({
        labels: {
            align: 'right',
            x: -3
        },
        title: {
            text: obj.nam
        },
        top: top,
        height: height,
        offset: 0,
        lineWidth: 2
    });
}

function dataDef(obj) {
    var type;
    if (obj.dat[0].length > 4) { // se nam contiene OHLC! oppure se ci sono almeno 5 elementi in obj.dat[0].length
        type = "candlestick"
    }
    else {
        type = "line"
    }
    return ({
        type: type,
        name: obj.nam,
        data: obj.dat,
        yAxis: (obj.index-1)
    });
}

    
    var winarr  = (parentwin != null) ? parentwin.extwindows : top.extwindows; 
    thiswinidx=-1;
    for (ea in winarr) {
        if (winarr[ea]["wref"] == this.window) {
            console.log("ur data arr is:"+winarr[ea])
            datarr = winarr[ea]["datarr"];
            title = winarr[ea]["title"];
            // old code above, new below
            defarr = winarr[ea]["datas"];
            defobj = winarr[ea];
            if (typeof defobj["tamodels"] == "undefined") { defobj["tamodels"] =[]; }
            window.document.title = title;
            thiswinidx = ea; // you should really be using a unique autogenerated id...
            /*
            if (winarr[ea]["datas"]) {
                for (var si in winarr[ea]["datas"]) {
                    console.log("found dataseries:",winarr[ea]["datas"][si]);
                    
                }    
            }*/
            
        }
    } // could use .filter if you were feeling stylish
    
    
    console.log(datarr);
    
    isNumber = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
    
    // next version ... iterate over winarr[ea]["datas"], coount how many different idxs  there r, create axes and series as necessary
    myData=datarr;dctr=0;


/* obj example:

{"PROVA":[{"args":["50","2","2","1"],"targseridx":0,"funname":"_fBBANDS","destinationaxis":1},{"args":["14"],"targseridx":0,"funname":"_fROC","destinationaxis":2},{"args":["14"],"targseridx":0,"funname":"_fATR","destinationaxis":3}]}

*/

 
back2display = function(){document.getElementById("optsdiv").style.display="none"; document.getElementById("container").style.display="block";}

addthis = function(w){
    //console.log(w.name);
    var prefix = (w.name.replace("c_TA_","o_TA_"));
    var funname=(w.name.replace("c_TA_","_f"));
    //console.log("FUNNAME",funname);
    
    var tapars={funname:funname};
    var argarr=[];
    var modelargs=[];
    var modelobj={};
    var targseridx;
    var destinationaxis;
    
    console.log( funname , parentwin[funname].length  );
    var optpars={};
    allinputs=document.querySelectorAll("input");
    for (var ea in allinputs) { // subopt.... 
        if (allinputs[ea].name) {if (allinputs[ea].name.indexOf(w.name.replace("c_","o_") )==0) { 
            console.log ( allinputs[ea].name.replace(prefix,"$optIn") , allinputs[ea].value    ) ;
            tapars[ allinputs[ea].name.replace(prefix,"$optIn") ]= allinputs[ea].value   ;
            } }
    }
    allselects=document.querySelectorAll("select");
    for (var ea in allselects) { // subopt
        if (allselects[ea].name) {if (allselects[ea].name.indexOf(w.name.replace("c_","s_") )==0) { 
            //console.log ( allselects[ea].name , allselects[ea].value    ) 
            //console.log( "which is" , nam2axisobj(allselects[ea].value) )
            //if (allselects[ea].name.indexOf("_toAxis")>-1) {console.log ( "TOAXIS" , allselects[ea].value    );destinationaxis=allselects[ea].value=="own"?(window["vertpanesno"]+1):nam2axisobj(allselects[ea].value).index;  } 
            if (allselects[ea].name.indexOf("_toAxis")>-1) {console.log ( "TOAXIS" , allselects[ea].value    );destinationaxis=allselects[ea].value=="own"?(window["vertpanesno"]+1):Number(allselects[ea].value);  } 
            // TODO : vertpanesno is incorrectly calced
            if (allselects[ea].name.indexOf("_onSeries")>-1) {targseridx=Number(allselects[ea].value); console.log ( "ONseries" , allselects[ea].value ) ; } 
            } }
    }
    
    var fdefarr=pobj[(w.name.replace("c_TA_","o_TA_"))];
    console.log(fdefarr);
    console.log("targseridx:"+targseridx) ;
    console.log(index2axisobj(+Number(targseridx)+Number(1)));
    console.log(index2axisobj(+Number(targseridx)));

    
    var seriesInTarget= index2axisobj(+Number(targseridx)+Number(1)).dat[0].length; // WTF??

    console.log("seriesInTarget:",seriesInTarget);
    
    var outs=0;
    for (var e in fdefarr) {
        if (fdefarr[e].indexOf("$out")==-1) {
            
            if (fdefarr[e].indexOf("$in")==0) {
                if (fdefarr[e]=="$inReal" || fdefarr[e]=="$inClose") {  if (seriesInTarget>=4) { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[4]) } else { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) }  } 
                if (fdefarr[e]=="$inOpen") {  if (seriesInTarget>=4) { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) } else { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) }  }
                if (fdefarr[e]=="$inHigh") {  if (seriesInTarget>=4) { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[2]) } else { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) }  } 
                if (fdefarr[e]=="$inLow") {  if (seriesInTarget>=4) { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[3]) } else { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) }  } 
            }


            if (fdefarr[e].indexOf("$optIn")>-1) {
                argarr.push(tapars[fdefarr[e]]);
                modelargs.push(tapars[fdefarr[e]]);
            }
            
            
        }
        else { if (  (fdefarr[e].indexOf("$outBegIdx")==-1)    &&    (fdefarr[e].indexOf("$outNBElement")==-1)      )  {outs++;  }   }
    }
    
    console.log(argarr);
    modelobj["seriesindex"]=chart1.series.map(function(x){return [x.index,x.name]}).length; // map is useless here
    modelobj["args"]=modelargs;
    modelobj["targseridx"]=targseridx; // +1 maybe
    modelobj["funname"]=funname;
    modelobj["destinationaxis"]=destinationaxis;
    console.log(modelobj);
    console.log(defobj);
    defobj.tamodels.push(modelobj);

    //TEORICAFUNC([xxx].concat(modelargs))

    // --------------------------------
    giornis=parentwin.Transpose(index2axisobj(1).dat)[0];
    //console.log("giornis:",giornis);   
    NEWSERIESDATA=parentwin[funname].apply(this,argarr);
    if (outs == 1) {
        NEWDATAARRAY = parentwin.Transpose([giornis, NEWSERIESDATA]);
        defarr.push({dat:NEWDATAARRAY,nam:funname.replace("_f",""),index:destinationaxis});
        console.log(NEWDATAARRAY);
    }
    else {
        console.log("more than one out, do something");
        console.log(NEWSERIESDATA);
        for (var ee in NEWSERIESDATA) {
            NEWDATAARRAY = parentwin.Transpose([giornis, NEWSERIESDATA[ee]]); 
            defarr.push({dat:NEWDATAARRAY,nam:funname.replace("_f","")+ee,index:destinationaxis});
        }
    
    
        // sticha giornis ad ognuno di essi ed adda ogni risultato come serie nuova sullì index esistente
    }
    remconf();chart1.destroy();createChart();
    //window.location.reload(); // TODO: use addseries

    // --------------------------------
    // NO DEVI CONTROLLARE QUANTI out ci sono , cosi' va bene solo per 1 out.. fai un for each su NEWSERIESDATA
    // sei fortunello solo BBANDS ha piu' di un output...
    // aggiungi NEWDATAARRAY alla chart, o in un nuovo asse o meno ma aggiungilo e poi chiama redraw
    }

function esegui(a,b) {console.log(a.target.textContent);addTA(a.target.textContent);}



function addTA(wha){
    //console.log(wha);alert(taobj[wha]);
    document.getElementById("confdiv").style.display="block";
    document.getElementById("confdiv").innerHTML=taobj[wha];
}

function remconf(){document.getElementById("confdiv").style.display="none";}

function restoreTemplate(w){ //TODO: refactor this so it uses funcs to be shared with addThis()
    //alert(w);
    var model_u = JSON.parse(localStorage.getItem("TAT_ARR"))[w];
    console.log(JSON.parse(localStorage.getItem("TAT_ARR"))[w])
    var model = model_u.sort(function(a,b){return a.seriesindex > b.seriesindex})
    // make sure theyre sorted by seriesindex
    for (var cur in model) {
        console.log(model[cur])
    ////////////
    var fdefarr=pobj[(model[cur].funname.replace("_f","o_TA_"))];
    console.log(fdefarr); 
    
    var seriesInTarget= index2axisobj(+Number(model[cur].targseridx)+Number(1)).dat[0].length;

    console.log("seriesInTarget:",seriesInTarget);
    var argarr=[];
    var targseridx=model[cur].targseridx;
    var outs=0;
    for (var e in fdefarr) {
        if (fdefarr[e].indexOf("$out")==-1) {
            
            if (fdefarr[e].indexOf("$in")==0) {
                if (fdefarr[e]=="$inReal" || fdefarr[e]=="$inClose") {  if (seriesInTarget>=4) { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[4]) } else { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) }  } 
                if (fdefarr[e]=="$inOpen") {  if (seriesInTarget>=4) { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) } else { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) }  }
                if (fdefarr[e]=="$inHigh") {  if (seriesInTarget>=4) { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[2]) } else { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) }  } 
                if (fdefarr[e]=="$inLow") {  if (seriesInTarget>=4) { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[3]) } else { argarr.push(parentwin.Transpose(index2axisobj(targseridx+1).dat)[1]) }  } 
            }
         
        }
        else { if (  (fdefarr[e].indexOf("$outBegIdx")==-1)    &&    (fdefarr[e].indexOf("$outNBElement")==-1)      )  {outs++;  }   }
    }
    argarr=argarr.concat(model[cur].args);

    ///////////////////aggiungi here

    giornis=parentwin.Transpose(index2axisobj(1).dat)[0];
    //console.log("giornis:",giornis);   
    NEWSERIESDATA=parentwin[model[cur].funname].apply(this,argarr);
    if (outs == 1) {
        NEWDATAARRAY = parentwin.Transpose([giornis, NEWSERIESDATA]);
        defarr.push({dat:NEWDATAARRAY,nam:model[cur].funname.replace("_f",""),index:model[cur].destinationaxis});
        console.log(NEWDATAARRAY);
    }
    else {
        console.log("more than one out");
        console.log(NEWSERIESDATA);
        for (var ee in NEWSERIESDATA) {
            NEWDATAARRAY = parentwin.Transpose([giornis, NEWSERIESDATA[ee]]); 
            defarr.push({dat:NEWDATAARRAY,nam:model[cur].funname.replace("_f","")+ee,index:model[cur].destinationaxis});
        }
    //////////
    }
}
remconf();chart1.destroy();createChart();
//window.location.reload(); // TODO: use addseries
}

lsobj2templatemenu = function() {
    try {
        var ret = [];
        var t = JSON.parse(localStorage.getItem("TAT_ARR"));
        for (var e in t) {
            ret.push({
                text: e,
                onclick: function(a) {
                    restoreTemplate(a.target.textContent)
                }
            })
        }
    } catch (e) {}
    return ret;
}

function axes2menu() {
assi=chart1.axes.filter(function(x){return (x.coll=="yAxis" && typeof x.axisTitle == "object")  });
window["vertpanesno"]=arrayUnique(assi.map(function(x){return x.userOptions.index})).length;

//return ( "<option value='own' selected>Own</option>"+  assi.map(function(x){return ("<option value='"+x.axisTitle.textStr+"'>"+x.axisTitle.textStr+"</option>")}).join("")) 
return ( "<option value='own' selected>Own</option>"+  assi.map(function(x){return ("<option value='"+(x.userOptions.index+1)+"'>"+x.axisTitle.textStr+"</option>")}).join("")) 
}

function series2menu() {
return ( chart1.series.map(function(x){return (x.index==0?"<option selected value='0'>"+x.name+"</option>":"<option value='"+x.index+"'>"+x.name+"</option>")}).join("")) 
}


createChart = function(){
cdlinit();

indmenu=
["ADXR", "ADX", "AROONOSC", "ATR", "AVGDEV", "BBANDS",  "CCI", "CMO", "DX", "LINEARREG_ANGLE", "LINEARREG_INTERCEPT", "LINEARREG_SLOPE", "LINEARREG", "MACD",  "MAX", "MIDPOINT", "MIDPRICE", "MIN", "MINUS_DI", "MINUS_DM", "MOM",  "NATR", "PLUS_DI", "PLUS_DM", "ROCP", "ROCR100", "ROCR", "ROC", "RSI",  "STDDEV",  "TRIX", "TSF", "VAR", "WILLR"].map(function(x){return {text:x,onclick:esegui}});
funmenu= ["ADD", "BETA", "CORREL", "DIV", "SUM", "SUB", "MULT"].map(function(x){return {text:x,onclick:esegui}});
avgmenu=["DEMA", "DIV", "DX", "EMA", "KAMA", "SMA", "TEMA", "TRIMA", "WMA", "MA"].map(function(x){return {text:x,onclick:esegui}});
cdlmenu=
["CDL2CROWS", "CDL3BLACKCROWS", "CDL3INSIDE", "CDL3LINESTRIKE", "CDL3OUTSIDE", "CDL3STARSINSOUTH", "CDL3WHITESOLDIERS", "CDLADVANCEBLOCK", "CDLBELTHOLD", "CDLBREAKAWAY", "CDLCLOSINGMARUBOZU", "CDLCONCEALBABYSWALL", "CDLCOUNTERATTACK", "CDLDOJISTAR", "CDLDOJI", "CDLDRAGONFLYDOJI", "CDLENGULFING", "CDLGAPSIDESIDEWHITE", "CDLGRAVESTONEDOJI", "CDLHAMMER", "CDLHANGINGMAN", "CDLHARAMICROSS", "CDLHARAMI", "CDLHIGHWAVE", "CDLHIKKAKEMOD", "CDLHIKKAKE", "CDLHOMINGPIGEON", "CDLIDENTICAL3CROWS", "CDLINNECK", "CDLINVERTEDHAMMER", "CDLKICKINGBYLENGTH", "CDLKICKING", "CDLLADDERBOTTOM", "CDLLONGLEGGEDDOJI", "CDLLONGLINE", "CDLMARUBOZU", "CDLMATCHINGLOW", "CDLMORNINGSTAR", "CDLONNECK", "CDLPIERCING", "CDLRICKSHAWMAN", "CDLRISEFALL3METHODS", "CDLSEPARATINGLINES", "CDLSHOOTINGSTAR", "CDLSHORTLINE", "CDLSPINNINGTOP", "CDLSTALLEDPATTERN", "CDLSTICKSANDWICH", "CDLTAKURI", "CDLTASUKIGAP", "CDLTHRUSTING", "CDLTRISTAR", "CDLUNIQUE3RIVER", "CDLUPSIDEGAP2CROWS", "CDLXSIDEGAP3METHODS"].map(function(x){return {text:x,onclick:esegui}});

chart1=new Highcharts.StockChart( {
    chart: {
        renderTo:'container'
    }
    , navigator : {
        enabled : false 
    }
    , exporting: {
        buttons: {
            
            customButton: {
                // target.outerText o target.textContent
                x: -560, menuItems:[{text:"save current",onclick:function(){
                        //console.log(JSON.stringify(defobj.tamodels));
                        if ( localStorage.getItem("TAT_ARR")==null) {localStorage.setItem("TAT_ARR",JSON.stringify({}));}
                        curarch=JSON.parse(localStorage.getItem("TAT_ARR"));
                        var tname=prompt("name?");
                        curarch[tname]=defobj.tamodels;
                        localStorage.setItem("TAT_ARR",JSON.stringify(curarch));
                    }
                },
                {text:"import template",onclick:function(){alert(prompt("template URL?"))}},
                {text:"export template",onclick:function(){alert(prompt("template URL?"))}},
                {text:"test",onclick:function(a,b){console.log(a);console.log(b);alert("not yet available")}},
                {separator:true },
                {text:"enable navigator",onclick:function(a,b){console.log(a);console.log(b);alert("not yet available")}}
                ].concat(lsobj2templatemenu())
                , symbol:'menu', text:'templates'
            },
            candleButton: {
                x: -300, menuItems:cdlmenu
                , symbol:'menu', text:'patterns'
            },
            moarButton: {
                x: -380, menuItems:indmenu
                , symbol:'menu', text:'indic'
            },
            extrButton: {
                x: -460, menuItems:funmenu.concat(avgmenu)
                , symbol:'menu', text:'avgs & rels'
            }
        }
    },
    rangeSelector: {
        selected: 1
    }
    , series:defarr.map(dataDef)
    , yAxis : defarr2axes().map(indexDef)
}
);

window.amenutxt=axes2menu();window.smenutxt=series2menu();
cdlinit();

}

createChart();





