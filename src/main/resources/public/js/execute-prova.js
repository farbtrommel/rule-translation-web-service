// require is part of bundle file
var DmnViewer = window.DmnJS;
var viewer = null;
/**
 * Array of example from decision tables.
 * @type {string[]}
 */
var xml = ['<?xml version="1.0" encoding="UTF-8"?> <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn11.xsd" id="definitions" name="definitions" namespace="http://camunda.org/schema/1.0/dmn">   <decision id="decision" name="Dish">     <decisionTable id="decisionTable">       <input id="input1" label="Season">         <inputExpression id="inputExpression1" typeRef="string">        <text>input1</text> </inputExpression>       </input>       <input id="InputClause_0hmkumv" label="How many guests">         <inputExpression id="LiteralExpression_0m7s53h" typeRef="integer">        <text>input2</text> </inputExpression>       </input>       <output id="output1" label="Dish" name="output1" typeRef="string" />       <rule id="row-950612891-1">         <inputEntry id="UnaryTests_0c1o054">        <text><![CDATA["Fall"]]></text> </inputEntry>         <inputEntry id="UnaryTests_1lod0sz">        <text><![CDATA[<= 8]]></text> </inputEntry>         <outputEntry id="LiteralExpression_065u3ym">        <text><![CDATA["Spareribs"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-2">         <inputEntry id="UnaryTests_0u1z4ho">        <text><![CDATA["Winter"]]></text> </inputEntry>         <inputEntry id="UnaryTests_1euytqf">        <text><![CDATA[<= 8]]></text> </inputEntry>         <outputEntry id="LiteralExpression_198frve">        <text><![CDATA["Roastbeef"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-3">         <inputEntry id="UnaryTests_1vn9t5c">        <text><![CDATA["Spring"]]></text> </inputEntry>         <inputEntry id="UnaryTests_1bbbmvu">        <text><![CDATA[<= 4]]></text> </inputEntry>         <outputEntry id="LiteralExpression_1bewepn">        <text><![CDATA["Dry Aged Gourmet Steak"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-4">         <description>Save money</description>         <inputEntry id="UnaryTests_0ogofox">        <text><![CDATA["Spring"]]></text> </inputEntry>         <inputEntry id="UnaryTests_0c60gjz">        <text>[5..8]</text> </inputEntry>         <outputEntry id="LiteralExpression_1lahvj7">        <text><![CDATA["Steak"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-5">         <description>Less effort</description>         <inputEntry id="UnaryTests_1774yme">        <text><![CDATA["Fall", "Winter", "Spring"]]></text> </inputEntry>         <inputEntry id="UnaryTests_01rn17i">        <text><![CDATA[> 8]]></text> </inputEntry>         <outputEntry id="LiteralExpression_0jpd7hr">        <text><![CDATA["Stew"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-6">         <description>Hey, why not!?</description>         <inputEntry id="UnaryTests_0ifdx8k">        <text><![CDATA["Summer"]]></text> </inputEntry>         <inputEntry id="UnaryTests_0c8ym7l">        <text></text> </inputEntry>         <outputEntry id="LiteralExpression_08d4mb6">        <text><![CDATA["Light Salad and a nice Steak"]]></text> </outputEntry>       </rule>     </decisionTable>   </decision> </definitions>',
     '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn11.xsd" id="definitions" name="definitions" namespace="http://camunda.org/schema/1.0/dmn"><decision id="decisionTable" name="DiscountTable"><decisionTable id="decisionTableDefinition"><input id="input1" label="Customer"><inputExpression id="inputExpression1" typeRef="string">        <text>Customer</text></inputExpression></input><input id="InputClause_0hmkumv" label="Order size"><inputExpression id="LiteralExpression_0m7s53h" typeRef="integer">        <text>Order size</text></inputExpression></input><output id="output1" label="Discount" name="output1" typeRef="string" /><rule id="row-950612891-1"><inputEntry id="UnaryTests_0c1o054">        <text><![CDATA["Business"]]></text></inputEntry><inputEntry id="UnaryTests_1lod0sz">        <text><![CDATA[<10]]></text></inputEntry><outputEntry id="LiteralExpression_065u3ym">        <text>0.10</text></outputEntry></rule><rule id="row-950612891-2"><inputEntry id="UnaryTests_0u1z4ho">        <text><![CDATA["Business"]]></text></inputEntry><inputEntry id="UnaryTests_1euytqf">        <text><![CDATA[>= 10]]></text></inputEntry><outputEntry id="LiteralExpression_198frve">        <text>0.15</text></outputEntry></rule><rule id="row-950612891-3"><inputEntry id="UnaryTests_1vn9t5c">        <text><![CDATA["Private"]]></text></inputEntry><inputEntry id="UnaryTests_1bbbmvu">        <text>-</text></inputEntry><outputEntry id="LiteralExpression_1bewepn">        <text>0.05</text></outputEntry></rule></decisionTable></decision></definitions>',
     '<?xml version="1.0" encoding="UTF-8"?> <definitions  xmlns="http://www.omg.org/spec/DMN/20151101/dmn11.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:feel="http://www.omg.org/spec/FEEL/20140401" name="DMChallenge" namespace="methodandstyle/dmchallenge" xsi:schemaLocation="http://www.omg.org/spec/DMN/20151101/dmn.xsd dmn.xsd" exporter="methodandstyle" exporterVersion="1.0"> <inputData name="Age" id="i_Age"> <variable name="Age" typeRef="feel:number"/> </inputData> <inputData name="YearsOfService" id="i_YearsOfService"> <variable name="YearsOfService" typeRef="feel:number"/> </inputData> <decision name="VacationDays" id="d_VacationDays"> <variable name="VacationDays" typeRef="feel:number"/> <informationRequirement> <requiredInput href="#i_Age"/> </informationRequirement> <informationRequirement> <requiredInput href="#i_YearsOfService"/> </informationRequirement> <decisionTable> <input> <inputExpression> <text><![CDATA[Age]]></text> </inputExpression> </input> <input> <inputExpression> <text><![CDATA[YearsOfService]]></text> </inputExpression> </input> <output name="VacationDays"/> <rule> <inputEntry> <text><![CDATA[<18]]></text> </inputEntry> <inputEntry> <text><![CDATA[-]]></text> </inputEntry> <outputEntry> <text><![CDATA[22+5]]></text> </outputEntry> </rule> <rule> <inputEntry> <text><![CDATA[[18..45)]]></text> </inputEntry> <inputEntry> <text><![CDATA[<15]]></text> </inputEntry> <outputEntry> <text><![CDATA[22]]></text> </outputEntry> </rule> <rule> <inputEntry> <text><![CDATA[[18..45)]]></text> </inputEntry> <inputEntry> <text><![CDATA[[15..30)]]></text> </inputEntry> <outputEntry> <text><![CDATA[22+2]]></text> </outputEntry> </rule> <rule> <inputEntry> <text><![CDATA[[18..45)]]></text> </inputEntry> <inputEntry> <text><![CDATA[>=30]]></text> </inputEntry> <outputEntry> <text><![CDATA[22+5+3]]></text> </outputEntry> </rule> <rule> <inputEntry> <text><![CDATA[[45..60)]]></text> </inputEntry> <inputEntry> <text><![CDATA[<30]]></text> </inputEntry> <outputEntry> <text><![CDATA[22+2]]></text> </outputEntry> </rule> <rule> <inputEntry> <text><![CDATA[[45..60)]]></text> </inputEntry> <inputEntry> <text><![CDATA[>=30]]></text> </inputEntry> <outputEntry> <text><![CDATA[22+5+3]]></text> </outputEntry> </rule> <rule> <inputEntry> <text><![CDATA[>=60]]></text> </inputEntry> <inputEntry> <text><![CDATA[-]]></text> </inputEntry> <outputEntry> <text><![CDATA[22+5+3]]></text> </outputEntry> </rule> </decisionTable> </decision> </definitions>'];
/**
 * Choose as default decision table.
 */
var defaultSample = 2;
/**
 * After serialization DMN Model
 */
var dmnXml;
/**
 * After serialization RuleML Model of DMN Model
 */
var ruleMLXml;
/**
 * Default Input Values
 * */
var defaultValues = {
    "Customer": "\"Business\"",
    "Order size": "5",
    "Age": "29",
    "YearsOfService": 30,
    "input1": "\"Fall\"",
    "input2": 10
};
/**
 * Table with all variables to set.
 */
var boxedInvocation = jQuery("#boxed-invocation table tbody");
/**
 * After Loading the Page, execute ... :
 */
jQuery(document).ready(function () {
    viewer = new DmnViewer({container: document.getElementById('table-holder')});

    loadExample(defaultSample);

    jQuery(".panel-example").click(function(event) {
        loadExample(event.target.value);
    });

    jQuery(".update-code-sample").click(function () {
        jQuery(".prova-code").hide();
        boxInvocationSerialization();
        updateCodeSample();
    });
    jQuery(".run-code-sample").click(function () {
        jQuery(".prova-code").hide();
        executeProva();
    });

    jQuery(".show-code-sample").click(function () {
        jQuery(".prova-code").show();
        jQuery(".msg").html('');
        runProva("file/", "text/plain").then(function (result) {
            jQuery(".run-code-sample-result").text(result);
        }).fail(function (error) {
            if (error.status == 200) {
                jQuery(".run-code-sample-result").text(error.responseText);
            } else {
                jQuery(".run-code-sample-result").text(JSON.stringify(error, null, 2));
            }
        });
    });

});
function loadExample(id) {
    jQuery(".panel-example").removeClass("active");
    jQuery(".panel-example[value=" + id + "]").addClass("active");
    viewer.importXML(xml[id], function (err) {
        if (err) {
            //console.log('error rendering', err);
        } else {
            //console.log('rendered');
            updateCodeSample(function () {
                jQuery('#boxed-invocation .tjs-table-id.mappings').text(dmnXml.find('decision').attr('id'));
                executeProva();
            });
        }
    });
}
function executeProva() {
    jQuery('.msg').html('');
    clearDecisionTable();
    runProva().then(function (jsonResult) {
        jQuery(".run-code-sample-result").text(JSON.stringify(jsonResult, null, 2));
        showTrueEvaluatedCells(jsonResult.result);
    }).fail(function (error) {
        alert("<strong>Service Error:</strong><br/><pre>" + JSON.stringify(error, null, 2) + "</pre>", "danger");
        jQuery(".run-code-sample-result").text("");
    });
}

function updateCodeSample(callback) {
    clearDecisionTable();
    boxedInvocation.html("");
    //save values of variables
    boxInvocationSerialization();
    dmnSource().then(function (_dmnXml) {
        ruleMLSource(_dmnXml).then(function (_ruleMLXml, statusCode) {
            ruleMLXml = jQuery(_ruleMLXml);

            updateExplanation(callback);
        });
    });
}

function rowTemplate(varName) {
    var value = "";
    if (defaultValues[varName] != null) {
        value = defaultValues[varName];
    }
    return '<tr><td>' + varName + '</td><td contenteditable="true">' + value + '</td></tr>';
}

function boxInvocationSerialization() {
    return boxedInvocation.find("tr").map(function (index, element) {
        var el = jQuery(element).find("td");
        defaultValues[el.eq(0).text()] = el.eq(1).text();
        return {key: el.eq(0).text(), value: el.eq(1).text()};
    });
}

function runProva(mode, type) {
    var dfd = jQuery.Deferred();
    dmnSource().then(function (dataDmnXml) {
        if (typeof mode == "undefined") {
            mode = "";
        }
        if (typeof type == "undefined") {
            type = "application/json";
        }
        jQuery.ajax({
            type: "POST",
            url: "api/execute/" + mode,
            processData: false,
            contentType: type,
            dataType: "json",
            data: JSON.stringify({
                parameters: boxInvocationSerialization().toArray(),
                language: "dmn",
                source: prepareDMN(dataDmnXml)
            })
        }).then(function (result) {
            dfd.resolve(result);
        }).fail(function (error) {
            dfd.reject(error);
        });
    }).fail(function (error) {
        dfd.reject("Couldn't serialize decision table.", "danger");
    });

    return dfd.promise();
}

function updateExplanation(callback) {
    ruleMLXml.find("Rel:contains(context)").parent().find("Ind").map(function (index, element) {
        boxedInvocation.append(rowTemplate(element.innerHTML));
    });
    if (typeof callback != "undefined") {
        callback();
    }
}

function clearDecisionTable() {
    jQuery(".dmn-table .selected").removeClass("selected");
    jQuery(".dmn-table .elected").removeClass("elected");
}

function showTrueEvaluatedCells(result) {
    clearDecisionTable();
    executeDecisionTable(result).then(function (result) {
        showDecisionTableResults(result);
    }).fail(function (error, color) {
        alert(error, color);
    });
    var i, nv, id, ruleId;
    try {
        var outputEntry = result[1];
        var outputCol = jQuery('.dmn-table thead').eq(1).find('.mappings .output span').map(function (el, val) {
            return val.innerHTML;
        });
        for (i = 0; i < outputEntry.length; i++) {
            nv = outputEntry[i];
            //ruleId = rowToRuleId(nv.Row.object);
            //jQuery("[data-element-id^=cell_" + nv.Name.object + "_" + ruleId + "]").addClass("selected");
            jQuery('.dmn-table tbody').eq(1).children()
                .eq(nv.Row.object).find('.output').eq(jQuery.inArray(nv.Name.object, outputCol)).addClass("selected");
        }
    } catch (e) {

    }

    try {
        var inputEntry = result[2];
        for (i = 0; i < inputEntry.length; i++) {
            nv = inputEntry[i];
            //id = cellToId(nv.Column.object, nv.Row.object);
            //jQuery("[data-element-id=" + id + "]").addClass("selected");
            jQuery('.dmn-table tbody').eq(1).children()
                .eq(nv.Row.object).children()
                .eq(parseInt(nv.Column.object) + 1).addClass("selected");
        }
    } catch (e) {

    }

    try {
        var decision = result[0];
        for (i = 0; i < decision.length; i++) {
            nv = decision[i];
            for (var s = 0; s < nv.Entries.fixed.length; s++) {
                ruleId = rowToRuleId(nv.Entries.fixed[s].fixed[3].object);
                jQuery("[data-element-id=cell_" + nv.Key.object + "_" + ruleId + "]").addClass("elected");
            }
        }
    } catch (e) {

    }

}


function cellToId(col, row) {
    return "cell_" + columnNoToId(col) + "_" + rowToRuleId(row);
}

function columnNoToId(col) {
    return ruleMLXml.find("Implies > [keyref=inputExpression]").map(function (index, element) {
        var el = jQuery(element);
        if (el.find("Ind")[1].innerHTML == col) {
            return el.parent().find("Meta Atom Ind").first().text();
        }
    })[0];

}

function rowToRuleId(row) {
    return ruleMLXml.find("Implies > Atom[keyref=inputEntry]").map(function (index, element) {
        var el = jQuery(element).find("Ind");
        if (el[2].innerHTML == row) {
            return el.parent().parent().parent().find("Oid Ind").text();
        }
    })[0];
}
function alert(msg, type) {
    if (typeof type == "undefined") {
        type = "warning";
    }
    jQuery('.msg').append('<div class="alert alert-' + type + ' alert-dismissible" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
        msg +
        '</div>');
}
/**
 * Execute decision table with respect to hit policy.
 * @param data
 */
function executeDecisionTable(data) {
    var dfd = jQuery.Deferred();

    var result = {}, i, rule;
    dmnXml.find("output").map(function (index, value) {
        result[jQuery(value).attr('name')] = null;
    });
    var hitPolicy = dmnXml.find('decisionTable').first().attr('hitPolicy');
    if (hitPolicy == null) {
        hitPolicy = "UNIQUE";
    }
    var aggregation = dmnXml.find('decisionTable').first().attr('aggregation');

    var outputEntries = data[1];

    if (outputEntries.length == 0) {
        dfd.reject("The is no valid rule.", "warning");
    }

    if (hitPolicy == "UNIQUE") {
        //check invariant: only one valid rule should contain the decision table
        //Therefore, each Row number should be the same, otherwise error occurred.
        rule = null;
        for (i = 0; i < outputEntries.length; i++) {
            if (rule == null) {
                rule = outputEntries[i].Row.object;
            } else if (rule != outputEntries[i].Row.object) {
                dfd.reject("Hit policy \"Unique\" allows only one valid rule for decision table.", "danger");
                break;
            }
            result[outputEntries[i].Name.object] = outputEntries[i].Value.object;
        }
    } else if (hitPolicy == "FIRST") {
        //choose rule with lowest row number
        rule = null;
        for (i = 0; i < outputEntries.length; i++) {
            if (rule == null) {
                rule = outputEntries[i].Row.object;
            } else {
                rule = Math.min(outputEntries[i].Row.object, rule);
            }
        }

        for (i = 0; i < outputEntries.length; i++) {
            if (rule == outputEntries[i].Row.object) {
                result[outputEntries[i].Name.object] = outputEntries[i].Value.object;
            }
        }
    } else if (hitPolicy == "RULE ORDER") {
        outputEntries.sort(function (a, b) {
            if (a.Row.object > b.Row.object) {
                return 1;
            }
            if (a.Row.object < b.Row.object) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });

        for (i = 0; i < outputEntries.length; i++) {
            if (result[outputEntries[i].Name.object] == null) {
                result[outputEntries[i].Name.object] = [];
            }
            result[outputEntries[i].Name.object].push(outputEntries[i].Value.object);
        }
    } else if (hitPolicy == "COLLECT" || hitPolicy == "ANY") {
        for (i = 0; i < outputEntries.length; i++) {
            if (aggregation == null || aggregation == "LIST") {
                if (result[outputEntries[i].Name.object] == null) {
                    result[outputEntries[i].Name.object] = [];
                }
                result[outputEntries[i].Name.object].push(outputEntries[i].Value.object);
            } else if (aggregation == "SUM") {
                result[outputEntries[i].Name.object] = setValue(result[outputEntries[i].Name.object], outputEntries[i].Value.object, function (obj, value) {
                    return obj + value;
                });
            } else if (aggregation == "MIN") {
                result[outputEntries[i].Name.object] = setValue(result[outputEntries[i].Name.object], outputEntries[i].Value.object, function (obj, value) {
                    return Math.min(obj, value);
                });
            } else if (aggregation == "MAX") {
                result[outputEntries[i].Name.object] = setValue(result[outputEntries[i].Name.object], outputEntries[i].Value.object, function (obj, value) {
                    return Math.max(obj, value);
                });
            } else if (aggregation == "COUNT") {
                result[outputEntries[i].Name.object] = setValue(result[outputEntries[i].Name.object], 1, function (obj, value) {
                    return obj + value;
                });
            }
        }
    } else {
        dfd.reject("Hit policy " + hitPolicy + " isn't available.", "danger");
    }
    dfd.resolve(result);
    return dfd.promise();
}

function showDecisionTableResults(result) {
    var html = "<strong>Execution results:</strong><ul>";
    for (var key in result) {
        html += "<li>";
        html += key + ": ";
        if (typeof result[key] == "object") {
            html += result[key].join(", ");
        } else {
            html += result[key];
        }
        html += "</li>";
    }
    html += "</ul>";
    alert(html, "success");
}

function setValue(obj, value, applyFunction) {
    if (obj == null) {
        return value;
    } else {
        return applyFunction(obj, value);
    }

}