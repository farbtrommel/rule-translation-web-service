// require is part of bundle file
var DmnViewer = window.DmnJS;
var viewer = null;
/**
 * Default Decision Table
 * @type {string}
 */
var xml = '<?xml version="1.0" encoding="UTF-8"?> <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn11.xsd" id="definitions" name="definitions" namespace="http://camunda.org/schema/1.0/dmn">   <decision id="decision" name="Dish">     <decisionTable id="decisionTable">       <input id="input1" label="Season">         <inputExpression id="inputExpression1" typeRef="string">        <text>input1</text> </inputExpression>       </input>       <input id="InputClause_0hmkumv" label="How many guests">         <inputExpression id="LiteralExpression_0m7s53h" typeRef="integer">        <text>input2</text> </inputExpression>       </input>       <output id="output1" label="Dish" name="output1" typeRef="string" />       <rule id="row-950612891-1">         <inputEntry id="UnaryTests_0c1o054">        <text><![CDATA["Fall"]]></text> </inputEntry>         <inputEntry id="UnaryTests_1lod0sz">        <text><![CDATA[<= 8]]></text> </inputEntry>         <outputEntry id="LiteralExpression_065u3ym">        <text><![CDATA["Spareribs"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-2">         <inputEntry id="UnaryTests_0u1z4ho">        <text><![CDATA["Winter"]]></text> </inputEntry>         <inputEntry id="UnaryTests_1euytqf">        <text><![CDATA[<= 8]]></text> </inputEntry>         <outputEntry id="LiteralExpression_198frve">        <text><![CDATA["Roastbeef"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-3">         <inputEntry id="UnaryTests_1vn9t5c">        <text><![CDATA["Spring"]]></text> </inputEntry>         <inputEntry id="UnaryTests_1bbbmvu">        <text><![CDATA[<= 4]]></text> </inputEntry>         <outputEntry id="LiteralExpression_1bewepn">        <text><![CDATA["Dry Aged Gourmet Steak"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-4">         <description>Save money</description>         <inputEntry id="UnaryTests_0ogofox">        <text><![CDATA["Spring"]]></text> </inputEntry>         <inputEntry id="UnaryTests_0c60gjz">        <text>[5..8]</text> </inputEntry>         <outputEntry id="LiteralExpression_1lahvj7">        <text><![CDATA["Steak"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-5">         <description>Less effort</description>         <inputEntry id="UnaryTests_1774yme">        <text><![CDATA["Fall", "Winter", "Spring"]]></text> </inputEntry>         <inputEntry id="UnaryTests_01rn17i">        <text><![CDATA[> 8]]></text> </inputEntry>         <outputEntry id="LiteralExpression_0jpd7hr">        <text><![CDATA["Stew"]]></text> </outputEntry>       </rule>       <rule id="row-950612891-6">         <description>Hey, why not!?</description>         <inputEntry id="UnaryTests_0ifdx8k">        <text><![CDATA["Summer"]]></text> </inputEntry>         <inputEntry id="UnaryTests_0c8ym7l">        <text></text> </inputEntry>         <outputEntry id="LiteralExpression_08d4mb6">        <text><![CDATA["Light Salad and a nice Steak"]]></text> </outputEntry>       </rule>     </decisionTable>   </decision> </definitions>'; // my DMN xml
//var xml = '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn11.xsd" id="definitions" name="definitions" namespace="http://camunda.org/schema/1.0/dmn"><decision id="decision" name="Discount"><decisionTable id="decisionTable"><input id="input1" label="Customer"><inputExpression id="inputExpression1" typeRef="string">        <text>input1</text></inputExpression></input><input id="InputClause_0hmkumv" label="Order size"><inputExpression id="LiteralExpression_0m7s53h" typeRef="integer">        <text>input2</text></inputExpression></input><output id="output1" label="Discount" name="output1" typeRef="string" /><rule id="row-950612891-1"><inputEntry id="UnaryTests_0c1o054">        <text><![CDATA["Business"]]></text></inputEntry><inputEntry id="UnaryTests_1lod0sz">        <text><![CDATA[<10]]></text></inputEntry><outputEntry id="LiteralExpression_065u3ym">        <text>0.10</text></outputEntry></rule><rule id="row-950612891-2"><inputEntry id="UnaryTests_0u1z4ho">        <text><![CDATA["Business"]]></text></inputEntry><inputEntry id="UnaryTests_1euytqf">        <text><![CDATA[>= 10]]></text></inputEntry><outputEntry id="LiteralExpression_198frve">        <text>0.15</text></outputEntry></rule><rule id="row-950612891-3"><inputEntry id="UnaryTests_1vn9t5c">        <text><![CDATA["Private"]]></text></inputEntry><inputEntry id="UnaryTests_1bbbmvu">        <text>-</text></inputEntry><outputEntry id="LiteralExpression_1bewepn">        <text>0.05</text></outputEntry></rule></decisionTable></decision></definitions>'; // my DMN xml
/**
 * After serialization DMN Model
 */
var dmnXml;
/**
 * After serialization RuleML Model of DMN Model
 */
var ruleMLXml;
/**
 * Show the Panel
 * @see button group decisiontable.ftl
 * @type {string}
 */
var currentExplanationTab = "serialization";
/**
 * Select a DMN Rule, Input Expression or Output Expression what should shown at Site
 * @type {{inputExpression: string, inputExpressionId: string, outputExpression: string, rule: string, inputEntry: string, outputEntry: string}}
 */
var dmnSelector = {
    "inputExpression": null,
    "outputExpression": null,
    "rule": null,
    "inputEntry": null,
    "inputEntryCssId": null,
    "outputEntry": null,
    "outputEntryCssId": null
};

/**
 * After Loading the Page, execute ... :
 */
jQuery(document).ready(function () {
    jQuery("[aria-label=panel-explanation] button").button('loading');

    viewer = new DmnViewer({container: document.getElementById('table-holder')});

    viewer.importXML(xml, function (err) {
        if (err) {
            console.log('error rendering', err);
        } else {
            console.log('rendered');
            updateCodeSample();
            jQuery("[aria-label=panel-explanation] button").button('reset');
        }
    });

    viewer.on('element.click', function (evt) {
        if (evt && evt.element && evt.element.content) {
            handleDmnDecisionTableClick(evt.element.content);
            updateExplanation();
        }
    });

    //Sef Event Handler
    jQuery(".panel-control").click(function (event) {
        currentExplanationTab = event.target.value;
        updateExplanation();
    });

    jQuery('.update-code-sample').click(function () {
        updateCodeSample();
    });

    jQuery(".btn-show-code-sample").click(function (event) {
        toggleCodeView(event.target.value);
    });

    jQuery('#ModalContent').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        var type = button.data('type'); // Extract info from data-* attributes
        var modal = $(this);
        if (type == "dmn") {
            modal.find('.modal-body .prettyprint').text(formatXml(dmnXml[0].documentElement.outerHTML));
        } else {
            modal.find('.modal-body .prettyprint').text(formatXml(ruleMLXml[0].documentElement.outerHTML));
        }
        prettyPrint();
    });
});


function handleDmnDecisionTableClick(bisObj) {
    if (typeof bisObj.$type == "undefined") {
        return;
    }

    if (bisObj.$parent.$type == "dmn:DecisionRule") {
        dmnSelector.rule = bisObj.$parent.id;
    }
    if (bisObj.$type == "dmn:InputClause") {
        dmnSelector.inputExpression = bisObj.id;
    }
    if (bisObj.$type == "dmn:OutputClause") {
        dmnSelector.outputExpression = bisObj.id;
    }
    if (bisObj.$type == "dmn:UnaryTests" || bisObj.$type == "dmn:LiteralExpression") {
        if (dmnXml.find("inputEntry[id=" + bisObj.id + "]").length > 0) {
            dmnSelector.inputEntry = bisObj.id;
            dmnSelector.inputEntryCssId = null;
        } else if (dmnXml.find("outputEntry[id=" + bisObj.id + "]").length > 0) {
            dmnSelector.outputEntry = bisObj.id;
            dmnSelector.outputEntryCssId = null;
        }
    }
    if (bisObj.$type == "dmn:OutputClause") {
        dmnSelector.outputExpression = bisObj.id;
    }

    if (bisObj.$parent.$type == "dmn:InputClause" || bisObj.$parent.$type == "dmn:OutputClause") {
        handleDmnDecisionTableClick(bisObj.$parent);
    }
}

function updateExplanation() {
    jQuery(".pp-prova").text("");
    //Set default
    selectExplanation();
    showDmnSelection();
    fillCode();
}

function showDmnSelection(bisObj) {
    jQuery('.dmn-table .selected').removeClass('selected');

    if (dmnSelector.outputExpression == null) {
        dmnSelector.outputExpression = dmnXml.find('output').first().attr('id');
    }
    if (dmnSelector.inputExpression == null) {
        dmnSelector.inputExpression = dmnXml.find('input').first().attr('id');
    }
    if (dmnSelector.rule == null) {
        dmnSelector.rule = dmnXml.find('rule').first().attr('id');
    }
    if (dmnSelector.inputEntry == null) {
        dmnSelector.inputEntry = dmnXml.find('inputEntry').first().attr('id');
    }
    if (dmnSelector.outputEntry == null) {
        dmnSelector.outputEntry = dmnXml.find('outputEntry').first().attr('id');
    }
    if (dmnSelector.inputEntryCssId == null) {
        var el = dmnXml.find('inputEntry[id=' + dmnSelector.inputEntry + ']').first();
        var ruleId = el.parent().attr('id');
        var elPos = jQuery.inArray(el.attr('id'),
            jQuery.map(dmnXml.find('rule[id=' + ruleId + '] inputEntry'), function (element, index) {
                return element.id
            }));
        dmnSelector.inputEntryCssId = "cell_" + dmnXml.find('input')[elPos].id + "_" + ruleId;
    }
    if (dmnSelector.outputEntryCssId == null) {
        var el = dmnXml.find('outputEntry[id=' + dmnSelector.outputEntry + ']').first();
        var ruleId = el.parent().attr('id');
        var elPos = jQuery.inArray(el.attr('id'),
            jQuery.map(dmnXml.find('rule[id=' + ruleId + '] outputEntry'), function (element, index) {
                return element.id
            }));
        dmnSelector.outputEntryCssId = "cell_" + dmnXml.find('output')[elPos].id + "_" + ruleId;
    }


    if (currentExplanationTab == "input-expression" && dmnSelector.inputExpression != null) {
        jQuery('[data-element-id^=cell_' + dmnSelector.inputExpression + ']').addClass('selected');
    }
    if (currentExplanationTab == "output-expression" && dmnSelector.outputExpression != null) {
        jQuery('[data-element-id^=cell_' + dmnSelector.outputExpression + ']').addClass('selected');
    }

    if (currentExplanationTab == "rule" && dmnSelector.rule != null) {
        jQuery('[data-element-id=' + dmnSelector.rule + "]").addClass('selected');
        jQuery('[data-element-id=' + dmnSelector.rule + "] > *").addClass('selected');
    }

    if (currentExplanationTab == "input-entry" && dmnSelector.rule != null) {
        jQuery('[data-element-id=' + dmnSelector.inputEntryCssId + "]").addClass('selected');
    }
    if (currentExplanationTab == "output-entry" && dmnSelector.rule != null) {
        jQuery('[data-element-id=' + dmnSelector.outputEntryCssId + "]").addClass('selected');
    }
}


function updateCodeSample() {
    dmnSource().then(function (_dmnXml) {
        ruleMLSource(_dmnXml).then(function (_ruleMLXml, statusCode) {
            ruleMLXml = jQuery(_ruleMLXml);

            updateExplanation();
        });
    });
}


function selectExplanation() {
    jQuery(".panel-flow").hide();
    jQuery(".panel-flow").removeClass("active");
    jQuery(".panel-" + currentExplanationTab).show();
    jQuery(".panel-" + currentExplanationTab).addClass("active");
    jQuery(".panel-control").removeClass("btn-primary");
    jQuery(".panel-control[value=" + currentExplanationTab + "]").addClass("btn-primary");
}

function fillCode() {
    jQuery('.pp-dmn-dynamic').removeClass('prettyprinted');

    /* whole file */
    if (currentExplanationTab == "serialization") {
        setCodeToField('.pp-dmn-table', dmnXml);
        setCodeToField('.pp-dmn-ruleml', ruleMLXml, loadProvaSerialization);
    }

    /* Predicate serialization */
    if (currentExplanationTab == "qualified-names") {
        setCodeToField('.pp-dmn-context-predicates',
            ruleMLXml.find('Rel:contains("context")').parent());
        setCodeToField('.pp-dmn-context-predicates',
            ruleMLXml.find('Rel:contains("context")').parent());
    }

    /* Output Expression */
    if (currentExplanationTab == "output-expression") {
        setCodeToField('.pp-dmn-output-expression-signature',
            ruleMLXml.find('Atom[key=outputExpression]').parent());
        setCodeToField('.pp-dmn-output-expression',
            dmnXml.find('output[id=' + dmnSelector.outputExpression + ']').first());
        setCodeToField('.pp-dmn-output-expression-translate',
            ruleMLXml.find('[keyref=outputExpression] Ind:contains(' + dmnSelector.outputExpression + ')').parent().first(),
            loadProvaSerialization
        );
    }

    /* Input Expression */
    if (currentExplanationTab == "input-expression") {
        setCodeToField('.pp-dmn-input-expression-signature',
            ruleMLXml.find('Atom[key=inputExpression]').parent());
        setCodeToField('.pp-dmn-input-expression',
            dmnXml.find('input[id=' + dmnSelector.inputExpression + ']').first());
        setCodeToField('.pp-dmn-input-expression-translate',
            ruleMLXml.find('Rel:contains(inputClause)').parent().find('Ind:contains(' + dmnSelector.inputExpression + ')').first().parent().parent().parent().first(),
            loadProvaSerialization
        );
    }

    /* Rule */
    if (currentExplanationTab == "rule") {
        setCodeToField('.pp-dmn-rule-signature',
            ruleMLXml.find('Atom[key=rule]').parent().first());
        setCodeToField('.pp-dmn-rule',
            dmnXml.find('rule[id=' + dmnSelector.rule + ']').first());
        setCodeToField('.pp-dmn-rule-ruleml',
            ruleMLXml.find('Rulebase oid Ind:contains(' + dmnSelector.rule + ')').parent().parent().first(),
            loadProvaSerialization
        );
    }


    /* Output Entry */
    if (currentExplanationTab == "output-entry") {
        setCodeToField('.pp-dmn-output-entry-signature',
            ruleMLXml.find('Atom[key=outputEntry]').parent());
        setCodeToField('.pp-dmn-output-entry',
            dmnXml.find('outputEntry[id=' + dmnSelector.outputEntry + ']').first());
        setCodeToField('.pp-dmn-output-entry-ruleml',
            ruleMLXml.find('Atom[keyref=outputEntry] Ind:contains(' + dmnSelector.outputEntry + ')').first().parent().parent(),
            loadProvaSerialization);
    }

    /* Input Entry */
    if (currentExplanationTab == "input-entry") {
        setCodeToField('.pp-dmn-input-entry-signature',
            ruleMLXml.find('Atom[key=inputEntry]').parent());
        setCodeToField('.pp-dmn-input-entry',
            dmnXml.find('inputEntry[id=' + dmnSelector.inputEntry + ']').first());
        setCodeToField('.pp-dmn-input-entry-ruleml',
            ruleMLXml.find('Ind:contains(' + dmnSelector.inputEntry + ')').parent().parent().parent(),
            loadProvaSerialization
        );
    }


    jQuery('.pp-dmn').addClass('prettyprint');
    prettyPrint();
}

